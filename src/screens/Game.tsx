// =====================================================================
//  Écran de jeu : Codex (HUD) + bandeau monde + récit + saisie,
//  overlays de panneaux, carte-titre et notifications système.
//  Une teinte d'ambiance suit le moment de la journée (simulation).
// =====================================================================

import { useGame } from "@/store/gameStore";
import { TIME_META } from "@/lib/world";
import Codex from "@/components/game/Codex";
import WorldBar from "@/components/game/WorldBar";
import NarrativeLog from "@/components/game/NarrativeLog";
import InputBar from "@/components/game/InputBar";
import TitleCard from "@/components/game/TitleCard";
import NotificationCenter from "@/components/game/NotificationCenter";
import StatusPanel from "@/components/game/panels/StatusPanel";
import InventoryPanel from "@/components/game/panels/InventoryPanel";
import QuestsPanel from "@/components/game/panels/QuestsPanel";
import ChroniclePanel from "@/components/game/panels/ChroniclePanel";
import RelationsPanel from "@/components/game/panels/RelationsPanel";
import AtlasPanel from "@/components/game/panels/AtlasPanel";
import PhonePanel from "@/components/game/panels/PhonePanel";

export default function Game() {
  const game = useGame((s) => s.game);
  const panel = useGame((s) => s.panel);

  if (!game) return null;
  const tint = TIME_META[game.world.time]?.tint ?? "transparent";

  return (
    <div className="flex h-full w-full">
      <Codex />

      <main className="relative flex flex-1 flex-col">
        {/* Teinte d'ambiance selon l'heure du jour. */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-colors duration-[1500ms]"
          style={{ background: tint }}
        />
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <WorldBar />
          <NarrativeLog />
          <InputBar />
        </div>
      </main>

      {/* Panneaux en overlay */}
      {panel === "status" && <StatusPanel />}
      {panel === "inventory" && <InventoryPanel />}
      {panel === "quests" && <QuestsPanel />}
      {panel === "relations" && <RelationsPanel />}
      {panel === "atlas" && <AtlasPanel />}
      {panel === "chronicle" && <ChroniclePanel />}
      {panel === "phone" && <PhonePanel />}

      {/* Carte-titre d'ouverture */}
      <TitleCard />

      {/* Notifications système */}
      <NotificationCenter />
    </div>
  );
}
