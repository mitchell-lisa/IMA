import { getResultsPdf } from "@/lib/server/dal";
import { handleError, jsonError, limited } from "@/lib/server/http";

export const runtime = "nodejs";

/** PDF report. Unlocked only after the prospect has provided an email. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const block = limited(req, "results.pdf", 20, 10 * 60 * 1000);
  if (block) return block;
  try {
    const { token } = await ctx.params;
    const pdf = await getResultsPdf(token);
    if (!pdf) return jsonError(403, "Enter your email on the results page to unlock the PDF report.");
    return new Response(Buffer.from(pdf.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
