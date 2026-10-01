"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { hasAnyRole } from "@/features/churches/domain/access";
import { useAccess } from "@/features/churches/hooks/use-access";
import { conferenceDates, SESSION_STYLE } from "@/features/conferences/domain/conference";
import { requireSupabase } from "@/lib/supabase/client";
import type { ContentScope, Database, ResourceKind, SessionKind, Tables } from "@/lib/supabase/database.types";
import { AppError } from "@/types/result";

const input = "h-11 rounded-xl border-[1.5px] border-ink/15 bg-white px-3 text-sm focus:border-ink focus:outline-none";
type T = Database["public"]["Tables"];

async function run<Q extends PromiseLike<{ error: unknown }>>(q: Q, message: string) {
  const { error } = await q;
  if (error) throw new AppError("unknown", message, error);
}

function useScope() {
  const access = useAccess();
  const isPlatform = access.data ? hasAnyRole(access.data, ["PLATFORM_ADMIN"]) : false;
  const churchId = access.data?.roles.find((r) => r.role === "CHURCH_ADMIN" && r.churchId)?.churchId ?? null;
  const scope: ContentScope = isPlatform ? "PLATFORM" : "CHURCH";
  return {
    scope,
    churchId: isPlatform ? null : churchId,
    ready: Boolean(access.data),
    ok: isPlatform || Boolean(churchId),
  };
}

function Sessions({ conference }: { conference: Tables<"conferences"> }) {
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: ["admin", "sessions", conference.id],
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("conference_sessions")
        .select("*")
        .eq("conference_id", conference.id)
        .order("day")
        .order("starts_at");
      if (error) throw new AppError("unknown", "No pudimos cargar la agenda.", error);
      return data;
    },
  });
  const [f, setF] = useState({
    day: conference.starts_on,
    time: "09:00",
    kind: "workshop" as SessionKind,
    title: "",
    place: "",
  });
  const add = useMutation({
    mutationFn: (v: T["conference_sessions"]["Insert"]) =>
      run(requireSupabase().from("conference_sessions").insert(v), "No pudimos agregar la actividad."),
    onSuccess: () => {
      setF((s) => ({ ...s, title: "", place: "" }));
      void queryClient.invalidateQueries({ queryKey: ["admin", "sessions", conference.id] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      run(requireSupabase().from("conference_sessions").delete().eq("id", id), "No pudimos borrar."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sessions", conference.id] }),
  });
  return (
    <div className="flex flex-col gap-2">
      <form
        className="grid gap-2 md:grid-cols-[1fr_.7fr_1fr_2fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate({
            conference_id: conference.id,
            day: f.day,
            starts_at: f.time,
            kind: f.kind,
            title: f.title.trim(),
            place: f.place.trim() || null,
          });
        }}
      >
        <input
          type="date"
          aria-label="Día"
          min={conference.starts_on}
          max={conference.ends_on}
          className={input}
          value={f.day}
          onChange={(e) => setF((s) => ({ ...s, day: e.target.value }))}
        />
        <input
          type="time"
          aria-label="Hora"
          className={input}
          value={f.time}
          onChange={(e) => setF((s) => ({ ...s, time: e.target.value }))}
        />
        <select
          aria-label="Tipo"
          className={input}
          value={f.kind}
          onChange={(e) => setF((s) => ({ ...s, kind: e.target.value as SessionKind }))}
        >
          {(Object.keys(SESSION_STYLE) as SessionKind[]).map((k) => (
            <option key={k} value={k}>
              {SESSION_STYLE[k].tag}
            </option>
          ))}
        </select>
        <input
          aria-label="Actividad"
          placeholder="Actividad"
          maxLength={120}
          className={input}
          value={f.title}
          onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))}
        />
        <input
          aria-label="Lugar"
          placeholder="Lugar"
          maxLength={80}
          className={input}
          value={f.place}
          onChange={(e) => setF((s) => ({ ...s, place: e.target.value }))}
        />
        <Button
          type="submit"
          variant="ink"
          size="sm"
          className="h-11"
          disabled={f.title.trim().length < 2}
          loading={add.isPending}
        >
          Agregar
        </Button>
      </form>
      {sessions.data?.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
          <span>
            {s.day} · {s.starts_at.slice(0, 5)} · <strong>{SESSION_STYLE[s.kind].tag}</strong> · {s.title}
            {s.place ? ` · ${s.place}` : ""}
          </span>
          <button type="button" onClick={() => remove.mutate(s.id)} className="text-xs font-semibold text-coral">
            Quitar
          </button>
        </div>
      ))}
    </div>
  );
}

