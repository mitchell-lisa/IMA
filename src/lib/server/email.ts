import "server-only";
import { env } from "./env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export interface EmailSendResult {
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  error?: string;
}

/**
 * Email delivery via Resend's HTTP API when configured; otherwise logs to the
 * console. The MVP intentionally keeps the provider surface tiny so it can be
 * swapped for IMA's approved provider.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  if (!env.resendApiKey) {
    console.info(`[email:skipped] to=${message.to} subject="${message.subject}"`);
    return { status: "skipped" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[email:failed] ${res.status} ${body}`);
      return { status: "failed", error: `${res.status}` };
    }
    const json = (await res.json()) as { id?: string };
    return { status: "sent", providerId: json.id };
  } catch (err) {
    console.error("[email:failed]", err);
    return { status: "failed", error: err instanceof Error ? err.message : "unknown" };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function prospectResultEmail(opts: {
  companyName: string;
  resultsUrl: string;
  overall: number | null;
  findings: string[];
  checklist: string[];
}): Pick<EmailMessage, "subject" | "html" | "text"> {
  const subject = `Your MarketReady Risk Diagnostic results for ${opts.companyName}`;
  const findingsHtml = opts.findings.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  const checklistHtml = opts.checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1f2937">
  <h2 style="margin:0 0 8px">Your results are ready</h2>
  <p>Thank you for completing the MarketReady Risk Diagnostic for <strong>${escapeHtml(opts.companyName)}</strong>.</p>
  <p>Overall readiness score: <strong>${opts.overall ?? "n/a"}</strong> / 100. Your detailed report is attached, and you can revisit the results at any time:</p>
  <p><a href="${opts.resultsUrl}" style="display:inline-block;padding:10px 16px;background:#0f3d5e;color:#fff;text-decoration:none;border-radius:6px">View your results</a></p>
  <h3>Three areas to investigate</h3><ol>${findingsHtml}</ol>
  <h3>Your preparation checklist</h3><ul>${checklistHtml}</ul>
  <p style="font-size:12px;color:#6b7280;margin-top:24px">Educational self-assessment; not a coverage opinion, audit, quotation, binder, or recommendation.</p>
</div>`;
  const text = [
    `Your MarketReady Risk Diagnostic results for ${opts.companyName}`,
    ``,
    `Overall readiness score: ${opts.overall ?? "n/a"} / 100`,
    `View your results: ${opts.resultsUrl}`,
    ``,
    `Three areas to investigate:`,
    ...opts.findings.map((f, i) => `${i + 1}. ${f}`),
    ``,
    `Preparation checklist:`,
    ...opts.checklist.map((c) => `- ${c}`),
    ``,
    `Educational self-assessment; not a coverage opinion, audit, quotation, binder, or recommendation.`,
  ].join("\n");
  return { subject, html, text };
}

export function producerAlertEmail(opts: {
  companyName: string;
  leadTier: string;
  leadScore: number;
  overall: number | null;
  renewalLabel: string;
  briefUrl: string;
  workshopRequested: boolean;
}): Pick<EmailMessage, "subject" | "html" | "text"> {
  const subject = `[Tier ${opts.leadTier}] New qualified diagnostic: ${opts.companyName}${opts.workshopRequested ? " (workshop requested)" : ""}`;
  const text = [
    `New completed diagnostic with email capture.`,
    `Company: ${opts.companyName}`,
    `Lead quality: Tier ${opts.leadTier} (${opts.leadScore}/100)`,
    `Overall readiness score: ${opts.overall ?? "n/a"}`,
    `Renewal: ${opts.renewalLabel}`,
    `Workshop requested: ${opts.workshopRequested ? "yes" : "no"}`,
    ``,
    `Producer Brief: ${opts.briefUrl}`,
    ``,
    `Every qualified lead requires manual review by a licensed professional before any coverage discussion.`,
  ].join("\n");
  const html = `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`;
  return { subject, html, text };
}
