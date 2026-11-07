import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Call, Conversation, EventItem, EventStatus, Filters, Group, Message, Notification, Person, UserProfile,
} from '../data/types';
import { buildEvents, personById, PEOPLE } from '../data/catalog';
import { emptyState, socialSeed, STATE_VERSION, type AppState } from './seed';
import { uid } from '../lib/logic';

const KEY = 'buddy:state:v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STATE_VERSION) return emptyState();
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* stockage indisponible : l'app reste utilisable en mémoire */
  }
}

const now = () => new Date().toISOString();

const REPLIES = [
  'Top, ça marche 🙌',
  'Carrément, j’en suis !',
  'Haha oui, trop hâte',
  'Je te dis ça ce soir, mais a priori oui 😊',
  'Ok ! On se retrouve devant l’entrée ?',
  'Parfait, je ramène quelqu’un si ça te va',
  'Bonne idée 👌',
];
const CALL_REPLIES = [
  'Salut ! Je suis partant·e, je serai seul·e aussi 🙂',
  'Hello, ça me tente bien ! Je peux te rejoindre sur place ?',
  'Je venais justement de voir l’event, on y va ensemble ?',
  'Yes ! Je connais le lieu, je peux te montrer le chemin.',
];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export interface Toast { id: string; text: string }

interface Store {
  s: AppState;
  events: EventItem[];
  eventById: (id: string) => EventItem | undefined;
  person: (id: string) => Person;
  toasts: Toast[];
  toast: (text: string) => void;
  // profil / onboarding
  completeOnboarding: (u: Partial<UserProfile>) => void;
  updateUser: (u: Partial<UserProfile>) => void;
  setVisibility: (v: Partial<AppState['visibility']>) => void;
  setSettings: (v: Partial<AppState['settings']>) => void;
  resetDemo: () => void;
  // events
  setStatus: (eventId: string, st: EventStatus | null) => void;
  rate: (eventId: string, stars: number) => void;
  publishEvent: (e: Omit<EventItem, 'id' | 'attendees' | 'attendeeCount' | 'createdByMe'>) => string;
  toggleFollow: (organizer: string) => void;
  setFilters: (f: Partial<Filters>) => void;
  saveAlert: (label: string) => void;
  removeAlert: (id: string) => void;
  // appels
  launchCall: (eventId: string, text: string, audience: Call['audience']) => string;
  handleResponder: (callId: string, personId: string, accept: boolean) => string | undefined;
  answerCall: (callId: string, text: string) => string;
  cancelCall: (callId: string) => void;
  // messages
  openConversation: (id: string | null) => void;
  sendMessage: (convId: string, text: string) => void;
  startSolo: (personId: string) => string;
  archiveConversation: (id: string, archived: boolean) => void;
  // social
  sendBuddyRequest: (personId: string) => void;
  removeBuddy: (personId: string) => void;
  handleRequest: (id: string, accept: boolean) => string | undefined;
  createGroup: (name: string, emoji: string, memberIds: string[], description: string) => string;
  updateGroup: (id: string, g: Partial<Group>) => void;
  leaveGroup: (id: string) => void;
  addCompanions: (eventId: string, ids: string[]) => void;
  block: (personId: string, blocked: boolean) => void;
  // notifications
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const openConv = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => save(s), [s]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const events = useMemo(() => [...buildEvents(), ...s.customEvents], [s.customEvents]);
  const eventById = useCallback((id: string) => events.find((e) => e.id === id), [events]);

  const toast = useCallback((text: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const pushNotif = (n: Omit<Notification, 'id' | 'at' | 'read'>) =>
    setS((st) => ({ ...st, notifications: [{ ...n, id: uid(), at: now(), read: false }, ...st.notifications] }));

  const addMessage = (convId: string, m: Omit<Message, 'id' | 'at'>, bumpUnread = true) =>
    setS((st) => ({
      ...st,
      conversations: st.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              archived: false,
              messages: [...c.messages, { ...m, id: uid(), at: now() }],
              unread: bumpUnread && openConv.current !== convId && m.authorId !== 'me' ? c.unread + 1 : c.unread,
            }
          : c,
      ),
    }));

