// =====================================================================
//  Panneau RELATIONS — PNJ rencontrés, affinité (-100..100) et note.
//  Lecture seule : l'IA fait évoluer les relations via le récit.
// =====================================================================

import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";
import type { Npc } from "@/types/game";

function descriptor(rel: number): { label: string; color: string } {
  if (rel <= -60) return { label: "Ennemi juré", color: "var(--danger)" };
  if (rel <= -20) return { label: "Hostile", color: "var(--danger)" };
  if (rel < 20) return { label: "Neutre", color: "var(--text-secondary)" };
  if (rel < 60) return { label: "Allié", color: "var(--success)" };
  return { label: "Fidèle", color: "var(--success)" };
}

export default function RelationsPanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  if (!game) return null;

  const npcs = [...game.npcs].sort((a, b) => b.relationship - a.relationship);

  return (
    <HoloPanel variant="fullscreen" title="Relations" icon="✺" onClose={closePanel} maxWidth="720px">
      {npcs.length === 0 ? (
        <p className="font-body py-10 text-center text-sm italic" style={{ color: "var(--text-secondary)" }}>
          Tu n'as encore noué aucun lien. Les visages croisés au fil de l'histoire apparaîtront ici.
        </p>
      ) : (
        <div className="space-y-2.5">
          {npcs.map((n) => (
            <RelationRow key={n.id} npc={n} />
          ))}
        </div>
      )}
    </HoloPanel>
  );
}

function RelationRow({ npc }: { npc: Npc }) {
  const d = descriptor(npc.relationship);
  // Position du curseur sur l'axe -100..100 → 0..100%.
  const pct = ((npc.relationship + 100) / 200) * 100;
  return (
    <div className="px-4 py-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)" }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display-title text-[14px]" style={{ color: "var(--text-primary)" }}>
          {npc.name}
        </span>
        <span className="font-display-title text-[10px]" style={{ color: d.color, letterSpacing: "0.15em" }}>
          {d.label}
        </span>
      </div>

      {/* Axe d'affinité avec curseur. */}
      <div className="relative mb-2 h-1.5" style={{ background: "var(--border-dim)" }}>
        <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2" style={{ background: "var(--text-secondary)", opacity: 0.4 }} />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${pct}%`, background: d.color, boxShadow: `0 0 10px ${d.color}` }}
        />
      </div>

      {npc.note && (
        <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
          {npc.note}
        </p>
      )}
    </div>
  );
}
