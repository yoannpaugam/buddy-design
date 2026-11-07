import { Link } from 'react-router-dom';
import type { EventItem } from '../data/types';
import { catById, venueById } from '../data/catalog';
import { fmtKm, fmtWhen, kmBetween, priceLabel, fmtDayShort, fmtTime } from '../lib/logic';
import { useStore } from '../store/store';
import { Avatar, AvatarStack, Media } from './ui';
import { Icon } from './Icon';

export function useDistance() {
  const { s } = useStore();
  return (e: EventItem) => kmBetween(s.user, venueById(e.venueId));
}

/** Tuile verticale façon affiche (Accueil). */
export function Poster({ e }: { e: EventItem }) {
  const dist = useDistance();
  const c = catById(e.category);
  return (
    <Link to={`/event/${e.id}`} className="poster" aria-label={e.title}>
      <Media event={e} className="shade ticket" emojiSize={52}>
        <span className={`tag price ${e.price === 0 ? 'solid' : 'white'}`} style={e.price === 0 ? { background: 'var(--green)' } : undefined}>{priceLabel(e.price)}</span>
        <div className="over">
          <div className="eyebrow" style={{ opacity: 0.85, fontSize: 10 }}>{c.label}</div>
          <div className="title-s clamp2" style={{ color: '#fff', fontSize: 14.5, lineHeight: 1.2 }}>{e.title}</div>
        </div>
      </Media>
      <div className="mt-8" style={{ padding: '0 2px' }}>
        <div className="small" style={{ fontWeight: 700 }}>{fmtDayShort(e.start)} · {fmtTime(e.start)}</div>
        <div className="tiny muted ellipsis mt-4">📍 {venueById(e.venueId).name} · {fmtKm(dist(e))}</div>
      </div>
    </Link>
  );
}

/** Carte d'event en liste (Explorer) avec bandeau appel ouvert et deux CTA. */
export function EventCard({ e }: { e: EventItem }) {
  const { s, setStatus, person } = useStore();
  const dist = useDistance();
  const c = catById(e.category);
  const st = s.statuses[e.id];
  const call = s.calls.find((x) => x.eventId === e.id && x.authorId !== 'me');
  const buddiesGoing = e.attendees.filter((id) => s.buddies.includes(id));
  return (
    <article className="card ticket ev-card">
      <Link to={`/event/${e.id}`} aria-label={e.title}>
        <Media event={e} className="shade">
          <div style={{ position: 'absolute', top: 12, left: 14, right: 14, zIndex: 2 }} className="row between">
            <span className="tag white">{c.emoji} {c.label}</span>
            <span className="tag" style={{ background: e.price === 0 ? 'var(--green)' : 'var(--night)', color: '#fff', fontSize: 12 }}>{priceLabel(e.price)}</span>
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 12, zIndex: 2, color: '#fff' }}>
            <h3 style={{ fontSize: 18, lineHeight: 1.2 }}>{e.title}</h3>
          </div>
        </Media>
      </Link>
      <div className="body">
        <div className="row small muted wrap gap-6">
          <span>🕐 {fmtWhen(e)}</span><span>·</span><span>📍 {venueById(e.venueId).name}</span><span>·</span><span>{fmtKm(dist(e))}</span>
          {e.pmr && <span title="Accessible PMR">· ♿</span>}
        </div>
        {(buddiesGoing.length > 0 || e.attendeeCount > 0) && (
          <div className="row mt-12 gap-8">
            <AvatarStack ids={e.attendees} size={24} max={3} />
            <span className="small muted">
              <b style={{ color: 'var(--text)' }}>{e.attendeeCount} y vont</b>
              {buddiesGoing.length > 0 && <> · dont <span className="coral" style={{ fontWeight: 600 }}>{buddiesGoing.map((b) => person(b).name).join(', ')}</span></>}
            </span>
          </div>
        )}
        {call && (
          <Link to={`/event/${e.id}`} className="banner coral mt-12" style={{ alignItems: 'center' }}>
            <Avatar person={person(call.authorId)} size={30} />
            <div className="grow">
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{person(call.authorId).name} cherche quelqu’un</div>
              <div className="ellipsis small" style={{ color: 'var(--muted)' }}>« {call.text} »</div>
            </div>
            <Icon name="chevron" size={18} />
          </Link>
        )}
        <div className="row mt-12">
          <button className={`btn btn-md grow ${st === 'going' ? 'btn-success' : 'btn-primary'}`} onClick={() => setStatus(e.id, st === 'going' ? null : 'going')}>
            {st === 'going' ? '✓ Tu y vas' : 'J’y vais ✓'}
          </button>
          <Link to={`/event/${e.id}/appel`} className="btn btn-md btn-dark grow">👋 Qui vient ?</Link>
        </div>
      </div>
    </article>
  );
}

/** Ligne compacte (agenda, listes). */
export function EventRow({ e, right, sub }: { e: EventItem; right?: React.ReactNode; sub?: React.ReactNode }) {
  const dist = useDistance();
  return (
    <Link to={`/event/${e.id}`} className="card" style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
      <Media event={e} style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }} emojiSize={24} />
      <div className="grow">
        <div className="title-s ellipsis" style={{ fontSize: 14 }}>{e.title}</div>
        <div className="tiny muted mt-4 ellipsis">{fmtWhen(e)} · {venueById(e.venueId).name} · {fmtKm(dist(e))}</div>
        {sub}
      </div>
      {right}
    </Link>
  );
}
