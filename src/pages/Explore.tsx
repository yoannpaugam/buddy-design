import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/store';
import { CATEGORIES, catById, venueById } from '../data/catalog';
import type { EventItem, Filters } from '../data/types';
import { activeFilterCount, collapseSeries, filterSummary, fmtKm, matches, priceLabel, timeLabel } from '../lib/logic';
import { EventCard, useDistance } from '../components/events';
import { Empty, Media } from '../components/ui';
import { FeedState } from '../components/FeedState';
import { Icon } from '../components/Icon';

const DATES: { id: Filters['date']; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'tomorrow', label: 'Demain' },
  { id: 'weekend', label: 'Week-end' },
  { id: 'week', label: 'Cette semaine' },
];

export function useResults() {
  const { s, events } = useStore();
  const dist = useDistance();
  return useMemo(
    () => events.filter((e) => matches(e, s.filters, s.user)).sort((a, b) => +new Date(a.start) - +new Date(b.start) || dist(a) - dist(b)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, s.filters, s.user],
  );
}

function SearchBar({ floating }: { floating?: boolean }) {
  const { s, setFilters } = useStore();
  const n = activeFilterCount(s.filters);
  return (
    <div className="search" style={floating ? { boxShadow: 'var(--shadow-lg)' } : undefined}>
      <Icon name="search" size={18} className="muted" />
      <input value={s.filters.query} onChange={(e) => setFilters({ query: e.target.value })} placeholder="Rechercher un event, un lieu…" aria-label="Rechercher" type="search" />
      {s.filters.query && <button aria-label="Effacer" className="muted" onClick={() => setFilters({ query: '' })}><Icon name="close" size={16} /></button>}
      <Link to="/filtres" className="filter-btn" aria-label={`Filtres${n ? ` (${n} actifs)` : ''}`}>
        <Icon name="filter" size={18} />
        {n > 0 && <span className="badge">{n}</span>}
      </Link>
    </div>
  );
}

function DatePills() {
  const { s, setFilters } = useStore();
  return (
    <div className="hscroll" style={{ paddingTop: 12 }}>
      {DATES.map((d) => (
        <button key={d.id} className={`chip ${s.filters.date === d.id ? 'on' : ''}`} onClick={() => setFilters({ date: d.id })}>{d.label}</button>
      ))}
    </div>
  );
}

export function Explore() {
  const [params, setParams] = useSearchParams();
  const view = params.get('vue') === 'carte' ? 'map' : 'list';
  return view === 'map' ? <MapView onList={() => setParams({})} /> : <ListView onMap={() => setParams({ vue: 'carte' })} />;
}

const PAGE = 25;

