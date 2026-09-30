"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { QUICK_ACTIONS, type QuickAction } from "./nav-config";

/**
 * Bottom sheet opened by the central "+" (screen 2c). Ink panel over a 55% ink scrim.
 * On large screens the same panel is shown as a centered dialog.
 */
export function QuickActionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<QuickAction | null>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
      setPending(null);
    };
  }, [open, onClose]);

  if (!open) return null;

  const choose = (action: QuickAction) => {
    analytics.track("quick_action_opened", { action: action.id });
    if (action.href) {
      onClose();
      router.push(action.href);
    } else {
      setPending(action);
    }
  };

  return (
    <>
      <div className="animate-fade-in fixed inset-0 z-40 bg-ink/55" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-actions-title"
        className="animate-sheet-in fixed inset-x-[10px] z-50 mx-auto flex max-w-[480px] flex-col gap-3.5 rounded-[30px] bg-ink p-[22px] text-paper lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2"
        style={{ bottom: "calc(100px + var(--safe-bottom))" }}
      >
        <h2 id="quick-actions-title" className="m-0 font-display-x text-[22px]">
          ¿Qué quieres hacer?
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => choose(a)}
              className="flex h-[84px] items-end rounded-[20px] p-3 text-left text-[15px] font-bold transition-transform active:scale-[0.97]"
              style={{ background: a.bg, color: a.color, gridColumn: a.wide ? "span 2" : undefined }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="m-0 min-h-5 text-[13px] text-paper/70">
          {pending ? `${pending.label} llega muy pronto a Camino.` : ""}
        </p>
      </div>
    </>
  );
}
