# Buddy

**Sors plus. Seul c'est moins drôle.**

Buddy est une app de sorties : elle rassemble les événements près de chez toi, même les petits (impro dans un bar, vente de plantes, tournoi de pétanque), et t'aide à trouver quelqu'un pour y aller avec toi.

Cette version est une **app web mobile** (PWA) : elle s'ouvre dans le navigateur du téléphone et s'installe sur l'écran d'accueil comme une vraie app.

**Les événements sont réels** : environ 2 700 dates à Nantes et dans la métropole, issues de l'[agenda officiel de Nantes Métropole](https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-evenements-nantes-metropole_v2/) et de l'[agenda des bibliothèques de Nantes](https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-animations-culturelles-bibliotheque-municipale-nantes/) (open data, Licence Ouverte 2.0), mis à jour automatiquement toutes les 6 heures. S'y ajoutent les **marchés de la métropole** (une cinquantaine, avec leurs jours et horaires) et environ **700 lieux de sortie** — bars, pubs, cafés, boîtes, théâtres, cinémas, salles de concert — issus d'[OpenStreetMap](https://www.openstreetmap.org/) (ODbL), avec horaires, terrasse et accessibilité quand ils sont renseignés. Les événements [OpenAgenda](https://openagenda.com/) des associations et lieux nantais (dont brocantes et vide-greniers) s'ajoutent dès qu'une clé est configurée (voir plus bas). Les membres, appels et conversations restent une communauté de démonstration ; le profil de l'utilisateur est stocké sur son appareil.

## Ce que fait l'app

| Espace | Fonctionnalités |
|---|---|
| **Onboarding** | Bienvenue, concept, charte, ville + géolocalisation + rayon, goûts (min. 2), profil. Accès direct « profil démo ». |
| **Accueil** | Coup de cœur du soir, rubriques à défilement horizontal, appels ouverts, « Ouvert maintenant près de toi », events de tes Buddies, catégories, « Proposer un event ». |
| **Explorer** | Onglets **Événements** / **Lieux**. Événements : recherche texte, dates rapides, catégories, vue liste et carte avec mini-cartes synchronisées, alertes. Lieux : bars, pubs, cafés, théâtres & cinés, salles de concert, boîtes, marchés ; filtres « Ouvert maintenant », terrasse, accessible ; liste par distance et carte. |
| **Fiche lieu** | Ouvert/fermé en direct, horaires de la semaine, terrasse, PMR, bières artisanales, musique live, happy hour, itinéraire, site, téléphone, événements « à l'affiche ici », lieux juste à côté, lien pour corriger sur OpenStreetMap. |
| **Filtres** | Date, heure, distance, prix/gratuit, catégories, accès PMR, phrase-résumé et compteur de résultats en direct. |
| **Fiche event** | Infos, bloc social avant la description, appels ouverts, participants, carte du lieu, itinéraire, ajout au calendrier (.ics), partage, signalement, 3 actions : ♡ Envie / 👋 Qui vient ? / J'y vais ✓. |
| **Appel ouvert** | Composer l'appel, choisir l'audience, recevoir des réponses, accepter → conversation de groupe autour de l'event. |
| **Agenda** | À venir (liste ou calendrier), Envies, Historique avec stats, notation et ajout des personnes rencontrées. |
| **Messages** | Conversations solo / groupe / event, demandes (Buddy, invitation de groupe, nouvelle conversation), annuaire Buddies & groupes. |
| **Groupes** | Création en 3 étapes, agenda partagé, proposition d'event au groupe, paramètres (nom, icône, sourdine, membres, quitter). |
| **Profil** | Profil public, modification, visibilité (toggles, qui peut me contacter, exceptions par event, personnes masquées), paramètres (mode sombre, texte agrandi, notifications, alertes, organisateurs suivis), FAQ & sécurité. |
| **Organisateurs** | Publier un event (gratuit), suivre un organisateur. |

## Lancer en local

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # tests de la logique de recherche et de la collecte
npm run ingest    # récupère les vrais événements dans public/data/events.json
npm run build     # version de production dans dist/
```

## Mise en ligne

Le workflow `.github/workflows/deploy.yml` publie automatiquement l'app sur **GitHub Pages** à chaque push sur `main`.
Une seule fois : dans le dépôt GitHub → *Settings* → *Pages* → *Source* : **GitHub Actions**.
L'app sera alors accessible sur `https://yoannpaugam.github.io/buddy-design/`.

## Technique

- React 18 + TypeScript + Vite, routage par hash (compatible hébergement statique)
- PWA (vite-plugin-pwa) : installable, fonctionne hors ligne après la première visite
- Carte : Leaflet + tuiles OpenStreetMap / CARTO
- État de l'app : `src/store/` (persisté dans le navigateur). Les réponses des autres membres sont simulées pour la démo.
- Collecte : `scripts/ingest/` — export JSON de l'API Opendatasoft de Nantes Métropole (sans clé), conversion vers le modèle de l'app (heure de Paris, prix, accessibilité PMR, statut annulé/complet/reporté, 12 catégories), géocodage des adresses manquantes via l'API Adresse de l'IGN, dédoublonnage entre sources, garde-fou si la collecte chute.
- Lieux : `scripts/ingest/osm.mjs` — requête Overpass (OpenStreetMap) sur Nantes Métropole et ses abords, adresses complétées par géocodage inverse (IGN), marchés convertis en dates récurrentes sur 3 semaines à partir de leurs horaires. Les horaires sont lus par `src/lib/openingHours.mjs`, partagé entre la collecte et l'app ; un format non compris n'est jamais deviné.
- OpenAgenda : `scripts/ingest/openagenda.mjs`, actif seulement si le secret `OPENAGENDA_KEY` existe (voir ci-dessous).
- Données de l'app : `public/data/events.json` et `public/data/places.json` (générés, non versionnés) ; communauté fictive dans `src/store/community.ts`.
- Mise à jour planifiée : GitHub désactive les tâches planifiées d'un dépôt public après 60 jours sans activité ; un simple commit ou un « Run workflow » les relance.

### Activer OpenAgenda (brocantes, vide-greniers, associations)

1. Crée un compte gratuit sur [openagenda.com](https://openagenda.com/), puis récupère ta **clé API** dans les paramètres du compte.
2. Dans le dépôt GitHub → *Settings* → *Secrets and variables* → *Actions* → *New repository secret* : nom `OPENAGENDA_KEY`, valeur = la clé.
3. Lance *Actions* → *Déployer sur GitHub Pages* → *Run workflow*. Le rapport de collecte indique le nombre d'agendas et d'événements trouvés.

Pour suivre un agenda précis (un comité de quartier, une salle), ajoute la variable `OPENAGENDA_AGENDAS` avec ses identifiants séparés par des virgules.

### Pour passer à une vraie version multi-utilisateurs

Toute la logique passe par `useStore()` (`src/store/store.tsx`). Brancher un backend (Supabase, Firebase…) consiste à remplacer ces actions par des appels serveur : comptes, events, appels, messages en temps réel, notifications push.

## Documents

- [`docs/projet.md`](docs/projet.md) — vision produit, marché, design system, principes de design.
- Les maquettes HTML d'origine restent disponibles dans l'historique Git (commit `5e7fc51`).