/** Admin · Ministerios: conferences + agenda, resources and calling stories. */
export function AdminMinistries() {
  const { scope, churchId, ready, ok } = useScope();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });
  const conferences = useQuery({
    queryKey: ["admin", "conferences", scope, churchId],
    queryFn: async () => {
      let q = requireSupabase()
        .from("conferences")
        .select("*")
        .eq("scope", scope)
        .order("starts_on", { ascending: false });
      q = churchId ? q.eq("church_id", churchId) : q.is("church_id", null);
      const { data, error } = await q;
      if (error) throw new AppError("unknown", "No pudimos cargar las conferencias.", error);
      return data;
    },
    enabled: ready && ok,
  });
  const resources = useQuery({
    queryKey: ["admin", "resources", scope, churchId],
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("resources")
        .select("*")
        .eq("scope", scope)
        .order("position");
      if (error) throw new AppError("unknown", "No pudimos cargar los recursos.", error);
      return data;
    },
    enabled: ready && ok,
  });
  const [c, setC] = useState({
    title: "",
    hub: "",
    tagline: "",
    start: "",
    end: "",
    location: "",
    badge: "",
    highlights: "",
    deadline: "",
    url: "",
  });
  const createConf = useMutation({
    mutationFn: () =>
      run(
        requireSupabase()
          .from("conferences")
          .insert({
            scope,
            church_id: churchId,
            title: c.title.trim(),
            hub_title: c.hub.trim() || null,
            tagline: c.tagline.trim() || null,
            starts_on: c.start,
            ends_on: c.end,
            location: c.location.trim() || null,
            badge: c.badge.trim() || null,
            highlights: c.highlights
              .split(",")
              .map((h) => h.trim())
              .filter(Boolean)
              .slice(0, 12),
            fine_arts_deadline: c.deadline || null,
            registration_url: c.url.trim() || null,
          }),
        "No pudimos crear la conferencia.",
      ),
    onSuccess: () => {
      setC({
        title: "",
        hub: "",
        tagline: "",
        start: "",
        end: "",
        location: "",
        badge: "",
        highlights: "",
        deadline: "",
        url: "",
      });
      void refresh();
    },
  });
  const publish = useMutation({
    mutationFn: (v: { id: string; on: boolean }) =>
      run(requireSupabase().from("conferences").update({ is_published: v.on }).eq("id", v.id), "No pudimos publicar."),
    onSuccess: refresh,
  });
  const [r, setR] = useState({
    kind: "book" as ResourceKind,
    title: "",
    eyebrow: "",
    description: "",
    color: "#3D8BFF",
    url: "",
  });
  const createRes = useMutation({
    mutationFn: () =>
      run(
        requireSupabase()
          .from("resources")
          .insert({
            scope,
            church_id: churchId,
            kind: r.kind,
            title: r.title.trim(),
            eyebrow: r.eyebrow.trim() || null,
            description: r.description.trim() || null,
            color: r.color,
            url: r.url.trim() || null,
            position: (resources.data?.length ?? 0) + 1,
          }),
        "No pudimos crear el recurso.",
      ),
    onSuccess: () => {
      setR((s) => ({ ...s, title: "", eyebrow: "", description: "", url: "" }));
      void refresh();
    },
  });
  const toggleRes = useMutation({
    mutationFn: (v: { id: string; on: boolean }) =>
      run(requireSupabase().from("resources").update({ is_published: v.on }).eq("id", v.id), "No pudimos actualizar."),
    onSuccess: refresh,
  });
  const [s, setS] = useState({ quote: "", author: "" });
  const createStory = useMutation({
    mutationFn: () =>
      run(
        requireSupabase()
          .from("calling_stories")
          .insert({ scope, church_id: churchId, quote: s.quote.trim(), author: s.author.trim() }),
        "No pudimos guardar la historia.",
      ),
    onSuccess: () => setS({ quote: "", author: "" }),
  });

  if (ready && !ok) return <StateView kind="unauthorized" />;
  const err = [createConf.error, createRes.error, createStory.error].find(Boolean);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display-x text-[40px] leading-[.9] tracking-[-.02em]">Ministerios</h1>
        <p className="m-0 text-sm text-ink/60">
          {scope === "PLATFORM" ? "Contenido para todas las iglesias." : "Contenido solo para tu iglesia."} Las
          preguntas del Quiz Bíblico se cargan desde <code>supabase/content</code>.
        </p>
      </div>
      {err ? (
        <p role="alert" className="m-0 text-sm font-semibold text-coral">
          {err.message}
        </p>
      ) : null}

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="conf-title">
        <h2 id="conf-title" className="m-0 text-[17px] font-bold">
          Conferencias
        </h2>
        <form
          className="grid gap-2 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createConf.mutate();
          }}
        >
          <input
            aria-label="Título"
            placeholder="Conferencia Nacional de Jóvenes"
            className={input}
            maxLength={120}
            value={c.title}
            onChange={(e) => setC((v) => ({ ...v, title: e.target.value }))}
          />
          <input
            aria-label="Título en el hub"
            placeholder="¿Quién irá? St. Louis 2027"
            className={input}
            maxLength={60}
            value={c.hub}
            onChange={(e) => setC((v) => ({ ...v, hub: e.target.value }))}
          />
          <input
            aria-label="Frase"
            placeholder="Prepárate para un encuentro inolvidable con Dios."
            className={`${input} md:col-span-2`}
            maxLength={200}
            value={c.tagline}
            onChange={(e) => setC((v) => ({ ...v, tagline: e.target.value }))}
          />
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Empieza
            <input
              type="date"
              className={input}
              value={c.start}
              onChange={(e) => setC((v) => ({ ...v, start: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Termina
            <input
              type="date"
              className={input}
              value={c.end}
              onChange={(e) => setC((v) => ({ ...v, end: e.target.value }))}
            />
          </label>
          <input
            aria-label="Lugar"
            placeholder="St. Louis, MO"
            className={input}
            maxLength={120}
            value={c.location}
            onChange={(e) => setC((v) => ({ ...v, location: e.target.value }))}
          />
          <input
            aria-label="Sello"
            placeholder="Sello (ej. STL·27)"
            className={input}
            maxLength={12}
            value={c.badge}
            onChange={(e) => setC((v) => ({ ...v, badge: e.target.value }))}
          />
          <input
            aria-label="Qué hay"
            placeholder="Qué hay: Deportes, Bellas Artes, Talleres…"
            className={`${input} md:col-span-2`}
            value={c.highlights}
            onChange={(e) => setC((v) => ({ ...v, highlights: e.target.value }))}
          />
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Cierre de Bellas Artes (opcional)
            <input
              type="date"
              className={input}
              value={c.deadline}
              onChange={(e) => setC((v) => ({ ...v, deadline: e.target.value }))}
            />
          </label>
          <input
            aria-label="Registro externo"
            placeholder="https://… registro oficial (opcional)"
            className={input}
            value={c.url}
            onChange={(e) => setC((v) => ({ ...v, url: e.target.value }))}
          />
          <Button
            type="submit"
            variant="ink"
            size="sm"
            className="h-11 md:justify-self-start"
            disabled={
              c.title.trim().length < 2 ||
              !c.start ||
              !c.end ||
              c.end < c.start ||
              (Boolean(c.url) && !c.url.startsWith("https://"))
            }
            loading={createConf.isPending}
          >
            Crear (borrador)
          </Button>
        </form>
        {conferences.isPending ? <Skeleton className="h-16 rounded-2xl" /> : null}
        {conferences.data?.map((conf) => (
          <details key={conf.id} className="rounded-2xl border border-ink/10 p-4">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {conf.title} · {conferenceDates(conf.starts_on, conf.ends_on)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  publish.mutate({ id: conf.id, on: !conf.is_published });
                }}
                className={`flex h-9 items-center rounded-full px-3 text-xs font-semibold ${conf.is_published ? "bg-stage-crece" : "border-[1.5px] border-ink/20"}`}
              >
                {conf.is_published ? "Publicada" : "Borrador · publicar"}
              </button>
            </summary>
            <div className="pt-3">
              <Sessions conference={conf} />
            </div>
          </details>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="res-title">
        <h2 id="res-title" className="m-0 text-[17px] font-bold">
          Recursos
        </h2>
        <form
          className="grid gap-2 md:grid-cols-[1fr_2fr_1.5fr_.6fr]"
          onSubmit={(e) => {
            e.preventDefault();
            createRes.mutate();
          }}
        >
          <select
            aria-label="Tipo"
            className={input}
            value={r.kind}
            onChange={(e) => setR((v) => ({ ...v, kind: e.target.value as ResourceKind }))}
          >
            <option value="book">Libro</option>
            <option value="guided_journal">Diario guiado (destacado)</option>
            <option value="link">Enlace</option>
          </select>
          <input
            aria-label="Título"
            placeholder="Título"
            maxLength={120}
            className={input}
            value={r.title}
            onChange={(e) => setR((v) => ({ ...v, title: e.target.value }))}
          />
          <input
            aria-label="Enlace"
            placeholder="https://… (opcional)"
            className={input}
            value={r.url}
            onChange={(e) => setR((v) => ({ ...v, url: e.target.value }))}
          />
          <input
            aria-label="Color"
            type="color"
            className={`${input} p-1`}
            value={r.color}
            onChange={(e) => setR((v) => ({ ...v, color: e.target.value }))}
          />
          <input
            aria-label="Etiqueta"
            placeholder="Etiqueta (ej. Devocional del estudiante)"
            maxLength={60}
            className={`${input} md:col-span-2`}
            value={r.eyebrow}
            onChange={(e) => setR((v) => ({ ...v, eyebrow: e.target.value }))}
          />
          <input
            aria-label="Descripción"
            placeholder="Descripción"
            maxLength={500}
            className={`${input} md:col-span-2`}
            value={r.description}
            onChange={(e) => setR((v) => ({ ...v, description: e.target.value }))}
          />
          <Button
            type="submit"
            variant="ink"
            size="sm"
            className="h-11 md:justify-self-start"
            disabled={r.title.trim().length < 2 || (Boolean(r.url) && !r.url.startsWith("https://"))}
            loading={createRes.isPending}
          >
            Agregar recurso
          </Button>
        </form>
        {resources.data?.map((res) => (
          <div key={res.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="size-4 rounded" style={{ background: res.color ?? "#D9D5CB" }} aria-hidden />
              {res.title}
            </span>
            <button
              type="button"
              onClick={() => toggleRes.mutate({ id: res.id, on: !res.is_published })}
              className={`flex h-8 items-center rounded-full px-3 text-xs font-semibold ${res.is_published ? "bg-stage-crece" : "border-[1.5px] border-ink/20"}`}
            >
              {res.is_published ? "Visible" : "Oculto"}
            </button>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-[22px]" aria-labelledby="story-title">
        <h2 id="story-title" className="m-0 text-[17px] font-bold">
          Historias de llamado
        </h2>
        <p className="m-0 text-xs text-ink/55">Publica solo historias reales y con permiso de la persona.</p>
        <form
          className="grid gap-2 md:grid-cols-[3fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            createStory.mutate();
          }}
        >
          <input
            aria-label="Frase"
            placeholder="“A los 16 sentí el llamado…”"
            maxLength={280}
            className={input}
            value={s.quote}
            onChange={(e) => setS((v) => ({ ...v, quote: e.target.value }))}
          />
          <input
            aria-label="Autor"
            placeholder="Autor"
            maxLength={80}
            className={input}
            value={s.author}
            onChange={(e) => setS((v) => ({ ...v, author: e.target.value }))}
          />
          <Button
            type="submit"
            variant="ink"
            size="sm"
            className="h-11"
            disabled={s.quote.trim().length < 5 || s.author.trim().length < 2}
            loading={createStory.isPending}
          >
            Publicar
          </Button>
        </form>
        {createStory.isSuccess ? <span className="text-sm text-[#1F8A4F]">Historia publicada ✓</span> : null}
      </section>
    </>
  );
}
