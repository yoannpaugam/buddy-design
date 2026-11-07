import type { Category, CategoryId, EventItem, Person, Venue } from './types';

export const CATEGORIES: Category[] = [
  { id: 'theatre', label: 'Théâtre', emoji: '🎭', color: '#8B5CF6' },
  { id: 'concert', label: 'Concert', emoji: '🎵', color: '#2563EB' },
  { id: 'jeux', label: 'Jeux', emoji: '🎲', color: '#16A34A' },
  { id: 'expo', label: 'Expo', emoji: '🖼️', color: '#DB2777' },
  { id: 'marche', label: 'Marché', emoji: '🌿', color: '#65A30D' },
  { id: 'sport', label: 'Sport', emoji: '⚽', color: '#EA580C' },
  { id: 'danse', label: 'Danse', emoji: '💃', color: '#E11D48' },
  { id: 'atelier', label: 'Atelier', emoji: '🛠️', color: '#0891B2' },
  { id: 'patrimoine', label: 'Histoire', emoji: '🏰', color: '#B45309' },
];

export const catById = (id: CategoryId): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;
export const IMAGES = {
  theatre: U('1503095396549-807759245b35'),
  jazz: U('1415201364774-f6f0bb35f28f'),
  plant: U('1485955900006-10f4d324d411'),
  games: U('1610890716171-6b1bb98ffd09'),
  histo: U('1533154683836-84ea7a0bc310'),
  expo: U('1544967082-d9d25d867d66'),
  dance: U('1547153760-18fc86324498'),
};

/** Position par défaut : place du Commerce, Nantes */
export const NANTES = { city: 'Nantes', lat: 47.213, lng: -1.559 };

export const CITIES = [
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Rezé', lat: 47.1833, lng: -1.55 },
  { name: 'Saint-Herblain', lat: 47.2122, lng: -1.6497 },
  { name: 'Orvault', lat: 47.2711, lng: -1.6225 },
  { name: 'Saint-Sébastien-sur-Loire', lat: 47.2083, lng: -1.5025 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778 },
  { name: 'Angers', lat: 47.4784, lng: -0.5632 },
];

export const VENUES: Venue[] = [
  { id: 'ferrailleur', name: 'Le Ferrailleur', address: '21 quai des Antilles, Nantes', lat: 47.2008, lng: -1.573 },
  { id: 'univers', name: "L'Univers", address: '16 rue Jean-Jacques Rousseau, Nantes', lat: 47.2121, lng: -1.5633 },
  { id: 'repaire', name: 'Le Repaire', address: '5 rue Kervégan, Nantes', lat: 47.2119, lng: -1.5551 },
  { id: 'bouffay', name: 'Place du Bouffay', address: 'Place du Bouffay, Nantes', lat: 47.2148, lng: -1.5533 },
  { id: 'chateau', name: 'Château des ducs de Bretagne', address: '4 place Marc Elder, Nantes', lat: 47.216, lng: -1.5497 },
  { id: 'plantes', name: 'Jardin des Plantes', address: 'Rue Stanislas Baudry, Nantes', lat: 47.2195, lng: -1.5425 },
  { id: 'lu', name: 'Le Lieu Unique', address: '2 rue de la Biscuiterie, Nantes', lat: 47.2155, lng: -1.545 },
  { id: 'proce', name: 'Parc de Procé', address: 'Boulevard des Anglais, Nantes', lat: 47.224, lng: -1.586 },
  { id: 'stereolux', name: 'Stereolux', address: '4 boulevard Léon Bureau, Nantes', lat: 47.205, lng: -1.564 },
  { id: 'talensac', name: 'Marché de Talensac', address: 'Rue Talensac, Nantes', lat: 47.2225, lng: -1.5585 },
  { id: 'royale', name: 'Place Royale', address: 'Place Royale, Nantes', lat: 47.2135, lng: -1.559 },
  { id: 'versailles', name: 'Île de Versailles', address: 'Quai de Versailles, Nantes', lat: 47.226, lng: -1.553 },
  { id: 'arts', name: "Musée d'arts de Nantes", address: '10 rue Georges Clemenceau, Nantes', lat: 47.219, lng: -1.545 },
  { id: 'galeries', name: 'Quartier Bouffay — galeries', address: 'Rue de la Juiverie, Nantes', lat: 47.2139, lng: -1.5521 },
  { id: 'atelier', name: "L'Atelier du Coin", address: '12 rue Fouré, Nantes', lat: 47.2088, lng: -1.5452 },
  { id: 'loire', name: 'Bords de Loire — Trentemoult', address: 'Quai Marcel Boissard, Rezé', lat: 47.1936, lng: -1.5814 },
];

