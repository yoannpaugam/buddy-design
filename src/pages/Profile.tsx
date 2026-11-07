import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { CATEGORIES, CITIES, catById } from '../data/catalog';
import type { CategoryId, Visibility } from '../data/types';
import { isPast, monthLabel } from '../lib/logic';
import { Avatar, Media, Sheet, Toggle, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';

export function MyProfile() {
  const { s, events } = useStore();
  const nav = useNavigate();
  const past = events.filter((e) => isPast(e) && s.statuses[e.id] === 'going');
  const ratings = Object.values(s.ratings);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1).replace('.', ',') : '—';
  return (
    <div className="screen">
      <div className="dark-head" style={{ textAlign: 'center', paddingBottom: 26 }}>
        <div className="row between">
          <button className="icon-btn glass" aria-label="Retour" onClick={() => nav(-1)}><Icon name="back" /></button>
          <Link to="/profil/modifier" className="icon-btn glass" aria-label="Modifier"><Icon name="edit" size={18} /></Link>
        </div>
        <Avatar person={{ name: s.user.name, color: s.user.color }} size={88} />
        <h1 className="title-l mt-12" style={{ color: '#fff' }}>{s.user.name}</h1>
        <div className="small muted mt-4">{s.visibility.showCity ? `📍 ${s.user.city} · ` : ''}Membre depuis {monthLabel(new Date(s.user.memberSince)).toLowerCase()}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }} className="mt-16">
          {[[past.length, 'Sorties'], [s.buddies.length, 'Buddies'], [s.groups.length, 'Groupes'], [avg, 'Note moy.']].map(([n, l]) => (
            <div key={l as string} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 4px' }}>
              <div className="title-m" style={{ color: '#fff' }}>{n}</div><div className="tiny muted">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="pad">
        <div className="banner purple mt-16">👁️ Voici ce que les autres voient de toi.</div>
        <h2 className="title-s mt-24">Bio</h2>
        <p className="mt-8" style={{ lineHeight: 1.55 }}>{s.user.bio || <span className="muted">Pas encore de bio. <Link className="coral" to="/profil/modifier">Ajouter</Link></span>}</p>
        <h2 className="title-s mt-24">Centres d’intérêt</h2>
        <div className="row wrap gap-6 mt-8">{s.user.interests.map((i) => <span key={i} className="chip" style={{ height: 32, background: catById(i).color + '1f', borderColor: 'transparent', color: catById(i).color }}>{catById(i).emoji} {catById(i).label}</span>)}</div>
        {past.length > 0 && (
          <>
            <h2 className="title-s mt-24">Dernières sorties</h2>
            <div className="row gap-8 mt-12" style={{ overflowX: 'auto', paddingBottom: 4 }}>
              {past.map((e) => (
                <Link key={e.id} to={`/event/${e.id}`} style={{ width: 120, flexShrink: 0 }}>
                  <Media event={e} style={{ height: 90, borderRadius: 14 }} emojiSize={28} />
                  <div className="tiny mt-4 ellipsis" style={{ fontWeight: 600 }}>{e.title}</div>
                </Link>
              ))}
            </div>
          </>
        )}
        <Link to="/profil/visibilite" className="card row mt-24" style={{ padding: 14 }}>
          <span className="ico" style={{ fontSize: 20 }}>🔒</span>
          <div className="grow">
            <b>Visibilité</b>
            <div className="tiny muted">{s.visibility.profileVisible ? 'Profil visible' : 'Profil masqué'} · {s.visibility.showOnEvents ? 'Apparaît sur les events' : 'Invisible sur les events'}</div>
          </div>
          <span className="link">Gérer →</span>
        </Link>
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}

export function ProfileEdit() {
  const { s, updateUser, toast } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState(s.user.name);
  const [bio, setBio] = useState(s.user.bio);
  const [city, setCity] = useState(s.user.city);
  const [interests, setInterests] = useState<CategoryId[]>(s.user.interests);
  const [color, setColor] = useState(s.user.color);
  const COLORS = ['#FF5C57', '#8B5CF6', '#22C55E', '#F59E0B', '#0EA5E9', '#EC4899'];
  const save = () => {
    const c = CITIES.find((x) => x.name === city);
    updateUser({ name: name.trim(), bio: bio.trim(), interests, color, ...(c && c.name !== s.user.city ? { city: c.name, lat: c.lat, lng: c.lng } : {}) });
    toast('Profil mis à jour ✓');
    nav(-1);
  };
  return (
    <>
      <div className="screen with-cta">
        <TopBar title="Modifier le profil" />
        <div className="pad">
          <div className="col" style={{ alignItems: 'center' }}>
            <Avatar person={{ name: name || '?', color }} size={88} />
            <div className="row gap-8 mt-8">{COLORS.map((c) => <button key={c} aria-label={`Couleur ${c}`} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, outline: color === c ? '3px solid var(--text)' : 'none', outlineOffset: 2 }} />)}</div>
          </div>
          <div className="field mt-24"><label htmlFor="pe-name">Prénom</label><input id="pe-name" className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field mt-16"><label htmlFor="pe-city">Ville</label>
            <select id="pe-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>{CITIES.map((c) => <option key={c.name}>{c.name}</option>)}</select></div>
          <div className="field mt-16"><label htmlFor="pe-bio">Bio <span style={{ float: 'right', fontWeight: 500 }}>{bio.length} / 140</span></label><textarea id="pe-bio" className="input" value={bio} maxLength={140} onChange={(e) => setBio(e.target.value)} /></div>
          <div className="field mt-16"><label>Centres d’intérêt (min. 2)</label>
            <div className="row wrap gap-6">{CATEGORIES.map((c) => { const on = interests.includes(c.id); return <button key={c.id} className={`chip ${on ? 'on' : ''}`} onClick={() => setInterests(on ? interests.filter((x) => x !== c.id) : [...interests, c.id])}>{c.emoji} {c.label}</button>; })}</div>
          </div>
        </div>
      </div>
      <div className="cta-bar"><button className="btn btn-primary btn-block" disabled={!name.trim() || interests.length < 2} onClick={save}>Enregistrer</button></div>
    </>
  );
}

