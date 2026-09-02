import "server-only";

/**
 * Central environment access. Everything is optional so the app can run
 * locally with zero configuration (in-memory store, console email, dev
 * passcode). Production requires the Supabase and session settings.
 */
function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export const env = {
  appUrl: opt("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",

  supabaseUrl: opt("NEXT_PUBLIC_SUPABASE_URL"),
  // Supabase's current key format is sb_publishable_... (browser/auth) and
  // sb_secret_... (server). The legacy anon / service_role JWTs still work.
  supabaseAnonKey: opt("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? opt("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: opt("SUPABASE_SECRET_KEY") ?? opt("SUPABASE_SERVICE_ROLE_KEY"),

  sessionSecret: opt("SESSION_SECRET"),
  producerDevPasscode: opt("PRODUCER_DEV_PASSCODE"),
  producerAllowedDomains: (opt("PRODUCER_ALLOWED_EMAIL_DOMAINS") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  resendApiKey: opt("RESEND_API_KEY"),
  emailFrom: opt("EMAIL_FROM") ?? "IMA MarketReady Diagnostic <no-reply@example.com>",
  producerAlertEmail: opt("PRODUCER_ALERT_EMAIL"),
  emailWebhookSecret: opt("EMAIL_WEBHOOK_SECRET"),

  crmWebhookUrl: opt("CRM_WEBHOOK_URL"),
  crmWebhookSecret: opt("CRM_WEBHOOK_SECRET"),

  anthropicApiKey: opt("ANTHROPIC_API_KEY"),
  aiSummariesEnabled: opt("AI_SUMMARIES_ENABLED") === "true",

  ipHashSalt: opt("IP_HASH_SALT") ?? "dev-salt",
  minFormSeconds: Number(opt("MIN_FORM_SECONDS") ?? "4"),

  get hasSupabase() {
    return Boolean(this.supabaseUrl && this.supabaseServiceRoleKey);
  },
  get hasSupabaseAuth() {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  },
};

/** Fail loudly in production if a required setting is missing. */
export function assertProductionEnv(): void {
  if (env.nodeEnv !== "production") return;
  const missing: string[] = [];
  if (!env.sessionSecret) missing.push("SESSION_SECRET");
  if (!env.hasSupabase) missing.push("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.error(`[env] Missing required production settings: ${missing.join(", ")}`);
  }
}
