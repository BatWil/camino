"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { GIFT_LABEL, rankOpportunities, topGifts } from "../domain/gifts";
import { useMyGifts, useMyServiceRequests, useOpportunities, useServiceActions } from "../hooks/use-service";

/** Screen 7c · Servir · "Lo que Dios puso en ti". */
export function ServeScreen() {
  const router = useRouter();
  const { church, isPending: churchPending } = useCurrentChurch();
  const gifts = useMyGifts();
  const opportunities = useOpportunities();
  const requests = useMyServiceRequests();
  const { interested, withdraw } = useServiceActions();
  const top = gifts.scores ? topGifts(gifts.scores, 3) : [];
  const ranked = rankOpportunities(opportunities.data ?? [], gifts.scores);
  const byOpportunity = new Map(
    (requests.data ?? []).filter((r) => r.status !== "withdrawn").map((r) => [r.opportunity_id, r]),
  );

  return (
    <main className="min-h-dvh bg-stage-sirve">
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col">
        <div className="px-5 pb-2" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white/35"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
          <h1 className="m-0 font-display-x text-[42px] leading-[.86] tracking-[-.03em]">Lo que Dios puso en ti</h1>
          <p className="m-0 text-[15px] leading-[1.45] font-medium">
            Descubre tus dones y encuentra dónde servir en tu iglesia.
          </p>
        </div>

        <div
          className="flex flex-1 flex-col gap-2.5 rounded-t-[32px] bg-paper px-3 pt-5"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 30px)" }}
        >
          {gifts.isPending ? (
            <Skeleton className="h-[150px] rounded-[26px]" />
          ) : top.length ? (
            <section aria-label="Tus dones" className="flex flex-col gap-3 rounded-[26px] bg-ink p-5 text-paper">
              <span className="eyebrow text-lime">Tus dones · Test completado</span>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {top.map((g) => (
                  <li key={g.area} className="flex items-center gap-2.5">
                    <span className="w-[92px] text-sm font-semibold">{GIFT_LABEL[g.area]}</span>
                    <span
                      className="h-2.5 flex-1 rounded-[5px]"
                      role="img"
                      aria-label={`${g.score}%`}
                      style={{
                        background: `linear-gradient(90deg,#C6F432 ${g.score}%,rgba(255,255,255,.12) ${g.score}%)`,
                      }}
                    />
                  </li>
                ))}
              </ul>
              <span className="text-[13px] leading-[1.4] text-paper/70">
                Tal vez deberías explorar {GIFT_LABEL[top[0].area].toLowerCase()}. Es un punto de partida, no una
                etiqueta.
              </span>
              <Link href="/servir/dones" className="text-[13px] font-semibold text-lime">
                Repetir el test →
              </Link>
            </section>
          ) : (
            <section className="flex flex-col gap-3 rounded-[26px] bg-ink p-5 text-paper">
              <span className="eyebrow text-lime">Tus dones</span>
              <span className="text-lg leading-[1.25] font-bold">16 frases, 3 minutos. Sin respuestas correctas.</span>
              <ButtonLink href="/servir/dones" variant="lime" size="md" className="self-start">
                Descubrir mis dones
              </ButtonLink>
            </section>
          )}

          {churchPending ? null : !church ? (
            <StateView
              kind="empty"
              title="Sirve en tu iglesia"
              message="Únete a tu iglesia para ver dónde puedes servir."
              action={
                <ButtonLink href="/unirse" variant="ink" size="sm">
                  Unirme a mi iglesia
                </ButtonLink>
              }
            />
          ) : (
            <>
              <h2 className="m-0 px-3 pt-2.5 text-[17px] font-bold">
                {gifts.scores ? "Encajas bien en" : "Dónde puedes servir"}
              </h2>
              {opportunities.isPending ? <Skeleton className="h-[72px] rounded-[22px]" /> : null}
              {opportunities.data && !opportunities.data.length ? (
                <p className="m-0 rounded-[22px] bg-white px-[18px] py-4 text-sm text-ink/60">
                  Tu iglesia aún no ha publicado oportunidades para servir.
                </p>
              ) : null}
              {ranked.map((o) => {
                const req = byOpportunity.get(o.id);
                const detail = [o.schedule_text, o.spots ? `${o.spots} lugares libres` : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-4"
                  >
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <span className="text-base font-bold">{o.title}</span>
                      {detail ? <span className="text-xs text-ink/60">{detail}</span> : null}
                    </span>
                    {req ? (
                      <button
                        type="button"
                        disabled={req.status !== "pending" || withdraw.isPending}
                        onClick={() => withdraw.mutate(req.id)}
                        aria-label={req.status === "pending" ? `Retirar interés en ${o.title}` : undefined}
                        className="flex h-10 flex-none items-center rounded-full bg-stage-crece px-3.5 text-[13px] font-bold"
                      >
                        {req.status === "accepted"
                          ? "✓ Sirves aquí"
                          : req.status === "declined"
                            ? "No por ahora"
                            : "✓ Enviado"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={interested.isPending}
                        onClick={() => interested.mutate(o.id)}
                        className="flex h-10 flex-none items-center rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white"
                      >
                        Me interesa
                      </button>
                    )}
                  </div>
                );
              })}
              <p className="m-0 px-3 pt-1 text-xs leading-[1.45] text-ink/55">
                Al tocar “Me interesa”, un líder de tu iglesia verá tu nombre para invitarte. Puedes retirarlo cuando
                quieras.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
