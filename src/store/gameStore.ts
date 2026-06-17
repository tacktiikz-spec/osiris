// =====================================================================
//  Store global (Zustand) : config, état de jeu, navigation, UI, et toutes
//  les actions (narratives → IA, ou locales → gratuites/instantanées).
// =====================================================================

import { create } from "zustand";
import type { GameState, InventoryItem, Stats } from "@/types/game";
import { type AppConfig, DEFAULT_CONFIG, loadConfig, saveConfig } from "@/lib/config";
import { callNarration, callPhoneReply, AnthropicError } from "@/lib/anthropic";
import { parseTurn, applyDelta } from "@/lib/stateProtocol";
import { buildOpeningUserPrompt } from "@/lib/prompts";
import { foldMemory } from "@/lib/memory";
import { spendPoint } from "@/lib/progression";
import {
  writeSave,
  readSave,
  AUTOSAVE_NAME,
} from "@/lib/persistence";
import { normalizeState } from "@/lib/migrate";
import { audio } from "@/lib/audio";
import { SFX_KEYS } from "@/data/sounds";
import { getTheme } from "@/data/themes";
import { worldLabel } from "@/lib/world";

export type Screen = "home" | "settings" | "creation" | "game";
export type Panel =
  | "none"
  | "status"
  | "inventory"
  | "quests"
  | "chronicle"
  | "phone"
  | "relations"
  | "atlas";

interface SceneFlash {
  /** Incrémenté pour déclencher un flash de transition de scène. */
  tick: number;
  color: string;
}

/** Notifications système (pop-ups automatiques, type Solo Leveling). */
export type GameNotification =
  | { id: number; kind: "levelup"; level: number }
  | { id: number; kind: "item"; label: string }
  | { id: number; kind: "quest"; label: string; done: boolean }
  | { id: number; kind: "xp"; amount: number }
  | { id: number; kind: "fail" }
  | { id: number; kind: "world"; label: string }
  | { id: number; kind: "relation"; label: string }
  | { id: number; kind: "condition"; label: string; debuff: boolean }
  | { id: number; kind: "codex"; label: string; category: string };

interface GameStore {
  // --- Config ---
  config: AppConfig;
  configLoaded: boolean;

  // --- Jeu ---
  game: GameState | null;

  // --- Navigation / UI ---
  screen: Screen;
  panel: Panel;
  busy: boolean; // un appel IA est en cours
  error: string | null;
  lastFailedInput: string | null; // pour le bouton « réessayer »
  sceneFlash: SceneFlash;
  levelUpToast: number; // tick d'animation montée de niveau
  notifications: GameNotification[];

  // --- Init ---
  initApp: () => Promise<void>;

  // --- Notifications ---
  dismissNotification: (id: number) => void;

  // --- Config setters ---
  setConfig: (patch: Partial<AppConfig>) => Promise<void>;

  // --- Navigation ---
  goTo: (screen: Screen) => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;

  // --- Cycle de partie ---
  startNewGame: (state: GameState) => Promise<void>;
  resumeGame: () => Promise<boolean>;
  setGame: (state: GameState) => void;

  // --- Tour de jeu (narratif → IA) ---
  sendTurn: (input: string) => Promise<void>;
  retryTurn: () => Promise<void>;
  clearError: () => void;

  // --- Actions locales (sans IA) ---
  spendStatPoint: (stat: keyof Stats) => void;
  toggleEquip: (itemId: string) => void;

  // --- Téléphone ---
  sendPhoneMessage: (contactId: string, text: string) => Promise<void>;

  // --- Sauvegarde ---
  saveToSlot: (slot: string) => Promise<void>;
  autosave: () => Promise<void>;
}

