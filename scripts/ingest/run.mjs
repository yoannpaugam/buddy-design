// Collecte des événements de Nantes Métropole → public/data/events.json
// Lancé par GitHub Actions toutes les 6 heures (voir .github/workflows/deploy.yml).
// Usage local : node scripts/ingest/run.mjs   (nécessite un accès à data.nantesmetropole.fr)
//
// Variables d'environnement facultatives :
//   PREVIOUS_URL  fichier publié précédemment, utilisé en secours si la collecte échoue ou chute
//   DAYS_AHEAD    horizon de collecte (défaut 60 jours) ; DAYS_BACK (défaut 7, pour l'historique)

import { mkdir, writeFile } from 'node:fs/promises';
import { SOURCES, dedupe, eventFrom } from './normalize.mjs';

const API = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';
const GEOCODER = 'https://data.geopf.fr/geocodage/search';
const OUT_DIR = new URL('../../public/data/', import.meta.url);
const DAYS_AHEAD = Number(process.env.DAYS_AHEAD || 60);
const DAYS_BACK = Number(process.env.DAYS_BACK || 7);
const UA = { 'User-Agent': 'Buddy-app-ingest/0.2 (+https://github.com/yoannpaugam/buddy-design)' };

const isoDay = (d) => d.toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (res.status === 429 && i < tries) { await sleep(2000 * i); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw err;
      await sleep(1500 * i);
    }
  }
}

async function fetchDataset(source, from, to) {
  const where = `date >= date'${from}' AND date <= date'${to}'`;
  const url = `${API}/${source.dataset}/exports/json?where=${encodeURIComponent(where)}&order_by=date&limit=-1`;
  const rows = await getJSON(url);
  if (!Array.isArray(rows)) throw new Error(`Réponse inattendue pour ${source.id}`);
  return rows;
}

async function datasetModified(source) {
  try {
    const meta = await getJSON(`${API}/${source.dataset}`);
    return meta?.metas?.default?.data_processed || meta?.metas?.default?.modified || null;
  } catch {
    return null;
  }
}

const geoCache = new Map();
async function geocode(venue) {
  if (!venue._query) return null;
  if (geoCache.has(venue._query)) return geoCache.get(venue._query);
  const url = `${GEOCODER}?q=${encodeURIComponent(venue._query)}&limit=1${venue._postcode ? `&postcode=${venue._postcode}` : ''}`;
  let hit = null;
  try {
    const j = await getJSON(url, 2);
    const f = j?.features?.[0];
    if (f && f.properties?.score >= 0.5 && f.properties?.type !== 'municipality') {
      const [lng, lat] = f.geometry.coordinates;
      hit = { lat, lng };
    }
  } catch { /* géocodage indisponible : le lieu sera écarté */ }
  geoCache.set(venue._query, hit);
  await sleep(40); // ≤ 25 requêtes/s, sous la limite de 50/s
  return hit;
}

async function loadPrevious() {
  if (!process.env.PREVIOUS_URL) return null;
  try {
    const res = await fetch(process.env.PREVIOUS_URL, { headers: UA });
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j?.events) ? j : null;
  } catch {
    return null;
  }
}

async function main() {
  const now = new Date();
  const from = isoDay(new Date(now.getTime() - DAYS_BACK * 86400000));
  const to = isoDay(new Date(now.getTime() + DAYS_AHEAD * 86400000));
  const report = { startedAt: now.toISOString(), window: { from, to }, sources: [], dropped: {}, categories: {}, unmappedTypes: {} };
  const venues = new Map();
  const events = [];
  const sourcesMeta = [];

  for (const source of [SOURCES.metropole, SOURCES.bibliotheques]) {
    const stat = { id: source.id, rows: 0, kept: 0, geocoded: 0, droppedNoPlace: 0, error: null };
    try {
      const rows = await fetchDataset(source, from, to);
      stat.rows = rows.length;
      for (const rec of rows) {
        const out = eventFrom(rec, source.id);
        if (!out) { report.dropped.invalid = (report.dropped.invalid || 0) + 1; continue; }
        const { event, venue } = out;
        let v = venues.get(venue.id);
        if (!v) {
          v = venue;
          if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) {
            const hit = await geocode(v);
            if (hit) { Object.assign(v, hit); stat.geocoded++; }
          }
          venues.set(v.id, v);
        } else if (!Number.isFinite(v.lat) && Number.isFinite(venue.lat)) {
          Object.assign(v, { lat: venue.lat, lng: venue.lng });
        }
        if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) { stat.droppedNoPlace++; continue; }
        events.push(event);
        stat.kept++;
        if (event.category === 'fete') {
          const k = (rec.types_libelles || [rec.categorie_1]).join(' | ') || '(aucun type)';
          report.unmappedTypes[k] = (report.unmappedTypes[k] || 0) + 1;
        }
      }
      sourcesMeta.push({ id: source.id, name: source.name, url: source.url, license: source.license, updatedAt: await datasetModified(source), count: stat.kept });
    } catch (err) {
      stat.error = String(err?.message || err);
      console.error(`✗ ${source.id} : ${stat.error}`);
    }
    report.sources.push(stat);
  }

  const unique = dedupe(events.sort((a, b) => a.start.localeCompare(b.start)));
  for (const e of unique) report.categories[e.category] = (report.categories[e.category] || 0) + 1;
  const usedVenues = new Set(unique.map((e) => e.venueId));
  const venueList = [...venues.values()]
    .filter((v) => usedVenues.has(v.id))
    .map(({ _query, _postcode, ...v }) => ({ ...v, lat: Math.round(v.lat * 1e6) / 1e6, lng: Math.round(v.lng * 1e6) / 1e6 }));

  let payload = { generatedAt: now.toISOString(), window: { from, to }, sources: sourcesMeta, venues: venueList, events: unique };

  // Garde-fou : collecte vide ou chute de plus de 50 % → on republie la version précédente.
  const previous = await loadPrevious();
  const prevCount = previous?.events?.length || 0;
  report.previousCount = prevCount;
  report.count = unique.length;
  if (unique.length === 0 || (prevCount > 0 && unique.length < prevCount * 0.5)) {
    if (previous) {
      console.warn(`⚠ ${unique.length} events contre ${prevCount} auparavant : on garde la version précédente.`);
      payload = { ...previous, stale: true };
      report.usedPrevious = true;
    } else if (unique.length === 0) {
      console.error('✗ Aucun événement collecté et aucune version précédente disponible.');
      process.exitCode = 1;
    }
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(new URL('events.json', OUT_DIR), JSON.stringify(payload));
  report.finishedAt = new Date().toISOString();
  report.bytes = JSON.stringify(payload).length;
  await writeFile(new URL('ingest-report.json', OUT_DIR), JSON.stringify(report, null, 2));
  console.log(`✓ ${payload.events.length} événements, ${payload.venues.length} lieux (${Math.round(report.bytes / 1024)} Ko)`);
  console.log(JSON.stringify({ sources: report.sources, categories: report.categories }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
