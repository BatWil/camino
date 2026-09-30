"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { StateView } from "@/components/feedback/state-view";

/** Route-level error boundary: never leave a blank screen. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] items-center px-3">
      <StateView
        kind="error"
        className="w-full"
        action={
          <div className="flex gap-2">
            <Button variant="ink" size="sm" onClick={reset}>
              Reintentar
            </Button>
            <ButtonLink href="/" variant="ghost" size="sm">
              Ir al inicio
            </ButtonLink>
          </div>
        }
      />
    </main>
  );
}
