"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";

export type FieldTone = "dark" | "light";

const INPUT: Record<FieldTone, string> = {
  dark: "border-paper/20 bg-white/[.08] text-paper placeholder:text-paper/40 focus:border-lime",
  light: "border-ink/15 bg-white text-ink placeholder:text-ink/40 focus:border-ink",
};

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  tone?: FieldTone;
  hint?: ReactNode;
  error?: string | null;
}

/** Labeled input in the design language (56px, 22px radius). Password fields get a show/hide toggle. */
export function TextField({ label, tone = "dark", hint, error, type = "text", className, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = error || hint ? hintId : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-14 w-full rounded-[22px] border-[1.5px] px-5 text-base focus:outline-none",
            isPassword && "pr-14",
            INPUT[tone],
            error && "border-coral",
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full opacity-70"
          >
            {reveal ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        ) : null}
      </div>
      {error || hint ? (
        <p id={hintId} className={cn("m-0 text-[13px]", error ? "text-coral" : "opacity-60")}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
