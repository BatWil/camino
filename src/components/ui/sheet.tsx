"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

/** Accessible bottom sheet (dialog) used across reading/prayer flows. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  tone = "light",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const dark = tone === "dark";
  return (
    <>
      <div className="animate-fade-in fixed inset-0 z-[55] bg-ink/55" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-sheet-in pb-safe fixed inset-x-0 bottom-0 z-[56] mx-auto flex max-h-[85dvh] max-w-[600px] flex-col gap-3 overflow-y-auto rounded-t-[30px] p-5 outline-none",
          dark ? "bg-ink text-paper" : "bg-paper text-ink",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[17px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={cn("flex size-10 items-center justify-center rounded-full", dark ? "bg-white/10" : "bg-white")}
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
