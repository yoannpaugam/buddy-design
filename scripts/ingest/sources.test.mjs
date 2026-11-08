import { describe, expect, it } from 'vitest';
import { intervalsOn, openState, parseOpeningHours, weekTable } from '../../src/lib/openingHours.mjs';
import { dedupePlaces, marketEvents, placeFrom } from './osm.mjs';
import { eventsUrl, oaEventsFrom } from './openagenda.mjs';

describe('horaires OpenStreetMap', () => {
  it('jours et plages simples', () => {
    const r = parseOpeningHours('Tu-Su 07:00-13:30');
    // 10 nov. 2026 = mardi, 9 nov. = lundi
    expect(intervalsOn(r, 2026, 11, 10)).toEqual([[420, 810]]);
    expect(intervalsOn(r, 2026, 11, 9)).toEqual([]);
  });
  it('plusieurs règles, la dernière l’emporte', () => {
    const r = parseOpeningHours('Mo-Sa 17:00-02:00; Fr-Sa 17:00-03:00; Su off');
    expect(intervalsOn(r, 2026, 11, 13)).toEqual([[1020, 1620]]); // vendredi
    expect(intervalsOn(r, 2026, 11, 15)).toEqual([]); // dimanche
  });
  it('après minuit : encore ouvert le lendemain à 1 h', () => {
    const r = parseOpeningHours('Mo-Su 18:00-02:00');
    expect(openState(r, new Date(2026, 10, 10, 1, 0))).toEqual({ open: true, until: 120 });
    expect(openState(r, new Date(2026, 10, 10, 15, 0))).toEqual({ open: false, opensAt: 1080, inDays: 0 });
    // samedi 1 h, ouvert du lundi au vendredi → lundi 8 h
    expect(openState(parseOpeningHours('Mo-Fr 08:00-19:00'), new Date(2026, 10, 7, 3, 0))).toEqual({ open: false, opensAt: 480, inDays: 2, weekday: 1 });
  });
  it('n-ième jour du mois et mois', () => {
    const r = parseOpeningHours('Su[1] 08:00-18:00');
    expect(intervalsOn(r, 2026, 11, 1)).toEqual([[480, 1080]]);
    expect(intervalsOn(r, 2026, 11, 8)).toEqual([]);
    const s = parseOpeningHours('Apr-Sep Sa 08:00-13:00');
    expect(intervalsOn(s, 2026, 11, 14)).toEqual([]);
    expect(intervalsOn(s, 2026, 5, 2)).toEqual([[480, 780]]);
  });
  it('jours fériés et commentaires ignorés, 24/7 compris', () => {
    expect(parseOpeningHours('Mo-Fr 08:00-12:00,14:00-18:00; PH off')).toHaveLength(1);
    expect(intervalsOn(parseOpeningHours('24/7'), 2026, 1, 1)).toEqual([[0, 1440]]);
  });
  it('virgule entre règles et mois suivis de « : »', () => {
    const r = parseOpeningHours('Tu,We 17:00-24:00, Th-Sa 17:00-01:00, Su 16:30-22:30');
    expect(intervalsOn(r, 2026, 11, 13)).toEqual([[1020, 1500]]); // vendredi
    expect(intervalsOn(r, 2026, 11, 15)).toEqual([[990, 1350]]); // dimanche
    const s = parseOpeningHours('Mo 16:00-21:30; Su[-1] 15:00-20:00; Jul-Aug: Tu-Th 18:00-23:00');
    expect(intervalsOn(s, 2026, 11, 29)).toEqual([[900, 1200]]); // dernier dimanche
    expect(intervalsOn(s, 2026, 7, 7)).toEqual([[1080, 1380]]);
  });
  it('format inconnu → null (rien plutôt que faux)', () => {
    expect(parseOpeningHours('sunrise-sunset')).toBeNull();
    expect(parseOpeningHours('Mo-Fr')).toBeNull();
    expect(parseOpeningHours('selon saison')).toBeNull();
  });
  it('semaine type lisible', () => {
    const t = weekTable(parseOpeningHours('Mo-Sa 18:00-01:30'), new Date(2026, 10, 9));
    expect(t[0]).toEqual({ label: "Aujourd'hui", text: '18h – 1h30' });
    expect(t[6].text).toBe('Fermé');
  });
});

const bar = { type: 'node', id: 42, lat: 47.2134, lon: -1.5561, tags: { amenity: 'bar', name: 'Le Lieu Unique', opening_hours: 'Mo-Su 18:00-02:00', outdoor_seating: 'yes', wheelchair: 'limited', website: 'lelieuunique.com', 'addr:housenumber': '2', 'addr:street': 'Quai Ferdinand-Favre', 'addr:postcode': '44000', 'addr:city': 'Nantes' } };
const market = { type: 'way', id: 7, center: { lat: 47.2215, lon: -1.5612 }, tags: { amenity: 'marketplace', name: 'Marché de Talensac', opening_hours: 'Tu-Su 07:00-13:30', covered: 'yes' } };

