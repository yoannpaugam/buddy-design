import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { catById, venueById } from '../data/catalog';
import type { Conversation as Conv } from '../data/types';
import { chatTime, fmtKm, fmtWhen, isPast } from '../lib/logic';
import { Avatar, Empty, Media, Sheet, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';

function useConvMeta() {
  const { s, person, eventById } = useStore();
  return (c: Conv) => {
    const group = c.groupId ? s.groups.find((g) => g.id === c.groupId) : undefined;
    const ev = c.eventId ? eventById(c.eventId) : undefined;
    const title = c.kind === 'solo' ? person(c.memberIds[0]).name : group ? group.name : c.title ?? ev?.title ?? 'Conversation';
    const last = c.messages[c.messages.length - 1];
    const lastText = !last ? 'Dites bonjour 👋' : last.authorId === 'system' ? last.text : `${last.authorId === 'me' ? 'Toi' : person(last.authorId).name} : ${last.text}`;
    return { group, ev, title, last, lastText };
  };
}

function ConvAvatar({ c }: { c: Conv }) {
  const { person, eventById } = useStore();
  if (c.kind === 'solo') { const p = person(c.memberIds[0]); return <Avatar person={p} size={50} online={p.online} />; }
  if (c.kind === 'event' && c.eventId) {
    const ev = eventById(c.eventId);
    if (ev) return <Media event={ev} style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0 }} emojiSize={22} />;
  }
  const ids = c.memberIds.slice(0, 3);
  return (
    <div style={{ width: 50, height: 50, position: 'relative', flexShrink: 0 }}>
      {ids.map((id, i) => (
        <span key={id} style={{ position: 'absolute', left: [0, 20, 10][i], top: [0, 0, 20][i] }}><Avatar person={person(id)} size={30} /></span>
      ))}
    </div>
  );
}

const KIND_TAG: Record<Conv['kind'], [string, string]> = { solo: ['Solo', 'purple'], group: ['Groupe', 'green'], event: ['Event', ''] };

