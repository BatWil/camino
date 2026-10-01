"use client";

import { useRef, type ReactNode } from "react";
import { animate, m, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Trash2 } from "lucide-react";
import { tap } from "@/lib/native/haptics";

const THRESHOLD = 110;

/**
 * Swipe a row to the left to delete it. The "Borrar" button behind the row is also reachable
 * by keyboard/screen reader, so the gesture is never the only way.
 */
export function SwipeToDelete({
  onDelete,
  label,
  children,
}: {
  onDelete: () => void;
  label: string;
  children: ReactNode;
}) {
  const x = useMotionValue(0);
  const dragged = useRef(false);
  const revealOpacity = useTransform(x, [-THRESHOLD, -24, 0], [1, 0.6, 0]);
  const iconScale = useTransform(x, [-THRESHOLD, -40], [1.15, 0.8]);

  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -THRESHOLD || info.velocity.x < -700) {
      tap();
      void animate(x, -480, { duration: 0.18 }).then(onDelete);
    } else {
      void animate(x, 0, { type: "spring", damping: 30, stiffness: 400 });
    }
    // Let the click that ends a drag be ignored.
    setTimeout(() => (dragged.current = false), 0);
  };

  return (
    <m.div
      layout
      initial={false}
      exit={{ opacity: 0, height: 0, marginTop: -8, transition: { duration: 0.22 } }}
      className="relative overflow-hidden rounded-[22px]"
    >
      <m.button
        type="button"
        onClick={onDelete}
        aria-label={`Borrar aviso: ${label}`}
        className="absolute inset-y-0 right-0 flex w-full items-center justify-end gap-2 rounded-[22px] bg-coral pr-6 text-sm font-bold text-ink focus-visible:opacity-100"
        style={{ opacity: revealOpacity }}
      >
        <m.span style={{ scale: iconScale }} className="flex items-center gap-2">
          <Trash2 className="size-5" aria-hidden /> Borrar
        </m.span>
      </m.button>
      <m.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.9, right: 0 }}
        style={{ x }}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={end}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative"
      >
        {children}
      </m.div>
    </m.div>
  );
}
