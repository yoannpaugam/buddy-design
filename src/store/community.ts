// Communauté de démonstration : de vrais événements, mais des membres fictifs.
// Les agendas publics ne disent pas qui participe ; en attendant les vrais comptes,
// quelques membres fictifs sont rattachés aux events de façon stable (même event → mêmes personnes).
import type { BuddyRequest, Call, Conversation, EventItem, Group, Notification } from '../data/types';
import { PEOPLE } from '../data/catalog';
import { dayDiff, isPast } from '../lib/logic';

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 0 à 3 membres fictifs par event, choisis parmi ceux qui aiment la catégorie. */
export function communityFor(e: EventItem): string[] {
  if (e.createdByMe || e.status === 'cancelled') return [];
  const h = hash(e.seriesId ?? e.id);
  const n = h % 5 === 0 ? 0 : (h % 3) + 1;
  const fans = PEOPLE.filter((p) => p.interests.includes(e.category));
  const pool = fans.length >= n ? fans : PEOPLE;
  const out: string[] = [];
  for (let i = 0; out.length < n && i < pool.length * 2; i++) {
    const p = pool[(h + i * 7) % pool.length];
    if (!out.includes(p.id)) out.push(p.id);
  }
  return out;
}

export function withCommunity(events: EventItem[], companions: Record<string, string[]>): EventItem[] {
  return events.map((e) => {
    const ids = Array.from(new Set([...communityFor(e), ...(companions[e.id] ?? [])]));
    return { ...e, attendees: ids, attendeeCount: ids.length };
  });
}

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

