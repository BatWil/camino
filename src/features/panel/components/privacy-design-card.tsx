/** "Diseño de privacidad" card from the leader dashboard (screen 3a). */
export function PrivacyDesignCard() {
  return (
    <section className="flex flex-col gap-3.5 rounded-3xl bg-ink p-[22px] text-paper" aria-labelledby="privacy-design">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-3.5 rounded-[3px] bg-lime" aria-hidden />
        <h2 id="privacy-design" className="m-0 text-base font-bold">
          Diseño de privacidad
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[13px] leading-normal">
        <div className="flex flex-col gap-1">
          <span className="eyebrow text-lime">Puedes ver</span>
          <span>Etapa</span>
          <span>Plan actual</span>
          <span>Participación</span>
          <span>Grupo y mentor</span>
        </div>
        <div className="flex flex-col gap-1 text-paper/55">
          <span className="eyebrow text-coral">Nunca verás</span>
          <span className="line-through">Diario</span>
          <span className="line-through">Oraciones privadas</span>
          <span className="line-through">Notas</span>
          <span className="line-through">Reflexiones</span>
        </div>
      </div>
      <p className="m-0 text-xs leading-snug text-paper/60">El joven decide qué compartir. Solo ves lo que te envía.</p>
    </section>
  );
}
