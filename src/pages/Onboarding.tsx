import { useState } from 'react';
import { CATEGORIES, CITIES } from '../data/catalog';
import type { CategoryId } from '../data/types';
import { useStore } from '../store/store';
import { Icon } from '../components/Icon';
import { normalize } from '../lib/logic';

const PROMISES = [
  { icon: '🔍', title: 'Trouve des events près de toi', sub: 'Concerts, impro, marchés, jeux… même les plus confidentiels.' },
  { icon: '👋', title: 'Lance un appel, trouve quelqu’un', sub: 'Plus besoin d’attendre un ami dispo pour sortir.' },
  { icon: '📅', title: 'Sortez ensemble, planifiez ensemble', sub: 'Groupes, agenda partagé, discussions.' },
];
const CONCEPT = [
  { icon: '🧭', title: 'Découvre', text: 'Filtre par date, heure, distance, prix et envies. Buddy te montre ce qui se passe autour de toi, même les petits events invisibles ailleurs.' },
  { icon: '👋', title: 'Appelle', text: 'Un event te tente mais tu n’as personne ? Lance un « Qui vient ? » ou réponds à celui de quelqu’un.' },
  { icon: '🏠', title: 'Retrouve-toi', text: 'Les gens que tu rencontres deviennent tes Buddies. Formez un groupe et organisez vos prochaines sorties.' },
];
const CHARTER = [
  { icon: '💛', title: 'Bienveillance', text: 'On vient pour passer un bon moment. Pas de jugement, pas de drague insistante.' },
  { icon: '🤝', title: 'Entraide', text: 'Tu as dit « j’y vais » ? Tu préviens si tu ne viens plus. Quelqu’un compte peut-être sur toi.' },
  { icon: '🛡️', title: 'Sécurité', text: 'Premiers rendez-vous dans des lieux publics. Tu peux signaler ou masquer quelqu’un à tout moment.' },
  { icon: '🌱', title: 'Respect de l’environnement', text: 'On privilégie le local, la marche, le vélo et les transports en commun.' },
];
const BIO_SUGGESTIONS: Partial<Record<CategoryId, string>> = {
  theatre: 'Fan d’impro et de petites salles 🎭',
  concert: 'Toujours partant·e pour un concert 🎵',
  jeux: 'Joueur·se de jeux de société, on fait une partie ? 🎲',
  expo: 'Curieux·se d’expos et de galeries 🖼️',
  marche: 'Marchés, plantes et brocantes le week-end 🌿',
  sport: 'Partant·e pour bouger : vélo, pétanque, rando ⚽',
  danse: 'On danse ? Bal folk, salsa, tout me va 💃',
  atelier: 'J’aime apprendre de mes mains 🛠️',
  patrimoine: 'Histoire, châteaux et visites insolites 🏰',
};
const COLORS = ['#FF5C57', '#8B5CF6', '#22C55E', '#F59E0B', '#0EA5E9', '#EC4899'];

