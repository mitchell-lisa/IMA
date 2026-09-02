import { NextResponse } from "next/server";
import { getPublicResult } from "@/lib/server/dal";
import { handleError, jsonError, limited } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const block = limited(req, "results", 60, 10 * 60 * 1000);
  if (block) return block;
  try {
    const { token } = await ctx.params;
    const result = await getPublicResult(token);
    if (!result) return jsonError(404, "Results not found");
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return handleError(err);
  }
}
