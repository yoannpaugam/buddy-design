// Lieux de sortie issus d'OpenStreetMap (bars, pubs, cafés, boîtes, salles de concert, marchés)
// et conversion des marchés en événements récurrents à partir de leurs horaires.
// Données © contributeurs OpenStreetMap, licence ODbL.

import { parseOpeningHours, intervalsOn } from '../../src/lib/openingHours.mjs';
import { parisToISO, slug } from './normalize.mjs';

export const OSM_SOURCE = {
  id: 'osm',
  name: 'OpenStreetMap',
  url: 'https://www.openstreetmap.org/',
  license: 'ODbL — © contributeurs OpenStreetMap',
};

// Nantes Métropole et ses abords (sud, nord, est, ouest)
export const BBOX = { south: 47.1, west: -1.78, north: 47.33, east: -1.4 };

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export function overpassQuery(b = BBOX) {
  const box = `${b.south},${b.west},${b.north},${b.east}`;
  return `[out:json][timeout:120];
(
  nwr["amenity"~"^(bar|pub|biergarten|nightclub|cafe|marketplace|music_venue|theatre|cinema|arts_centre)$"]["name"](${box});
);
out center tags;`;
}

const KIND = { bar: 'bar', biergarten: 'bar', pub: 'pub', cafe: 'cafe', nightclub: 'club', music_venue: 'concert', marketplace: 'marche', theatre: 'culture', cinema: 'culture', arts_centre: 'culture' };

const yesNo = (v) => (v === 'yes' ? true : v === 'no' ? false : undefined);
const clean = (s, max = 200) => (s ? String(s).replace(/\s+/g, ' ').trim().slice(0, max) : undefined);

