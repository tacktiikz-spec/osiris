// =====================================================================
//  Étape 2 — Identité : nom (obligatoire), avatar (cadre holographique), origine.
//  Logique d'upload/copie inchangée.
// =====================================================================

import { useState } from "react";
import type { CreationDraft } from "@/lib/createGame";
import { isTauri } from "@/lib/config";
import { copyAvatar } from "@/lib/persistence";
import { avatarUrl } from "@/lib/avatar";

interface Props {
  draft: CreationDraft;
  update: (patch: Partial<CreationDraft>) => void;
}

const fieldStyle = {
  border: "1px solid var(--border-dim)",
  background: "var(--bg-panel)",
  color: "var(--text-primary)",
} as const;

export default function StepIdentity({ draft, update }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  async function pickAvatar() {
    if (!isTauri()) return;
    setBusy(true);
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const src = await open({
        multiple: false,
        filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp"] }],
      });
      if (typeof src === "string") {
        const stored = await copyAvatar(src);
        update({ avatarPath: stored });
        setPreview(await avatarUrl(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={pickAvatar}
          disabled={busy || !isTauri()}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="relative flex h-32 w-32 items-center justify-center overflow-hidden"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-dim)",
            boxShadow: "0 0 24px color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <span className="holo-corner holo-corner--tl" />
          <span className="holo-corner holo-corner--tr" />
          <span className="holo-corner holo-corner--bl" />
          <span className="holo-corner holo-corner--br" />
          {hover && <span className="holo-scan" />}
          {preview ? (
            <img src={preview} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span
              className="font-display px-3 text-center text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {isTauri() ? "CHOISIR UN AVATAR" : "AVATAR (DANS L'APP)"}
            </span>
          )}
        </button>
        <span className="font-display text-[11px]" style={{ color: "var(--text-secondary)" }}>
          L'image est copiée dans les données du jeu.
        </span>
      </div>

      <Field label="Nom du personnage *">
        <input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Comment t'appelles-tu ?"
          className="font-body w-full px-3 py-2.5 text-sm outline-none"
          style={fieldStyle}
          autoFocus
        />
      </Field>

      <Field label="Origine (optionnel)">
        <input
          value={draft.origin ?? ""}
          onChange={(e) => update({ origin: e.target.value })}
          placeholder="D'où viens-tu ? (cité, clan, passé…)"
          className="font-body w-full px-3 py-2.5 text-sm outline-none"
          style={fieldStyle}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="font-display-title mb-1.5 block text-[10px]"
        style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
