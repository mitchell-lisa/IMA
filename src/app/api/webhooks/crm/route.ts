import { NextResponse } from "next/server";
import { hmacVerify } from "@/lib/server/crypto";
import { applyCrmUpdate } from "@/lib/server/dal";
import { env } from "@/lib/server/env";
import { handleError, jsonError } from "@/lib/server/http";
import { crmWebhookSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

/**
 * Inbound CRM webhook. The CRM (or an integration layer) can push
 * disposition / owner / external-id updates back. Requests must be signed
 * with CRM_WEBHOOK_SECRET (HMAC-SHA256 of the raw body).
 */
export async function POST(req: Request) {
  try {
    if (!env.crmWebhookSecret) return jsonError(503, "CRM webhook secret not configured");
    const raw = await req.text();
    if (!hmacVerify(raw, req.headers.get("x-marketready-signature"), env.crmWebhookSecret)) {
      return jsonError(401, "Invalid signature");
    }
    const input = crmWebhookSchema.parse(JSON.parse(raw));
    if (input.event === "ping") return NextResponse.json({ ok: true });
    const applied = await applyCrmUpdate(input);
    return NextResponse.json({ ok: applied });
  } catch (err) {
    return handleError(err);
  }
}
