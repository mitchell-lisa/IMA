import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PRODUCER_COOKIE, passcodeLogin, producerAuthMode } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { handleError, jsonError, limited, parseBody } from "@/lib/server/http";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email(),
  passcode: z.string().max(200).optional(),
});

/**
 * Producer sign-in.
 *  - Supabase configured: sends a magic link to the email (domain-allowlisted).
 *  - Otherwise: validates the dev passcode and sets a signed cookie.
 */
export async function POST(req: Request) {
  const block = limited(req, "producer.auth", 10, 15 * 60 * 1000);
  if (block) return block;
  try {
    const input = await parseBody(req, loginSchema);
    const mode = producerAuthMode();

    if (mode === "supabase") {
      const domain = input.email.split("@")[1]?.toLowerCase();
      if (env.producerAllowedDomains.length && (!domain || !env.producerAllowedDomains.includes(domain))) {
        return jsonError(403, "That email domain is not authorized for the producer dashboard.");
      }
      const store = await cookies();
      const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
        cookies: {
          getAll: () => store.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
        },
      });
      const { error } = await supabase.auth.signInWithOtp({
        email: input.email,
        options: { emailRedirectTo: `${env.appUrl}/producer/auth/callback` },
      });
      if (error) return jsonError(400, error.message);
      return NextResponse.json({ ok: true, mode, message: "Check your email for a sign-in link." });
    }

    if (mode === "passcode") {
      const cookieValue = passcodeLogin(input.email, input.passcode ?? "");
      if (!cookieValue) return jsonError(401, "Invalid email or passcode.");
      const res = NextResponse.json({ ok: true, mode, redirect: "/producer" });
      res.cookies.set(PRODUCER_COOKIE, cookieValue, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        maxAge: 60 * 60 * 12,
        path: "/",
      });
      return res;
    }

    return jsonError(503, "Producer sign-in is not configured. Set Supabase Auth or PRODUCER_DEV_PASSCODE.");
  } catch (err) {
    return handleError(err);
  }
}

/** Sign out (clears both cookie types). */
export async function DELETE() {
  const store = await cookies();
  if (env.hasSupabaseAuth) {
    const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
      },
    });
    await supabase.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PRODUCER_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
