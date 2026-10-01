"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postAuthPath } from "@/features/churches/domain/pending-join";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { AppError } from "@/types/result";
import { authRepository, type OAuthProvider } from "../data/auth.repository";

const LABEL: Record<OAuthProvider, string> = { google: "Google", apple: "Apple" };

/**
 * Google / Apple buttons from screen 4a. A provider only starts OAuth when it is
 * enabled for this deployment (NEXT_PUBLIC_AUTH_PROVIDERS) and in Supabase Auth.
 */
export function SocialButtons() {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const start = async (provider: OAuthProvider) => {
    setMessage(null);
    if (!env.authProviders.includes(provider)) {
      setMessage(`Entrar con ${LABEL[provider]} estará disponible muy pronto.`);
      return;
    }
    setPending(provider);
    try {
      const result = await authRepository.signInWithOAuth(provider);
      if (result === "signed_in") router.replace(postAuthPath());
    } catch (err) {
      setMessage(err instanceof AppError ? err.message : "No pudimos abrir el inicio de sesión.");
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(["google", "apple"] as const).map((provider) => (
          <Button
            key={provider}
            variant="outline"
            className="h-[52px] text-sm font-semibold"
            loading={pending === provider}
            onClick={() => start(provider)}
          >
            {LABEL[provider]}
          </Button>
        ))}
      </div>
      <p aria-live="polite" className="m-0 min-h-5 text-center text-[13px] text-lime">
        {message ?? ""}
      </p>
    </>
  );
}
