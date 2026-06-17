// =====================================================================
//  Centre de notifications système (réf. Solo Leveling).
//  - levelup : grande notif centrale (flash + déploiement)
//  - item    : slide depuis la droite (haut-droite), 3s
//  - quest   : centre-bas, reçue/terminée
//  - xp      : badge vert flottant qui monte (1.5s)
//  - fail    : vignette rouge sur les bords (0.5s)
//  Respecte prefers-reduced-motion (apparition instantanée).
// =====================================================================

import { useEffect } from "react";
import { useGame, type GameNotification } from "@/store/gameStore";

const DURATION: Record<GameNotification["kind"], number> = {
  levelup: 3000,
  item: 3000,
  quest: 3500,
  xp: 1500,
  fail: 600,
  world: 2600,
  relation: 3000,
  condition: 3400,
  codex: 3400,
};

const SIDE_KINDS: GameNotification["kind"][] = ["item", "xp", "relation", "condition", "codex"];

export default function NotificationCenter() {
  const notifications = useGame((s) => s.notifications);
  const dismiss = useGame((s) => s.dismissNotification);

  return (
    <>
      {/* File haut-droite : objets, XP, relations, conditions, découvertes */}
      <div className="pointer-events-none absolute right-6 top-6 z-50 flex flex-col items-end gap-2">
        {notifications
          .filter((n) => SIDE_KINDS.includes(n.kind))
          .map((n) => (
            <Toast key={n.id} n={n} onDone={() => dismiss(n.id)} />
          ))}
      </div>

      {/* Centre-haut : passage du temps */}
      <div className="pointer-events-none absolute left-1/2 top-16 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {notifications
          .filter((n) => n.kind === "world")
          .map((n) => (
            <Toast key={n.id} n={n} onDone={() => dismiss(n.id)} />
          ))}
      </div>

      {/* Centre-bas : quêtes */}
      <div className="pointer-events-none absolute bottom-28 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {notifications
          .filter((n) => n.kind === "quest")
          .map((n) => (
            <Toast key={n.id} n={n} onDone={() => dismiss(n.id)} />
          ))}
      </div>

      {/* Centre : level up + vignette échec */}
      {notifications
        .filter((n) => n.kind === "levelup" || n.kind === "fail")
        .map((n) => (
          <Toast key={n.id} n={n} onDone={() => dismiss(n.id)} />
        ))}
    </>
  );
}

