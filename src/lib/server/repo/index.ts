import "server-only";
import { env } from "../env";
import { MemoryRepository } from "./memory";
import { SupabaseRepository } from "./supabase";
import type { Repository } from "./types";

let instance: Repository | null = null;

/**
 * Returns the configured repository. Supabase when credentials are present,
 * otherwise an in-memory store so the app runs with zero configuration.
 */
export function getRepository(): Repository {
  if (instance) return instance;
  if (env.hasSupabase) {
    instance = new SupabaseRepository(env.supabaseUrl!, env.supabaseServiceRoleKey!);
  } else {
    if (env.nodeEnv === "production") {
      console.warn("[repo] Supabase is not configured; using in-memory storage. Data will not persist.");
    }
    instance = new MemoryRepository();
  }
  return instance;
}

export type { Repository } from "./types";
export * from "./types";
