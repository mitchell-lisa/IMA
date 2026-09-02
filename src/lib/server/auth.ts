import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "./env";
import { hmacSign, hmacVerify } from "./crypto";
import { getRepository } from "./repo";

export const PRODUCER_COOKIE = "mr_producer";

export interface ProducerSession {
  email: string;
  method: "supabase" | "passcode";
}

function secret(): string {
  return env.sessionSecret ?? "dev-only-secret-change-me";
}

function emailAllowed(email: string): boolean {
  if (env.producerAllowedDomains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && env.producerAllowedDomains.includes(domain);
}

/** Signed cookie value for the passcode fallback: `<email>.<hmac>` */
function signPasscodeSession(email: string): string {
  const payload = Buffer.from(email).toString("base64url");
  return `${payload}.${hmacSign(payload, secret())}`;
}

function verifyPasscodeSession(value: string | undefined): ProducerSession | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  if (!hmacVerify(payload, sig, secret())) return null;
  const email = Buffer.from(payload, "base64url").toString("utf8");
  return { email, method: "passcode" };
}

/**
 * Returns the current producer session or null. Supabase Auth (magic link)
 * plus active membership in public.producers is the production path; a
 * signed passcode cookie is available only when PRODUCER_DEV_PASSCODE is
 * set (local development and demos).
 */
export async function getProducerSession(): Promise<ProducerSession | null> {
  const store = await cookies();

  if (env.hasSupabaseAuth) {
    const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      cookies: {
        getAll: () => store.getAll(),
        setAll: () => {
          /* read-only in server components; refresh handled in route handlers */
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    // Domain allowlist is a coarse filter; membership in public.producers
    // (is_active) is the actual authorization, because producer pages read
    // through the service-role repository where RLS does not apply.
    if (data.user && email && emailAllowed(email)) {
      const member = await getRepository().isActiveProducer({ id: data.user.id, email });
      if (member) return { email, method: "supabase" };
    }
  }

  const passcodeSession = verifyPasscodeSession(store.get(PRODUCER_COOKIE)?.value);
  if (passcodeSession && env.producerDevPasscode) return passcodeSession;
  return null;
}

export async function requireProducer(): Promise<ProducerSession> {
  const session = await getProducerSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Validates the dev passcode and returns a cookie value to set, or null. */
export function passcodeLogin(email: string, passcode: string): string | null {
  if (!env.producerDevPasscode) return null;
  if (passcode !== env.producerDevPasscode) return null;
  if (!emailAllowed(email)) return null;
  return signPasscodeSession(email);
}

export function producerAuthMode(): "supabase" | "passcode" | "none" {
  if (env.hasSupabaseAuth) return "supabase";
  if (env.producerDevPasscode) return "passcode";
  return "none";
}
