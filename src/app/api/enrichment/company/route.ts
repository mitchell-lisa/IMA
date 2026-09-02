import { NextResponse } from "next/server";
import { enrichCompany } from "@/lib/server/enrichment";
import { handleError, limited, parseBody } from "@/lib/server/http";
import { enrichmentRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

/** Deterministic, local enrichment preview (domain, territory, NAICS). */
export async function POST(req: Request) {
  const block = limited(req, "enrichment", 30, 10 * 60 * 1000);
  if (block) return block;
  try {
    const input = await parseBody(req, enrichmentRequestSchema);
    const enrichment = await enrichCompany(input);
    return NextResponse.json(enrichment);
  } catch (err) {
    return handleError(err);
  }
}
