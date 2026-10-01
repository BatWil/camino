import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

/** Ink frame shared by Entrar, Crear cuenta and recovery (same language as screen 4a). */
export function AuthScreen({
  title,
  backHref = "/bienvenida",
  children,
}: {
  title: ReactNode;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-6 px-6 pt-4 pb-8">
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-white/10"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <BrandMark />
        <h1 className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.03em]">{title}</h1>
        {children}
      </div>
    </main>
  );
}
