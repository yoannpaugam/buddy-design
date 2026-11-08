import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/store';
import { PLACE_KINDS, kindById, venueById } from '../data/catalog';
import type { EventItem, Place, PlaceKind } from '../data/types';
import { collapseSeries, fmtKm, isPast, kmBetween, timeLabel, fmtDayShort, walkMin } from '../lib/logic';
import { fmtMinutes, openState, parseOpeningHours, weekTable } from '../lib/openingHours.mjs';
import { Empty, Seg, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';

// ---------- Horaires ----------
const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const rulesCache = new Map<string, ReturnType<typeof parseOpeningHours>>();
const rulesOf = (p: Place) => {
  if (!p.hours) return null;
  if (!rulesCache.has(p.hours)) rulesCache.set(p.hours, parseOpeningHours(p.hours));
  return rulesCache.get(p.hours) ?? null;
};

export function placeStatus(p: Place, at = new Date()): { open: boolean | null; text: string } {
  const st = openState(rulesOf(p), at);
  if (!st) return { open: null, text: p.hours ? 'Voir les horaires' : 'Horaires non renseignés' };
  if (st.open) return { open: true, text: `Ouvert · jusqu’à ${fmtMinutes(st.until ?? 0)}` };
  if (st.opensAt == null) return { open: false, text: 'Fermé' };
  const when = !st.inDays ? '' : st.inDays === 1 ? 'demain ' : `${DAYS_FR[st.weekday ?? 0]} `;
  return { open: false, text: `Fermé · ouvre ${when}à ${fmtMinutes(st.opensAt)}` };
}

function StatusLine({ p, className = 'tiny' }: { p: Place; className?: string }) {
  const st = placeStatus(p);
  const color = st.open === true ? 'var(--green-dark)' : st.open === false ? 'var(--coral)' : 'var(--muted)';
  return <span className={className} style={{ color, fontWeight: 600 }}>{st.open === true ? '● ' : ''}{st.text}</span>;
}

// ---------- Onglets Explorer ----------
export function ExploreTabs() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') === 'lieux' ? 'lieux' : 'events';
  return (
    <Seg value={tab} options={[{ id: 'events', label: '🎟️ Événements' }, { id: 'lieux', label: '🍻 Lieux' }]}
      onChange={(v) => setParams(v === 'lieux' ? { onglet: 'lieux' } : {})} />
  );
}

// ---------- Recherche de lieux ----------
interface PlaceFilters { q: string; kinds: PlaceKind[]; openNow: boolean; terrace: boolean; pmr: boolean }
const EMPTY: PlaceFilters = { q: '', kinds: [], openNow: false, terrace: false, pmr: false };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

let lastFilters: PlaceFilters = EMPTY; // conservé entre liste et carte pendant la session

function usePlaceResults(f: PlaceFilters) {
  const { s, places } = useStore();
  return useMemo(() => {
    const q = norm(f.q.trim());
    const now = new Date();
    return places
      .filter((p) => !f.kinds.length || f.kinds.includes(p.kind))
      .filter((p) => !q || norm(`${p.name} ${p.address ?? ''} ${kindById(p.kind).label}`).includes(q))
      .filter((p) => !f.terrace || p.terrace)
      .filter((p) => !f.pmr || p.pmr === 'yes')
      .filter((p) => !f.openNow || placeStatus(p, now).open === true)
      .map((p) => ({ p, km: kmBetween(s.user, p) }))
      .sort((a, b) => a.km - b.km);
  }, [places, f, s.user]);
}

function PlaceFiltersBar({ f, set }: { f: PlaceFilters; set: (f: PlaceFilters) => void }) {
  const toggleKind = (k: PlaceKind) => set({ ...f, kinds: f.kinds.includes(k) ? f.kinds.filter((x) => x !== k) : [...f.kinds, k] });
  return (
    <>
      <div className="hscroll" style={{ paddingTop: 12 }}>
        <button className={`chip ${f.openNow ? 'on' : ''}`} onClick={() => set({ ...f, openNow: !f.openNow })}>● Ouvert maintenant</button>
        <button className={`chip ${f.terrace ? 'on' : ''}`} onClick={() => set({ ...f, terrace: !f.terrace })}>🌞 Terrasse</button>
        <button className={`chip ${f.pmr ? 'on' : ''}`} onClick={() => set({ ...f, pmr: !f.pmr })}>♿ Accessible</button>
      </div>
      <div className="hscroll" style={{ paddingTop: 4 }}>
        {PLACE_KINDS.map((k) => (
          <button key={k.id} className={`chip dark-on ${f.kinds.includes(k.id) ? 'on' : ''}`} onClick={() => toggleKind(k.id)}>{k.emoji} {k.plural}</button>
        ))}
      </div>
    </>
  );
}

