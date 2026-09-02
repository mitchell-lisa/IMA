import "server-only";
import { env } from "./env";

/**
 * Optional Microsoft Teams notification via an incoming webhook (Workflows
 * agent, category B in the plan). Sends a compact card on qualified lead
 * capture. Disabled unless TEAMS_WEBHOOK_URL is set; failures never block.
 */
export interface TeamsLeadAlert {
  companyName: string;
  industry: string;
  leadTier: string;
  leadScore: number;
  overall: number | null;
  criticalFlags: number;
  renewal: string;
  workshopRequested: boolean;
  partner: string | null;
  module: string;
  briefUrl: string;
}

export async function postTeamsLeadAlert(a: TeamsLeadAlert): Promise<"sent" | "skipped" | "failed"> {
  const url = process.env.TEAMS_WEBHOOK_URL?.trim();
  if (!url) return "skipped";
  const facts = [
    { title: "Industry", value: a.industry },
    { title: "Lead quality", value: `Tier ${a.leadTier} (${a.leadScore}/100)` },
    { title: "Overall readiness", value: a.overall === null ? "n/a" : String(a.overall) },
    { title: "Critical flags", value: String(a.criticalFlags) },
    { title: "Renewal", value: a.renewal },
    { title: "Workshop requested", value: a.workshopRequested ? "Yes" : "No" },
    { title: "Source", value: a.partner ? `Partner ${a.partner}` : "direct" },
    { title: "Entry module", value: a.module },
  ];
  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            { type: "TextBlock", size: "Medium", weight: "Bolder", text: `New qualified diagnostic: ${a.companyName}` },
            { type: "FactSet", facts },
            { type: "TextBlock", wrap: true, isSubtle: true, text: "Requires manual review by a licensed professional before any coverage discussion." },
          ],
          actions: [{ type: "Action.OpenUrl", title: "Open Producer Brief", url: a.briefUrl }],
        },
      },
    ],
  };
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(card) });
    if (!res.ok) {
      console.error(`[teams:failed] ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[teams:failed]", err);
    console.info(`[teams] ${env.appUrl}`);
    return "failed";
  }
}
