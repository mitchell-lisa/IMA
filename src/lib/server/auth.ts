import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "./env";
import { hmacSign, hmacVerify } from "./crypto";

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
 * is preferred; a signed passcode cookie is available for local development
 * and is refused in production unless explicitly configured.
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
    if (email && emailAllowed(email)) return { email, method: "supabase" };
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