function PlaceSearch({ f, set, floating }: { f: PlaceFilters; set: (f: PlaceFilters) => void; floating?: boolean }) {
  return (
    <div className="search" style={floating ? { boxShadow: 'var(--shadow-lg)' } : undefined}>
      <Icon name="search" size={18} className="muted" />
      <input value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} placeholder="Un bar, un café, un marché…" aria-label="Rechercher un lieu" type="search" />
      {f.q && <button aria-label="Effacer" className="muted" onClick={() => set({ ...f, q: '' })}><Icon name="close" size={16} /></button>}
    </div>
  );
}

function KindBadge({ p, size = 48 }: { p: Place; size?: number }) {
  const k = kindById(p.kind);
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.48, background: `linear-gradient(140deg, ${k.color}, #1a1a2e 140%)` }}>{k.emoji}</span>
  );
}

export function PlaceRow({ p, km }: { p: Place; km: number }) {
  const k = kindById(p.kind);
  return (
    <Link to={`/lieu/${p.id}`} className="card row" style={{ padding: 12 }}>
      <KindBadge p={p} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="title-s ellipsis" style={{ fontSize: 15 }}>{p.name}</div>
        <div className="tiny muted ellipsis">{p.venueType ?? k.label} · {fmtKm(km)}{p.terrace ? ' · 🌞 terrasse' : ''}{p.pmr === 'yes' ? ' · ♿' : ''}</div>
        <div className="mt-4"><StatusLine p={p} /></div>
      </div>
      <Icon name="chevron" size={18} />
    </Link>
  );
}

const PAGE = 30;

export function PlacesExplore() {
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState<PlaceFilters>(lastFilters);
  const set = (x: PlaceFilters) => { lastFilters = x; setF(x); };
  const map = params.get('vue') === 'carte';
  return map
    ? <PlacesMap f={f} set={set} onList={() => setParams({ onglet: 'lieux' })} />
    : <PlacesList f={f} set={set} onMap={() => setParams({ onglet: 'lieux', vue: 'carte' })} />;
}

function PlacesList({ f, set, onMap }: { f: PlaceFilters; set: (f: PlaceFilters) => void; onMap: () => void }) {
  const { placesStatus } = useStore();
  const results = usePlaceResults(f);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [f]);
  const active = f.kinds.length + Number(f.openNow) + Number(f.terrace) + Number(f.pmr) + Number(!!f.q);
  return (
    <>
      <div className="screen with-tabbar" style={{ paddingBottom: 80 }}>
        <div className="page-top">
          <div className="row between">
            <h1 className="title-xl">Explorer</h1>
            <Link to="/publier" className="btn btn-sm btn-soft"><Icon name="plus" size={16} /> Publier</Link>
          </div>
          <div className="mt-12"><ExploreTabs /></div>
          <div className="mt-12"><PlaceSearch f={f} set={set} /></div>
        </div>
        <PlaceFiltersBar f={f} set={set} />
        <div className="pad mt-12">
          <div className="row between">
            <div className="small muted"><b style={{ color: 'var(--text)' }}>{results.length} lieu{results.length > 1 ? 'x' : ''}</b> · du plus proche au plus loin</div>
            {active > 0 && <button className="link small" style={{ color: 'var(--muted)' }} onClick={() => set(EMPTY)}>Tout effacer</button>}
          </div>
          {placesStatus === 'loading' && <div className="small muted mt-16">Chargement des lieux…</div>}
          {placesStatus === 'error' && <div className="banner mt-16">Les lieux n’ont pas pu être chargés. Vérifie ta connexion.</div>}
          <div className="col gap-8 mt-16">
            {results.slice(0, shown).map(({ p, km }) => <PlaceRow key={p.id} p={p} km={km} />)}
            {results.length > shown && (
              <button className="btn btn-ghost btn-block" onClick={() => setShown((n) => n + PAGE)}>Voir plus de lieux ({results.length - shown} restants)</button>
            )}
            {placesStatus === 'ready' && !results.length && (
              <Empty emoji="🍻" title="Aucun lieu avec ces critères" text={f.openNow ? 'Rien d’ouvert pour l’instant avec ces filtres. Retire « Ouvert maintenant » pour tout voir.' : 'Retire un filtre ou change ta recherche.'} />
            )}
          </div>
          <p className="tiny muted mt-24" style={{ textAlign: 'center' }}>
            Lieux et horaires : © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>contributeurs OpenStreetMap</a>. Une erreur ? Corrige-la directement sur OpenStreetMap.
          </p>
        </div>
      </div>
      <button className="btn btn-dark" onClick={onMap} style={{ position: 'absolute', right: 20, bottom: 'calc(var(--tabbar-h) + var(--safe-b) + 14px)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', zIndex: 15 }}>
        <Icon name="map" size={18} /> Carte
      </button>
    </>
  );
}

