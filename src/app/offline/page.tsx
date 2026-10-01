import type { Metadata } from "next";
import { BrandMark } from "@/components/ui/brand-mark";

export const metadata: Metadata = { title: "Sin conexión" };

/** Served by the service worker when a page is requested offline and is not cached. */
export default function OfflinePage() {
  return (
    <main
      className="flex min-h-dvh flex-col bg-ink px-6 text-paper"
      style={{ paddingTop: "calc(var(--safe-top) + 40px)", paddingBottom: "40px" }}
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5">
        <BrandMark />
        <h1 className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.03em]">
          Sin <span className="text-lime">conexión.</span>
        </h1>
        <p className="m-0 text-[15px] leading-[1.5] text-paper/75">
          No pasa nada. Cuando vuelvas a tener señal, seguimos justo donde lo dejaste.
        </p>
        <span className="-rotate-3 self-start font-hand text-[26px] text-lime">siempre puedes volver ✦</span>
        <div className="flex-1" />
        {/* Full reload on purpose: the service worker serves this page when navigation failed. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="flex h-14 items-center justify-center rounded-full bg-lime text-base font-bold text-ink">
          Intentar de nuevo
        </a>
      </div>
    </main>
  );
}
