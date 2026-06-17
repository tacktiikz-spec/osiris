// =====================================================================
//  Panneau CHRONIQUE — mémoire condensée (lecture seule).
//  Titres de sections en Rajdhani, corps en Crimson Pro.
// =====================================================================

import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";

const SECTIONS = ["PERSONNAGES", "LIEUX", "ÉVÉNEMENTS", "OBJECTIFS", "INVENTAIRE"];

export default function ChroniclePanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  if (!game) return null;

  const chronicle = game.chronicle?.trim() ?? "";

  // Mise en forme légère : on relève les titres de section connus.
  const lines = chronicle.split(/\r?\n/);

  return (
    <HoloPanel variant="fullscreen" title="Chronique" icon="◈" onClose={closePanel} maxWidth="720px">
      <p className="font-display mb-4 text-[11px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
        Mémoire persistante de ton aventure — condensée automatiquement, rien n'est oublié.
      </p>
      {chronicle ? (
        <div className="space-y-1">
          {lines.map((line, i) => {
            const trimmed = line.trim();
            const isHeading = SECTIONS.some((s) => trimmed.toUpperCase().startsWith(s));
            if (isHeading) {
              return (
                <div
                  key={i}
                  className="font-display-title mt-4 text-[12px]"
                  style={{ color: "var(--text-accent)", letterSpacing: "0.2em" }}
                >
                  {trimmed}
                </div>
              );
            }
            return (
              <p key={i} className="font-body selectable text-sm" style={{ color: "var(--text-primary)", lineHeight: 1.7 }}>
                {line || "\u00A0"}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="font-body py-10 text-center text-sm italic" style={{ color: "var(--text-secondary)" }}>
          L'aventure commence à peine — la chronique se remplira au fil des chapitres.
        </p>
      )}
    </HoloPanel>
  );
}
