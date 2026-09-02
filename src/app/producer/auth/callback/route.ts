import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

/** Supabase magic-link callback: exchanges the code for a session cookie. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code || !env.hasSupabaseAuth) return NextResponse.redirect(`${env.appUrl}/producer/login`);
  const store = await cookies();
  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${env.appUrl}/producer/login?error=${encodeURIComponent(error.message)}`);
  return NextResponse.redirect(`${env.appUrl}/producer`);
}