function Toast({ n, onDone }: { n: GameNotification; onDone: () => void }) {
  const reduced = useGame((s) => s.config.reducedMotion);

  useEffect(() => {
    const t = setTimeout(onDone, DURATION[n.kind]);
    return () => clearTimeout(t);
  }, [n.id]);

  switch (n.kind) {
    case "xp":
      return (
        <div
          className={`font-data px-3 py-1 text-sm ${reduced ? "" : "animate-[xp-rise_1.5s_ease-out_forwards]"}`}
          style={{ color: "var(--success)", textShadow: "0 0 12px var(--success)" }}
        >
          +{n.amount} XP
        </div>
      );

    case "item":
      return (
        <div
          className={`pointer-events-auto ${reduced ? "" : "animate-[slide-in-right_0.4s_ease-out]"}`}
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border-glow)", boxShadow: "0 0 24px color-mix(in srgb, var(--accent) 30%, transparent)", backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-[16px]" style={{ color: "var(--text-accent)" }}>▦</span>
            <div>
              <div className="font-display-title text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
                Objet obtenu
              </div>
              <div className="font-display-title text-[13px]" style={{ color: "var(--text-primary)" }}>
                {n.label}
              </div>
            </div>
          </div>
        </div>
      );

    case "quest":
      return (
        <div
          className={`pointer-events-auto relative ${reduced ? "" : "animate-slide-up"}`}
          style={{ background: "var(--bg-panel)", border: `1px solid ${n.done ? "var(--success)" : "var(--border-glow)"}`, boxShadow: "0 0 30px color-mix(in srgb, var(--accent) 30%, transparent)", backdropFilter: "blur(10px)", minWidth: 320 }}
        >
          <span className="holo-corner holo-corner--tl" />
          <span className="holo-corner holo-corner--tr" />
          <span className="holo-corner holo-corner--bl" />
          <span className="holo-corner holo-corner--br" />
          <div className="px-6 py-3 text-center">
            <div
              className="font-display-title text-[10px]"
              style={{ color: n.done ? "var(--success)" : "var(--text-accent)", letterSpacing: "0.3em" }}
            >
              {n.done ? "✓ QUÊTE TERMINÉE" : "✦ NOUVELLE QUÊTE"}
            </div>
            <div className="font-display-title mt-1 text-[15px]" style={{ color: "var(--text-primary)" }}>
              {n.label}
            </div>
          </div>
        </div>
      );

    case "levelup":
      return (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          {!reduced && (
            <div className="absolute inset-0 animate-flash" style={{ background: "radial-gradient(circle, var(--accent), transparent 60%)", opacity: 0.4 }} />
          )}
          <div
            className={`relative px-12 py-6 text-center ${reduced ? "" : "animate-[level-pop_0.5s_ease-out]"}`}
            style={{ background: "var(--bg-panel)", border: "1.5px solid var(--border-glow)", boxShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)", backdropFilter: "blur(14px)" }}
          >
            <span className="holo-corner holo-corner--tl holo-corner--pulse" />
            <span className="holo-corner holo-corner--tr holo-corner--pulse" />
            <span className="holo-corner holo-corner--bl holo-corner--pulse" />
            <span className="holo-corner holo-corner--br holo-corner--pulse" />
            <div className="font-display-title text-[11px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.5em" }}>
              Niveau supérieur
            </div>
            <div className="font-data my-1 text-5xl" style={{ color: "var(--text-accent)", textShadow: "0 0 24px var(--accent)" }}>
              {String(n.level).padStart(2, "0")}
            </div>
            <div className="font-display-title text-[11px]" style={{ color: "var(--text-primary)", letterSpacing: "0.2em" }}>
              Points d'aptitude disponibles
            </div>
          </div>
        </div>
      );

    case "fail":
      return (
        <div
          className="pointer-events-none absolute inset-0 z-40"
          style={{
            boxShadow: "inset 0 0 140px 30px color-mix(in srgb, var(--danger) 55%, transparent)",
            animation: reduced ? undefined : "fail-vignette 0.6s ease-out forwards",
            opacity: reduced ? 0.5 : undefined,
          }}
        />
      );

    case "world":
      return (
        <div
          className={`pointer-events-auto px-6 py-2 ${reduced ? "" : "animate-slide-up"}`}
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border-glow)", boxShadow: "0 0 24px color-mix(in srgb, var(--accent) 28%, transparent)", backdropFilter: "blur(10px)" }}
        >
          <span className="font-display-title text-[12px]" style={{ color: "var(--text-accent)", letterSpacing: "0.25em" }}>
            ☾ {n.label.toUpperCase()}
          </span>
        </div>
      );

    case "relation":
      return (
        <SideCard icon="✺" title="Nouvelle rencontre" label={n.label} accent="var(--text-accent)" reduced={reduced} />
      );

    case "condition": {
      const color = n.debuff ? "var(--danger)" : "var(--success)";
      return (
        <SideCard icon={n.debuff ? "⚠" : "✦"} title={n.debuff ? "Affliction" : "État favorable"} label={n.label} accent={color} reduced={reduced} />
      );
    }

    case "codex":
      return (
        <SideCard icon="◇" title={`Atlas · ${n.category}`} label={n.label} accent="var(--text-accent)" reduced={reduced} />
      );

    default:
      return null;
  }
}

function SideCard({
  icon,
  title,
  label,
  accent,
  reduced,
}: {
  icon: string;
  title: string;
  label: string;
  accent: string;
  reduced: boolean;
}) {
  return (
    <div
      className={`pointer-events-auto ${reduced ? "" : "animate-[slide-in-right_0.4s_ease-out]"}`}
      style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, boxShadow: `0 0 22px color-mix(in srgb, ${accent} 28%, transparent)`, backdropFilter: "blur(10px)", maxWidth: 280 }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-[16px]" style={{ color: accent }}>{icon}</span>
        <div>
          <div className="font-display-title text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.22em" }}>
            {title.toUpperCase()}
          </div>
          <div className="font-display-title text-[13px]" style={{ color: "var(--text-primary)" }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
