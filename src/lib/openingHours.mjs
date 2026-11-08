// Lecture des horaires au format OpenStreetMap (clé opening_hours).
// Partagé entre l'app (src/) et la collecte (scripts/ingest/) : JavaScript pur, sans dépendance.
//
// Couvre les formes courantes à Nantes : « Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-13:00 »,
// « Tu-Su 07:00-13:30 », « 18:00-02:00 » (après minuit), « 24/7 », « Su[1] 08:00-18:00 »,
// « Apr-Sep Sa 08:00-13:00 », « off », « PH off ». Tout ce qui n'est pas compris → null
// (on préfère ne rien afficher plutôt qu'un horaire faux).

const DAY = { mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6, su: 0 };
const MONTH = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function parseTime(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  if (h > 48 || mi > 59) return null;
  return h * 60 + mi;
}

/** « 08:00-12:00,14:00-18:00 » → [[480,720],[840,1080]] ; fin < début = après minuit. */
function parseTimes(s) {
  const out = [];
  for (const part of s.split(',').map((x) => x.trim()).filter(Boolean)) {
    const plus = /^(\d{1,2}:\d{2})\+$/.exec(part);
    if (plus) {
      const a = parseTime(plus[1]);
      if (a == null) return null;
      out.push([a, Math.max(a + 180, 26 * 60)]); // « 18:00+ » : ouvert tard, sans heure de fin
      continue;
    }
    const m = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\+?$/.exec(part);
    if (!m) return null;
    const a = parseTime(m[1]);
    let b = parseTime(m[2]);
    if (a == null || b == null) return null;
    if (b <= a) b += 1440;
    out.push([a, b]);
  }
  return out.length ? out : null;
}

/** « Mo-Fr,Su[1] » → { days:Set, nth: Map(jour → [rangs]) } */
function parseDays(s) {
  const days = new Set();
  const nth = new Map();
  for (const part of s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    const n = /^(mo|tu|we|th|fr|sa|su)\[(-?\d)(?:-(\d))?\]$/.exec(part);
    if (n) {
      const d = DAY[n[1]];
      const ranks = n[3] ? Array.from({ length: +n[3] - +n[2] + 1 }, (_, i) => +n[2] + i) : [+n[2]];
      nth.set(d, [...(nth.get(d) || []), ...ranks]);
      continue;
    }
    const r = /^(mo|tu|we|th|fr|sa|su)(?:-(mo|tu|we|th|fr|sa|su))?$/.exec(part);
    if (!r) return null;
    const a = DAY[r[1]];
    const b = r[2] ? DAY[r[2]] : a;
    for (let d = a; ; d = (d + 1) % 7) {
      days.add(d);
      if (d === b) break;
    }
  }
  return { days, nth };
}

function parseMonths(s) {
  const months = new Set();
  for (const part of s.split(',').map((x) => x.trim().toLowerCase())) {
    const r = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?$/.exec(part);
    if (!r) return null;
    const a = MONTH[r[1]];
    const b = r[2] ? MONTH[r[2]] : a;
    for (let m = a; ; m = (m % 12) + 1) {
      months.add(m);
      if (m === b) break;
    }
  }
  return months;
}

/**
 * Analyse une valeur opening_hours. Renvoie une liste de règles, ou null si le format
 * n'est pas reconnu. Une règle : { months?, days?, nth?, times: [[début,fin]] | [] (fermé) }.
 */
