import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { catById, venueById } from '../data/catalog';
import type { EventItem } from '../data/types';
import { countdown, dayDiff, fmtDayLong, fmtDayShort, fmtHM, fmtKm, isPast, monthLabel, startOfDay } from '../lib/logic';
import { useDistance } from '../components/events';
import { Avatar, AvatarStack, Empty, Media, Seg, Stars } from '../components/ui';
import { Icon } from '../components/Icon';

type Tab = 'avenir' | 'envies' | 'historique';

export function Agenda() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'avenir';
  const [calendar, setCalendar] = useState(false);
  return (
    <>
      <div className="screen with-tabbar" style={{ paddingBottom: 80 }}>
        <div className="page-top">
          <h1 className="title-xl">Agenda</h1>
          <div className="mt-12">
            <Seg value={tab} onChange={(t) => setParams(t === 'avenir' ? {} : { tab: t })} options={[{ id: 'avenir', label: 'À venir' }, { id: 'envies', label: 'Envies' }, { id: 'historique', label: 'Historique' }]} />
          </div>
        </div>
        <div className="pad mt-8">
          {tab === 'avenir' && (calendar ? <CalendarView /> : <Upcoming />)}
          {tab === 'envies' && <Wishes />}
          {tab === 'historique' && <History />}
        </div>
      </div>
      {tab === 'avenir' && (
        <button className="btn btn-dark" onClick={() => setCalendar(!calendar)} style={{ position: 'absolute', right: 20, bottom: 'calc(var(--tabbar-h) + var(--safe-b) + 14px)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', zIndex: 15 }}>
          <Icon name={calendar ? 'list' : 'calendar'} size={17} /> {calendar ? 'Liste' : 'Calendrier'}
        </button>
      )}
    </>
  );
}

function useMine() {
  const { s, events } = useStore();
  return useMemo(() => {
    const mine = events.filter((e) => s.statuses[e.id]).sort((a, b) => +new Date(a.start) - +new Date(b.start));
    return {
      upcoming: mine.filter((e) => !isPast(e)),
      going: mine.filter((e) => !isPast(e) && s.statuses[e.id] === 'going'),
      wishes: mine.filter((e) => !isPast(e) && s.statuses[e.id] === 'envie'),
      past: mine.filter((e) => isPast(e) && s.statuses[e.id] === 'going').reverse(),
    };
  }, [events, s.statuses]);
}

function Companions({ e }: { e: EventItem }) {
  const { s, person } = useStore();
  const ids = s.companions[e.id] ?? [];
  if (s.statuses[e.id] !== 'going') return null;
  return ids.length ? (
    <div className="tiny" style={{ color: 'var(--purple)', fontWeight: 600 }}>👥 Avec {ids.map((i) => person(i).name).join(', ')}</div>
  ) : (
    <div className="tiny muted">🧍 Seul·e pour l’instant · <Link to={`/event/${e.id}/appel`} className="coral" style={{ fontWeight: 700 }}>Trouver quelqu’un</Link></div>
  );
}

function AgendaRow({ e }: { e: EventItem }) {
  const { s } = useStore();
  const dist = useDistance();
  const st = s.statuses[e.id];
  return (
    <div className="card" style={{ padding: 12 }}>
      <Link to={`/event/${e.id}`} className="row">
        <div style={{ width: 52, textAlign: 'center', borderRight: '1px solid var(--line)', paddingRight: 10, flexShrink: 0 }}>
          <div className="title-s" style={{ fontSize: e.allDay ? 13 : 16 }}>{e.allDay ? 'Journée' : fmtHM(e.start)}</div>
          <div className="tiny muted">{fmtDayShort(e.start).replace("Aujourd'hui", "Auj.")}</div>
        </div>
        <Media event={e} style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} emojiSize={20} />
        <div className="grow">
          <div className="title-s ellipsis" style={{ fontSize: 14 }}>{e.title}</div>
          <div className="tiny muted ellipsis">📍 {venueById(e.venueId).name} · {fmtKm(dist(e))}</div>
        </div>
        <span className={`tag ${st === 'going' ? 'green' : ''}`} style={{ textTransform: 'none', letterSpacing: 0 }}>{st === 'going' ? '✓ J’y vais' : '♡ Envie'}</span>
      </Link>
      {st === 'going' && <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 8 }}><Companions e={e} /></div>}
    </div>
  );
}