export function Onboarding() {
  const { completeOnboarding, toast } = useStore();
  const [step, setStep] = useState(0);
  const [charter, setCharter] = useState(false);
  const [city, setCity] = useState({ name: 'Nantes', lat: 47.213, lng: -1.559 });
  const [cityQuery, setCityQuery] = useState('');
  const [gps, setGps] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [radius, setRadius] = useState(5);
  const [interests, setInterests] = useState<CategoryId[]>([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const locate = () => {
    if (!('geolocation' in navigator)) return setGps('error');
    setGps('loading');
    navigator.geolocation.getCurrentPosition(
      (p) => { setCity({ name: 'Ma position', lat: p.coords.latitude, lng: p.coords.longitude }); setGps('ok'); },
      () => setGps('error'),
      { timeout: 8000 },
    );
  };

  const finish = (demo = false) =>
    completeOnboarding(
      demo
        ? { name: 'Thomas', bio: 'Nouveau à Nantes, fan d’impro et de jeux de société 🎭🎲', interests: ['theatre', 'concert', 'jeux', 'patrimoine'], radius: 5, color: '#FF5C57' }
        : { name: name.trim(), bio: bio.trim(), city: city.name === 'Ma position' ? 'Nantes' : city.name, lat: city.lat, lng: city.lng, radius, interests, color },
    );

  const cityResults = cityQuery ? CITIES.filter((c) => normalize(c.name).includes(normalize(cityQuery))) : CITIES.slice(0, 4);

  // ---- Écran 0 : bienvenue
  if (step === 0) {
    return (
      <div className="screen" style={{ background: 'var(--night)', color: '#fff', display: 'flex', flexDirection: 'column', padding: 'calc(40px + var(--safe-t)) 26px calc(26px + var(--safe-b))' }}>
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="logo pop" style={{ fontSize: 64 }}>Buddy</div>
          <p className="mt-12" style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Le pote qui manquait à tes sorties.</p>
          <div className="col gap-14 mt-32">
            {PROMISES.map((p) => (
              <div key={p.title} className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{p.title}</div>
                  <div className="small" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block mt-24" onClick={next}>Créer mon compte</button>
        <button className="small mt-16" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => finish(true)}>
          Juste jeter un œil ? <b style={{ color: '#fff' }}>Essayer avec un profil démo</b>
        </button>
      </div>
    );
  }

  const Header = ({ label }: { label?: string }) => (
    <div className="row between" style={{ padding: 'calc(16px + var(--safe-t)) 20px 0' }}>
      <button className="icon-btn" onClick={prev} aria-label="Retour"><Icon name="back" /></button>
      {label && <span className="small muted" style={{ fontWeight: 600 }}>{label}</span>}
      <div style={{ width: 40 }} />
    </div>
  );
  const Progress = ({ n }: { n: number }) => (
    <div className="row gap-6 pad mt-16">
      {[1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= n ? 'var(--coral)' : 'var(--line)' }} />)}
    </div>
  );
  const Footer = ({ children }: { children: React.ReactNode }) => (
    <div style={{ padding: '12px 20px calc(18px + var(--safe-b))', background: 'var(--bg)' }}>{children}</div>
  );

  // ---- Écran 1 : concept
  if (step === 1) {
    return (
      <>
        <div className="screen">
          <Header />
          <div className="pad mt-16">
            <h1 className="title-xl">Comment ça marche ?</h1>
            <p className="muted mt-8">Buddy, c’est trois choses simples qui s’enchaînent.</p>
            <div className="col gap-14 mt-24">
              {CONCEPT.map((c, i) => (
                <div key={c.title} className="card" style={{ padding: 18, display: 'flex', gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{c.icon}</div>
                  <div>
                    <div className="eyebrow coral">Étape {i + 1}</div>
                    <div className="title-m mt-4">{c.title}</div>
                    <p className="small muted mt-4" style={{ lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer><button className="btn btn-primary btn-block" onClick={next}>Suivant →</button></Footer>
      </>
    );
  }

  // ---- Écran 2 : charte
  if (step === 2) {
    return (
      <>
        <div className="screen">
          <Header />
          <div className="pad mt-16">
            <h1 className="title-xl">Notre charte</h1>
            <p className="muted mt-8">Buddy fonctionne parce que ceux qui l’utilisent se respectent. Quelques principes non négociables.</p>
            <div className="col mt-24">
              {CHARTER.map((c) => (
                <div key={c.title} className="row" style={{ alignItems: 'flex-start', gap: 14, padding: '12px 0' }}>
                  <div style={{ fontSize: 24 }}>{c.icon}</div>
                  <div>
                    <div className="title-s">{c.title}</div>
                    <p className="small muted mt-4" style={{ lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="banner purple mt-12">❓ Des questions ? Retrouve la FAQ à tout moment dans Profil → Aide.</div>
            <label className="row mt-24" style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <input type="checkbox" checked={charter} onChange={(e) => setCharter(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--coral)' }} />
              J’ai lu et j’accepte la charte Buddy
            </label>
          </div>
        </div>
        <Footer><button className="btn btn-primary btn-block" disabled={!charter} onClick={next}>Suivant →</button></Footer>
      </>
    );
  }

  // ---- Écran 3 : ville
  if (step === 3) {
    return (
      <>
        <div className="screen">
          <Header label="Étape 1 sur 3" />
          <Progress n={1} />
          <div className="pad mt-24">
            <h1 className="title-xl">Tu es où ?</h1>
            <p className="muted mt-8">Buddy adapte les events à ta localisation. Tu pourras la changer à tout moment.</p>
            <div className="search mt-24">
              <Icon name="search" size={18} />
              <input placeholder="Rechercher une ville" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} aria-label="Ville" />
            </div>
            <button className="card row mt-12" style={{ width: '100%', padding: 14, textAlign: 'left' }} onClick={locate}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--coral-light)', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="locate" size={18} /></span>
              <span className="grow">
                <b style={{ fontSize: 14 }}>Utiliser ma position</b>
                <div className="tiny muted">{gps === 'loading' ? 'Localisation…' : gps === 'ok' ? '✓ Position trouvée' : gps === 'error' ? 'Impossible — choisis une ville ci-dessous' : 'Plus précis pour les distances'}</div>
              </span>
            </button>
            <div className="list mt-12">
              {cityResults.map((c) => (
                <button key={c.name} className="list-item" onClick={() => { setCity(c); setGps('idle'); }}>
                  <span className="ico">📍</span>
                  <span className="grow" style={{ fontWeight: 600 }}>{c.name}</span>
                  {city.name === c.name && <span className="coral"><Icon name="check" /></span>}
                </button>
              ))}
              {!cityResults.length && <div className="list-item muted small">Buddy arrive bientôt dans cette ville 🚀</div>}
            </div>
            <div className="card mt-16" style={{ padding: 16 }}>
              <div className="row between"><b style={{ fontSize: 14 }}>Rayon de recherche par défaut</b><span className="title-s coral">{radius} km</span></div>
              <input type="range" min={1} max={30} value={radius} onChange={(e) => setRadius(+e.target.value)} aria-label="Rayon" className="mt-8" />
              <div className="tiny muted">Tu pourras affiner à chaque recherche</div>
            </div>
          </div>
        </div>
        <Footer><button className="btn btn-primary btn-block" onClick={next}>Continuer →</button></Footer>
      </>
    );
  }

  // ---- Écran 4 : goûts
  if (step === 4) {
    return (
      <>
        <div className="screen">
          <Header label="Étape 2 sur 3" />
          <Progress n={2} />
          <div className="pad mt-24">
            <h1 className="title-xl">Qu’est-ce qui te fait sortir ?</h1>
            <p className="muted mt-8">Choisis au moins 2. Buddy te proposera des events qui te ressemblent.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }} className="mt-24">
              {CATEGORIES.map((c) => {
                const on = interests.includes(c.id);
                return (
                  <button key={c.id} aria-pressed={on} onClick={() => setInterests((xs) => (on ? xs.filter((x) => x !== c.id) : [...xs, c.id]))}
                    className="card" style={{ padding: '18px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderColor: on ? 'var(--coral)' : 'var(--line)', borderWidth: 2, background: on ? 'var(--coral-light)' : 'var(--surface)' }}>
                    <span style={{ fontSize: 30 }}>{c.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="small mt-16" style={{ textAlign: 'center', fontWeight: 600, color: interests.length >= 2 ? 'var(--green-dark)' : 'var(--muted)' }}>
              {interests.length} sélectionné{interests.length > 1 ? 's' : ''} · minimum 2
            </p>
          </div>
        </div>
        <Footer><button className="btn btn-primary btn-block" disabled={interests.length < 2} onClick={next}>Continuer →</button></Footer>
      </>
    );
  }

  // ---- Écran 5 : profil
  if (step === 5) {
    const suggestions = interests.map((i) => BIO_SUGGESTIONS[i]).filter(Boolean) as string[];
    return (
      <>
        <div className="screen">
          <Header label="Étape 3 sur 3" />
          <Progress n={3} />
          <div className="pad mt-24">
            <h1 className="title-xl">Comment tu t’appelles ?</h1>
            <p className="muted mt-8">Les gens verront ça quand tu rejoins un event ou que tu lances un appel.</p>
            <div className="col mt-24" style={{ alignItems: 'center' }}>
              <span className="avatar" style={{ width: 88, height: 88, background: color, fontSize: 36 }}>{(name.trim()[0] ?? '?').toUpperCase()}</span>
              <div className="row gap-8 mt-8" aria-label="Couleur d’avatar">
                {COLORS.map((c) => (
                  <button key={c} aria-label={`Couleur ${c}`} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, outline: color === c ? '3px solid var(--text)' : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <div className="field mt-24">
              <label htmlFor="ob-name">Prénom</label>
              <input id="ob-name" className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom" autoComplete="given-name" />
            </div>
            <div className="field mt-16">
              <label htmlFor="ob-bio">Bio courte <span style={{ float: 'right', fontWeight: 500 }}>{bio.length} / 140</span></label>
              <textarea id="ob-bio" className="input" value={bio} maxLength={140} onChange={(e) => setBio(e.target.value)} placeholder="Ce que tu aimes, ce que tu cherches…" />
            </div>
            {suggestions.length > 0 && (
              <div className="mt-12">
                <div className="tiny muted" style={{ fontWeight: 700 }}>✨ Suggestions selon tes goûts</div>
                <div className="row wrap gap-6 mt-8">
                  {suggestions.slice(0, 3).map((t) => <button key={t} className="chip" style={{ height: 32, fontSize: 12 }} onClick={() => setBio(t)}>{t}</button>)}
                </div>
              </div>
            )}
            <div className="banner green mt-16">🔒 Seuls ton prénom et ta bio sont visibles. Ton nom complet et ton email restent privés.</div>
          </div>
        </div>
        <Footer><button className="btn btn-primary btn-block" disabled={!name.trim()} onClick={next}>{name.trim() ? `C’est parti, ${name.trim()} 🎉` : 'Indique ton prénom'}</button></Footer>
      </>
    );
  }

  // ---- Écran 6 : terminé
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 30, background: 'var(--night)', color: '#fff' }}>
      <div className="pop" style={{ fontSize: 72 }}>🎉</div>
      <h1 className="title-xl mt-16">Bienvenue, {name.trim()} !</h1>
      <p className="mt-8" style={{ color: 'rgba(255,255,255,0.7)' }}>Ton compte est prêt. Direction {city.name === 'Ma position' ? 'les alentours' : city.name} pour découvrir tes premiers events.</p>
      <button className="btn btn-primary btn-block mt-32" onClick={() => { finish(); toast('Bienvenue sur Buddy 👋'); }}>C’est parti !</button>
    </div>
  );
}
