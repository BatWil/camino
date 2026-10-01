import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Browser } from "@capacitor/browser";
import { authRedirectUrl } from "@/lib/auth/redirects";
import { isNative } from "@/lib/platform";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import { MIN_PASSWORD_LENGTH } from "../domain/validation";

export type { Session };
export type OAuthProvider = "google" | "apple";

interface AuthErrorLike {
  message?: string;
  status?: number;
  code?: string;
}

function mapAuthError(error: AuthErrorLike): AppError {
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return new AppError("invalid_credentials", "Tu correo o contraseña no coinciden. Inténtalo de nuevo.", error);
  }
  if (code === "email_not_confirmed") {
    return new AppError("email_not_confirmed", "Confirma tu correo para entrar. Revisa tu bandeja de entrada.", error);
  }
  if (code === "user_already_exists" || code === "email_exists" || /already registered/i.test(message)) {
    return new AppError("already_exists", "Ya existe una cuenta con ese correo. Prueba entrar.", error);
  }
  if (code === "weak_password") {
    return new AppError(
      "weak_password",
      `Elige una contraseña más segura (mínimo ${MIN_PASSWORD_LENGTH} caracteres).`,
      error,
    );
  }
  if (code === "email_address_invalid" || code === "validation_failed") {
    return new AppError("invalid_input", "Revisa que el correo esté bien escrito.", error);
  }
  if (code === "same_password") {
    return new AppError("invalid_input", "La nueva contraseña debe ser distinta de la anterior.", error);
  }
  if (code === "provider_disabled" || /provider is not enabled/i.test(message)) {
    return new AppError("provider_disabled", "Este método de acceso aún no está activado.", error);
  }
  if (code === "flow_state_not_found" || /code verifier/i.test(message)) {
    return new AppError("link_other_device", "Este enlace se abrió en otro dispositivo o navegador.", error);
  }
  if (code === "otp_expired" || /expired/i.test(message)) {
    return new AppError("link_expired", "El enlace ya expiró. Pide uno nuevo.", error);
  }
  if (error.status === 429 || code.startsWith("over_")) {
    return new AppError("rate_limited", "Demasiados intentos. Espera un momento y vuelve a intentarlo.", error);
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new AppError("offline", "Parece que no tienes conexión.", error);
  }
  return new AppError("unknown", "Algo no salió bien. Inténtalo de nuevo.", error);
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const authRepository = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await requireSupabase().auth.getSession();
    if (error) throw mapAuthError(error);
    return data.session;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    const { data } = requireSupabase().auth.onAuthStateChange(callback);
    return () => data.subscription.unsubscribe();
  },

  async signInWithPassword(email: string, password: string): Promise<Session> {
    const { data, error } = await requireSupabase().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw mapAuthError(error);
    if (!data.session) throw new AppError("unknown", "No pudimos iniciar tu sesión.");
    return data.session;
  },

  /**
   * Creates an account. Returns the session when email confirmation is disabled,
   * or null when the user must confirm their email first.
   */
  async signUp(input: { email: string; password: string; displayName: string }): Promise<Session | null> {
    const { data, error } = await requireSupabase().auth.signUp({
      email: normalizeEmail(input.email),
      password: input.password,
      options: {
        // Only the name is sent as metadata; it is copied into the private profile.
        data: { display_name: input.displayName.trim() },
        emailRedirectTo: authRedirectUrl("callback"),
      },
    });
    if (error) throw mapAuthError(error);
    return data.session;
  },

  /** Web: full-page redirect. Native: opens the in-app browser; the deep link completes it. */
  async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    const native = isNative();
    const { data, error } = await requireSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: authRedirectUrl("callback"), skipBrowserRedirect: native },
    });
    if (error) throw mapAuthError(error);
    if (native && data.url) await Browser.open({ url: data.url, presentationStyle: "popover" });
  },

  /** Exchanges the PKCE `code` from a redirect (OAuth, confirmation, recovery) for a session. */
  async exchangeCode(code: string): Promise<Session> {
    const { data, error } = await requireSupabase().auth.exchangeCodeForSession(code);
    if (error) throw mapAuthError(error);
    return data.session;
  },

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: authRedirectUrl("nueva-contrasena"),
    });
    // Do not reveal whether the email exists: only surface transport/rate errors.
    if (error && (error.status === 429 || (error.code ?? "").startsWith("over_"))) throw mapAuthError(error);
  },

  async updatePassword(password: string): Promise<void> {
    const { error } = await requireSupabase().auth.updateUser({ password });
    if (error) throw mapAuthError(error);
  },

  async signOut(): Promise<void> {
    // scope 'local' ends this device's session even if the network is unavailable.
    const { error } = await requireSupabase().auth.signOut({ scope: "local" });
    if (error) throw mapAuthError(error);
  },

  async closeAuthBrowser(): Promise<void> {
    if (isNative()) await Browser.close().catch(() => {});
  },

  startAutoRefresh(): void {
    void requireSupabase().auth.startAutoRefresh();
  },

  stopAutoRefresh(): void {
    void requireSupabase().auth.stopAutoRefresh();
  },
};

export { mapAuthError };
