import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { categorize, cleanText, dedupe, eventFrom, parisToISO, parsePrice, titleCase } from './normalize.mjs';

const fx = JSON.parse(readFileSync(new URL('./fixtures/sample.json', import.meta.url), 'utf8'));

describe('conversion d’une ligne de l’agenda Nantes Métropole', () => {
  const { event, venue } = eventFrom(fx.metropole[0], 'metropole');
  it('produit un EventItem complet', () => {
    expect(event.id).toBe('nm-70224-202606071400');
    expect(event.title).toContain('musée Jules Verne');
    expect(event.category).toBe('expo');
    expect(event.price).toBe(0);
    expect(event.source).toBe('metropole');
    expect(event.sourceUrl).toMatch(/^https:\/\/metropole\.nantes\.fr/);
    expect(event.image).toMatch(/^https:\/\/img\.openagenda\.com/);
  });
  it('heure de Paris convertie en UTC (été : UTC+2)', () => {
    expect(event.start).toBe('2026-06-07T12:00:00.000Z');
  });
  it('lieu avec coordonnées', () => {
    expect(venue.name).toBe('Musée Jules Verne');
    expect(venue.lat).toBeCloseTo(47.2016, 3);
    expect(venue.address).toContain('44100');
  });
  it('organisateur en casse lisible avec accents', () => {
    expect(event.organizer).toBe('Musée Jules Verne');
  });
  it('les contacts personnels ne sont jamais repris', () => {
    expect(JSON.stringify(event)).not.toMatch(/@|courriel|telephone/i);
  });
});

describe('agenda des bibliothèques', () => {
  it('se convertit sans coordonnées (géocodage ensuite)', () => {
    const { event, venue } = eventFrom(fx.bibliotheques[0], 'bibliotheques');
    expect(event.category).toBe('expo');
    expect(Number.isNaN(venue.lat)).toBe(true);
    expect(venue._query).toContain('Haluchère');
  });
});

describe('prix', () => {
  it.each([
    ['oui', null, 0],
    ['non', 'Tarif plein 12€, réduit 8 €', 8],
    ['non', 'Entrée libre', 0],
    ['non', 'Sur réservation', null],
    ['non', '5,50 euros', 5.5],
  ])('%s / %s → %s', (g, t, expected) => expect(parsePrice(g, t).price).toBe(expected));
});

describe('catégories', () => {
  it.each([
    [['Visite - Balade'], 'patrimoine'],
    [['Exposition', 'Salon'], 'marche'],
    [['Concert - Musique', 'Fête - Festival'], 'concert'],
    [['Projection'], 'cinema'],
    [['Conférence - Débat - Réunion publique'], 'rencontre'],
    [['a', 'b', 'c', 'd'], 'fete'],
  ])('%j → %s', (types, cat) => expect(categorize({ types })).toBe(cat));
  it('titre en secours', () => expect(categorize({ title: 'Tournoi de pétanque' })).toBe('sport'));
});

describe('utilitaires', () => {
  it('hiver : UTC+1', () => expect(parisToISO('2026-12-14', '20:30')).toBe('2026-12-14T19:30:00.000Z'));
  it('casse', () => expect(titleCase('BIBLIOTHEQUE DE NANTES')).toBe('Bibliothèque de Nantes'));
  it('mots collés', () => expect(cleanText('notre site internetProlonger la durée')).toBe('notre site internet Prolonger la durée'));
  it('dédoublonnage', () => {
    const a = { seriesId: '1', start: 'x', title: 'Conte' };
    expect(dedupe([a, { ...a }, { seriesId: '2', start: 'x', title: 'Conte !' }])).toHaveLength(1);
  });
});