  const store: Store = {
    s, events, eventById, person: personById, toasts, toast,

    completeOnboarding: (u) =>
      setS((st) => {
        const seed = socialSeed();
        return { ...st, ...seed, onboarded: true, user: { ...st.user, ...u, memberSince: now() } };
      }),
    updateUser: (u) => setS((st) => ({ ...st, user: { ...st.user, ...u } })),
    setVisibility: (v) => setS((st) => ({ ...st, visibility: { ...st.visibility, ...v } })),
    setSettings: (v) => setS((st) => ({ ...st, settings: { ...st.settings, ...v } })),
    resetDemo: () => {
      try { localStorage.removeItem(KEY); } catch { /* rien */ }
      setS(emptyState());
    },

    setStatus: (eventId, st0) => {
      setS((st) => {
        const statuses = { ...st.statuses };
        if (st0) statuses[eventId] = st0;
        else delete statuses[eventId];
        return { ...st, statuses };
      });
      if (st0 === 'going') toast('Ajouté à ton agenda ✓');
      if (st0 === 'envie') toast('Gardé dans tes envies ♡');
    },
    rate: (eventId, stars) => {
      setS((st) => ({ ...st, ratings: { ...st.ratings, [eventId]: stars } }));
      toast('Merci pour ta note ⭐');
    },
    publishEvent: (e) => {
      const id = 'mine-' + uid();
      setS((st) => ({
        ...st,
        customEvents: [...st.customEvents, { ...e, id, attendees: [], attendeeCount: 0, createdByMe: true }],
        statuses: { ...st.statuses, [id]: 'going' },
      }));
      toast('Ton event est publié 🎉');
      return id;
    },
    toggleFollow: (org) =>
      setS((st) => {
        const on = st.followed.includes(org);
        return { ...st, followed: on ? st.followed.filter((o) => o !== org) : [...st.followed, org] };
      }),
    setFilters: (f) => setS((st) => ({ ...st, filters: { ...st.filters, ...f } })),
    saveAlert: (label) => {
      setS((st) => ({ ...st, alerts: [...st.alerts, { id: uid(), label, filters: st.filters }] }));
      toast('Alerte créée 🔔 On te prévient des nouveaux events');
    },
    removeAlert: (id) => setS((st) => ({ ...st, alerts: st.alerts.filter((a) => a.id !== id) })),

    launchCall: (eventId, text, audience) => {
      const id = 'call-' + uid();
      setS((st) => ({
        ...st,
        calls: [{ id, eventId, authorId: 'me', text, audience, createdAt: now(), responders: [] }, ...st.calls],
        statuses: st.statuses[eventId] ? st.statuses : { ...st.statuses, [eventId]: 'envie' },
      }));
      // simulation : des réponses arrivent
      const ev = eventById(eventId);
      const pool = PEOPLE.filter((p) => (ev ? p.interests.includes(ev.category) || ev.attendees.includes(p.id) : true));
      const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      chosen.forEach((p, i) =>
        later(2500 + i * 2200, () => {
          setS((st) => ({
            ...st,
            calls: st.calls.map((c) =>
              c.id === id ? { ...c, responders: [...c.responders, { personId: p.id, text: pick(CALL_REPLIES), status: 'pending' }] } : c,
            ),
          }));
          pushNotif({ kind: 'social', icon: '👋', text: `<b>${p.name}</b> a répondu à ton appel pour <b>${ev?.title ?? 'ton event'}</b>`, link: `/appel/${id}` });
          if (i === 0) toast(`👋 ${p.name} a répondu à ton appel`);
        }),
      );
      return id;
    },
    handleResponder: (callId, personId, accept) => {
      const call = s.calls.find((c) => c.id === callId);
      if (!call) return;
      setS((st) => ({
        ...st,
        calls: st.calls.map((c) =>
          c.id === callId
            ? { ...c, responders: c.responders.map((r) => (r.personId === personId ? { ...r, status: accept ? 'accepted' : 'ignored' } : r)) }
            : c,
        ),
      }));
      if (!accept) return;
      const ev = eventById(call.eventId);
      const existing = s.conversations.find((c) => c.kind === 'event' && c.eventId === call.eventId && !c.archived);
      const p = personById(personId);
      if (existing) {
        setS((st) => ({
          ...st,
          conversations: st.conversations.map((c) =>
            c.id === existing.id && !c.memberIds.includes(personId)
              ? { ...c, memberIds: [...c.memberIds, personId], messages: [...c.messages, { id: uid(), authorId: 'system', text: `${p.name} a rejoint la conversation.`, at: now() }] }
              : c,
          ),
        }));
        return existing.id;
      }
      const id = 'c-' + uid();
      const responder = call.responders.find((r) => r.personId === personId);
      const conv: Conversation = {
        id, kind: 'event', eventId: call.eventId, title: ev?.title ?? 'Event', memberIds: [personId], unread: 0,
        messages: [
          { id: uid(), authorId: 'system', text: `Conversation créée autour de ton appel. Elle sera archivée après l’event.`, at: now() },
          { id: uid(), authorId: 'me', text: call.text, at: now() },
          ...(responder ? [{ id: uid(), authorId: personId, text: responder.text, at: now() }] : []),
        ],
      };
      setS((st) => ({ ...st, conversations: [conv, ...st.conversations] }));
      return id;
    },
    answerCall: (callId, text) => {
      const call = s.calls.find((c) => c.id === callId)!;
      const ev = eventById(call.eventId);
      const author = personById(call.authorId);
      const id = 'c-' + uid();
      const conv: Conversation = {
        id, kind: 'event', eventId: call.eventId, title: ev?.title, memberIds: [call.authorId], unread: 0,
        messages: [
          { id: uid(), authorId: call.authorId, text: call.text, at: call.createdAt },
          { id: uid(), authorId: 'me', text, at: now() },
        ],
      };
      setS((st) => ({
        ...st,
        conversations: [conv, ...st.conversations],
        calls: st.calls.map((c) => (c.id === callId ? { ...c, responders: [...c.responders, { personId: 'me', text, status: 'pending' }] } : c)),
      }));
      later(2200, () => {
        addMessage(id, { authorId: call.authorId, text: `Trop bien ! ${pick(['On se retrouve devant l’entrée ?', 'Je t’envoie où je serai 😉', 'Tu arrives vers quelle heure ?'])}` });
        pushNotif({ kind: 'social', icon: '💬', text: `<b>${author.name}</b> a accepté ta réponse pour <b>${ev?.title}</b>`, link: `/messages/${id}` });
      });
      return id;
    },
    cancelCall: (callId) => setS((st) => ({ ...st, calls: st.calls.filter((c) => c.id !== callId) })),

    openConversation: (id) => {
      openConv.current = id;
      if (id) setS((st) => ({ ...st, conversations: st.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) }));
    },
    sendMessage: (convId, text) => {
      addMessage(convId, { authorId: 'me', text });
      const conv = s.conversations.find((c) => c.id === convId);
      if (!conv || !conv.memberIds.length) return;
      const who = pick(conv.memberIds);
      later(1400 + Math.random() * 1500, () => addMessage(convId, { authorId: who, text: pick(REPLIES) }));
    },
    startSolo: (personId) => {
      const ex = s.conversations.find((c) => c.kind === 'solo' && c.memberIds[0] === personId);
      if (ex) return ex.id;
      const id = 'c-' + uid();
      setS((st) => ({ ...st, conversations: [{ id, kind: 'solo', memberIds: [personId], messages: [], unread: 0 }, ...st.conversations] }));
      return id;
    },
    archiveConversation: (id, archived) =>
      setS((st) => ({ ...st, conversations: st.conversations.map((c) => (c.id === id ? { ...c, archived } : c)) })),

