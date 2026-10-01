export const AVATAR_SIZE = 512;
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/** Centered square crop of a w×h image. */
export function squareCrop(width: number, height: number): { sx: number; sy: number; size: number } {
  const size = Math.min(width, height);
  return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size };
}

export class ImageInputError extends Error {}

/**
 * Re-encodes a picked photo into a 512×512 WebP (JPEG fallback) on the device.
 * Re-encoding through a canvas drops all metadata, including EXIF GPS location.
 */
export async function prepareAvatar(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new ImageInputError("Elige una imagen (JPG, PNG o WebP).");
  if (file.size > MAX_SOURCE_BYTES) throw new ImageInputError("La imagen es muy pesada. Elige una de menos de 15 MB.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageInputError("No pudimos leer esa imagen. Prueba con otra.");
  }
  const { sx, sy, size } = squareCrop(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageInputError("No pudimos procesar la imagen.");
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();

  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await encode("image/webp");
  const blob = webp?.type === "image/webp" ? webp : await encode("image/jpeg");
  if (!blob) throw new ImageInputError("No pudimos procesar la imagen.");
  return blob;
}
