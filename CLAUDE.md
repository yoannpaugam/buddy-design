# Buddy — contexte pour Claude et ses agents

Buddy est une app de sorties : elle rassemble les événements locaux, même confidentiels (impro dans un bar, vente de plantes, pétanque de quartier), et aide à trouver quelqu'un pour y aller (« Qui vient avec moi ? »). Ville pilote : **Nantes**. Porteur du projet : Yoann. Langue de l'app et des échanges : **français** (tutoiement dans l'app).

## État actuel
- v0.1 en ligne : https://yoannpaugam.github.io/buddy-design/ (GitHub Pages, déploiement automatique à chaque push sur `main` via `.github/workflows/deploy.yml`).
- App web mobile installable (PWA). Pas encore de serveur : données de démo dans `src/data/catalog.ts`, état persisté dans le navigateur (`src/store/`), réponses des autres membres simulées.
- Vision et design system : `docs/projet.md` (à lire avant toute décision produit ou design).

## Stack
React 18 + TypeScript strict + Vite 5, react-router (HashRouter), Leaflet/react-leaflet, vite-plugin-pwa, Vitest. Styles : `src/styles/global.css` (variables CSS, mode sombre via `[data-theme='dark']`). Pas de librairie UI externe.

## Organisation du code
- `src/data/` — types (`types.ts`) et catalogue (lieux, events, personnes ; dates relatives au jour courant).
- `src/store/` — `store.tsx` : toutes les actions de l'app via `useStore()` ; `seed.ts` : état initial. **C'est la frontière à remplacer par un backend.**
- `src/lib/logic.ts` — distance, dates, filtres (fonctions pures, testées dans `logic.test.ts`).
- `src/components/` — UI partagée (`ui.tsx`, `events.tsx`, `Icon.tsx`, `TabBar.tsx`).
- `src/pages/` — un fichier par espace (Home, Explore, EventDetail, Call, Agenda, Messages, Social, Profile…).

## Commandes
`npm run dev` · `npm test` · `npm run build` (doit passer avant tout commit).

## Principes produit (non négociables)
1. Le social avant la description : « Qui y va ? » passe avant le texte de l'event.
2. Trois actions sur un event : ♡ Envie · 👋 Qui vient ? · ✓ J'y vais.
3. Vie privée par défaut : jamais d'adresse exacte, distance approximative, visibilité réglable event par event.
4. Bienveillance et sécurité : charte, signalement, masquage, premiers rendez-vous en lieu public.
5. Mobile d'abord, accessible (contrastes, tailles de toucher ≥ 44 px, libellés ARIA).

## Règles de travail
- Travailler sur une branche et ouvrir une pull request ; ne pas pousser directement sur `main`.
- Garder `npm test` et `npm run build` verts.
- Écrire pour un porteur de projet non développeur : expliquer simplement ce qui change pour l'utilisateur.

## Équipe d'agents
Les agents spécialisés sont dans `.claude/agents/` : produit, design, front-end, back-end, sourcing d'events, QA, sécurité & RGPD, DevOps, croissance, confiance & modération, juridique & business.
