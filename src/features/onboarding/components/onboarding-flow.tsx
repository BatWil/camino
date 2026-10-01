"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TextField } from "@/components/ui/text-field";
import { ChurchJoinPanel } from "@/features/churches/components/church-join-panel";
import { clearPendingChurchCode, readPendingChurchCode } from "@/features/churches/domain/pending-join";
import { useCurrentChurch } from "@/features/churches/hooks/use-access";
import { analytics } from "@/lib/analytics";
import { AppError } from "@/types/result";
import { onboardingRepository } from "../data/onboarding.repository";
import { birthDateProblem, canContinue, initialOnboardingState, onboardingReducer } from "../domain/flow";
import { EXPECTATION_OPTIONS, FAITH_OPTIONS, GROWTH_OPTIONS } from "../domain/options";
import { OnboardingFinal } from "./onboarding-final";
import { OptionList } from "./option-list";
import { PhotoPicker } from "./photo-step";
import { StepFooter, StepFrame } from "./step-frame";

const REASSURANCE = "No hay respuestas incorrectas. Puedes cambiarlo luego.";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Onboarding · 6 steps (design progress bar) + final screen 2b. */
export function OnboardingFlow({ initialName }: { initialName: string }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialName, initialOnboardingState);
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCode] = useState(() => readPendingChurchCode() ?? "");
  const { church: existingChurch } = useCurrentChurch();
  const churchName = state.churchName ?? existingChurch?.churchName ?? null;
  const router = useRouter();
  const queryClient = useQueryClient();

  const next = () => {
    setTouched(true);
    if (canContinue(state)) {
      setTouched(false);
      dispatch({ type: "next" });
    }
  };
  const back = () => dispatch({ type: "back" });

  const finish = async () => {
    if (!canContinue(state) || !state.faithStatus) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onboardingRepository.complete({
        displayName: state.displayName,
        birthDate: state.birthDate,
        faithStatus: state.faithStatus,
        growthAreas: state.growthAreas,
        expectations: state.expectations,
      });
      analytics.track("onboarding_completed", { stage_key: result.stageKey });
      dispatch({ type: "completed", result });
    } catch (err) {
      setSubmitError(err instanceof AppError ? err.message : "No pudimos guardar tus respuestas.");
    } finally {
      setSubmitting(false);
    }
  };

  const start = async () => {
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    router.replace("/inicio");
  };

  switch (state.step) {
    case 1:
      return (
        <StepFrame tone="ink" step={1} title="Cuéntanos de ti" caveat="bienvenido ✦">
          <div className="flex flex-col gap-4 pt-2">
            <TextField
              label="¿Cómo te llamas?"
              autoComplete="given-name"
              maxLength={80}
              value={state.displayName}
              onChange={(e) => dispatch({ type: "set", patch: { displayName: e.target.value } })}
              error={touched && !state.displayName.trim() ? "¿Cómo te llamas?" : null}
            />
            <TextField
              label="Fecha de nacimiento"
              type="date"
              max={todayIso()}
              min="1900-01-01"
              value={state.birthDate}
              onChange={(e) => dispatch({ type: "set", patch: { birthDate: e.target.value } })}
              hint="Es privada: solo tú la ves."
              error={touched ? birthDateProblem(state.birthDate) : null}
            />
          </div>
          <StepFooter tone="ink" onClick={next} />
        </StepFrame>
      );

    case 2:
      return (
        <StepFrame
          tone="yellow"
          step={2}
          onBack={back}
          title="¿De qué iglesia eres?"
          description="Tu líder te dio un código. Así ves tus eventos, tu grupo y tu mentor."
        >
          {churchName ? (
            <>
              <div className="mt-1.5 rounded-[22px] bg-white px-[18px] py-4" role="status">
                <span className="eyebrow">Ya eres parte de</span>
                <p className="m-0 mt-1 text-[17px] font-bold">{churchName}</p>
              </div>
              <StepFooter tone="yellow" onClick={next} />
            </>
          ) : (
            <ChurchJoinPanel
              initialCode={pendingCode}
              onJoined={(church) => {
                clearPendingChurchCode();
                dispatch({ type: "joinedChurch", name: church.name });
                dispatch({ type: "next" });
              }}
              onSkip={next}
            />
          )}
        </StepFrame>
      );

    case 3:
      return (
        <StepFrame
          tone="paper"
          step={3}
          onBack={back}
          title="Tu foto"
          caveat="opcional"
          description="Por ahora es privada: solo tú la ves."
        >
          <PhotoPicker />
          <StepFooter
            tone="paper"
            onClick={next}
            secondary={
              <button type="button" onClick={next} className="min-h-11 text-center text-[13px] font-semibold">
                Saltar por ahora
              </button>
            }
          />
        </StepFrame>
      );

    case 4:
      return (
        <StepFrame
          tone="violet"
          step={4}
          onBack={back}
          caveat={`queremos conocerte, ${state.displayName.trim().split(/\s+/)[0]}`}
          title="¿Cómo describirías tu camino de fe?"
        >
          <div className="mt-3.5">
            <OptionList
              label="Tu camino de fe"
              options={FAITH_OPTIONS}
              selected={state.faithStatus ? [state.faithStatus] : []}
              onToggle={(v) => dispatch({ type: "set", patch: { faithStatus: v } })}
              dark
            />
          </div>
          <StepFooter tone="violet" onClick={next} disabled={!canContinue(state)} note={REASSURANCE} />
        </StepFrame>
      );

    case 5:
      return (
        <StepFrame
          tone="lime"
          step={5}
          onBack={back}
          title="¿Qué quieres fortalecer?"
          description="Elige todas las que quieras."
        >
          <OptionList
            label="Qué quieres fortalecer"
            options={GROWTH_OPTIONS}
            selected={state.growthAreas}
            onToggle={(v) => dispatch({ type: "toggleGrowth", value: v })}
            multiple
            dark={false}
            columns={2}
          />
          <StepFooter tone="lime" onClick={next} disabled={!canContinue(state)} note={REASSURANCE} />
        </StepFrame>
      );

    case 6:
      return (
        <StepFrame
          tone="coral"
          step={6}
          onBack={back}
          title="¿Qué esperas encontrar aquí?"
          description="Puede ser más de una."
        >
          <OptionList
            label="Qué esperas encontrar"
            options={EXPECTATION_OPTIONS}
            selected={state.expectations}
            onToggle={(v) => dispatch({ type: "toggleExpectation", value: v })}
            multiple
            dark={false}
          />
          {submitError ? (
            <p role="alert" className="m-0 text-sm font-semibold">
              {submitError}
            </p>
          ) : null}
          <StepFooter
            tone="coral"
            label="Ver mi camino"
            onClick={finish}
            loading={submitting}
            disabled={!canContinue(state)}
            note={REASSURANCE}
          />
        </StepFrame>
      );

    case "done":
      return <OnboardingFinal state={{ ...state, churchName }} onStart={start} />;
  }
}
