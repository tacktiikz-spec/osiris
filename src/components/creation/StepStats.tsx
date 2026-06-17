// =====================================================================
//  Étape 4 — Aptitudes : répartition de points en segments lumineux.
//  +/- minimalistes, flash + son de tick à l'attribution.
// =====================================================================

import { useState } from "react";
import type { CreationDraft } from "@/lib/createGame";
import { remainingPoints, STAT_BASE, STAT_CREATE_MAX } from "@/lib/createGame";
import { STAT_LABELS, STAT_ORDER, getArchetype } from "@/data/archetypes";
import type { Stats } from "@/types/game";
import { audio } from "@/lib/audio";
import { SFX_KEYS } from "@/data/sounds";
import StatSegments from "@/components/common/StatSegments";

interface Props {
  draft: CreationDraft;
  update: (patch: Partial<CreationDraft>) => void;
}

export default function StepStats({ draft, update }: Props) {
  const remaining = remainingPoints(draft.stats);
  const emphasis = getArchetype(draft.archetype)?.emphasis;
  const [flash, setFlash] = useState<keyof Stats | null>(null);

  const setStat = (key: keyof Stats, delta: number) => {
    const current = draft.stats[key];
    const nextVal = current + delta;
    if (nextVal < STAT_BASE || nextVal > STAT_CREATE_MAX) return;
    if (delta > 0 && remaining <= 0) return;
    void audio.playSfx(delta > 0 ? SFX_KEYS.statUp : SFX_KEYS.tick);
    if (delta > 0) {
      setFlash(key);
      setTimeout(() => setFlash(null), 220);
    }
    update({ stats: { ...draft.stats, [key]: nextVal } });
  };

  return (
    <div className="mx-auto max-w-lg">
      <div
        className="mb-6 flex items-center justify-between px-4 py-3"
        style={{ border: "1px solid var(--border-dim)", background: "var(--bg-panel)" }}
      >
        <span className="font-display-title text-[11px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}>
          Points à répartir
        </span>
        <span
          className="font-data text-3xl"
          style={{ color: "var(--text-accent)", textShadow: "0 0 14px var(--accent)" }}
        >
          {remaining}
        </span>
      </div>

      <div className="space-y-3">
        {STAT_ORDER.map((key) => {
          const val = draft.stats[key];
          const isEmphasis = key === emphasis;
          return (
            <div
              key={key}
              className="flex items-center gap-4 px-4 py-3 transition-all"
              style={{
                background: "var(--bg-panel)",
                border: `1px solid ${isEmphasis ? "var(--border-glow)" : "var(--border-dim)"}`,
                boxShadow: flash === key ? "0 0 22px color-mix(in srgb, var(--accent) 50%, transparent)" : "none",
              }}
            >
              <div className="w-24 font-display-title text-[12px]" style={{ color: "var(--text-primary)" }}>
                {STAT_LABELS[key]}
                {isEmphasis && <span className="ml-1" style={{ color: "var(--text-accent)" }}>★</span>}
              </div>
              <div className="flex-1">
                <StatSegments value={val} max={STAT_CREATE_MAX} height={12} />
              </div>
              <div className="flex items-center gap-2">
                <StepBtn label="−" onClick={() => setStat(key, -1)} disabled={val <= STAT_BASE} />
                <span className="font-data w-4 text-center text-sm" style={{ color: "var(--text-accent)" }}>
                  {val}
                </span>
                <StepBtn label="+" onClick={() => setStat(key, 1)} disabled={val >= STAT_CREATE_MAX || remaining <= 0} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-display mt-5 text-center text-[11px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
        Force · Agilité · Esprit · Volonté · Présence — l'étoile marque l'affinité de ta voie.
      </p>
    </div>
  );
}

function StepBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-data h-7 w-7 text-lg leading-none transition-all disabled:opacity-20"
      style={{
        border: "1px solid var(--border-dim)",
        color: "var(--text-accent)",
        background: "var(--bg-panel-hover)",
      }}
    >
      {label}
    </button>
  );
}