describe('lieux OpenStreetMap', () => {
  it('bar complet', () => {
    const p = placeFrom(bar);
    expect(p).toMatchObject({ id: 'osm-n42', kind: 'bar', terrace: true, pmr: 'limited', website: 'https://lelieuunique.com/', address: '2 Quai Ferdinand-Favre, 44000 Nantes' });
  });
  it('éléments sans nom, privés ou hors catégorie écartés', () => {
    expect(placeFrom({ ...bar, tags: { amenity: 'bar' } })).toBeNull();
    expect(placeFrom({ ...bar, tags: { ...bar.tags, access: 'private' } })).toBeNull();
    expect(placeFrom({ ...bar, tags: { ...bar.tags, amenity: 'bank' } })).toBeNull();
  });
  it('doublons nœud + bâtiment fusionnés', () => {
    const a = placeFrom(bar);
    const b = { ...placeFrom({ ...bar, type: 'way', id: 43, tags: { amenity: 'bar', name: 'Le lieu unique', phone: '+33 2 40 12 14 34' } }) };
    const out = dedupePlaces([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].phone).toBe('+33 2 40 12 14 34');
  });
  it('marché → occurrences les jours d’ouverture (heure de Paris)', () => {
    const p = placeFrom(market);
    expect(p.tags).toContain('couvert');
    const { venue, events } = marketEvents(p, '2026-11-09', '2026-11-15');
    expect(venue.id).toBe('v-osm-w7');
    expect(events).toHaveLength(6); // mardi → dimanche
    expect(events[0]).toMatchObject({ category: 'marche', price: 0, title: 'Marché de Talensac', source: 'osm', start: '2026-11-10T06:00:00.000Z' });
    expect(events[0].sourceUrl).toBe('https://www.openstreetmap.org/way/7');
    expect(events[0].description).toMatch(/couvert.*mardi/);
  });
  it('marché sans horaires lisibles : aucun event inventé', () => {
    const p = placeFrom({ ...market, tags: { ...market.tags, opening_hours: 'selon saison' } });
    expect(marketEvents(p, '2026-11-09', '2026-11-15').events).toEqual([]);
  });
});

describe('OpenAgenda', () => {
  const ev = {
    uid: 123,
    slug: 'vide-grenier-du-breil',
    title: 'Vide-grenier du Breil',
    description: 'Plus de 80 exposants.',
    conditions: 'Entrée libre',
    keywords: ['brocante'],
    image: { base: 'https://cdn.openagenda.com/main/', filename: 'abc.jpg' },
    location: { uid: 9, name: 'Place du Breil', address: 'Place du Breil', postalCode: '44100', city: 'Nantes', latitude: 47.231, longitude: -1.584 },
    timings: [{ begin: '2026-11-15T08:00:00+0100', end: '2026-11-15T17:00:00+0100' }, { begin: '2027-06-01T08:00:00+0200', end: '2027-06-01T17:00:00+0200' }],
    accessibility: { mi: true },
    status: 1,
  };
  it('événement → occurrences dans la fenêtre seulement', () => {
    const r = oaEventsFrom(ev, { uid: 1, title: 'Quartiers de Nantes', slug: 'quartiers-nantes' }, '2026-11-01', '2026-12-31');
    expect(r.events).toHaveLength(1);
    expect(r.events[0]).toMatchObject({ id: 'oa-123-202611150700', category: 'marche', price: 0, pmr: true, start: '2026-11-15T07:00:00.000Z', organizer: 'Quartiers de Nantes', image: 'https://cdn.openagenda.com/main/abc.jpg', sourceUrl: 'https://openagenda.com/quartiers-nantes/events/vide-grenier-du-breil' });
    expect(r.venue).toMatchObject({ id: 'v-oa-9', lat: 47.231 });
  });
  it('hors zone ou en ligne : écarté', () => {
    expect(oaEventsFrom({ ...ev, location: { ...ev.location, latitude: 48.1, longitude: -1.68 } }, {}, '2026-11-01', '2026-12-31')).toBeNull();
    expect(oaEventsFrom({ ...ev, attendanceMode: 2 }, {}, '2026-11-01', '2026-12-31')).toBeNull();
  });
  it('champs multilingues acceptés', () => {
    const r = oaEventsFrom({ ...ev, title: { fr: 'Concert jazz' }, keywords: { fr: ['jazz'] } }, {}, '2026-11-01', '2026-12-31');
    expect(r.events[0].title).toBe('Concert jazz');
    expect(r.events[0].category).toBe('concert');
  });
  it('URL de lecture avec zone et pagination', () => {
    const u = new URL(eventsUrl('555', 'K', [1, 2]));
    expect(u.pathname).toBe('/v2/agendas/555/events');
    expect(u.searchParams.getAll('relative[]')).toEqual(['current', 'upcoming']);
    expect(u.searchParams.getAll('after[]')).toEqual(['1', '2']);
    expect(u.searchParams.get('geo[northEast][lat]')).toBe('47.33');
  });
});

describe('marchés : titres et exclusions', async () => {
  const { marketTitle } = await import('./osm.mjs');
  it('nom générique complété par la commune', () => {
    expect(marketTitle('Marché du bourg', 'Couëron')).toBe('Marché du bourg (Couëron)');
    expect(marketTitle('Place du 8 mai 1945', 'Rezé')).toBe('Marché — Place du 8 mai 1945 (Rezé)');
    expect(marketTitle('Marché de Talensac', 'Nantes')).toBe('Marché de Talensac');
    expect(marketTitle('Wattignies', 'Nantes')).toBe('Marché — Wattignies');
  });
  it('AMAP et marché de gros écartés', () => {
    expect(placeFrom({ ...market, tags: { ...market.tags, name: 'AMAP de la Manu' } })).toBeNull();
    expect(placeFrom({ ...market, tags: { ...market.tags, name: "Marché d'intérêt national de Nantes Métropole" } })).toBeNull();
  });
  it('cafétérias et écoles écartées', () => {
    expect(placeFrom({ ...bar, tags: { amenity: 'cafe', name: "Cafet'U Droit" } })).toBeNull();
    expect(placeFrom({ ...bar, tags: { amenity: 'arts_centre', name: 'École municipale de musique' } })).toBeNull();
  });
  it('cinéma classé en lieu culturel', () => {
    expect(placeFrom({ ...bar, tags: { amenity: 'cinema', name: 'Le Cinématographe' } })).toMatchObject({ kind: 'culture', venueType: 'Cinéma' });
  });
});
