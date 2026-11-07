import type { Category, CategoryId, Person, Venue } from './types';

export const CATEGORIES: Category[] = [
  { id: 'concert', label: 'Concert', emoji: '🎵', color: '#2563EB' },
  { id: 'theatre', label: 'Spectacle', emoji: '🎭', color: '#8B5CF6' },
  { id: 'expo', label: 'Expo', emoji: '🖼️', color: '#DB2777' },
  { id: 'atelier', label: 'Atelier', emoji: '🛠️', color: '#0891B2' },
  { id: 'rencontre', label: 'Rencontre', emoji: '🎤', color: '#7C3AED' },
  { id: 'patrimoine', label: 'Visite', emoji: '🏛️', color: '#B45309' },
  { id: 'marche', label: 'Marché', emoji: '🌿', color: '#65A30D' },
  { id: 'cinema', label: 'Cinéma', emoji: '🎬', color: '#475569' },
  { id: 'danse', label: 'Danse', emoji: '💃', color: '#E11D48' },
  { id: 'jeux', label: 'Jeux', emoji: '🎲', color: '#16A34A' },
  { id: 'sport', label: 'Sport', emoji: '⚽', color: '#EA580C' },
  { id: 'fete', label: 'Fête', emoji: '🎉', color: '#F59E0B' },
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

// Registre des lieux, alimenté par public/data/events.json (voir store.tsx).
const VENUE_INDEX = new Map<string, Venue>();
export function registerVenues(list: Venue[]) {
  list.forEach((v) => VENUE_INDEX.set(v.id, v));
}
export const allVenues = (): Venue[] => [...VENUE_INDEX.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
export const venueById = (id: string): Venue =>
  VENUE_INDEX.get(id) ?? { id, name: 'Lieu à préciser', address: 'Nantes', lat: NANTES.lat, lng: NANTES.lng };

export const PEOPLE: Person[] = [
  { id: 'lea', name: 'Léa', color: '#8B5CF6', bio: "Impro, jazz et cafés en terrasse. Arrivée à Nantes il y a 6 mois.", interests: ['theatre', 'concert', 'jeux'], km: 2, online: true },
  { id: 'marc', name: 'Marc', color: '#FF5C57', bio: 'Toujours partant pour un concert ou une pétanque au bord de l’Erdre.', interests: ['concert', 'sport', 'theatre'], km: 1.4, online: true },
  { id: 'tom', name: 'Tom', color: '#22C55E', bio: 'Jeux de société, escape games, et tout ce qui se joue à plusieurs.', interests: ['jeux', 'atelier'], km: 3.1 },
  { id: 'sarah', name: 'Sarah', color: '#F59E0B', bio: 'Expos, marchés de créateurs et balades à vélo.', interests: ['expo', 'marche', 'sport'], km: 0.8, online: true },
  { id: 'romain', name: 'Romain', color: '#0EA5E9', bio: 'Comédien amateur. Je cherche des gens pour aller voir des spectacles.', interests: ['theatre', 'danse'], km: 2.7 },
  { id: 'antoine', name: 'Antoine', color: '#F97316', bio: 'Grand fan de Terraforming Mars. Organise des soirées jeux.', interests: ['jeux', 'patrimoine'], km: 4.2 },
  { id: 'nina', name: 'Nina', color: '#EC4899', bio: 'Danse folk, bals et festivals. On danse ?', interests: ['danse', 'fete', 'concert'], km: 1.9, online: true },
  { id: 'sami', name: 'Sami', color: '#14B8A6', bio: 'Photographe du dimanche, curieux de tout.', interests: ['expo', 'cinema', 'patrimoine'], km: 5.5 },
  { id: 'julie', name: 'Julie', color: '#6366F1', bio: 'Rando, plantes et ateliers DIY.', interests: ['marche', 'atelier', 'sport'], km: 3.6 },
  { id: 'karim', name: 'Karim', color: '#84CC16', bio: 'Nouveau à Nantes ! Je découvre la ville un event à la fois.', interests: ['concert', 'rencontre', 'fete'], km: 1.1 },
  { id: 'ines', name: 'Inès', color: '#A855F7', bio: 'Céramique, théâtre et brunchs.', interests: ['atelier', 'theatre', 'rencontre'], km: 2.2 },
  { id: 'hugo', name: 'Hugo', color: '#EF4444', bio: 'Reconstitutions historiques et visites nocturnes.', interests: ['patrimoine', 'expo'], km: 6.3 },
];

export const personById = (id: string): Person =>
  PEOPLE.find((p) => p.id === id) ?? { id, name: 'Quelqu’un', color: '#6B7280', bio: '', interests: [], km: 0 };
