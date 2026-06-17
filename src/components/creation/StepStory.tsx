// =====================================================================
//  Étape 5 — Histoire : trait + objectif (optionnels) + récapitulatif.
// =====================================================================

import type { CreationDraft } from "@/lib/createGame";
import { getTheme } from "@/data/themes";
import { getArchetype, STAT_LABELS, STAT_ORDER } from "@/data/archetypes";
import HoloPanel from "@/components/common/HoloPanel";

interface Props {
  draft: CreationDraft;
  update: (patch: Partial<CreationDraft>) => void;
}

const fieldStyle = {
  border: "1px solid var(--border-dim)",
  background: "var(--bg-panel)",
  color: "var(--text-primary)",
} as const;

export default function StepStory({ draft, update }: Props) {
  const theme = draft.theme ? getTheme(draft.theme) : null;
  const archetype = getArchetype(draft.archetype);

  return (
    <div className="mx-auto grid max-w-3xl gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <Field label="Trait marquant (optionnel)">
          <input
            value={draft.trait ?? ""}
            onChange={(e) => update({ trait: e.target.value })}
            placeholder="Ex : cynique mais loyal, hanté par un serment…"
            className="font-body w-full px-3 py-2.5 text-sm outline-none"
            style={fieldStyle}
          />
        </Field>
        <Field label="Objectif (optionnel)">
          <textarea
            value={draft.goal ?? ""}
            onChange={(e) => update({ goal: e.target.value })}
            rows={4}
            placeholder="Que cherches-tu à accomplir dans ce monde ?"
            className="font-body w-full resize-none px-3 py-2.5 text-sm outline-none"
            style={fieldStyle}
          />
        </Field>
      </div>

      <HoloPanel variant="md" title="Avant de partir" icon="◈">
        <dl className="space-y-2 text-sm">
          <Row label="Nom" value={draft.name || "—"} />
          <Row label="Monde" value={theme?.name ?? "—"} />
          <Row label="Voie" value={archetype?.name ?? "—"} />
          {draft.origin && <Row label="Origine" value={draft.origin} />}
          <div className="pt-2">
            <div className="font-display-title mb-2 text-[10px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}>
              Aptitudes
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {STAT_ORDER.map((k) => (
                <div
                  key={k}
                  className="flex justify-between px-2 py-1"
                  style={{ background: "var(--bg-panel-hover)", border: "1px solid var(--border-dim)" }}
                >
                  <span className="font-display text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {STAT_LABELS[k]}
                  </span>
                  <span className="font-data text-[12px]" style={{ color: "var(--text-accent)" }}>
                    {draft.stats[k]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </dl>
        <p className="font-body mt-4 text-xs italic" style={{ color: "var(--text-secondary)" }}>
          Ton aventure va s'écrire au fil de tes choix. Bonne route.
        </p>
      </HoloPanel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-display-title mb-1.5 block text-[10px]" style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-display text-[12px]" style={{ color: "var(--text-secondary)" }}>
        {label}
      </dt>
      <dd className="font-display text-[13px]" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}
