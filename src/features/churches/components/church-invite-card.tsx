"use client";

import { ButtonLink } from "@/components/ui/button";
import { useCurrentChurch } from "../hooks/use-access";

/** Shown on Home while the person is not connected to a church. */
export function ChurchInviteCard() {
  const { church, isPending, isError } = useCurrentChurch();
  if (isPending || isError || church) return null;
  return (
    <section className="flex flex-col gap-2 rounded-[26px] bg-white p-5">
      <span className="eyebrow text-violet">Mi iglesia</span>
      <h2 className="m-0 text-[20px] leading-[1.15] font-bold">Conecta con tu iglesia</h2>
      <p className="m-0 text-sm leading-[1.45] text-ink/60">
        Con el código o el QR de tu iglesia verás tus eventos, tu grupo y tu mentor.
      </p>
      <ButtonLink href="/unirse" variant="ink" size="sm" className="mt-1 self-start">
        Unirme a mi iglesia
      </ButtonLink>
    </section>
  );
}
