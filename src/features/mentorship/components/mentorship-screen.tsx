"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SplashState } from "@/components/layout/splash-state";
import { StateView } from "@/components/feedback/state-view";
import { stageTheme } from "@/features/journey/domain/stages";
import { activityLabel } from "../domain/conversation";
import { useMyMentees, useMyMentor } from "../hooks/use-mentorship";
import { ConversationScreen } from "./conversation-screen";

function MentorshipIndex() {
  const router = useRouter();
  const mentor = useMyMentor();
  const mentees = useMyMentees();
  const onlyMentor = mentor.data && mentees.data && mentees.data.length === 0;

  useEffect(() => {
    if (onlyMentor) router.replace(`/mentoria/?id=${mentor.data!.mentorship_id}`);
  }, [onlyMentor, mentor.data, router]);

  if (mentor.isPending || mentees.isPending || onlyMentor) return <SplashState />;

  return (
    <main className="pt-safe pb-safe min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-[600px] flex-col gap-3 px-3 pb-8">
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
        <h1 className="m-0 px-3 font-display-x text-[40px] leading-[.88]">Mentoría</h1>

        {mentor.data ? (
          <Link
            href={`/mentoria/?id=${mentor.data.mentorship_id}`}
            className="flex items-center justify-between rounded-[22px] bg-stage-vive px-[18px] py-4 text-white"
          >
            <span className="flex flex-col gap-1">
              <span className="eyebrow">Mi mentor</span>
              <span className="text-base font-bold">{mentor.data.mentor_name}</span>
            </span>
            <span className="text-sm font-semibold">Hablar →</span>
          </Link>
        ) : null}

        {mentees.data?.length ? (
          <section aria-labelledby="mis-jovenes" className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between px-3 pt-2">
              <h2 id="mis-jovenes" className="m-0 text-[17px] font-bold">
                Jóvenes que acompañas
              </h2>
              <span className="text-xs text-ink/55">Solo lo que ellos comparten</span>
            </div>
            {mentees.data.map((m) => {
              const theme = m.stage_key ? stageTheme(m.stage_key) : null;
              const activity = activityLabel(m.last_active);
              return (
                <Link
                  key={m.mentorship_id}
                  href={`/mentoria/?id=${m.mentorship_id}`}
                  className="flex flex-col gap-2 rounded-[22px] bg-white px-[18px] py-4"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-base font-bold">{m.first_name}</span>
                    {theme && m.stage_name ? (
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                        style={{ background: theme.color, color: theme.onColor }}
                      >
                        {m.stage_name}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[13px] text-ink/70">{m.current_plan ?? "Sin plan activo"}</span>
                  <span className="flex items-center justify-between text-[13px] font-semibold">
                    <span className={activity.active ? "text-[#1F8A4F]" : "text-ink/55"}>
                      {activity.active ? "●" : "○"} {activity.text}
                    </span>
                    {m.shared_checkins ? (
                      <span className="text-ink/55">
                        {m.shared_checkins} check-in{m.shared_checkins === 1 ? "" : "s"} compartido
                        {m.shared_checkins === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
            <p className="m-0 px-3 text-xs leading-[1.45] text-ink/55">
              Nunca verás su diario, sus oraciones privadas ni sus notas. El joven decide qué compartir.
            </p>
          </section>
        ) : null}

        {!mentor.data && !mentees.data?.length ? (
          <StateView
            kind="empty"
            title="Aún no tienes mentor"
            message="Un mentor es alguien de tu iglesia que camina contigo. Puedes pedir uno desde Comunidad."
            action={
              <ButtonLink href="/comunidad" variant="ink" size="sm">
                Ir a Comunidad
              </ButtonLink>
            }
          />
        ) : null}
      </div>
    </main>
  );
}

export function MentorshipScreen() {
  const id = useSearchParams().get("id");
  return id ? <ConversationScreen key={id} id={id} /> : <MentorshipIndex />;
}
