import { NextResponse } from "next/server";
import { saveAnswers } from "@/lib/server/dal";
import { handleError, limited, parseBody } from "@/lib/server/http";
import { answerRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const block = limited(req, "assessment.answer", 120, 10 * 60 * 1000);
  if (block) return block;
  try {
    const input = await parseBody(req, answerRequestSchema);
    const session = await saveAnswers(input.assessmentId, input.answers, input.profile);
    return NextResponse.json(session);
  } catch (err) {
    return handleError(err);
  }
}