    sendBuddyRequest: (personId) => {
      setS((st) => ({ ...st, sentRequests: [...st.sentRequests, personId] }));
      toast('Demande envoyée 🤝');
      later(4000, () => {
        setS((st) => ({ ...st, buddies: st.buddies.includes(personId) ? st.buddies : [...st.buddies, personId], sentRequests: st.sentRequests.filter((x) => x !== personId) }));
        pushNotif({ kind: 'social', icon: '🤝', text: `<b>${personById(personId).name}</b> a accepté ta demande. Vous êtes Buddies !`, link: `/buddy/${personId}` });
      });
    },
    removeBuddy: (personId) => setS((st) => ({ ...st, buddies: st.buddies.filter((b) => b !== personId) })),
    handleRequest: (id, accept) => {
      const r = s.requests.find((x) => x.id === id);
      setS((st) => ({ ...st, requests: st.requests.filter((x) => x.id !== id) }));
      if (!r || !accept) return;
      if (r.kind === 'buddy') {
        setS((st) => ({ ...st, buddies: [...st.buddies, r.personId] }));
        toast(`${personById(r.personId).name} est maintenant ton Buddy 🤝`);
        return;
      }
      if (r.kind === 'group') {
        const gid = 'g-' + uid();
        const cid = 'c-' + uid();
        const members = [r.personId, 'sarah'];
        setS((st) => ({
          ...st,
          groups: [...st.groups, { id: gid, name: r.groupName ?? 'Groupe', emoji: '🥾', memberIds: members, conversationId: cid, description: 'Randos tranquilles le dimanche matin autour de Nantes.', sharedEventIds: ['velo'] }],
          conversations: [{ id: cid, kind: 'group', groupId: gid, memberIds: members, unread: 0, messages: [{ id: uid(), authorId: 'system', text: 'Tu as rejoint le groupe.', at: now() }, { id: uid(), authorId: r.personId, text: 'Bienvenue ! 🥾', at: now() }] }, ...st.conversations],
        }));
        toast(`Tu as rejoint « ${r.groupName} »`);
        return gid;
      }
      const cid = 'c-' + uid();
      setS((st) => ({
        ...st,
        conversations: [{ id: cid, kind: 'solo', memberIds: [r.personId], unread: 0, messages: [{ id: uid(), authorId: r.personId, text: r.message ?? 'Salut !', at: now() }] }, ...st.conversations],
      }));
      return cid;
    },
    createGroup: (name, emoji, memberIds, description) => {
      const gid = 'g-' + uid();
      const cid = 'c-' + uid();
      setS((st) => ({
        ...st,
        groups: [...st.groups, { id: gid, name, emoji, memberIds, conversationId: cid, description, sharedEventIds: [] }],
        conversations: [{ id: cid, kind: 'group', groupId: gid, memberIds, unread: 0, messages: [{ id: uid(), authorId: 'system', text: `Groupe « ${name} » créé. Dites bonjour 👋`, at: now() }] }, ...st.conversations],
      }));
      later(2500, () => addMessage(cid, { authorId: memberIds[0], text: `Trop bien ce groupe ${emoji} !` }));
      toast('Groupe créé 🎉');
      return gid;
    },
    updateGroup: (id, g) => setS((st) => ({ ...st, groups: st.groups.map((x) => (x.id === id ? { ...x, ...g } : x)) })),
    leaveGroup: (id) =>
      setS((st) => {
        const g = st.groups.find((x) => x.id === id);
        return { ...st, groups: st.groups.filter((x) => x.id !== id), conversations: st.conversations.filter((c) => c.id !== g?.conversationId) };
      }),
    addCompanions: (eventId, ids) =>
      setS((st) => ({ ...st, companions: { ...st.companions, [eventId]: Array.from(new Set([...(st.companions[eventId] ?? []), ...ids])) } })),
    block: (personId, blocked) =>
      setS((st) => ({
        ...st,
        visibility: { ...st.visibility, blocked: blocked ? [...st.visibility.blocked, personId] : st.visibility.blocked.filter((b) => b !== personId) },
      })),

    markAllRead: () => setS((st) => ({ ...st, notifications: st.notifications.map((n) => ({ ...n, read: true })) })),
    markRead: (id) => setS((st) => ({ ...st, notifications: st.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore hors StoreProvider');
  return v;
}
