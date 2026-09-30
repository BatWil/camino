import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";
import { getKeyValueStorage } from "@/lib/storage/key-value";
import { isNative } from "@/lib/platform";
import type { Database } from "./database.types";

export type CaminoSupabaseClient = SupabaseClient<Database>;

let client: CaminoSupabaseClient | null = null;

/**
 * Browser/native Supabase client (anon key + user JWT; RLS enforces access).
 * Returns null when the app is built without Supabase configuration so the UI
 * can render an explicit "configuration required" state instead of crashing.
 */
export function getSupabase(): CaminoSupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;

  client = createClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      storage: getKeyValueStorage(),
      storageKey: "camino.auth",
      persistSession: true,
      autoRefreshToken: true,
      // Web handles the OAuth redirect in the URL; native receives it via deep link (M1).
      detectSessionInUrl: !isNative(),
      flowType: "pkce",
    },
    global: { headers: { "x-client-info": "camino-app" } },
  });
  return client;
}

/** Throws a typed error for code paths that cannot run without a backend. */
export function requireSupabase(): CaminoSupabaseClient {
  const sb = getSupabase();
  if (!sb) throw new SupabaseNotConfiguredError();
  return sb;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
    this.name = "SupabaseNotConfiguredError";
  }
}
