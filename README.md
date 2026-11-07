# Buddy

**Sors plus. Seul c'est moins drôle.**

Buddy est une app de sorties : elle rassemble les événements près de chez toi, même les petits (impro dans un bar, vente de plantes, tournoi de pétanque), et t'aide à trouver quelqu'un pour y aller avec toi.

Cette version est une **app web mobile** (PWA) : elle s'ouvre dans le navigateur du téléphone et s'installe sur l'écran d'accueil comme une vraie app. Les données sont de démonstration (Nantes) et restent stockées sur l'appareil.

## Ce que fait l'app

| Espace | Fonctionnalités |
|---|---|
| **Onboarding** | Bienvenue, concept, charte, ville + géolocalisation + rayon, goûts (min. 2), profil. Accès direct « profil démo ». |
| **Accueil** | Coup de cœur du soir, rubriques à défilement horizontal, appels ouverts, events de tes Buddies, catégories, « Proposer un event ». |
| **Explorer** | Recherche texte, dates rapides, catégories, vue **liste** et vue **carte** (OpenStreetMap) avec mini-cartes synchronisées, création d'alertes. |
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
npm test          # tests de la logique de recherche
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
- Données : `src/data/catalog.ts` (lieux, events, personnes). Les dates sont calculées à partir du jour courant.

### Pour passer à une vraie version multi-utilisateurs

Toute la logique passe par `useStore()` (`src/store/store.tsx`). Brancher un backend (Supabase, Firebase…) consiste à remplacer ces actions par des appels serveur : comptes, events, appels, messages en temps réel, notifications push.

## Documents

- [`docs/projet.md`](docs/projet.md) — vision produit, marché, design system, principes de design.
- Les maquettes HTML d'origine restent disponibles dans l'historique Git (commit `5e7fc51`).
