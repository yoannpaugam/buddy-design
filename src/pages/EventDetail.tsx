import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/store';
import { catById, venueById } from '../data/catalog';
import { fmtDayLong, fmtKm, fmtTime, isPast, priceLabel, walkMin, relTime } from '../lib/logic';
import { useDistance } from '../components/events';
import { Avatar, AvatarStack, Empty, Media, Seg, Sheet, Stars, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';
import type { EventItem } from '../data/types';

function downloadIcs(e: EventItem) {
  const v = venueById(e.venueId);
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Buddy//FR', 'BEGIN:VEVENT',
    `UID:${e.id}@buddy`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(e.start)}`, `DTEND:${f(e.end)}`,
    `SUMMARY:${e.title}`, `LOCATION:${v.name}, ${v.address}`, `DESCRIPTION:${e.description.replace(/\n/g, ' ')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${e.id}.ics`;
  a.click();
}

const pinIcon = L.divIcon({ className: '', html: '<div class="pin active">📍</div>', iconSize: [0, 0] });

export function EventDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, eventById, person, setStatus, toggleFollow, answerCall, toast, rate } = useStore();
  const dist = useDistance();
  const [more, setMore] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [report, setReport] = useState(false);
  const e = eventById(id);

  if (!e) return (<><TopBar title="Event" /><Empty emoji="🤷" title="Cet event n’existe plus" action={<Link className="btn btn-md btn-dark" to="/explorer">Explorer</Link>} /></>);

  const v = venueById(e.venueId);
  const c = catById(e.category);
  const km = dist(e);
  const st = s.statuses[e.id];
  const past = isPast(e);
  const fav = st === 'envie';
  const calls = s.calls.filter((x) => x.eventId === e.id && x.authorId !== 'me' && !s.visibility.blocked.includes(x.authorId));
  const myCall = s.calls.find((x) => x.eventId === e.id && x.authorId === 'me');
  const buddies = e.attendees.filter((a) => s.buddies.includes(a));
  const total = e.attendeeCount + (st === 'going' ? 1 : 0);
  const following = s.followed.includes(e.organizer);
  const answered = (callId: string) => s.calls.find((x) => x.id === callId)?.responders.some((r) => r.personId === 'me');

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: e.title, text: `${e.title} — ${fmtDayLong(e.start)} à ${fmtTime(e.start)}, ${v.name}`, url });
      else { await navigator.clipboard.writeText(url); toast('Lien copié 🔗'); }
    } catch { /* partage annulé */ }
  };

  const sendReply = () => {
    if (!replyTo || !reply.trim()) return;
    const convId = answerCall(replyTo, reply.trim());
    setReplyTo(null); setReply('');
    nav(`/messages/${convId}`);
  };

  return (
    <>
      <div className="screen with-cta">
        <Media event={e} className="shade" style={{ height: 290 }} emojiSize={90}>
          <div style={{ position: 'absolute', top: 'calc(14px + var(--safe-t))', left: 16, right: 16, zIndex: 3 }} className="row between">
            <button className="icon-btn glass" aria-label="Retour" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}><Icon name="back" /></button>
            <div className="row gap-8">
              <button className="icon-btn glass" aria-label="Partager" onClick={share}><Icon name="share" size={18} /></button>
              <button className="icon-btn glass" aria-label={fav ? 'Retirer des envies' : 'Ajouter aux envies'} aria-pressed={fav} onClick={() => setStatus(e.id, fav ? null : 'envie')} style={fav ? { color: 'var(--coral)' } : undefined}>
                <Icon name="heart" size={18} fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, zIndex: 3 }} className="row between">
            <span className="tag solid" style={{ fontSize: 11 }}>{c.emoji} {c.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: e.price ? '#fff' : '#4ADE80' }}>{priceLabel(e.price)}</span>
          </div>
        </Media>

        <div className="pad" style={{ paddingTop: 20 }}>
          <h1 className="title-l">{e.title}</h1>
          <div className="row between mt-4">
            <span className="small muted">par <span className="coral" style={{ fontWeight: 600 }}>{e.createdByMe ? 'toi' : e.organizer}</span></span>
            {!e.createdByMe && (
              <button className={`btn btn-sm ${following ? 'btn-ghost' : 'btn-soft'}`} onClick={() => { toggleFollow(e.organizer); if (!following) toast(`Tu suis ${e.organizer} 🔔`); }}>
                {following ? '✓ Suivi' : '+ Suivre'}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="mt-16">
            <Info icon="📅" label="Date" value={fmtDayLong(e.start)} />
            <Info icon="🕐" label="Horaire" value={`${fmtTime(e.start)} – ${fmtTime(e.end)}`} />
            <Info icon="📍" label="Lieu" value={v.name} />
            <Info icon="🚶" label="Distance" value={`${fmtKm(km)} · ${walkMin(km)} min`} />
          </div>

          {past && (
            <div className="card mt-16" style={{ padding: 16 }}>
              <b>C’était le {fmtDayLong(e.start).toLowerCase()}</b>
              {st === 'going' && <div className="row between mt-8"><span className="small muted">Ta note</span><Stars value={s.ratings[e.id] ?? 0} onChange={(n) => rate(e.id, n)} /></div>}
            </div>
          )}

          <div className="divider" />

          {/* Principe 1 : le social avant la description */}
          <div className="row between">
            <h2 className="title-m">Qui y va ?</h2>
            <Link to={`/event/${e.id}/participants`} className="link">Voir tous →</Link>
          </div>
          <Link to={`/event/${e.id}/participants`} className="row mt-12">
            <div className="stack">
              {st === 'going' && <Avatar person={{ name: s.user.name, color: s.user.color }} size={34} />}
              <AvatarStack ids={e.attendees} size={34} max={4} extra={Math.max(0, e.attendeeCount - e.attendees.length)} />
            </div>
            <div>
              <b style={{ fontSize: 14 }}>{total} personne{total > 1 ? 's' : ''} y {total > 1 ? 'vont' : 'va'}</b>
              <div className="tiny muted">
                {buddies.length ? <>dont <span className="coral" style={{ fontWeight: 700 }}>{buddies.length} {buddies.length > 1 ? 'Buddies' : 'Buddy'}</span> — {buddies.map((b) => person(b).name).join(', ')}</> : 'Aucun de tes Buddies pour l’instant'}
              </div>
            </div>
          </Link>
          {e.capacity && <div className="tiny muted mt-8">{Math.max(0, e.capacity - total)} place{e.capacity - total > 1 ? 's' : ''} restante{e.capacity - total > 1 ? 's' : ''} sur {e.capacity}{e.capacity - total < 10 ? ' · 🔥 bientôt complet' : ''}</div>}

          {myCall && (
            <Link to={`/appel/${myCall.id}`} className="banner coral mt-16" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>📣</span>
              <div className="grow">
                <b style={{ color: 'var(--text)' }}>Ton appel est en ligne</b>
                <div className="small" style={{ color: 'var(--muted)' }}>{myCall.responders.length} réponse{myCall.responders.length > 1 ? 's' : ''} · {relTime(myCall.createdAt)}</div>
              </div>
              <Icon name="chevron" />
            </Link>
          )}

          {calls.length > 0 && (
            <div className="col mt-16">
              <div className="eyebrow muted">Appels ouverts</div>
              {calls.map((call, i) => {
                const p = person(call.authorId);
                const done = answered(call.id);
                return (
                  <div key={call.id} className="card row" style={{ padding: 14, alignItems: 'flex-start', ...(i === 0 ? { background: 'var(--coral-light)', borderColor: 'var(--coral-mid)' } : {}) }}>
                    <Link to={`/buddy/${p.id}`}><Avatar person={p} size={42} online={p.online} /></Link>
                    <div className="grow">
                      <b style={{ fontSize: 14 }}>{p.name} · {fmtKm(p.km)} de toi</b>
                      <p className="small muted mt-4" style={{ lineHeight: 1.45 }}>{call.text}</p>
                    </div>
                    <button className={`btn btn-sm ${done ? 'btn-success' : i === 0 ? 'btn-dark' : 'btn-primary'}`} disabled={done || past} onClick={() => setReplyTo(call.id)}>{done ? '✓ Envoyé' : 'Répondre'}</button>
                  </div>
                );
              })}
            </div>
          )}

          {st === 'going' && !s.visibility.showOnEvents && (
            <div className="banner purple mt-12">👁️ Tu es masqué·e de la liste « Qui y va ? ». <Link to="/profil/visibilite" style={{ fontWeight: 700 }}>Gérer</Link></div>
          )}

          <div className="divider" />
          <h2 className="title-m">À propos</h2>
          <p className={`mt-8 ${more ? '' : 'clamp2'}`} style={{ lineHeight: 1.6, fontSize: 14.5, WebkitLineClamp: more ? 'unset' : 3 }}>{e.description}</p>
          <button className="link mt-4" onClick={() => setMore(!more)}>{more ? 'Voir moins' : 'Voir plus'}</button>

          <div className="row wrap gap-8 mt-16">
            {e.pmr ? <span className="tag green">♿ Accessible PMR</span> : <span className="tag gray">Accès PMR non garanti</span>}
            {e.price === 0 && <span className="tag green">Entrée libre</span>}
            {e.capacity && <span className="tag gray">Jauge {e.capacity}</span>}
          </div>

          <div className="divider" />
          <h2 className="title-m">Le lieu</h2>
          <div className="card mt-12" style={{ overflow: 'hidden' }}>
            <div style={{ height: 150, position: 'relative' }}>
              <MapContainer center={[v.lat, v.lng]} zoom={15} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl={false} style={{ position: 'absolute', inset: 0 }}>
                <TileLayer url={s.settings.dark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'} />
                <Marker position={[v.lat, v.lng]} icon={pinIcon} interactive={false} />
              </MapContainer>
            </div>
            <div className="row" style={{ padding: 14 }}>
              <div className="grow"><b style={{ fontSize: 14 }}>{v.name}</b><div className="tiny muted">{v.address}</div></div>
              <a className="btn btn-sm btn-soft" href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}&travelmode=walking`} target="_blank" rel="noreferrer">Itinéraire</a>
            </div>
          </div>

          <div className="row gap-8 mt-16">
            <button className="btn btn-md btn-ghost grow" onClick={() => downloadIcs(e)}><Icon name="calendar" size={16} /> Ajouter à mon calendrier</button>
          </div>
          <button className="small muted mt-16" style={{ textDecoration: 'underline', display: 'block', margin: '18px auto 0' }} onClick={() => setReport(true)}>Signaler cet event</button>
        </div>
      </div>

      {!past && (
        <div className="cta-bar">
          <button className="btn btn-ghost" style={{ width: 52, padding: 0, color: fav ? 'var(--coral)' : undefined }} aria-label="Envie" aria-pressed={fav} onClick={() => setStatus(e.id, fav ? null : 'envie')}>
            <Icon name="heart" fill={fav ? 'currentColor' : 'none'} />
          </button>
          <Link to={myCall ? `/appel/${myCall.id}` : `/event/${e.id}/appel`} className="btn btn-dark grow">{myCall ? '📣 Mon appel' : '👋 Qui vient ?'}</Link>
          <button className={`btn grow ${st === 'going' ? 'btn-success' : 'btn-primary'}`} onClick={() => setStatus(e.id, st === 'going' ? null : 'going')}>{st === 'going' ? '✓ J’y vais' : 'J’y vais ✓'}</button>
        </div>
      )}

      <Sheet open={!!replyTo} onClose={() => setReplyTo(null)} label="Répondre à l’appel">
        {replyTo && (() => {
          const call = s.calls.find((x) => x.id === replyTo)!;
          const p = person(call.authorId);
          return (
            <>
              <div className="row"><Avatar person={p} size={44} /><div><b>Répondre à {p.name}</b><div className="small muted">« {call.text} »</div></div></div>
              <div className="row wrap gap-6 mt-16">
                {['Je suis partant·e ! 🙌', 'Je viens seul·e aussi, on se retrouve devant ?', 'Ça me tente, tu arrives à quelle heure ?'].map((q) => (
                  <button key={q} className="chip" style={{ height: 32, fontSize: 12 }} onClick={() => setReply(q)}>{q}</button>
                ))}
              </div>
              <textarea className="input mt-12" value={reply} onChange={(ev) => setReply(ev.target.value)} placeholder={`Ton message à ${p.name}…`} maxLength={200} aria-label="Message" />
              <div className="banner green mt-12">🔒 {p.name} verra ton prénom et ta bio. Ta position exacte n’est jamais partagée.</div>
              <button className="btn btn-primary btn-block mt-16" disabled={!reply.trim()} onClick={sendReply}>Envoyer</button>
            </>
          );
        })()}
      </Sheet>

      <Sheet open={report} onClose={() => setReport(false)} label="Signaler">
        <h2 className="title-m">Signaler cet event</h2>
        <div className="list mt-12">
          {['Informations erronées (date, lieu, prix)', 'Event annulé', 'Contenu inapproprié', 'Arnaque ou spam'].map((r) => (
            <button key={r} className="list-item" onClick={() => { setReport(false); toast('Merci, notre équipe va vérifier 🙏'); }}>{r}</button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card row" style={{ padding: 12, alignItems: 'center' }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--coral-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <div className="grow">
        <div className="eyebrow muted" style={{ fontSize: 9.5 }}>{label}</div>
        <div className="title-s" style={{ fontSize: 13.5, lineHeight: 1.25 }}>{value}</div>
      </div>
    </div>
  );
}

export function Participants() {
  const { id = '' } = useParams();
  const { s, eventById, person, sendBuddyRequest } = useStore();
  const [tab, setTab] = useState<'all' | 'buddies' | 'calls'>('all');
  const e = eventById(id);
  if (!e) return <TopBar title="Participants" />;
  const callers = s.calls.filter((c) => c.eventId === e.id && c.authorId !== 'me').map((c) => c.authorId);
  const ids = Array.from(new Set([...e.attendees, ...callers])).filter((p) => !s.visibility.blocked.includes(p));
  const list = tab === 'buddies' ? ids.filter((p) => s.buddies.includes(p)) : tab === 'calls' ? ids.filter((p) => callers.includes(p)) : ids;
  const hidden = Math.max(0, e.attendeeCount - e.attendees.length);
  const common = (pid: string) => person(pid).interests.filter((i) => s.user.interests.includes(i));

  return (
    <div className="screen">
      <TopBar title="Qui y va ?" />
      <div className="pad">
        <div className="small muted">{e.title} · {e.attendeeCount + (s.statuses[e.id] === 'going' ? 1 : 0)} participants</div>
        <div className="mt-12"><Seg value={tab} onChange={setTab} options={[{ id: 'all', label: `Tous · ${ids.length}` }, { id: 'buddies', label: 'Buddies' }, { id: 'calls', label: 'Cherchent qqn' }]} /></div>
        <div className="list mt-16">
          {s.statuses[e.id] === 'going' && tab === 'all' && (
            <div className="list-item"><Avatar person={{ name: s.user.name, color: s.user.color }} size={44} /><div className="grow"><b>{s.user.name} (toi)</b><div className="tiny muted">{s.visibility.showOnEvents ? 'Visible des autres participants' : 'Masqué·e des autres'}</div></div></div>
          )}
          {list.map((pid) => {
            const p = person(pid);
            const isBuddy = s.buddies.includes(pid);
            const sent = s.sentRequests.includes(pid);
            const cm = common(pid);
            return (
              <div key={pid} className="list-item">
                <Link to={`/buddy/${pid}`}><Avatar person={p} size={44} online={p.online} /></Link>
                <Link to={`/buddy/${pid}`} className="grow">
                  <b>{p.name}</b> <span className="tiny muted">· {fmtKm(p.km)}</span>
                  <div className="tiny muted">{callers.includes(pid) ? '👋 Cherche quelqu’un · ' : ''}{cm.length ? `${cm.length} goût${cm.length > 1 ? 's' : ''} en commun ${cm.map((x) => catById(x).emoji).join('')}` : p.bio.slice(0, 40)}</div>
                </Link>
                {isBuddy ? <span className="tag green">Buddy</span> : (
                  <button className="btn btn-sm btn-soft" disabled={sent} onClick={() => sendBuddyRequest(pid)}>{sent ? 'Envoyée' : '+ Ajouter'}</button>
                )}
              </div>
            );
          })}
          {!list.length && <div className="list-item muted small">Personne dans cette catégorie pour l’instant.</div>}
        </div>
        {tab === 'all' && hidden > 0 && <p className="tiny muted mt-12" style={{ textAlign: 'center' }}>+ {hidden} participant{hidden > 1 ? 's' : ''} qui ont choisi de ne pas apparaître 🔒</p>}
      </div>
    </div>
  );
}
