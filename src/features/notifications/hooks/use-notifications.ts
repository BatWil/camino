"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { onAppStateChange } from "@/lib/native/bridge";
import {
  devicePlatform,
  disablePush,
  enablePush,
  listenForNotificationTaps,
  pushSupported,
  syncGentleReminders,
} from "@/lib/native/notifications";
import { DEFAULT_PREFS, notificationsRepository, type NoticePrefs } from "../data/notifications.repository";

export function useNotices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notices", "list", user?.id],
    queryFn: () => notificationsRepository.list(user!.id),
    enabled: Boolean(user),
  });
}

export function useUnreadNotices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notices", "unread", user?.id],
    queryFn: () => notificationsRepository.unread(user!.id),
    enabled: Boolean(user),
    refetchInterval: 120_000,
  });
}

export function useNoticeActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notices"] });
  return {
    markAllRead: useMutation({ mutationFn: notificationsRepository.markAllRead, onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => notificationsRepository.remove(id), onSuccess: refresh }),
  };
}

export function useNoticePrefs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prefs = useQuery({
    queryKey: ["notices", "prefs", user?.id],
    queryFn: () => notificationsRepository.prefs(user!.id),
    enabled: Boolean(user),
  });
  const value: Omit<NoticePrefs, "user_id" | "updated_at"> = { ...DEFAULT_PREFS, ...(prefs.data ?? {}) };
  const save = useMutation({
    mutationFn: notificationsRepository.savePrefs,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notices", "prefs"] }),
  });
  return { prefs, value, save };
}

/** Turns push on for this phone (asks permission because the person tapped the switch). */
export function usePushToggle() {
  const { save } = useNoticePrefs();
  return useMutation({
    mutationFn: async (on: boolean) => {
      if (!on) {
        await disablePush((t) => notificationsRepository.forgetDevice(t));
        await save.mutateAsync({ push_enabled: false });
        return "off" as const;
      }
      const platform = devicePlatform();
      const result = await enablePush(async (token) => {
        if (platform) await notificationsRepository.registerDevice(token, platform);
      });
      if (result === "enabled") await save.mutateAsync({ push_enabled: true });
      return result;
    },
  });
}

/**
 * Mounted once in the signed-in shell: handles taps on notifications, refreshes the device token
 * WITHOUT prompting, and re-arms gentle reminders whenever the app comes back to the foreground.
 */
export function useNotificationSetup() {
  const router = useRouter();
  const { value, prefs } = useNoticePrefs();
  const loaded = prefs.isSuccess;
  const { push_enabled: pushOn, daily_reminder: remindOn, reminder_time: time } = value;

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void listenForNotificationTaps((path) => router.push(path)).then((fn) => {
      if (cancelled) fn();
      else dispose = fn;
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [router]);

  useEffect(() => {
    if (!loaded) return;
    const platform = devicePlatform();
    if (pushOn && pushSupported() && platform) {
      void enablePush((token) => notificationsRepository.registerDevice(token, platform), false);
    }
    const sync = () => void syncGentleReminders({ enabled: remindOn, time, askPermission: false });
    sync();
    return onAppStateChange((active) => {
      if (active) sync();
    });
  }, [loaded, pushOn, remindOn, time]);
}
