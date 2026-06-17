// =====================================================================
//  Bandeau « monde vivant » au-dessus du récit : jour, moment de la
//  journée (icône), météo et lieu courant. Reflète la simulation du temps.
// =====================================================================

import { useGame } from "@/store/gameStore";
import { TIME_META } from "@/lib/world";

export default function WorldBar() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const w = game.world;
  const meta = TIME_META[w.time];

  return (
    <div
      className="flex items-center justify-between px-10 py-2"
      style={{
        background: "color-mix(in srgb, var(--bg-deep) 75%, transparent)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      <div className="flex items-center gap-4">
        <span className="font-display-title text-[11px]" style={{ color: "var(--text-accent)", letterSpacing: "0.2em" }}>
          JOUR {w.day}
        </span>
        <span className="h-3 w-px" style={{ background: "var(--border-dim)" }} />
        <span className="flex items-center gap-1.5 font-display text-[12px]" style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-accent)" }}>{meta?.icon ?? "◷"}</span>
          {meta?.label ?? w.time}
        </span>
        {w.weather && (
          <>
            <span className="h-3 w-px" style={{ background: "var(--border-dim)" }} />
            <span className="font-body text-[12px] italic" style={{ color: "var(--text-secondary)" }}>
              {w.weather}
            </span>
          </>
        )}
      </div>

      {game.location && (
        <span className="flex items-center gap-1.5 font-display text-[12px]" style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-accent)" }}>◈</span>
          {game.location}
        </span>
      )}
    </div>
  );
}
