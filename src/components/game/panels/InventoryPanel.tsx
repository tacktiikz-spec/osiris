// =====================================================================
//  Panneau INVENTAIRE — grille de slots holographiques + détail à droite.
//  Équiper/déséquiper (local, sans IA). Logique inchangée.
// =====================================================================

import { useState } from "react";
import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";

const MIN_SLOTS = 20;

export default function InventoryPanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  const toggleEquip = useGame((s) => s.toggleEquip);
  const [selected, setSelected] = useState<string | null>(null);

  if (!game) return null;
  const items = game.inventory;
  const sel = items.find((i) => i.id === selected) ?? null;
  const slots = Math.max(MIN_SLOTS, Math.ceil(items.length / 5) * 5);

  return (
    <HoloPanel variant="fullscreen" title="Inventaire" icon="▦" onClose={closePanel} maxWidth="820px">
      <div className="grid grid-cols-[1fr_240px] gap-5">
        {/* Grille de slots */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: slots }).map((_, i) => {
            const it = items[i];
            const isSel = it && it.id === selected;
            return (
              <button
                key={i}
                onClick={() => it && setSelected(it.id)}
                disabled={!it}
                className="relative flex aspect-square items-center justify-center"
                style={{
                  background: it ? "var(--bg-panel)" : "transparent",
                  border: `1px solid ${isSel ? "var(--border-glow)" : "var(--border-dim)"}`,
                  opacity: it ? 1 : 0.3,
                  cursor: it ? "pointer" : "default",
                  boxShadow: isSel ? "0 0 16px color-mix(in srgb, var(--accent) 40%, transparent)" : "none",
                }}
              >
                {it?.equipped && <span className="holo-corner holo-corner--tl" />}
                {it?.equipped && <span className="holo-corner holo-corner--br" />}
                {it && (
                  <>
                    <span className="font-display-title text-lg" style={{ color: "var(--text-accent)" }}>
                      {it.name.charAt(0).toUpperCase()}
                    </span>
                    {it.qty > 1 && (
                      <span className="font-data absolute bottom-0.5 right-1 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {it.qty}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Détail */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)", padding: 16 }}>
          {sel ? (
            <>
              <div className="font-display-title mb-1 text-[15px]" style={{ color: "var(--text-accent)" }}>
                {sel.name}
              </div>
              <div className="font-data mb-3 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                QUANTITÉ · {sel.qty}
                {sel.equipped ? " · ÉQUIPÉ" : ""}
              </div>
              <p className="font-body mb-4 text-sm" style={{ color: "var(--text-primary)" }}>
                {sel.desc || "Aucune description."}
              </p>
              <button
                onClick={() => toggleEquip(sel.id)}
                className="font-display-title w-full py-2 text-[12px]"
                style={{
                  background: sel.equipped ? "var(--bg-panel-hover)" : "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: sel.equipped ? "var(--text-secondary)" : "#000",
                  border: "1px solid var(--border-dim)",
                }}
              >
                {sel.equipped ? "Déséquiper" : "Équiper"}
              </button>
            </>
          ) : (
            <p className="font-body text-sm italic" style={{ color: "var(--text-secondary)" }}>
              {items.length === 0
                ? "Ton sac est vide. Les objets trouvés apparaîtront ici."
                : "Sélectionne un objet pour voir son détail."}
            </p>
          )}
        </div>
      </div>
    </HoloPanel>
  );
}