const placeIcon = (p: Place, active: boolean) => {
  const k = kindById(p.kind);
  const open = placeStatus(p).open;
  return L.divIcon({
    className: '',
    html: `<div class="place-dot ${active ? 'active' : ''} ${open === false ? 'closed' : ''}" style="--c:${k.color}">${k.emoji}</div>`,
    iconSize: [0, 0],
  });
};
const meIcon = L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [0, 0] });

function Pan({ to }: { to?: [number, number] }) {
  const map = useMap();
  useEffect(() => { if (to) map.panTo(to, { animate: true }); }, [to?.[0], to?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function PlacesMap({ f, set, onList }: { f: PlaceFilters; set: (f: PlaceFilters) => void; onList: () => void }) {
  const { s } = useStore();
  const all = usePlaceResults(f);
  const shown = all.slice(0, 250);
  const [active, setActive] = useState<string | undefined>();
  const me: [number, number] = [s.user.lat, s.user.lng];
  const act = shown.find((x) => x.p.id === active);
  const tiles = s.settings.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  return (
    <div className="screen" style={{ overflow: 'hidden' }}>
      <MapContainer center={me} zoom={15} zoomControl={false} style={{ position: 'absolute', inset: 0 }}>
        <TileLayer url={tiles} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>' />
        <Marker position={me} icon={meIcon} interactive={false} />
        {shown.map(({ p }) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={placeIcon(p, p.id === active)} zIndexOffset={p.id === active ? 1000 : 0} eventHandlers={{ click: () => setActive(p.id) }} />
        ))}
        <Pan to={act ? [act.p.lat, act.p.lng] : undefined} />
      </MapContainer>
      <div className="map-overlay" style={{ top: 0, padding: 'calc(14px + var(--safe-t)) 20px 0' }}>
        <div className="row gap-8">
          <button className="icon-btn" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }} aria-label="Retour à la liste" onClick={onList}><Icon name="back" /></button>
          <div className="grow"><PlaceSearch f={f} set={set} floating /></div>
        </div>
      </div>
      <div className="map-overlay" style={{ top: 'calc(64px + var(--safe-t))' }}><PlaceFiltersBar f={f} set={set} /></div>
      <div className="map-overlay" style={{ bottom: 12, padding: '0 16px' }}>
        <div className="row" style={{ justifyContent: 'flex-end', paddingBottom: 10 }}>
          <button className="btn btn-md btn-dark" style={{ borderRadius: 22, boxShadow: 'var(--shadow-lg)' }} onClick={onList}>
            <Icon name="list" size={17} /> {all.length} lieu{all.length > 1 ? 'x' : ''}
          </button>
        </div>
        {act ? <PlaceRow p={act.p} km={act.km} /> : <div className="card small muted" style={{ padding: 14 }}>Touche un lieu sur la carte pour voir ses horaires.{all.length > shown.length ? ` Les ${shown.length} plus proches sont affichés.` : ''}</div>}
      </div>
    </div>
  );
}

