import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { catById, venueById } from '../data/catalog';
import type { Call } from '../data/types';
import { fmtKm, fmtWhen, relTime } from '../lib/logic';
import { Avatar, Empty, Media, TopBar } from '../components/ui';

const QUICK = [
  'Quelqu’un pour m’accompagner ? 🙂',
  'Je viens seul·e, on y va ensemble ?',
  'On cherche 1-2 personnes pour compléter le groupe !',
  'Première fois, ça rassure d’y aller à plusieurs',
];
const AUDIENCES: { id: Call['audience']; label: string; sub: string; icon: string }[] = [
  { id: 'all', label: 'Tout le monde', sub: 'Participants et curieux de l’event', icon: '🌍' },
  { id: 'buddies', label: 'Mes Buddies', sub: 'Seulement les personnes que tu connais', icon: '🤝' },
  { id: 'city', label: 'Ma ville', sub: 'Les membres Buddy autour de toi', icon: '📍' },
];

export function CallCompose() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, eventById, launchCall } = useStore();
  const e = eventById(id);
  const [text, setText] = useState('');
  const [audience, setAudience] = useState<Call['audience']>('all');
  if (!e) return <TopBar title="Appel ouvert" />;
  const existing = s.calls.find((c) => c.eventId === e.id && c.authorId === 'me');
  if (existing) {
    return (
      <div className="screen"><TopBar title="Qui vient ?" />
        <Empty emoji="📣" title="Tu as déjà un appel en cours" text="Retrouve les réponses reçues." action={<Link className="btn btn-md btn-primary" to={`/appel/${existing.id}`}>Voir mon appel</Link>} />
      </div>
    );
  }
  const launch = () => {
    const cid = launchCall(e.id, text.trim(), audience);
    nav(`/appel/${cid}`, { replace: true });
  };
  return (
    <>
      <div className="screen with-cta">
        <TopBar title="👋 Qui vient avec moi ?" />
        <div className="pad">
          <div className="card row" style={{ padding: 10 }}>
            <Media event={e} style={{ width: 54, height: 54, borderRadius: 12, flexShrink: 0 }} emojiSize={22} />
            <div className="grow"><b className="ellipsis" style={{ display: 'block' }}>{e.title}</b><div className="tiny muted">{fmtWhen(e)} · {venueById(e.venueId).name}</div></div>
          </div>

          <div className="field mt-24">
            <label htmlFor="call-text">Ton message <span style={{ float: 'right', fontWeight: 500 }}>{text.length} / 160</span></label>
            <textarea id="call-text" className="input" value={text} maxLength={160} onChange={(ev) => setText(ev.target.value)} placeholder="Dis-en un peu plus : tu viens seul·e, tu cherches combien de personnes…" />
          </div>
          <div className="row wrap gap-6 mt-12">
            {QUICK.map((q) => <button key={q} className="chip" style={{ height: 32, fontSize: 12 }} onClick={() => setText(q)}>{q}</button>)}
          </div>

          <h2 className="title-s mt-24">Qui peut voir ton appel ?</h2>
          <div className="list mt-12">
            {AUDIENCES.map((a) => (
              <button key={a.id} className="list-item" aria-pressed={audience === a.id} onClick={() => setAudience(a.id)} style={audience === a.id ? { background: 'var(--coral-light)' } : undefined}>
                <span className="ico">{a.icon}</span>
                <span className="grow"><b style={{ fontSize: 14 }}>{a.label}</b><div className="tiny muted">{a.sub}</div></span>
                <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${audience === a.id ? 'var(--coral)' : 'var(--line)'}`, background: audience === a.id ? 'radial-gradient(var(--coral) 45%, transparent 50%)' : undefined }} />
              </button>
            ))}
          </div>
          <div className="banner green mt-16">🔒 Les gens verront ton prénom, ta bio et ta distance approximative (jamais ton adresse).</div>
        </div>
      </div>
      <div className="cta-bar"><button className="btn btn-primary btn-block" disabled={text.trim().length < 3} onClick={launch}>Lancer l’appel →</button></div>
    </>
  );
}

export function CallResponses() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, eventById, person, handleResponder, cancelCall, sendBuddyRequest } = useStore();
  const call = s.calls.find((c) => c.id === id);
  if (!call) return <div className="screen"><TopBar title="Appel" /><Empty emoji="📭" title="Cet appel a été retiré" action={<Link className="btn btn-md btn-dark" to="/">Accueil</Link>} /></div>;
  const e = eventById(call.eventId);
  const pending = call.responders.filter((r) => r.status === 'pending');
  const accepted = call.responders.filter((r) => r.status === 'accepted');
  const conv = s.conversations.find((c) => c.kind === 'event' && c.eventId === call.eventId && !c.archived);

  return (
    <div className="screen">
      <TopBar title="Ton appel" right={<button className="small muted" style={{ fontWeight: 600 }} onClick={() => { cancelCall(call.id); nav(-1); }}>Retirer</button>} />
      <div className="pad">
        {e && (
          <Link to={`/event/${e.id}`} className="card row" style={{ padding: 10 }}>
            <Media event={e} style={{ width: 54, height: 54, borderRadius: 12, flexShrink: 0 }} emojiSize={22} />
            <div className="grow"><b className="ellipsis" style={{ display: 'block' }}>{catById(e.category).emoji} {e.title}</b><div className="tiny muted">{fmtWhen(e)} · {venueById(e.venueId).name}</div></div>
          </Link>
        )}
        <div className="card mt-12" style={{ padding: 16, background: 'var(--night)', color: '#fff', border: 0 }}>
          <div className="tiny" style={{ color: 'var(--coral-mid)', fontWeight: 700 }}>📣 TON APPEL · {relTime(call.createdAt).toUpperCase()}</div>
          <p className="mt-8" style={{ fontSize: 15, lineHeight: 1.5 }}>« {call.text} »</p>
        </div>

        {conv && accepted.length > 0 && (
          <Link to={`/messages/${conv.id}`} className="banner green mt-16" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div className="grow"><b>Conversation de groupe ouverte</b><div className="small">Avec {accepted.map((r) => person(r.personId).name).join(', ')}</div></div>
          </Link>
        )}

        <h2 className="title-m mt-24">Réponses <span className="muted">· {call.responders.length}</span></h2>
        {!call.responders.length && (
          <div className="card mt-12" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--coral)', animation: 'pulse 1.6s infinite' }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👋</span>
            </div>
            <b className="title-s" style={{ display: 'block', marginTop: 14 }}>Ton appel est diffusé…</b>
            <p className="small muted mt-4">On te prévient dès que quelqu’un répond.</p>
          </div>
        )}
        <div className="col mt-12">
          {call.responders.map((r) => {
            const p = person(r.personId);
            const common = p.interests.filter((i) => s.user.interests.includes(i));
            return (
              <div key={r.personId} className="card pop" style={{ padding: 14, opacity: r.status === 'ignored' ? 0.5 : 1 }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <Link to={`/buddy/${p.id}`}><Avatar person={p} size={44} online={p.online} /></Link>
                  <div className="grow">
                    <b>{p.name}</b> <span className="tiny muted">· {fmtKm(p.km)} de toi</span>
                    <p className="small mt-4" style={{ lineHeight: 1.45 }}>{r.text}</p>
                    {common.length > 0 && <div className="row wrap gap-4 mt-8">{common.map((c) => <span key={c} className="tag purple">{catById(c).emoji} {catById(c).label}</span>)}</div>}
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div className="row mt-12">
                    <button className="btn btn-md btn-ghost grow" onClick={() => handleResponder(call.id, r.personId, false)}>Ignorer</button>
                    <button className="btn btn-md btn-primary grow" onClick={() => { const cid = handleResponder(call.id, r.personId, true); if (cid && pending.length <= 1) nav(`/messages/${cid}`); }}>Accepter 💬</button>
                  </div>
                )}
                {r.status === 'accepted' && (
                  <div className="row mt-12">
                    <span className="tag green">✓ Dans la conversation</span>
                    {!s.buddies.includes(p.id) && !s.sentRequests.includes(p.id) && <button className="link" onClick={() => sendBuddyRequest(p.id)}>+ Ajouter en Buddy</button>}
                  </div>
                )}
                {r.status === 'ignored' && <div className="tiny muted mt-8">Ignoré — {p.name} n’est pas notifié·e.</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
