// =====================================================================
//  Écran d'accueil — design holographique (réf. Solo Leveling).
//  Titre « décodé », halos d'ambiance, boutons HoloPanel.
//  La logique (audio.start, resumeGame, navigation) est inchangée.
// =====================================================================

import { useEffect, useState, type CSSProperties } from "react";
import { useGame } from "@/store/gameStore";
import { audio } from "@/lib/audio";
import { readSave, AUTOSAVE_NAME } from "@/lib/persistence";
import HoloPanel from "@/components/common/HoloPanel";
import DecodeText from "@/components/common/DecodeText";

export default function Home() {
  const goTo = useGame((s) => s.goTo);
  const resumeGame = useGame((s) => s.resumeGame);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    void readSave(AUTOSAVE_NAME).then((s) => setHasSave(!!s));
  }, []);

  const enter = () => audio.start();

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      onPointerDown={enter}
    >
      {/* Halos d'ambiance subtils */}
      <Halo style={{ top: "-10%", left: "-8%" }} />
      <Halo style={{ bottom: "-12%", right: "-6%" }} />

      {/* Sur-titre */}
      <div
        className="font-display-title mb-4 text-[11px]"
        style={{ color: "var(--text-secondary)", letterSpacing: "0.5em" }}
      >
        Jeu de rôle narratif
      </div>

      {/* Logo « décodé » */}
      <DecodeText
        text="ONIRIA"
        durationMs={1200}
        className="font-display-title select-none"
        style={{
          fontSize: "96px",
          lineHeight: 1,
          color: "var(--text-primary)",
          letterSpacing: "0.2em",
          textShadow: "0 0 60px color-mix(in srgb, var(--accent) 66%, transparent)",
        }}
      />

      {/* Ligne lumineuse */}
      <div
        className="line-grow mt-6 h-px w-72"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent), transparent)",
          boxShadow: "0 0 12px var(--accent)",
        }}
      />

      {/* Sous-titre */}
      <p
        className="font-body mt-6 max-w-md text-center italic"
        style={{ fontSize: "18px", color: "var(--text-secondary)" }}
      >
        Crée un héros, choisis un monde, et vis une histoire écrite pour toi, en temps réel.
      </p>

      {/* Boutons */}
      <div className="mt-12 flex w-72 flex-col gap-3.5">
        <HomeButton
          label="Nouvelle histoire"
          primary
          onClick={() => {
            enter();
            goTo("creation");
          }}
        />
        <HomeButton
          label="Reprendre"
          disabled={!hasSave}
          onClick={async () => {
            enter();
            const ok = await resumeGame();
            if (!ok) setHasSave(false);
          }}
        />
        <HomeButton
          label="Réglages"
          onClick={() => {
            enter();
            goTo("settings");
          }}
        />
      </div>

      <div
        className="font-display absolute bottom-5 text-[11px]"
        style={{ color: "color-mix(in srgb, var(--text-secondary) 60%, transparent)", letterSpacing: "0.15em" }}
      >
        100 % LOCAL · VOS DONNÉES RESTENT SUR VOTRE DISQUE
      </div>
    </div>
  );
}

function Halo({ style }: { style: CSSProperties }) {
  return (
    <div
      className="pointer-events-none absolute h-[42vmin] w-[42vmin] rounded-full"
      style={{
        background: "var(--accent)",
        filter: "blur(120px)",
        opacity: 0.06,
        ...style,
      }}
    />
  );
}

function HomeButton({
  label,
  onClick,
  primary,
  disabled,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <HoloPanel
      variant="sm"
      interactive={!disabled}
      scan={false}
      onClick={disabled ? undefined : onClick}
      className={disabled ? "opacity-40" : ""}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        background: primary
          ? "color-mix(in srgb, var(--accent) 14%, var(--bg-panel))"
          : "color-mix(in srgb, var(--bg-panel) 82%, transparent)",
        borderColor: primary ? "var(--border-glow)" : "var(--border-dim)",
      }}
    >
      <div
        className="font-display-title text-center text-[14px]"
        style={{ color: primary ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {label}
      </div>
    </HoloPanel>
  );
}
