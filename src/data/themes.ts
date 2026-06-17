// =====================================================================
//  Thèmes / univers d'ONIRIA.
//  Chaque thème porte son identité visuelle (couleurs, particules),
//  sonore (clé d'ambiance), narrative (style injecté au prompt) et
//  la liste des systèmes/HUD activés.
// =====================================================================

/** Types de systèmes mécaniques qu'un thème peut activer. */
export type GameSystem =
  | "status" // fenêtre statut / niveau
  | "inventory"
  | "quests"
  | "skills"
  | "phone" // téléphone (contacts = PNJ)
  | "statusWindows"; // fenêtres de statut « isekai » (cosmétique narratif)

/** Types de particules VFX (cf. components/vfx/Particles). */
export type ParticleKind =
  | "glyphs" // glyphes néon qui tombent — cyberpunk
  | "embers" // braises — dark fantasy
  | "dust" // poussière — post-apo
  | "stars" // étoiles scintillantes — space opera
  | "rain" // pluie — thriller noir
  | "sparks" // étincelles — shōnen
  | "petals" // pétales de sakura — isekai
  | "grid" // grille mecha
  | "wisps" // feux follets — yokai
  | "none";

export type ThemeCategory = "classique" | "anime" | "custom";

export interface ThemeColors {
  accent: string; // couleur principale (néon / lueur)
  accent2: string; // couleur secondaire
  bg: string; // fond profond
  bgSoft: string; // fond légèrement plus clair (panneaux)
}

export interface ThemeAudio {
  /** Clé d'ambiance dans le manifeste sonore (ambient_<id>). */
  ambient: string;
  /** Teinte procédurale de secours si le fichier d'ambiance manque (Hz). */
  fallbackDrone: number;
}

export interface Theme {
  id: string;
  cat: ThemeCategory;
  name: string;
  tagline: string;
  desc: string;
  colors: ThemeColors;
  particles: ParticleKind;
  audio: ThemeAudio;
  /** Style narratif — instructions injectées dans le prompt système. */
  narrativeStyle: string;
  /** Systèmes mécaniques activés pour ce thème. */
  systems: GameSystem[];
}

const BASE_SYSTEMS: GameSystem[] = ["status", "inventory", "quests", "skills"];

