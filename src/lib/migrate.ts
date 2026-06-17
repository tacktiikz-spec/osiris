// =====================================================================
//  Normalisation des sauvegardes : garantit la présence des champs
//  récents (monde, conditions, atlas) sur les parties créées avant leur
//  introduction. Sans cette étape, charger une ancienne sauvegarde
//  laisserait ces champs « undefined » et casserait l'interface.
// =====================================================================

import type { GameState } from "@/types/game";
import { GAME_STATE_VERSION } from "@/types/game";
import { DEFAULT_WORLD } from "@/lib/world";

/** Retourne un GameState complet, en comblant les champs manquants. */
export function normalizeState(state: GameState): GameState {
  return {
    ...state,
    version: GAME_STATE_VERSION,
    world: state.world ?? { ...DEFAULT_WORLD },
    conditions: Array.isArray(state.conditions) ? state.conditions : [],
    codex: Array.isArray(state.codex) ? state.codex : [],
    inventory: Array.isArray(state.inventory) ? state.inventory : [],
    quests: Array.isArray(state.quests) ? state.quests : [],
    npcs: Array.isArray(state.npcs) ? state.npcs : [],
    flags: state.flags ?? {},
  };
}
