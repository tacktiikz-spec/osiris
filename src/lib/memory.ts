// =====================================================================
//  Mémoire « qui n'oublie rien ».
//  Quand le log dépasse un seuil depuis foldedTo, on condense les plus
//  anciens messages dans la CHRONIQUE via Haiku, puis on avance foldedTo
//  (sur une frontière paire pour que la fenêtre récente débute par un
//  message « user »). Le log complet reste intact pour l'affichage.
// =====================================================================

import type { GameState } from "@/types/game";
import { callSummary } from "@/lib/anthropic";

/** Seuil de messages non condensés au-delà duquel on déclenche un repli. */
export const FOLD_THRESHOLD = 14;
/** Nombre de messages récents à toujours conserver verbatim. */
export const KEEP_RECENT = 8;

export function shouldFold(state: GameState): boolean {
  return state.messages.length - state.foldedTo > FOLD_THRESHOLD;
}

/** Transforme une tranche de messages en transcript lisible pour le résumé. */
function toTranscript(state: GameState, from: number, to: number): string {
  return state.messages
    .slice(from, to)
    .map((m) => `${m.role === "user" ? "JOUEUR" : "RÉCIT"} : ${m.content}`)
    .join("\n\n");
}

/**
 * Condense les anciens messages dans la chronique.
 * Retourne un patch partiel { chronicle, foldedTo } à appliquer au state.
 * En cas d'échec API, retourne null (on n'altère rien : échec gracieux).
 */
export async function foldMemory(
  apiKey: string,
  state: GameState
): Promise<{ chronicle: string; foldedTo: number } | null> {
  if (!shouldFold(state)) return null;

  // On condense jusqu'à laisser KEEP_RECENT messages récents.
  let newFoldedTo = state.messages.length - KEEP_RECENT;
  // Frontière paire pour que la fenêtre commence par un message « user ».
  if (newFoldedTo % 2 !== 0) newFoldedTo -= 1;
  if (newFoldedTo <= state.foldedTo) return null;

  const transcript = toTranscript(state, state.foldedTo, newFoldedTo);
  if (!transcript.trim()) return null;

  try {
    const updated = await callSummary(apiKey, state.chronicle, transcript);
    if (!updated?.trim()) return null;
    return { chronicle: updated.trim(), foldedTo: newFoldedTo };
  } catch (e) {
    console.error("Condensation mémoire échouée (sans impact sur la partie) :", e);
    return null;
  }
}
