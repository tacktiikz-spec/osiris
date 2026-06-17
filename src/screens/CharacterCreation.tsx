// =====================================================================
//  Assistant de création — design holographique.
//  Barre de progression = ligne lumineuse + marqueurs angulaires (◆).
//  Chaque étape dans un HoloPanel md centré (animation d'entrée).
//  La logique (étapes, draft, validation, launch) est inchangée.
// =====================================================================

import { useState } from "react";
import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";
import { type CreationDraft, emptyDraft, createGameState, remainingPoints } from "@/lib/createGame";
import StepWorld from "@/components/creation/StepWorld";
import StepIdentity from "@/components/creation/StepIdentity";
import StepPath from "@/components/creation/StepPath";
import StepStats from "@/components/creation/StepStats";
import StepStory from "@/components/creation/StepStory";

const STEPS = ["Le Monde", "Identité", "La Voie", "Aptitudes", "Histoire"];

export default function CharacterCreation() {
  const goTo = useGame((s) => s.goTo);
  const startNewGame = useGame((s) => s.startNewGame);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CreationDraft>(emptyDraft());

  const update = (patch: Partial<CreationDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const canProceed = validateStep(step, draft);

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const prev = () => {
    if (step === 0) goTo("home");
    else setStep((s) => s - 1);
  };
  const launch = async () => {
    const state = createGameState(draft);
    await startNewGame(state);
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col px-8 py-7">
      {/* En-tête */}
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div
            className="font-display-title text-[10px]"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.4em" }}
          >
            Création
          </div>
          <h1
            className="font-display-title text-2xl"
            style={{
              color: "var(--text-primary)",
              textShadow: "0 0 30px color-mix(in srgb, var(--accent) 55%, transparent)",
            }}
          >
            {STEPS[step]}
          </h1>
        </div>
        <span className="font-data text-sm" style={{ color: "var(--text-accent)" }}>
          {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
        </span>
      </div>

      {/* Barre de progression : ligne lumineuse + marqueurs ◆ */}
      <div className="relative mb-6 mt-4 flex items-center">
        <div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: "var(--border-dim)" }}
        />
        <div
          className="absolute left-0 top-1/2 h-px -translate-y-1/2 transition-all duration-500"
          style={{
            width: `${(step / (STEPS.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, transparent, var(--accent))",
            boxShadow: "0 0 10px var(--accent)",
          }}
        />
        <div className="relative flex w-full justify-between">
          {STEPS.map((_, i) => {
            const done = i <= step;
            return (
              <span
                key={i}
                className="font-data text-[13px] transition-all duration-300"
                style={{
                  color: done ? "var(--text-accent)" : "var(--border-dim)",
                  textShadow: done ? "0 0 10px var(--accent)" : "none",
                  transform: i === step ? "scale(1.3)" : "scale(1)",
                }}
              >
                ◆
              </span>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div key={step} className="flex-1 overflow-hidden animate-slide-up">
        <HoloPanel variant="md" bodyClassName="overflow-y-auto" style={{ maxHeight: "100%" }}>
          <div style={{ maxHeight: "calc(100vh - 320px)" }} className="overflow-y-auto pr-1">
            {step === 0 && <StepWorld draft={draft} update={update} />}
            {step === 1 && <StepIdentity draft={draft} update={update} />}
            {step === 2 && <StepPath draft={draft} update={update} />}
            {step === 3 && <StepStats draft={draft} update={update} />}
            {step === 4 && <StepStory draft={draft} update={update} />}
          </div>
        </HoloPanel>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <NavButton label={step === 0 ? "Annuler" : "◂ Précédent"} onClick={prev} />
        <StepHint step={step} draft={draft} />
        {step < STEPS.length - 1 ? (
          <NavButton label="Suivant ▸" onClick={next} disabled={!canProceed} primary />
        ) : (
          <NavButton label="Entrer dans l'histoire" onClick={launch} disabled={!canProceed} primary wide />
        )}
      </div>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  primary,
  wide,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  wide?: boolean;
}) {
  return (
    <HoloPanel
      variant="sm"
      scan={false}
      interactive={!disabled}
      onClick={disabled ? undefined : onClick}
      className={disabled ? "opacity-40" : ""}
      style={{
        minWidth: wide ? "260px" : "140px",
        cursor: disabled ? "not-allowed" : "pointer",
        background: primary
          ? "color-mix(in srgb, var(--accent) 16%, var(--bg-panel))"
          : "color-mix(in srgb, var(--bg-panel) 82%, transparent)",
        borderColor: primary ? "var(--border-glow)" : "var(--border-dim)",
      }}
    >
      <div
        className="font-display-title text-center text-[13px]"
        style={{ color: primary ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {label}
      </div>
    </HoloPanel>
  );
}

function validateStep(step: number, draft: CreationDraft): boolean {
  switch (step) {
    case 0:
      if (!draft.theme) return false;
      if (draft.theme === "custom" && !draft.customDesc?.trim()) return false;
      return true;
    case 1:
      return draft.name.trim().length > 0;
    case 2:
      return !!draft.archetype;
    case 3:
      return remainingPoints(draft.stats) === 0;
    case 4:
      return true;
    default:
      return false;
  }
}

function StepHint({ step, draft }: { step: number; draft: CreationDraft }) {
  let hint = "";
  if (step === 0 && draft.theme === "custom" && !draft.customDesc?.trim())
    hint = "Décris ton univers pour continuer.";
  else if (step === 1 && !draft.name.trim()) hint = "Un nom est requis.";
  else if (step === 3 && remainingPoints(draft.stats) !== 0)
    hint = `${remainingPoints(draft.stats)} point(s) à répartir.`;
  return (
    <span className="font-display text-xs" style={{ color: "var(--text-secondary)" }}>
      {hint}
    </span>
  );
}
