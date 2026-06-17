// =====================================================================
//  Système audio d'ONIRIA (Howler.js + fallback procédural Web Audio).
//  - Ambiances en boucle avec fondus entre thèmes.
//  - SFX ponctuels.
//  - Les fichiers vivent dans <AppData>/sounds/ ; l'utilisateur peut y
//    déposer ses propres .mp3/.ogg et éditer sounds.json.
//  - Si un fichier manque, un son procédural prend le relais (jamais de
//    silence cassé).
// =====================================================================

import { Howl, Howler } from "howler";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { exists, mkdir, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { buildDefaultManifest, type SoundDef } from "@/data/sounds";
import { THEMES } from "@/data/themes";
import { isTauri } from "@/lib/config";

const SOUNDS_DIR = "sounds";
const MANIFEST_FILE = "sounds/sounds.json";

class AudioManager {
  private manifest: Record<string, SoundDef> = {};
  private howls = new Map<string, Howl>();
  private currentAmbient: { key: string; howl: Howl } | null = null;
  private ambientVolume = 0.5;
  private sfxVolume = 0.6;
  private muted = false;
  private started = false;

  // --- Web Audio (fallback procédural) ---
  private ctx: AudioContext | null = null;
  private proceduralAmbient: { osc: OscillatorNode; gain: GainNode } | null = null;

  /** Démarre l'audio (à appeler sur une interaction utilisateur). */
  start(): void {
    this.started = true;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.ctx = null;
      }
    }
    void this.ctx?.resume();
  }

  setVolumes(ambient: number, sfx: number, muted: boolean): void {
    this.ambientVolume = ambient;
    this.sfxVolume = sfx;
    this.muted = muted;
    Howler.mute(muted);
    if (this.currentAmbient) this.currentAmbient.howl.volume(this.effectiveAmbient(this.currentAmbient.key));
    if (this.proceduralAmbient) {
      this.proceduralAmbient.gain.gain.value = muted ? 0 : ambient * 0.04;
    }
  }

  /** Prépare le dossier sons et le manifeste (créé s'il manque). */
  async init(): Promise<void> {
    if (!isTauri()) {
      // En dev navigateur : pas de fichiers ; tout passera en procédural.
      this.manifest = {};
      return;
    }
    try {
      if (!(await exists(SOUNDS_DIR, { baseDir: BaseDirectory.AppData }))) {
        await mkdir(SOUNDS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
      }
      let defs: SoundDef[];
      if (await exists(MANIFEST_FILE, { baseDir: BaseDirectory.AppData })) {
        const raw = await readTextFile(MANIFEST_FILE, { baseDir: BaseDirectory.AppData });
        defs = JSON.parse(raw) as SoundDef[];
      } else {
        defs = buildDefaultManifest(THEMES.map((t) => t.id));
        await writeTextFile(MANIFEST_FILE, JSON.stringify(defs, null, 2), {
          baseDir: BaseDirectory.AppData,
        });
      }
      this.manifest = {};
      for (const d of defs) this.manifest[d.key] = d;
    } catch (e) {
      console.error("Init audio échouée :", e);
      this.manifest = {};
    }
  }

  private effectiveAmbient(key: string): number {
    const gain = this.manifest[key]?.gain ?? 0.6;
    return this.ambientVolume * gain;
  }

  private effectiveSfx(key: string): number {
    const gain = this.manifest[key]?.gain ?? 0.5;
    return this.sfxVolume * gain;
  }

  /** Résout l'URL utilisable par Howler pour un fichier du dossier sons. */
  private async resolveSrc(file: string): Promise<string | null> {
    if (!isTauri()) return null;
    try {
      const base = await appDataDir();
      const full = await join(base, SOUNDS_DIR, file);
      if (!(await exists(full))) return null;
      return convertFileSrc(full);
    } catch {
      return null;
    }
  }

  // ---------------- Ambiances ----------------

  async playAmbient(themeId: string): Promise<void> {
    if (!this.started) return;
    const key = `ambient_${themeId}`;
    if (this.currentAmbient?.key === key) return;

    // Fondu de sortie de l'ambiance actuelle.
    this.stopAmbient();

    const def = this.manifest[key];
    const src = def ? await this.resolveSrc(def.file) : null;

    if (src) {
      const howl = new Howl({ src: [src], loop: true, volume: 0, html5: true });
      howl.play();
      howl.fade(0, this.effectiveAmbient(key), 1500);
      this.currentAmbient = { key, howl };
    } else {
      // Fallback procédural : drone doux à la fréquence du thème.
      const theme = THEMES.find((t) => t.id === themeId);
      this.startProceduralAmbient(theme?.audio.fallbackDrone ?? 60);
      this.currentAmbient = null;
    }
  }

  stopAmbient(): void {
    if (this.currentAmbient) {
      const { howl } = this.currentAmbient;
      howl.fade(howl.volume(), 0, 1000);
      setTimeout(() => howl.unload(), 1100);
      this.currentAmbient = null;
    }
    this.stopProceduralAmbient();
  }

  private startProceduralAmbient(freq: number): void {
    if (!this.ctx) return;
    this.stopProceduralAmbient();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(
      this.muted ? 0 : this.ambientVolume * 0.04,
      this.ctx.currentTime + 1.5
    );
    this.proceduralAmbient = { osc, gain };
  }

  private stopProceduralAmbient(): void {
    if (this.proceduralAmbient && this.ctx) {
      const { osc, gain } = this.proceduralAmbient;
      try {
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
        osc.stop(this.ctx.currentTime + 0.7);
      } catch {
        /* ignore */
      }
      this.proceduralAmbient = null;
    }
  }

  // ---------------- SFX ----------------

  async playSfx(key: string): Promise<void> {
    if (!this.started || this.muted) return;
    const def = this.manifest[key];
    const src = def ? await this.resolveSrc(def.file) : null;
    if (src) {
      let howl = this.howls.get(key);
      if (!howl) {
        howl = new Howl({ src: [src], volume: this.effectiveSfx(key) });
        this.howls.set(key, howl);
      }
      howl.volume(this.effectiveSfx(key));
      howl.play();
    } else {
      this.proceduralSfx(key);
    }
  }

  /** SFX procéduraux : petites enveloppes sonores distinctes par type. */
  private proceduralSfx(key: string): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const presets: Record<string, { f: number; f2: number; type: OscillatorType; dur: number }> = {
      sfx_select: { f: 520, f2: 780, type: "triangle", dur: 0.08 },
      sfx_action: { f: 300, f2: 200, type: "sine", dur: 0.12 },
      sfx_scene: { f: 180, f2: 360, type: "sine", dur: 0.5 },
      sfx_levelup: { f: 440, f2: 1180, type: "square", dur: 0.45 },
      sfx_quest: { f: 620, f2: 940, type: "triangle", dur: 0.3 },
      sfx_phone: { f: 800, f2: 600, type: "sine", dur: 0.15 },
      sfx_error: { f: 200, f2: 110, type: "sawtooth", dur: 0.25 },
      sfx_item: { f: 1100, f2: 1650, type: "triangle", dur: 0.12 },
      sfx_fail: { f: 140, f2: 80, type: "sine", dur: 0.22 },
      sfx_tick: { f: 1400, f2: 1200, type: "square", dur: 0.02 },
      sfx_panel_open: { f: 280, f2: 720, type: "sine", dur: 0.18 },
      sfx_panel_close: { f: 720, f2: 240, type: "sine", dur: 0.18 },
      sfx_chip: { f: 900, f2: 1100, type: "triangle", dur: 0.04 },
      sfx_stat_up: { f: 600, f2: 1000, type: "triangle", dur: 0.12 },
    };
    const p = presets[key] ?? presets.sfx_select;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.f, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.f2), now + p.dur);
    const vol = this.sfxVolume * 0.18;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + p.dur + 0.02);
  }
}

export const audio = new AudioManager();
