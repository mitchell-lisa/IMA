import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UnauthorizedError } from "./auth";
import { ConflictError, NotFoundError } from "./dal";
import { clientIp, rateLimit } from "./ratelimit";
import { StorageNotConfiguredError } from "./repo";
import { hashIp } from "./crypto";

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

/** Parses and validates a JSON body. Throws ZodError on failure. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ZodError([{ code: "custom", message: "Body must be JSON", path: [] }]);
  }
  return schema.parse(raw);
}

/** Applies a per-IP rate limit for a named route. Returns a response when limited. */
export function limited(req: Request, route: string, limit: number, windowMs: number): NextResponse | null {
  const ip = hashIp(clientIp(req.headers)) ?? "anon";
  const r = rateLimit(`${route}:${ip}`, limit, windowMs);
  if (r.ok) return null;
  return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(r.retryAfterSeconds) } });
}

/** Uniform error mapping for route handlers. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) return jsonError(400, "Invalid request", err.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  if (err instanceof UnauthorizedError) return jsonError(401, "Unauthorized");
  if (err instanceof NotFoundError) return jsonError(404, err.message);
  if (err instanceof StorageNotConfiguredError) {
    console.error("[api] storage not configured:", err.message);
    return jsonError(503, "The assessment is not available yet: the service is still being configured. Please try again later.");
  }
  if (err instanceof ConflictError) return jsonError(409, err.message);
  console.error("[api] unhandled", err);
  return jsonError(500, "Something went wrong");
}
