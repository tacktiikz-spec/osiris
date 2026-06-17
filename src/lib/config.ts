// =====================================================================
//  Configuration locale d'ONIRIA (clé API, volumes, préférences).
//  Stockée dans le dossier de données de l'app : oniria-config.json.
//  La clé API n'est JAMAIS en dur dans le code ni committée.
// =====================================================================

import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

export interface AppConfig {
  apiKey: string;
  /** Volume des ambiances (0..1). */
  ambientVolume: number;
  /** Volume des effets sonores (0..1). */
  sfxVolume: number;
  /** Coupure globale du son. */
  muted: boolean;
  /** Effet machine à écrire activé. */
  typewriter: boolean;
  /** Vitesse machine à écrire (ms par caractère). */
  typewriterSpeed: number;
  /** Réduction des animations (override de prefers-reduced-motion). */
  reducedMotion: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  apiKey: "",
  ambientVolume: 0.3,
  sfxVolume: 0.6,
  muted: false,
  typewriter: true,
  typewriterSpeed: 18,
  reducedMotion: false,
};

const CONFIG_FILE = "oniria-config.json";

/** Détecte si on tourne bien dans l'environnement Tauri (et non navigateur nu). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** S'assure que le dossier de données de l'app existe. */
async function ensureAppDataDir(): Promise<void> {
  const dirExists = await exists("", { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function loadConfig(): Promise<AppConfig> {
  if (!isTauri()) {
    // Mode développement navigateur : fallback localStorage.
    try {
      const raw = localStorage.getItem(CONFIG_FILE);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_CONFIG };
  }

  try {
    await ensureAppDataDir();
    const present = await exists(CONFIG_FILE, { baseDir: BaseDirectory.AppData });
    if (!present) return { ...DEFAULT_CONFIG };
    const raw = await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppData });
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Impossible de charger la config :", e);
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const serialized = JSON.stringify(config, null, 2);
  if (!isTauri()) {
    try {
      localStorage.setItem(CONFIG_FILE, serialized);
    } catch {
      /* ignore */
    }
    return;
  }
  await ensureAppDataDir();
  await writeTextFile(CONFIG_FILE, serialized, { baseDir: BaseDirectory.AppData });
}
