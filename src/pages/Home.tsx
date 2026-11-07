import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { CATEGORIES, CITIES, catById, venueById } from '../data/catalog';
import { Avatar, Media, Sheet } from '../components/ui';
import { Poster, useDistance } from '../components/events';
import { Icon } from '../components/Icon';
import { dayDiff, fmtKm, fmtTime, fmtToday, inDateRange, isPast, priceLabel, DEFAULT_FILTERS } from '../lib/logic';
import type { EventItem } from '../data/types';

export function Home() {
  const { s, events, person, setStatus, setFilters, updateUser } = useStore();
  const nav = useNavigate();
  const dist = useDistance();
  const [menu, setMenu] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const upcoming = useMemo(
    () => events.filter((e) => !isPast(e)).sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [events],
  );
  const score = (e: EventItem) => (s.user.interests.includes(e.category) ? 10 : 0) - dist(e) + e.attendees.filter((a) => s.buddies.includes(a)).length * 2;

  const tonight = upcoming.filter((e) => dayDiff(new Date(e.start)) === 0);
  const hero = [...(tonight.length ? tonight : upcoming.slice(0, 5))].sort((a, b) => score(b) - score(a))[0];
  const week = upcoming.filter((e) => dayDiff(new Date(e.start)) < 7 && e.id !== hero?.id).sort((a, b) => score(b) - score(a));
  const mine = upcoming.filter((e) => s.statuses[e.id] === 'going');
  const buddyEvents = upcoming
    .map((e) => ({ e, b: e.attendees.find((a) => s.buddies.includes(a)) }))
    .filter((x): x is { e: EventItem; b: string } => !!x.b)
    .slice(0, 6);
  const freeWeekend = upcoming.filter((e) => e.price === 0 && inDateRange(e, 'weekend'));
  const calls = s.calls.filter((c) => c.authorId !== 'me' && upcoming.some((e) => e.id === c.eventId)).slice(0, 4);
  const unreadNotifs = s.notifications.filter((n) => !n.read).length;
  const st = hero ? s.statuses[hero.id] : undefined;

  const goCategory = (id: string) => {
    setFilters({ ...DEFAULT_FILTERS, categories: [id as EventItem['category']] });
    nav('/explorer');
  };

  return (
    <div className="screen with-tabbar">
      <div className="dark-head" style={{ paddingBottom: 26 }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            <button className="small row gap-4" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => setCityOpen(true)}>
              {fmtToday()} · <Icon name="pin" size={13} /> <b style={{ color: '#fff' }}>{s.user.city}</b> <Icon name="down" size={14} />
            </button>
            <h1 className="title-l mt-4" style={{ color: '#fff' }}>Salut {s.user.name} 👋</h1>
          </div>
          <div className="row gap-8">
            <Link to="/notifications" className="icon-btn glass" aria-label={`Notifications${unreadNotifs ? `, ${unreadNotifs} non lues` : ''}`} style={{ position: 'relative' }}>
              <Icon name="bell" size={19} />
              {unreadNotifs > 0 && <span className="badge" style={{ position: 'absolute', top: -3, right: -3 }}>{unreadNotifs}</span>}
            </Link>
            <button onClick={() => setMenu(true)} aria-label="Mon profil"><Avatar person={{ name: s.user.name, color: s.user.color }} size={42} /></button>
          </div>
        </div>

        {hero && (
          <Link to={`/event/${hero.id}`} className="ticket" style={{ display: 'block', marginTop: 20, borderRadius: 20, overflow: 'hidden' }}>
            <Media event={hero} className="shade" style={{ height: 230 }} emojiSize={70}>
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff' }}>
                <span className="tag solid" style={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: 12, letterSpacing: 0 }}>🔥 Coup de cœur {tonight.length ? 'ce soir' : 'du moment'}</span>
                <h2 className="mt-8" style={{ fontSize: 21, lineHeight: 1.2 }}>{hero.title}</h2>
                <div className="small mt-4" style={{ opacity: 0.85 }}>{fmtTime(hero.start)} · {venueById(hero.venueId).name} · {fmtKm(dist(hero))} · {priceLabel(hero.price)}</div>
                <div className="row mt-12" onClick={(ev) => ev.preventDefault()}>
                  <button className={`btn btn-md ${st === 'going' ? 'btn-success' : 'btn-white'}`} onClick={() => setStatus(hero.id, st === 'going' ? null : 'going')}>{st === 'going' ? '✓ Tu y vas' : 'J’y vais'}</button>
                  <button className="btn btn-md btn-glass" onClick={() => nav(`/event/${hero.id}/appel`)}>👋 Qui vient ?</button>
                </div>
              </div>
            </Media>
          </Link>
        )}
      </div>

      <Row title="Que faire cette semaine ?" to="/explorer" onAll={() => setFilters({ ...DEFAULT_FILTERS, date: 'week' })}>
        {week.slice(0, 8).map((e) => <Poster key={e.id} e={e} />)}
      </Row>

      {calls.length > 0 && (
        <>
          <div className="section-head"><h2 className="title-m">Ils cherchent quelqu’un 👋</h2></div>
          <div className="hscroll">
            {calls.map((c) => {
              const e = events.find((x) => x.id === c.eventId)!;
              const p = person(c.authorId);
              return (
                <Link key={c.id} to={`/event/${e.id}`} className="card" style={{ width: 260, padding: 14 }}>
                  <div className="row">
                    <Avatar person={p} size={38} online={p.online} />
                    <div className="grow">
                      <b style={{ fontSize: 14 }}>{p.name} · {fmtKm(p.km)} de toi</b>
                      <div className="tiny muted ellipsis">{catById(e.category).emoji} {e.title}</div>
                    </div>
                  </div>
                  <p className="small mt-8 clamp2" style={{ lineHeight: 1.45 }}>« {c.text} »</p>
                  <div className="link mt-8">Répondre →</div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <Row title="Tes évènements à venir" to="/agenda">
        {mine.length ? mine.map((e) => <Poster key={e.id} e={e} />) : (
          <Link to="/explorer" className="card" style={{ width: 260, padding: 18 }}>
            <div style={{ fontSize: 28 }}>📅</div>
            <b className="title-s">Rien de prévu pour l’instant</b>
            <p className="small muted mt-4">Explore les events autour de toi et tape « J’y vais ».</p>
          </Link>
        )}
      </Row>

      {buddyEvents.length > 0 && (
        <>
          <div className="section-head"><h2 className="title-m">Les évènements de tes Buddies</h2></div>
          <div className="pad col">
            {buddyEvents.slice(0, 3).map(({ e, b }) => (
              <Link key={e.id} to={`/event/${e.id}`} className="card row" style={{ padding: 12 }}>
                <Avatar person={person(b)} size={40} />
                <div className="grow">
                  <div className="small"><b>{person(b).name}</b> <span className="muted">va à</span></div>
                  <div className="title-s ellipsis" style={{ fontSize: 14 }}>{e.title}</div>
                  <div className="tiny muted">{fmtTime(e.start)} · {venueById(e.venueId).name} · {fmtKm(dist(e))}</div>
                </div>
                <span className="btn btn-sm btn-soft">{s.statuses[e.id] === 'going' ? '✓' : 'Rejoindre'}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="section-head"><h2 className="title-m">Explorer par catégorie</h2></div>
      <div className="pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {CATEGORIES.map((c) => {
          const n = upcoming.filter((e) => e.category === c.id).length;
          return (
            <button key={c.id} className="card" style={{ padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} onClick={() => goCategory(c.id)}>
              <span style={{ fontSize: 26 }}>{c.emoji}</span>
              <b style={{ fontSize: 13 }}>{c.label}</b>
              <span className="tiny muted">{n} event{n > 1 ? 's' : ''}</span>
            </button>
          );
        })}
      </div>

      {freeWeekend.length > 0 && (
        <Row title="Gratuit ce week-end" to="/explorer" onAll={() => setFilters({ ...DEFAULT_FILTERS, date: 'weekend', freeOnly: true })}>
          {freeWeekend.map((e) => <Poster key={e.id} e={e} />)}
        </Row>
      )}

      <div className="pad mt-24">
        <Link to="/publier" className="card row" style={{ padding: 16, background: 'var(--night)', color: '#fff', border: 0 }}>
          <span style={{ fontSize: 28 }}>📣</span>
          <div className="grow">
            <b className="title-s" style={{ color: '#fff' }}>Tu organises quelque chose ?</b>
            <div className="small" style={{ color: 'rgba(255,255,255,0.6)' }}>Bar, asso, collectif : publie ton event gratuitement.</div>
          </div>
          <Icon name="chevron" />
        </Link>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} label="Menu profil">
        <div className="row" style={{ marginBottom: 14 }}>
          <Avatar person={{ name: s.user.name, color: s.user.color }} size={52} />
          <div><div className="title-m">{s.user.name}</div><div className="small muted">{s.user.city}</div></div>
        </div>
        <div className="list">
          {[
            ['/profil', '👤', 'Voir mon profil'],
            ['/profil/modifier', '✏️', 'Modifier mon profil'],
            ['/profil/visibilite', '👁️', 'Visibilité de mon profil'],
            ['/publier', '📣', 'Proposer un event'],
            ['/parametres', '⚙️', 'Paramètres'],
            ['/aide', '❓', 'FAQ & aide'],
          ].map(([to, ico, label]) => (
            <Link key={to} to={to} className="list-item" onClick={() => setMenu(false)}>
              <span className="ico">{ico}</span><span className="grow" style={{ fontWeight: 600 }}>{label}</span><Icon name="chevron" size={18} />
            </Link>
          ))}
        </div>
      </Sheet>

      <Sheet open={cityOpen} onClose={() => setCityOpen(false)} label="Choisir la ville">
        <h2 className="title-m">Ta ville</h2>
        <button className="card row mt-12" style={{ width: '100%', padding: 14 }} onClick={() => {
          navigator.geolocation?.getCurrentPosition((p) => { updateUser({ lat: p.coords.latitude, lng: p.coords.longitude }); setCityOpen(false); }, () => setCityOpen(false));
        }}>
          <span className="coral"><Icon name="locate" /></span><b className="grow" style={{ textAlign: 'left' }}>Utiliser ma position actuelle</b>
        </button>
        <div className="list mt-12">
          {CITIES.map((c) => {
            const n = c.name === 'Nantes' ? upcoming.length : 0;
            return (
              <button key={c.name} className="list-item" onClick={() => { updateUser({ city: c.name, lat: c.lat, lng: c.lng }); setCityOpen(false); }}>
                <span className="ico">📍</span><span className="grow" style={{ fontWeight: 600 }}>{c.name}</span>
                <span className="tiny muted">{n ? `${n} events` : 'bientôt'}</span>
                {s.user.city === c.name && <span className="coral"><Icon name="check" /></span>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

function Row({ title, to, onAll, children }: { title: string; to: string; onAll?: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="section-head">
        <h2 className="title-m">{title}</h2>
        <Link to={to} className="link" onClick={onAll}>Tout voir</Link>
      </div>
      <div className="hscroll">{children}</div>
    </>
  );
}
