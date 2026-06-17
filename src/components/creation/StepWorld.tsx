// =====================================================================
//  Étape 1 — Le Monde : cartes de thème en HoloPanel (groupées par catégorie).
// =====================================================================

import type { CreationDraft } from "@/lib/createGame";
import { THEMES, CATEGORY_LABELS, type ThemeCategory } from "@/data/themes";
import { audio } from "@/lib/audio";
import { SFX_KEYS } from "@/data/sounds";
import HoloPanel from "@/components/common/HoloPanel";
import { accentVars } from "@/lib/style";

interface Props {
  draft: CreationDraft;
  update: (patch: Partial<CreationDraft>) => void;
}

const CATS: ThemeCategory[] = ["classique", "anime", "custom"];

export default function StepWorld({ draft, update }: Props) {
  return (
    <div className="space-y-7">
      {CATS.map((cat) => (
        <div key={cat}>
          <h3
            className="font-display-title mb-3 text-[11px]"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.3em" }}
          >
            {CATEGORY_LABELS[cat]}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.filter((t) => t.cat === cat).map((t) => {
              const selected = draft.theme === t.id;
              return (
                <HoloPanel
                  key={t.id}
                  variant="sm"
                  scan={selected}
                  interactive
                  active={selected}
                  pulseCorners={selected}
                  onClick={() => {
                    void audio.playSfx(SFX_KEYS.select);
                    update({ theme: t.id });
                  }}
                  style={accentVars(t.colors.accent, t.colors.accent2)}
                >
                  <div
                    className="font-display-title mb-1 text-[14px]"
                    style={{ color: t.colors.accent }}
                  >
                    {t.name}
                  </div>
                  <div className="font-body mb-2 text-xs italic" style={{ color: "var(--text-secondary)" }}>
                    {t.tagline}
                  </div>
                  <div className="font-body text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--text-primary) 55%, transparent)" }}>
                    {t.desc}
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <span className="h-2 w-2" style={{ background: t.colors.accent, boxShadow: `0 0 8px ${t.colors.accent}` }} />
                    <span className="h-2 w-2" style={{ background: t.colors.accent2 }} />
                  </div>
                </HoloPanel>
              );
            })}
          </div>
        </div>
      ))}

      {draft.theme === "custom" && (
        <HoloPanel variant="md" title="Univers sur mesure" icon="◈">
          <textarea
            value={draft.customDesc ?? ""}
            onChange={(e) => update({ customDesc: e.target.value })}
            rows={4}
            placeholder="Ex : Un archipel volant où des cités flottent au-dessus d'un océan de nuages, à l'ère de la vapeur et des dirigeables…"
            className="font-body w-full resize-none bg-black/40 p-3 text-sm italic outline-none"
            style={{ border: "1px solid var(--border-dim)", color: "var(--text-primary)" }}
          />
        </HoloPanel>
      )}
    </div>
  );
}
