// =====================================================================
//  DecodeText — effet de « décodage » holographique : chaque lettre se
//  stabilise une par une depuis des caractères de glitch aléatoires.
//  Utilisé par l'écran d'accueil et la carte-titre d'ouverture.
//  Respecte prefers-reduced-motion (affichage instantané).
// =====================================================================

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useGame } from "@/store/gameStore";

const GLITCH = "アカサタナ01<>/{}#$%&*+=ﾊﾐﾓﾔﾗ".split("");

interface Props {
  text: string;
  className?: string;
  style?: CSSProperties;
  /** Durée totale de la stabilisation (ms). */
  durationMs?: number;
  /** Relance l'animation quand cette valeur change. */
  trigger?: unknown;
}

export default function DecodeText({ text, className, style, durationMs = 1200, trigger }: Props) {
  const reduced = useGame((s) => s.config.reducedMotion);
  const [display, setDisplay] = useState(reduced ? text : "");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }
    const chars = text.split("");
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // Nombre de lettres « verrouillées » proportionnel au temps écoulé.
      const locked = Math.floor(progress * chars.length);
      const out = chars
        .map((c, i) => {
          if (c === " ") return " ";
          if (i < locked) return c;
          return GLITCH[(Math.random() * GLITCH.length) | 0];
        })
        .join("");
      setDisplay(out);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, durationMs, reduced, trigger]);

  return (
    <span className={className} style={style}>
      {display || "\u00A0"}
    </span>
  );
}
