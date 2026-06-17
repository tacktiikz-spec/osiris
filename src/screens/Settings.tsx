// =====================================================================
//  Écran Réglages — design holographique. Logique inchangée.
//  Clé API, volumes, dossier des sons, gestion des sauvegardes.
// =====================================================================

import { useEffect, useState } from "react";
import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";
import { testApiKey } from "@/lib/anthropic";
import { isTauri } from "@/lib/config";
import {
  listSaves,
  deleteSave,
  readSave,
  exportSaveTo,
  importSaveFrom,
  type SaveSlotInfo,
} from "@/lib/persistence";
import { getTheme } from "@/data/themes";

const fieldStyle = {
  border: "1px solid var(--border-dim)",
  background: "var(--bg-panel)",
  color: "var(--text-primary)",
} as const;

export default function Settings() {
  const config = useGame((s) => s.config);
  const setConfig = useGame((s) => s.setConfig);
  const goTo = useGame((s) => s.goTo);
  const setGame = useGame((s) => s.setGame);

  const [keyDraft, setKeyDraft] = useState(config.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saves, setSaves] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    void refreshSaves();
  }, []);

  async function refreshSaves() {
    setSaves(await listSaves());
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    await setConfig({ apiKey: keyDraft.trim() });
    const res = await testApiKey(keyDraft.trim());
    setTestResult(res);
    setTesting(false);
  }

  async function openSoundsFolder() {
    if (!isTauri()) return;
    try {
      const { appDataDir, join } = await import("@tauri-apps/api/path");
      const { openPath } = await import("@tauri-apps/plugin-opener");
      const dir = await join(await appDataDir(), "sounds");
      await openPath(dir);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSlot(name: string) {
    const st = await readSave(name);
    if (st) {
      setGame(st);
      goTo("game");
    }
  }

  async function exportSlot(name: string) {
    if (!isTauri()) return;
    const st = await readSave(name);
    if (!st) return;
    const { save } = await import("@tauri-apps/plugin-dialog");
    const dest = await save({
      defaultPath: `oniria-${st.character.name || "save"}.json`,
      filters: [{ name: "Sauvegarde ONIRIA", extensions: ["json"] }],
    });
    if (dest) await exportSaveTo(st, dest);
  }

  async function importSave() {
    if (!isTauri()) return;
    const { open } = await import("@tauri-apps/plugin-dialog");
    const src = await open({
      multiple: false,
      filters: [{ name: "Sauvegarde ONIRIA", extensions: ["json"] }],
    });
    if (typeof src === "string") {
      try {
        const st = await importSaveFrom(src);
        setGame(st);
        goTo("game");
      } catch (e) {
        console.error("Import échoué :", e);
      }
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-8 py-7">
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="font-display-title text-3xl"
          style={{ color: "var(--text-primary)", textShadow: "0 0 30px color-mix(in srgb, var(--accent) 55%, transparent)" }}
        >
          Réglages
        </h1>
        <HoloBtn label="◂ Retour" onClick={() => goTo("home")} />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-2">
        {/* --- Clé API --- */}
        <HoloPanel title="Clé API Anthropic" icon="⚿">
          <p className="font-display mb-3 text-[11px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
            Stockée uniquement sur votre disque, jamais partagée. Obtenez-en une sur{" "}
            <span style={{ color: "var(--text-accent)" }}>console.anthropic.com</span>.
          </p>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="sk-ant-..."
              className="font-data flex-1 px-3 py-2 text-sm outline-none"
              style={fieldStyle}
            />
            <HoloBtn label={showKey ? "Cacher" : "Voir"} onClick={() => setShowKey((v) => !v)} />
            <HoloBtn label={testing ? "Test…" : "Tester & enregistrer"} primary onClick={handleTest} disabled={testing || !keyDraft.trim()} />
          </div>
          {testResult && (
            <div className="font-display mt-3 text-sm" style={{ color: testResult.ok ? "var(--success)" : "var(--danger)" }}>
              {testResult.message}
            </div>
          )}
        </HoloPanel>

        {/* --- Audio --- */}
        <HoloPanel title="Audio" icon="♪">
          <div className="space-y-4">
            <Slider label={`Ambiance — ${Math.round(config.ambientVolume * 100)}%`} value={config.ambientVolume} onChange={(v) => setConfig({ ambientVolume: v })} />
            <Slider label={`Effets — ${Math.round(config.sfxVolume * 100)}%`} value={config.sfxVolume} onChange={(v) => setConfig({ sfxVolume: v })} />
            <div className="flex items-center justify-between">
              <Toggle label="Couper le son" checked={config.muted} onChange={(v) => setConfig({ muted: v })} />
              <HoloBtn label="Ouvrir le dossier des sons" onClick={openSoundsFolder} disabled={!isTauri()} />
            </div>
            <p className="font-display text-[11px]" style={{ color: "var(--text-secondary)" }}>
              Déposez vos fichiers .mp3/.ogg dans ce dossier et éditez <span className="font-data">sounds.json</span>. Un son de secours est généré si un fichier manque.
            </p>
          </div>
        </HoloPanel>

        {/* --- Affichage --- */}
        <HoloPanel title="Affichage" icon="◳">
          <div className="space-y-3">
            <Toggle label="Effet machine à écrire" checked={config.typewriter} onChange={(v) => setConfig({ typewriter: v })} />
            {config.typewriter && (
              <Slider label={`Vitesse de frappe — ${config.typewriterSpeed} ms`} value={config.typewriterSpeed / 60} onChange={(v) => setConfig({ typewriterSpeed: Math.max(2, Math.round(v * 60)) })} />
            )}
            <Toggle label="Réduire les animations" checked={config.reducedMotion} onChange={(v) => setConfig({ reducedMotion: v })} />
          </div>
        </HoloPanel>

        {/* --- Sauvegardes --- */}
        <HoloPanel title="Sauvegardes" icon="❒" headerRight={<HoloBtn label="Importer" onClick={importSave} disabled={!isTauri()} />}>
          {saves.length === 0 ? (
            <p className="font-display text-sm" style={{ color: "var(--text-secondary)" }}>
              Aucune sauvegarde pour l'instant.
            </p>
          ) : (
            <div className="space-y-2">
              {saves.map((s) => (
                <div key={s.name} className="flex items-center justify-between px-3 py-2" style={{ background: "var(--bg-panel-hover)", border: "1px solid var(--border-dim)" }}>
                  <div>
                    <div className="font-display-title text-[12px]" style={{ color: "var(--text-primary)" }}>
                      {s.label} · {s.characterName}{" "}
                      <span style={{ color: "var(--text-secondary)" }}>— {getTheme(s.theme).name}, niv. {s.level}</span>
                    </div>
                    <div className="font-data text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      {new Date(s.updatedAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <HoloBtn label="Charger" onClick={() => loadSlot(s.name)} />
                    <HoloBtn label="Exporter" onClick={() => exportSlot(s.name)} disabled={!isTauri()} />
                    <HoloBtn label="Suppr." danger onClick={async () => { await deleteSave(s.name); await refreshSaves(); }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </HoloPanel>
      </div>
    </div>
  );
}

function HoloBtn({
  label,
  onClick,
  primary,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const color = danger ? "var(--danger)" : primary ? "#000" : "var(--text-secondary)";
  const bg = primary ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--bg-panel)";
  const border = danger ? "var(--danger)" : "var(--border-dim)";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="holo-interactive font-display-title px-3 py-2 text-[11px] disabled:opacity-30"
      style={{ background: bg, color, border: `1px solid ${border}`, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {label}
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="font-display mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-[var(--accent)]" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="font-display flex cursor-pointer items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--border-dim)" }}
      >
        <span className="absolute top-0.5 h-5 w-5 transition-all" style={{ left: checked ? "22px" : "2px", background: checked ? "#000" : "var(--text-secondary)" }} />
      </button>
      {label}
    </label>
  );
}
