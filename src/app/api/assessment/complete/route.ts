import { NextResponse } from "next/server";
import { completeAssessment } from "@/lib/server/dal";
import { handleError, limited, parseBody } from "@/lib/server/http";
import { completeRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const block = limited(req, "assessment.complete", 20, 10 * 60 * 1000);
  if (block) return block;
  try {
    const input = await parseBody(req, completeRequestSchema);
    const { token } = await completeAssessment(input.assessmentId, input.answers, input.profile);
    return NextResponse.json({ token, resultsPath: `/results/${token}` });
  } catch (err) {
    return handleError(err);
  }
}
