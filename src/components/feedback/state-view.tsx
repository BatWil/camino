import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type StateKind = "empty" | "error" | "offline" | "unauthorized" | "maintenance" | "unconfigured";

const DEFAULTS: Record<StateKind, { eyebrow: string; title: string; message: string }> = {
  empty: { eyebrow: "TODAVÍA NADA", title: "Aquí aparecerá tu camino", message: "Paso a paso. Sin prisa." },
  error: {
    eyebrow: "UN MOMENTO",
    title: "Algo no salió bien",
    message: "No es tu culpa. Inténtalo de nuevo en unos segundos.",
  },
  offline: {
    eyebrow: "SIN CONEXIÓN",
    title: "Estás sin conexión",
    message: "Lo que ya descargaste sigue aquí. Cuando vuelvas a tener señal, seguimos.",
  },
  unauthorized: {
    eyebrow: "ACCESO",
    title: "Esta sección no está disponible para ti",
    message: "Si crees que deberías tener acceso, habla con el líder de tu iglesia.",
  },
  maintenance: {
    eyebrow: "MANTENIMIENTO",
    title: "Estamos mejorando Camino",
    message: "Volvemos en un momento. Siempre puedes volver.",
  },
  unconfigured: {
    eyebrow: "CONFIGURACIÓN",
    title: "Falta conectar el servidor",
    message: "Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example) y vuelve a compilar.",
  },
};

export function StateView({
  kind,
  title,
  message,
  action,
  tone = "light",
  className,
}: {
  kind: StateKind;
  title?: string;
  message?: string;
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const d = DEFAULTS[kind];
  const dark = tone === "dark";
  return (
    <section
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-[26px] p-[22px]",
        dark ? "bg-ink text-paper" : "bg-white text-ink",
        className,
      )}
    >
      <span className={cn("eyebrow", dark ? "text-lime" : "text-violet")}>{d.eyebrow}</span>
      <h2 className="m-0 text-[21px] leading-[1.15] font-bold">{title ?? d.title}</h2>
      <p className={cn("m-0 text-[15px] leading-[1.45]", dark ? "text-paper/70" : "text-ink/60")}>
        {message ?? d.message}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}
