import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { CATEGORIES, PEOPLE, catById } from '../data/catalog';
import type { CategoryId } from '../data/types';
import { fmtKm, inDateRange, isPast, normalize } from '../lib/logic';
import { EventRow } from '../components/events';
import { Avatar, Empty, Seg, Sheet, Toggle, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';

export function BuddyProfile() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, person, events, startSolo, sendBuddyRequest, removeBuddy, block, toast } = useStore();
  const [menu, setMenu] = useState(false);
  const p = person(id);
  const isBuddy = s.buddies.includes(id);
  const sent = s.sentRequests.includes(id);
  const blocked = s.visibility.blocked.includes(id);
  const common = p.interests.filter((i) => s.user.interests.includes(i));
  const theirEvents = events.filter((e) => !isPast(e) && e.attendees.includes(id));
  const together = events.filter((e) => isPast(e) && (s.companions[e.id] ?? []).includes(id));

  return (
    <div className="screen">
      <div className="dark-head" style={{ textAlign: 'center', paddingBottom: 26 }}>
        <div className="row between">
          <button className="icon-btn glass" aria-label="Retour" onClick={() => nav(-1)}><Icon name="back" /></button>
          <button className="icon-btn glass" aria-label="Options" onClick={() => setMenu(true)}><Icon name="more" /></button>
        </div>
        <Avatar person={p} size={88} online={p.online && !blocked} />
        <h1 className="title-l mt-12" style={{ color: '#fff' }}>{p.name}</h1>
        <div className="small muted mt-4">📍 {fmtKm(p.km)} de toi {isBuddy && '· 🤝 Ton Buddy'}</div>
        {!blocked && (
          <div className="row mt-16" style={{ justifyContent: 'center' }}>
            <button className="btn btn-md btn-white" onClick={() => nav(`/messages/${startSolo(id)}`)}><Icon name="chat" size={17} /> Message</button>
            {!isBuddy && <button className="btn btn-md btn-primary" disabled={sent} onClick={() => sendBuddyRequest(id)}>{sent ? 'Demande envoyée' : '+ Ajouter en Buddy'}</button>}
          </div>
        )}
      </div>
      <div className="pad">
        {blocked && <div className="banner amber mt-16">Tu as masqué {p.name}. Iel ne voit plus tes events ni tes appels.</div>}
        <p className="mt-16" style={{ lineHeight: 1.55 }}>{p.bio}</p>
        <h2 className="title-s mt-24">Centres d’intérêt</h2>
        <div className="row wrap gap-6 mt-8">
          {p.interests.map((i) => <span key={i} className={`chip ${common.includes(i) ? 'on' : ''}`} style={{ height: 32 }}>{catById(i).emoji} {catById(i).label}</span>)}
        </div>
        {common.length > 0 && <div className="tiny muted mt-8">En corail : vos goûts en commun</div>}
        {together.length > 0 && (
          <>
            <h2 className="title-s mt-24">Vos sorties ensemble · {together.length}</h2>
            <div className="col mt-12">{together.map((e) => <EventRow key={e.id} e={e} />)}</div>
          </>
        )}
        {theirEvents.length > 0 && s.visibility.contact !== 'buddies' && (
          <>
            <h2 className="title-s mt-24">{p.name} va à…</h2>
            <div className="col mt-12 with-tabbar">{theirEvents.map((e) => <EventRow key={e.id} e={e} right={s.statuses[e.id] === 'going' ? <span className="tag green">Toi aussi</span> : undefined} />)}</div>
          </>
        )}
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} label="Options">
        <div className="list">
          {isBuddy && <button className="list-item" onClick={() => { removeBuddy(id); setMenu(false); toast(`${p.name} retiré·e de tes Buddies`); }}><span className="ico">➖</span>Retirer de mes Buddies</button>}
          <button className="list-item" onClick={() => { block(id, !blocked); setMenu(false); toast(blocked ? `${p.name} n’est plus masqué·e` : `${p.name} est masqué·e`); }}><span className="ico">🙈</span>{blocked ? 'Ne plus masquer' : `Masquer ${p.name}`}</button>
          <button className="list-item" style={{ color: 'var(--coral)' }} onClick={() => { setMenu(false); toast('Signalement envoyé. Merci 🙏'); }}><span className="ico">🚩</span>Signaler</button>
        </div>
      </Sheet>
    </div>
  );
}