function Upcoming() {
  const { s, person } = useStore();
  const { upcoming, going } = useMine();
  const next = going[0];
  const rest = upcoming.filter((e) => e.id !== next?.id);
  const mineCreated = upcoming.filter((e) => e.createdByMe);
  if (!upcoming.length) {
    return <Empty emoji="📅" title="Ton agenda est vide" text="Tape « J’y vais » ou ♡ sur un event pour le retrouver ici." action={<Link to="/explorer" className="btn btn-md btn-primary">Explorer les events</Link>} />;
  }
  // regroupement par jour
  const groups: { label: string; items: EventItem[] }[] = [];
  rest.forEach((e) => {
    const label = dayDiff(new Date(e.start)) < 7 ? 'Cette semaine' : 'Plus tard';
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(e); else groups.push({ label, items: [e] });
  });
  return (
    <>
      {next && (
        <>
          <div className="eyebrow coral mt-8">⏰ Le plus proche</div>
          <Link to={`/event/${next.id}`} className="ticket" style={{ display: 'block', marginTop: 8, borderRadius: 20, overflow: 'hidden' }}>
            <Media event={next} className="shade" style={{ height: 170 }}>
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, padding: 16, color: '#fff', display: 'flex', flexDirection: 'column' }}>
                <div className="row gap-6">
                  <span className="tag solid" style={{ textTransform: 'none', letterSpacing: 0 }}>{countdown(next.start)}</span>
                  {(s.companions[next.id]?.length ?? 0) > 0 && <span className="tag" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', textTransform: 'none', letterSpacing: 0 }}>{s.companions[next.id].length} Buddies avec toi</span>}
                </div>
                <div className="grow" />
                <h3 style={{ fontSize: 19 }}>{next.title}</h3>
                <div className="small" style={{ opacity: 0.8 }}>{fmtDayLong(next.start)} · {fmtHM(next.start)} · {venueById(next.venueId).name}</div>
                <div className="row between mt-8">
                  <div className="stack">{(s.companions[next.id] ?? []).slice(0, 4).map((id) => <Avatar key={id} person={person(id)} size={26} />)}</div>
                  <b className="small">Voir l’event →</b>
                </div>
              </div>
            </Media>
          </Link>
        </>
      )}
      {groups.map((g) => (
        <section key={g.label}>
          <div className="row mt-24" style={{ marginBottom: 10 }}><h2 className="title-s">{g.label}</h2><span className="tiny muted">· {g.items.length} event{g.items.length > 1 ? 's' : ''}</span></div>
          <div className="col">{g.items.map((e) => <AgendaRow key={e.id} e={e} />)}</div>
        </section>
      ))}
      {mineCreated.length > 0 && <p className="tiny muted mt-16">📣 Dont {mineCreated.length} event{mineCreated.length > 1 ? 's' : ''} publié{mineCreated.length > 1 ? 's' : ''} par toi.</p>}
    </>
  );
}

function CalendarView() {
  const { s, events } = useStore();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(startOfDay(new Date()));
  const mine = events.filter((e) => s.statuses[e.id]);
  const first = (month.getDay() + 6) % 7; // lundi = 0
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const on = (d: Date) => mine.filter((e) => startOfDay(new Date(e.start)).getTime() === d.getTime());
  const selected = on(sel);
  return (
    <>
      <div className="card mt-8" style={{ padding: 14 }}>
        <div className="row between">
          <button className="icon-btn" style={{ boxShadow: 'none' }} aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="back" /></button>
          <b className="title-s">{monthLabel(month)}</b>
          <button className="icon-btn" style={{ boxShadow: 'none' }} aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="chevron" /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }} className="mt-8">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="tiny muted" style={{ fontWeight: 700, padding: 4 }}>{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const evs = on(d);
            const isSel = d.getTime() === sel.getTime();
            const today = dayDiff(d) === 0;
            return (
              <button key={i} onClick={() => setSel(d)} aria-label={`${d.getDate()}${evs.length ? `, ${evs.length} event` : ''}`}
                style={{ height: 40, borderRadius: 12, fontWeight: 600, fontSize: 13.5, background: isSel ? 'var(--coral)' : today ? 'var(--coral-light)' : 'transparent', color: isSel ? '#fff' : 'var(--text)', position: 'relative' }}>
                {d.getDate()}
                {evs.length > 0 && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {evs.slice(0, 3).map((e) => <span key={e.id} style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? '#fff' : s.statuses[e.id] === 'going' ? 'var(--green)' : 'var(--coral)' }} />)}
                </span>}
              </button>
            );
          })}
        </div>
      </div>
      <h2 className="title-s mt-24">{fmtDayLong(sel.toISOString())}</h2>
      <div className="col mt-12">
        {selected.map((e) => <AgendaRow key={e.id} e={e} />)}
        {!selected.length && <div className="card small muted" style={{ padding: 16 }}>Rien de prévu ce jour-là. <Link to="/explorer" className="coral" style={{ fontWeight: 700 }}>Explore les events à proximité ?</Link></div>}
      </div>
    </>
  );
}

