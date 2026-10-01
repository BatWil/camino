import { env } from "@/lib/env";
import { isNative } from "@/lib/platform";

/** In-app pages that complete an auth redirect. */
export type AuthRedirectPage = "callback" | "nueva-contrasena";

/**
 * URL Supabase sends the user back to after OAuth, email confirmation or a
 * recovery link. Native apps use the custom scheme (opened via deep link);
 * the web uses the current origin so any host (localhost, preview, prod) works.
 * All of them must be listed in Supabase Auth → URL Configuration.
 */
export function authRedirectUrl(page: AuthRedirectPage, opts: { native?: boolean; origin?: string } = {}): string {
  const native = opts.native ?? isNative();
  if (native) return `${env.appScheme}://auth/${page}`;
  const origin = opts.origin ?? (typeof window !== "undefined" ? window.location.origin : env.appUrl);
  return `${origin.replace(/\/$/, "")}/auth/${page}/`;
}

export interface AuthRedirectParams {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
}

/** Reads `?code=` (PKCE) or `error`/`error_description` from query or hash. */
export function parseAuthRedirect(search: string, hash = ""): AuthRedirectParams {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const pick = (key: string) => query.get(key) ?? fragment.get(key);
  return {
    code: pick("code"),
    error: pick("error") ?? pick("error_code"),
    errorDescription: pick("error_description"),
  };
}
