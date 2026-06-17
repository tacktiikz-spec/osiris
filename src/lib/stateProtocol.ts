// =====================================================================
//  Protocole de narration + état.
//  L'IA renvoie : RÉCIT, puis une ligne ">>> a | b | c", puis un bloc
//  [[ETAT]]{...}[[/ETAT]]. Ce module sépare ces trois parties et applique
//  les deltas au GameState. Échec gracieux : si le bloc est absent ou
//  invalide, on n'altère pas l'état et on n'interrompt jamais le récit.
// =====================================================================

import type { GameState, Quest, StateDelta } from "@/types/game";
import { applyXp } from "@/lib/progression";

export interface ParsedTurn {
  /** Récit nettoyé, prêt à afficher (sans actions ni bloc d'état). */
  narrative: string;
  /** Actions suggérées extraites de la ligne >>>. */
  actions: string[];
  /** Deltas d'état (null si absent ou invalide). */
  delta: StateDelta | null;
}

const STATE_OPEN = "[[ETAT]]";
const STATE_CLOSE = "[[/ETAT]]";

/** Génère un identifiant court stable. */
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Slugifie un texte pour servir d'id déterministe. */
function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/**
 * Découpe la réponse brute de l'IA en récit / actions / delta.
 */
export function parseTurn(raw: string): ParsedTurn {
  let working = raw;
  let delta: StateDelta | null = null;

  // 1) Extraire le bloc d'état.
  const start = working.indexOf(STATE_OPEN);
  const end = working.indexOf(STATE_CLOSE);
  if (start !== -1 && end !== -1 && end > start) {
    const jsonPart = working.slice(start + STATE_OPEN.length, end).trim();
    delta = safeParseDelta(jsonPart);
    // Retirer tout le bloc du texte affiché.
    working = (working.slice(0, start) + working.slice(end + STATE_CLOSE.length)).trim();
  } else if (start !== -1) {
    // Bloc ouvert mais non fermé : on tente quand même, sinon on coupe.
    const jsonPart = working.slice(start + STATE_OPEN.length).trim();
    delta = safeParseDelta(jsonPart);
    working = working.slice(0, start).trim();
  }

  // 2) Extraire les actions suggérées (ligne commençant par >>>).
  let actions: string[] = [];
  const lines = working.split(/\r?\n/);
  const keptLines: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*>>>\s*(.+)$/);
    if (m) {
      actions = m[1]
        .split("|")
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 5);
    } else {
      keptLines.push(line);
    }
  }

  const narrative = keptLines.join("\n").trim();
  return { narrative, actions, delta };
}

/** Parse tolérant du JSON de delta (tente de récupérer un objet valide). */
function safeParseDelta(text: string): StateDelta | null {
  if (!text) return null;
  let candidate = text.trim();
  // Retire d'éventuelles barrières de code markdown.
  candidate = candidate.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Isole le premier objet { ... } équilibré si du texte parasite traîne.
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidate = candidate.slice(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") return parsed as StateDelta;
  } catch {
    // Échec gracieux.
  }
  return null;
}

export interface ApplyResult {
  state: GameState;
  /** Effets notables pour déclencher SFX / animations. */
  effects: {
    leveledUp: boolean;
    levelsGained: number;
    gotItem: boolean;
    questChanged: boolean;
    phoneMessage: boolean;
  };
}

/**
 * Applique un delta à un GameState et retourne un nouvel état (immutable),
 * accompagné des effets notables.
 */
