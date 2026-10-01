"use client";

import { useEffect, useState } from "react";
import { parseAuthRedirect } from "@/lib/auth/redirects";
import { AppError } from "@/types/result";
import { authRepository, mapAuthError, type Session } from "../data/auth.repository";

export type AuthRedirectState =
  | { status: "working" }
  | { status: "done"; session: Session }
  | { status: "no_code" }
  | { status: "error"; error: AppError };

// A PKCE code can be exchanged only once; React strict mode runs effects twice in dev.
const exchanges = new Map<string, Promise<Session>>();

function exchangeOnce(code: string): Promise<Session> {
  let pending = exchanges.get(code);
  if (!pending) {
    pending = authRepository.exchangeCode(code);
    exchanges.set(code, pending);
  }
  return pending;
}

/** Completes an auth redirect (OAuth, email confirmation, password recovery) on any platform. */
export function useAuthRedirect(): AuthRedirectState {
  const [state, setState] = useState<AuthRedirectState>({ status: "working" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const params = parseAuthRedirect(window.location.search, window.location.hash);
      let next: AuthRedirectState;
      if (params.error) {
        next = { status: "error", error: mapAuthError({ code: params.error, message: params.errorDescription ?? "" }) };
      } else if (!params.code) {
        next = { status: "no_code" };
      } else {
        try {
          next = { status: "done", session: await exchangeOnce(params.code) };
        } catch (err) {
          next = {
            status: "error",
            error: err instanceof AppError ? err : new AppError("unknown", "Algo no salió bien."),
          };
        }
      }
      await authRepository.closeAuthBrowser();
      // Remove the one-time code from the address bar/history.
      window.history.replaceState(null, "", window.location.pathname);
      if (!cancelled) setState(next);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
