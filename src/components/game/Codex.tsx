// =====================================================================
//  Codex latéral (HUD) — design holographique.
//  Avatar à coins lumineux, identité, stats en segments, niveau/XP/PV,
//  monnaie, et boutons-panneaux HoloPanel. Logique inchangée.
// =====================================================================

import { useEffect, useState } from "react";
import { useGame } from "@/store/gameStore";
import StatSegments from "@/components/common/StatSegments";
import { getArchetype, STAT_LABELS, STAT_ORDER } from "@/data/archetypes";
import { getTheme, themeHasSystem } from "@/data/themes";
import { avatarUrl } from "@/lib/avatar";

export default function Codex() {
  const game = useGame((s) => s.game);
  const openPanel = useGame((s) => s.openPanel);
  const goTo = useGame((s) => s.goTo);
  const autosave = useGame((s) => s.autosave);
  const config = useGame((s) => s.config);
  const setConfig = useGame((s) => s.setConfig);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    void avatarUrl(game?.character.avatarPath).then(setAvatar);
  }, [game?.character.avatarPath]);

  if (!game) return null;
  const c = game.character;
  const p = game.progression;
  const theme = getTheme(game.theme);
  const archetype = getArchetype(c.archetype);
  const hasPhone = themeHasSystem(theme, "phone");
  const unread = game.phone
    ? Object.values(game.phone.threads).reduce(
        (n, thread) => n + (thread[thread.length - 1]?.from === "eux" ? 1 : 0),
        0
      )
    : 0;

  const hpRatio = p.hpMax > 0 ? p.hp / p.hpMax : 0;
  const hpColor = hpRatio < 0.3 ? "var(--danger)" : "var(--success)";

  return (
    <aside
      className="flex h-full w-[240px] flex-col overflow-y-auto"
      style={{ background: "var(--bg-deep)", borderRight: "1px solid var(--border-dim)" }}
    >
      {/* Identité */}
      <div className="flex flex-col items-center gap-3 px-4 pb-4 pt-5">
        <div
          className="glow-pulse relative h-24 w-24 overflow-hidden"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)" }}
        >
          <span className="holo-corner holo-corner--tl" />
          <span className="holo-corner holo-corner--tr" />
          <span className="holo-corner holo-corner--bl" />
          <span className="holo-corner holo-corner--br" />
          {avatar ? (
            <img src={avatar} alt={c.name} className="h-full w-full object-cover" />
          ) : (
            <div className="font-display-title flex h-full w-full items-center justify-center text-3xl" style={{ color: "var(--text-accent)" }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="font-display-title text-[22px] leading-tight" style={{ color: "var(--text-primary)" }}>
            {c.name}
          </div>
          <div className="font-display-title mt-0.5 text-[10px]" style={{ color: "var(--text-accent)", letterSpacing: "0.2em" }}>
            {(archetype?.name ?? c.archetype)} · {theme.name}
          </div>
        </div>
      </div>

      <Divider />

      {/* Niveau / XP / PV / Monnaie */}
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display-title text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
              Niveau
            </div>
            <div className="font-data text-[32px] leading-none" style={{ color: "var(--text-accent)", textShadow: "0 0 14px var(--accent)" }}>
              {String(p.level).padStart(2, "0")}
            </div>
          </div>
          {p.unspentPoints > 0 && (
            <button
              onClick={() => openPanel("status")}
              className="font-display-title px-2 py-1 text-[10px] animate-pulse-glow"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              +{p.unspentPoints} PTS
            </button>
          )}
        </div>

        <MiniBar label="XP" value={p.xp} max={p.xpToNext} color="var(--accent)" />
        <MiniBar label="PV" value={p.hp} max={p.hpMax} color={hpColor} />

        <div className="flex items-center justify-between pt-1">
          <span className="font-display-title text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
            ◇ Monnaie
          </span>
          <span className="font-data text-sm" style={{ color: "var(--text-accent)" }}>
            {p.currency}
          </span>
        </div>
      </div>

      <Divider />

      {/* Stats */}
      <div className="space-y-2 px-4 py-4">
        {STAT_ORDER.map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="font-display-title w-16 text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
              {STAT_LABELS[k]}
            </span>
            <div className="flex-1">
              <StatSegments value={c.stats[k]} max={10} height={7} gap={2} />
            </div>
            <span className="font-data w-4 text-right text-[11px]" style={{ color: "var(--text-accent)" }}>
              {c.stats[k]}
            </span>
          </div>
        ))}
      </div>

      {/* Conditions actives */}
      {game.conditions.length > 0 && (
        <>
          <Divider />
          <div className="px-4 py-4">
            <div className="font-display-title mb-2 text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.25em" }}>
              États
            </div>
            <div className="flex flex-wrap gap-1.5">
              {game.conditions.map((cd) => {
                const color = cd.kind === "buff" ? "var(--success)" : cd.kind === "debuff" ? "var(--danger)" : "var(--text-accent)";
                return (
                  <span
                    key={cd.id}
                    title={cd.note}
                    className="font-display px-2 py-0.5 text-[10px]"
                    style={{ color, border: `1px solid ${color}`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
                  >
                    {cd.label}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Divider />

      {/* Boutons panneaux */}
      <div className="space-y-1.5 px-4 py-4">
        <PanelBtn icon="❖" label="Statut" onClick={() => openPanel("status")} badge={p.unspentPoints} />
        <PanelBtn icon="▦" label="Inventaire" onClick={() => openPanel("inventory")} />
        <PanelBtn icon="✦" label="Quêtes" onClick={() => openPanel("quests")} />
        <PanelBtn icon="✺" label="Relations" onClick={() => openPanel("relations")} badge={game.npcs.length} />
        <PanelBtn icon="◇" label="Atlas" onClick={() => openPanel("atlas")} badge={game.codex.length} />
        <PanelBtn icon="◈" label="Chronique" onClick={() => openPanel("chronicle")} />
        {hasPhone && <PanelBtn icon="✆" label="Téléphone" onClick={() => openPanel("phone")} badge={unread} />}
      </div>

      {/* Pied : Mute / Réglages / Menu */}
      <div className="mt-auto flex gap-1.5 px-4 pb-4 pt-2">
        <FootBtn label={config.muted ? "🔇" : "🔊"} onClick={() => setConfig({ muted: !config.muted })} />
        <FootBtn label="⚙" onClick={() => goTo("settings")} />
        <FootBtn
          label="Menu"
          grow
          onClick={async () => {
            await autosave();
            goTo("home");
          }}
        />
      </div>
    </aside>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border-dim)" }} />;
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="font-display-title text-[9px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}>
          {label}
        </span>
        <span className="font-data text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {value} / {max}
        </span>
      </div>
      <div style={{ height: 6, background: "var(--border-dim)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

function PanelBtn({ icon, label, onClick, badge }: { icon: string; label: string; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className="holo-interactive relative flex w-full items-center gap-3 px-3 py-2"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)" }}
    >
      <span className="text-[13px]" style={{ color: "var(--text-accent)" }}>
        {icon}
      </span>
      <span className="font-display-title text-[12px]" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {badge && badge > 0 ? (
        <span
          className="font-data absolute right-2 top-1/2 flex h-4 min-w-4 -translate-y-1/2 items-center justify-center px-1 text-[9px]"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function FootBtn({ label, onClick, grow }: { label: string; onClick: () => void; grow?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`holo-interactive font-display-title py-2 text-[12px] ${grow ? "flex-1" : "px-3"}`}
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)", color: "var(--text-secondary)" }}
    >
      {label}
    </button>
  );
}
