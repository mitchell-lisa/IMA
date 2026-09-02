import { NextResponse } from "next/server";
import { captureLead } from "@/lib/server/dal";
import { handleError, limited, parseBody } from "@/lib/server/http";
import { leadCaptureSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const block = limited(req, "lead.capture", 10, 10 * 60 * 1000);
  if (block) return block;
  try {
    const input = await parseBody(req, leadCaptureSchema);
    const out = await captureLead(input);
    return NextResponse.json({ ok: true, ...out, pdfPath: `/api/results/${input.token}/pdf` }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
