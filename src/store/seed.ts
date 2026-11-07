import type {
  BuddyRequest, Call, Conversation, Filters, Group, Notification, Settings, UserProfile, Visibility, EventStatus, EventItem, SavedAlert,
} from '../data/types';
import { NANTES } from '../data/catalog';
import { DEFAULT_FILTERS } from '../lib/logic';

export interface AppState {
  version: number;
  onboarded: boolean;
  user: UserProfile;
  statuses: Record<string, EventStatus>;
  ratings: Record<string, number>;
  /** personnes avec qui on va à un event */
  companions: Record<string, string[]>;
  customEvents: EventItem[];
  calls: Call[];
  conversations: Conversation[];
  buddies: string[];
  groups: Group[];
  requests: BuddyRequest[];
  sentRequests: string[];
  notifications: Notification[];
  visibility: Visibility;
  settings: Settings;
  filters: Filters;
  alerts: SavedAlert[];
  followed: string[];
}

export const STATE_VERSION = 1;

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export function emptyState(): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    user: {
      name: '', bio: '', city: NANTES.city, lat: NANTES.lat, lng: NANTES.lng, radius: 5, interests: [],
      color: '#FF5C57', memberSince: new Date().toISOString(),
    },
    statuses: {}, ratings: {}, companions: {}, customEvents: [], calls: [], conversations: [], buddies: [], groups: [],
    requests: [], sentRequests: [], notifications: [],
    visibility: {
      profileVisible: true, showOnEvents: true, showCity: true, hideLastSeen: false, contact: 'same-event',
      eventExceptions: {}, blocked: [],
    },
    settings: {
      dark: false, largeText: false, reduceMotion: false,
      notifCalls: true, notifMessages: true, notifReminders: true, notifSuggestions: false,
    },
    filters: { ...DEFAULT_FILTERS },
    alerts: [],
    followed: [],
  };
}

