"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAvatarUrl, useUploadAvatar } from "@/features/profile/hooks/use-avatar";
import { ImageInputError } from "@/utils/image";
import { AppError } from "@/types/result";

/** Step 3 · optional photo. Re-encoded on the device; stored privately. */
export function PhotoPicker() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const avatar = useAvatarUrl();

  const error =
    upload.error instanceof ImageInputError || upload.error instanceof AppError
      ? upload.error.message
      : upload.error
        ? "No pudimos subir tu foto."
        : null;

  return (
    <div className="flex flex-col items-center gap-4 pt-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="relative rounded-full"
        aria-label={avatar.data ? "Cambiar foto" : "Elegir foto"}
      >
        <Avatar size={148} ringColor="#0D0A26" ringWidth={4} src={avatar.data ?? null} alt="Tu foto" />
        <span className="absolute right-1 bottom-1 flex size-11 items-center justify-center rounded-full bg-ink text-lime">
          {upload.isPending ? (
            <span
              className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
          ) : (
            <Camera className="size-5" aria-hidden />
          )}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = "";
        }}
      />
      <p aria-live="polite" className="m-0 min-h-5 text-center text-sm font-semibold">
        {upload.isPending ? "Subiendo…" : (error ?? (upload.isSuccess ? "¡Lista! ✦" : ""))}
      </p>
    </div>
  );
}
