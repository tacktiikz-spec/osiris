// =====================================================================
//  HoloPanel — la brique de base du design holographique (Solo Leveling).
//  Tout panneau, overlay, HUD, bouton « panneau » de l'appli s'appuie
//  dessus : fond translucide flouté, bordure dim, équerres lumineuses aux
//  4 coins, ligne de scan animée, en-tête optionnel à trait d'accent.
//
//  Variantes de taille : xs / sm / md / lg / fullscreen (overlay).
// =====================================================================

import type { CSSProperties, ReactNode, MouseEvent } from "react";

export type HoloVariant = "xs" | "sm" | "md" | "lg" | "fullscreen";

interface HoloPanelProps {
  children: ReactNode;
  /** Titre de l'en-tête (si absent, pas d'en-tête). */
  title?: ReactNode;
  /** Icône (glyphe/emoji/svg) affichée avant le titre. */
  icon?: ReactNode;
  /** Contenu aligné à droite dans l'en-tête (badges, bouton fermer auto en fullscreen). */
  headerRight?: ReactNode;
  variant?: HoloVariant;
  /** Affiche la ligne de scan animée (défaut : true). */
  scan?: boolean;
  /** Coins lumineux pulsants (sélection active). */
  pulseCorners?: boolean;
  /** Comportement cliquable : survol = élévation + glow. */
  interactive?: boolean;
  /** État sélectionné : bordure + glow accentués. */
  active?: boolean;
  /** Overlay plein écran : clic à l'extérieur ferme, croix dans l'en-tête. */
  onClose?: () => void;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** Largeur max du panneau en mode fullscreen. */
  maxWidth?: string;
}

const PADDING: Record<HoloVariant, string> = {
  xs: "6px 10px",
  sm: "12px 16px",
  md: "20px 24px",
  lg: "24px 28px",
  fullscreen: "0",
};

const PANEL_BG = "color-mix(in srgb, var(--bg-panel) 82%, transparent)";
const BASE_SHADOW =
  "0 0 30px color-mix(in srgb, var(--accent) 13%, transparent), inset 0 0 60px #00000033";

function Corners({ pulse }: { pulse?: boolean }) {
  const cls = `holo-corner${pulse ? " holo-corner--pulse" : ""}`;
  return (
    <>
      <span className={`${cls} holo-corner--tl`} />
      <span className={`${cls} holo-corner--tr`} />
      <span className={`${cls} holo-corner--bl`} />
      <span className={`${cls} holo-corner--br`} />
    </>
  );
}

export default function HoloPanel({
  children,
  title,
  icon,
  headerRight,
  variant = "md",
  scan = true,
  pulseCorners = false,
  interactive = false,
  active = false,
  onClose,
  className = "",
  bodyClassName = "",
  style,
  onClick,
  maxWidth = "max(640px, 48vw)",
}: HoloPanelProps) {
  const hasHeader = title != null;

  const panelStyle: CSSProperties = {
    position: "relative",
    background: PANEL_BG,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid var(--border-dim)",
    boxShadow: BASE_SHADOW,
    overflow: "hidden",
    ...style,
  };

  const panel = (
    <div
      className={[
        interactive ? "holo-interactive" : "",
        active ? "holo-active" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={panelStyle}
      onClick={onClick}
    >
      <Corners pulse={pulseCorners || active} />
      {scan && <span className="holo-scan" />}

      {hasHeader && (
        <div
          className="relative z-[3] flex items-center justify-between gap-3"
          style={{
            background: "var(--bg-panel-hover)",
            borderBottom: "1px solid var(--border-dim)",
            borderLeft: "3px solid var(--accent)",
            padding: "10px 16px",
          }}
        >
          <div className="flex items-center gap-2.5">
            {icon != null && (
              <span className="text-[14px] leading-none" style={{ color: "var(--text-accent)" }}>
                {icon}
              </span>
            )}
            <span
              className="font-display-title text-[13px]"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-lg leading-none transition-colors"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Fermer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative z-[3] ${bodyClassName}`}
        style={{ padding: PADDING[variant === "fullscreen" ? "md" : variant] }}
      >
        {children}
      </div>
    </div>
  );

  // Mode plein écran : backdrop + centrage + clic extérieur ferme.
  if (variant === "fullscreen") {
    return (
      <div
        className="absolute inset-0 z-40 flex items-center justify-center p-6 animate-fade-in"
        style={{ background: "rgba(4,5,12,0.66)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      >
        <div
          className="w-full animate-slide-up"
          style={{ maxWidth, maxHeight: "86vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ position: "relative" }}>
            <Corners pulse={pulseCorners} />
            {scan && <span className="holo-scan" />}
            <div
              style={{
                position: "relative",
                background: PANEL_BG,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--border-dim)",
                boxShadow: BASE_SHADOW,
                overflow: "hidden",
              }}
            >
              {hasHeader && (
                <div
                  className="relative z-[3] flex items-center justify-between gap-3"
                  style={{
                    background: "var(--bg-panel-hover)",
                    borderBottom: "1px solid var(--border-dim)",
                    borderLeft: "3px solid var(--accent)",
                    padding: "12px 18px",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {icon != null && (
                      <span className="text-[15px] leading-none" style={{ color: "var(--text-accent)" }}>
                        {icon}
                      </span>
                    )}
                    <span
                      className="font-display-title text-[15px]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {headerRight}
                    {onClose && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                        }}
                        className="text-xl leading-none"
                        style={{ color: "var(--text-secondary)" }}
                        aria-label="Fermer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div
                className={`relative z-[3] overflow-y-auto ${bodyClassName}`}
                style={{ padding: "20px 24px", maxHeight: hasHeader ? "calc(86vh - 52px)" : "86vh" }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return panel;
}
