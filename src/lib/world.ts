// =====================================================================
//  Métadonnées du monde simulé : moments de la journée (icône, teinte
//  d'ambiance, libellé) et utilitaires de normalisation.
// =====================================================================

import type { TimeOfDay, WorldState } from "@/types/game";
import { TIME_ORDER } from "@/types/game";

export interface TimeMeta {
  label: string;
  icon: string;
  /** Teinte d'ambiance appliquée en surimpression (rgba faible). */
  tint: string;
}

export const TIME_META: Record<TimeOfDay, TimeMeta> = {
  aube: { label: "Aube", icon: "◔", tint: "rgba(255, 170, 120, 0.10)" },
  matin: { label: "Matin", icon: "☀", tint: "rgba(150, 200, 255, 0.07)" },
  midi: { label: "Midi", icon: "◉", tint: "rgba(255, 255, 220, 0.04)" },
  "après-midi": { label: "Après-midi", icon: "◑", tint: "rgba(255, 200, 130, 0.08)" },
  crépuscule: { label: "Crépuscule", icon: "◕", tint: "rgba(255, 120, 90, 0.12)" },
  nuit: { label: "Nuit", icon: "☾", tint: "rgba(40, 60, 140, 0.18)" },
};

export const DEFAULT_WORLD: WorldState = {
  day: 1,
  time: "matin",
  weather: "",
};

/** Normalise une valeur potentiellement libre en TimeOfDay valide. */
export function coerceTime(value: unknown): TimeOfDay | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  const direct = TIME_ORDER.find((t) => t === v);
  if (direct) return direct;
  // Quelques synonymes tolérés.
  if (/(matin)/.test(v)) return "matin";
  if (/(midi|méridienne)/.test(v)) return "midi";
  if (/(après|apres|tantôt)/.test(v)) return "après-midi";
  if (/(soir|crépuscule|crepuscule|couchant)/.test(v)) return "crépuscule";
  if (/(nuit|minuit|nocturne)/.test(v)) return "nuit";
  if (/(aube|aurore|petit matin)/.test(v)) return "aube";
  return null;
}

/** Libellé court « Jour 3 · Crépuscule ». */
export function worldLabel(world: WorldState): string {
  return `Jour ${world.day} · ${TIME_META[world.time]?.label ?? world.time}`;
}
