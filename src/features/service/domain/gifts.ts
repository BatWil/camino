import type { GiftArea } from "@/lib/supabase/database.types";

/** Labels for the "TUS DONES" bars (screen 7c). */
export const GIFT_LABEL: Record<GiftArea, string> = {
  teaching: "Enseñanza",
  service: "Servicio",
  creativity: "Creatividad",
  music: "Música",
  tech: "Tecnología",
  care: "Cuidado",
  evangelism: "Evangelismo",
  prayer: "Intercesión",
};

export const GIFT_AREAS = Object.keys(GIFT_LABEL) as GiftArea[];

export interface GiftStatement {
  id: string;
  area: GiftArea;
  text: string;
}

/**
 * Short interest inventory (2 statements per area). It points to things worth
 * exploring — it is never a definitive diagnosis of someone's gifts.
 */
export const GIFT_STATEMENTS: readonly GiftStatement[] = [
  { id: "t1", area: "teaching", text: "Me gusta explicar algo hasta que otros lo entienden." },
  { id: "t2", area: "teaching", text: "Disfruto estudiar la Biblia y compartir lo que aprendo." },
  { id: "s1", area: "service", text: "Me doy cuenta de lo que hace falta y lo hago sin que me lo pidan." },
  { id: "s2", area: "service", text: "Prefiero ayudar detrás de escena que estar al frente." },
  { id: "c1", area: "creativity", text: "Se me ocurren ideas nuevas para comunicar algo." },
  { id: "c2", area: "creativity", text: "Disfruto diseñar, escribir, dibujar o crear contenido." },
  { id: "m1", area: "music", text: "La música es una forma natural en la que adoro a Dios." },
  { id: "m2", area: "music", text: "Toco un instrumento o canto, o me gustaría aprender." },
  { id: "x1", area: "tech", text: "Me siento cómodo con cámaras, sonido, pantallas o computadoras." },
  { id: "x2", area: "tech", text: "Me gusta resolver problemas técnicos." },
  { id: "k1", area: "care", text: "Tengo paciencia con niños o con personas que necesitan atención." },
  { id: "k2", area: "care", text: "La gente suele contarme lo que le pasa." },
  { id: "e1", area: "evangelism", text: "Me resulta natural hablar de Jesús con mis amigos." },
  { id: "e2", area: "evangelism", text: "Me gusta conocer gente nueva y hacer que se sienta bienvenida." },
  { id: "p1", area: "prayer", text: "Me nace orar por otros, incluso por personas que no conozco." },
  { id: "p2", area: "prayer", text: "Puedo pasar tiempo largo en oración sin aburrirme." },
];

/** Agreement scale 1–5. */
export const AGREEMENT = ["Nada", "Poco", "Algo", "Bastante", "Mucho"] as const;

/** Percent per area (0–100) from 1–5 answers. Unanswered statements count as neutral-low (1). */
export function scoreGifts(answers: Record<string, number>): Record<GiftArea, number> {
  const totals = Object.fromEntries(GIFT_AREAS.map((a) => [a, { sum: 0, n: 0 }])) as Record<
    GiftArea,
    { sum: number; n: number }
  >;
  for (const s of GIFT_STATEMENTS) {
    const v = Math.min(5, Math.max(1, Math.round(answers[s.id] ?? 1)));
    totals[s.area].sum += v - 1;
    totals[s.area].n += 1;
  }
  return Object.fromEntries(
    GIFT_AREAS.map((a) => [a, totals[a].n ? Math.round((totals[a].sum / (totals[a].n * 4)) * 100) : 0]),
  ) as Record<GiftArea, number>;
}

/** Highest areas first; ties keep the canonical order. */
export function topGifts(scores: Partial<Record<GiftArea, number>>, n = 3): Array<{ area: GiftArea; score: number }> {
  return GIFT_AREAS.map((area) => ({ area, score: scores[area] ?? 0 }))
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** Opportunities ordered by how well they match the person's strongest areas ("Encajas bien en"). */
export function rankOpportunities<T extends { area: GiftArea }>(
  items: readonly T[],
  scores: Partial<Record<GiftArea, number>> | null,
): T[] {
  if (!scores) return [...items];
  return [...items].sort((a, b) => (scores[b.area] ?? 0) - (scores[a.area] ?? 0));
}

export function parseScores(raw: unknown): Partial<Record<GiftArea, number>> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Partial<Record<GiftArea, number>> = {};
  for (const area of GIFT_AREAS) {
    const v = (raw as Record<string, unknown>)[area];
    if (typeof v === "number" && Number.isFinite(v)) out[area] = Math.min(100, Math.max(0, v));
  }
  return out;
}
