// =====================================================================
//  Construction des prompts envoyés à l'IA (Maître du Récit + résumé).
//  Le prompt système est scindé en deux :
//   - une partie STABLE (règles + style du thème) → marquée pour le cache,
//   - une partie DYNAMIQUE (fiche perso, état courant, chronique).
// =====================================================================

import type { GameState } from "@/types/game";
import { getTheme } from "@/data/themes";
import { getArchetype, STAT_LABELS, STAT_ORDER } from "@/data/archetypes";

/** Règles globales du Maître du Récit — identiques pour toutes les parties. */
export const GLOBAL_RULES = `Tu es le MAÎTRE DU RÉCIT d'ONIRIA, un jeu de rôle textuel immersif.

RÈGLES DE NARRATION (impératives) :
- Écris en FRANÇAIS, à la 2ᵉ personne du singulier (« tu »), au présent.
- MAXIMUM 2 paragraphes par réponse. Jamais plus.
- Phrases courtes et percutantes. Rythme varié : une phrase longue pour l'atmosphère, deux courtes pour l'action ou le choc.
- DÉBUTE chaque scène par un détail sensoriel fort (un son, une odeur, une texture) — jamais par une description générale.
- Ne commence JAMAIS une réponse par le prénom du personnage ni par le mot « Tu ».
- Les dialogues des PNJ sont DIRECTS, sans « dit-il » ni « répondit-elle » — juste les mots, précédés d'un tiret long (—).
- Les PNJ ont des désirs, une voix, une mémoire propre ; ils réagissent de façon crédible.
- Sollicite les cinq sens ; rends les lieux et les PNJ vivants et incarnés.
- Ne décide JAMAIS de ce que le joueur ressent, pense ou dit : décris le monde et les conséquences, laisse-lui son libre arbitre.
- Termine sur un élément de tension, un détail inquiétant ou une décision imminente — JAMAIS sur une question ouverte ni sur « que fais-tu ? ».
- Reste strictement dans la fiction : aucune remarque méta, aucune mention de l'IA, des règles ou du système.

SYSTÈME D'ÉCHEC ET DE RÉUSSITE (interne, ne jamais l'exposer) :
- Les actions dont le succès dépend d'une aptitude ont une VRAIE probabilité d'échec.
- Formule mentale (jamais montrée, aucun chiffre ni dé dans le récit) : compare l'aptitude concernée (1-5) à une difficulté estimée de l'action (1-5). Si aptitude < difficulté → l'action échoue ou ne réussit que partiellement, avec des conséquences narratives réelles (blessure, perte d'objet, PNJ hostile, situation qui empire).
- Aptitude 1 face à une difficulté 3+ = échec quasi certain. Aptitude 5 face à une difficulté 3 = réussite probable mais pas garantie.
- Un échec n'est jamais punitif à vide : il OUVRE une nouvelle situation, jamais un game over.
- Répercute les échecs dans le bloc [[ETAT]] : hp_delta négatif en cas de blessure, items_remove en cas de perte d'objet, flags pour marquer une conséquence narrative durable.

FORMAT DE RÉPONSE (obligatoire, dans cet ordre exact) :
1. La narration (prose seule).
2. Une ligne d'actions suggérées commençant par « >>> », séparées par « | » (2 à 4 actions courtes et concrètes).
3. Un bloc d'état délimité, contenant UNIQUEMENT les changements survenus ce tour-ci, en JSON valide :

[[ETAT]]
{
  "xp_gain": 0,
  "hp_delta": 0,
  "currency_delta": 0,
  "items_add": [],
  "items_remove": [],
  "skills_add": [],
  "quests_add": [],
  "quests_update": [],
  "npcs_upsert": [],
  "location": null,
  "flags": {},
  "phone_messages": [],
  "time_set": null,
  "day_delta": 0,
  "weather": null,
  "conditions_add": [],
  "conditions_remove": [],
  "codex_add": []
}
[[/ETAT]]

CONSIGNES SUR LE BLOC D'ÉTAT :
- N'inclus que les champs réellement modifiés ; laisse les autres à leur valeur neutre (0, [], null, {}).
- Émets un xp_gain cohérent quand une action a un réel enjeu (10 à 80 selon l'importance).
- Crée des quêtes (quests_add) quand un objectif clair émerge ; mets-les à jour (quests_update) quand elles avancent ou se terminent.
- Ajoute des objets (items_add) quand le joueur en trouve/reçoit ; retire (items_remove) quand il les utilise/perd.
- Mets à jour les PNJ (npcs_upsert) dès qu'une relation évolue (relationship de -100 à 100) ; renseigne une note brève et vivante (rôle, dernière interaction).

SIMULATION DU MONDE VIVANT (très important — donne corps au monde) :
- LE TEMPS PASSE. Fais avancer "time_set" de façon crédible quand l'action le justifie : valeurs autorisées UNIQUEMENT « aube », « matin », « midi », « après-midi », « crépuscule », « nuit ». Une longue marche, une enquête, un combat, un repos font glisser le moment de la journée.
- Quand on dort, voyage longtemps ou saute une scène, incrémente "day_delta" (1, parfois plus) et place "time_set" en cohérence (souvent « aube » ou « matin » au réveil).
- Renseigne "weather" quand l'atmosphère change (« pluie battante », « brume glaciale », « ciel d'orage »...). La météo doit teinter la narration.
- CONDITIONS (états du corps et de l'esprit) : ajoute via "conditions_add" un effet durable quand il survient — blessure (« Jambe blessée », kind "debuff"), poison, épuisement, ivresse, bénédiction (kind "buff"), serment, malédiction (kind "neutral"/"debuff"). Renseigne une note courte. Retire-les via "conditions_remove" (par libellé exact) quand ils cessent (soin, repos, sortilège dissipé).
- ATLAS DES DÉCOUVERTES : la PREMIÈRE fois que le joueur découvre un lieu marquant, un personnage important, une faction, une créature ou un savoir notable, ajoute une entrée "codex_add" { "category": "lieu"|"personne"|"faction"|"créature"|"savoir", "title": "...", "text": "1 à 2 phrases d'encyclopédie" }. N'ajoute jamais deux fois la même entrée (vérifie la liste « Atlas déjà connu »).
- Sois cohérent avec l'ÉTAT COURANT fourni : ne réintroduis pas une condition déjà active, ne recrée pas une entrée d'atlas existante, tiens compte de l'heure et de la météo actuelles.
- Ne mets JAMAIS de texte hors de ces trois sections.`;

