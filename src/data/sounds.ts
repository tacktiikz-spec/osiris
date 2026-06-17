// =====================================================================
//  Manifeste sonore d'ONIRIA.
//  Associe chaque clé d'événement à un nom de fichier attendu dans le
//  dossier `sounds/` des données de l'application. L'utilisateur peut
//  déposer ses propres .mp3/.ogg et éditer ce manifeste (copié sur disque
//  sous forme de sounds.json au premier lancement).
//
//  Si un fichier est absent, un son procédural (Web Audio) prend le relais
//  pour ne jamais avoir de silence cassé (cf. lib/audio.ts).
// =====================================================================

export type SoundKind = "ambient" | "sfx";

export interface SoundDef {
  key: string;
  file: string; // nom de fichier relatif au dossier sounds/
  kind: SoundKind;
  loop: boolean;
  /** Volume relatif par défaut (0..1), avant application du volume global. */
  gain: number;
}

/** SFX globaux (indépendants du thème). */
export const SFX_KEYS = {
  select: "sfx_select",
  action: "sfx_action",
  scene: "sfx_scene",
  levelup: "sfx_levelup",
  quest: "sfx_quest",
  phone: "sfx_phone",
  error: "sfx_error",
  item: "sfx_item",
  fail: "sfx_fail",
  tick: "sfx_tick",
  panelOpen: "sfx_panel_open",
  panelClose: "sfx_panel_close",
  chip: "sfx_chip",
  statUp: "sfx_stat_up",
} as const;

/** Construit le manifeste par défaut (ambiances par thème + SFX). */
export function buildDefaultManifest(themeIds: string[]): SoundDef[] {
  const ambients: SoundDef[] = themeIds.map((id) => ({
    key: `ambient_${id}`,
    file: `ambient_${id}.mp3`,
    kind: "ambient",
    loop: true,
    gain: 0.6,
  }));

  const sfx: SoundDef[] = [
    { key: SFX_KEYS.select, file: "sfx_select.mp3", kind: "sfx", loop: false, gain: 0.5 },
    { key: SFX_KEYS.action, file: "sfx_action.mp3", kind: "sfx", loop: false, gain: 0.5 },
    { key: SFX_KEYS.scene, file: "sfx_scene.mp3", kind: "sfx", loop: false, gain: 0.6 },
    { key: SFX_KEYS.levelup, file: "sfx_levelup.mp3", kind: "sfx", loop: false, gain: 0.7 },
    { key: SFX_KEYS.quest, file: "sfx_quest.mp3", kind: "sfx", loop: false, gain: 0.6 },
    { key: SFX_KEYS.phone, file: "sfx_phone.mp3", kind: "sfx", loop: false, gain: 0.6 },
    { key: SFX_KEYS.error, file: "sfx_error.mp3", kind: "sfx", loop: false, gain: 0.5 },
    { key: SFX_KEYS.item, file: "sfx_item.mp3", kind: "sfx", loop: false, gain: 0.55 },
    { key: SFX_KEYS.fail, file: "sfx_fail.mp3", kind: "sfx", loop: false, gain: 0.5 },
    { key: SFX_KEYS.tick, file: "sfx_tick.mp3", kind: "sfx", loop: false, gain: 0.25 },
    { key: SFX_KEYS.panelOpen, file: "sfx_panel_open.mp3", kind: "sfx", loop: false, gain: 0.45 },
    { key: SFX_KEYS.panelClose, file: "sfx_panel_close.mp3", kind: "sfx", loop: false, gain: 0.45 },
    { key: SFX_KEYS.chip, file: "sfx_chip.mp3", kind: "sfx", loop: false, gain: 0.4 },
    { key: SFX_KEYS.statUp, file: "sfx_stat_up.mp3", kind: "sfx", loop: false, gain: 0.5 },
  ];

  return [...ambients, ...sfx];
}