export const THEMES: Theme[] = [
  // ----------------------------- CLASSIQUES -----------------------------
  {
    id: "neo-kyoto",
    cat: "classique",
    name: "Néo-Kyoto",
    tagline: "Néons, pluie acide et secrets corporatistes",
    desc: "Une mégalopole cyberpunk où la lumière des hologrammes noie les ruelles. Implants, IA, yakuzas augmentés et data brûlante.",
    colors: { accent: "#00C8FF", accent2: "#FF2E88", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "glyphs",
    audio: { ambient: "ambient_neo-kyoto", fallbackDrone: 70 },
    narrativeStyle:
      "Cyberpunk dense et sensoriel. Néons, pluie, hologrammes, jargon techno-corpo, mégacorporations et rue. Ton noir, électrique, parfois mélancolique. Mêle haute technologie et misère humaine.",
    systems: [...BASE_SYSTEMS, "phone"],
  },
  {
    id: "royaume-cendre",
    cat: "classique",
    name: "Le Royaume Cendre",
    tagline: "Une dark fantasy où la lumière se meurt",
    desc: "Un royaume agonisant sous une cendre éternelle. Chevaliers déchus, dieux silencieux, malédictions tenaces et magie au prix du sang.",
    colors: { accent: "#E8654A", accent2: "#D4A24E", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "embers",
    audio: { ambient: "ambient_royaume-cendre", fallbackDrone: 55 },
    narrativeStyle:
      "Dark fantasy grave et solennelle. Désespoir, ruines, foi vacillante, créatures maudites. Prose dense, presque liturgique. La magie a toujours un prix.",
    systems: [...BASE_SYSTEMS],
  },
  {
    id: "dernier-horizon",
    cat: "classique",
    name: "Dernier Horizon",
    tagline: "Le monde d'après, sous un ciel mort",
    desc: "Terres dévastées post-apocalyptiques. Pénurie, abris de fortune, factions rivales et reliques d'un monde englouti.",
    colors: { accent: "#E0902B", accent2: "#8FA9B0", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "dust",
    audio: { ambient: "ambient_dernier-horizon", fallbackDrone: 48 },
    narrativeStyle:
      "Post-apocalyptique âpre et réaliste. Survie, ressources rares, dilemmes moraux, paysages désolés balayés par le vent. Ton sec, tendu, viscéral.",
    systems: [...BASE_SYSTEMS],
  },
  {
    id: "vide-stellaire",
    cat: "classique",
    name: "Vide Stellaire",
    tagline: "Space opera aux confins de l'inconnu",
    desc: "Un vaisseau, une galaxie fracturée, des civilisations étranges. Diplomatie, anomalies, IA millénaires et silence des étoiles.",
    colors: { accent: "#6AA9FF", accent2: "#B388FF", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "stars",
    audio: { ambient: "ambient_vide-stellaire", fallbackDrone: 60 },
    narrativeStyle:
      "Space opera ample et contemplatif. Émerveillement cosmique, technologies avancées, xéno-cultures, vertige du vide. Ton à la fois épique et intime.",
    systems: [...BASE_SYSTEMS],
  },
  {
    id: "sang-murmures",
    cat: "classique",
    name: "Sang & Murmures",
    tagline: "Thriller noir, ville pluvieuse, vérités enfouies",
    desc: "Une enquête sombre dans une cité corrompue. Indices, mensonges, néons fatigués et un meurtre qui n'en finit pas de saigner.",
    colors: { accent: "#C8203A", accent2: "#9AA0A6", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "rain",
    audio: { ambient: "ambient_sang-murmures", fallbackDrone: 52 },
    narrativeStyle:
      "Thriller noir, première moitié du XXe revisité ou contemporain. Enquête, suspense, ombres, dialogues affûtés, atmosphère pluvieuse et désabusée. Tension permanente.",
    systems: [...BASE_SYSTEMS, "phone"],
  },

  // ------------------------------- ANIMÉ --------------------------------
  {
    id: "academie-elus",
    cat: "anime",
    name: "Académie des Élus",
    tagline: "Shōnen : dépasse tes limites",
    desc: "Une académie où des jeunes aux pouvoirs naissants s'entraînent, se lient et affrontent des menaces grandissantes. Rivaux, mentors, tournois.",
    colors: { accent: "#36E0C8", accent2: "#FFD23F", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "sparks",
    audio: { ambient: "ambient_academie-elus", fallbackDrone: 80 },
    narrativeStyle:
      "Style shōnen : monologues intérieurs enflammés, techniques NOMMÉES (annoncées en gras dans le récit), camaraderie, rivalité, montée en puissance, dépassement de soi. Énergie, emphase, cris du cœur. Les combats sont chorégraphiés et spectaculaires.",
    systems: [...BASE_SYSTEMS],
  },
  {
    id: "isekai-renaissance",
    cat: "anime",
    name: "Isekai : Renaissance",
    tagline: "Transporté dans un autre monde",
    desc: "Vous renaissez dans un monde de fantasy à système de jeu : niveaux, classes, fenêtres de statut, guildes et donjons.",
    colors: { accent: "#7C5CFF", accent2: "#5AD1FF", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "petals",
    audio: { ambient: "ambient_isekai-renaissance", fallbackDrone: 72 },
    narrativeStyle:
      "Style isekai : le héros vient d'un autre monde. Le récit affiche parfois des FENÊTRES DE STATUT (encadrées dans le texte, ex. « ◆ Compétence acquise : … »). Niveaux, classes, guildes, donjons, PNJ attachants. Ton enjoué mais avec enjeux réels.",
    systems: [...BASE_SYSTEMS, "statusWindows"],
  },
  {
    id: "dernier-rempart",
    cat: "anime",
    name: "Dernier Rempart",
    tagline: "Mecha : l'humanité dans l'acier",
    desc: "Pilote d'un mecha de combat face à une menace qui dépasse l'entendement. Bases militaires, camarades, sacrifices, géants d'acier.",
    colors: { accent: "#FF5630", accent2: "#4FC3F7", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "grid",
    audio: { ambient: "ambient_dernier-rempart", fallbackDrone: 64 },
    narrativeStyle:
      "Style mecha : tension militaire, camaraderie d'escadron, poids psychologique du pilotage, batailles titanesques de robots, enjeux existentiels pour l'humanité. Grave et héroïque.",
    systems: [...BASE_SYSTEMS],
  },
  {
    id: "spectres-sabres",
    cat: "anime",
    name: "Spectres & Sabres",
    tagline: "Yōkai et lames à l'ère d'Edo",
    desc: "Un Japon féodal hanté par les yōkai. Chasseurs de démons, sabres bénis, esprits anciens et villages terrifiés sous la lune.",
    colors: { accent: "#9D7BFF", accent2: "#E84393", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "wisps",
    audio: { ambient: "ambient_spectres-sabres", fallbackDrone: 58 },
    narrativeStyle:
      "Japon d'Edo surnaturel : yōkai, esprits, démons, folklore, sabres et techniques de respiration. Beauté mélancolique, honneur, surnaturel mêlé au quotidien. Style anime sombre et lyrique.",
    systems: [...BASE_SYSTEMS],
  },

  // ------------------------------ SUR MESURE ----------------------------
  {
    id: "custom",
    cat: "custom",
    name: "Univers sur mesure",
    tagline: "Décris ton propre monde",
    desc: "Vous écrivez les règles : décrivez le ton, l'époque, les enjeux. L'IA bâtira la fiction autour de votre vision.",
    colors: { accent: "#9A8CFF", accent2: "#5AA9FF", bg: "#080a12", bgSoft: "#0d1020" },
    particles: "stars",
    audio: { ambient: "ambient_custom", fallbackDrone: 66 },
    narrativeStyle:
      "Univers défini par le joueur (voir la description fournie). Adapte le ton, l'époque et les codes à cette description tout en gardant une narration immersive et cohérente.",
    systems: [...BASE_SYSTEMS],
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function themesByCategory(cat: ThemeCategory): Theme[] {
  return THEMES.filter((t) => t.cat === cat);
}

export function themeHasSystem(theme: Theme, system: GameSystem): boolean {
  return theme.systems.includes(system);
}

export const CATEGORY_LABELS: Record<ThemeCategory, string> = {
  classique: "Classiques",
  anime: "Animé",
  custom: "Sur mesure",
};