/** Vie sociale de démonstration, ajoutée à la fin de l'onboarding. */
export function socialSeed(): Pick<AppState,
  'statuses' | 'ratings' | 'companions' | 'calls' | 'conversations' | 'buddies' | 'groups' | 'requests' | 'notifications' | 'followed'> {
  const conversations: Conversation[] = [
    {
      id: 'c-bande', kind: 'group', groupId: 'g-bande', memberIds: ['marc', 'lea', 'tom'], unread: 3,
      messages: [
        { id: 'm1', authorId: 'marc', text: 'Qui est chaud pour les Impromptus jeudi ?', at: ago(190) },
        { id: 'm2', authorId: 'tom', text: 'Moi ! Je réserve une table au bar après ?', at: ago(150) },
        { id: 'm3', authorId: 'lea', text: 'Grave. On se retrouve directement là-bas vers 20h ?', at: ago(42) },
      ],
    },
    {
      id: 'c-lea', kind: 'solo', memberIds: ['lea'], unread: 0,
      messages: [
        { id: 'm4', authorId: 'lea', text: 'Merci pour hier, c’était trop bien 😄', at: ago(80) },
        { id: 'm5', authorId: 'me', text: 'Carrément ! J’habite à 5 min d’Erdre, on refait ça vite 🙌', at: ago(39) },
      ],
    },
    {
      id: 'c-impro', kind: 'event', eventId: 'impromptus', title: 'Impromptus du Jeudi 🎭', memberIds: ['romain', 'lea'], unread: 1,
      messages: [
        { id: 'm6', authorId: 'system', text: 'Conversation créée autour de l’appel ouvert « Les Impromptus du Jeudi ».', at: ago(1500) },
        { id: 'm7', authorId: 'romain', text: 'Je vous partage mon itinéraire, je pars de Commerce à 20h10.', at: ago(1400) },
      ],
    },
    {
      id: 'c-jeux', kind: 'group', groupId: 'g-jeux', memberIds: ['antoine', 'nina', 'sami'], unread: 0,
      messages: [
        { id: 'm8', authorId: 'antoine', text: 'Soirée Terraforming Mars samedi chez moi ?', at: ago(60 * 24 * 3) },
      ],
    },
    {
      id: 'c-marc', kind: 'solo', memberIds: ['marc'], unread: 0,
      messages: [
        { id: 'm9', authorId: 'marc', text: 'Tu viens à la vente de plantes ?', at: ago(60 * 24 * 4 + 30) },
        { id: 'm10', authorId: 'me', text: 'À samedi alors !', at: ago(60 * 24 * 4) },
      ],
    },
    {
      id: 'c-plantes-old', kind: 'event', eventId: 'past-plantes', title: 'Troc de boutures 🌿', memberIds: ['sarah'], unread: 0, archived: true,
      messages: [{ id: 'm11', authorId: 'sarah', text: 'Super rencontre, à la prochaine !', at: ago(60 * 24 * 13) }],
    },
  ];
  const groups: Group[] = [
    {
      id: 'g-bande', name: 'Bande du Jeudi', emoji: '🎭', memberIds: ['marc', 'lea', 'tom'], conversationId: 'c-bande',
      description: 'Impro, concerts et apéros du jeudi soir.', sharedEventIds: ['impromptus', 'jazz', 'salsa'],
    },
    {
      id: 'g-jeux', name: 'Jeux & Café', emoji: '🎲', memberIds: ['antoine', 'nina', 'sami'], conversationId: 'c-jeux',
      description: 'Jeux de société, quiz et escape games.', sharedEventIds: ['jeux-coop', 'quiz'],
    },
  ];
  const calls: Call[] = [
    { id: 'call-lea', eventId: 'impromptus', authorId: 'lea', text: "Quelqu'un pour m'accompagner ? Je connais un bar sympa juste à côté pour après.", audience: 'all', createdAt: ago(300), responders: [] },
    { id: 'call-romain', eventId: 'impromptus', authorId: 'romain', text: 'On cherche 2 personnes pour compléter notre table devant la scène !', audience: 'all', createdAt: ago(500), responders: [] },
    { id: 'call-nina', eventId: 'balfolk', authorId: 'nina', text: 'Première fois au bal folk, qui vient danser avec moi ? 💃', audience: 'all', createdAt: ago(120), responders: [] },
    { id: 'call-karim', eventId: 'jazz', authorId: 'karim', text: 'Nouveau à Nantes, je cherche quelqu’un pour la jazz session ce soir 🎷', audience: 'city', createdAt: ago(45), responders: [] },
    { id: 'call-antoine', eventId: 'jeux-coop', authorId: 'antoine', text: 'Il manque une personne pour notre table de Pandemic !', audience: 'all', createdAt: ago(200), responders: [] },
  ];
  const requests: BuddyRequest[] = [
    { id: 'r1', kind: 'buddy', personId: 'romain', context: 'Vous allez tous les deux aux Impromptus du Jeudi' },
    { id: 'r2', kind: 'group', personId: 'julie', groupName: 'Rando du dimanche', context: 'Julie t’invite dans son groupe' },
    { id: 'r3', kind: 'conversation', personId: 'karim', context: 'A répondu à ton profil', message: 'Salut ! J’ai vu qu’on aimait les mêmes concerts, ça te dit la jazz session ?' },
  ];
  const notifications: Notification[] = [
    { id: 'n1', kind: 'social', icon: '👋', text: '<b>Léa</b> a lancé un appel pour <b>Les Impromptus du Jeudi</b>', at: ago(300), read: false, link: '/event/impromptus' },
    { id: 'n2', kind: 'agenda', icon: '⏰', text: '<b>Les Impromptus du Jeudi</b> approchent — 3 Buddies y vont avec toi', at: ago(240), read: false, link: '/event/impromptus' },
    { id: 'n3', kind: 'social', icon: '🤝', text: '<b>Romain</b> veut devenir ton Buddy', at: ago(600), read: false, link: '/messages/demandes' },
    { id: 'n4', kind: 'event', icon: '🔥', text: '<b>Vente de plantes — Racines</b> se remplit vite (31 inscrits)', at: ago(1300), read: true, link: '/event/plantes' },
    { id: 'n5', kind: 'agenda', icon: '⭐', text: 'Comment était <b>Concert acoustique au jardin</b> ? Note ta sortie', at: ago(60 * 24 * 5), read: true, link: '/agenda?tab=historique' },
  ];
  return {
    statuses: { impromptus: 'going', jazz: 'envie', plantes: 'going', galeries: 'envie', 'past-concert': 'going', 'past-jeux': 'going', 'past-plantes': 'going' },
    ratings: { 'past-jeux': 5, 'past-plantes': 4 },
    companions: { impromptus: ['marc', 'lea', 'tom'], plantes: ['marc', 'sarah'], 'past-concert': ['marc', 'lea'], 'past-jeux': ['tom', 'antoine'], 'past-plantes': ['sarah'] },
    calls, conversations, groups, requests, notifications,
    buddies: ['marc', 'lea', 'tom', 'sarah', 'antoine', 'nina', 'sami'],
    followed: ['La Cie du Hasard'],
  };
}
