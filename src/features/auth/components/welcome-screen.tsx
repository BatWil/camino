"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/brand-mark";
import { postAuthPath } from "@/features/churches/domain/pending-join";
import { useAuth } from "../hooks/use-auth";
import { SocialButtons } from "./social-buttons";

/** Screen 4a · Bienvenida / crear cuenta. */
export function WelcomeScreen() {
  const { status } = useAuth();
  const router = useRouter();
  const confirmed = useSearchParams().get("confirmado") === "1";

  useEffect(() => {
    if (status === "authenticated") router.replace(postAuthPath());
  }, [status, router]);

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
          {confirmed ? (
            <div role="status" className="animate-pop flex flex-col gap-1 rounded-[22px] bg-lime p-4 text-ink">
              <span className="text-base font-bold">¡Correo confirmado! ✦</span>
              <span className="text-sm">Ya puedes entrar con tu correo y contraseña, aquí o en la app.</span>
            </div>
          ) : null}
          {confirmed ? (
            <ButtonLink href="/entrar" variant="lime" size="lg" block>
              Entrar
            </ButtonLink>
          ) : (
            <ButtonLink href="/registro" variant="lime" size="lg" block>
              Crear mi cuenta
            </ButtonLink>
          )}
          <SocialButtons />
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
