// =====================================================================
//  Zone de récit centrale — design holographique.
//  RÉCIT (◈) en Crimson Pro ; action joueur (▸ TOI) avec barre d'accent.
//  Séparateur ◆ entre les entrées. Fond transparent (l'app respire derrière).
// =====================================================================

import { useEffect, useRef } from "react";
import { useGame } from "@/store/gameStore";
import Typewriter from "@/components/game/Typewriter";

export default function NarrativeLog() {
  const game = useGame((s) => s.game);
  const busy = useGame((s) => s.busy);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // On masque le tout premier message (le prompt d'ouverture interne).
  const messages = game?.messages ?? [];
  const visible = messages.filter((m, i) => !(i === 0 && m.role === "user"));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const lastAssistantIndex = (() => {
    for (let i = visible.length - 1; i >= 0; i--) {
      if (visible[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8">
      <div className="mx-auto max-w-2xl">
        {visible.map((m, i) => (
          <div key={i} className="animate-fade-in">
            {i > 0 && <Separator />}
            {m.role === "user" ? (
              <div style={{ borderLeft: "2px solid var(--accent)", paddingLeft: 16 }}>
                <div
                  className="font-display-title mb-1 text-[10px]"
                  style={{ color: "var(--text-secondary)", letterSpacing: "0.3em" }}
                >
                  ▸ TOI
                </div>
                <p className="font-body italic" style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--text-secondary)" }}>
                  {m.content}
                </p>
              </div>
            ) : (
              <div>
                <div
                  className="font-display-title mb-2 text-[10px]"
                  style={{ color: "var(--text-accent)", letterSpacing: "0.3em" }}
                >
                  ◈ RÉCIT
                </div>
                <Typewriter text={m.content} animate={i === lastAssistantIndex} />
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="mt-6 flex items-center gap-2 font-display text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-flex gap-1">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
            Le récit s'écrit…
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function Separator() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: "var(--border-dim)" }} />
      <span className="text-[10px]" style={{ color: "var(--text-accent)", opacity: 0.4 }}>
        ◆
      </span>
      <div className="h-px flex-1" style={{ background: "var(--border-dim)" }} />
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-pulse-glow"
      style={{ background: "var(--accent)", animationDelay: delay }}
    />
  );
}
