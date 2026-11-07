import { describe, expect, it } from 'vitest';
import { NANTES, registerVenues } from '../data/catalog';
import type { EventItem } from '../data/types';
import { DEFAULT_FILTERS, activeFilterCount, collapseSeries, filterSummary, inDateRange, kmBetween, matches, priceLabel } from './logic';

// Samedi 7 novembre 2026, 14h
const REF = new Date(2026, 10, 7, 14, 0);
const at = (day: number, h: number) => new Date(2026, 10, 7 + day, h, 0).toISOString();

registerVenues([
  { id: 'v-commerce', name: 'Place du Commerce', address: 'Nantes', lat: 47.213, lng: -1.559 },
  { id: 'v-chateau', name: 'Château des ducs de Bretagne', address: '4 place Marc Elder, Nantes', lat: 47.216, lng: -1.5497 },
  { id: 'v-reze', name: 'Trentemoult', address: 'Rezé', lat: 47.1936, lng: -1.5814 },
]);

const ev = (id: string, p: Partial<EventItem>): EventItem => ({
  id, title: id, organizer: 'Test', category: 'concert', start: at(1, 20), end: at(1, 22), venueId: 'v-commerce',
  price: 0, pmr: false, description: '', attendees: [], attendeeCount: 0, ...p,
});

const EVENTS: EventItem[] = [
  ev('jazz-ce-soir', { start: at(0, 21), end: at(0, 23), price: 8 }),
  ev('visite', { category: 'patrimoine', venueId: 'v-chateau', price: 12, pmr: true, title: 'Visite du château' }),
  ev('trentemoult', { category: 'sport', venueId: 'v-reze', start: at(3, 10), end: at(3, 12) }),
  ev('payant-inconnu', { category: 'theatre', price: null }),
  ev('annule', { status: 'cancelled' }),
  ev('passe', { start: at(-3, 20), end: at(-3, 22) }),
];
const user = { lat: NANTES.lat, lng: NANTES.lng };
const run = (f: Partial<typeof DEFAULT_FILTERS>) => EVENTS.filter((e) => matches(e, { ...DEFAULT_FILTERS, ...f }, user, REF)).map((e) => e.id);

describe('distance', () => {
  it('Nantes → Rennes ≈ 100 km', () => {
    expect(kmBetween({ lat: 47.2184, lng: -1.5536 }, { lat: 48.1173, lng: -1.6778 })).toBeCloseTo(100, -1);
  });
});

describe('filtres', () => {
  it('exclut les events passés et annulés', () => {
    const ids = run({});
    expect(ids).not.toContain('passe');
    expect(ids).not.toContain('annule');
  });
  it('gratuit uniquement exclut le prix inconnu', () => {
    expect(run({ freeOnly: true })).toEqual(['trentemoult']);
  });
  it('plafond de prix : le prix inconnu est exclu, sans plafond il est gardé', () => {
    expect(run({ maxPrice: 10 })).not.toContain('payant-inconnu');
    expect(run({})).toContain('payant-inconnu');
  });
  it('catégorie + PMR', () => {
    expect(run({ categories: ['patrimoine'], pmr: true })).toEqual(['visite']);
  });
  it('rayon de 1 km exclut Trentemoult', () => {
    expect(run({ maxKm: 1 })).not.toContain('trentemoult');
  });
  it('recherche texte insensible aux accents', () => {
    expect(run({ query: 'chateau' })).toEqual(['visite']);
  });
  it("aujourd'hui inclut l'event de ce soir", () => {
    const jazz = EVENTS[0];
    expect(inDateRange(jazz, 'today', REF)).toBe(true);
    expect(inDateRange(jazz, 'tomorrow', REF)).toBe(false);
  });
});

describe('séries', () => {
  it('garde la première date et compte les autres', () => {
    const list = [ev('a1', { seriesId: 'a' }), ev('b1', { seriesId: 'b' }), ev('a2', { seriesId: 'a' }), ev('a3', { seriesId: 'a' })];
    expect(collapseSeries(list).map((x) => [x.e.id, x.more])).toEqual([['a1', 2], ['b1', 0]]);
  });
});

describe('libellés', () => {
  it('prix', () => {
    expect(priceLabel(0)).toBe('Gratuit');
    expect(priceLabel(5.5)).toBe('5,5 €');
    expect(priceLabel(null)).toBe('Payant');
  });
  it('phrase Buddy', () => {
    const f = { ...DEFAULT_FILTERS, date: 'today' as const, hourFrom: 15, hourTo: 22, maxKm: 5, maxPrice: 20 };
    expect(filterSummary(f)).toBe("Aujourd'hui · entre 15h et 22h · dans un rayon de 5 km · moins de 20 €");
    expect(activeFilterCount(f)).toBe(4);
  });
});
