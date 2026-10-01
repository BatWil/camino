"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSupabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { AppError } from "@/types/result";
import { useLeaderChurch } from "../hooks/use-leader";
import { LeaderNoChurch } from "./leader-dashboard";

type Series = Tables<"series">;
const input = "h-11 rounded-xl border-[1.5px] border-ink/15 bg-white px-3 text-sm focus:border-ink focus:outline-none";

async function listSeries(churchId: string): Promise<Series[]> {
  const { data, error } = await requireSupabase()
    .from("series")
    .select("*")
    .eq("church_id", churchId)
    .order("updated_at", { ascending: false });
  if (error) throw new AppError("unknown", "No pudimos cargar las series.", error);
  return data;
}

function SeriesForm({ churchId, series, onDone }: { churchId: string; series: Series | null; onDone: () => void }) {
  const [title, setTitle] = useState(series?.title ?? "");
  const [total, setTotal] = useState(String(series?.total_topics ?? 4));
  const [current, setCurrent] = useState(String(series?.current_topic ?? 1));
  const [topic, setTopic] = useState(series?.current_title ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const values = {
        title: title.trim(),
        total_topics: Number(total),
        current_topic: Math.min(Number(current), Number(total)),
        current_title: topic.trim() || null,
      };
      const sb = requireSupabase();
      const { error } = series
        ? await sb.from("series").update(values).eq("id", series.id)
        : await sb.from("series").insert({ church_id: churchId, ...values });
      if (error) throw new AppError("unknown", "No pudimos guardar la serie.", error);
    },
    onSuccess: onDone,
  });
  return (
    <form
      className="grid gap-2 md:grid-cols-[2fr_.6fr_.6fr_2fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <input
        aria-label="Serie"
        placeholder="Conforme a su corazón"
        className={input}
        maxLength={80}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        aria-label="Tema actual"
        type="number"
        min={1}
        max={52}
        className={input}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <input
        aria-label="Total de temas"
        type="number"
        min={1}
        max={52}
        className={input}
        value={total}
        onChange={(e) => setTotal(e.target.value)}
      />
      <input
        aria-label="Título del tema actual"
        placeholder="Título del tema actual"
        className={input}
        maxLength={120}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <Button
        type="submit"
        variant="ink"
        size="sm"
        className="h-11"
        disabled={title.trim().length < 2}
        loading={save.isPending}
      >
        {series ? "Guardar" : "Crear"}
      </Button>
      {save.isError ? (
        <p role="alert" className="m-0 text-sm text-coral md:col-span-5">
          {save.error.message}
        </p>
      ) : null}
    </form>
  );
}

/** Series: what the church is teaching now ("SERIE ACTUAL · TEMA 3 DE 6"). */
export function LeaderSeries() {
  const { churchId, isPending } = useLeaderChurch();
  const queryClient = useQueryClient();
  const series = useQuery({
    queryKey: ["leader", "series", churchId],
    queryFn: () => listSeries(churchId!),
    enabled: Boolean(churchId),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["leader", "series"] });
    void queryClient.invalidateQueries({ queryKey: ["series"] });
  };
  const activate = useMutation({
    mutationFn: async (s: Series) => {
      const { error } = await requireSupabase().from("series").update({ is_active: !s.is_active }).eq("id", s.id);
      if (error) throw new AppError("unknown", "No pudimos actualizar la serie.", error);
    },
    onSuccess: refresh,
  });
  if (!isPending && !churchId) return <LeaderNoChurch />;
  return (
    <>
      <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Series</h1>
      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]">
        <h2 className="m-0 text-[17px] font-bold">Nueva serie</h2>
        {churchId ? <SeriesForm churchId={churchId} series={null} onDone={refresh} /> : null}
      </section>
      {series.isPending ? <Skeleton className="h-24 rounded-3xl" /> : null}
      {series.data?.map((s) => (
        <section key={s.id} className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-ink/50">
              Tema {s.current_topic} de {s.total_topics}
            </span>
            <button
              type="button"
              onClick={() => activate.mutate(s)}
              className={`flex h-9 items-center rounded-full px-3 text-xs font-semibold ${s.is_active ? "bg-stage-encuentra" : "border-[1.5px] border-ink/20"}`}
            >
              {s.is_active ? "Activa" : "Inactiva"}
            </button>
          </div>
          <SeriesForm key={s.updated_at} churchId={churchId!} series={s} onDone={refresh} />
        </section>
      ))}
    </>
  );
}