export function MessagesList() {
  const { s } = useStore();
  const meta = useConvMeta();
  const [q, setQ] = useState('');
  const sorted = [...s.conversations].sort((a, b) => +new Date(b.messages.at(-1)?.at ?? 0) - +new Date(a.messages.at(-1)?.at ?? 0));
  const filt = (c: Conv) => !q || meta(c).title.toLowerCase().includes(q.toLowerCase());
  const active = sorted.filter((c) => !c.archived && filt(c));
  const archived = sorted.filter((c) => c.archived && filt(c));
  const Item = ({ c }: { c: Conv }) => {
    const m = meta(c);
    const [label, tone] = KIND_TAG[c.kind];
    return (
      <Link to={`/messages/${c.id}`} className="row" style={{ padding: '10px 0', opacity: c.archived ? 0.6 : 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <ConvAvatar c={c} />
          <span className={`tag ${tone}`} style={{ fontSize: 9, padding: '1px 6px', textTransform: 'none', letterSpacing: 0 }}>{label}</span>
        </div>
        <div className="grow">
          <div className="row between"><b className="title-s ellipsis" style={{ fontSize: 14.5 }}>{m.title}</b><span className="tiny muted" style={{ flexShrink: 0 }}>{m.last ? chatTime(m.last.at) : ''}</span></div>
          <div className="row between mt-4">
            <span className="small muted ellipsis" style={{ fontStyle: m.last?.authorId === 'system' ? 'italic' : 'normal', fontWeight: c.unread ? 600 : 400, color: c.unread ? 'var(--text)' : undefined }}>{c.archived ? 'Archivée' : m.lastText}</span>
            {c.unread > 0 && <span className="badge">{c.unread}</span>}
          </div>
        </div>
      </Link>
    );
  };
  return (
    <div className="screen with-tabbar">
      <div className="page-top">
        <div className="row between">
          <h1 className="title-xl">Messages</h1>
          <Link to="/messages/annuaire" className="icon-btn" aria-label="Buddies et groupes"><Icon name="users" size={19} /></Link>
        </div>
        <div className="search mt-12" style={{ height: 44 }}>
          <Icon name="search" size={17} className="muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une conversation" aria-label="Rechercher une conversation" />
        </div>
      </div>
      <div className="pad">
        {s.requests.length > 0 && (
          <Link to="/messages/demandes" className="banner amber row mt-8" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>⏳</span><b className="grow">{s.requests.length} demande{s.requests.length > 1 ? 's' : ''} en attente</b><Icon name="chevron" size={18} />
          </Link>
        )}
        <div className="mt-8">{active.map((c) => <Item key={c.id} c={c} />)}</div>
        {!active.length && <Empty emoji="💬" title="Pas encore de conversation" text="Lance un appel « Qui vient ? » sur un event ou écris à un Buddy." />}
        {archived.length > 0 && (
          <>
            <div className="tiny muted" style={{ textAlign: 'center', margin: '14px 0 4px' }}>Plus anciennes</div>
            {archived.map((c) => <Item key={c.id} c={c} />)}
          </>
        )}
      </div>
    </div>
  );
}

export function Requests() {
  const { s, person, handleRequest } = useStore();
  const nav = useNavigate();
  const LABEL = { buddy: ['🤝', 'Demande de Buddy'], group: ['👥', 'Invitation de groupe'], conversation: ['💬', 'Nouvelle conversation'] } as const;
  return (
    <div className="screen">
      <TopBar title="Demandes" />
      <div className="pad col gap-14">
        {s.requests.map((r) => {
          const p = person(r.personId);
          const common = p.interests.filter((i) => s.user.interests.includes(i));
          return (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="eyebrow muted">{LABEL[r.kind][0]} {LABEL[r.kind][1]}</div>
              <div className="row mt-12" style={{ alignItems: 'flex-start' }}>
                <Link to={`/buddy/${p.id}`}><Avatar person={p} size={48} online={p.online} /></Link>
                <div className="grow">
                  <b>{p.name}</b> <span className="tiny muted">· {fmtKm(p.km)}</span>
                  <div className="small muted mt-4">{r.kind === 'group' ? <>t’invite dans <b style={{ color: 'var(--text)' }}>{r.groupName}</b></> : r.context}</div>
                  {r.message && <p className="small mt-8" style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 12 }}>« {r.message} »</p>}
                  {common.length > 0 && <div className="row wrap gap-4 mt-8">{common.map((c) => <span key={c} className="tag purple">{catById(c).emoji} {catById(c).label}</span>)}</div>}
                </div>
              </div>
              <div className="row mt-12">
                <button className="btn btn-md btn-ghost grow" onClick={() => handleRequest(r.id, false)}>Refuser</button>
                <button className="btn btn-md btn-primary grow" onClick={() => {
                  const res = handleRequest(r.id, true);
                  if (r.kind === 'conversation' && res) nav(`/messages/${res}`);
                  if (r.kind === 'group' && res) nav(`/groupe/${res}`);
                }}>{r.kind === 'buddy' ? 'Accepter' : r.kind === 'group' ? 'Rejoindre' : 'Répondre'}</button>
              </div>
            </div>
          );
        })}
        {!s.requests.length && <Empty emoji="✨" title="Aucune demande en attente" text="Les demandes de Buddies et invitations de groupe arrivent ici." />}
      </div>
    </div>
  );
}