function ListView({ onMap }: { onMap: () => void }) {
  const { s, setFilters, saveAlert, feed } = useStore();
  const feedReady = feed.status === 'ready';
  const results = useResults();
  const grouped = useMemo(() => collapseSeries(results), [results]);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [s.filters]);
  const toggleCat = (id: EventItem['category']) =>
    setFilters({ categories: s.filters.categories.includes(id) ? s.filters.categories.filter((c) => c !== id) : [...s.filters.categories, id] });
  const n = activeFilterCount(s.filters);

  return (
    <>
    <div className="screen with-tabbar" style={{ paddingBottom: 80 }}>
      <div className="page-top">
        <div className="row between">
          <h1 className="title-xl">Explorer</h1>
          <Link to="/publier" className="btn btn-sm btn-soft"><Icon name="plus" size={16} /> Publier</Link>
        </div>
        <div className="mt-12"><SearchBar /></div>
      </div>
      <DatePills />
      <div className="hscroll" style={{ paddingTop: 4 }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip dark-on ${s.filters.categories.includes(c.id) ? 'on' : ''}`} onClick={() => toggleCat(c.id)}>{c.emoji} {c.label}</button>
        ))}
      </div>

      <div className="pad mt-12">
        <div className="row between">
          <div className="small muted"><b style={{ color: 'var(--text)' }}>{grouped.length} event{grouped.length > 1 ? 's' : ''}</b>{results.length > grouped.length ? ` (${results.length} dates)` : ''} · {filterSummary(s.filters)}</div>
        </div>
        {n > 0 && (
          <div className="row gap-8 mt-8">
            <button className="link" onClick={() => saveAlert(filterSummary(s.filters))}>🔔 Créer une alerte</button>
            <span className="muted">·</span>
            <button className="link" style={{ color: 'var(--muted)' }} onClick={() => setFilters({ date: 'all', hourFrom: 0, hourTo: 24, maxKm: 30, freeOnly: false, maxPrice: 100, categories: [], pmr: false, query: '' })}>Tout effacer</button>
          </div>
        )}
        <FeedState />
        <div className="col gap-14 mt-16">
          {grouped.slice(0, shown).map(({ e, more }) => <EventCard key={e.id} e={e} more={more} />)}
          {grouped.length > shown && (
            <button className="btn btn-ghost btn-block" onClick={() => setShown((n) => n + PAGE)}>Voir plus d’events ({grouped.length - shown} restants)</button>
          )}
          {!results.length && feedReady && (
            <Empty emoji="🔭" title="Aucun event avec ces critères" text="Élargis la distance, change de date ou retire un filtre."
              action={<Link to="/filtres" className="btn btn-md btn-dark">Modifier les filtres</Link>} />
          )}
        </div>
      </div>

    </div>
    <button className="btn btn-dark" onClick={onMap} style={{ position: 'absolute', right: 20, bottom: 'calc(var(--tabbar-h) + var(--safe-b) + 14px)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', zIndex: 15 }}>
      <Icon name="map" size={18} /> Carte
    </button>
    </>
  );
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function pinIcon(e: EventItem, state: 'active' | 'dim' | 'normal') {
  const c = catById(e.category);
  const label = state === 'active' ? esc(e.title.split(' — ')[0].slice(0, 22)) : priceLabel(e.price);
  return L.divIcon({ className: '', html: `<div class="pin ${state}"><span>${c.emoji}</span>${label}</div>`, iconSize: [0, 0] });
}
const meIcon = L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [0, 0] });

function MapController({ target }: { target?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.panTo(target, { animate: true });
  }, [target?.[0], target?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ZoomButtons({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <div style={{ position: 'absolute', right: 16, top: 150, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button className="icon-btn" aria-label="Zoomer" onClick={() => map.zoomIn()}><Icon name="zoomin" /></button>
      <button className="icon-btn" aria-label="Dézoomer" onClick={() => map.zoomOut()}><Icon name="zoomout" /></button>
      <button className="icon-btn" aria-label="Recentrer sur moi" onClick={() => map.setView(center, 14)}><Icon name="locate" /></button>
    </div>
  );
}

function MapView({ onList }: { onList: () => void }) {
  const { s } = useStore();
  const all = useResults();
  const dist = useDistance();
  // une épingle par événement (première date), les 150 plus proches pour rester fluide
  const results = useMemo(() => collapseSeries(all).map((x) => x.e).sort((a, b) => dist(a) - dist(b)).slice(0, 150), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const [active, setActive] = useState<string | undefined>(results[0]?.id);
  const strip = useRef<HTMLDivElement>(null);
  const me: [number, number] = [s.user.lat, s.user.lng];
  const act = results.find((r) => r.id === active);
  const actPos: [number, number] | undefined = act ? [venueById(act.venueId).lat, venueById(act.venueId).lng] : undefined;

  // synchronisation scroll des mini-cards → pin actif
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((x) => x.isIntersecting && x.intersectionRatio > 0.7);
        if (vis[0]) setActive((vis[0].target as HTMLElement).dataset.id);
      },
      { root: el, threshold: [0.7] },
    );
    el.querySelectorAll('[data-id]').forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [results]);

  const selectPin = (id: string) => {
    setActive(id);
    strip.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const tiles = s.settings.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="screen" style={{ overflow: 'hidden' }}>
      <MapContainer center={me} zoom={14} zoomControl={false} style={{ position: 'absolute', inset: 0 }} attributionControl>
        <TileLayer url={tiles} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>' />
        <Marker position={me} icon={meIcon} interactive={false} />
        {results.map((e) => {
          const v = venueById(e.venueId);
          return (
            <Marker key={e.id} position={[v.lat, v.lng]} icon={pinIcon(e, active ? (e.id === active ? 'active' : 'dim') : 'normal')}
              zIndexOffset={e.id === active ? 1000 : 0} eventHandlers={{ click: () => selectPin(e.id) }} />
          );
        })}
        {actPos && <Polyline positions={[me, actPos]} pathOptions={{ color: '#FF5C57', weight: 3, dashArray: '6 8' }} />}
        <MapController target={actPos} />
        <ZoomButtons center={me} />
      </MapContainer>

      <div className="map-overlay" style={{ top: 0, padding: 'calc(14px + var(--safe-t)) 20px 0' }}>
        <SearchBar floating />
      </div>
      <div className="map-overlay" style={{ top: 'calc(70px + var(--safe-t))' }}><DatePills /></div>

      <div className="map-overlay" style={{ bottom: 12 }}>
        <div className="row" style={{ justifyContent: 'flex-end', padding: '0 20px 10px' }}>
          <button className="btn btn-md btn-dark" style={{ borderRadius: 22, boxShadow: 'var(--shadow-lg)' }} onClick={onList}>
            <Icon name="list" size={17} /> {collapseSeries(all).length} évènement{all.length > 1 ? 's' : ''}
          </button>
        </div>
        <div className="hscroll" ref={strip} style={{ paddingBottom: 8 }}>
          {results.map((e) => (
            <Link key={e.id} data-id={e.id} to={`/event/${e.id}`} className={`mini-card ${e.id === active ? 'on' : ''}`}>
              <Media event={e} emojiSize={28} />
              <div className="grow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                <div className="row gap-6"><span className="tag">{catById(e.category).label}</span><b className="small" style={{ color: e.price ? 'var(--text)' : 'var(--green-dark)' }}>{priceLabel(e.price)}</b></div>
                <div className="title-s ellipsis" style={{ fontSize: 14 }}>{e.title}</div>
                <div className="tiny muted">🕐 {timeLabel(e)} · 📍 {fmtKm(dist(e))}</div>
              </div>
            </Link>
          ))}
          {!results.length && <div className="card" style={{ padding: 16, width: 280 }}><b>Aucun event ici</b><div className="small muted">Modifie tes filtres pour élargir.</div></div>}
        </div>
      </div>
    </div>
  );
}