export function applyDelta(state: GameState, delta: StateDelta | null): ApplyResult {
  const effects = {
    leveledUp: false,
    levelsGained: 0,
    gotItem: false,
    questChanged: false,
    phoneMessage: false,
  };

  if (!delta) {
    return { state, effects };
  }

  // Copie de travail.
  let prog = { ...state.progression };
  let inventory = [...state.inventory];
  let quests = [...state.quests];
  let npcs = [...state.npcs];
  let flags = { ...state.flags };
  let location = state.location;
  let phone = state.phone ? { ...state.phone, threads: { ...state.phone.threads } } : undefined;

  // --- XP & niveau ---
  if (typeof delta.xp_gain === "number" && delta.xp_gain > 0) {
    const res = applyXp(prog, delta.xp_gain);
    prog = res.progression;
    if (res.levelsGained > 0) {
      effects.leveledUp = true;
      effects.levelsGained = res.levelsGained;
    }
  }

  // --- PV ---
  if (typeof delta.hp_delta === "number" && delta.hp_delta !== 0) {
    prog.hp = clamp(prog.hp + delta.hp_delta, 0, prog.hpMax);
  }

  // --- Monnaie ---
  if (typeof delta.currency_delta === "number" && delta.currency_delta !== 0) {
    prog.currency = Math.max(0, prog.currency + delta.currency_delta);
  }

  // --- Compétences ---
  if (Array.isArray(delta.skills_add)) {
    for (const skill of delta.skills_add) {
      const s = String(skill).trim();
      if (s && !prog.skills.includes(s)) prog.skills.push(s);
    }
  }

  // --- Objets ajoutés ---
  if (Array.isArray(delta.items_add)) {
    for (const it of delta.items_add) {
      const name = (it?.name ?? "").trim();
      if (!name) continue;
      const qty = it.qty && it.qty > 0 ? it.qty : 1;
      const existing = inventory.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.qty += qty;
      } else {
        inventory.push({ id: makeId("itm"), name, desc: it.desc, qty });
      }
      effects.gotItem = true;
    }
  }

  // --- Objets retirés ---
  if (Array.isArray(delta.items_remove)) {
    for (const it of delta.items_remove) {
      const name = (it?.name ?? "").trim();
      if (!name) continue;
      const qty = it.qty && it.qty > 0 ? it.qty : 1;
      const idx = inventory.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
      if (idx !== -1) {
        inventory[idx] = { ...inventory[idx], qty: inventory[idx].qty - qty };
        if (inventory[idx].qty <= 0) inventory.splice(idx, 1);
      }
    }
  }

  // --- Quêtes ajoutées ---
  if (Array.isArray(delta.quests_add)) {
    for (const q of delta.quests_add) {
      const title = (q?.title ?? "").trim();
      if (!title) continue;
      const id = (q.id ?? "").trim() || slug(title) || makeId("qst");
      if (quests.some((existing) => existing.id === id)) continue;
      const quest: Quest = { id, title, desc: q.desc ?? "", status: "active" };
      quests.push(quest);
      effects.questChanged = true;
    }
  }

  // --- Quêtes mises à jour ---
  if (Array.isArray(delta.quests_update)) {
    for (const upd of delta.quests_update) {
      const id = (upd?.id ?? "").trim();
      if (!id) continue;
      const q = quests.find((x) => x.id === id);
      if (q && (upd.status === "active" || upd.status === "done" || upd.status === "failed")) {
        q.status = upd.status;
        effects.questChanged = true;
      }
    }
  }

  // --- PNJ (upsert par nom) ---
  if (Array.isArray(delta.npcs_upsert)) {
    for (const n of delta.npcs_upsert) {
      const name = (n?.name ?? "").trim();
      if (!name) continue;
      const existing = npcs.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (typeof n.relationship === "number") {
          existing.relationship = clamp(n.relationship, -100, 100);
        }
        if (n.note) existing.note = n.note;
      } else {
        npcs.push({
          id: makeId("npc"),
          name,
          relationship: clamp(typeof n.relationship === "number" ? n.relationship : 0, -100, 100),
          note: n.note ?? "",
        });
      }
    }
  }

  // --- Lieu ---
  if (typeof delta.location === "string" && delta.location.trim()) {
    location = delta.location.trim();
  }

  // --- Flags ---
  if (delta.flags && typeof delta.flags === "object") {
    flags = { ...flags, ...delta.flags };
  }

  // --- Messages de téléphone entrants ---
  if (phone && Array.isArray(delta.phone_messages)) {
    for (const pm of delta.phone_messages) {
      const fromName = (pm?.from ?? "").trim();
      const text = (pm?.text ?? "").trim();
      if (!fromName || !text) continue;
      // Retrouver / créer le contact correspondant.
      let contact = phone.contacts.find((c) => c.name.toLowerCase() === fromName.toLowerCase());
      if (!contact) {
        contact = { id: makeId("ct"), name: fromName };
        phone.contacts = [...phone.contacts, contact];
      }
      const thread = phone.threads[contact.id] ? [...phone.threads[contact.id]] : [];
      thread.push({ from: "eux", text, at: new Date().toISOString() });
      phone.threads[contact.id] = thread;
      effects.phoneMessage = true;
    }
  }

  const newState: GameState = {
    ...state,
    progression: prog,
    inventory,
    quests,
    npcs,
    flags,
    location,
    phone,
    updatedAt: new Date().toISOString(),
  };

  return { state: newState, effects };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