export const useGame = create<GameStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  configLoaded: false,
  game: null,
  screen: "home",
  panel: "none",
  busy: false,
  error: null,
  lastFailedInput: null,
  sceneFlash: { tick: 0, color: "#ffffff" },
  levelUpToast: 0,
  notifications: [],

  dismissNotification(id) {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },

  async initApp() {
    const config = await loadConfig();
    set({ config, configLoaded: true });
    await audio.init();
    audio.setVolumes(config.ambientVolume, config.sfxVolume, config.muted);
  },

  async setConfig(patch) {
    const config = { ...get().config, ...patch };
    set({ config });
    await saveConfig(config);
    audio.setVolumes(config.ambientVolume, config.sfxVolume, config.muted);
  },

  goTo(screen) {
    void audio.playSfx(SFX_KEYS.select);
    set({ screen, panel: "none", error: null });
  },

  openPanel(panel) {
    void audio.playSfx(SFX_KEYS.panelOpen);
    set({ panel });
  },

  closePanel() {
    void audio.playSfx(SFX_KEYS.panelClose);
    set({ panel: "none" });
  },

  setGame(state) {
    set({ game: normalizeState(state) });
  },

  async startNewGame(state) {
    set({ game: state, screen: "game", panel: "none", error: null });
    const theme = getTheme(state.theme);
    void audio.playAmbient(theme.id);
    // Premier tour : on injecte un prompt d'ouverture et on appelle l'IA.
    const opening = buildOpeningUserPrompt(state);
    const seeded: GameState = {
      ...state,
      messages: [{ role: "user", content: opening }],
    };
    set({ game: seeded });
    await runTurn(set, get, seeded, /*isOpening*/ true);
  },

  async resumeGame() {
    const st = await readSave(AUTOSAVE_NAME);
    if (!st) return false;
    set({ game: normalizeState(st), screen: "game", panel: "none", error: null });
    void audio.playAmbient(getTheme(st.theme).id);
    return true;
  },

  async sendTurn(input) {
    const game = get().game;
    if (!game || get().busy) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    void audio.playSfx(SFX_KEYS.action);
    const withUser: GameState = {
      ...game,
      messages: [...game.messages, { role: "user", content: trimmed }],
    };
    set({ game: withUser, error: null, lastFailedInput: trimmed });
    await runTurn(set, get, withUser, false);
  },

  async retryTurn() {
    const game = get().game;
    if (!game || get().busy) return;
    set({ error: null });
    await runTurn(set, get, game, false);
  },

  clearError() {
    set({ error: null });
  },

  spendStatPoint(stat) {
    const game = get().game;
    if (!game) return;
    const res = spendPoint(game.character.stats, game.progression, stat);
    if (!res) return;
    void audio.playSfx(SFX_KEYS.statUp);
    set({
      game: {
        ...game,
        character: { ...game.character, stats: res.stats },
        progression: res.progression,
        updatedAt: new Date().toISOString(),
      },
    });
    void get().autosave();
  },

  toggleEquip(itemId) {
    const game = get().game;
    if (!game) return;
    const inventory: InventoryItem[] = game.inventory.map((it) =>
      it.id === itemId ? { ...it, equipped: !it.equipped } : it
    );
    void audio.playSfx(SFX_KEYS.select);
    set({ game: { ...game, inventory, updatedAt: new Date().toISOString() } });
    void get().autosave();
  },

  async sendPhoneMessage(contactId, text) {
    const game = get().game;
    if (!game || !game.phone || get().busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const contact = game.phone.contacts.find((c) => c.id === contactId);
    if (!contact) return;

    // Ajout local immédiat du message « moi ».
    const thread = game.phone.threads[contactId] ?? [];
    const newThread = [...thread, { from: "moi" as const, text: trimmed, at: new Date().toISOString() }];
    const updatedPhone = {
      ...game.phone,
      threads: { ...game.phone.threads, [contactId]: newThread },
    };
    const withMine: GameState = { ...game, phone: updatedPhone };
    set({ game: withMine, busy: true, error: null });
    void audio.playSfx(SFX_KEYS.phone);

    try {
      const reply = await callPhoneReply(
        get().config.apiKey,
        withMine,
        contact.name,
        newThread.map((m) => ({ from: m.from, text: m.text }))
      );
      const lines = reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const at = new Date().toISOString();
      const replied = [...newThread, ...lines.map((text) => ({ from: "eux" as const, text, at }))];
      const finalPhone = {
        ...updatedPhone,
        threads: { ...updatedPhone.threads, [contactId]: replied },
      };
      set({ game: { ...withMine, phone: finalPhone, updatedAt: new Date().toISOString() }, busy: false });
      void audio.playSfx(SFX_KEYS.phone);
      void get().autosave();
    } catch (e) {
      const err = e as AnthropicError;
      void audio.playSfx(SFX_KEYS.error);
      set({ busy: false, error: err.message ?? "Échec de l'envoi du message." });
    }
  },

  async saveToSlot(slot) {
    const game = get().game;
    if (!game) return;
    await writeSave(slot, game);
  },

  async autosave() {
    const game = get().game;
    if (!game) return;
    await writeSave(AUTOSAVE_NAME, game);
  },
}));

// Compteur d'identifiants de notifications.
let notifCounter = 0;
function nextNotifId(): number {
  notifCounter += 1;
  return notifCounter;
}

