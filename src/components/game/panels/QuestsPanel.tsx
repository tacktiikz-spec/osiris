// =====================================================================
//  Panneau QUÊTES — onglets ACTIVES / TERMINÉES / ÉCHOUÉES.
//  Lecture seule (sans IA).
// =====================================================================

import { useState } from "react";
import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";
import type { QuestStatus } from "@/types/game";

const TABS: { status: QuestStatus; label: string; color: string; icon: string }[] = [
  { status: "active", label: "Actives", color: "var(--accent)", icon: "▸" },
  { status: "done", label: "Terminées", color: "var(--success)", icon: "✓" },
  { status: "failed", label: "Échouées", color: "var(--danger)", icon: "✕" },
];

export default function QuestsPanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  const [tab, setTab] = useState<QuestStatus>("active");
  if (!game) return null;

  const quests = game.quests.filter((q) => q.status === tab);
  const count = (st: QuestStatus) => game.quests.filter((q) => q.status === st).length;

  return (
    <HoloPanel variant="fullscreen" title="Journal de quêtes" icon="✦" onClose={closePanel} maxWidth="720px">
      {/* Onglets */}
      <div className="mb-5 flex gap-1" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        {TABS.map((t) => {
          const activeTab = tab === t.status;
          return (
            <button
              key={t.status}
              onClick={() => setTab(t.status)}
              className="font-display-title px-4 py-2 text-[11px] transition-all"
              style={{
                color: activeTab ? "var(--text-accent)" : "var(--text-secondary)",
                borderBottom: activeTab ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {t.label} · {count(t.status)}
            </button>
          );
        })}
      </div>

      {quests.length === 0 ? (
        <p className="font-body py-10 text-center text-sm italic" style={{ color: "var(--text-secondary)" }}>
          {tab === "active"
            ? "Aucune quête active. Tes objectifs émergeront au fil du récit."
            : "Rien ici pour l'instant."}
        </p>
      ) : (
        <div className="space-y-2.5">
          {quests.map((q) => {
            const meta = TABS.find((t) => t.status === q.status)!;
            return (
              <HoloPanel
                key={q.id}
                variant="sm"
                scan={false}
                pulseCorners={q.status === "active"}
                style={{
                  opacity: q.status === "active" ? 1 : 0.6,
                  borderColor: q.status === "failed" ? "var(--danger)" : "var(--border-dim)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-[13px]" style={{ color: meta.color }}>
                    {meta.icon}
                  </span>
                  <div>
                    <div className="font-display-title text-[13px]" style={{ color: "var(--text-primary)" }}>
                      {q.title}
                    </div>
                    {q.desc && (
                      <div className="font-body mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {q.desc}
                      </div>
                    )}
                  </div>
                </div>
              </HoloPanel>
            );
          })}
        </div>
      )}
    </HoloPanel>
  );
}
