"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { OptionList } from "@/features/onboarding/components/option-list";
import { PhotoPicker } from "@/features/onboarding/components/photo-step";
import { EXPECTATION_OPTIONS, GROWTH_OPTIONS } from "@/features/onboarding/domain/options";
import type { Expectation, GrowthArea } from "@/lib/supabase/database.types";
import { profileRepository } from "../data/profile.repository";
import type { Profile } from "../domain/profile";
import { useProfile } from "../hooks/use-profile";

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function PreferencesForm({ profile }: { profile: Profile }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [growth, setGrowth] = useState<GrowthArea[]>(profile.growth_areas);
  const [expectations, setExpectations] = useState<Expectation[]>(profile.expectations);
  const save = useMutation({
    mutationFn: () => profileRepository.updatePreferences(user!.id, { growthAreas: growth, expectations }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
  const valid = growth.length > 0 && expectations.length > 0;

  return (
    <>
      <section className="flex flex-col gap-3 px-5">
        <h2 className="m-0 text-[17px] font-bold">Quiero fortalecer</h2>
        <OptionList
          label="Quiero fortalecer"
          options={GROWTH_OPTIONS}
          selected={growth}
          onToggle={(v) => setGrowth(toggle(growth, v))}
          multiple
          dark={false}
          columns={2}
        />
      </section>
      <section className="flex flex-col gap-3 px-5">
        <h2 className="m-0 text-[17px] font-bold">Espero encontrar</h2>
        <OptionList
          label="Espero encontrar"
          options={EXPECTATION_OPTIONS}
          selected={expectations}
          onToggle={(v) => setExpectations(toggle(expectations, v))}
          multiple
          dark={false}
        />
      </section>
      <div className="flex flex-col gap-2 px-5">
        <p aria-live="polite" className="m-0 min-h-5 text-center text-sm font-semibold">
          {save.isSuccess
            ? "Guardado ✦"
            : save.isError
              ? "No pudimos guardar. Inténtalo de nuevo."
              : !valid
                ? "Elige al menos una opción en cada sección."
                : ""}
        </p>
        <Button variant="ink" size="lg" block loading={save.isPending} disabled={!valid} onClick={() => save.mutate()}>
          Guardar
        </Button>
      </div>
    </>
  );
}

/** Perfil → Mi foto e intereses. Private to the person. */
export function PreferencesScreen() {
  const profile = useProfile();
  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex items-center gap-3 px-5 pt-4">
        <Link
          href="/perfil"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="m-0 font-display-x text-[26px]">Mi foto e intereses</h1>
      </header>
      <PhotoPicker />
      {profile.data ? <PreferencesForm profile={profile.data} /> : <Skeleton className="mx-5 h-96" />}
    </div>
  );
}