export const venueById = (id: string): Venue => VENUES.find((v) => v.id === id) ?? VENUES[0];

export const PEOPLE: Person[] = [
  { id: 'lea', name: 'Léa', color: '#8B5CF6', bio: "Impro, jazz et cafés en terrasse. Arrivée à Nantes il y a 6 mois.", interests: ['theatre', 'concert', 'jeux'], km: 2, online: true },
  { id: 'marc', name: 'Marc', color: '#FF5C57', bio: 'Toujours partant pour un concert ou une pétanque au bord de l’Erdre.', interests: ['concert', 'sport', 'theatre'], km: 1.4, online: true },
  { id: 'tom', name: 'Tom', color: '#22C55E', bio: 'Jeux de société, escape games, et tout ce qui se joue à plusieurs.', interests: ['jeux', 'atelier'], km: 3.1 },
  { id: 'sarah', name: 'Sarah', color: '#F59E0B', bio: 'Expos, marchés de créateurs et balades à vélo.', interests: ['expo', 'marche', 'sport'], km: 0.8, online: true },
  { id: 'romain', name: 'Romain', color: '#0EA5E9', bio: 'Comédien amateur. Je cherche des gens pour aller voir des spectacles.', interests: ['theatre', 'danse'], km: 2.7 },
  { id: 'antoine', name: 'Antoine', color: '#F97316', bio: 'Grand fan de Terraforming Mars. Organise des soirées jeux.', interests: ['jeux', 'patrimoine'], km: 4.2 },
  { id: 'nina', name: 'Nina', color: '#EC4899', bio: 'Danse folk, bals et festivals. On danse ?', interests: ['danse', 'concert', 'jeux'], km: 1.9, online: true },
  { id: 'sami', name: 'Sami', color: '#14B8A6', bio: 'Photographe du dimanche, curieux de tout.', interests: ['expo', 'patrimoine', 'jeux'], km: 5.5 },
  { id: 'julie', name: 'Julie', color: '#6366F1', bio: 'Rando, plantes et ateliers DIY.', interests: ['marche', 'atelier', 'sport'], km: 3.6 },
  { id: 'karim', name: 'Karim', color: '#84CC16', bio: 'Nouveau à Nantes ! Je découvre la ville un event à la fois.', interests: ['concert', 'expo', 'patrimoine'], km: 1.1 },
  { id: 'ines', name: 'Inès', color: '#A855F7', bio: 'Céramique, théâtre et brunchs.', interests: ['atelier', 'theatre', 'marche'], km: 2.2 },
  { id: 'hugo', name: 'Hugo', color: '#EF4444', bio: 'Reconstitutions historiques et visites nocturnes.', interests: ['patrimoine', 'expo'], km: 6.3 },
];

export const personById = (id: string): Person =>
  PEOPLE.find((p) => p.id === id) ?? { id, name: 'Quelqu’un', color: '#6B7280', bio: '', interests: [], km: 0 };

/** Construit une date ISO relative à aujourd'hui (jour + heure "HH:MM"). */
export function at(dayOffset: number, hm: string, base = new Date()): string {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, h, m, 0, 0);
  return d.toISOString();
}

interface Seed extends Omit<EventItem, 'start' | 'end'> {
  day: number;
  /** si défini, l'event tombe le prochain jour de semaine indiqué (0 = dimanche) */
  weekday?: number;
  from: string;
  to: string;
}

