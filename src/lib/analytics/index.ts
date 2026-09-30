import { ALLOWED_PROPERTIES, type AnalyticsEventMap, type AnalyticsEventName } from "./events";

export type { AnalyticsEventMap, AnalyticsEventName };

export type SafeProperties = Record<string, string | number | boolean>;

/** Vendor adapter. Swap implementations without touching feature code. */
export interface AnalyticsProvider {
  track(event: AnalyticsEventName, properties: SafeProperties): void;
  identify(userId: string): void;
  reset(): void;
}

const MAX_STRING = 64;

/**
 * Keeps only allow-listed keys with primitive values and truncates strings.
 * Anything else (free text, nested objects) is dropped before reaching a provider.
 */
export function sanitizeProperties<E extends AnalyticsEventName>(
  event: E,
  properties: Record<string, unknown> | undefined,
): SafeProperties {
  const allowed = ALLOWED_PROPERTIES[event] as ReadonlyArray<string> | undefined;
  const out: SafeProperties = {};
  if (!allowed || !properties) return out;
  for (const key of allowed) {
    const value = properties[key];
    if (typeof value === "string") out[key] = value.slice(0, MAX_STRING);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

const noopProvider: AnalyticsProvider = { track() {}, identify() {}, reset() {} };

const consoleProvider: AnalyticsProvider = {
  track(event, properties) {
    console.debug("[analytics]", event, properties);
  },
  identify() {
    console.debug("[analytics] identify");
  },
  reset() {
    console.debug("[analytics] reset");
  },
};

let provider: AnalyticsProvider = process.env.NODE_ENV === "development" ? consoleProvider : noopProvider;

export function setAnalyticsProvider(next: AnalyticsProvider): void {
  provider = next;
}

export const analytics = {
  track<E extends AnalyticsEventName>(event: E, properties?: AnalyticsEventMap[E]): void {
    try {
      provider.track(event, sanitizeProperties(event, properties as Record<string, unknown> | undefined));
    } catch {
      /* analytics must never break the app */
    }
  },
  identify(userId: string): void {
    try {
      provider.identify(userId);
    } catch {
      /* ignore */
    }
  },
  reset(): void {
    try {
      provider.reset();
    } catch {
      /* ignore */
    }
  },
};
