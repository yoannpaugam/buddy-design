// Collecte des événements de Nantes Métropole → public/data/events.json
// Lancé par GitHub Actions toutes les 6 heures (voir .github/workflows/deploy.yml).
// Usage local : node scripts/ingest/run.mjs   (nécessite un accès à data.nantesmetropole.fr)
//
// Variables d'environnement facultatives :
//   PREVIOUS_URL  fichier publié précédemment, utilisé en secours si la collecte échoue ou chute
//   DAYS_AHEAD    horizon de collecte (défaut 60 jours) ; DAYS_BACK (défaut 7, pour l'historique)
//   PREVIOUS_PLACES_URL  lieux publiés précédemment (secours si OpenStreetMap ne répond pas)
//   OPENAGENDA_KEY       clé de lecture OpenAgenda (facultative) ; OPENAGENDA_AGENDAS : uids en plus, séparés par des virgules

import { mkdir, writeFile } from 'node:fs/promises';
import { SOURCES, dedupe, eventFrom } from './normalize.mjs';
import { OSM_SOURCE, OVERPASS_ENDPOINTS, dedupePlaces, marketEvents, overpassQuery, placeFrom } from './osm.mjs';
import { OA_API, OA_SEARCHES, OA_SOURCE, eventsUrl, oaEventsFrom, tr } from './openagenda.mjs';

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

async function loadJSON(url, key) {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j?.[key]) ? j : null;
  } catch {
    return null;
  }
}
const loadPrevious = () => loadJSON(process.env.PREVIOUS_URL, 'events');

// ---------- OpenStreetMap : bars, cafés, marchés… ----------
async function collectPlaces(stat) {
  const body = new URLSearchParams({ data: overpassQuery() });
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, { method: 'POST', body, headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const els = Array.isArray(j?.elements) ? j.elements : [];
      stat.rows = els.length;
      const places = dedupePlaces(els.map(placeFrom).filter(Boolean));
      if (places.length < 100) throw new Error(`seulement ${places.length} lieux`);
      stat.endpoint = endpoint;
      return places;
    } catch (err) {
      stat.errors = [...(stat.errors || []), `${endpoint} : ${err?.message || err}`];
      console.warn(`⚠ Overpass ${endpoint} : ${err?.message || err}`);
    }
  }
  const prev = await loadJSON(process.env.PREVIOUS_PLACES_URL, 'places');
  if (prev) { stat.usedPrevious = true; return prev.places; }
  return [];
}

// ---------- OpenAgenda (facultatif) ----------
async function collectOpenAgenda(key, from, to, stat) {
  const agendas = new Map();
  for (const uid of String(process.env.OPENAGENDA_AGENDAS || '').split(',').map((x) => x.trim()).filter(Boolean)) agendas.set(uid, { uid });
  for (const q of OA_SEARCHES) {
    try {
      const j = await getJSON(`${OA_API}/agendas?key=${encodeURIComponent(key)}&search=${encodeURIComponent(q)}&size=100`, 2);
      for (const a of j?.agendas || []) if (a?.uid && !agendas.has(String(a.uid))) agendas.set(String(a.uid), a);
    } catch (err) {
      stat.errors.push(`recherche « ${q} » : ${err?.message || err}`);
    }
  }
  stat.agendas = agendas.size;
  const out = [];
  let n = 0;
  for (const [uid, agenda] of agendas) {
    if (++n > 80) break; // borne : 80 agendas par collecte
    let after;
    for (let page = 0; page < 10; page++) {
      try {
        const j = await getJSON(eventsUrl(uid, key, after), 2);
        const list = j?.events || [];
        for (const ev of list) {
          const r = oaEventsFrom(ev, agenda, from, to);
          if (r) out.push(r);
        }
        if (!list.length || !j.after || list.length < 300) break;
        after = j.after;
      } catch (err) {
        stat.errors.push(`${tr(agenda.title) || uid} : ${err?.message || err}`);
        break;
      }
      await sleep(150);
    }
    await sleep(150);
  }
  return out;
}