function Wishes() {
  const { setStatus } = useStore();
  const { wishes } = useMine();
  const dist = useDistance();
  if (!wishes.length) return <Empty emoji="💭" title="Aucune envie pour l’instant" text="Tape ♡ sur un event qui te tente, sans t’engager." action={<Link to="/explorer" className="btn btn-md btn-primary">Explorer</Link>} />;
  return (
    <div className="col gap-14 mt-8">
      <div className="small muted">💭 Events marqués « envie »</div>
      {wishes.map((e) => {
        const left = e.capacity ? e.capacity - e.attendeeCount : 99;
        return (
          <div key={e.id} className="card ticket" style={{ overflow: 'hidden' }}>
            <Link to={`/event/${e.id}`}>
              <Media event={e} className="shade" style={{ height: 120 }}>
                <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 2 }} className="row gap-6">
                  <span className="tag white">{catById(e.category).emoji} {catById(e.category).label}</span>
                  {left < 10 && <span className="tag solid">🔥 Bientôt complet</span>}
                </div>
              </Media>
            </Link>
            <div style={{ padding: 14 }}>
              <b className="title-s">{e.title}</b>
              <div className="tiny muted mt-4">📅 {fmtDayShort(e.start)} · {fmtHM(e.start)} · 📍 {fmtKm(dist(e))}</div>
              <div className="row mt-12">
                <button className="btn btn-md btn-ghost grow" onClick={() => setStatus(e.id, null)}>Retirer</button>
                <button className="btn btn-md btn-primary grow" onClick={() => setStatus(e.id, 'going')}>J’y vais ✓</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function History() {
  const { s, person, rate, sendBuddyRequest } = useStore();
  const { past } = useMine();
  const met = Array.from(new Set(past.flatMap((e) => s.companions[e.id] ?? [])));
  const cats = new Set(past.map((e) => e.category));
  const toAdd = met.filter((m) => !s.buddies.includes(m) && !s.sentRequests.includes(m));
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }} className="mt-8">
        {[[past.length, 'Sorties'], [met.length, 'Buddies rencontrés'], [cats.size, 'Catégories testées']].map(([n, l]) => (
          <div key={l as string} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div className="title-l coral">{n}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
      {toAdd.length > 0 && (
        <div className="card mt-16" style={{ padding: 14 }}>
          <b className="title-s">Ajoute les gens rencontrés 🤝</b>
          <div className="col mt-12">
            {toAdd.map((id) => (
              <div key={id} className="row"><Avatar person={person(id)} size={36} /><b className="grow">{person(id).name}</b><button className="btn btn-sm btn-soft" onClick={() => sendBuddyRequest(id)}>+ Ajouter</button></div>
            ))}
          </div>
        </div>
      )}
      <div className="col mt-16">
        {past.map((e) => (
          <div key={e.id} className="card" style={{ padding: 12 }}>
            <Link to={`/event/${e.id}`} className="row">
              <Media event={e} style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, filter: 'saturate(0.7)' }} emojiSize={22} />
              <div className="grow">
                <b className="title-s ellipsis" style={{ fontSize: 14, display: 'block' }}>{e.title}</b>
                <div className="tiny muted">{fmtDayLong(e.start)} · {venueById(e.venueId).name}</div>
              </div>
              <AvatarStack ids={s.companions[e.id] ?? []} size={24} max={3} />
            </Link>
            <div className="row between mt-8" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
              <span className="tiny muted">{s.ratings[e.id] ? 'Noté' : 'Comment c’était ?'}</span>
              <Stars value={s.ratings[e.id] ?? 0} onChange={(n) => rate(e.id, n)} size={20} />
            </div>
          </div>
        ))}
        {!past.length && <Empty emoji="🗂️" title="Pas encore de sortie passée" text="Tes sorties apparaîtront ici après coup." />}
      </div>
    </>
  );
}
