// =====================================================================
//  Progression : calcul local des seuils d'XP et des montées de niveau.
//  Aucune IA impliquée — tout est déterministe et instantané.
// =====================================================================

import type { Progression, Stats } from "@/types/game";
import { ARCHETYPES } from "@/data/archetypes";

/** Seuil d'XP pour passer du niveau `level` au suivant. */
export function xpThreshold(level: number): number {
  // Courbe douce mais croissante : 100, 150, 220, ...
  return Math.round(100 * Math.pow(1.45, level - 1));
}

/** Points de PV max gagnés par niveau. */
const HP_PER_LEVEL = 8;
/** Points de stat à dépenser gagnés par niveau. */
const POINTS_PER_LEVEL = 2;

export interface LevelUpResult {
  progression: Progression;
  levelsGained: number;
}

/**
 * Applique les gains d'XP et résout autant de montées de niveau que
 * nécessaire. Retourne une nouvelle progression (immutable).
 */
export function applyXp(prog: Progression, xpGain: number): LevelUpResult {
  let next: Progression = { ...prog, xp: prog.xp + Math.max(0, xpGain) };
  let levelsGained = 0;

  while (next.xp >= next.xpToNext) {
    next = {
      ...next,
      xp: next.xp - next.xpToNext,
      level: next.level + 1,
      xpToNext: xpThreshold(next.level + 1),
      unspentPoints: next.unspentPoints + POINTS_PER_LEVEL,
      hpMax: next.hpMax + HP_PER_LEVEL,
      // On régénère les PV gagnés à la montée de niveau.
      hp: Math.min(next.hpMax + HP_PER_LEVEL, next.hp + HP_PER_LEVEL),
    };
    levelsGained += 1;
  }

  return { progression: next, levelsGained };
}

/** Dépense un point de niveau dans une stat (max 5 par stat ici 10 en jeu). */
export const STAT_MAX = 10;

export function spendPoint(
  stats: Stats,
  prog: Progression,
  stat: keyof Stats
): { stats: Stats; progression: Progression } | null {
  if (prog.unspentPoints <= 0) return null;
  if (stats[stat] >= STAT_MAX) return null;
  return {
    stats: { ...stats, [stat]: stats[stat] + 1 },
    progression: { ...prog, unspentPoints: prog.unspentPoints - 1 },
  };
}

/** Construit la progression de départ d'un nouveau personnage. */
export function initialProgression(): Progression {
  return {
    level: 1,
    xp: 0,
    xpToNext: xpThreshold(1),
    unspentPoints: 0,
    hp: 30,
    hpMax: 30,
    currency: 20,
    skills: [],
  };
}

/** Compétence de départ liée à l'archétype choisi. */
export function startingSkillFor(archetypeId: string): string | null {
  return ARCHETYPES.find((a) => a.id === archetypeId)?.startingSkill ?? null;
}
