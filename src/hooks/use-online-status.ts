"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";
import { isNative } from "@/lib/platform";

/** Connectivity across web (online/offline events) and native (Capacitor Network). */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (isNative()) {
      let remove: (() => void) | undefined;
      let cancelled = false;
      void Network.getStatus().then((s) => !cancelled && setOnline(s.connected));
      void Network.addListener("networkStatusChange", (s) => setOnline(s.connected)).then((h) => {
        remove = () => void h.remove();
        if (cancelled) remove();
      });
      return () => {
        cancelled = true;
        remove?.();
      };
    }
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