async function main() {
  const now = new Date();
  const from = isoDay(new Date(now.getTime() - DAYS_BACK * 86400000));
  const to = isoDay(new Date(now.getTime() + DAYS_AHEAD * 86400000));
  const report = { startedAt: now.toISOString(), window: { from, to }, sources: [], dropped: {}, categories: {}, unmappedTypes: {}, typeCounts: {} };
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
        {
          const tk = `${source.id}: ${(rec.types_libelles || [rec.categorie_1, rec.categorie_2]).filter(Boolean).join(' | ') || '(aucun type)'} → ${event.category}`;
          report.typeCounts[tk] = (report.typeCounts[tk] || 0) + 1;
        }
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

  // Lieux OpenStreetMap + marchés récurrents (3 semaines à l'avance, pour ne pas noyer l'agenda)
  const osmStat = { id: 'osm', rows: 0, places: 0, markets: 0, marketEvents: 0, marketsNoHours: 0 };
  const places = await collectPlaces(osmStat);
  osmStat.places = places.length;
  const marketTo = isoDay(new Date(now.getTime() + Math.min(DAYS_AHEAD, 21) * 86400000));
  for (const p of places.filter((x) => x.kind === 'marche')) {
    osmStat.markets++;
    const { venue, events: evs } = marketEvents(p, isoDay(now), marketTo);
    if (!evs.length) { osmStat.marketsNoHours++; continue; }
    venues.set(venue.id, venue);
    events.push(...evs);
    osmStat.marketEvents += evs.length;
  }
  report.sources.push(osmStat);
  if (osmStat.marketEvents) sourcesMeta.push({ ...OSM_SOURCE, updatedAt: now.toISOString(), count: osmStat.marketEvents });

  // OpenAgenda, si une clé est configurée
  const oaStat = { id: 'openagenda', enabled: Boolean(process.env.OPENAGENDA_KEY), agendas: 0, kept: 0, errors: [] };
  if (process.env.OPENAGENDA_KEY) {
    for (const { venue, events: evs } of await collectOpenAgenda(process.env.OPENAGENDA_KEY, from, to, oaStat)) {
      if (!venues.has(venue.id)) venues.set(venue.id, venue);
      events.push(...evs);
      oaStat.kept += evs.length;
    }
    oaStat.errors = oaStat.errors.slice(0, 15);
    if (oaStat.kept) sourcesMeta.push({ ...OA_SOURCE, updatedAt: now.toISOString(), count: oaStat.kept });
  }
  report.sources.push(oaStat);

  // les sources officielles passent en premier : en cas de doublon, c'est leur version qui reste
  const rank = { metropole: 0, bibliotheques: 1, openagenda: 2, osm: 3 };
  const unique = dedupe(events.sort((a, b) => a.start.localeCompare(b.start) || (rank[a.source] ?? 9) - (rank[b.source] ?? 9)));
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
  const placesPayload = { generatedAt: now.toISOString(), source: OSM_SOURCE, places: places.sort((a, b) => a.name.localeCompare(b.name, 'fr')) };
  await writeFile(new URL('places.json', OUT_DIR), JSON.stringify(placesPayload));
  report.places = { count: places.length, byKind: places.reduce((m, p) => ({ ...m, [p.kind]: (m[p.kind] || 0) + 1 }), {}), withHours: places.filter((p) => p.hours).length, bytes: JSON.stringify(placesPayload).length };
  report.finishedAt = new Date().toISOString();
  report.bytes = JSON.stringify(payload).length;
  await writeFile(new URL('ingest-report.json', OUT_DIR), JSON.stringify(report, null, 2));
  console.log(`✓ ${payload.events.length} événements, ${payload.venues.length} lieux d'events (${Math.round(report.bytes / 1024)} Ko), ${places.length} lieux OSM`);
  console.log(JSON.stringify({ sources: report.sources, categories: report.categories }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
