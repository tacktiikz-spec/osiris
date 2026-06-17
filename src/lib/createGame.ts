// =====================================================================
//  Fabrique d'un nouvel état de jeu à partir du brouillon de création.
// =====================================================================

import type { Character, GameState, Stats } from "@/types/game";
import { GAME_STATE_VERSION } from "@/types/game";
import { initialProgression, startingSkillFor } from "@/lib/progression";
import { getTheme, themeHasSystem } from "@/data/themes";
import { DEFAULT_WORLD } from "@/lib/world";

export interface CreationDraft {
  theme: string;
  customDesc?: string;
  name: string;
  avatarPath?: string;
  archetype: string;
  stats: Stats;
  origin?: string;
  trait?: string;
  goal?: string;
}

export function createGameState(draft: CreationDraft): GameState {
  const now = new Date().toISOString();
  const theme = getTheme(draft.theme);

  const character: Character = {
    name: draft.name.trim(),
    avatarPath: draft.avatarPath,
    archetype: draft.archetype,
    stats: { ...draft.stats },
    origin: draft.origin?.trim() || undefined,
    trait: draft.trait?.trim() || undefined,
    goal: draft.goal?.trim() || undefined,
  };

  const progression = initialProgression();
  const startSkill = startingSkillFor(draft.archetype);
  if (startSkill) progression.skills.push(startSkill);

  const state: GameState = {
    version: GAME_STATE_VERSION,
    createdAt: now,
    updatedAt: now,
    theme: draft.theme,
    customDesc: draft.customDesc?.trim() || undefined,
    character,
    progression,
    inventory: [],
    quests: [],
    npcs: [],
    location: "",
    flags: {},
    world: { ...DEFAULT_WORLD },
    conditions: [],
    codex: [],
    chronicle: "",
    foldedTo: 0,
    messages: [],
  };

  // Active le téléphone pour les thèmes concernés.
  if (themeHasSystem(theme, "phone")) {
    state.phone = { contacts: [], threads: {} };
  }

  return state;
}

/** Brouillon de création par défaut (base 1 partout, ~8 points à répartir). */
export function emptyDraft(): CreationDraft {
  return {
    theme: "",
    name: "",
    archetype: "",
    stats: { for: 1, agi: 1, esp: 1, vol: 1, pre: 1 },
  };
}

export const CREATION_POINTS = 8;
export const STAT_BASE = 1;
export const STAT_CREATE_MAX = 5;

/** Points encore disponibles dans le brouillon. */
export function remainingPoints(stats: Stats): number {
  const spent = (Object.values(stats) as number[]).reduce((a, b) => a + (b - STAT_BASE), 0);
  return CREATION_POINTS - spent;
}
