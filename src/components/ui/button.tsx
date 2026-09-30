import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Pill buttons as drawn in the design:
 *  - lime:    "Crear mi cuenta", "Continuar mi camino", "Comenzar"
 *  - ink:     "Continuar" (devotional card), "Inscribirme"
 *  - outline: "Google" / "Apple" on ink backgrounds
 *  - violet:  "Entrar en oración"
 *  - white:   "Ver evento"
 */
export type ButtonVariant = "lime" | "ink" | "outline" | "violet" | "white" | "ghost";
export type ButtonSize = "lg" | "md" | "sm";

const VARIANTS: Record<ButtonVariant, string> = {
  lime: "bg-lime text-ink",
  ink: "bg-ink text-white",
  outline: "border-[1.5px] border-paper/30 text-paper bg-transparent",
  violet: "bg-violet text-white",
  white: "bg-white text-ink",
  ghost: "bg-transparent text-current",
};

const SIZES: Record<ButtonSize, string> = {
  lg: "h-14 px-6 text-base font-bold", // 56px
  md: "h-[50px] px-6 text-[15px] font-bold",
  sm: "h-10 px-4 text-[13px] font-semibold", // 40px
};

export function buttonClasses(variant: ButtonVariant = "lime", size: ButtonSize = "lg", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full select-none",
    "transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant, size, block, loading, className, children, disabled, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={buttonClasses(variant, size, cn(block && "w-full", className))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

export function ButtonLink({ variant, size, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, cn(block && "w-full", className))} {...rest} />;
}
