"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentChurch } from "../hooks/use-access";

/** Screen 2h header: "MI IGLESIA · IGLESIA VIDA NUEVA". */
export function ChurchHero() {
  const { church, isPending, isError, refetch } = useCurrentChurch();

  if (isPending) return <Skeleton className="mx-3 mt-1.5 h-[220px] rounded-[30px]" />;
  if (isError) {
    return (
      <div className="px-3 pt-1.5">
        <StateView
          kind="error"
          message="No pudimos cargar tu iglesia."
          action={
            <Button variant="ink" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }
  if (!church) {
    return (
      <div className="px-3 pt-1.5">
        <StateView
          kind="empty"
          tone="dark"
          title="Aún no estás conectado a una iglesia"
          message="Comunidad se centra en tu iglesia local: tu grupo, tu mentor, eventos y servicio. Podrás unirte con el código o QR de tu iglesia muy pronto."
        />
      </div>
    );
  }
  return (
    <div className="photo-ink mx-3 mt-1.5 flex h-[220px] flex-col justify-end rounded-[30px] p-[22px] text-white">
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow text-lime">Mi iglesia</span>
        <h1 className="m-0 font-display-x text-[28px] leading-[.92]">{church.churchName}</h1>
        {church.city ? <span className="text-[13px] font-semibold text-white/70">{church.city}</span> : null}
      </div>
    </div>
  );
}