function addressOf(t) {
  const street = [t['addr:housenumber'], t['addr:street'] || t['addr:place']].filter(Boolean).join(' ');
  const city = [t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ');
  return [street, city].filter(Boolean).join(', ') || undefined;
}

function website(t) {
  const w = t.website || t['contact:website'] || t.url;
  if (!w) return undefined;
  const u = /^https?:\/\//i.test(w) ? w : `https://${w}`;
  try {
    return new URL(u).toString();
  } catch {
    return undefined;
  }
}

/** Un élément Overpass → lieu Buddy, ou null s'il n'est pas exploitable. */
export function placeFrom(el) {
  const t = el.tags || {};
  const kind = KIND[t.amenity];
  const name = clean(t.name, 90);
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!kind || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (t.disused || t['disused:amenity'] || t.access === 'private') return null;
  // cafés de chaînes et points de vente à emporter : peu utiles pour sortir
  // marchés de gros et AMAP (réservées aux adhérents) : pas des sorties ouvertes à tous
  if (kind === 'marche' && (t.wholesale === 'yes' || /\bamap\b|int[ée]r[êe]t national|\bMIN\b/i.test(name))) return null;
  if (kind === 'cafe' && /^caf[eé]t(?:'|eria|ier)/i.test(name)) return null; // cafétérias (Crous, entreprises)
  if (/crous/i.test(t.operator || '')) return null;
  if (kind === 'culture' && /^[ée]cole\b/i.test(name)) return null;
  if (kind === 'cafe' && (t.takeaway === 'only' || /^(starbucks|columbus|paul|brioche dor[eé]e|mcdonald)/i.test(name))) return null;
  const hours = clean(t.opening_hours, 300);
  const wheel = t.wheelchair;
  const place = {
    id: `osm-${el.type[0]}${el.id}`,
    name,
    kind,
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    ...(addressOf(t) ? { address: addressOf(t) } : {}),
    ...(t['addr:city'] ? { city: clean(t['addr:city'], 60) } : {}),
    ...(kind === 'culture' ? { venueType: t.amenity === 'cinema' ? 'Cinéma' : t.amenity === 'theatre' ? 'Théâtre' : 'Lieu culturel' } : {}),
    ...(hours ? { hours } : {}),
    ...(website(t) ? { website: website(t) } : {}),
    ...(clean(t.phone || t['contact:phone'], 30) ? { phone: clean(t.phone || t['contact:phone'], 30) } : {}),
    ...(yesNo(t.outdoor_seating) ? { terrace: true } : {}),
    ...(wheel === 'yes' ? { pmr: 'yes' } : wheel === 'limited' ? { pmr: 'limited' } : {}),
    ...(clean(t.happy_hours, 120) ? { happyHours: clean(t.happy_hours, 120) } : {}),
    ...(t.microbrewery === 'yes' || t.craft_beer === 'yes' || t.brewery ? { craftBeer: true } : {}),
    ...(t.live_music === 'yes' ? { liveMusic: true } : {}),
    ...(t['sport'] || t['screen'] === 'yes' || t['sport:screen'] === 'yes' ? { sports: true } : {}),
    ...(clean(t.description || t['description:fr'], 240) ? { description: clean(t['description:fr'] || t.description, 240) } : {}),
  };
  if (kind === 'marche') {
    const m = [];
    if (/farmer|producteur/i.test(`${t.marketplace || ''} ${t.produce || ''} ${name}`)) m.push('producteurs');
    if (t.covered === 'yes' || /halles?/i.test(name)) m.push('couvert');
    if (t.organic === 'yes' || t.organic === 'only' || /\bbio\b/i.test(name)) m.push('bio');
    if (/brocante|puces|antiq|second_hand|flea/i.test(`${t.marketplace || ''} ${t.second_hand || ''} ${name}`)) m.push('brocante');
    if (m.length) place.tags = m;
  }
  return place;
}

/** Déduplication : même nom normalisé à moins de 60 m (nœud + bâtiment du même lieu). */
export function dedupePlaces(list) {
  const out = [];
  const near = (a, b) => Math.abs(a.lat - b.lat) < 0.0006 && Math.abs(a.lng - b.lng) < 0.0009;
  for (const p of list) {
    const k = slug(p.name);
    const dup = out.find((q) => q.kind === p.kind && slug(q.name) === k && near(p, q));
    if (dup) {
      for (const [key, v] of Object.entries(p)) if (dup[key] === undefined) dup[key] = v;
      continue;
    }
    out.push(p);
  }
  return out;
}

const pad = (n) => String(n).padStart(2, '0');
const DAY_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const GENERIC = /^(place du march[eé]|march[eé] (du bourg|du dimanche|local|nocturne|biologique|bio|de producteurs|du centre|du centre-ville|hebdomadaire)|halles?|les halles|march[eé])$/i;

/** Titre lisible : « Marché du bourg (Couëron) », « Marché — Wattignies ». */
export function marketTitle(name, city) {
  const base = /^(march[eé]|halles?|la halle|les halles|foire|puces|brocante)/i.test(name) ? name : `Marché — ${name}`;
  const generic = GENERIC.test(name) || /^place\b/i.test(name);
  return generic && city && !name.toLowerCase().includes(city.toLowerCase()) ? `${base} (${city})` : base;
}

/**
 * Marché OSM avec des horaires lisibles → une occurrence par jour d'ouverture dans la fenêtre.
 * Renvoie { venue, events } ; events vide si les horaires sont absents ou incompréhensibles.
 */
export function marketEvents(place, from, to) {
  const rules = parseOpeningHours(place.hours);
  const venue = { id: `v-${place.id}`, name: place.name, address: place.address || '', lat: place.lat, lng: place.lng };
  if (!rules) return { venue, events: [] };
  const events = [];
  const days = new Set();
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const end = Date.UTC(ty, tm - 1, td);
  for (let t = Date.UTC(fy, fm - 1, fd); t <= end; t += 86400000) {
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const ymd = `${y}-${pad(m)}-${pad(day)}`;
    for (const [a, b] of intervalsOn(rules, y, m, day)) {
      if (b - a >= 1440) continue; // « 24/7 » : pas un marché au sens événement
      const hm = (x) => `${pad(Math.floor((x % 1440) / 60))}:${pad(x % 60)}`;
      const start = parisToISO(ymd, hm(a));
      const endIso = b > 1440 ? parisToISO(new Date(t + 86400000).toISOString().slice(0, 10), hm(b - 1440)) : parisToISO(ymd, hm(b));
      days.add(d.getUTCDay());
      events.push({
        id: `osm-m-${place.id.slice(4)}-${ymd.replace(/-/g, '')}${hm(a).replace(':', '')}`,
        seriesId: place.id,
        title: marketTitle(place.name, place.city),
        organizer: place.name,
        category: 'marche',
        start,
        end: endIso,
        venueId: venue.id,
        price: 0,
        pmr: place.pmr === 'yes',
        description: '',
        attendees: [],
        attendeeCount: 0,
        source: 'osm',
        sourceUrl: `https://www.openstreetmap.org/${{ n: 'node', w: 'way', r: 'relation' }[place.id[4]]}/${place.id.slice(5)}`,
      });
    }
  }
  const tags = place.tags || [];
  const kind = tags.includes('brocante') ? 'Marché aux puces et à la brocante' : tags.includes('producteurs') ? 'Marché de producteurs' : 'Marché';
  const extra = [tags.includes('couvert') ? 'couvert' : 'en plein air', tags.includes('bio') ? 'avec des étals bio' : null].filter(Boolean).join(', ');
  const when = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((x) => DAY_FR[x]).join(', ');
  const description = `${kind} ${extra}${when ? `, le ${when}` : ''}. Entrée libre. Horaires indicatifs (OpenStreetMap) : ${place.hours}.`;
  for (const e of events) e.description = description;
  return { venue, events };
}
