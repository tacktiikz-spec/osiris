// =====================================================================
//  Effet machine à écrire (rythme ~4 caractères par frame).
//  Cliquer révèle tout. Respecte le réglage et prefers-reduced-motion.
// =====================================================================

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/store/gameStore";

interface Props {
  text: string;
  /** Animer (uniquement pour le dernier message, fraîchement arrivé). */
  animate: boolean;
}

const CHARS_PER_TICK = 4;

export default function Typewriter({ text, animate }: Props) {
  const typewriter = useGame((s) => s.config.typewriter);
  const speed = useGame((s) => s.config.typewriterSpeed);
  const reduced = useGame((s) => s.config.reducedMotion);

  const shouldAnimate = animate && typewriter && !reduced;
  const [shown, setShown] = useState(shouldAnimate ? 0 : text.length);
  const [done, setDone] = useState(!shouldAnimate);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      setShown(text.length);
      setDone(true);
      return;
    }
    setShown(0);
    setDone(false);
    let i = 0;
    const step = () => {
      i += CHARS_PER_TICK;
      setShown(i);
      if (i >= text.length) {
        setDone(true);
        return;
      }
      timer.current = window.setTimeout(step, speed);
    };
    timer.current = window.setTimeout(step, speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, shouldAnimate, speed]);

  const reveal = () => {
    if (timer.current) clearTimeout(timer.current);
    setShown(text.length);
    setDone(true);
  };

  return (
    <p
      className={`selectable font-body whitespace-pre-wrap ${!done ? "tw-caret cursor-pointer" : ""}`}
      style={{ fontSize: "17px", lineHeight: 1.85, color: "var(--text-primary)" }}
      onClick={!done ? reveal : undefined}
      title={!done ? "Cliquer pour tout révéler" : undefined}
    >
      {text.slice(0, shown)}
    </p>
  );
}
