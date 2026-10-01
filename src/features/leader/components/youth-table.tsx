"use client";

import { stageTheme } from "@/features/journey/domain/stages";
import { activityLabel } from "@/features/mentorship/domain/conversation";
import type { YouthRow } from "../data/leader.repository";
import { shortName } from "../domain/leader";

/** "Jóvenes · Solo datos de acompañamiento" (screen 3a). Never private content. */
export function YouthTable({
  rows,
  showMentor = false,
  renderAction,
}: {
  rows: YouthRow[];
  showMentor?: boolean;
  renderAction?: (row: YouthRow) => React.ReactNode;
}) {
  const cols = showMentor
    ? "md:grid-cols-[1.6fr_1fr_1.2fr_1.2fr_1fr_1fr_auto]"
    : "md:grid-cols-[1.6fr_1fr_1.2fr_1.2fr_1fr]";
  return (
    <div role="table" aria-label="Jóvenes" className="flex flex-col">
      <div
        role="row"
        className={`hidden gap-2.5 border-b border-ink/[.08] py-2.5 font-mono text-[10px] font-semibold tracking-[.08em] text-ink/50 md:grid ${cols}`}
      >
        <span role="columnheader">NOMBRE</span>
        <span role="columnheader">ETAPA</span>
        <span role="columnheader">PLAN ACTUAL</span>
        <span role="columnheader">PARTICIPACIÓN</span>
        <span role="columnheader">GRUPO</span>
        {showMentor ? <span role="columnheader">MENTOR</span> : null}
        {showMentor ? (
          <span role="columnheader" className="sr-only">
            Acciones
          </span>
        ) : null}
      </div>
      {rows.map((r) => {
        const theme = r.stage_key ? stageTheme(r.stage_key) : null;
        const activity = activityLabel(r.last_active);
        return (
          <div
            role="row"
            key={r.user_id}
            className={`grid grid-cols-2 items-center gap-2.5 border-b border-ink/[.06] py-[13px] text-sm last:border-0 ${cols}`}
          >
            <span role="cell" className="col-span-2 flex items-center gap-2.5 font-semibold md:col-span-1">
              <span className="size-[30px] flex-none rounded-full bg-stone" aria-hidden />
              {shortName(r.name)}
              {r.is_mentor ? <span className="eyebrow text-violet">Mentor</span> : null}
            </span>
            <span role="cell">
              {theme && r.stage_name ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                  style={{ background: theme.color, color: theme.onColor }}
                >
                  {r.stage_name}
                </span>
              ) : (
                <span className="text-ink/45">—</span>
              )}
            </span>
            <span role="cell">{r.current_plan ?? <span className="text-ink/45">—</span>}</span>
            <span role="cell" className={`font-semibold ${activity.active ? "text-[#1F8A4F]" : "text-ink/55"}`}>
              {activity.active ? "●" : "○"} {activity.text}
            </span>
            <span role="cell">{r.group_name ?? <span className="text-ink/45">—</span>}</span>
            {showMentor ? <span role="cell">{r.mentor_name ?? <span className="text-ink/45">—</span>}</span> : null}
            {showMentor ? <span role="cell">{renderAction?.(r)}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
