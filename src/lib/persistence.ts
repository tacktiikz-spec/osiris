// =====================================================================
//  Sauvegarde / chargement sur disque (Tauri fs).
//  Tout est stocké dans le dossier de données de l'app, en JSON lisible.
//   - saves/slot-<n>.json   : emplacements manuels
//   - saves/autosave.json   : sauvegarde auto après chaque tour
//   - avatars/<id>.<ext>    : avatars copiés depuis le disque utilisateur
// =====================================================================

import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
  copyFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import type { GameState } from "@/types/game";
import { isTauri } from "@/lib/config";

const SAVES_DIR = "saves";
const AVATARS_DIR = "avatars";
export const AUTOSAVE_NAME = "autosave";
export const MAX_SLOTS = 6;

export interface SaveSlotInfo {
  name: string; // "autosave" | "slot-1" ...
  label: string;
  characterName: string;
  theme: string;
  level: number;
  updatedAt: string;
  isAutosave: boolean;
}

async function ensureDir(dir: string): Promise<void> {
  const present = await exists(dir, { baseDir: BaseDirectory.AppData });
  if (!present) {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

function savePath(name: string): string {
  return `${SAVES_DIR}/${name}.json`;
}

/** Écrit un GameState dans un emplacement nommé. */
export async function writeSave(name: string, state: GameState): Promise<void> {
  const payload = JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2);
  if (!isTauri()) {
    localStorage.setItem(`oniria-save-${name}`, payload);
    return;
  }
  await ensureDir(SAVES_DIR);
  await writeTextFile(savePath(name), payload, { baseDir: BaseDirectory.AppData });
}

/** Lit un GameState depuis un emplacement nommé (null si absent/invalide). */
export async function readSave(name: string): Promise<GameState | null> {
  if (!isTauri()) {
    const raw = localStorage.getItem(`oniria-save-${name}`);
    return raw ? (JSON.parse(raw) as GameState) : null;
  }
  try {
    const present = await exists(savePath(name), { baseDir: BaseDirectory.AppData });
    if (!present) return null;
    const raw = await readTextFile(savePath(name), { baseDir: BaseDirectory.AppData });
    return JSON.parse(raw) as GameState;
  } catch (e) {
    console.error(`Lecture de la sauvegarde ${name} échouée :`, e);
    return null;
  }
}

export async function deleteSave(name: string): Promise<void> {
  if (!isTauri()) {
    localStorage.removeItem(`oniria-save-${name}`);
    return;
  }
  try {
    const present = await exists(savePath(name), { baseDir: BaseDirectory.AppData });
    if (present) await remove(savePath(name), { baseDir: BaseDirectory.AppData });
  } catch (e) {
    console.error(`Suppression de la sauvegarde ${name} échouée :`, e);
  }
}

/** Liste les emplacements de sauvegarde présents avec leurs métadonnées. */
export async function listSaves(): Promise<SaveSlotInfo[]> {
  const infos: SaveSlotInfo[] = [];
  if (!isTauri()) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("oniria-save-")) {
        const name = key.replace("oniria-save-", "");
        const st = await readSave(name);
        if (st) infos.push(toInfo(name, st));
      }
    }
    return sortSaves(infos);
  }
  try {
    await ensureDir(SAVES_DIR);
    const entries = await readDir(SAVES_DIR, { baseDir: BaseDirectory.AppData });
    for (const e of entries) {
      if (e.isFile && e.name.endsWith(".json")) {
        const name = e.name.replace(/\.json$/, "");
        const st = await readSave(name);
        if (st) infos.push(toInfo(name, st));
      }
    }
  } catch (e) {
    console.error("Listing des sauvegardes échoué :", e);
  }
  return sortSaves(infos);
}

function toInfo(name: string, st: GameState): SaveSlotInfo {
  const isAutosave = name === AUTOSAVE_NAME;
  return {
    name,
    label: isAutosave ? "Sauvegarde auto" : name.replace("slot-", "Emplacement "),
    characterName: st.character?.name ?? "—",
    theme: st.theme,
    level: st.progression?.level ?? 1,
    updatedAt: st.updatedAt,
    isAutosave,
  };
}

function sortSaves(infos: SaveSlotInfo[]): SaveSlotInfo[] {
  return infos.sort((a, b) => {
    if (a.isAutosave) return -1;
    if (b.isAutosave) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/** Copie un avatar choisi par l'utilisateur dans les données de l'app. */
export async function copyAvatar(sourcePath: string): Promise<string> {
  if (!isTauri()) return sourcePath;
  await ensureDir(AVATARS_DIR);
  const ext = sourcePath.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${AVATARS_DIR}/avatar_${Date.now()}.${ext}`;
  // La source est un chemin absolu ; la destination est relative à AppData.
  await copyFile(sourcePath, fileName, { toPathBaseDir: BaseDirectory.AppData });
  return fileName;
}

/** Exporte une sauvegarde vers un chemin absolu choisi par l'utilisateur. */
export async function exportSaveTo(state: GameState, destAbsolutePath: string): Promise<void> {
  if (!isTauri()) return;
  await writeTextFile(destAbsolutePath, JSON.stringify(state, null, 2));
}

/** Importe une sauvegarde depuis un chemin absolu. */
export async function importSaveFrom(srcAbsolutePath: string): Promise<GameState> {
  if (!isTauri()) throw new Error("Import indisponible hors Tauri.");
  const raw = await readTextFile(srcAbsolutePath);
  return JSON.parse(raw) as GameState;
}
