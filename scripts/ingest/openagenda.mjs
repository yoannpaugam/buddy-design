// Événements OpenAgenda autour de Nantes (associations, salles, comités de quartier…).
// Nécessite une clé de lecture gratuite : compte sur openagenda.com → Paramètres → Clé API,
// à ranger dans le secret GitHub OPENAGENDA_KEY. Sans clé, cette source est simplement ignorée.
// Doc : https://developers.openagenda.com/

import { categorize, cleanText, parsePrice, slug, softCaps } from './normalize.mjs';
import { BBOX } from './osm.mjs';

export const OA_SOURCE = {
  id: 'openagenda',
  name: 'OpenAgenda',
  url: 'https://openagenda.com/',
  license: 'Licence Ouverte / données publiées par les organisateurs',
};

export const OA_API = 'https://api.openagenda.com/v2';
// Recherches d'agendas utilisées pour découvrir les programmations locales.
export const OA_SEARCHES = ['nantes', 'loire-atlantique', 'rezé', 'saint-herblain', 'brocante', 'vide-grenier'];

/** Champ multilingue OpenAgenda → texte français (ou première langue disponible). */
export const tr = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.fr ?? v.en ?? Object.values(v)[0] ?? '';
  return String(v);
};

const inBox = (lat, lng, b = BBOX) => lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;

/** URL de lecture des événements d'un agenda (à venir + en cours, dans la zone). */
export function eventsUrl(agendaUid, key, after) {
  const p = new URLSearchParams({ key, size: '300', detailed: '1', monolingual: 'fr' });
  p.append('relative[]', 'current');
  p.append('relative[]', 'upcoming');
  p.set('geo[northEast][lat]', String(BBOX.north));
  p.set('geo[northEast][lng]', String(BBOX.east));
  p.set('geo[southWest][lat]', String(BBOX.south));
  p.set('geo[southWest][lng]', String(BBOX.west));
  for (const a of after || []) p.append('after[]', String(a));
  return `${OA_API}/agendas/${agendaUid}/events?${p}`;
}

function imageOf(img) {
  if (!img) return undefined;
  if (typeof img === 'string') return img;
  if (img.base && img.filename) return `${img.base}${img.filename}`;
  const v = (img.variants || []).find((x) => x.type === 'full') || img.variants?.[0];
  if (v && img.base) return `${img.base}${v.filename}`;
  return undefined;
}

// statuts OpenAgenda : 1 programmé, 2 reprogrammé, 3 en ligne, 4 reporté, 5 complet, 6 annulé
const STATUS = { 4: 'postponed', 5: 'full', 6: 'cancelled' };

/**
 * Un événement OpenAgenda → { venue, events } (une occurrence par horaire dans la fenêtre).
 * from/to : dates « AAAA-MM-JJ ».
 */
export function oaEventsFrom(ev, agenda, from, to) {
  const loc = ev?.location;
  const lat = Number(loc?.latitude);
  const lng = Number(loc?.longitude);
  const title = softCaps(cleanText(tr(ev?.title), 120));
  if (!ev?.uid || !title || !Number.isFinite(lat) || !Number.isFinite(lng) || !inBox(lat, lng)) return null;
  if (ev.attendanceMode === 2) return null; // en ligne uniquement
  const name = cleanText(tr(loc.name) || tr(loc.address) || 'Lieu à préciser', 90);
  const venue = {
    id: `v-oa-${loc.uid || slug(`${name}-${loc.postalCode || ''}`)}`,
    name,
    address: [tr(loc.address), [loc.postalCode, loc.city].filter(Boolean).join(' ')].filter(Boolean).join(', ').replace(/, (\d{5}) .*?, \1/, ', $1'),
    lat,
    lng,
  };
  const kw = ev.keywords;
  const keywords = (Array.isArray(kw) ? kw : Array.isArray(kw?.fr) ? kw.fr : []).filter((x) => typeof x === 'string');
  const conditions = tr(ev.conditions);
  const { price, priceText } = parsePrice(/gratuit|entr[ée]e libre/i.test(conditions) ? 'oui' : '', conditions);
  const description = cleanText(tr(ev.description) || tr(ev.longDescription)) || 'Plus d’informations sur la page de l’événement.';
  const category = categorize({ types: [], themes: keywords, title, extra: [] });
  const pmr = Boolean(ev.accessibility?.mi);
  const image = imageOf(ev.image);
  const link = ev.canonicalUrl || (agenda?.slug && ev.slug ? `https://openagenda.com/${agenda.slug}/events/${ev.slug}` : undefined);
  const status = STATUS[ev.status];
  const lo = `${from}T00:00:00`;
  const hi = `${to}T23:59:59`;
  const events = [];
  for (const tm of ev.timings || []) {
    const b = new Date(tm.begin);
    const e = new Date(tm.end || tm.begin);
    if (Number.isNaN(+b)) continue;
    const startIso = b.toISOString();
    if (startIso < new Date(lo).toISOString() || startIso > new Date(hi).toISOString()) continue;
    // occurrence de plus de 14 h : journée entière (expos, salons)
    const allDay = +e - +b >= 14 * 3600000;
    events.push({
      id: `oa-${ev.uid}-${startIso.replace(/[-:TZ.]/g, '').slice(0, 12)}`,
      seriesId: `oa-${ev.uid}`,
      title,
      organizer: cleanText(tr(agenda?.title) || name, 80),
      category,
      start: startIso,
      end: (+e > +b ? e : new Date(+b + 2 * 3600000)).toISOString(),
      ...(allDay ? { allDay: true } : {}),
      venueId: venue.id,
      price,
      ...(priceText ? { priceText } : {}),
      pmr,
      ...(image ? { image } : {}),
      description,
      attendees: [],
      attendeeCount: 0,
      ...(status ? { status } : {}),
      source: 'openagenda',
      ...(link ? { sourceUrl: link } : {}),
    });
  }
  return events.length ? { venue, events } : null;
}
