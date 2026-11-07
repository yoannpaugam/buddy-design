import type { EventItem, Filters } from '../data/types';
import { catById, venueById } from '../data/catalog';

// ---------- Distance ----------
export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000 / 50) * 50} m` : `${km.toFixed(1).replace('.', ',')} km`);
/** Temps de marche (~4,8 km/h) */
export const walkMin = (km: number) => Math.max(1, Math.round((km / 4.8) * 60));

// ---------- Dates ----------
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const DAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const dayDiff = (d: Date, ref = new Date()) =>
  Math.round((startOfDay(d).getTime() - startOfDay(ref).getTime()) / 86400000);

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const m = d.getMinutes();
  return `${d.getHours()}h${m ? String(m).padStart(2, '0') : ''}`;
};
export const fmtHM = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function fmtDayShort(iso: string, ref = new Date()): string {
  const d = new Date(iso);
  const diff = dayDiff(d, ref);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  return `${cap(DAYS[d.getDay()])} ${d.getDate()}`;
}

export function fmtDayLong(iso: string): string {
  const d = new Date(iso);
  return `${cap(DAYS[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export const fmtToday = (d = new Date()) => `${cap(DAYS_LONG[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const monthLabel = (d: Date) => `${cap(MONTHS[d.getMonth()])} ${d.getFullYear()}`;

export function fmtWhen(e: EventItem, ref = new Date()): string {
  const diff = dayDiff(new Date(e.start), ref);
  const t = fmtTime(e.start);
  if (diff === 0) return `${new Date(e.start).getHours() < 18 ? "Aujourd'hui" : 'Ce soir'} · ${t}`;
  return `${fmtDayShort(e.start, ref)} · ${t}`;
}

export function countdown(iso: string, ref = new Date()): string {
  const diff = dayDiff(new Date(iso), ref);
  if (diff <= 0) {
    const h = Math.round((new Date(iso).getTime() - ref.getTime()) / 3600000);
    return h <= 0 ? 'En cours' : `Dans ${h} h`;
  }
  if (diff === 1) return 'Demain';
  return `Dans ${diff} jours`;
}

export function relTime(iso: string, ref = new Date()): string {
  const mins = Math.round((ref.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'hier';
  return `il y a ${d} j`;
}

export function chatTime(iso: string, ref = new Date()): string {
  const d = new Date(iso);
  const diff = dayDiff(d, ref);
  if (diff === 0) return fmtTime(iso);
  if (diff === -1) return 'Hier';
  if (diff > -7) return cap(DAYS[d.getDay()]);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export const priceLabel = (p: number) => (p === 0 ? 'Gratuit' : `${String(p).replace('.', ',')} €`);
export const isPast = (e: EventItem, ref = new Date()) => new Date(e.end).getTime() < ref.getTime();

// ---------- Filtres ----------
export const DEFAULT_FILTERS: Filters = {
  query: '',
  date: 'all',
  hourFrom: 0,
  hourTo: 24,
  maxKm: 30,
  freeOnly: false,
  maxPrice: 100,
  categories: [],
  pmr: false,
};

export function inDateRange(e: EventItem, date: Filters['date'], ref = new Date()): boolean {
  if (date === 'all') return true;
  const s = new Date(e.start);
  const diff = dayDiff(s, ref);
  // un event déjà commencé aujourd'hui mais pas fini compte comme "aujourd'hui"
  if (date === 'today') return diff === 0 || (diff < 0 && !isPast(e, ref));
  if (date === 'tomorrow') return diff === 1;
  if (date === 'week') return diff >= 0 && diff < 7;
  // week-end : samedi + dimanche à venir (ou en cours) — vendredi soir inclus
  const dow = ref.getDay(); // 0 dim
  const toSat = dow === 0 ? -1 : 6 - dow;
  const fri = toSat - 1;
  const sun = toSat + 1;
  if (diff === fri) return s.getHours() >= 18;
  return diff >= Math.max(0, toSat) && diff <= sun;
}

export function matches(
  e: EventItem,
  f: Filters,
  user: { lat: number; lng: number },
  ref = new Date(),
): boolean {
  if (isPast(e, ref)) return false;
  if (!inDateRange(e, f.date, ref)) return false;
  const h = new Date(e.start).getHours();
  if (f.hourFrom > 0 || f.hourTo < 24) {
    // l'event doit commencer dans la plage horaire
    if (h < f.hourFrom || h >= f.hourTo) return false;
  }
  const km = kmBetween(user, venueById(e.venueId));
  if (km > f.maxKm) return false;
  if (f.freeOnly && e.price > 0) return false;
  if (!f.freeOnly && e.price > f.maxPrice) return false;
  if (f.categories.length && !f.categories.includes(e.category)) return false;
  if (f.pmr && !e.pmr) return false;
  if (f.query.trim()) {
    const q = normalize(f.query);
    const v = venueById(e.venueId);
    const hay = normalize([e.title, e.organizer, v.name, v.address, catById(e.category).label, e.description].join(' '));
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const DATE_PHRASE: Record<Filters['date'], string> = {
  all: 'Quand tu veux',
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  weekend: 'Ce week-end',
  week: 'Cette semaine',
};

/** Phrase résumé Buddy : « Ce soir · entre 15h et 22h · dans un rayon de 5 km · moins de 20 € » */
export function filterSummary(f: Filters): string {
  const parts = [DATE_PHRASE[f.date]];
  if (f.hourFrom > 0 || f.hourTo < 24) parts.push(`entre ${f.hourFrom}h et ${f.hourTo}h`);
  parts.push(f.maxKm >= 30 ? 'partout autour' : `dans un rayon de ${f.maxKm} km`);
  if (f.freeOnly) parts.push('gratuit');
  else if (f.maxPrice < 100) parts.push(`moins de ${f.maxPrice} €`);
  if (f.pmr) parts.push('accessible PMR');
  return parts.join(' · ');
}

export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.date !== 'all') n++;
  if (f.hourFrom > 0 || f.hourTo < 24) n++;
  if (f.maxKm < 30) n++;
  if (f.freeOnly || f.maxPrice < 100) n++;
  if (f.categories.length) n++;
  if (f.pmr) n++;
  return n;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
