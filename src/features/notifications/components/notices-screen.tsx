"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/feedback/state-view";
import { cn } from "@/utils/cn";
import { groupNotices, isSafeInternalPath, NOTICE_STYLE } from "../domain/notices";
import { useNoticeActions, useNotices } from "../hooks/use-notifications";
import { SwipeToDelete } from "./swipe-to-delete";

/** Screen 7e · Avisos · tono amable. Opening the screen marks everything as read. */
export function NoticesScreen() {
  const router = useRouter();
  const notices = useNotices();
  const { markAllRead, remove } = useNoticeActions();
  // Hidden right away so the exit animation plays; the server delete follows.
  const [gone, setGone] = useState<Set<string>>(() => new Set());
  const visible = (notices.data ?? []).filter((n) => !gone.has(n.id));
  const del = (id: string) => {
    setGone((s) => new Set(s).add(id));
    remove.mutate(id, {
      onError: () =>
        setGone((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
    });
  };
  const hasUnread = notices.data?.some((n) => !n.read_at) ?? false;
  const mark = markAllRead.mutate;

  useEffect(() => {
    if (hasUnread) mark();
  }, [hasUnread, mark]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <Link
          href="/perfil/avisos"
          aria-label="Preferencias de avisos"
          className="flex size-10 items-center justify-center rounded-full bg-white"
        >
          <Settings className="size-[18px]" aria-hidden />
        </Link>
      </div>
      <h1 className="m-0 px-6 pt-[18px] pb-1 font-display-x text-[40px] leading-[.85] tracking-[-.03em]">Avisos</h1>
      {visible.length ? (
        <p className="m-0 px-6 pb-3 text-xs text-ink/50">Desliza un aviso a la izquierda para borrarlo.</p>
      ) : (
        <div className="pb-3" />
      )}
      <div className="flex flex-col gap-2 px-3">
        {notices.isPending ? <Skeleton className="h-[74px] rounded-[22px]" /> : null}
        {notices.isError ? <StateView kind="error" message={notices.error.message} /> : null}
        {notices.data && !visible.length ? (
          <StateView
            kind="empty"
            title="Todo tranquilo por aquí"
            message="Cuando tu mentor te escriba, respondan tu pregunta o tu iglesia publique algo, lo verás aquí."
          />
        ) : null}
        {groupNotices(visible).map((g) => (
          <section key={g.label} aria-label={g.label} className="flex flex-col gap-2">
            <span className="eyebrow px-3 pt-3 pb-1 text-ink/50 first:pt-1">{g.label}</span>
            <AnimatePresence initial={false}>
              {g.items.map((n) => {
                const style = NOTICE_STYLE[n.kind];
                const content = (
                  <>
                    <span
                      className={cn("size-10 flex-none", style.shape === "circle" ? "rounded-full" : "rounded-xl")}
                      style={{ background: style.color }}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <span className="text-[15px] font-bold">{n.title}</span>
                      {n.body ? (
                        <span className={cn("text-[13px] leading-[1.4]", !style.highlight && "text-ink/60")}>
                          {n.body}
                        </span>
                      ) : null}
                    </span>
                  </>
                );
                const cls = cn("flex gap-3.5 rounded-[22px] p-4 text-left", style.highlight ? "bg-lime" : "bg-white");
                return (
                  <SwipeToDelete key={n.id} label={n.title} onDelete={() => del(n.id)}>
                    {isSafeInternalPath(n.href) ? (
                      <Link href={n.href} className={cls} draggable={false}>
                        {content}
                      </Link>
                    ) : (
                      <div className={cls}>{content}</div>
                    )}
                  </SwipeToDelete>
                );
              })}
            </AnimatePresence>
          </section>
        ))}
      </div>
    </div>
  );
}