/** Vie sociale de démonstration construite à partir des vrais events chargés. */
export function buildSocialSeed(events: EventItem[], interests: string[]) {
  const usable = events.filter((e) => e.status !== 'cancelled' && !e.allDay);
  const upcoming = usable.filter((e) => !isPast(e)).sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const liked = (e: EventItem) => interests.includes(e.category);
  const used = new Set<string>();
  const take = (pred: (e: EventItem) => boolean) => {
    const e = upcoming.find((x) => !used.has(x.seriesId ?? x.id) && pred(x));
    if (e) used.add(e.seriesId ?? e.id);
    return e;
  };
  const evening = (e: EventItem) => new Date(e.start).getHours() >= 18;
  const soon = (min: number, max: number) => (e: EventItem) => { const d = dayDiff(new Date(e.start)); return d >= min && d <= max; };

  const go1 = take((e) => liked(e) && evening(e) && soon(1, 7)(e)) ?? take(soon(1, 7)) ?? take(() => true);
  const go2 = take((e) => liked(e) && soon(2, 14)(e)) ?? take(soon(2, 14));
  const wish1 = take((e) => liked(e) && soon(0, 10)(e)) ?? take(soon(0, 10));
  const wish2 = take((e) => soon(0, 14)(e) && e.price === 0);
  const callEvents = [take((e) => liked(e) && soon(0, 7)(e)), take((e) => soon(0, 7)(e) && e.category === 'danse'), take((e) => soon(0, 7)(e) && e.category === 'concert'), take((e) => soon(0, 7)(e) && e.category === 'jeux')].filter(Boolean) as EventItem[];
  const past = usable.filter((e) => isPast(e)).sort((a, b) => +new Date(b.start) - +new Date(a.start));
  const pastPicks: EventItem[] = [];
  for (const e of past) {
    if (pastPicks.length >= 3) break;
    if (!pastPicks.some((p) => (p.seriesId ?? p.id) === (e.seriesId ?? e.id))) pastPicks.push(e);
  }

  const statuses: Record<string, 'going' | 'envie'> = {};
  const companions: Record<string, string[]> = {};
  const ratings: Record<string, number> = {};
  if (go1) { statuses[go1.id] = 'going'; companions[go1.id] = ['marc', 'lea', 'tom']; }
  if (go2) { statuses[go2.id] = 'going'; companions[go2.id] = ['sarah']; }
  if (wish1) statuses[wish1.id] = 'envie';
  if (wish2) statuses[wish2.id] = 'envie';
  const pastCompanions = [['marc', 'lea'], ['tom', 'antoine'], ['sarah']];
  pastPicks.forEach((e, i) => { statuses[e.id] = 'going'; companions[e.id] = pastCompanions[i]; if (i > 0) ratings[e.id] = 5 - i + 1; });

  const authors = ['lea', 'nina', 'karim', 'antoine'];
  const callTexts = [
    'Quelqu’un pour m’accompagner ? Je connais un bar sympa juste à côté pour après.',
    'Première fois, qui vient avec moi ? 💃',
    'Nouveau à Nantes, je cherche quelqu’un pour y aller 🙂',
    'Il manque une personne pour compléter notre table !',
  ];
  const calls: Call[] = callEvents.map((e, i) => ({ id: `call-${i}`, eventId: e.id, authorId: authors[i], text: callTexts[i], audience: 'all', createdAt: ago(45 + i * 90), responders: [] }));
  if (go1) calls.push({ id: 'call-romain', eventId: go1.id, authorId: 'romain', text: 'On cherche 2 personnes pour compléter notre groupe !', audience: 'all', createdAt: ago(500), responders: [] });

  const t1 = go1?.title ?? 'la sortie de jeudi';
  const conversations: Conversation[] = [
    { id: 'c-bande', kind: 'group', groupId: 'g-bande', memberIds: ['marc', 'lea', 'tom'], unread: 3, messages: [
      { id: 'm1', authorId: 'marc', text: `Qui est chaud pour « ${t1} » ?`, at: ago(190) },
      { id: 'm2', authorId: 'tom', text: 'Moi ! On se prend un verre après ?', at: ago(150) },
      { id: 'm3', authorId: 'lea', text: 'Grave. On se retrouve directement là-bas ?', at: ago(42) },
    ] },
    { id: 'c-lea', kind: 'solo', memberIds: ['lea'], unread: 0, messages: [
      { id: 'm4', authorId: 'lea', text: 'Merci pour hier, c’était trop bien 😄', at: ago(80) },
      { id: 'm5', authorId: 'me', text: 'Carrément ! On refait ça vite 🙌', at: ago(39) },
    ] },
    { id: 'c-jeux', kind: 'group', groupId: 'g-jeux', memberIds: ['antoine', 'nina', 'sami'], unread: 0, messages: [
      { id: 'm8', authorId: 'antoine', text: 'Soirée jeux samedi chez moi ?', at: ago(60 * 24 * 3) },
    ] },
    { id: 'c-marc', kind: 'solo', memberIds: ['marc'], unread: 0, messages: [
      { id: 'm9', authorId: 'marc', text: go2 ? `Tu viens à « ${go2.title} » ?` : 'On sort ce week-end ?', at: ago(60 * 24 * 2 + 30) },
      { id: 'm10', authorId: 'me', text: 'Oui, à bientôt !', at: ago(60 * 24 * 2) },
    ] },
  ];
  if (go1) conversations.splice(2, 0, { id: 'c-ev1', kind: 'event', eventId: go1.id, title: go1.title, memberIds: ['romain', 'lea'], unread: 1, messages: [
    { id: 'm6', authorId: 'system', text: `Conversation créée autour de l’appel ouvert « ${go1.title} ».`, at: ago(1500) },
    { id: 'm7', authorId: 'romain', text: 'Je pars du centre-ville, on peut faire le trajet ensemble.', at: ago(1400) },
  ] });

  const groups: Group[] = [
    { id: 'g-bande', name: 'Bande du Jeudi', emoji: '🎭', memberIds: ['marc', 'lea', 'tom'], conversationId: 'c-bande', description: 'Spectacles, concerts et apéros en semaine.', sharedEventIds: [go1?.id, wish1?.id].filter(Boolean) as string[] },
    { id: 'g-jeux', name: 'Jeux & Café', emoji: '🎲', memberIds: ['antoine', 'nina', 'sami'], conversationId: 'c-jeux', description: 'Jeux de société, quiz et escape games.', sharedEventIds: callEvents.filter((e) => e.category === 'jeux').map((e) => e.id) },
  ];
  const requests: BuddyRequest[] = [
    { id: 'r1', kind: 'buddy', personId: 'romain', context: go1 ? `Vous allez tous les deux à « ${go1.title} »` : 'Vous aimez les mêmes sorties' },
    { id: 'r2', kind: 'group', personId: 'julie', groupName: 'Rando du dimanche', context: 'Julie t’invite dans son groupe' },
    { id: 'r3', kind: 'conversation', personId: 'karim', context: 'A répondu à ton profil', message: 'Salut ! J’ai vu qu’on aimait les mêmes sorties, ça te dit d’aller à un concert ?' },
  ];
  const notifications: Notification[] = [];
  if (callEvents[0]) notifications.push({ id: 'n1', kind: 'social', icon: '👋', text: `<b>Léa</b> a lancé un appel pour <b>${esc(callEvents[0].title)}</b>`, at: ago(45), read: false, link: `/event/${callEvents[0].id}` });
  if (go1) notifications.push({ id: 'n2', kind: 'agenda', icon: '⏰', text: `<b>${esc(go1.title)}</b> approche — 3 Buddies y vont avec toi`, at: ago(240), read: false, link: `/event/${go1.id}` });
  notifications.push({ id: 'n3', kind: 'social', icon: '🤝', text: '<b>Romain</b> veut devenir ton Buddy', at: ago(600), read: false, link: '/messages/demandes' });
  if (wish2) notifications.push({ id: 'n4', kind: 'event', icon: '✨', text: `Gratuit et près de chez toi : <b>${esc(wish2.title)}</b>`, at: ago(1300), read: true, link: `/event/${wish2.id}` });
  if (pastPicks[0]) notifications.push({ id: 'n5', kind: 'agenda', icon: '⭐', text: `Comment était <b>${esc(pastPicks[0].title)}</b> ? Note ta sortie`, at: ago(60 * 24), read: true, link: '/agenda?tab=historique' });

  return {
    statuses, ratings, companions, calls, conversations, groups, requests, notifications,
    buddies: ['marc', 'lea', 'tom', 'sarah', 'antoine', 'nina', 'sami'],
    followed: [] as string[],
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
