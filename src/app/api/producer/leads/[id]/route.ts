import { NextResponse } from "next/server";
import { requireProducer } from "@/lib/server/auth";
import { retryCrmSync, updateLeadReview } from "@/lib/server/dal";
import { handleError, parseBody } from "@/lib/server/http";
import { leadUpdateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

/** Update disposition / owner / review notes. Producer auth required. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireProducer();
    const { id } = await ctx.params;
    const patch = await parseBody(req, leadUpdateSchema);
    const lead = await updateLeadReview(id, patch, session.email);
    return NextResponse.json({ ok: true, disposition: lead.disposition, followUpOwner: lead.followUpOwner, licensedReviewCompleted: lead.licensedReviewCompleted });
  } catch (err) {
    return handleError(err);
  }
}

/** Re-send the CRM payload for a lead. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireProducer();
    const { id } = await ctx.params;
    const status = await retryCrmSync(id);
    return NextResponse.json({ ok: true, crmSyncStatus: status });
  } catch (err) {
    return handleError(err);
  }
}
