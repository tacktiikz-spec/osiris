// =====================================================================
//  Panneau TÉLÉPHONE — design holographique. Contacts = PNJ suivis par l'IA.
//  Envoyer un message déclenche une réponse de l'IA (logique inchangée).
// =====================================================================

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/store/gameStore";
import HoloPanel from "@/components/common/HoloPanel";

export default function PhonePanel() {
  const game = useGame((s) => s.game);
  const closePanel = useGame((s) => s.closePanel);
  const sendPhoneMessage = useGame((s) => s.sendPhoneMessage);
  const busy = useGame((s) => s.busy);

  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const phone = game?.phone;
  const contacts = phone?.contacts ?? [];
  const thread = active ? phone?.threads[active] ?? [] : [];

  useEffect(() => {
    if (!active && contacts.length > 0) setActive(contacts[0].id);
  }, [contacts, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, busy]);

  if (!game || !phone) return null;

  const send = () => {
    if (!active || !text.trim() || busy) return;
    const t = text;
    setText("");
    void sendPhoneMessage(active, t);
  };

  return (
    <HoloPanel variant="fullscreen" title="Téléphone" icon="✆" onClose={closePanel} maxWidth="780px">
      {contacts.length === 0 ? (
        <p className="font-body py-10 text-center text-sm italic" style={{ color: "var(--text-secondary)" }}>
          Aucun contact pour l'instant. Tu obtiendras des numéros au fil de l'histoire.
        </p>
      ) : (
        <div className="grid h-[58vh] grid-cols-[180px_1fr] gap-4">
          {/* Contacts */}
          <div className="space-y-1 overflow-y-auto pr-2" style={{ borderRight: "1px solid var(--border-dim)" }}>
            {contacts.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setActive(ct.id)}
                className="font-display-title w-full px-3 py-2 text-left text-[12px] transition-all"
                style={{
                  background: active === ct.id ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                  color: active === ct.id ? "var(--text-accent)" : "var(--text-secondary)",
                  borderLeft: active === ct.id ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {ct.name}
              </button>
            ))}
          </div>

          {/* Fil */}
          <div className="flex flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {thread.length === 0 && (
                <p className="font-body py-6 text-center text-xs italic" style={{ color: "var(--text-secondary)" }}>
                  Aucun message. Lance la conversation.
                </p>
              )}
              {thread.map((m, i) => (
                <div key={i} className={`flex ${m.from === "moi" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="font-body max-w-[75%] px-3 py-2 text-sm"
                    style={
                      m.from === "moi"
                        ? { background: "var(--accent)", color: "#000" }
                        : { background: "var(--bg-panel-hover)", color: "var(--text-primary)", border: "1px solid var(--border-dim)" }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && <div className="font-data text-xs" style={{ color: "var(--text-secondary)" }}>…</div>}
              <div ref={bottomRef} />
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={busy}
                placeholder="Écrire un message…"
                className="font-body flex-1 px-3 py-2 text-sm outline-none disabled:opacity-50"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)", color: "var(--text-primary)" }}
              />
              <button
                onClick={send}
                disabled={busy || !text.trim()}
                className="font-display-title px-5 py-2 text-[12px] disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#000" }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </HoloPanel>
  );
}
