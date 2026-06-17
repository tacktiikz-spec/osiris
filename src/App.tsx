import { useEffect } from "react";
import { useGame } from "@/store/gameStore";
import { getTheme } from "@/data/themes";
import { applyThemeVars } from "@/lib/themeVars";
import Home from "@/screens/Home";
import Settings from "@/screens/Settings";
import CharacterCreation from "@/screens/CharacterCreation";
import Game from "@/screens/Game";
import ParticleField from "@/components/vfx/ParticleField";
import SceneFlash from "@/components/vfx/SceneFlash";

export default function App() {
  const initApp = useGame((s) => s.initApp);
  const configLoaded = useGame((s) => s.configLoaded);
  const screen = useGame((s) => s.screen);
  const game = useGame((s) => s.game);
  const config = useGame((s) => s.config);

  useEffect(() => {
    void initApp();
  }, [initApp]);

  // Thème actif : celui de la partie en cours, sinon thème par défaut.
  const activeTheme = game ? getTheme(game.theme) : getTheme("custom");

  useEffect(() => {
    applyThemeVars(activeTheme);
  }, [activeTheme]);

  const reducedMotion = config.reducedMotion;

  if (!configLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm opacity-60">
        Chargement d'ONIRIA…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Fond de particules par thème (sauf si reduced-motion). */}
      <ParticleField
        kind={screen === "game" || screen === "creation" ? activeTheme.particles : "stars"}
        disabled={reducedMotion}
      />

      {/* Voile sombre pour la lisibilité. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 h-full w-full">
        {screen === "home" && <Home />}
        {screen === "settings" && <Settings />}
        {screen === "creation" && <CharacterCreation />}
        {screen === "game" && <Game />}
      </div>

      <SceneFlash />
    </div>
  );
}
