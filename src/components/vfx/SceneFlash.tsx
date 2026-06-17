// =====================================================================
//  Flash de transition en couleur d'accent à l'arrivée d'une nouvelle scène.
// =====================================================================

import { useEffect, useState } from "react";
import { useGame } from "@/store/gameStore";

export default function SceneFlash() {
  const flash = useGame((s) => s.sceneFlash);
  const reducedMotion = useGame((s) => s.config.reducedMotion);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (flash.tick === 0 || reducedMotion) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, [flash.tick, reducedMotion]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 animate-flash"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${flash.color}, transparent 70%)`,
      }}
    />
  );
}
