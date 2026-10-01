import { Home, Route, Users, UserRound, type LucideIcon } from "lucide-react";

export interface NavTab {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Main navigation: Inicio · Camino · + · Comunidad · Perfil (the "+" sits between Camino and Comunidad). */
export const NAV_TABS: readonly NavTab[] = [
  { label: "Inicio", href: "/inicio", icon: Home },
  { label: "Camino", href: "/camino", icon: Route },
  { label: "Comunidad", href: "/comunidad", icon: Users },
  { label: "Perfil", href: "/perfil", icon: UserRound },
];

export const ROOT_PATHS = new Set(["/", ...NAV_TABS.map((t) => t.href)]);

/** Sections that belong to a tab without living under its path (design: Biblia → Camino, Diario → Perfil, Oración → Inicio). */
const TAB_ALIASES: Record<string, string[]> = {
  "/inicio": ["/oracion"],
  "/camino": ["/biblia", "/planes", "/recursos"],
  "/perfil": ["/diario", "/momentos", "/historia", "/preguntas"],
  "/comunidad": ["/eventos", "/ministerios"],
};

export function isTabActive(pathname: string, href: string): boolean {
  const clean = pathname.replace(/\/$/, "") || "/";
  return [href, ...(TAB_ALIASES[href] ?? [])].some((p) => clean === p || clean.startsWith(`${p}/`));
}

export interface QuickAction {
  id: "orar" | "leer" | "diario" | "preguntar" | "reto";
  label: string;
  bg: string;
  color: string;
  wide?: boolean;
  /** Destination route. Undefined until the feature ships (see docs/roadmap.md). */
  href?: string;
  milestone: string;
}

/** "¿QUÉ QUIERES HACER?" tiles, colours and order exactly as in screen 2c. */
export const QUICK_ACTIONS: readonly QuickAction[] = [
  { id: "orar", label: "Orar", bg: "#9B6BFF", color: "#FFFFFF", href: "/oracion", milestone: "M3" },
  { id: "leer", label: "Leer", bg: "#3D8BFF", color: "#FFFFFF", href: "/biblia", milestone: "M3" },
  { id: "diario", label: "Diario", bg: "#F4F2EC", color: "#0D0A26", href: "/diario/entrada/", milestone: "M3" },
  { id: "preguntar", label: "Preguntar", bg: "#FFC83D", color: "#0D0A26", href: "/pregunta", milestone: "M4" },
  { id: "reto", label: "Reto de hoy", bg: "#FF6B4A", color: "#0D0A26", wide: true, href: "/reto", milestone: "M2" },
];
