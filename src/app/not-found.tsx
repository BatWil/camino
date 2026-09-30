import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-ink px-6 py-12 text-paper">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5">
        <span className="eyebrow text-lime">404</span>
        <h1 className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.03em]">
          Este camino <span className="text-lime">no existe.</span>
        </h1>
        <p className="m-0 text-[15px] text-paper/75">Pero siempre puedes volver al inicio.</p>
        <div className="flex-1" />
        <ButtonLink href="/" variant="lime" size="lg" block>
          Volver al inicio
        </ButtonLink>
      </div>
    </main>
  );
}
