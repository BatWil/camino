/** Neutral loading screen (ink, lime dot) shown while the session is restored. */
export function SplashState() {
  return (
    <div role="status" aria-label="Cargando Camino" className="flex min-h-dvh items-center justify-center bg-ink">
      <span className="size-7 animate-pulse rounded-full bg-lime" aria-hidden />
    </div>
  );
}
