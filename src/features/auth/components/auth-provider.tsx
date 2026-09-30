"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/env";
import { analytics } from "@/lib/analytics";
import { onAppStateChange } from "@/lib/native/bridge";
import { useAppStore } from "@/stores/app-store";
import { authRepository } from "../data/auth.repository";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unconfigured";

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(configured ? "loading" : "unconfigured");
  const queryClient = useQueryClient();
  const resetAppStore = useAppStore((s) => s.reset);

  useEffect(() => {
    if (!configured) return;
    // INITIAL_SESSION fires once the persisted session (if any) has been restored.
    const unsubscribe = authRepository.onAuthStateChange((event, next) => {
      setSession(next);
      setStatus(next ? "authenticated" : "unauthenticated");
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        resetAppStore();
        analytics.reset();
      }
      if (next?.user) analytics.identify(next.user.id);
    });
    return unsubscribe;
  }, [configured, queryClient, resetAppStore]);

  // Refresh tokens only while the app is in the foreground (native + web).
  useEffect(() => {
    if (!configured) return;
    return onAppStateChange((active) => {
      if (active) authRepository.startAutoRefresh();
      else authRepository.stopAutoRefresh();
    });
  }, [configured]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    await authRepository.signInWithPassword(email, password);
  }, []);

  const signOut = useCallback(async () => {
    await authRepository.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, user: session?.user ?? null, signInWithPassword, signOut }),
    [status, session, signInWithPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
