import type { CategoryId } from "./types";

/**
 * Entry modules. All four reuse the same question bank and scoring; they
 * differ in landing-page framing and which findings are emphasized on the
 * results page. The module a prospect entered through is stored with the
 * lead so conversion can be compared across pitches.
 */
export type ModuleId = "marketready" | "renewal" | "contracts" | "claims";

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  headline: string;
  subhead: string;
  audience: string;
  /** Categories the results page brings forward for this module. */
  focusCategories: CategoryId[];
  focusTitle: string;
  focusIntro: string;
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  marketready: {
    id: "marketready",
    name: "MarketReady Risk Diagnostic",
    headline: "How ready is your real estate portfolio to be evaluated by the insurance market?",
    subhead:
      "Receive a confidential, industry-specific assessment of your renewal process, risk controls, claims practices, and underwriting story—before speaking with anyone.",
    audience: "Owners, asset managers, and CFOs unsure whether the portfolio is presenting an accurate, differentiated risk story.",
    focusCategories: [],
    focusTitle: "",
    focusIntro: "",
  },
  renewal: {
    id: "renewal",
    name: "Renewal Control Tower",
    headline: "Is your property renewal on a timeline, or on autopilot?",
    subhead:
      "A confidential check of your renewal runway, the statement of values carriers will scrutinize, and the acquisitions and updates that need to be documented before submissions go out.",
    audience: "Owners, asset managers, and CFOs facing a property renewal within three to nine months.",
    focusCategories: ["governance", "market_readiness"],
    focusTitle: "Your renewal readiness",
    focusIntro: "Timing, values, and the story carriers receive. These answers determine whether preparation starts early enough to matter.",
  },
  contracts: {
    id: "contracts",
    name: "Hidden Risk Transfer Scan",
    headline: "Are your leases and vendor contracts actually transferring risk, or just describing it?",
    subhead:
      "A confidential scan of how leases, vendor and snow-removal contracts, management agreements, insurance requirements, and certificate tracking work together as one control system.",
    audience: "Owners and property managers who rely on tenants' insurance and on-site vendors.",
    focusCategories: ["contractual_risk_transfer"],
    focusTitle: "Your lease and vendor risk-transfer workflow",
    focusIntro: "Requirements that are never verified, and certificates that are never matched to leases and contracts, do not transfer risk when a loss occurs.",
  },
  claims: {
    id: "claims",
    name: "Claims Friction Index",
    headline: "Are claims at your properties being managed, or just reported?",
    subhead:
      "A confidential look at reporting speed, open-claim cadence, public-adjuster and counsel practices, and how corrective actions are tracked across the portfolio.",
    audience: "Owners, asset managers, and property managers frustrated by recurring or poorly managed claims.",
    focusCategories: ["claims", "operational_controls"],
    focusTitle: "Your claims-governance practices",
    focusIntro: "Late reporting, unreviewed reserves, unmanaged counsel, and untracked corrective actions are the most common reasons property claims cost more and stay open longer.",
  },
};

export const MODULE_IDS: ModuleId[] = ["marketready", "renewal", "contracts", "claims"];

export function isModuleId(v: unknown): v is ModuleId {
  return typeof v === "string" && (MODULE_IDS as string[]).includes(v);
}

export function getModule(id: string | null | undefined): ModuleDefinition {
  return isModuleId(id) ? MODULES[id] : MODULES.marketready;
}
