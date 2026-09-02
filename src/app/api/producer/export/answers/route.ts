import { requireProducer } from "@/lib/server/auth";
import { exportAnswersCsv } from "@/lib/server/dal";
import { handleError } from "@/lib/server/http";

export const runtime = "nodejs";

/** Anonymized per-question CSV for scoring-distribution and cohort analysis. */
export async function GET() {
  try {
    await requireProducer();
    const csv = await exportAnswersCsv();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="marketready-answers-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
