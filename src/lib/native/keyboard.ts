/**
 * Keeps forms usable when the on-screen keyboard opens (APK, PWA and mobile browsers):
 *  - marks <html data-keyboard="open"> while a text field has focus on touch screens,
 *    so the floating bottom nav steps aside instead of covering the field;
 *  - once the keyboard has finished resizing the view, scrolls the focused field into
 *    the visible area if it ended up hidden.
 */
const TEXT_INPUT = /^(text|email|password|search|tel|url|number|date|datetime-local|time)$/;

function isTextField(el: Element | null): el is HTMLElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return TEXT_INPUT.test(el.type || "text") && !el.readOnly;
  return el instanceof HTMLElement && el.isContentEditable;
}

export function fieldIsHidden(rect: { top: number; bottom: number }, viewTop: number, viewHeight: number): boolean {
  const margin = 16;
  return rect.top < viewTop + margin || rect.bottom > viewTop + viewHeight - margin;
}

export function installKeyboardHelpers(): () => void {
  if (typeof window === "undefined") return () => {};
  const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (!touch) return () => {};
  const root = document.documentElement;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;

  const reveal = () => {
    const el = document.activeElement;
    if (!isTextField(el)) return;
    const vv = window.visualViewport;
    const top = vv?.offsetTop ?? 0;
    const height = vv?.height ?? window.innerHeight;
    if (fieldIsHidden(el.getBoundingClientRect(), top, height))
      el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const onFocusIn = (e: FocusEvent) => {
    if (!isTextField(e.target as Element)) return;
    clearTimeout(closeTimer);
    root.dataset.keyboard = "open";
    clearTimeout(revealTimer);
    revealTimer = setTimeout(reveal, 350); // after the keyboard animation / view resize
  };
  const onFocusOut = () => {
    // Moving between fields keeps the keyboard up; only close when focus really leaves.
    closeTimer = setTimeout(() => {
      if (!isTextField(document.activeElement)) delete root.dataset.keyboard;
    }, 120);
  };
  const onResize = () => {
    if (root.dataset.keyboard === "open") {
      clearTimeout(revealTimer);
      revealTimer = setTimeout(reveal, 120);
    }
  };

  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  window.visualViewport?.addEventListener("resize", onResize);
  window.addEventListener("resize", onResize);
  return () => {
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    window.visualViewport?.removeEventListener("resize", onResize);
    window.removeEventListener("resize", onResize);
    clearTimeout(closeTimer);
    clearTimeout(revealTimer);
    delete root.dataset.keyboard;
  };
}
