"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppError } from "@/types/result";
import { cn } from "@/utils/cn";
import type { JoinedChurch } from "../data/church.repository";
import {
  CHURCH_CODE_MAX,
  CHURCH_CODE_MIN,
  extractChurchCode,
  isCompleteChurchCode,
  normalizeChurchCode,
} from "../domain/church-code";
import { useChurchPreview, useJoinChurch } from "../hooks/use-church-join";
import { QrScanner } from "./qr-scanner";

/**
 * Screen 4b body: code boxes, church preview card, "Escanear QR", "Unirme" and
 * "Aún no tengo iglesia · continuar". Used in onboarding (step 2) and /unirse.
 */
export function ChurchJoinPanel({
  initialCode = "",
  onJoined,
  onSkip,
  skipLabel = "Aún no tengo iglesia · continuar",
}: {
  initialCode?: string;
  onJoined: (church: JoinedChurch) => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const [code, setCode] = useState(() => normalizeChurchCode(initialCode));
  const [method, setMethod] = useState<"code" | "qr" | "link">(initialCode ? "link" : "code");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useChurchPreview(code);
  const join = useJoinChurch();

  const complete = isCompleteChurchCode(code);
  const boxes = Math.max(CHURCH_CODE_MIN, code.length);
  const notFound = complete && preview.isSuccess && preview.data === null;

  const submit = () => {
    if (!complete || !preview.data) return;
    join.mutate({ code, method }, { onSuccess: (church) => onJoined(church) });
  };

  const onScan = (text: string) => {
    setScanning(false);
    const scanned = extractChurchCode(text);
    if (scanned) {
      setCode(scanned);
      setMethod("qr");
      setScanError(null);
    } else {
      setScanError("Ese QR no es de una iglesia en Camino.");
    }
  };

  const joinError = join.error instanceof AppError ? join.error.message : join.error ? "No pudimos unirte." : null;

  return (
    <div className="flex flex-1 flex-col gap-3.5">
      {/* One real input drives the visual boxes (keyboard, paste and screen readers work as usual). */}
      <label className="relative block cursor-text" onClick={() => inputRef.current?.focus()}>
        <span className="sr-only">Código de tu iglesia</span>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            setCode(normalizeChurchCode(e.target.value));
            setMethod("code");
            join.reset();
          }}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={CHURCH_CODE_MAX}
          className="peer absolute inset-0 size-full opacity-0"
          aria-describedby="church-code-status"
        />
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${boxes}, minmax(0, 1fr))` }} aria-hidden>
          {Array.from({ length: boxes }, (_, i) => {
            const char = code[i];
            const active = i === code.length;
            return (
              <div
                key={i}
                className={cn(
                  "flex h-[60px] items-center justify-center rounded-[14px] font-display text-2xl font-black",
                  char ? "bg-ink text-stage-encuentra" : active ? "border-2 border-ink bg-white" : "bg-white/60",
                  boxes > 8 && "text-xl",
                )}
              >
                {char ?? ""}
              </div>
            );
          })}
        </div>
      </label>

      <div id="church-code-status" aria-live="polite">
        {preview.data ? (
          <div className="mt-1.5 flex items-center gap-3.5 rounded-[22px] bg-white px-[18px] py-4">
            <div className="photo-stone size-12 flex-none rounded-[14px]" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">{preview.data.name}</span>
              <span className="text-[13px] text-ink/60">
                Ministerio de Jóvenes{preview.data.city ? ` · ${preview.data.city}` : ""}
              </span>
            </div>
          </div>
        ) : null}
        {notFound ? (
          <p className="m-0 text-sm font-semibold">No encontramos una iglesia con ese código. Revísalo con tu líder.</p>
        ) : null}
        {preview.isError ? (
          <p className="m-0 text-sm font-semibold">No pudimos buscar el código. Revisa tu conexión.</p>
        ) : null}
        {scanError ? <p className="m-0 text-sm font-semibold">{scanError}</p> : null}
        {joinError ? (
          <p role="alert" className="m-0 text-sm font-semibold">
            {joinError}
          </p>
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="md"
        block
        className="h-[52px] border-[1.5px] border-ink text-[15px] font-semibold"
        onClick={() => setScanning(true)}
      >
        Escanear QR
      </Button>

      <div className="flex-1" />
      <Button
        variant="ink"
        size="lg"
        block
        className="h-[58px]"
        disabled={!preview.data}
        loading={join.isPending}
        onClick={submit}
      >
        Unirme
      </Button>
      {onSkip ? (
        <button type="button" onClick={onSkip} className="min-h-11 text-center text-[13px] font-semibold">
          {skipLabel}
        </button>
      ) : null}

      {scanning ? <QrScanner onResult={onScan} onClose={() => setScanning(false)} /> : null}
    </div>
  );
}