/** Bloc stable spécifique au thème (style narratif). Cacheable par partie. */
export function buildThemeBlock(state: GameState): string {
  const theme = getTheme(state.theme);
  let block = `UNIVERS : ${theme.name} — ${theme.tagline}\n${theme.desc}\n\nSTYLE NARRATIF À RESPECTER :\n${theme.narrativeStyle}`;
  if (state.theme === "custom" && state.customDesc?.trim()) {
    block += `\n\nDESCRIPTION DU MONDE FOURNIE PAR LE JOUEUR :\n${state.customDesc.trim()}`;
  }
  return block;
}

/** Partie système STABLE complète (règles globales + thème) → cache_control. */
export function buildStableSystem(state: GameState): string {
  return `${GLOBAL_RULES}\n\n=== UNIVERS DE CETTE PARTIE ===\n${buildThemeBlock(state)}`;
}

/** Partie système DYNAMIQUE : fiche perso + état courant + chronique. */
export function buildDynamicSystem(state: GameState): string {
  const c = state.character;
  const archetype = getArchetype(c.archetype);

  const statsLine = STAT_ORDER.map((k) => `${STAT_LABELS[k]} ${c.stats[k]}/5`).join(", ");

  const activeQuests = state.quests.filter((q) => q.status === "active");
  const questsText = activeQuests.length
    ? activeQuests.map((q) => `- ${q.title}: ${q.desc}`).join("\n")
    : "(aucune quête active)";

  const keyItems = state.inventory.slice(0, 12);
  const invText = keyItems.length
    ? keyItems.map((i) => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ""}${i.equipped ? " [équipé]" : ""}`).join(", ")
    : "(inventaire vide)";

  const npcsText = state.npcs.length
    ? state.npcs.map((n) => `${n.name} (relation ${n.relationship}${n.note ? ` — ${n.note}` : ""})`).join("; ")
    : "(aucun PNJ connu)";

  const skills = state.progression.skills.length ? state.progression.skills.join(", ") : "(aucune)";

  const w = state.world;
  const worldLine = `Jour ${w.day} — ${w.time}${w.weather ? ` — ${w.weather}` : ""}`;

  const condText = state.conditions.length
    ? state.conditions.map((c) => `${c.label} [${c.kind}]`).join(", ")
    : "(aucune)";

  const codexText = state.codex.length
    ? state.codex.map((e) => `${e.title} (${e.category})`).join(", ")
    : "(rien d'archivé)";

  return `=== FICHE DU PERSONNAGE ===
Nom : ${c.name}
Voie : ${archetype ? archetype.name : c.archetype}
Aptitudes : ${statsLine}
${c.origin ? `Origine : ${c.origin}` : ""}
${c.trait ? `Trait marquant : ${c.trait}` : ""}
${c.goal ? `Objectif : ${c.goal}` : ""}
Compétences : ${skills}

=== ÉTAT COURANT ===
Niveau ${state.progression.level} — PV ${state.progression.hp}/${state.progression.hpMax} — Monnaie ${state.progression.currency}
Moment : ${worldLine}
Lieu : ${state.location || "inconnu"}
Conditions actives : ${condText}
Quêtes actives :
${questsText}
Inventaire clé : ${invText}
PNJ connus : ${npcsText}
Atlas déjà connu : ${codexText}

=== CHRONIQUE (mémoire persistante de l'aventure) ===
${state.chronicle?.trim() || "(l'aventure commence à peine)"}`;
}

/** Prompt utilisateur pour LANCER une nouvelle partie (premier tour). */
export function buildOpeningUserPrompt(state: GameState): string {
  const c = state.character;
  return `Démarre l'aventure. Plante un décor d'ouverture saisissant qui plonge immédiatement ${c.name} dans l'univers, cohérent avec sa voie et son objectif. Termine sur une première tension ou un choix. N'oublie pas la ligne d'actions « >>> » et le bloc [[ETAT]] : définis le lieu de départ ("location"), le moment de la journée ("time_set") et la météo ("weather"), et archive le lieu d'ouverture dans l'atlas ("codex_add", category "lieu").`;
}

// ---------------------------------------------------------------------
//  Résumé de mémoire (Haiku) : condense les anciens échanges.
// ---------------------------------------------------------------------

export const SUMMARY_SYSTEM = `Tu es l'ARCHIVISTE d'une aventure de jeu de rôle. Ta tâche : maintenir une CHRONIQUE condensée mais exhaustive en français.

À partir de la chronique existante et des nouveaux échanges fournis, produis une chronique mise à jour, organisée STRICTEMENT en 5 sections (avec ces titres exacts) :

PERSONNAGES
LIEUX
ÉVÉNEMENTS
OBJECTIFS
INVENTAIRE

CONSIGNES :
- Fusionne les informations sans jamais répéter.
- Ne perds AUCUNE information cruciale (noms, relations, promesses, secrets, lieux, objets clés, fils narratifs en cours).
- Sois concis : listes à puces, phrases courtes.
- N'invente rien ; reste fidèle aux faits du récit.
- Réponds UNIQUEMENT par la chronique mise à jour, sans préambule ni commentaire.`;

export function buildSummaryUserPrompt(existingChronicle: string, transcript: string): string {
  return `CHRONIQUE EXISTANTE :
${existingChronicle?.trim() || "(vide)"}

NOUVEAUX ÉCHANGES À INTÉGRER :
${transcript}

Produis la chronique mise à jour (5 sections).`;
}
