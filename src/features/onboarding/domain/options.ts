import type { Expectation, FaithStatus, GrowthArea } from "@/lib/supabase/database.types";

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** Screen 2a · "¿Cómo describirías tu camino de fe?" — labels exactly as in the design. */
export const FAITH_OPTIONS: ReadonlyArray<Option<FaithStatus>> = [
  { value: "knowing_god", label: "Estoy conociendo a Dios" },
  { value: "starting", label: "Estoy comenzando" },
  { value: "growing", label: "Quiero crecer" },
  { value: "returning", label: "Quiero volver a acercarme" },
  { value: "serving", label: "Ya sirvo en mi iglesia" },
  { value: "helping_others", label: "Quiero ayudar a otros" },
];

export const GROWTH_OPTIONS: ReadonlyArray<Option<GrowthArea>> = [
  { value: "bible", label: "Biblia" },
  { value: "prayer", label: "Oración" },
  { value: "consistency", label: "Constancia" },
  { value: "identity", label: "Identidad" },
  { value: "purpose", label: "Propósito" },
  { value: "relationships", label: "Relaciones" },
  { value: "service", label: "Servicio" },
  { value: "evangelism", label: "Evangelismo" },
];

export const EXPECTATION_OPTIONS: ReadonlyArray<Option<Expectation>> = [
  { value: "closer_to_god", label: "Quiero acercarme más a Dios" },
  { value: "start_again", label: "Quiero volver a comenzar" },
  { value: "understand_bible", label: "Quiero entender la Biblia" },
  { value: "learn_to_pray", label: "Quiero aprender a orar" },
  { value: "going_through_something", label: "Estoy pasando por algo" },
  { value: "discover_purpose", label: "Quiero descubrir mi propósito" },
  { value: "serve", label: "Quiero servir" },
  { value: "share_faith", label: "Quiero compartir mi fe" },
];

export function labelFor<T extends string>(options: ReadonlyArray<Option<T>>, value: T): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
