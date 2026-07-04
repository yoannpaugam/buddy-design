# Buddy — Document de projet complet
*Synthèse de la session de conception UI/UX*

---

## 1. Contexte & Problématique

### Le problème identifié
Quand un individu veut sortir de chez lui et faire une activité, il doit :
- Savoir ce qu'il veut faire
- Trouver les endroits / organismes où le faire
- Trouver le prix, la localisation, la date, l'horaire

**Le vrai problème** : un concert, une vente de plantes, un tournoi de pétanque local, du théâtre d'impro dans un bar ne peuvent pas être trouvés par une simple recherche. Il faut suivre la page Facebook ou Instagram du bar, de l'association, de l'organisateur. Cela provoque de la frustration et n'incite pas à sortir de sa zone de confort.

### La solution imaginée
Un **moteur de recherche d'événements** en tout genre qui offre la possibilité de filtrer par :
- Prix
- Localisation / éloignement
- Type d'événement
- Horaire, date, durée
- Accès PMR

---

## 2. User Stories

> En tant que jeune étudiant / jeune actif / couple parental / retraité / nouvel arrivant dans une ville / touriste, je veux pouvoir me dire : "J'ai envie de sortir entre 15h et 22h à Nantes, montre-moi tous les événements prévus dans un rayon de 5 km, à moins de 30 euros l'entrée. J'aime le théâtre, les concerts, les jeux de société, et les reconstitutions historiques."

---

## 3. Vision Produit — Les 3 phases

### Phase 1 — Annuaire d'événements (MVP)
Un équivalent Facebook Events mais **mieux exécuté** :
- Recherche filtrée intuitive
- Affichage en liste, par géolocalisation, ou les deux
- Possibilité de mettre en favoris
- Créer des alertes
- Suivre des organisateurs d'événements
- Ajouter des events à son agenda
- Conserver un historique de ses sorties

### Phase 2 — Outil de découverte
- Découvrir des events qu'on n'aurait jamais trouvés autrement
- Rencontrer des gens via l'appel ouvert ("Qui vient avec moi ?")
- Former des groupes informels autour d'events

### Phase 3 — Réseau social de sorties (vision ultime)
Un mélange entre **Meetup + Discord + Doodle** :
- Création de groupes
- Canaux de discussion
- Organisation logistique d'events
- Gestion de cagnotte, "qui ramène quoi", Doodle intégré

---

## 4. Analyse Marché

### Positionnement concurrentiel

| | Buddy | Facebook Events | Meetup | Shotgun | Fever |
|---|---|---|---|---|---|
| Découverte hyperlocale | ✅ | ⚠️ | ⚠️ | ❌ | ✅ |
| Petits events invisibles | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Appel ouvert / "j'y vais" | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agenda partagé | ✅ | ❌ | ❌ | ❌ | ❌ |
| Réseau social léger | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Events gratuits / associatifs | ✅ | ✅ | ❌ | ❌ | ❌ |

### Pourquoi Meetup peine à survivre
- Ils ont rendu le service payant (~30$/an) → fuite massive vers Facebook Groups et Discord
- Le réseau social ne s'est jamais vraiment développé
- Les gens venaient pour l'event, pas pour la communauté permanente
- Discord a gagné la couche "communauté persistante" sans events physiques
- **Le créneau existe** mais l'ordre d'attaque compte énormément

### Modèle économique envisagé
Freemium côté organisateurs :

| Offre | Prix | Ce qu'ils ont |
|---|---|---|
| Publication gratuite | 0€ | Visibilité de base |
| Publication boostée | 5–15€ | Mise en avant, alertes aux utilisateurs matchants |
| Abonnement organisateur | 20–50€/mois | Dashboard stats, suivi audience, export contacts |
| Billetterie intégrée | Commission 2–4% | Si gestion de la vente de billets |

---

## 5. Le Flywheel Buddy

```
Découverte d'event → Rencontre de gens → Groupe qui se forme → Création d'events propres
       ↑                                                                    |
       └────────────────────────────────────────────────────────────────────┘
```

Chaque étape alimente la suivante. C'est ce qui manque à tous les concurrents.

