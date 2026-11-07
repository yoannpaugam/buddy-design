import { describe, expect, it } from 'vitest';
import { buildEvents, NANTES } from '../data/catalog';
import { DEFAULT_FILTERS, activeFilterCount, filterSummary, inDateRange, kmBetween, matches } from './logic';

// Samedi 7 novembre 2026, 14h
const REF = new Date(2026, 10, 7, 14, 0);
const events = buildEvents(REF);
const user = { lat: NANTES.lat, lng: NANTES.lng };
const run = (f: Partial<typeof DEFAULT_FILTERS>) => events.filter((e) => matches(e, { ...DEFAULT_FILTERS, ...f }, user, REF)).map((e) => e.id);

describe('distance', () => {
  it('Nantes → Rennes ≈ 98 km', () => {
    expect(kmBetween({ lat: 47.2184, lng: -1.5536 }, { lat: 48.1173, lng: -1.6778 })).toBeCloseTo(100, -1);
  });
});

describe('catalogue', () => {
  it('les Impromptus du Jeudi tombent un jeudi', () => {
    const e = events.find((x) => x.id === 'impromptus')!;
    expect(new Date(e.start).getDay()).toBe(4);
  });
});

describe('filtres', () => {
  it('exclut les events passés', () => {
    expect(run({})).not.toContain('past-concert');
  });
  it('gratuit uniquement', () => {
    const ids = run({ freeOnly: true });
    expect(ids.length).toBeGreaterThan(0);
    ids.forEach((id) => expect(events.find((e) => e.id === id)!.price).toBe(0));
  });
  it('catégorie + PMR', () => {
    const ids = run({ categories: ['concert'], pmr: true });
    ids.forEach((id) => {
      const e = events.find((x) => x.id === id)!;
      expect(e.category).toBe('concert');
      expect(e.pmr).toBe(true);
    });
  });
  it('rayon de 1 km exclut Trentemoult', () => {
    expect(run({ maxKm: 1 })).not.toContain('velo');
  });
  it('recherche texte insensible aux accents', () => {
    expect(run({ query: 'chateau' })).toContain('chateau-nuit');
  });
  it('plage horaire du soir', () => {
    run({ hourFrom: 18, hourTo: 24 }).forEach((id) => expect(new Date(events.find((e) => e.id === id)!.start).getHours()).toBeGreaterThanOrEqual(18));
  });
  it("aujourd'hui inclut la jazz session de ce soir", () => {
    const jazz = events.find((e) => e.id === 'jazz')!;
    expect(inDateRange(jazz, 'today', REF)).toBe(true);
    expect(inDateRange(jazz, 'tomorrow', REF)).toBe(false);
  });
});

describe('résumé', () => {
  it('phrase Buddy', () => {
    const f = { ...DEFAULT_FILTERS, date: 'today' as const, hourFrom: 15, hourTo: 22, maxKm: 5, maxPrice: 20 };
    expect(filterSummary(f)).toBe("Aujourd'hui · entre 15h et 22h · dans un rayon de 5 km · moins de 20 €");
    expect(activeFilterCount(f)).toBe(4);
  });
});
