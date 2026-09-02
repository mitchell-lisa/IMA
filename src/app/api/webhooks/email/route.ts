import { NextResponse } from "next/server";
import { applyEmailEvent } from "@/lib/server/dal";
import { env } from "@/lib/server/env";
import { handleError, jsonError } from "@/lib/server/http";
import { emailWebhookSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

/**
 * Inbound email-provider events (delivered, bounced, complained). Protected
 * by a shared secret in the URL query (?secret=) or header, which is how
 * most providers support authenticating webhooks without a full signing
 * integration. Swap for provider signature verification when finalized.
 */
export async function POST(req: Request) {
  try {
    if (!env.emailWebhookSecret) return jsonError(503, "Email webhook secret not configured");
    const url = new URL(req.url);
    const provided = url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret");
    if (provided !== env.emailWebhookSecret) return jsonError(401, "Unauthorized");
    const input = emailWebhookSchema.parse(await req.json());
    const to = Array.isArray(input.data?.to) ? input.data?.to[0] : input.data?.to;
    await applyEmailEvent(input.type, to);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
