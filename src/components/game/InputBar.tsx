// =====================================================================
//  Barre de saisie — design holographique.
//  Chips d'action (HoloPanel xs), textarea Crimson Pro, bouton AGIR dégradé.
//  Logique d'envoi / réessai inchangée.
// =====================================================================

import { useState } from "react";
import { useGame } from "@/store/gameStore";
import { audio } from "@/lib/audio";
import { SFX_KEYS } from "@/data/sounds";

export default function InputBar() {
  const game = useGame((s) => s.game);
  const busy = useGame((s) => s.busy);
  const error = useGame((s) => s.error);
  const sendTurn = useGame((s) => s.sendTurn);
  const retryTurn = useGame((s) => s.retryTurn);
  const clearError = useGame((s) => s.clearError);
  const [value, setValue] = useState("");

  const lastAssistant = [...(game?.messages ?? [])].reverse().find((m) => m.role === "assistant");
  const chips = lastAssistant?.actions ?? [];

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setValue("");
    void sendTurn(t);
  };

  return (
    <div
      className="px-10 py-4"
      style={{
        background: "color-mix(in srgb, var(--bg-deep) 80%, transparent)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        {error && (
          <div
            className="mb-3 flex items-center justify-between gap-3 px-3 py-2"
            style={{ border: "1px solid var(--danger)", background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
          >
            <span className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
              {error}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => retryTurn()}
                disabled={busy}
                className="font-display-title px-3 py-1 text-[11px]"
                style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}
              >
                Réessayer
              </button>
              <button onClick={clearError} className="text-lg leading-none" style={{ color: "var(--text-secondary)" }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {chips.length > 0 && !busy && (
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  void audio.playSfx(SFX_KEYS.chip);
                  submit(c);
                }}
                className="holo-interactive font-display px-3 py-1.5 text-xs"
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-dim)",
                  color: "var(--text-accent)",
                  letterSpacing: "0.04em",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(value);
              }
            }}
            disabled={busy}
            rows={1}
            placeholder={busy ? "Patiente…" : "Que fais-tu ? (Entrée pour agir, Maj+Entrée pour un saut de ligne)"}
            className="font-body max-h-32 min-h-[46px] flex-1 resize-none px-4 py-3 text-sm italic outline-none transition-colors focus:border-[color:var(--border-glow)] disabled:opacity-50"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)", color: "var(--text-primary)" }}
          />
          <button
            onClick={() => submit(value)}
            disabled={busy || !value.trim()}
            className="font-display-title px-6 py-3 text-[13px] transition-all disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#000",
              boxShadow: "0 0 20px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
          >
            Agir
          </button>
        </div>
      </div>
    </div>
  );
}
