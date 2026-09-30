import { cn } from "@/utils/cn";

/** Circular avatar. Until a photo exists it shows the striped placeholder from the design. */
export function Avatar({
  size = 44,
  ringColor,
  ringWidth = 2,
  src,
  alt = "",
  className,
}: {
  size?: number;
  ringColor?: string;
  ringWidth?: number;
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    border: ringColor ? `${ringWidth}px solid ${ringColor}` : undefined,
  };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- static export: images are served as-is
    return <img src={src} alt={alt} className={cn("rounded-full object-cover", className)} style={style} />;
  }
  return <div className={cn("photo-stone shrink-0 rounded-full", className)} style={style} aria-hidden={!alt} />;
}