export function BuddySearch() {
  const { s, events, sendBuddyRequest } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | null>(null);
  const crossed = useMemo(() => {
    const ids = new Set<string>();
    events.filter((e) => s.statuses[e.id] === 'going').forEach((e) => e.attendees.forEach((a) => ids.add(a)));
    return [...ids].filter((i) => !s.buddies.includes(i));
  }, [events, s.statuses, s.buddies]);
  const others = PEOPLE.filter((p) => !s.buddies.includes(p.id) && !s.visibility.blocked.includes(p.id));
  const score = (id: string) => PEOPLE.find((p) => p.id === id)!.interests.filter((i) => s.user.interests.includes(i)).length;
  const results = others.filter((p) => (!q || normalize(p.name + ' ' + p.bio).includes(normalize(q))) && (!cat || p.interests.includes(cat)));
  const Row = ({ id, sub }: { id: string; sub?: string }) => {
    const p = PEOPLE.find((x) => x.id === id)!;
    const sent = s.sentRequests.includes(id);
    return (
      <div className="list-item">
        <Link to={`/buddy/${id}`}><Avatar person={p} size={44} online={p.online} /></Link>
        <Link to={`/buddy/${id}`} className="grow"><b>{p.name}</b> <span className="tiny muted">· {fmtKm(p.km)}</span><div className="tiny muted ellipsis">{sub ?? p.bio}</div></Link>
        <button className="btn btn-sm btn-soft" disabled={sent} onClick={() => sendBuddyRequest(id)}>{sent ? 'Envoyée' : '+ Ajouter'}</button>
      </div>
    );
  };
  return (
    <div className="screen">
      <TopBar title="Rechercher un Buddy" />
      <div className="pad">
        <div className="search"><Icon name="search" size={18} className="muted" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un prénom, un intérêt…" aria-label="Rechercher" /></div>
      </div>
      <div className="hscroll mt-12">
        {CATEGORIES.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.emoji} {c.label}</button>)}
      </div>
      <div className="pad">
        {!q && !cat ? (
          <>
            {crossed.length > 0 && (<><h2 className="title-s mt-16">Croisés sur tes events</h2><div className="list mt-12">{crossed.map((id) => <Row key={id} id={id} sub="Va au même event que toi" />)}</div></>)}
            <h2 className="title-s mt-24">Suggestions pour toi</h2>
            <div className="list mt-12">
              {[...others].sort((a, b) => score(b.id) - score(a.id)).slice(0, 6).map((p) => <Row key={p.id} id={p.id} sub={`${score(p.id)} goût${score(p.id) > 1 ? 's' : ''} en commun ${p.interests.filter((i) => s.user.interests.includes(i)).map((i) => catById(i).emoji).join('')}`} />)}
            </div>
          </>
        ) : (
          <div className="list mt-16">
            {results.map((p) => <Row key={p.id} id={p.id} />)}
            {!results.length && <div className="list-item small muted">Personne ne correspond. Essaie un autre mot.</div>}
          </div>
        )}
        <div className="banner purple mt-24">🔒 Seules les personnes ayant un profil visible apparaissent ici.</div>
      </div>
    </div>
  );
}

const EMOJIS = ['🎭', '🎲', '🎵', '🥾', '🍻', '🌿', '💃', '🏰', '🎨', '⚽'];