// ---------------------------------------------------------------------
//  Logique de tour partagée (appel IA + application des deltas + mémoire).
// ---------------------------------------------------------------------

async function runTurn(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
  baseState: GameState,
  isOpening: boolean
): Promise<void> {
  const { config } = get();
  if (!config.apiKey?.trim()) {
    set({ error: "Aucune clé API configurée. Ouvre les Réglages pour en saisir une.", busy: false });
    return;
  }

  set({ busy: true, error: null });

  try {
    const raw = await callNarration(config.apiKey, baseState);
    const parsed = parseTurn(raw);

    // Message assistant nettoyé (récit + actions) ajouté au log.
    let next: GameState = {
      ...baseState,
      messages: [
        ...baseState.messages,
        { role: "assistant", content: parsed.narrative, actions: parsed.actions },
      ],
    };

    // Application des deltas d'état.
    const { state: applied, effects } = applyDelta(next, parsed.delta);
    next = applied;

    set({ game: next, busy: false });

    // Effets sonores / visuels + notifications système.
    const theme = getTheme(next.theme);
    if (isOpening) {
      set({ sceneFlash: { tick: get().sceneFlash.tick + 1, color: theme.colors.accent } });
    }

    const notifs: GameNotification[] = [];
    const delta = parsed.delta;

    if (effects.leveledUp) {
      void audio.playSfx(SFX_KEYS.levelup);
      notifs.push({ id: nextNotifId(), kind: "levelup", level: next.progression.level });
    }
    if (delta?.xp_gain && delta.xp_gain > 0) {
      notifs.push({ id: nextNotifId(), kind: "xp", amount: delta.xp_gain });
    }
    if (effects.gotItem) {
      void audio.playSfx(SFX_KEYS.item);
      const names = (delta?.items_add ?? []).map((i) => i.name).filter(Boolean);
      if (names.length) notifs.push({ id: nextNotifId(), kind: "item", label: names.join(", ") });
    }
    if (effects.questChanged) {
      void audio.playSfx(SFX_KEYS.quest);
      for (const q of delta?.quests_add ?? []) {
        if (q.title) notifs.push({ id: nextNotifId(), kind: "quest", label: q.title, done: false });
      }
      for (const u of delta?.quests_update ?? []) {
        if (u.status === "done") {
          const q = next.quests.find((x) => x.id === u.id);
          notifs.push({ id: nextNotifId(), kind: "quest", label: q?.title ?? "Quête accomplie", done: true });
        }
      }
    }
    if (typeof delta?.hp_delta === "number" && delta.hp_delta < 0) {
      void audio.playSfx(SFX_KEYS.fail);
      notifs.push({ id: nextNotifId(), kind: "fail" });
    }
    if (effects.dayAdvanced) {
      void audio.playSfx(SFX_KEYS.scene);
      notifs.push({ id: nextNotifId(), kind: "world", label: worldLabel(next.world) });
    }
    for (const name of effects.newNpcs) {
      notifs.push({ id: nextNotifId(), kind: "relation", label: name });
    }
    for (const cond of effects.newConditions) {
      void audio.playSfx(cond.debuff ? SFX_KEYS.fail : SFX_KEYS.item);
      notifs.push({ id: nextNotifId(), kind: "condition", label: cond.label, debuff: cond.debuff });
    }
    for (const entry of effects.newCodex) {
      void audio.playSfx(SFX_KEYS.select);
      notifs.push({ id: nextNotifId(), kind: "codex", label: entry.title, category: entry.category });
    }
    if (effects.phoneMessage) void audio.playSfx(SFX_KEYS.phone);

    if (notifs.length) {
      set({
        notifications: [...get().notifications, ...notifs],
        levelUpToast: effects.leveledUp ? get().levelUpToast + 1 : get().levelUpToast,
      });
    }

    // Autosave après chaque tour.
    await get().autosave();

    // Condensation de mémoire si nécessaire (en tâche de fond, sans bloquer).
    void maybeFold(set, get);
  } catch (e) {
    const err = e as AnthropicError;
    void audio.playSfx(SFX_KEYS.error);
    set({ busy: false, error: err.message ?? "Une erreur est survenue lors de l'appel à l'IA." });
  }
}

async function maybeFold(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
): Promise<void> {
  const game = get().game;
  if (!game) return;
  const patch = await foldMemory(get().config.apiKey, game);
  if (patch) {
    const current = get().game;
    if (!current) return;
    set({ game: { ...current, chronicle: patch.chronicle, foldedTo: patch.foldedTo } });
    await get().autosave();
  }
}
