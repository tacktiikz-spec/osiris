// =====================================================================
//  Panneau ATLAS — encyclopédie des découvertes (lieux, personnes,
//  factions, créatures, savoirs), alimentée par l'IA au fil du récit.
// =====================================================================

import { useState } from "react";
import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";
import type { CodexCategory } from "@/types/game";

const CATS: { id: CodexCategory; label: string; icon: string }[] = [
  { id: "lieu", label: "Lieux", icon: "◈" },
  { id: "personne", label: "Personnes", icon: "✺" },
  { id: "faction", label: "Factions", icon: "❖" },
  { id: "créature", label: "Créatures", icon: "✦" },
  { id: "savoir", label: "Savoirs", icon: "◇" },
];

export default function AtlasPanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  const [cat, setCat] = useState<CodexCategory | "all">("all");
  if (!game) return null;

  const entries = game.codex.filter((e) => cat === "all" || e.category === cat);
  const count = (c: CodexCategory) => game.codex.filter((e) => e.category === c).length;

  return (
    <HoloPanel variant="fullscreen" title="Atlas" icon="◇" onClose={closePanel} maxWidth="760px">
      {/* Filtres par catégorie */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <FilterChip label={`Tout · ${game.codex.length}`} active={cat === "all"} onClick={() => setCat("all")} />
        {CATS.map((c) => (
          <FilterChip key={c.id} label={`${c.icon} ${c.label} · ${count(c.id)}`} active={cat === c.id} onClick={() => setCat(c.id)} />
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="font-body py-10 text-center text-sm italic" style={{ color: "var(--text-secondary)" }}>
          Ton atlas est vierge. Explore le monde : chaque découverte marquante s'inscrira ici.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {entries.map((e) => {
            const meta = CATS.find((c) => c.id === e.category);
            return (
              <div key={e.id} className="px-4 py-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)" }}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[14px]" style={{ color: "var(--text-accent)" }}>{meta?.icon ?? "◇"}</span>
                  <span className="font-display-title text-[13px]" style={{ color: "var(--text-primary)" }}>{e.title}</span>
                </div>
                <div className="font-display-title mb-1 text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
                  {meta?.label.toUpperCase() ?? e.category.toUpperCase()}
                </div>
                {e.text && (
                  <p className="font-body text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--text-primary) 70%, transparent)" }}>
                    {e.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </HoloPanel>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-display-title px-3 py-1.5 text-[10px] transition-all"
      style={{
        color: active ? "var(--text-accent)" : "var(--text-secondary)",
        background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "var(--bg-panel)",
        border: `1px solid ${active ? "var(--border-glow)" : "var(--border-dim)"}`,
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </button>
  );
}