export function GroupCreate() {
  const { s, person, createGroup } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [desc, setDesc] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const toggle = (id: string) => setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  return (
    <>
      <div className="screen with-cta">
        <TopBar title="Créer un groupe" onBack={step > 1 ? () => setStep(step - 1) : undefined} />
        <div className="row gap-6 pad">{[1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--coral)' : 'var(--line)' }} />)}</div>
        <div className="pad mt-24">
          {step === 1 && (
            <>
              <h2 className="title-l">Ton groupe</h2>
              <p className="muted mt-4">Un nom, une icône, une ambiance.</p>
              <div className="row wrap gap-8 mt-16">{EMOJIS.map((e) => <button key={e} onClick={() => setEmoji(e)} aria-label={`Icône ${e}`} style={{ width: 46, height: 46, borderRadius: 14, fontSize: 22, background: emoji === e ? 'var(--coral-light)' : 'var(--surface)', border: `2px solid ${emoji === e ? 'var(--coral)' : 'var(--line)'}` }}>{e}</button>)}</div>
              <div className="field mt-16"><label htmlFor="g-name">Nom du groupe</label><input id="g-name" className="input" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Les Explorateurs du dimanche" /></div>
              <div className="field mt-16"><label htmlFor="g-desc">Description (optionnel)</label><textarea id="g-desc" className="input" maxLength={120} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ce que vous aimez faire ensemble" /></div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="title-l">Qui invites-tu ?</h2>
              <p className="muted mt-4">{members.length} Buddy{members.length > 1 ? 's' : ''} sélectionné{members.length > 1 ? 's' : ''}</p>
              <div className="list mt-16">
                {s.buddies.map((id) => (
                  <button key={id} className="list-item" onClick={() => toggle(id)} aria-pressed={members.includes(id)}>
                    <Avatar person={person(id)} size={42} />
                    <b className="grow">{person(id).name}</b>
                    <span style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${members.includes(id) ? 'var(--coral)' : 'var(--line)'}`, background: members.includes(id) ? 'var(--coral)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{members.includes(id) && <Icon name="check" size={15} stroke={3} />}</span>
                  </button>
                ))}
                {!s.buddies.length && <div className="list-item small muted">Ajoute d’abord des Buddies pour créer un groupe.</div>}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="title-l">Récap</h2>
              <div className="card mt-16" style={{ padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 44 }}>{emoji}</div>
                <div className="title-m mt-8">{name}</div>
                {desc && <p className="small muted mt-4">{desc}</p>}
                <div className="row mt-16" style={{ justifyContent: 'center' }}>
                  <div className="stack"><Avatar person={{ name: s.user.name, color: s.user.color }} size={34} />{members.map((m) => <Avatar key={m} person={person(m)} size={34} />)}</div>
                </div>
                <div className="tiny muted mt-8">Toi + {members.map((m) => person(m).name).join(', ')}</div>
              </div>
              <div className="banner green mt-16">📅 Le groupe aura une discussion et un agenda partagé. Seuls les events que chacun marque visibles y apparaissent.</div>
            </>
          )}
        </div>
      </div>
      <div className="cta-bar">
        {step < 3 ? (
          <button className="btn btn-primary btn-block" disabled={step === 1 ? name.trim().length < 2 : members.length < 1} onClick={() => setStep(step + 1)}>Continuer →</button>
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => nav(`/groupe/${createGroup(name.trim(), emoji, members, desc.trim())}`, { replace: true })}>Créer le groupe 🎉</button>
        )}
      </div>
    </>
  );
}

export function GroupDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, person, events, eventById, updateGroup, toast } = useStore();
  const [tab, setTab] = useState<'apercu' | 'agenda'>('agenda');
  const [pickOpen, setPickOpen] = useState(false);
  const g = s.groups.find((x) => x.id === id);
  if (!g) return <div className="screen"><TopBar title="Groupe" /><Empty emoji="👥" title="Groupe introuvable" /></div>;
  const conv = s.conversations.find((c) => c.id === g.conversationId);
  const shared = g.sharedEventIds.map((e) => eventById(e)).filter((e): e is NonNullable<typeof e> => !!e && !isPast(e));
  const weekendFree = g.memberIds.filter((m) => !events.some((e) => inDateRange(e, 'weekend') && e.attendees.includes(m))).length + 1;
  const myUpcoming = events.filter((e) => s.statuses[e.id] && !isPast(e) && !g.sharedEventIds.includes(e.id));

  return (
    <div className="screen">
      <div className="dark-head">
        <div className="row between">
          <button className="icon-btn glass" aria-label="Retour" onClick={() => nav(-1)}><Icon name="back" /></button>
          <Link to={`/groupe/${g.id}/parametres`} className="icon-btn glass" aria-label="Paramètres du groupe"><Icon name="settings" size={18} /></Link>
        </div>
        <div className="row mt-12">
          <span style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{g.emoji}</span>
          <div className="grow"><h1 className="title-l" style={{ color: '#fff' }}>{g.name}</h1><div className="small muted">{g.memberIds.length + 1} membres{g.muted ? ' · 🔕' : ''}</div></div>
        </div>
        {g.description && <p className="small mt-12" style={{ color: 'rgba(255,255,255,0.7)' }}>{g.description}</p>}
        <div className="row mt-16">
          <div className="stack grow">{g.memberIds.map((m) => <Link key={m} to={`/buddy/${m}`}><Avatar person={person(m)} size={34} online={person(m).online} /></Link>)}</div>
          {conv && <Link to={`/messages/${conv.id}`} className="btn btn-md btn-primary"><Icon name="chat" size={17} /> Discussion{conv.unread ? ` · ${conv.unread}` : ''}</Link>}
        </div>
      </div>
      <div className="pad mt-16">
        <Seg value={tab} onChange={setTab} options={[{ id: 'agenda', label: 'Agenda partagé' }, { id: 'apercu', label: 'Membres' }]} />
        {tab === 'agenda' ? (
          <>
            <div className="banner purple mt-16">🔒 Seuls les events que vous marquez visibles apparaissent ici.</div>
            <div className="card row mt-12" style={{ padding: 14, background: 'var(--green-light)', borderColor: 'transparent' }}>
              <span style={{ fontSize: 24 }}>🗓️</span>
              <div className="grow"><b style={{ color: 'var(--green-dark)' }}>Vous êtes {weekendFree} disponibles ce week-end</b><div className="small" style={{ color: 'var(--green-dark)', opacity: 0.85 }}>Proposer un event au groupe ?</div></div>
              <button className="btn btn-sm btn-dark" onClick={() => setPickOpen(true)}>Proposer</button>
            </div>
            <div className="col mt-16">
              {shared.map((e) => {
                const going = g.memberIds.filter((m) => e.attendees.includes(m));
                const maybe = g.memberIds.filter((m) => !going.includes(m)).slice(0, 1);
                return (
                  <div key={e.id}>
                    <EventRow e={e} />
                    <div className="row wrap gap-6" style={{ padding: '8px 4px 0' }}>
                      {s.statuses[e.id] === 'going' && <span className="tag green" style={{ textTransform: 'none', letterSpacing: 0 }}>✓ Toi</span>}
                      {going.map((m) => <span key={m} className="tag green" style={{ textTransform: 'none', letterSpacing: 0 }}>✓ {person(m).name}</span>)}
                      {maybe.map((m) => <span key={m} className="tag amber" style={{ textTransform: 'none', letterSpacing: 0 }}>? {person(m).name}</span>)}
                      <button className="tag gray" style={{ textTransform: 'none', letterSpacing: 0 }} onClick={() => toast('Invitation envoyée au groupe 📨')}>+ Inviter</button>
                    </div>
                  </div>
                );
              })}
              {!shared.length && <Empty emoji="📅" title="Rien dans l’agenda partagé" text="Propose un de tes events au groupe." />}
            </div>
          </>
        ) : (
          <div className="list mt-16">
            <div className="list-item"><Avatar person={{ name: s.user.name, color: s.user.color }} size={40} /><b className="grow">{s.user.name} (toi)</b><span className="tag">Admin</span></div>
            {g.memberIds.map((m) => (
              <Link key={m} to={`/buddy/${m}`} className="list-item"><Avatar person={person(m)} size={40} online={person(m).online} /><b className="grow">{person(m).name}</b><Icon name="chevron" size={18} /></Link>
            ))}
          </div>
        )}
      </div>
      <Sheet open={pickOpen} onClose={() => setPickOpen(false)} label="Proposer un event">
        <h2 className="title-m">Proposer au groupe</h2>
        <p className="small muted mt-4">Choisis un de tes events à rendre visible dans l’agenda partagé.</p>
        <div className="col mt-12">
          {myUpcoming.map((e) => (
            <button key={e.id} style={{ textAlign: 'left' }} onClick={() => { updateGroup(g.id, { sharedEventIds: [...g.sharedEventIds, e.id] }); setPickOpen(false); toast('Event partagé avec le groupe 📅'); }}>
              <EventRow e={e} />
            </button>
          ))}
          {!myUpcoming.length && <div className="small muted">Ajoute d’abord des events à ton agenda (♡ ou J’y vais).</div>}
        </div>
      </Sheet>
    </div>
  );
}

export function GroupSettings() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { s, person, updateGroup, leaveGroup, toast } = useStore();
  const g = s.groups.find((x) => x.id === id);
  const [name, setName] = useState(g?.name ?? '');
  const [confirm, setConfirm] = useState(false);
  if (!g) return <TopBar title="Paramètres" />;
  return (
    <div className="screen">
      <TopBar title="Paramètres du groupe" />
      <div className="pad">
        <div className="field"><label htmlFor="gs-name">Nom</label>
          <div className="row"><input id="gs-name" className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-md btn-dark" disabled={!name.trim() || name === g.name} onClick={() => { updateGroup(g.id, { name: name.trim() }); toast('Nom mis à jour'); }}>OK</button></div>
        </div>
        <div className="field mt-16"><label>Icône</label>
          <div className="row wrap gap-8">{EMOJIS.map((e) => <button key={e} onClick={() => updateGroup(g.id, { emoji: e })} aria-label={`Icône ${e}`} style={{ width: 42, height: 42, borderRadius: 12, fontSize: 20, background: g.emoji === e ? 'var(--coral-light)' : 'var(--surface)', border: `2px solid ${g.emoji === e ? 'var(--coral)' : 'var(--line)'}` }}>{e}</button>)}</div>
        </div>
        <div className="list mt-24">
          <div className="list-item"><span className="ico">🔕</span><span className="grow"><b>Mettre en sourdine</b><div className="tiny muted">Plus de notifications de ce groupe</div></span><Toggle on={!!g.muted} onChange={(v) => updateGroup(g.id, { muted: v })} label="Sourdine" /></div>
        </div>
        <h2 className="title-s mt-24">Membres · {g.memberIds.length + 1}</h2>
        <div className="list mt-12">
          {g.memberIds.map((m) => (
            <div key={m} className="list-item"><Avatar person={person(m)} size={38} /><b className="grow">{person(m).name}</b>
              <button className="small muted" onClick={() => { updateGroup(g.id, { memberIds: g.memberIds.filter((x) => x !== m) }); toast(`${person(m).name} retiré·e du groupe`); }}>Retirer</button></div>
          ))}
          <Link to="/groupes/nouveau" className="list-item coral" style={{ fontWeight: 700 }}><span className="ico">➕</span>Inviter des Buddies</Link>
        </div>
        <button className="btn btn-block btn-ghost mt-24" style={{ color: 'var(--coral)' }} onClick={() => setConfirm(true)}>Quitter le groupe</button>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} label="Confirmer">
        <h2 className="title-m">Quitter « {g.name} » ?</h2>
        <p className="small muted mt-8">Tu perdras l’accès à la discussion et à l’agenda partagé.</p>
        <div className="row mt-16">
          <button className="btn btn-ghost grow" onClick={() => setConfirm(false)}>Annuler</button>
          <button className="btn btn-primary grow" onClick={() => { leaveGroup(g.id); nav('/messages/annuaire', { replace: true }); toast('Tu as quitté le groupe'); }}>Quitter</button>
        </div>
      </Sheet>
    </div>
  );
}
