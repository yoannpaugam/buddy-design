export type CategoryId =
  | 'theatre'
  | 'concert'
  | 'jeux'
  | 'expo'
  | 'marche'
  | 'sport'
  | 'danse'
  | 'atelier'
  | 'patrimoine'
  | 'cinema'
  | 'rencontre'
  | 'fete';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface EventItem {
  id: string;
  title: string;
  organizer: string;
  category: CategoryId;
  /** ISO date-time de début */
  start: string;
  /** ISO date-time de fin */
  end: string;
  venueId: string;
  /** en euros, 0 = gratuit, null = payant (montant non communiqué) */
  price: number | null;
  /** texte d'origine sur les tarifs */
  priceText?: string;
  pmr: boolean;
  image?: string;
  description: string;
  capacity?: number;
  /** personnes (ids) qui y vont, hors utilisateur */
  attendees: string[];
  /** nombre total affiché (inclut des inconnus) */
  attendeeCount: number;
  /** créé par l'utilisateur via "Proposer un event" */
  createdByMe?: boolean;
  /** identifiant commun aux différentes dates d'un même événement */
  seriesId?: string;
  /** pas d'horaire précis : toute la journée */
  allDay?: boolean;
  status?: 'cancelled' | 'postponed' | 'full';
  /** adapté aux enfants de moins de 12 ans */
  kids?: boolean;
  /** source des données (voir DataSource) */
  source?: string;
  sourceUrl?: string;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  license: string;
  updatedAt: string | null;
  count: number;
}

/** Fichier public/data/events.json produit par scripts/ingest/run.mjs */
export interface EventFeed {
  generatedAt: string;
  window: { from: string; to: string };
  sources: DataSource[];
  venues: Venue[];
  events: EventItem[];
  stale?: boolean;
}

export interface Person {
  id: string;
  name: string;
  color: string;
  bio: string;
  interests: CategoryId[];
  /** distance approximative à l'utilisateur */
  km: number;
  online?: boolean;
}

export type EventStatus = 'envie' | 'going';

export interface Call {
  id: string;
  eventId: string;
  authorId: string; // 'me' pour l'utilisateur
  text: string;
  audience: 'all' | 'buddies' | 'city';
  createdAt: string;
  /** réponses (ids personnes) */
  responders: { personId: string; text: string; status: 'pending' | 'accepted' | 'ignored' }[];
}

export interface Message {
  id: string;
  authorId: string; // 'me' | personId | 'system'
  text: string;
  at: string;
}

export type ConversationKind = 'solo' | 'group' | 'event';

export interface Conversation {
  id: string;
  kind: ConversationKind;
  title?: string;
  memberIds: string[];
  eventId?: string;
  groupId?: string;
  messages: Message[];
  unread: number;
  archived?: boolean;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
  description: string;
  conversationId: string;
  muted?: boolean;
  /** events marqués visibles dans l'agenda partagé */
  sharedEventIds: string[];
}

export type RequestKind = 'buddy' | 'group' | 'conversation';

export interface BuddyRequest {
  id: string;
  kind: RequestKind;
  personId: string;
  context: string;
  groupName?: string;
  message?: string;
}

export interface Notification {
  id: string;
  kind: 'social' | 'event' | 'agenda';
  icon: string;
  text: string;
  at: string;
  read: boolean;
  link?: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  city: string;
  lat: number;
  lng: number;
  radius: number;
  interests: CategoryId[];
  color: string;
  memberSince: string;
}

export interface Visibility {
  profileVisible: boolean;
  showOnEvents: boolean;
  showCity: boolean;
  hideLastSeen: boolean;
  contact: 'all' | 'same-event' | 'buddies';
  /** exceptions par event : hidden | buddies */
  eventExceptions: Record<string, 'hidden' | 'buddies'>;
  blocked: string[];
}

export interface Settings {
  dark: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  notifCalls: boolean;
  notifMessages: boolean;
  notifReminders: boolean;
  notifSuggestions: boolean;
}

export interface Filters {
  query: string;
  date: 'all' | 'today' | 'tomorrow' | 'weekend' | 'week';
  hourFrom: number;
  hourTo: number;
  maxKm: number;
  freeOnly: boolean;
  maxPrice: number;
  categories: CategoryId[];
  pmr: boolean;
}

export interface SavedAlert {
  id: string;
  label: string;
  filters: Filters;
}
