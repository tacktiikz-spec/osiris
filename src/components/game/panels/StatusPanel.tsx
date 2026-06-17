// =====================================================================
//  Panneau STATUT — réf. directe à la fenêtre « STATUS » de Solo Leveling.
//  Grille 2 colonnes, segments, bouton [+] clignotant si points à dépenser.
//  Logique de dépense de points (locale, sans IA) inchangée.
// =====================================================================

import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";
import StatSegments from "@/components/common/StatSegments";
import { STAT_LABELS, STAT_ORDER, getArchetype } from "@/data/archetypes";
import { STAT_MAX } from "@/lib/progression";
import type { Stats } from "@/types/game";

const STAT_ICON: Record<keyof Stats, string> = {
  for: "⚔",
  agi: "➶",
  esp: "✦",
  vol: "❖",
  pre: "✺",
};

export default function StatusPanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  const spendStatPoint = useGame((s) => s.spendStatPoint);
  if (!game) return null;

  const p = game.progression;
  const c = game.character;
  const archetype = getArchetype(c.archetype);
  const xpPct = p.xpToNext > 0 ? Math.round((p.xp / p.xpToNext) * 100) : 0;

  return (
    <HoloPanel variant="fullscreen" title="Statut" icon="❖" onClose={closePanel} maxWidth="760px">
      {/* Bandeau identité */}
      <div className="row-in mb-5 flex items-center justify-between" style={{ animationDelay: "0ms" }}>
        <div>
          <div className="font-display-title text-xl" style={{ color: "var(--text-primary)" }}>
            {c.name}
          </div>
          <div className="font-display-title text-[11px]" style={{ color: "var(--text-accent)", letterSpacing: "0.2em" }}>
            {archetype?.name}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display-title text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
            Niveau
          </div>
          <div className="font-data text-4xl leading-none" style={{ color: "var(--text-accent)", textShadow: "0 0 16px var(--accent)" }}>
            {String(p.level).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Barre XP */}
      <div className="row-in mb-5" style={{ animationDelay: "80ms" }}>
        <div className="mb-1 flex justify-between font-display-title text-[10px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}>
          <span>Expérience</span>
          <span className="font-data" style={{ color: "var(--text-accent)" }}>{xpPct}%</span>
        </div>
        <div style={{ height: 8, background: "var(--border-dim)" }}>
          <div className="h-full transition-all duration-500" style={{ width: `${xpPct}%`, background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
        </div>
      </div>

      {/* Points à dépenser */}
      {p.unspentPoints > 0 && (
        <div
          className="row-in mb-4 flex items-center justify-between px-3 py-2"
          style={{ animationDelay: "120ms", border: "1px solid var(--border-glow)", background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
        >
          <span className="font-display-title text-[11px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.15em" }}>
            Points d'aptitude disponibles
          </span>
          <span className="font-data text-xl" style={{ color: "var(--text-accent)" }}>{p.unspentPoints}</span>
        </div>
      )}

      {/* Grille des stats (2 colonnes) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {STAT_ORDER.map((k, idx) => {
          const val = c.stats[k];
          const canRaise = p.unspentPoints > 0 && val < STAT_MAX;
          return (
            <div
              key={k}
              className="row-in flex items-center gap-3 px-3 py-2.5"
              style={{ animationDelay: `${160 + idx * 80}ms`, background: "var(--bg-panel)", border: "1px solid var(--border-dim)" }}
            >
              <span className="text-[15px]" style={{ color: "var(--text-accent)" }}>{STAT_ICON[k]}</span>
              <span className="font-display-title w-16 text-[11px]" style={{ color: "var(--text-secondary)" }}>{STAT_LABELS[k]}</span>
              <div className="flex-1">
                <StatSegments value={val} max={STAT_MAX} height={9} gap={2} />
              </div>
              <span className="font-data w-5 text-right text-sm" style={{ color: "var(--text-accent)" }}>{val}</span>
              {canRaise && (
                <button
                  onClick={() => spendStatPoint(k)}
                  className="font-data soft-blink h-6 w-6 text-base leading-none"
                  style={{ border: "1px solid var(--border-glow)", color: "var(--text-accent)", background: "var(--bg-panel-hover)" }}
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Compétences */}
      {p.skills.length > 0 && (
        <div className="row-in mt-5" style={{ animationDelay: `${160 + STAT_ORDER.length * 80}ms` }}>
          <div className="font-display-title mb-2 text-[10px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
            Compétences
          </div>
          <div className="flex flex-wrap gap-2">
            {p.skills.map((sk) => (
              <span key={sk} className="font-display px-3 py-1 text-xs" style={{ border: "1px solid var(--border-dim)", color: "var(--text-primary)" }}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}
    </HoloPanel>
  );
}
