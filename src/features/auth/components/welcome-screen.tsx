"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/brand-mark";
import { useAuth } from "../hooks/use-auth";

/** Screen 4a · Bienvenida / crear cuenta. */
export function WelcomeScreen() {
  const { status } = useAuth();
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/inicio");
  }, [status, router]);

  // Account creation and social sign-in are delivered in M1 (see docs/roadmap.md).
  const comingSoon = (what: string) => setNotice(`${what} estará disponible muy pronto.`);

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div className="photo-ink relative mx-3 mt-2.5 h-[360px] max-h-[44dvh] rounded-[32px]">
          <span className="absolute right-4 bottom-[18px] -rotate-6 rounded-full bg-lime px-3.5 py-2 font-hand text-2xl leading-none text-ink">
            bienvenido ✦
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3.5 px-6 pt-[26px] pb-[30px]">
          <BrandMark />
          <h1 className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.03em]">
            Tu fe no termina el <span className="text-lime">domingo.</span>
          </h1>
          <div className="min-h-6 flex-1" />
          <Button variant="lime" size="lg" block onClick={() => comingSoon("Crear tu cuenta")}>
            Crear mi cuenta
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-[52px] text-sm font-semibold"
              onClick={() => comingSoon("Entrar con Google")}
            >
              Google
            </Button>
            <Button
              variant="outline"
              className="h-[52px] text-sm font-semibold"
              onClick={() => comingSoon("Entrar con Apple")}
            >
              Apple
            </Button>
          </div>
          <p aria-live="polite" className="m-0 min-h-5 text-center text-[13px] text-lime">
            {notice ?? ""}
          </p>
          <p className="m-0 text-center text-sm text-paper/70">
            ¿Ya tienes cuenta?{" "}
            <Link href="/entrar" className="font-semibold text-lime underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
