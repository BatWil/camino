"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { SplashState } from "@/components/layout/splash-state";
import { useCurrentChurch, useMyGroups } from "@/features/churches/hooks/use-access";
import { useMyMentor } from "@/features/mentorship/hooks/use-mentorship";
import type { PrayerCategory, PrayerPrivacy } from "@/lib/supabase/database.types";
import { AppError } from "@/types/result";
import { cn } from "@/utils/cn";
import type { Prayer } from "../data/prayer.repository";
import { CATEGORY_LABEL } from "../domain/prayer";
import { usePrayer, usePrayerMutations } from "../hooks/use-prayers";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as PrayerCategory[];

function Form({ prayer, verseRef }: { prayer: Prayer | null; verseRef: string | null }) {
  const router = useRouter();
  const groups = useMyGroups();
  const { church } = useCurrentChurch();
  const mentor = useMyMentor();
  const { create, update, remove } = usePrayerMutations();
  const [title, setTitle] = useState(prayer?.title ?? (verseRef ? `Orar con ${verseRef}` : ""));
  const [description, setDescription] = useState(prayer?.description ?? "");
  const [category, setCategory] = useState<PrayerCategory>(prayer?.category ?? "other");
  const [privacy, setPrivacy] = useState<PrayerPrivacy>(prayer?.privacy ?? "PRIVATE");
  const [groupId, setGroupId] = useState<string | null>(prayer?.group_id ?? null);
  const busy = create.isPending || update.isPending || remove.isPending;
  const error = [create.error, update.error, remove.error].find(Boolean);
  const firstGroup = groups.data?.[0]?.groupId ?? null;

  const options: Array<{ id: PrayerPrivacy; label: string; detail: string; disabled?: boolean }> = [
    { id: "PRIVATE", label: "Solo yo", detail: "Nadie más la ve." },
    {
      id: "GROUP",
      label: "Mi grupo",
      detail: groups.data?.length
        ? `La verán quienes están en ${groups.data.find((g) => g.groupId === (groupId ?? firstGroup))?.name}.`
        : "Aún no estás en un grupo.",
      disabled: !groups.data?.length,
    },
    {
      id: "CHURCH",
      label: "Mi iglesia",
      detail: church ? `La verán los miembros de ${church.churchName}.` : "Aún no estás en una iglesia.",
      disabled: !church,
    },
    {
      id: "MENTOR",
      label: "Mi mentor",
      detail: mentor.data
        ? `Solo la verá ${mentor.data.mentor_name ?? "tu mentor"}.`
        : "Disponible cuando tengas un mentor asignado.",
      disabled: !mentor.data,
    },
  ];

  const save = async () => {
    const input = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      privacy,
      group_id: privacy === "GROUP" ? (groupId ?? firstGroup) : null,
      church_id: privacy === "CHURCH" ? (church?.churchId ?? null) : null,
      verse_ref: prayer?.verse_ref ?? verseRef,
    };
    if (prayer) await update.mutateAsync({ id: prayer.id, ...input });
    else await create.mutateAsync(input);
    router.replace("/oracion");
  };

  return (
    <main className="pt-safe pb-safe min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-[600px] flex-col gap-5 px-5 pt-2 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h1 className="m-0 font-display-x text-[34px] leading-[.95]">{prayer ? "Tu petición" : "Nueva petición"}</h1>
        <TextField
          tone="light"
          label="¿Por qué quieres orar?"
          value={title}
          maxLength={140}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="prayer-desc" className="text-sm font-semibold">
            Cuéntale más (opcional)
          </label>
          <textarea
            id="prayer-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            className="rounded-[22px] border-[1.5px] border-ink/15 bg-white p-4 text-base focus:border-ink focus:outline-none"
          />
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">Tema</legend>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full px-3 py-2 text-[13px] font-semibold",
                  category === c ? "bg-ink text-white" : "bg-white",
                )}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Lock className="size-3.5" aria-hidden /> ¿Quién puede verla?
          </legend>
          {options.map((o) => (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[18px] border-2 bg-white p-4",
                privacy === o.id ? "border-ink" : "border-transparent",
                o.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="privacy"
                className="size-5 accent-[#0D0A26]"
                checked={privacy === o.id}
                disabled={o.disabled}
                onChange={() => setPrivacy(o.id)}
              />
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{o.label}</span>
                <span className="text-xs text-ink/60">{o.detail}</span>
              </span>
            </label>
          ))}
          {privacy === "GROUP" && (groups.data?.length ?? 0) > 1 ? (
            <select
              value={groupId ?? firstGroup ?? ""}
              onChange={(e) => setGroupId(e.target.value)}
              className="h-12 rounded-[14px] bg-white px-3 text-sm font-semibold"
              aria-label="Grupo"
            >
              {groups.data!.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : null}
        </fieldset>

        {error ? (
          <p role="alert" className="m-0 text-sm font-semibold text-coral">
            {error instanceof AppError ? error.message : "No pudimos guardar."}
          </p>
        ) : null}
        <div className="flex gap-2">
          {prayer ? (
            <Button
              variant="ghost"
              size="lg"
              className="border-[1.5px] border-ink/20"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("¿Borrar esta petición?")) return;
                await remove.mutateAsync(prayer.id);
                router.replace("/oracion");
              }}
            >
              Borrar
            </Button>
          ) : null}
          <Button variant="ink" size="lg" block loading={busy} disabled={!title.trim()} onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </main>
  );
}

export function PrayerEditor({ id, verseRef }: { id: string | null; verseRef: string | null }) {
  const prayer = usePrayer(id);
  if (id && prayer.isPending) return <SplashState />;
  return <Form prayer={prayer.data ?? null} verseRef={verseRef} />;
}
