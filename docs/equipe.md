# Buddy — Compétences nécessaires et équipe d'agents

Chaque compétence est couverte par un agent Claude défini dans `.claude/agents/`. Pour en utiliser un, il suffit de le demander à Claude dans une session sur ce dépôt (« demande à l'agent curateur-events de trouver 30 events à Nantes ce mois-ci »).

| Domaine | Compétences clés | Agent |
|---|---|---|
| Produit | Vision, roadmap, priorisation, user stories, specs, indicateurs | `chef-de-produit` |
| Design | UX mobile, UI, design system, microcopie, accessibilité, mode sombre | `designer-ux-ui` |
| Front-end | React, TypeScript, PWA, carte, performances | `dev-frontend` |
| Back-end | Base de données, authentification, droits d'accès, temps réel, notifications push | `dev-backend` |
| Données events | Sourcing, open data, normalisation, dédoublonnage, relation organisateurs | `curateur-events` |
| Qualité | Tests unitaires et de bout en bout, régressions, accessibilité | `testeur-qa` |
| Sécurité & RGPD | Audit sécurité, protection des données, politique de confidentialité | `securite-rgpd` |
| Infrastructure | CI/CD, hébergement, domaine, surveillance, sauvegardes | `devops` |
| Croissance | Lancement local, partenariats, réseaux sociaux, recrutement de testeurs, mesure | `croissance-lancement` |
| Confiance & modération | Charte, signalement, sécurité des rencontres, réponse aux incidents | `confiance-moderation` |
| Juridique & business | Modèle économique, prévisionnel, statut, CGU, marque, financement | `juridique-business` |

## Comment ils travaillent ensemble (exemple : passer à un vrai serveur)
1. `chef-de-produit` fixe le périmètre de la v0.2 et les critères d'acceptation.
2. `securite-rgpd` et `confiance-moderation` posent les règles de confidentialité et de sécurité.
3. `dev-backend` crée la base et branche l'app ; `dev-frontend` adapte les écrans (connexion, états de chargement).
4. `testeur-qa` vérifie la pull request ; `devops` gère les clés et la mise en ligne.
5. En parallèle, `curateur-events` remplit la base avec de vrais events nantais et `croissance-lancement` prépare les premiers testeurs.
