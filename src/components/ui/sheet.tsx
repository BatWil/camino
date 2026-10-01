"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, m, useDragControls, type PanInfo } from "motion/react";
import { cn } from "@/utils/cn";

export const SHEET_SPRING = { type: "spring", damping: 32, stiffness: 380, mass: 0.9 } as const;

/**
 * Drag a bottom panel down to dismiss it (distance or a quick flick). Only the handle area starts
 * the drag, so the panel's own content keeps scrolling normally.
 */
export function useDragToClose(onClose: () => void) {
  const controls = useDragControls();
  return {
    panelProps: {
      drag: "y" as const,
      dragControls: controls,
      dragListener: false,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: { top: 0, bottom: 0.6 },
      onDragEnd: (_: unknown, info: PanInfo) => {
        if (info.offset.y > 110 || info.velocity.y > 600) onClose();
      },
    },
    handleProps: {
      onPointerDown: (e: React.PointerEvent) => {
        if ((e.target as Element).closest("button, a, input")) return;
        controls.start(e);
      },
      style: { touchAction: "none" } as React.CSSProperties,
    },
  };
}

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

  const dark = tone === "dark";
  const { panelProps, handleProps } = useDragToClose(onClose);
  return (
    <AnimatePresence>
      {open ? (
        <>
          <m.div
            key="scrim"
            className="fixed inset-0 z-[55] bg-ink/55"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <m.div
            key="panel"
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[56] mx-auto flex max-h-[85dvh] max-w-[600px] flex-col gap-3 overflow-y-auto rounded-t-[30px] px-5 pt-5 outline-none",
              dark ? "bg-ink text-paper" : "bg-paper text-ink",
              className,
            )}
            style={{ paddingBottom: "calc(var(--safe-bottom) + 20px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SHEET_SPRING}
            {...panelProps}
          >
            <div className="-mx-5 -mt-5 flex flex-col gap-3 px-5 pt-3 select-none" {...handleProps}>
              <span
                className={cn("mx-auto h-1.5 w-10 shrink-0 rounded-full", dark ? "bg-white/20" : "bg-ink/15")}
                aria-hidden
              />
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-[17px] font-bold">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    dark ? "bg-white/10" : "bg-white",
                  )}
                >
                  <X className="size-[18px]" aria-hidden />
                </button>
              </div>
            </div>
            {children}
          </m.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
