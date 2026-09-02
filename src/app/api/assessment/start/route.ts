import { NextResponse } from "next/server";
import { startAssessment } from "@/lib/server/dal";
import { env } from "@/lib/server/env";
import { handleError, jsonError, limited, parseBody } from "@/lib/server/http";
import { startProfileSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const block = limited(req, "assessment.start", 10, 10 * 60 * 1000);
  if (block) return block;
  try {
    const input = await parseBody(req, startProfileSchema);
    // Bot heuristics: honeypot handled by schema (must be empty); minimum dwell time here.
    if (input.startedAt && Date.now() - input.startedAt < env.minFormSeconds * 1000) {
      return jsonError(400, "Please review the form before submitting.");
    }
    const session = await startAssessment(input);
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
