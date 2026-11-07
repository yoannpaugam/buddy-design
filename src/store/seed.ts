import type {
  BuddyRequest, Call, Conversation, Filters, Group, Notification, Settings, UserProfile, Visibility, EventStatus, EventItem, SavedAlert,
} from '../data/types';
import { NANTES } from '../data/catalog';
import { DEFAULT_FILTERS } from '../lib/logic';

export interface AppState {
  version: number;
  onboarded: boolean;
  /** vie sociale de démo déjà générée à partir des vrais events */
  seeded: boolean;
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

export const STATE_VERSION = 2;


export function emptyState(): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    seeded: false,
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
