import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { getRepository } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deployment health. Reports configuration state without exposing secrets:
 * which storage backend is active and whether the schema has been migrated.
 */
export async function GET() {
  const storage = env.hasSupabase ? "supabase" : "memory";
  let schemaReady: boolean | null = null;
  let error: string | null = null;
  try {
    const repo = getRepository();
    // A cheap read that fails until the migration has created the tables.
    await repo.listLeads({ limit: 1 });
    schemaReady = true;
  } catch (err) {
    schemaReady = false;
    error = err instanceof Error ? err.message.replace(/key=[^&\s]+/gi, "key=***") : "unknown";
  }
  return NextResponse.json(
    {
      ok: storage === "supabase" && schemaReady === true,
      storage,
      schemaReady,
      auth: env.hasSupabaseAuth ? "supabase" : env.producerDevPasscode ? "passcode" : "none",
      appUrl: env.appUrl,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? env.nodeEnv,
      error,
    },
    { status: storage === "supabase" && schemaReady ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
