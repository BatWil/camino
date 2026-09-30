"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { canAccessAdminPanel, canAccessLeaderPanel } from "@/features/churches/domain/access";
import { useAccess, useCurrentChurch } from "@/features/churches/hooks/use-access";
import { useProfile } from "../hooks/use-profile";

const row = "flex min-h-14 items-center justify-between px-5 text-[15px] font-semibold";

/** Screen 6c · Perfil (M0: identity, church, panels by role, sign out). */
export function ProfileScreen() {
  const profile = useProfile();
  const access = useAccess();
  const { church } = useCurrentChurch();
  const { signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const name = profile.data?.display_name?.trim() || user?.email?.split("@")[0] || "";
  const showLeader = access.data ? canAccessLeaderPanel(access.data) : false;
  const showAdmin = access.data ? canAccessAdminPanel(access.data) : false;

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col items-center gap-2.5 px-6 py-[18px] text-center">
        <Avatar size={96} ringWidth={4} ringColor="#C6F432" />
        {profile.isPending ? (
          <Skeleton className="h-8 w-48 rounded-xl" />
        ) : (
          <h1 className="m-0 font-display-x text-[26px]">{name}</h1>
        )}
        {church ? (
          <span className="rounded-full bg-white px-2.5 py-[5px] text-xs font-semibold">{church.churchName}</span>
        ) : null}
      </header>

      {showLeader || showAdmin ? (
        <nav aria-label="Paneles" className="mx-3 overflow-hidden rounded-3xl bg-white">
          {showLeader ? (
            <Link href="/leader" className={`${row} ${showAdmin ? "border-b border-ink/[.06]" : ""}`}>
              Panel de líder
              <span className="text-ink/40" aria-hidden>
                →
              </span>
            </Link>
          ) : null}
          {showAdmin ? (
            <Link href="/admin" className={row}>
              Administración
              <span className="text-ink/40" aria-hidden>
                →
              </span>
            </Link>
          ) : null}
        </nav>
      ) : null}

      <section className="mx-3 overflow-hidden rounded-3xl bg-ink text-paper" aria-label="Cuenta">
        <div className={`${row} border-b border-white/[.08]`}>
          Cuenta<span className="max-w-[60%] truncate text-xs font-normal text-paper/60">{user?.email}</span>
        </div>
        <div className="p-3">
          <Button variant="outline" size="md" block loading={signingOut} onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </section>
    </div>
  );
}
