// =====================================================================
//  Petit utilitaire pour injecter des variables CSS personnalisées dans un
//  attribut style React typé (CSSProperties n'autorise pas les --vars).
// =====================================================================

import type { CSSProperties } from "react";

/** Construit un style React contenant des variables CSS (ex. --accent). */
export function cssVars(vars: Record<string, string>, base?: CSSProperties): CSSProperties {
  return { ...(base ?? {}), ...vars } as unknown as CSSProperties;
}

/** Raccourci : surcharge l'accent du thème localement (cartes multi-thèmes). */
export function accentVars(accent: string, accent2: string, base?: CSSProperties): CSSProperties {
  return cssVars({ "--accent": accent, "--accent2": accent2 }, base);
}
