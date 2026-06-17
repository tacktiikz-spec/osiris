# ONIRIA

**Jeu de rôle textuel narratif piloté par IA** — application de bureau locale (Windows/macOS/Linux).

Le joueur crée un personnage, choisit un univers, et vit une histoire complète écrite en temps réel par une IA qui joue le **Maître du Récit**. L'immersion passe par la narration, l'ambiance sonore, les effets visuels et une vraie interface de jeu (HUD) avec des systèmes mécaniques réels (niveau, inventaire, quêtes…).

## Principes

- **100 % local** : toutes les données (sauvegardes, personnage, progression, sons) sont stockées sur le disque de l'utilisateur, en fichiers JSON lisibles.
- **Aucun serveur, aucun compte, aucun cloud.** Le seul accès réseau est l'appel à l'API d'Anthropic pour la narration.
- L'IA ne renvoie pas que du texte : elle renvoie un **récit** + un **bloc d'état structuré** (`[[ETAT]]`) que l'application applique à un état de jeu persistant.

## Stack technique

- **Tauri 2** (coquille desktop native)
- **React 18 + TypeScript + Vite**
- **Tailwind CSS** + styles inline pour les couleurs dynamiques par thème
- **Zustand** (state global)
- **Howler.js** (audio, avec fallback procédural Web Audio)
- Plugins Tauri **fs / dialog / opener**
- **API Anthropic Messages** : narration sur `claude-sonnet-4-6`, résumés mémoire sur `claude-haiku-4-5-20251001`, avec **prompt caching** sur la partie système stable.

## Prérequis

- [Node.js](https://nodejs.org/) (LTS ou plus récent)
- [Rust](https://rustup.rs/) (toolchain `stable-msvc` sous Windows)
- Sous Windows : **Visual Studio Build Tools** (workload « C++ ») + **WebView2** (préinstallé sur Windows 10/11 récents)

## Démarrage

```bash
npm install        # installe les dépendances frontend
npm run tauri:dev  # lance l'application en mode développement
```

## Build de production

```bash
npm run tauri:build
```

Les exécutables/installeurs sont générés dans `src-tauri/target/release/` (et `.../bundle/`).

## Configuration

Au premier lancement, ouvrez **Réglages** et saisissez votre **clé API Anthropic**
(obtenue sur [console.anthropic.com](https://console.anthropic.com)).

> La clé est stockée **uniquement** sur votre disque (`oniria-config.json` dans le
> dossier de données de l'application) et n'est jamais committée ni partagée.

## Données locales

Tout vit dans le dossier de données de l'application (`AppData` / `Application Support` / `.local/share`) :

| Chemin                     | Contenu                                              |
| -------------------------- | ---------------------------------------------------- |
| `oniria-config.json`       | Clé API, volumes, préférences                        |
| `saves/autosave.json`      | Sauvegarde automatique (après chaque tour)           |
| `saves/slot-*.json`        | Emplacements de sauvegarde manuels                   |
| `avatars/`                 | Avatars copiés depuis le disque utilisateur          |
| `sounds/`                  | Vos fichiers audio + `sounds.json` (manifeste)       |

### Sons personnalisés

Déposez vos `.mp3`/`.ogg` dans le dossier `sounds/` et éditez `sounds.json`
(bouton **« Ouvrir le dossier des sons »** dans les Réglages). Si un fichier
manque, un son procédural est généré automatiquement (jamais de silence cassé).

Clés attendues : `ambient_<theme>` (ambiances en boucle), `sfx_select`,
`sfx_action`, `sfx_scene`, `sfx_levelup`, `sfx_quest`, `sfx_phone`, `sfx_error`.

## Architecture du code

```
src/
├── types/game.ts          # Modèle d'état de jeu (GameState) + deltas [[ETAT]]
├── data/                  # Thèmes, archétypes, manifeste sonore
├── lib/                   # Logique : API, prompts, protocole d'état, mémoire,
│                          #   progression, persistance, audio, config, avatar
├── store/gameStore.ts     # State global Zustand + actions
├── screens/               # Accueil, Réglages, Création, Jeu
└── components/            # creation/ · game/ (+ panels/) · vfx/ · common/
src-tauri/                 # Coquille Rust (plugins fs/dialog/opener)
```

## Protocole IA

Chaque tour, l'IA produit dans l'ordre :

1. **La narration** (prose, 2-4 paragraphes).
2. Une ligne d'**actions suggérées** : `>>> action 1 | action 2 | action 3`.
3. Un **bloc d'état** délimité contenant uniquement les deltas :

```
[[ETAT]]
{ "xp_gain": 0, "items_add": [], "quests_add": [], ... }
[[/ETAT]]
```

L'application sépare ces trois parties, applique les deltas au `GameState`, et
nettoie le texte affiché. En cas de bloc absent/invalide : échec gracieux (le
récit n'est jamais interrompu).

## Mémoire « qui n'oublie rien »

Une **CHRONIQUE** condensée (5 sections : Personnages, Lieux, Événements,
Objectifs, Inventaire) est maintenue par Haiku. Quand le log dépasse un seuil,
les anciens échanges y sont condensés et ne sont plus renvoyés verbatim → coût
borné, rien d'oublié.

## Licence

Projet personnel. Aucune dépendance payante hors API Anthropic.
