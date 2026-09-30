import { Preferences } from "@capacitor/preferences";
import { isNative } from "@/lib/platform";

/**
 * Async key/value storage used for small, non-relational app state
 * (auth session tokens, UI preferences). It is NOT a database:
 * domain data lives in Supabase.
 *
 * - Native (Android/iOS): Capacitor Preferences (SharedPreferences / UserDefaults).
 * - Web/PWA: localStorage, guarded because it can throw (private mode, blocked storage).
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const webStorage: KeyValueStorage = {
  async getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage unavailable: session will live in memory only */
    }
  },
  async removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

const nativeStorage: KeyValueStorage = {
  async getItem(key) {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key, value) {
    await Preferences.set({ key, value });
  },
  async removeItem(key) {
    await Preferences.remove({ key });
  },
};

const memory = new Map<string, string>();
const memoryStorage: KeyValueStorage = {
  async getItem(key) {
    return memory.get(key) ?? null;
  },
  async setItem(key, value) {
    memory.set(key, value);
  },
  async removeItem(key) {
    memory.delete(key);
  },
};

export function getKeyValueStorage(): KeyValueStorage {
  if (typeof window === "undefined") return memoryStorage;
  return isNative() ? nativeStorage : webStorage;
}
