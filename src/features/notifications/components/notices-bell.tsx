"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadNotices } from "../hooks/use-notifications";

/** Bell with a quiet dot (no counters that pressure). */
export function NoticesBell() {
  const unread = useUnreadNotices();
  const has = (unread.data ?? 0) > 0;
  return (
    <Link
      href="/avisos"
      aria-label={has ? "Avisos (tienes avisos nuevos)" : "Avisos"}
      className="relative flex size-11 items-center justify-center rounded-full bg-white"
    >
      <Bell className="size-5" aria-hidden />
      {has ? (
        <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full border-2 border-white bg-coral" aria-hidden />
      ) : null}
    </Link>
  );
}