const SEEDS: Seed[] = [
  {
    id: 'impromptus', title: 'Les Impromptus du Jeudi', organizer: 'La Cie du Hasard', category: 'theatre',
    day: 2, weekday: 4, from: '20:30', to: '22:30', venueId: 'ferrailleur', price: 0, pmr: true, image: IMAGES.theatre,
    description: "Chaque semaine, la Cie du Hasard improvise à partir des mots du public. Deux équipes, un arbitre, zéro script. Entrée libre au chapeau, arrive tôt pour avoir une place près de la scène. Le bar reste ouvert après le spectacle.",
    capacity: 80, attendees: ['marc', 'lea', 'tom', 'romain'], attendeeCount: 8,
  },
  {
    id: 'jazz', title: 'Jazz Session — Duo Moreau & Fils', organizer: "L'Univers", category: 'concert',
    day: 0, from: '21:00', to: '23:30', venueId: 'univers', price: 8, pmr: false, image: IMAGES.jazz,
    description: "Le duo Moreau père et fils revisite les standards de Monk et Ellington, suivi d'une jam ouverte à tous les musiciens. Ambiance cave feutrée, places assises limitées.",
    capacity: 45, attendees: ['karim', 'nina'], attendeeCount: 14,
  },
  {
    id: 'jeux-coop', title: 'Soirée jeux coopératifs', organizer: 'Le Repaire', category: 'jeux',
    day: 3, from: '19:30', to: '23:00', venueId: 'repaire', price: 5, pmr: true, image: IMAGES.games,
    description: "Pandemic, Hanabi, The Crew… Des animateurs t'expliquent les règles et te placent à une table. Parfait pour venir seul·e : on mélange les joueurs. Une conso offerte avec l'entrée.",
    capacity: 40, attendees: ['antoine', 'tom', 'sami'], attendeeCount: 19,
  },
  {
    id: 'plantes', title: 'Vente de plantes — Racines', organizer: 'Association Racines', category: 'marche',
    day: 4, from: '10:00', to: '17:00', venueId: 'bouffay', price: 0, pmr: true, image: IMAGES.plant,
    description: "Boutures, plantes d'intérieur et conseils de rempotage par les bénévoles de Racines. Apporte tes propres boutures pour le troc ! Paiement en espèces conseillé.",
    attendees: ['sarah', 'julie', 'marc'], attendeeCount: 31,
  },
  {
    id: 'galeries', title: 'Nuit des galeries', organizer: 'Collectif Bouffay Arts', category: 'expo',
    day: 4, from: '18:00', to: '23:00', venueId: 'galeries', price: 0, pmr: false, image: IMAGES.expo,
    description: "Sept galeries du quartier ouvrent leurs portes jusqu'à 23h avec des artistes sur place. Parcours libre, plan distribué à l'entrée de chaque galerie.",
    attendees: ['sarah', 'sami', 'karim'], attendeeCount: 52,
  },
  {
    id: 'balfolk', title: 'Bal folk en plein air', organizer: 'Les Pieds Joyeux', category: 'danse',
    day: 5, from: '16:00', to: '21:00', venueId: 'versailles', price: 0, pmr: true, image: IMAGES.dance,
    description: "Initiation à 16h pour les débutants, puis bal avec musiciens live : cercles circassiens, scottishs, an-dro. Aucune expérience nécessaire, juste de bonnes chaussures.",
    attendees: ['nina', 'romain'], attendeeCount: 27,
  },
  {
    id: 'chateau-nuit', title: 'Visite nocturne du Château', organizer: 'Château des ducs de Bretagne', category: 'patrimoine',
    day: 6, from: '20:00', to: '22:00', venueId: 'chateau', price: 12, pmr: true, image: IMAGES.histo,
    description: "Une visite contée à la lanterne sur les remparts, avec des comédiens en costume qui font revivre Anne de Bretagne. Réservation conseillée, groupes de 25 personnes.",
    capacity: 25, attendees: ['hugo', 'karim'], attendeeCount: 18,
  },
  {
    id: 'petanque', title: 'Tournoi de pétanque de quartier', organizer: 'Comité des fêtes de Procé', category: 'sport',
    day: 5, from: '14:00', to: '19:00', venueId: 'proce', price: 3, pmr: true,
    description: "Doublettes formées sur place, tous niveaux. Buvette et crêpes au profit du comité. Viens avec tes boules ou emprunte-les sur place.",
    attendees: ['marc'], attendeeCount: 24,
  },
  {
    id: 'ceramique', title: 'Atelier céramique débutant', organizer: "L'Atelier du Coin", category: 'atelier',
    day: 1, from: '18:30', to: '21:00', venueId: 'atelier', price: 25, pmr: false,
    description: "Initiation au modelage et au tour en petit groupe de 8. Terre, outils et cuisson inclus : tu récupères ta pièce deux semaines plus tard.",
    capacity: 8, attendees: ['ines'], attendeeCount: 6,
  },
  {
    id: 'electro', title: 'Live électro — Nuit Résonance', organizer: 'Stereolux', category: 'concert',
    day: 6, from: '22:00', to: '03:00', venueId: 'stereolux', price: 18, pmr: true,
    description: "Trois artistes de la scène électronique nantaise, scénographie lumière immersive dans la grande salle.",
    attendees: ['nina'], attendeeCount: 340,
  },
  {
    id: 'talensac', title: 'Marché des créateurs', organizer: 'Les Halles de Talensac', category: 'marche',
    day: 7, from: '09:00', to: '14:00', venueId: 'talensac', price: 0, pmr: true,
    description: "Une trentaine de créateurs locaux — bijoux, céramique, sérigraphie — autour des halles. Café et viennoiseries sur place.",
    attendees: ['julie', 'ines'], attendeeCount: 64,
  },
  {
    id: 'impro-match', title: "Match d'impro — Nantes vs Rennes", organizer: 'Ligue d’impro nantaise', category: 'theatre',
    day: 8, from: '20:00', to: '22:30', venueId: 'lu', price: 10, pmr: true, image: IMAGES.theatre,
    description: "Le derby de l'impro est de retour au Lieu Unique. Le public vote avec des cartons, l'arbitre veille. Ambiance de stade garantie.",
    attendees: ['romain', 'lea'], attendeeCount: 120,
  },
  {
    id: 'quiz', title: 'Quiz musical au comptoir', organizer: "L'Univers", category: 'jeux',
    day: 1, from: '20:00', to: '22:30', venueId: 'univers', price: 0, pmr: false,
    description: "Équipes de 2 à 6, blind test et questions culture musicale. Si tu viens seul·e, on te trouve une équipe.",
    attendees: ['karim', 'tom'], attendeeCount: 22,
  },
  {
    id: 'expo-arts', title: 'Expo « Lumières du Nord »', organizer: "Musée d'arts de Nantes", category: 'expo',
    day: 0, from: '11:00', to: '19:00', venueId: 'arts', price: 8, pmr: true, image: IMAGES.expo,
    description: "Peintres scandinaves du XIXe siècle : 80 toiles sur la lumière des longues nuits d'été. Gratuit pour les moins de 26 ans.",
    attendees: ['sami', 'sarah'], attendeeCount: 90,
  },
  {
    id: 'velo', title: 'Balade vélo des bords de Loire', organizer: 'Vélocampus', category: 'sport',
    day: 7, from: '10:00', to: '13:00', venueId: 'loire', price: 0, pmr: false,
    description: "20 km à rythme tranquille jusqu'à Trentemoult, pause café au bord de l'eau. Prêt de vélos possible sur réservation.",
    attendees: ['sarah', 'julie'], attendeeCount: 15,
  },
  {
    id: 'reconstitution', title: 'Reconstitution médiévale', organizer: 'Les Compagnons de la Loire', category: 'patrimoine',
    day: 9, from: '11:00', to: '18:00', venueId: 'chateau', price: 0, pmr: true, image: IMAGES.histo,
    description: "Campement, forge, tir à l'arc et combats chorégraphiés dans les douves du château. Animations pour les enfants toute la journée.",
    attendees: ['hugo', 'antoine'], attendeeCount: 210,
  },
  {
    id: 'salsa', title: 'Soirée salsa — cours + social', organizer: 'Ritmo Nantes', category: 'danse',
    day: 2, from: '19:30', to: '00:00', venueId: 'royale', price: 7, pmr: false, image: IMAGES.dance,
    description: "Cours débutant d'une heure puis soirée dansante. Pas besoin de venir en couple, on tourne les partenaires.",
    attendees: ['nina', 'ines'], attendeeCount: 36,
  },
  // Passés — pour l'historique
  {
    id: 'past-concert', title: 'Concert acoustique au jardin', organizer: 'Jardin des Plantes', category: 'concert',
    day: -6, from: '18:00', to: '20:00', venueId: 'plantes', price: 0, pmr: true, image: IMAGES.jazz,
    description: 'Folk acoustique sous la grande serre.', attendees: ['marc', 'lea'], attendeeCount: 60,
  },
  {
    id: 'past-jeux', title: 'Tournoi Codenames', organizer: 'Le Repaire', category: 'jeux',
    day: -10, from: '20:00', to: '23:00', venueId: 'repaire', price: 4, pmr: true, image: IMAGES.games,
    description: 'Tournoi par équipes de 4.', attendees: ['tom', 'antoine'], attendeeCount: 32,
  },
  {
    id: 'past-plantes', title: 'Troc de boutures', organizer: 'Association Racines', category: 'marche',
    day: -14, from: '14:00', to: '17:00', venueId: 'bouffay', price: 0, pmr: true, image: IMAGES.plant,
    description: 'Troc de boutures entre voisins.', attendees: ['sarah'], attendeeCount: 25,
  },
];

export function buildEvents(base = new Date()): EventItem[] {
  return SEEDS.map(({ day: d0, weekday, from, to, ...rest }) => {
    // prochain jour de semaine voulu (au moins demain, pour garder un compte à rebours)
    const day = weekday === undefined ? d0 : ((weekday - base.getDay() + 7) % 7) || 7;
    const endDay = to < from ? day + 1 : day;
    return { ...rest, start: at(day, from, base), end: at(endDay, to, base) };
  });
}
