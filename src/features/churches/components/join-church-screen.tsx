"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { extractChurchCode } from "../domain/church-code";
import { clearPendingChurchCode, readPendingChurchCode, savePendingChurchCode } from "../domain/pending-join";
import { ChurchJoinPanel } from "./church-join-panel";

/**
 * /unirse/?codigo=XXXX — target of the church QR/link and of "Unirme a mi iglesia".
 * Without a session the code is remembered and applied after sign-up/sign-in.
 */
export function JoinChurchScreen() {
  const { status } = useAuth();
  const router = useRouter();
  const [code] = useState(() => {
    if (typeof window === "undefined") return "";
    const fromUrl = extractChurchCode(new URLSearchParams(window.location.search).get("codigo") ?? "");
    return fromUrl ?? readPendingChurchCode() ?? "";
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      if (code) savePendingChurchCode(code);
      router.replace("/bienvenida");
    }
  }, [status, code, router]);

  if (status === "unconfigured") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView kind="unconfigured" className="w-full" />
      </main>
    );
  }
  if (status !== "authenticated") return <SplashState />;

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-stage-encuentra text-ink">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-3.5 px-6 pt-3 pb-[30px]">
        <Link
          href="/comunidad"
          aria-label="Volver"
          className="-ml-2 flex size-10 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-[22px]" aria-hidden />
        </Link>
        <h1 className="m-0 mt-5 font-display-x text-[34px] leading-[.95] tracking-[-.02em]">¿De qué iglesia eres?</h1>
        <p className="m-0 mb-2 text-[15px] leading-[1.45] font-medium">
          Tu líder te dio un código. Así ves tus eventos, tu grupo y tu mentor.
        </p>
        <ChurchJoinPanel
          initialCode={code}
          onJoined={() => {
            clearPendingChurchCode();
            router.replace("/comunidad");
          }}
          onSkip={() => {
            clearPendingChurchCode();
            router.replace("/inicio");
          }}
          skipLabel="Ahora no"
        />
      </div>
    </main>
  );
}
