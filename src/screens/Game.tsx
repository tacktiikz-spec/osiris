// =====================================================================
//  Écran de jeu : Codex (HUD) + zone de récit + barre de saisie,
//  overlays de panneaux, carte-titre et notifications système.
// =====================================================================

import { useGame } from "@/store/gameStore";
import Codex from "@/components/game/Codex";
import NarrativeLog from "@/components/game/NarrativeLog";
import InputBar from "@/components/game/InputBar";
import TitleCard from "@/components/game/TitleCard";
import NotificationCenter from "@/components/game/NotificationCenter";
import StatusPanel from "@/components/game/panels/StatusPanel";
import InventoryPanel from "@/components/game/panels/InventoryPanel";
import QuestsPanel from "@/components/game/panels/QuestsPanel";
import ChroniclePanel from "@/components/game/panels/ChroniclePanel";
import PhonePanel from "@/components/game/panels/PhonePanel";

export default function Game() {
  const game = useGame((s) => s.game);
  const panel = useGame((s) => s.panel);

  if (!game) return null;

  return (
    <div className="flex h-full w-full">
      <Codex />

      <main className="flex flex-1 flex-col">
        <NarrativeLog />
        <InputBar />
      </main>

      {/* Panneaux en overlay */}
      {panel === "status" && <StatusPanel />}
      {panel === "inventory" && <InventoryPanel />}
      {panel === "quests" && <QuestsPanel />}
      {panel === "chronicle" && <ChroniclePanel />}
      {panel === "phone" && <PhonePanel />}

      {/* Carte-titre d'ouverture */}
      <TitleCard />

      {/* Notifications système (level up, objet, quête, XP, échec) */}
      <NotificationCenter />
    </div>
  );
}
