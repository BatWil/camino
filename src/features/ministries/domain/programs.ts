/** Ministries hub (screen 8a): Ganar / Edificar / Enviar / Liderar. Structure of the product, not content. */
export type Pillar = "GANAR" | "EDIFICAR" | "ENVIAR" | "LIDERAR";

export interface Program {
  id: "fine_arts" | "bible_quiz" | "sports" | "youth_alive" | "speed_the_light" | "ambassadors";
  pillar: Pillar;
  title: string;
  bg: string;
  fg: string;
  href: string;
  summary: string;
}

export const PROGRAMS: readonly Program[] = [
  {
    id: "fine_arts",
    pillar: "EDIFICAR",
    title: "Bellas Artes",
    bg: "#9B6BFF",
    fg: "#FFFFFF",
    href: "/bellas-artes",
    summary: "Usa tu talento para adorar.",
  },
  {
    id: "bible_quiz",
    pillar: "EDIFICAR",
    title: "Quiz Bíblico",
    bg: "#FFC83D",
    fg: "#0D0A26",
    href: "/quiz",
    summary: "Practica y aprende la Palabra.",
  },
  {
    id: "sports",
    pillar: "GANAR",
    title: "Deportes",
    bg: "#35D07F",
    fg: "#0D0A26",
    href: "/ministerios/programa/?id=sports",
    summary: "El deporte como puente para conocer a Jesús.",
  },
  {
    id: "youth_alive",
    pillar: "GANAR",
    title: "Youth Alive · Mi escuela",
    bg: "#3D8BFF",
    fg: "#FFFFFF",
    href: "/ministerios/programa/?id=youth_alive",
    summary: "Lleva tu fe a tu escuela con un club y amigos.",
  },
  {
    id: "speed_the_light",
    pillar: "ENVIAR",
    title: "Speed the Light",
    bg: "#FF8A3D",
    fg: "#0D0A26",
    href: "/misiones/?programa=speed_the_light",
    summary: "Ofrendas para vehículos y equipo misionero.",
  },
  {
    id: "ambassadors",
    pillar: "ENVIAR",
    title: "Embajadores en Misión",
    bg: "#FF4D5E",
    fg: "#FFFFFF",
    href: "/misiones/?programa=ambassadors",
    summary: "Viajes misioneros de corto plazo.",
  },
];

/** Details for programs without their own screen (sports, Youth Alive). */
export const PROGRAM_DETAIL: Record<string, { lead: string; points: string[] }> = {
  sports: {
    lead: "Torneos, ligas y entrenamientos donde puedes invitar a tus amigos y vivir tu fe en la cancha.",
    points: [
      "Juega en el equipo de tu iglesia",
      "Invita a un amigo que no va a la iglesia",
      "Ora antes y después de cada partido",
    ],
  },
  youth_alive: {
    lead: "Tu escuela es tu campo misionero. Empieza un club de fe, ora por tus compañeros y comparte tu historia.",
    points: [
      "Ora por tu escuela cada semana",
      "Reúne a otros creyentes en tu escuela",
      "Comparte tu historia con un amigo",
    ],
  },
};

export function programById(id: string | null): Program | null {
  return PROGRAMS.find((p) => p.id === id) ?? null;
}
