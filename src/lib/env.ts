/**
 * Public runtime configuration. Only NEXT_PUBLIC_* values are allowed here:
 * they are inlined into the static bundle that ships to web, PWA and native.
 * Never read a service_role key (or any secret) from client code.
 */
export interface PublicEnv {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  appUrl: string;
  appScheme: string;
  /** OAuth providers enabled in the Supabase project (NEXT_PUBLIC_AUTH_PROVIDERS=google,apple). */
  authProviders: ReadonlyArray<"google" | "apple">;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const env: PublicEnv = {
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  appUrl: clean(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  appScheme: clean(process.env.NEXT_PUBLIC_APP_SCHEME) ?? "camino",
  authProviders: parseProviders(process.env.NEXT_PUBLIC_AUTH_PROVIDERS),
};

export function parseProviders(value: string | undefined): ReadonlyArray<"google" | "apple"> {
  const allowed = new Set(["google", "apple"]);
  return (value ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is "google" | "apple" => allowed.has(p));
}

export function isSupabaseConfigured(e: PublicEnv = env): boolean {
  return Boolean(e.supabaseUrl && e.supabaseAnonKey);
}