// ---------- Fiche lieu ----------
export function PlaceDetail() {
  const { id = '' } = useParams();
  const { s, placeById, places, placesStatus, events } = useStore();
  const nav = useNavigate();
  const p = placeById(id);
  const here = useMemo(() => {
    if (!p) return [] as EventItem[];
    const list = events.filter((e) => !isPast(e) && e.status !== 'cancelled' && kmBetween(venueById(e.venueId), p) < 0.06);
    return collapseSeries(list.sort((a, b) => +new Date(a.start) - +new Date(b.start))).map((x) => x.e).slice(0, 6);
  }, [p, events]);
  const nearby = useMemo(() => (p ? places.filter((q) => q.id !== p.id && q.kind !== 'marche' && kmBetween(p, q) < 0.4).map((q) => ({ p: q, km: kmBetween(s.user, q) })).sort((a, b) => kmBetween(p, a.p) - kmBetween(p, b.p)).slice(0, 4) : []), [p, places, s.user]);

  if (!p) {
    return (
      <div className="screen">
        <TopBar title="Lieu" />
        {placesStatus === 'loading' ? <div className="pad small muted">Chargement…</div> : <Empty emoji="🤷" title="Ce lieu n’existe plus" text="Il a peut-être fermé ou changé de nom." action={<button className="btn btn-md btn-dark" onClick={() => nav('/explorer?onglet=lieux')}>Voir les lieux</button>} />}
      </div>
    );
  }
  const k = kindById(p.kind);
  const km = kmBetween(s.user, p);
  const table = weekTable(rulesOf(p));
  const [osmType, osmId] = [{ n: 'node', w: 'way', r: 'relation' }[p.id[4]] ?? 'node', p.id.slice(5)];
  const tiles = s.settings.dark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="screen" style={{ paddingBottom: 40 }}>
      <div style={{ position: 'relative', height: 200 }}>
        <MapContainer center={[p.lat, p.lng]} zoom={16} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl={false} style={{ position: 'absolute', inset: 0 }}>
          <TileLayer url={tiles} />
          <Marker position={[p.lat, p.lng]} icon={placeIcon(p, true)} interactive={false} />
        </MapContainer>
        <div style={{ position: 'absolute', top: 'calc(12px + var(--safe-t))', left: 16, zIndex: 500 }}>
          <button className="icon-btn" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }} aria-label="Retour" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/explorer?onglet=lieux'))}><Icon name="back" /></button>
        </div>
      </div>
      <div className="pad" style={{ marginTop: -28, position: 'relative', zIndex: 600 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <KindBadge p={p} size={52} />
            <div className="grow">
              <span className="tag" style={{ background: 'var(--surface-2)', color: k.color }}>{p.venueType ?? k.label}</span>
              <h1 className="title-l mt-4" style={{ fontSize: 22 }}>{p.name}</h1>
              <div className="small muted">{p.address ? `${p.address} · ` : ''}{fmtKm(km)} · {walkMin(km)} min à pied</div>
              <div className="mt-8"><StatusLine p={p} className="small" /></div>
            </div>
          </div>
          <div className="row wrap gap-8 mt-12">
            <a className="btn btn-sm btn-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`} target="_blank" rel="noreferrer">Itinéraire</a>
            {p.website && <a className="btn btn-sm btn-soft" href={p.website} target="_blank" rel="noreferrer">Site web ↗</a>}
            {p.phone && <a className="btn btn-sm btn-soft" href={`tel:${p.phone.replace(/\s+/g, '')}`}>Appeler</a>}
          </div>
        </div>

        <div className="row wrap gap-8 mt-16">
          {p.terrace && <span className="tag amber">🌞 Terrasse</span>}
          {p.pmr === 'yes' && <span className="tag green">♿ Accessible PMR</span>}
          {p.pmr === 'limited' && <span className="tag gray">♿ Accès partiel</span>}
          {p.craftBeer && <span className="tag amber">🍺 Bières artisanales</span>}
          {p.liveMusic && <span className="tag purple">🎶 Musique live</span>}
          {p.sports && <span className="tag gray">📺 Diffuse le sport</span>}
          {p.tags?.includes('producteurs') && <span className="tag green">🥕 Producteurs</span>}
          {p.tags?.includes('bio') && <span className="tag green">🌱 Bio</span>}
          {p.tags?.includes('couvert') && <span className="tag gray">🏠 Couvert</span>}
          {p.tags?.includes('brocante') && <span className="tag amber">🪑 Brocante</span>}
        </div>

        {p.description && <p className="mt-16" style={{ lineHeight: 1.6, fontSize: 14.5 }}>{p.description}</p>}
        {p.happyHours && <div className="banner coral mt-16">🍻 <span><b>Happy hour</b> · {p.happyHours}</span></div>}

        <div className="divider" />
        <h2 className="title-m">Horaires</h2>
        {table ? (
          <div className="card mt-12" style={{ padding: '4px 0' }}>
            {table.map((r, i) => (
              <div key={i} className="row between" style={{ padding: '9px 16px', fontWeight: i === 0 ? 700 : 400, borderTop: i ? '1px solid var(--line)' : undefined }}>
                <span className="small">{r.label}</span><span className="small" style={{ color: r.text === 'Fermé' ? 'var(--muted)' : undefined }}>{r.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted mt-8">{p.hours ? `Horaires indiqués : ${p.hours}` : 'Horaires non renseignés. Pense à vérifier avant d’y aller.'}</p>
        )}

        {here.length > 0 && (
          <>
            <div className="divider" />
            <h2 className="title-m">À l’affiche ici</h2>
            <div className="col gap-8 mt-12">
              {here.map((e) => (
                <Link key={e.id} to={`/event/${e.id}`} className="card row" style={{ padding: 12 }}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title-s ellipsis" style={{ fontSize: 14 }}>{e.title}</div>
                    <div className="tiny muted">{fmtDayShort(e.start)} · {timeLabel(e)}</div>
                  </div>
                  <Icon name="chevron" size={18} />
                </Link>
              ))}
            </div>
          </>
        )}

        {nearby.length > 0 && (
          <>
            <div className="divider" />
            <h2 className="title-m">Juste à côté</h2>
            <div className="col gap-8 mt-12">{nearby.map(({ p: q, km: d }) => <PlaceRow key={q.id} p={q} km={d} />)}</div>
          </>
        )}

        <div className="card mt-24" style={{ padding: 14 }}>
          <div className="small"><b>Source :</b> OpenStreetMap · ODbL</div>
          <div className="tiny muted mt-4">Infos saisies par les contributeurs d’OpenStreetMap. Horaires indicatifs : vérifie avant de te déplacer.</div>
          <a className="link mt-8" style={{ display: 'inline-block' }} href={`https://www.openstreetmap.org/${osmType}/${osmId}`} target="_blank" rel="noreferrer">Voir ou corriger sur OpenStreetMap ↗</a>
        </div>
      </div>
    </div>
  );
}

/** Rubrique d'accueil : lieux ouverts autour de l'utilisateur. */
export function OpenNowRow() {
  const { s, places } = useStore();
  const list = useMemo(() => {
    const now = new Date();
    return places
      .filter((p) => p.kind !== 'marche' && placeStatus(p, now).open === true)
      .map((p) => ({ p, km: kmBetween(s.user, p) }))
      .filter((x) => x.km < 3)
      .sort((a, b) => a.km - b.km)
      .slice(0, 10);
  }, [places, s.user]);
  if (list.length < 3) return null;
  return (
    <>
      <div className="section-head">
        <h2 className="title-m">Ouvert maintenant près de toi</h2>
        <Link to="/explorer?onglet=lieux" className="link" onClick={() => { lastFilters = { ...EMPTY, openNow: true }; }}>Tout voir</Link>
      </div>
      <div className="hscroll">
        {list.map(({ p, km }) => (
          <Link key={p.id} to={`/lieu/${p.id}`} className="card" style={{ width: 170, padding: 12 }}>
            <KindBadge p={p} size={40} />
            <div className="title-s ellipsis mt-8" style={{ fontSize: 14 }}>{p.name}</div>
            <div className="tiny muted ellipsis">{p.venueType ?? kindById(p.kind).label} · {fmtKm(km)}{p.terrace ? ' · 🌞' : ''}</div>
            <div className="mt-4"><StatusLine p={p} /></div>
          </Link>
        ))}
      </div>
    </>
  );
}
