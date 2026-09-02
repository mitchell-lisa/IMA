import { requireProducer } from "@/lib/server/auth";
import { exportLeadsCsv } from "@/lib/server/dal";
import { handleError } from "@/lib/server/http";

export const runtime = "nodejs";

/** CSV export of CRM-ready lead payloads (fallback when no webhook is configured). */
export async function GET() {
  try {
    await requireProducer();
    const csv = await exportLeadsCsv();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="marketready-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
