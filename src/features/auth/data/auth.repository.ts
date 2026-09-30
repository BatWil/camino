import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";

export type { Session };

function mapAuthError(error: { message?: string; status?: number; code?: string }): AppError {
  const code = error.code ?? "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(error.message ?? "")) {
    return new AppError("invalid_credentials", "Tu correo o contraseña no coinciden. Inténtalo de nuevo.", error);
  }
  if (code === "email_not_confirmed") {
    return new AppError("email_not_confirmed", "Confirma tu correo para entrar. Revisa tu bandeja de entrada.", error);
  }
  if (error.status === 429 || code === "over_request_rate_limit") {
    return new AppError("rate_limited", "Demasiados intentos. Espera un momento y vuelve a intentarlo.", error);
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new AppError("offline", "Parece que no tienes conexión.", error);
  }
  return new AppError("unknown", "Algo no salió bien. Inténtalo de nuevo.", error);
}

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
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw mapAuthError(error);
    if (!data.session) throw new AppError("unknown", "No pudimos iniciar tu sesión.");
    return data.session;
  },

  async signOut(): Promise<void> {
    // scope 'local' ends this device's session even if the network is unavailable.
    const { error } = await requireSupabase().auth.signOut({ scope: "local" });
    if (error) throw mapAuthError(error);
  },

  startAutoRefresh(): void {
    void requireSupabase().auth.startAutoRefresh();
  },

  stopAutoRefresh(): void {
    void requireSupabase().auth.stopAutoRefresh();
  },
};

export { mapAuthError };
