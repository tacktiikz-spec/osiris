// =====================================================================
//  Carte-titre d'ouverture — le nom du monde se « décode », tagline en
//  fondu, ligne lumineuse qui se dessine, puis transition vers la scène.
// =====================================================================

import { useEffect, useState } from "react";
import { getTheme } from "@/data/themes";
import { useGame } from "@/store/gameStore";
import DecodeText from "@/components/common/DecodeText";

export default function TitleCard() {
  const game = useGame((s) => s.game);
  const reduced = useGame((s) => s.config.reducedMotion);
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    if (reduced) {
      // Affichage bref puis disparition instantanée.
      const t = setTimeout(() => setPhase("gone"), 1200);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("out"), 3000);
    const t2 = setTimeout(() => setPhase("gone"), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);

  if (!game || phase === "gone") return null;
  const theme = getTheme(game.theme);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center transition-opacity duration-700"
      style={{ background: "var(--bg-deep)", opacity: phase === "out" ? 0 : 1 }}
    >
      <DecodeText
        text={theme.name}
        durationMs={1400}
        className="font-display-title text-center"
        style={{
          fontSize: "64px",
          lineHeight: 1.1,
          color: "var(--text-primary)",
          letterSpacing: "0.18em",
          textShadow: "0 0 50px color-mix(in srgb, var(--accent) 66%, transparent)",
        }}
      />

      <div
        className="line-grow mt-6 h-px w-80"
        style={{
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          boxShadow: "0 0 14px var(--accent)",
          animationDelay: "0.9s",
          animationFillMode: "backwards",
        }}
      />

      <p
        className="font-body mt-6 max-w-lg px-6 text-center italic animate-fade-in"
        style={{ fontSize: "18px", color: "var(--text-secondary)", animationDelay: "1.1s", animationFillMode: "backwards" }}
      >
        {theme.tagline}
      </p>
    </div>
  );
}
