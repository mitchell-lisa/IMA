import { NextResponse, type NextRequest } from "next/server";

/**
 * Partner attribution and source tracking.
 *
 * Captures `?partner=`, `?ref=` and UTM parameters from any landing URL into a
 * short-lived cookie so that the assessment start route can attribute the
 * lead to a referral partner or campaign. No personal data is stored here.
 */
export const ATTRIBUTION_COOKIE = "mr_attr";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const partner = url.searchParams.get("partner") ?? url.searchParams.get("ref");
  const source = url.searchParams.get("utm_source");
  const campaign = url.searchParams.get("utm_campaign");
  const medium = url.searchParams.get("utm_medium");

  const res = NextResponse.next();
  if (partner || source || campaign || medium) {
    const existing = safeParse(req.cookies.get(ATTRIBUTION_COOKIE)?.value);
    const value = {
      partnerCode: clean(partner) ?? existing.partnerCode ?? null,
      source: clean(source) ?? existing.source ?? null,
      campaign: clean(campaign) ?? existing.campaign ?? null,
      medium: clean(medium) ?? existing.medium ?? null,
      referrer: clean(req.headers.get("referer")) ?? existing.referrer ?? null,
      landingPath: existing.landingPath ?? url.pathname,
    };
    res.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify(value), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return res;
}

function clean(v: string | null): string | null {
  if (!v) return null;
  const s = v.trim().slice(0, 80).replace(/[^\w\-.:/ ]/g, "");
  return s || null;
}

function safeParse(v: string | undefined): Record<string, string | null> {
  if (!v) return {};
  try {
    const parsed = JSON.parse(v);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
