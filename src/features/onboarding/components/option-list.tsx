import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Option } from "../domain/options";

/**
 * Selectable rows from screen 2a (54px, 18px radius, indicator on the right).
 * Single choice renders a radiogroup; multiple choice renders checkboxes.
 */
export function OptionList<T extends string>({
  options,
  selected,
  onToggle,
  multiple = false,
  dark,
  columns = 1,
  label,
}: {
  options: ReadonlyArray<Option<T>>;
  selected: ReadonlyArray<T>;
  onToggle: (value: T) => void;
  multiple?: boolean;
  dark: boolean;
  columns?: 1 | 2;
  label: string;
}) {
  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-label={label}
      className={cn("grid gap-2", columns === 2 && "grid-cols-2")}
    >
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onToggle(o.value)}
            className={cn(
              "flex min-h-[54px] items-center justify-between gap-3 rounded-[18px] px-[18px] text-left text-base font-semibold transition-all duration-200",
              dark
                ? on
                  ? "bg-lime text-ink"
                  : "bg-white/[.12] text-white"
                : on
                  ? "bg-ink text-paper"
                  : "bg-white/60 text-ink",
            )}
          >
            {o.label}
            <span
              aria-hidden
              className={cn(
                "flex size-[22px] flex-none items-center justify-center rounded-full border-2 border-current",
                on && (dark ? "bg-ink" : "bg-lime text-ink"),
              )}
            >
              {on && multiple ? (
                <Check className={cn("size-3.5", dark ? "text-lime" : "text-ink")} strokeWidth={3} />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
