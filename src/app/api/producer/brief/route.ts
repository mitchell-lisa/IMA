import { NextResponse } from "next/server";
import { requireProducer } from "@/lib/server/auth";
import { briefToMarkdown, getLeadDetail, getLeadDetailByAssessment } from "@/lib/server/dal";
import { handleError, jsonError, parseBody } from "@/lib/server/http";
import { producerBriefRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

/** Producer Brief for a lead (JSON or Markdown). Producer auth required. */
export async function POST(req: Request) {
  try {
    await requireProducer();
    const input = await parseBody(req, producerBriefRequestSchema);
    if (!input.leadId && !input.assessmentId) return jsonError(400, "leadId or assessmentId is required");
    const detail = input.leadId
      ? await getLeadDetail(input.leadId, { useAi: input.useAi })
      : await getLeadDetailByAssessment(input.assessmentId!, { useAi: input.useAi });
    if (!detail) return jsonError(404, "Lead not found");
    if (input.format === "markdown") {
      return new Response(briefToMarkdown(detail.brief), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
    }
    return NextResponse.json(detail.brief);
  } catch (err) {
    return handleError(err);
  }
}