export function VisibilityPage() {
  const { s, events, person, setVisibility, block } = useStore();
  const v = s.visibility;
  const [pick, setPick] = useState(false);
  const mine = events.filter((e) => s.statuses[e.id] && !isPast(e));
  const ex = Object.entries(v.eventExceptions);
  const setEx = (id: string, val: 'hidden' | 'buddies' | null) => {
    const next = { ...v.eventExceptions };
    if (val) next[id] = val; else delete next[id];
    setVisibility({ eventExceptions: next });
  };
  const Row = ({ k, label, sub }: { k: keyof Pick<Visibility, 'profileVisible' | 'showOnEvents' | 'showCity' | 'hideLastSeen'>; label: string; sub: string }) => (
    <div className="list-item"><span className="grow"><b style={{ fontSize: 14 }}>{label}</b><div className="tiny muted">{sub}</div></span><Toggle on={v[k]} onChange={(val) => setVisibility({ [k]: val })} label={label} /></div>
  );
  return (
    <div className="screen">
      <TopBar title="Visibilité" />
      <div className="pad">
        <div className="banner green">🔒 Rien n’est imposé : tout est désactivable, event par event.</div>
        <div className="list mt-16">
          <Row k="profileVisible" label="Profil visible" sub="Les autres membres peuvent voir ton profil" />
          <Row k="showOnEvents" label="Apparaître sur les events" sub="Dans la liste « Qui y va ? »" />
          <Row k="showCity" label="Afficher ma ville" sub={s.user.city} />
          <Row k="hideLastSeen" label="Masquer « actif il y a… »" sub="Personne ne voit quand tu es en ligne" />
        </div>
        <h2 className="title-s mt-24">Qui peut me contacter ?</h2>
        <div className="list mt-12">
          {([['all', 'Tout le monde', '🌍'], ['same-event', 'Participants au même event', '🎟️'], ['buddies', 'Mes Buddies uniquement', '🤝']] as const).map(([id, label, ico]) => (
            <button key={id} className="list-item" aria-pressed={v.contact === id} onClick={() => setVisibility({ contact: id })} style={v.contact === id ? { background: 'var(--coral-light)' } : undefined}>
              <span className="ico">{ico}</span><b className="grow" style={{ fontSize: 14 }}>{label}</b>{v.contact === id && <span className="coral"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
        <div className="row between mt-24"><h2 className="title-s">Exceptions par event</h2><button className="link" onClick={() => setPick(true)}>+ Ajouter</button></div>
        <div className="list mt-12">
          {ex.map(([id, val]) => {
            const e = events.find((x) => x.id === id);
            if (!e) return null;
            return (
              <div key={id} className="list-item">
                <span className="ico">{catById(e.category).emoji}</span>
                <span className="grow"><b className="ellipsis" style={{ fontSize: 14, display: 'block' }}>{e.title}</b><span className="tiny muted">{val === 'hidden' ? 'Masqué' : 'Buddies seulement'}</span></span>
                <button className="small muted" onClick={() => setEx(id, val === 'hidden' ? 'buddies' : 'hidden')}>Changer</button>
                <button className="muted" aria-label="Supprimer l’exception" onClick={() => setEx(id, null)}><Icon name="close" size={16} /></button>
              </div>
            );
          })}
          {!ex.length && <div className="list-item small muted">Aucune exception. Tu es visible selon les réglages ci-dessus.</div>}
        </div>
        <h2 className="title-s mt-24">Personnes masquées</h2>
        <div className="list mt-12" style={{ marginBottom: 30 }}>
          {v.blocked.map((id) => (
            <div key={id} className="list-item"><Avatar person={person(id)} size={36} /><b className="grow">{person(id).name}</b><button className="btn btn-sm btn-ghost" onClick={() => block(id, false)}>Débloquer</button></div>
          ))}
          {!v.blocked.length && <div className="list-item small muted">Personne. Tu peux masquer quelqu’un depuis son profil.</div>}
        </div>
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} label="Ajouter une exception">
        <h2 className="title-m">Choisis un event</h2>
        <div className="list mt-12">
          {mine.filter((e) => !v.eventExceptions[e.id]).map((e) => (
            <div key={e.id} className="list-item">
              <span className="grow ellipsis" style={{ fontWeight: 600 }}>{e.title}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => { setEx(e.id, 'buddies'); setPick(false); }}>Buddies</button>
              <button className="btn btn-sm btn-dark" onClick={() => { setEx(e.id, 'hidden'); setPick(false); }}>Masquer</button>
            </div>
          ))}
          {!mine.length && <div className="list-item small muted">Aucun event dans ton agenda.</div>}
        </div>
      </Sheet>
    </div>
  );
}

export function SettingsPage() {
  const { s, setSettings, resetDemo, removeAlert, toast } = useStore();
  const [confirm, setConfirm] = useState(false);
  const st = s.settings;
  const T = ({ k, label, sub, ico }: { k: keyof typeof st; label: string; sub?: string; ico: string }) => (
    <div className="list-item"><span className="ico">{ico}</span><span className="grow"><b style={{ fontSize: 14 }}>{label}</b>{sub && <div className="tiny muted">{sub}</div>}</span><Toggle on={st[k]} onChange={(v) => setSettings({ [k]: v })} label={label} /></div>
  );
  return (
    <div className="screen">
      <TopBar title="Paramètres" />
      <div className="pad">
        <h2 className="eyebrow muted" style={{ marginBottom: 10 }}>Affichage</h2>
        <div className="list">
          <T k="dark" ico="🌙" label="Mode sombre" />
          <T k="largeText" ico="🔠" label="Texte agrandi" />
          <T k="reduceMotion" ico="🎞️" label="Réduire les animations" />
        </div>
        <h2 className="eyebrow muted mt-24" style={{ marginBottom: 10 }}>Notifications</h2>
        <div className="list">
          <T k="notifCalls" ico="👋" label="Réponses à mes appels" />
          <T k="notifMessages" ico="💬" label="Messages" />
          <T k="notifReminders" ico="⏰" label="Rappels avant un event" sub="La veille et 2 h avant" />
          <T k="notifSuggestions" ico="✨" label="Suggestions d’events" sub="Max. 2 par semaine" />
        </div>
        <h2 className="eyebrow muted mt-24" style={{ marginBottom: 10 }}>Mes alertes de recherche</h2>
        <div className="list">
          {s.alerts.map((a) => (
            <div key={a.id} className="list-item"><span className="ico">🔔</span><span className="grow small">{a.label}</span><button className="muted" aria-label="Supprimer l’alerte" onClick={() => removeAlert(a.id)}><Icon name="close" size={16} /></button></div>
          ))}
          {!s.alerts.length && <div className="list-item small muted">Aucune alerte. Crée-en une depuis Explorer après avoir filtré.</div>}
        </div>
        <h2 className="eyebrow muted mt-24" style={{ marginBottom: 10 }}>Organisateurs suivis</h2>
        <div className="list">
          {s.followed.map((o) => <div key={o} className="list-item"><span className="ico">📣</span><b className="grow" style={{ fontSize: 14 }}>{o}</b></div>)}
          {!s.followed.length && <div className="list-item small muted">Suis un organisateur depuis la fiche d’un event.</div>}
        </div>
        <h2 className="eyebrow muted mt-24" style={{ marginBottom: 10 }}>Compte</h2>
        <div className="list">
          <Link to="/profil/modifier" className="list-item"><span className="ico">✏️</span><span className="grow">Modifier mon profil</span><Icon name="chevron" size={18} /></Link>
          <Link to="/profil/visibilite" className="list-item"><span className="ico">🔒</span><span className="grow">Confidentialité & visibilité</span><Icon name="chevron" size={18} /></Link>
          <Link to="/aide" className="list-item"><span className="ico">❓</span><span className="grow">FAQ & aide</span><Icon name="chevron" size={18} /></Link>
          <button className="list-item" onClick={() => toast('Export prêt : tes données restent sur cet appareil 📦')}><span className="ico">📦</span><span className="grow">Exporter mes données</span></button>
          <button className="list-item" style={{ color: 'var(--coral)' }} onClick={() => setConfirm(true)}><span className="ico">🔄</span><span className="grow">Réinitialiser l’app</span></button>
        </div>
        <p className="tiny muted mt-24" style={{ textAlign: 'center', marginBottom: 30 }}>Buddy · version 0.1 (démo) · Données stockées sur cet appareil</p>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} label="Réinitialiser">
        <h2 className="title-m">Tout réinitialiser ?</h2>
        <p className="small muted mt-8">Ton profil, ton agenda et tes conversations seront effacés de cet appareil. Tu repartiras de l’onboarding.</p>
        <div className="row mt-16"><button className="btn btn-ghost grow" onClick={() => setConfirm(false)}>Annuler</button><button className="btn btn-primary grow" onClick={resetDemo}>Réinitialiser</button></div>
      </Sheet>
    </div>
  );
}

const FAQ = [
  ['Qu’est-ce qu’un appel ouvert ?', 'Sur la fiche d’un event, « Qui vient ? » te permet de dire que tu cherches quelqu’un pour y aller. Les personnes intéressées te répondent, tu choisis avec qui échanger, et une conversation de groupe se crée autour de l’event.'],
  ['Envie, Qui vient ?, J’y vais : quelle différence ?', '♡ Envie garde l’event dans ton agenda sans engagement. 👋 Qui vient ? cherche de la compagnie. ✓ J’y vais confirme ta venue et peut te faire apparaître dans « Qui y va ? ».'],
  ['Qui voit que je vais à un event ?', 'Par défaut, les autres participants. Tu peux te masquer partout (Visibilité → Apparaître sur les events) ou event par event via les exceptions.'],
  ['Ma position est-elle partagée ?', 'Non. Les autres voient seulement une distance approximative (« 2 km de toi »). Ta position sert uniquement à calculer les distances sur ton téléphone.'],
  ['Comment publier un event ?', 'Menu profil → Proposer un event, ou le bouton « Publier » dans Explorer. C’est gratuit pour les bars, associations et particuliers.'],
  ['Je ne me sens pas en sécurité avec quelqu’un', 'Depuis son profil : Masquer ou Signaler. La personne ne verra plus tes events ni tes appels. Pour une première rencontre, retrouvez-vous toujours dans un lieu public.'],
  ['Mes données sont-elles en ligne ?', 'Dans cette version de démonstration, tout reste sur ton appareil. La version connectée chiffrera les échanges et te permettra de supprimer ton compte à tout moment.'],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { toast } = useStore();
  return (
    <div className="screen">
      <TopBar title="FAQ & aide" />
      <div className="pad">
        <div className="list">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button className="list-item" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} style={i ? { borderTop: '1px solid var(--line)' } : undefined}>
                <b className="grow" style={{ fontSize: 14 }}>{q}</b><span style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><Icon name="down" size={18} /></span>
              </button>
              {open === i && <p className="small muted" style={{ padding: '0 16px 16px', lineHeight: 1.6 }}>{a}</p>}
            </div>
          ))}
        </div>
        <div className="card mt-24" style={{ padding: 18 }}>
          <b className="title-s">🛡️ Sécurité</b>
          <p className="small muted mt-8" style={{ lineHeight: 1.55 }}>En cas de danger immédiat, appelle le 112 (ou le 17). Tu peux aussi signaler un comportement depuis un profil ou un event : notre équipe le traite sous 24 h.</p>
          <button className="btn btn-md btn-dark mt-12" onClick={() => toast('Message envoyé à l’équipe Buddy 💌')}>Contacter l’équipe</button>
        </div>
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
