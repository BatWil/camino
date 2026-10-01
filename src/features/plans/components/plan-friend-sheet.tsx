"use client";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMyGroup, usePlanCompanions, useRoster } from "@/features/community/hooks/use-community";

/**
 * "Hacerlo con un amigo": invite someone from your own group (never strangers).
 * The friend only sees the invitation; nobody sees the other's answers.
 */
export function PlanFriendSheet({
  open,
  onClose,
  userPlanId,
}: {
  open: boolean;
  onClose: () => void;
  userPlanId: string | null;
}) {
  const { user } = useAuth();
  const group = useMyGroup();
  const roster = useRoster(open ? group.data?.id : null);
  const { companions, invite } = usePlanCompanions(open ? userPlanId : null);
  const status = new Map((companions.data ?? []).map((c) => [c.companion_id, c.status]));
  const people = (roster.data ?? []).filter((m) => m.user_id !== user?.id);

  return (
    <Sheet open={open} onClose={onClose} title="Hacerlo con un amigo">
      {group.isPending || roster.isPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : !group.data ? (
        <div className="flex flex-col gap-3 text-sm">
          <p className="m-0 text-ink/70">Puedes invitar a personas de tu grupo. Aún no estás en uno.</p>
          <ButtonLink href="/comunidad" variant="ink" size="sm" className="self-start">
            Ir a Comunidad
          </ButtonLink>
        </div>
      ) : people.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {people.map((m) => {
            const st = status.get(m.user_id);
            return (
              <li key={m.user_id} className="flex items-center gap-3">
                <Avatar size={34} />
                <span className="flex-1 text-[15px] font-semibold">{m.first_name}</span>
                <button
                  type="button"
                  disabled={Boolean(st) || invite.isPending || !userPlanId}
                  onClick={() => invite.mutate(m.user_id)}
                  className={`flex h-9 items-center rounded-full px-3.5 text-xs font-semibold ${
                    st ? "bg-stage-crece" : "bg-ink text-white"
                  }`}
                >
                  {st === "accepted" ? "Juntos ✓" : st ? "Invitado ✓" : "Invitar"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-sm text-ink/70">Todavía no hay más personas en {group.data.name}.</p>
      )}
      {invite.isError ? (
        <p role="alert" className="mt-2 mb-0 text-sm font-semibold text-coral">
          {invite.error.message}
        </p>
      ) : null}
      <p className="mt-3 mb-0 text-xs text-ink/55">
        Solo puedes invitar a personas de tu grupo. Ninguno verá las respuestas del otro.
      </p>
    </Sheet>
  );
}
