"use client";

import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";
import { SplashState } from "@/components/layout/splash-state";
import { useAccess } from "@/features/churches/hooks/use-access";
import type { UserAccess } from "@/features/churches/domain/access";

/** Renders children only if `allow(access)` is true. RLS remains the real enforcement. */
export function RoleGuard({ allow, children }: { allow: (access: UserAccess) => boolean; children: ReactNode }) {
  const access = useAccess();

  if (access.isPending) return <SplashState />;
  if (access.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="error"
          className="w-full"
          action={
            <ButtonLink href="/inicio" variant="ink" size="sm">
              Volver al inicio
            </ButtonLink>
          }
        />
      </main>
    );
  }
  if (!allow(access.data)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
        <StateView
          kind="unauthorized"
          className="w-full"
          action={
            <ButtonLink href="/inicio" variant="ink" size="sm">
              Volver al inicio
            </ButtonLink>
          }
        />
      </main>
    );
  }
  return <>{children}</>;
}
