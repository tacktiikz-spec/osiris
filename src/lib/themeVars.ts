// =====================================================================
//  Applique les couleurs d'un thème sous forme de variables CSS globales,
//  consommées par index.css et les styles inline.
// =====================================================================

import type { Theme } from "@/data/themes";

export function applyThemeVars(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent2", theme.colors.accent2);
  root.style.setProperty("--bg", theme.colors.bg);
  root.style.setProperty("--bg-soft", theme.colors.bgSoft);
}
