// =====================================================================
//  Les 6 archétypes (« La Voie ») du personnage.
//  Chaque archétype suggère une stat dominante et un style de jeu,
//  injecté dans le prompt système pour orienter la narration.
// =====================================================================

import type { Stats } from "@/types/game";

export interface Archetype {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  /** Stat mise en avant (sert d'indice visuel et de bonus de départ). */
  emphasis: keyof Stats;
  /** Compétence de départ offerte par la voie. */
  startingSkill: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "lame",
    name: "La Lame",
    tagline: "Le tranchant de la résolution",
    desc: "Maître du combat rapproché. Là où les mots échouent, l'acier parle. Vous lisez la violence comme une partition.",
    emphasis: "for",
    startingSkill: "Garde parfaite",
  },
  {
    id: "arcane",
    name: "L'Arcane",
    tagline: "Celui qui plie le réel",
    desc: "Manipulateur de pouvoirs — magie, psi, énergie interdite. Le monde n'est qu'une trame que vous savez tisser.",
    emphasis: "esp",
    startingSkill: "Canalisation",
  },
  {
    id: "ombre",
    name: "L'Ombre",
    tagline: "Jamais vu, toujours présent",
    desc: "Spécialiste de la furtivité et de l'infiltration. Vous existez entre les regards, dans le silence des couloirs.",
    emphasis: "agi",
    startingSkill: "Pas feutré",
  },
  {
    id: "erudit",
    name: "L'Érudit",
    tagline: "Le savoir comme arme",
    desc: "Esprit analytique, hacker, savant. Vous comprenez les mécanismes que les autres subissent.",
    emphasis: "esp",
    startingSkill: "Analyse fulgurante",
  },
  {
    id: "meneur",
    name: "Le Meneur",
    tagline: "Les autres vous suivent",
    desc: "Charisme et autorité. Vous transformez des inconnus en alliés et des ennemis en hésitants.",
    emphasis: "pre",
    startingSkill: "Verbe d'autorité",
  },
  {
    id: "nomade",
    name: "Le Nomade",
    tagline: "Survivre, partout",
    desc: "Endurant, débrouillard, à l'aise dans les milieux hostiles. La terre, la ruine ou l'étoile : tout devient un abri.",
    emphasis: "vol",
    startingSkill: "Instinct de survie",
  },
];

export function getArchetype(id: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

/** Libellés lisibles des stats (pour le HUD et la création). */
export const STAT_LABELS: Record<keyof Stats, string> = {
  for: "Force",
  agi: "Agilité",
  esp: "Esprit",
  vol: "Volonté",
  pre: "Présence",
};

export const STAT_ORDER: (keyof Stats)[] = ["for", "agi", "esp", "vol", "pre"];
