// =====================================================================
//  Modèle d'état de jeu — la colonne vertébrale d'ONIRIA.
//  Ce type est sérialisé en JSON sur le disque (sauvegardes lisibles).
// =====================================================================

/** Version du schéma de sauvegarde. À incrémenter en cas de migration. */
export const GAME_STATE_VERSION = 2;

/** Les cinq aptitudes du personnage (échelle 1..5). */
export interface Stats {
  for: number; // Force
  agi: number; // Agilité
  esp: number; // Esprit
  vol: number; // Volonté
  pre: number; // Présence
}

export interface Character {
  name: string;
  avatarPath?: string; // chemin local de l'image (copiée dans les données)
  archetype: string; // id d'archétype (cf. data/archetypes.ts)
  stats: Stats;
  origin?: string;
  trait?: string;
  goal?: string;
}

export interface Progression {
  level: number;
  xp: number;
  xpToNext: number; // seuil calculé localement
  unspentPoints: number; // points à dépenser à la montée de niveau
  hp: number;
  hpMax: number;
  currency: number; // monnaie de l'univers
  skills: string[]; // compétences débloquées
}

export interface InventoryItem {
  id: string;
  name: string;
  desc?: string;
  qty: number;
  equipped?: boolean;
}

export type QuestStatus = "active" | "done" | "failed";

export interface Quest {
  id: string;
  title: string;
  desc: string;
  status: QuestStatus;
}

export interface Npc {
  id: string;
  name: string;
  relationship: number; // -100..100
  note: string;
}

/** Message du fil de discussion du téléphone. */
export interface PhoneMessage {
  from: "moi" | "eux";
  text: string;
  at: string; // ISO date
}

export interface Phone {
  contacts: { id: string; name: string }[];
  threads: Record<string, PhoneMessage[]>; // clé = id du contact
}

/** Moment de la journée (simulation du temps qui passe). */
export type TimeOfDay = "aube" | "matin" | "midi" | "après-midi" | "crépuscule" | "nuit";

export const TIME_ORDER: TimeOfDay[] = [
  "aube",
  "matin",
  "midi",
  "après-midi",
  "crépuscule",
  "nuit",
];

/** État du monde : horloge, calendrier, météo. */
export interface WorldState {
  day: number; // jour 1, 2, 3...
  time: TimeOfDay;
  weather: string; // libre : « ciel dégagé », « pluie battante »...
}

/** Effet d'état temporaire ou durable (blessure, bénédiction, fatigue...). */
export interface Condition {
  id: string;
  label: string;
  kind: "buff" | "debuff" | "neutral";
  note?: string;
}

/** Entrée d'Atlas : savoir découvert au fil de l'aventure. */
export type CodexCategory = "lieu" | "personne" | "faction" | "créature" | "savoir";

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  title: string;
  text: string;
  discoveredAt: string; // ISO date
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string; // récit nettoyé (sans le bloc d'état) pour l'assistant
  actions?: string[]; // actions suggérées extraites de la ligne >>>
}

export interface GameState {
  version: number;
  createdAt: string;
  updatedAt: string;

  theme: string; // id du thème
  customDesc?: string; // si thème « sur mesure »

  character: Character;
  progression: Progression;

  inventory: InventoryItem[];
  quests: Quest[];
  npcs: Npc[];

  location: string;
  flags: Record<string, string | number | boolean>;

  world: WorldState; // horloge / calendrier / météo
  conditions: Condition[]; // états temporaires actifs
  codex: CodexEntry[]; // atlas des découvertes

  phone?: Phone; // activé seulement pour certains thèmes

  chronicle: string; // mémoire condensée
  foldedTo: number; // index jusqu'où le log a été condensé
  messages: ChatMessage[]; // log complet (affichage)
}

// ---------------------------------------------------------------------
//  Protocole [[ETAT]] : structure des deltas renvoyés par l'IA.
// ---------------------------------------------------------------------

export interface StateDelta {
  xp_gain?: number;
  hp_delta?: number;
  currency_delta?: number;
  items_add?: { name: string; desc?: string; qty?: number }[];
  items_remove?: { name: string; qty?: number }[];
  skills_add?: string[];
  quests_add?: { id?: string; title: string; desc?: string }[];
  quests_update?: { id: string; status: QuestStatus }[];
  npcs_upsert?: { name: string; relationship?: number; note?: string }[];
  location?: string | null;
  flags?: Record<string, string | number | boolean>;
  phone_messages?: { from: string; text: string }[];

  // --- Simulation du monde ---
  time_set?: TimeOfDay; // fixe le moment de la journée
  day_delta?: number; // avance (ou recule) le compteur de jours
  weather?: string; // change la météo

  // --- Conditions (états) ---
  conditions_add?: { label: string; kind?: "buff" | "debuff" | "neutral"; note?: string }[];
  conditions_remove?: string[]; // par libellé

  // --- Atlas / découvertes ---
  codex_add?: { category?: CodexCategory; title: string; text?: string }[];
}
