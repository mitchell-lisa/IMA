import "server-only";
import { env } from "../env";
import { MemoryRepository } from "./memory";
import { SupabaseRepository } from "./supabase";
import type { Repository } from "./types";

let instance: Repository | null = null;

/** Thrown when production has no persistent storage configured. Mapped to HTTP 503. */
export class StorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

/**
 * Returns the configured repository. Supabase when credentials are present,
 * otherwise an in-memory store so the app runs with zero configuration.
 */
export function getRepository(): Repository {
  if (instance) return instance;
  if (env.hasSupabase) {
    instance = new SupabaseRepository(env.supabaseUrl!, env.supabaseServiceRoleKey!);
    return instance;
  }
  // Production must not accept submissions into process-local memory: on a
  // serverless host assessments would vanish between requests and captured
  // leads would be lost. Preview deployments and local development may opt in.
  const isProductionTarget = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : env.nodeEnv === "production";
  if (isProductionTarget && process.env.ALLOW_MEMORY_STORE !== "true") {
    throw new StorageNotConfiguredError(
      "Persistent storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY), or set ALLOW_MEMORY_STORE=true for a throwaway demo.",
    );
  }
  if (isProductionTarget) console.warn("[repo] ALLOW_MEMORY_STORE=true: using in-memory storage in production. Data will not persist.");
  instance = new MemoryRepository();
  return instance;
}

export type { Repository } from "./types";
export * from "./types";
