// =====================================================================
//  Étape 3 — La Voie : archétypes en grille de HoloPanel.
// =====================================================================

import type { CreationDraft } from "@/lib/createGame";
import { ARCHETYPES, STAT_LABELS } from "@/data/archetypes";
import { audio } from "@/lib/audio";
import { SFX_KEYS } from "@/data/sounds";
import HoloPanel from "@/components/common/HoloPanel";

interface Props {
  draft: CreationDraft;
  update: (patch: Partial<CreationDraft>) => void;
}

const ICONS: Record<string, string> = {
  lame: "⚔",
  arcane: "✦",
  ombre: "☾",
  erudit: "◈",
  meneur: "✺",
  nomade: "➶",
};

export default function StepPath({ draft, update }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ARCHETYPES.map((a) => {
        const selected = draft.archetype === a.id;
        return (
          <HoloPanel
            key={a.id}
            variant="sm"
            scan={selected}
            interactive
            active={selected}
            pulseCorners={selected}
            onClick={() => {
              void audio.playSfx(SFX_KEYS.select);
              update({ archetype: a.id });
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[18px]" style={{ color: "var(--text-accent)" }}>
                {ICONS[a.id] ?? "◆"}
              </span>
              <span className="font-display-title text-[15px]" style={{ color: "var(--text-accent)" }}>
                {a.name}
              </span>
            </div>
            <div className="font-body mb-2 text-xs italic" style={{ color: "var(--text-secondary)" }}>
              {a.tagline}
            </div>
            <div
              className="font-body mb-3 text-xs leading-relaxed"
              style={{ color: "color-mix(in srgb, var(--text-primary) 55%, transparent)" }}
            >
              {a.desc}
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag>Affinité · {STAT_LABELS[a.emphasis]}</Tag>
              <Tag>Talent · {a.startingSkill}</Tag>
            </div>
          </HoloPanel>
        );
      })}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-display px-2 py-0.5 text-[10px]"
      style={{
        color: "var(--text-secondary)",
        border: "1px solid var(--border-dim)",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </span>
  );
}
