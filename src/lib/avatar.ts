// =====================================================================
//  Résolution de l'URL d'un avatar stocké (chemin relatif à AppData).
//  Utilise le protocole asset de Tauri (convertFileSrc).
// =====================================================================

import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, join, isAbsolute } from "@tauri-apps/api/path";
import { isTauri } from "@/lib/config";

export async function avatarUrl(storedPath?: string): Promise<string | null> {
  if (!storedPath) return null;
  if (!isTauri()) return storedPath;
  try {
    const absolute = (await isAbsolute(storedPath))
      ? storedPath
      : await join(await appDataDir(), storedPath);
    return convertFileSrc(absolute);
  } catch {
    return null;
  }
}
