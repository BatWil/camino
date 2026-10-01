import { Share } from "@capacitor/share";
import { isNative } from "@/lib/platform";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** Native share sheet, Web Share API, or clipboard as the last resort. */
export async function shareText(input: { title?: string; text: string; url?: string }): Promise<ShareResult> {
  try {
    if (isNative()) {
      await Share.share({ title: input.title, text: input.text, url: input.url, dialogTitle: input.title });
      return "shared";
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: input.title, text: input.text, url: input.url });
      return "shared";
    }
    await navigator.clipboard.writeText([input.text, input.url].filter(Boolean).join("\n"));
    return "copied";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "failed";
  }
}
