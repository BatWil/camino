"use client";

import { useSyncExternalStore } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NoticesBell } from "@/features/notifications/components/notices-bell";
import { greetingFor } from "@/utils/greeting";
import { firstName } from "../domain/profile";
import { stageTheme } from "@/features/journey/domain/stages";
import { useCurrentStage } from "@/features/journey/hooks/use-current-stage";
import { useAvatarUrl } from "../hooks/use-avatar";
import { useProfile } from "../hooks/use-profile";

const noopSubscribe = () => () => {};

/** "BUENOS DÍAS, DANIEL · Hoy también puedes dar un paso." (screen 2c). */
export function HomeHeader() {
  const profile = useProfile();
  const avatar = useAvatarUrl();
  const { stage } = useCurrentStage();
  // Client-only value: the static HTML is rendered at build time, not at the user's local hour.
  const greeting = useSyncExternalStore(
    noopSubscribe,
    () => greetingFor(new Date()),
    () => null,
  );

  const name = firstName(profile.data);
  return (
    <div className="flex items-start justify-between px-1 pb-2">
      <div className="flex flex-col gap-1.5">
        {greeting === null || profile.isPending ? (
          <Skeleton className="h-[57px] w-52 rounded-xl" />
        ) : (
          <h1 className="m-0 font-display-x text-[30px] leading-[.95] tracking-[-.02em]">
            {greeting}
            {name ? (
              <>
                ,<br />
                {name}
              </>
            ) : null}
          </h1>
        )}
        <p className="m-0 text-[15px] text-ink/60">Hoy también puedes dar un paso.</p>
      </div>
      <div className="flex items-center gap-2">
        <NoticesBell />
        <Avatar size={44} src={avatar.data ?? null} ringColor={stage ? stageTheme(stage.key).color : undefined} />
      </div>
    </div>
  );
}