export function parseOpeningHours(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value === '24/7') return [{ times: [[0, 1440]] }];
  const rules = [];
  // « Tu,We 17:00-24:00, Th-Sa 17:00-01:00 » : la virgule après une heure sépare aussi des règles
  const parts = value.split(';').flatMap((x) => x.split(/(?<=\d)\s*,\s*(?=(?:mo|tu|we|th|fr|sa|su|ph)\b)/i));
  for (let rule of parts.map((x) => x.trim()).filter(Boolean)) {
    rule = rule.replace(/"[^"]*"/g, '').trim(); // commentaires « "sur réservation" »
    if (/^ph\b/i.test(rule) || /^sh\b/i.test(rule)) continue; // jours fériés / vacances : ignorés
    const r = { times: [] };
    let rest = rule;
    const mm = /^((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:-(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?(?:,(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:-(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?)*):?\s+/i.exec(rest);
    if (mm) {
      r.months = parseMonths(mm[1]);
      if (!r.months) return null;
      rest = rest.slice(mm[0].length);
    }
    const dm = /^((?:mo|tu|we|th|fr|sa|su)(?:\[-?\d(?:-\d)?\])?(?:-(?:mo|tu|we|th|fr|sa|su))?(?:,(?:mo|tu|we|th|fr|sa|su)(?:\[-?\d(?:-\d)?\])?(?:-(?:mo|tu|we|th|fr|sa|su))?)*)(?:\s+|$)/i.exec(rest);
    if (dm) {
      const d = parseDays(dm[1]);
      if (!d) return null;
      if (d.days.size) r.days = d.days;
      if (d.nth.size) r.nth = d.nth;
      rest = rest.slice(dm[0].length).trim();
      // « Su,PH off » : le PH collé aux jours est retiré
    }
    rest = rest.replace(/^,?\s*ph\s*/i, '').trim();
    if (!rest) return null; // jours sans horaire : non exploitable
    if (/^(off|closed)$/i.test(rest)) {
      rules.push(r); // fermé
      continue;
    }
    if (/^open$/i.test(rest)) {
      r.times = [[0, 1440]];
      rules.push(r);
      continue;
    }
    const times = parseTimes(rest);
    if (!times) return null;
    r.times = times;
    rules.push(r);
  }
  return rules.length ? rules : null;
}

function ruleApplies(r, y, m, d, wd) {
  if (r.months && !r.months.has(m)) return false;
  if (!r.days && !r.nth) return true;
  if (r.days?.has(wd)) return true;
  const ranks = r.nth?.get(wd);
  if (ranks) {
    const nthFromStart = Math.floor((d - 1) / 7) + 1;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const nthFromEnd = -(Math.floor((daysInMonth - d) / 7) + 1);
    return ranks.includes(nthFromStart) || ranks.includes(nthFromEnd);
  }
  return false;
}

/**
 * Plages d'ouverture d'un jour donné (minutes depuis minuit, la fin peut dépasser 1440).
 * Comme dans OSM, une règle plus loin dans la liste remplace les précédentes pour ce jour.
 */
export function intervalsOn(rules, y, m, d) {
  if (!rules) return [];
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  let res = [];
  for (const r of rules) if (ruleApplies(r, y, m, d, wd)) res = r.times;
  return res;
}

/** Ouvert à cet instant (heure locale de l'appareil) ? null si horaires inconnus. */
export function openState(rules, at = new Date()) {
  if (!rules) return null;
  const mins = at.getHours() * 60 + at.getMinutes();
  const today = intervalsOn(rules, at.getFullYear(), at.getMonth() + 1, at.getDate());
  const prev = new Date(at.getFullYear(), at.getMonth(), at.getDate() - 1);
  const yesterday = intervalsOn(rules, prev.getFullYear(), prev.getMonth() + 1, prev.getDate());
  for (const [a, b] of yesterday) if (b > 1440 && mins < b - 1440) return { open: true, until: b - 1440 };
  for (const [a, b] of today) if (mins >= a && mins < b) return { open: true, until: b % 1440 };
  const next = today.filter(([a]) => a > mins).sort((x, y) => x[0] - y[0])[0];
  if (next) return { open: false, opensAt: next[0], inDays: 0 };
  for (let i = 1; i <= 7; i++) {
    const d = new Date(at.getFullYear(), at.getMonth(), at.getDate() + i);
    const iv = intervalsOn(rules, d.getFullYear(), d.getMonth() + 1, d.getDate()).slice().sort((x, y) => x[0] - y[0]);
    if (iv.length) return { open: false, opensAt: iv[0][0], inDays: i, weekday: d.getDay() };
  }
  return { open: false };
}

/** « 18h », « 1h30 » */
export function fmtMinutes(m) {
  const t = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const mi = t % 60;
  return `${h}h${mi ? String(mi).padStart(2, '0') : ''}`;
}

const DAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** Semaine type à partir d'une date : [{ label, text }] pour les 7 jours suivants. */
export function weekTable(rules, from = new Date()) {
  if (!rules) return null;
  const out = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const iv = intervalsOn(rules, day.getFullYear(), day.getMonth() + 1, day.getDate());
    out.push({
      label: i === 0 ? "Aujourd'hui" : DAY_FR[day.getDay()],
      text: iv.length ? iv.map(([a, b]) => (a === 0 && b === 1440 ? '24h/24' : `${fmtMinutes(a)} – ${fmtMinutes(b)}`)).join(', ') : 'Fermé',
    });
  }
  return out;
}
