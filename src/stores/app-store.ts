"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getKeyValueStorage } from "@/lib/storage/key-value";

/**
 * Minimal global UI state. Session lives in AuthProvider, server data in
 * TanStack Query. Only small per-device preferences belong here.
 */
export interface AppPreferences {
  bibleFontScale: number;
  /** Last place read in the Bible ("book:chapter"), to reopen where you left off. */
  lastBibleRef: string | null;
  bibleVersion: string | null;
}

interface AppState {
  selectedChurchId: string | null;
  preferences: AppPreferences;
  setSelectedChurch: (id: string | null) => void;
  setPreferences: (patch: Partial<AppPreferences>) => void;
  reset: () => void;
}

const initial = {
  selectedChurchId: null,
  preferences: { bibleFontScale: 1, lastBibleRef: null, bibleVersion: null },
} satisfies Pick<AppState, "selectedChurchId" | "preferences">;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setSelectedChurch: (selectedChurchId) => set({ selectedChurchId }),
      setPreferences: (patch) => set((s) => ({ preferences: { ...s.preferences, ...patch } })),
      reset: () => set(initial),
    }),
    {
      name: "camino.app",
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        return { ...state, preferences: { ...initial.preferences, ...(state.preferences ?? {}) } } as AppState;
      },
      storage: createJSONStorage(() => getKeyValueStorage()),
      partialize: (s) => ({ selectedChurchId: s.selectedChurchId, preferences: s.preferences }),
    },
  ),
);
