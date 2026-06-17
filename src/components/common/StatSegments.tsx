// =====================================================================
//  StatSegments — barre de stat en segments (réf. Solo Leveling).
//  Segment rempli = couleur d'accent + glow ; vide = --border-dim.
//  Réutilisé en création, dans le Codex et le panneau Statut.
// =====================================================================

interface Props {
  value: number;
  max?: number;
  /** Hauteur des segments en px. */
  height?: number;
  /** Largeur min d'un segment (sinon flex). */
  gap?: number;
}

export default function StatSegments({ value, max = 5, height = 10, gap = 3 }: Props) {
  return (
    <div className="flex w-full" style={{ gap }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <div
            key={i}
            className="flex-1 transition-all duration-200"
            style={{
              height,
              background: filled ? "var(--accent)" : "transparent",
              border: filled
                ? "1px solid var(--accent)"
                : "1px solid var(--border-dim)",
              boxShadow: filled
                ? "0 0 8px color-mix(in srgb, var(--accent) 55%, transparent)"
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}