export function Directory() {
  const { s, person } = useStore();
  const online = s.buddies.filter((b) => person(b).online);
  return (
    <div className="screen">
      <TopBar title="Buddies & Groupes" right={<Link to="/buddies/rechercher" className="icon-btn" aria-label="Rechercher un Buddy"><Icon name="search" size={19} /></Link>} />
      <div className="pad">
        {online.length > 0 && (
          <>
            <h2 className="title-s">En ligne maintenant</h2>
            <div className="row gap-14 mt-12" style={{ overflowX: 'auto' }}>
              {online.map((id) => (
                <Link key={id} to={`/buddy/${id}`} style={{ textAlign: 'center' }}>
                  <Avatar person={person(id)} size={54} online />
                  <div className="tiny mt-4" style={{ fontWeight: 600 }}>{person(id).name}</div>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className="row between mt-24"><h2 className="title-s">Mes groupes · {s.groups.length}</h2><Link to="/groupes/nouveau" className="link">+ Créer</Link></div>
        <div className="col mt-12">
          {s.groups.map((g) => {
            const conv = s.conversations.find((c) => c.id === g.conversationId);
            const last = conv?.messages.at(-1);
            return (
              <Link key={g.id} to={`/groupe/${g.id}`} className="card row" style={{ padding: 12 }}>
                <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--coral-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{g.emoji}</span>
                <div className="grow">
                  <b className="title-s">{g.name}</b>
                  <div className="tiny muted ellipsis">{g.memberIds.length + 1} membres{last ? ` · ${last.authorId === 'me' ? 'Toi' : last.authorId === 'system' ? '' : person(last.authorId).name + ' : '}${last.authorId === 'system' ? last.text : last.text}` : ''}</div>
                </div>
                <Icon name="chevron" size={18} />
              </Link>
            );
          })}
          <Link to="/groupes/nouveau" className="card row" style={{ padding: 14, borderStyle: 'dashed', boxShadow: 'none', background: 'transparent' }}>
            <span className="coral"><Icon name="plus" /></span><b className="coral">Créer un groupe</b>
          </Link>
        </div>
        <div className="row between mt-24"><h2 className="title-s">Mes Buddies · {s.buddies.length}</h2><Link to="/buddies/rechercher" className="link">+ Trouver</Link></div>
        <div className="list mt-12">
          {s.buddies.map((id) => {
            const p = person(id);
            const common = p.interests.filter((i) => s.user.interests.includes(i));
            return (
              <Link key={id} to={`/buddy/${id}`} className="list-item">
                <Avatar person={p} size={42} online={p.online} />
                <div className="grow"><b>{p.name}</b><div className="tiny muted">{common.length ? `${common.map((c) => catById(c).emoji).join(' ')} ${common.length} goût${common.length > 1 ? 's' : ''} en commun` : p.bio.slice(0, 40)}</div></div>
                <Icon name="chevron" size={18} />
              </Link>
            );
          })}
          {!s.buddies.length && <div className="list-item small muted">Pas encore de Buddy. Rencontre des gens via les appels ouverts !</div>}
        </div>
      </div>
    </div>
  );
}

const QUICK = ['J’arrive dans 10 min 🏃', 'Je suis devant 👋', 'Tu es où ?', 'On se retrouve à l’entrée ?'];

export function Conversation() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, person, openConversation, sendMessage, archiveConversation } = useStore();
  const meta = useConvMeta();
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const c = s.conversations.find((x) => x.id === id);

  useEffect(() => {
    openConversation(id);
    return () => openConversation(null);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [c?.messages.length]);

  if (!c) return <div className="screen"><TopBar title="Conversation" /><Empty emoji="💬" title="Conversation introuvable" /></div>;
  const m = meta(c);
  const ev = m.ev;
  const headerLink = c.kind === 'solo' ? `/buddy/${c.memberIds[0]}` : m.group ? `/groupe/${m.group.id}` : ev ? `/event/${ev.id}` : undefined;
  const send = (t: string) => {
    if (!t.trim()) return;
    sendMessage(c.id, t.trim());
    setText('');
  };

  return (
    <>
      <div className="topbar" style={{ borderBottom: '1px solid var(--line)' }}>
        <button className="icon-btn" aria-label="Retour" onClick={() => nav('/messages')}><Icon name="back" /></button>
        <Link to={headerLink ?? '#'} className="row grow" style={{ minWidth: 0 }}>
          <ConvAvatar c={c} />
          <div className="grow">
            <b className="title-s ellipsis" style={{ display: 'block' }}>{m.title}</b>
            <div className="tiny muted ellipsis">{c.kind === 'solo' ? (person(c.memberIds[0]).online ? '● En ligne' : 'Buddy') : `${c.memberIds.length + 1} participants`}</div>
          </div>
        </Link>
        <button className="icon-btn" aria-label="Options" onClick={() => setMenu(true)}><Icon name="more" /></button>
      </div>
      <div className="screen" style={{ padding: '12px 16px 8px' }}>
        {ev && (
          <Link to={`/event/${ev.id}`} className="card row" style={{ padding: 10, marginBottom: 14 }}>
            <Media event={ev} style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} emojiSize={20} />
            <div className="grow"><b className="small ellipsis" style={{ display: 'block' }}>{ev.title}</b><div className="tiny muted">{fmtWhen(ev)} · {venueById(ev.venueId).name}</div></div>
            {isPast(ev) ? <span className="tag gray">Passé</span> : <span className="tag green">J-{Math.max(0, Math.ceil((+new Date(ev.start) - Date.now()) / 86400000))}</span>}
          </Link>
        )}
        <div className="col gap-6">
          {c.messages.map((msg, i) => {
            if (msg.authorId === 'system') return <div key={msg.id} className="tiny muted" style={{ textAlign: 'center', margin: '6px 20px', fontStyle: 'italic' }}>{msg.text}</div>;
            const mine = msg.authorId === 'me';
            const p = person(msg.authorId);
            const showName = !mine && c.kind !== 'solo' && c.messages[i - 1]?.authorId !== msg.authorId;
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {!mine && c.kind !== 'solo' && <span style={{ visibility: c.messages[i + 1]?.authorId === msg.authorId ? 'hidden' : 'visible' }}><Avatar person={p} size={26} /></span>}
                <div style={{ maxWidth: '76%' }}>
                  {showName && <div className="tiny" style={{ color: p.color, fontWeight: 700, margin: '4px 0 2px 4px' }}>{p.name}</div>}
                  <div style={{ padding: '9px 14px', borderRadius: 18, fontSize: 14.5, lineHeight: 1.4, background: mine ? 'var(--coral)' : 'var(--surface)', color: mine ? '#fff' : 'var(--text)', border: mine ? 0 : '1px solid var(--line)', borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6 }}>
                    {msg.text}
                  </div>
                  <div className="tiny muted" style={{ textAlign: mine ? 'right' : 'left', margin: '2px 6px 0', fontSize: 10 }}>{chatTime(msg.at)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottom} />
      </div>
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', padding: '8px 12px calc(10px + var(--safe-b))' }}>
        {c.kind !== 'solo' && ev && !isPast(ev) && (
          <div className="row gap-6" style={{ overflowX: 'auto', paddingBottom: 8 }}>
            {QUICK.map((q) => <button key={q} className="chip" style={{ height: 30, fontSize: 12, flexShrink: 0 }} onClick={() => send(q)}>{q}</button>)}
          </div>
        )}
        <form className="row gap-8" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input className="input" style={{ height: 44, borderRadius: 22 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Écris un message…" aria-label="Message" />
          <button type="submit" className="icon-btn" style={{ background: 'var(--coral)', color: '#fff', width: 44, height: 44 }} aria-label="Envoyer" disabled={!text.trim()}><Icon name="send" size={18} /></button>
        </form>
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} label="Options de conversation">
        <div className="list">
          {headerLink && <Link className="list-item" to={headerLink} onClick={() => setMenu(false)}><span className="ico">ℹ️</span>{c.kind === 'solo' ? 'Voir le profil' : m.group ? 'Infos du groupe' : 'Voir l’event'}</Link>}
          <button className="list-item" onClick={() => { archiveConversation(c.id, !c.archived); setMenu(false); nav('/messages'); }}><span className="ico">🗂️</span>{c.archived ? 'Désarchiver' : 'Archiver la conversation'}</button>
        </div>
      </Sheet>
    </>
  );
}
