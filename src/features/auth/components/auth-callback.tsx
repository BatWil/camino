"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { SplashState } from "@/components/layout/splash-state";
import { postAuthPath } from "@/features/churches/domain/pending-join";
import { useAuth } from "../hooks/use-auth";
import { useAuthRedirect } from "../hooks/use-auth-redirect";
import { AuthScreen } from "./auth-screen";

/** Landing page for OAuth and email-confirmation redirects (web and camino://auth/callback). */
export function AuthCallback() {
  const state = useAuthRedirect();
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "done" || (state.status === "no_code" && status === "authenticated")) {
      router.replace(postAuthPath());
    }
    if (state.status === "no_code" && status === "unauthenticated") router.replace("/bienvenida");
    // Link opened in another browser/device (e.g. the email app's browser after signing up in the app):
    // the email IS confirmed; send the person to Bienvenida with a confirmation message.
    if (state.status === "error" && state.error.code === "link_other_device")
      router.replace("/bienvenida/?confirmado=1");
  }, [state, status, router]);

  if (state.status !== "error") return <SplashState />;

  const otherDevice = state.error.code === "link_other_device";
  return (
    <AuthScreen
      title={
        otherDevice ? (
          <>
            Correo <span className="text-lime">confirmado.</span>
          </>
        ) : (
          <>
            Un momento<span className="text-lime">.</span>
          </>
        )
      }
    >
      <p className="m-0 text-[15px] leading-[1.5] text-paper/80" role="alert">
        {otherDevice
          ? "Abriste el enlace en otro dispositivo o navegador. Tu cuenta está lista: entra con tu correo y contraseña."
          : state.error.message}
      </p>
      <div className="flex-1" />
      <ButtonLink href="/entrar" variant="lime" size="lg" block>
        Entrar
      </ButtonLink>
    </AuthScreen>
  );
}