### Le moment "aha" du produit
1. **Découvrir** un event qu'on n'aurait jamais trouvé autrement
2. **Rencontrer** des gens à cet event (via l'appel ouvert)
3. **Former un groupe** avec eux (conversation privée + agenda partagé)
4. **Organiser leurs propres events** ensemble

### L'atome central
Ce n'est pas l'événement — c'est **la relation entre deux personnes qui se retrouvent au même endroit**. L'event est le prétexte. Le groupe des 10 est le produit.

---

## 6. Les 3 Espaces de l'App

| Espace | Fonction | Analogie |
|---|---|---|
| **Le dehors** | Découverte, exploration, carte, filtres | Comme une ville qu'on parcourt |
| **Le dedans** | Groupe, agenda partagé, conversation | Comme un appartement commun |
| **L'atelier** | Organisation, logistique, cagnotte, Doodle | Comme une salle de réunion |

---

## 7. Identité de Marque

### Nom
**Buddy** — "ton pote qui t'accompagne partout, avec qui tu fais les 400 coups"

### Taglines candidates
- *"Sors plus. Seul c'est moins drôle."*
- *"Ce soir, t'as un plan."*
- *"Trouve l'event. Trouve les gens."*

### Direction visuelle
- **Références** : chaleur et lisibilité d'Airbnb + énergie communautaire de Strava/BeReal
- **Émotion** : chaleureux, urbain, spontané — pas corporate, pas froid

### Design Tokens

```css
--coral:       #FF5C57   /* CTA, accents, brand */
--coral-light: #FFE8E7   /* Backgrounds secondaires, tags */
--coral-mid:   #FFB3B1   /* Bordures actives */
--night:       #1A1A2E   /* Texte principal, headers sombres */
--warm-white:  #F7F4F0   /* Background app */
--gray:        #6B7280   /* Texte secondaire, métadonnées */
--gray-light:  #E5E2DE   /* Bordures, séparateurs */
--white:       #FFFFFF   /* Cards, inputs */
--purple:      #8B5CF6   /* Accent secondaire */
--green:       #22C55E   /* Confirmé, succès */
--amber:       #F59E0B   /* Peut-être, avertissement */
```

### Typographie
- **Display / Titres** : Syne (700, 800) — géométrique, moderne, caractère urbain
- **Body / UI** : Inter (400, 500, 600) — lisible, neutre, efficace

### Signature visuelle
Les cards d'events ont un **coin supérieur gauche découpé en diagonale légère** (`clip-path: polygon(18px 0%, 100% 0%...)`). Rappelle visuellement un ticket de concert. Discret mais cohérent.

---

## 8. Architecture de l'Information

### Navigation principale — 4 onglets

```
🔍 Explorer    📅 Agenda    👥 Buddy    👤 Moi
```

| Onglet | Intention | Contenu core |
|---|---|---|
| **Explorer** | "Qu'est-ce qui se passe ?" | Recherche, filtres, carte, liste d'events |
| **Agenda** | "Mes plans, mes envies" | Events sauvegardés, inscrits, historique |
| **Buddy** | "Avec qui je sors ?" | Appels ouverts, contacts, agendas partagés |
| **Moi** | "Mon profil, mes préférences" | Goûts, notifs, paramètres, historique |

---

## 9. Inventaire des Écrans Maquettés

### buddy-explorer.html
**Écran d'accueil — Explorer**
- Header avec logo Buddy + cloche notifs
- Barre de recherche avec bouton filtre corail
- Strip contextuel : localisation + sélecteur date (Ce soir / Demain / Week-end)
- Chips de filtrage horizontal (Théâtre, Concert, Jeux, Expo, Marché, Sport)
- Liste de cards d'events avec forme ticket (coin coupé)
- Card avec **call banner** intégré (Léa cherche quelqu'un)
- Deux CTA distincts par card : "J'y vais ✓" et "👋 Qui vient ?"

### buddy-search.html
**Recherche filtrée**
- Header sombre (rupture visuelle = mode "configuration")
- Barre de recherche avec champ texte actif
- **Phrase résumé Buddy** : *"Ce soir · entre 15h et 22h · dans un rayon de 5 km · moins de 20 €"*
- Filtres : Date (pills), Heure (plage horaire), Distance (slider), Prix (toggle + range), Catégories (grille 3×3)
- CTA sticky avec **compteur de résultats en temps réel** ("Voir les résultats · 12")

### buddy-event.html
**Fiche Event**
- Hero plein largeur avec emoji géant + overlay sombre
- Badge catégorie + prix en overlay sur le hero
- Boutons retour / partager / favoris sur le hero
- Grille info 2×2 : Date, Heure, Lieu, Distance
- **Bloc social en priorité** (avant la description) : qui y va + appels ouverts
- Proximité contextualisée : "Léa · 2 km de toi"
- Description courte + "Voir plus"
- Mini-carte avec adresse
- CTA sticky 3 actions : ♡ Envie / 👋 Qui vient ? / J'y vais ✓

### buddy-appel.html
**Flow Appel Ouvert (composer + réponse)**
- **Écran 1** : Composer l'appel
  - Récap mini de l'event
  - Zone de texte avec compteur de caractères
  - Phrases rapides suggérées (quick pills)
  - Sélecteur d'audience : Tous / Mes Buddies / Ma ville
  - CTA "Lancer l'appel →"
- **Écran 2** : Réponse reçue + chat
  - Push notification simulée
  - Thread de conversation léger
  - **Pont WhatsApp** : "Continuer sur WhatsApp ?" en bannière verte

### buddy-flow-appel.html
**Flow Appel Ouvert Complet (4 étapes)**
- **Écran 1** : Réponses reçues — 3 postulants avec message, tags, actions (Ignorer / Répondre)
- **Écran 2** : Chat groupé — 4 participants, bannière event, messages, bouton "+ Ajouter Sarah"
- **Écran 3** : Après l'event — archivage automatique, notation par emoji, conversation dans l'historique
- **Écran 4** : Ajouter des Buddies — suggestions contextuelles des personnes rencontrées ce soir

### buddy-agenda.html
**Agenda Perso (3 onglets interactifs)**
- **Onglet "À venir"** : Card "Next up" sombre mise en avant, events groupés par jour avec heure + lieu + statut (J'y vais / Envie), aperçu de l'historique
- **Onglet "Envies"** : Cards visuelles avec image, badge "bientôt complet", actions Retirer / J'y vais
- **Onglet "Historique"** : 3 stats (sorties, Buddies rencontrés, catégories), events passés avec companions et notation étoiles

### buddy-agenda-partage.html
**Agenda Partagé entre Buddies**
- Sélecteur de groupe en haut (Bande du Jeudi / Jeux & Café)
- Bannière de confidentialité : "Seuls les events que tu marques visibles apparaissent ici"
- Strip membres avec bouton chat direct
- **Sync card** : "Vous êtes 3 disponibles ce week-end — proposer un event ?"
- Events partagés avec breakdown "qui y va" : chips verts (confirmé) + ambre (peut-être) + "+ Inviter"

### buddy-onglet-buddy.html
**Onglet Buddy (3 onglets interactifs)**
- **Onglet "Mes Buddies"** : Section "En ligne maintenant" + liste complète avec goûts en commun, boutons chat + agenda
- **Onglet "Groupes"** : Cards groupe avec derniers messages, prochain event, suggestions
- **Onglet "Demandes"** : Demandes contextualisées (même event, appel ouvert) avec goûts en commun

### buddy-profil.html
**Profil & Paramètres de Visibilité (2 écrans)**
- **Écran 1** : Profil public
  - Hero sombre avec avatar, nom, ville, ancienneté membre
  - Stats : Sorties, Buddies, Groupes, Note moyenne
  - Bandeau "voici ce que les autres voient"
  - Bio, Centres d'intérêt (pills colorés), Dernières sorties (scroll horizontal)
  - Aperçu visibilité avec lien "Gérer →"
- **Écran 2** : Paramètres de visibilité
  - Toggles : profil visible, apparaître sur les events, afficher ville, masquer "actif il y a..."
  - Qui peut me contacter : Tout le monde / Participants au même event / Buddies uniquement
  - **Exceptions par event** : masqué sur Jazz Session, Buddies seulement sur Marché Racines
  - Personnes masquées + bouton "Débloquer"

### buddy-onboarding.html
**Onboarding (4 écrans)**
- **Écran 1** : Bienvenue — fond sombre, logo grand, 3 promesses, CTA "Créer mon compte"
- **Écran 2** : Ma ville — recherche ville, géolocalisation GPS, slider rayon par défaut (5 km)
- **Écran 3** : Mes goûts — grille 3×3 de catégories, minimum 2 requis, compteur en temps réel
- **Écran 4** : Mon profil — avatar + prénom + bio courte, note confidentialité en vert, CTA "C'est parti 🎉"

### buddy-map.html
**Vue Carte avec Mini-Cards (2 états)**
- **État 1** : Carte au repos — 5 pins, mini-cards scrollables en bas, compteur "12 events ce soir"
- **État 2** : Card sélectionnée
  - Pin actif en corail avec animation de pulsation
  - Autres pins à 50% d'opacité
  - Tracé pointillé corail entre position utilisateur et l'event
  - Mini-card active avec bordure corail
  - Map légèrement re-centrée sur le pin actif
- Barre de recherche flottante avec filtre actif
- Chips de catégories flottantes
- Boutons de zoom et recentrage

---

## 10. Flows Utilisateur Couverts

### Flow 1 — Découverte et inscription à un event
Explorer → Filtres → Résultats → Fiche Event → J'y vais ✓ → Agenda

### Flow 2 — Lancer un appel ouvert
Fiche Event → "Qui vient ?" → Composer appel → Audience → Publier → Réponses reçues → Chat → Archiver

### Flow 3 — Rejoindre l'appel de quelqu'un
Explorer → Fiche Event → Call banner → Répondre → Chat léger → WhatsApp

### Flow 4 — Recherche par carte
Explorer → Vue Carte → Scroll mini-cards → Pin actif → Fiche Event

### Flow 5 — Onboarding
Bienvenue → Ma ville → Mes goûts → Mon profil → Explorer

### Flow 6 — Gestion de l'agenda
Agenda (À venir) → Détail event → Agenda partagé → Synchronisation groupe

### Flow 7 — Après un event
Notification archivage → Notation → Ajouter Buddies rencontrés

### Flow 8 — Gestion de la visibilité
Profil → Gérer visibilité → Exceptions par event → Masquer une personne

---

## 11. Flows à Maquetter (restants)

- [ ] Page "Voir tous" de la fiche event (liste complète des participants)
- [ ] Créer un groupe de Buddies
- [ ] Rechercher un Buddy
- [ ] Notifications center (toutes les notifs)
- [ ] Paramètres complets (compte, notifications, préférences)

---

## 12. Décisions de Design Importantes

### Principe 1 — Le social avant la description
Sur la fiche event, le bloc "Qui y va ?" apparaît **avant** la description texte. Chez Buddy, les gens passent avant le contenu.

### Principe 2 — La proximité réduit la friction
Afficher "Léa · 2 km de toi" sur un appel ouvert réduit l'anxiété sociale de répondre à un inconnu.

### Principe 3 — Headers sombres = modes "concentrés"
Le header sombre sur la recherche filtrée et sur les profils crée une rupture visuelle intentionnelle : tu es sorti du mode "exploration" pour entrer dans un mode "action".

### Principe 4 — Trois CTA distincts sur la fiche event
- ♡ **Envie** (intention faible, pas d'engagement)
- 👋 **Qui vient ?** (intention sociale, cherche compagnie)
- ✓ **J'y vais** (engagement ferme)

Ces trois états correspondent à trois moments psychologiques différents dans la décision de sortir.

### Principe 5 — Confidentialité explicite et rassurante
Chaque point de friction potentiel sur la vie privée (agenda partagé, visibilité sur les events) est accompagné d'une bannière explicative. L'utilisateur sait exactement ce qui est visible et par qui.

### Principe 6 — Opt-in progressif
Rien n'est imposé : montrer qu'on va à un event, apparaître dans "Qui y va ?", partager son agenda — tout est opt-in et désactivable event par event.

---

## 13. Notes Techniques

### Environnement
- Maquettes en HTML/CSS statique, sans framework
- Polices Google Fonts : Syne + Inter
- Aucune dépendance externe
- Compatibles navigateur moderne

### Pour Figma
- Utiliser le plugin **html.to.design** pour importer les maquettes HTML en frames Figma
- Ou ouvrir chaque fichier HTML dans Chrome + capturer via le plugin Figma

### Pour le développement futur
- Composants React recommandés : shadcn/ui pour la base, Tailwind CSS pour le style
- Cartes : Mapbox ou Google Maps JS API (scroll sync via `map.panTo()` sur l'événement de scroll)
- La synchronisation scroll carte ↔ pins se fait via un IntersectionObserver sur les mini-cards

---

*Document généré lors de la session de conception avec Claude — Juillet 2026*
