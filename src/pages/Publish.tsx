import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { CATEGORIES, IMAGES, allVenues, catById } from '../data/catalog';
import type { CategoryId } from '../data/types';
import { priceLabel } from '../lib/logic';
import { Toggle, TopBar } from '../components/ui';

const CAT_IMAGE: Partial<Record<CategoryId, string>> = {
  theatre: IMAGES.theatre, concert: IMAGES.jazz, cinema: IMAGES.theatre, fete: IMAGES.dance, jeux: IMAGES.games, expo: IMAGES.expo, marche: IMAGES.plant, danse: IMAGES.dance, patrimoine: IMAGES.histo,
};

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function Publish() {
  const VENUES = allVenues();
  const { s, publishEvent } = useStore();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState(s.user.name);
  const [category, setCategory] = useState<CategoryId>('concert');
  const [date, setDate] = useState(isoDate(new Date(Date.now() + 86400000 * 3)));
  const [from, setFrom] = useState('19:00');
  const [to, setTo] = useState('22:00');
  const [venueId, setVenueId] = useState(VENUES[0]?.id ?? '');
  const [free, setFree] = useState(true);
  const [price, setPrice] = useState(5);
  const [pmr, setPmr] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  const start = new Date(`${date}T${from}`);
  let end = new Date(`${date}T${to}`);
  if (end <= start) end = new Date(end.getTime() + 86400000);
  const valid = !!venueId && title.trim().length >= 3 && organizer.trim() && description.trim().length >= 10 && !Number.isNaN(start.getTime()) && start.getTime() > Date.now();

  const submit = () => {
    const id = publishEvent({
      title: title.trim(), organizer: organizer.trim(), category, start: start.toISOString(), end: end.toISOString(), venueId,
      price: free ? 0 : price, pmr, image: CAT_IMAGE[category], description: description.trim(), capacity: capacity ? Number(capacity) : undefined,
    });
    nav(`/event/${id}`, { replace: true });
  };

  return (
    <>
      <div className="screen with-cta">
        <TopBar title="Proposer un event" />
        <div className="pad">
          <div className="banner purple">📣 Bar, asso, collectif ou simple particulier : la publication est gratuite. Ton event apparaît dans Explorer et sur la carte.</div>

          <div className="field mt-24">
            <label htmlFor="p-title">Nom de l’event</label>
            <input id="p-title" className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Scène ouverte acoustique" />
          </div>
          <div className="field mt-16">
            <label htmlFor="p-org">Organisé par</label>
            <input id="p-org" className="input" value={organizer} maxLength={40} onChange={(e) => setOrganizer(e.target.value)} placeholder="Ton nom, ton bar, ton asso…" />
          </div>

          <div className="field mt-16">
            <label>Catégorie</label>
            <div className="row wrap gap-6">
              {CATEGORIES.map((c) => <button key={c.id} className={`chip ${category === c.id ? 'on' : ''}`} onClick={() => setCategory(c.id)}>{c.emoji} {c.label}</button>)}
            </div>
          </div>

          <div className="field mt-16">
            <label htmlFor="p-date">Date</label>
            <input id="p-date" type="date" className="input" value={date} min={isoDate(new Date())} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="row mt-12">
            <div className="field grow"><label htmlFor="p-from">Début</label><input id="p-from" type="time" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="field grow"><label htmlFor="p-to">Fin</label><input id="p-to" type="time" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>

          <div className="field mt-16">
            <label htmlFor="p-venue">Lieu</label>
            <select id="p-venue" className="input" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
              {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.address}</option>)}
            </select>
            <span className="tiny muted">Les lieux viennent de l’agenda de la Métropole. Ton lieu n’y est pas ? L’adresse libre arrive avec la version connectée.</span>
          </div>

          <div className="card mt-16" style={{ padding: '4px 16px' }}>
            <div className="row between" style={{ padding: '12px 0' }}><b>Gratuit</b><Toggle on={free} onChange={setFree} label="Gratuit" /></div>
            {!free && (
              <div style={{ padding: '0 0 12px' }}>
                <div className="row between small"><span className="muted">Prix d’entrée</span><b>{priceLabel(price)}</b></div>
                <input type="range" min={1} max={60} value={price} onChange={(e) => setPrice(+e.target.value)} aria-label="Prix" />
              </div>
            )}
            <div className="row between" style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}><b>♿ Accessible PMR</b><Toggle on={pmr} onChange={setPmr} label="Accessible PMR" /></div>
            <div className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <b>Jauge (optionnel)</b>
              <input className="input" style={{ width: 100, height: 40 }} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ''))} placeholder="—" aria-label="Jauge" />
            </div>
          </div>

          <div className="field mt-16">
            <label htmlFor="p-desc">Description <span style={{ float: 'right', fontWeight: 500 }}>{description.length} / 500</span></label>
            <textarea id="p-desc" className="input" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} placeholder="Ce qui va se passer, pour qui, ce qu’il faut apporter…" style={{ minHeight: 120 }} />
          </div>

          <div className="small muted mt-16">Aperçu : {catById(category).emoji} <b style={{ color: 'var(--text)' }}>{title || 'Ton event'}</b> · {start.getTime() ? start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'} à {from} · {free ? 'Gratuit' : priceLabel(price)}</div>
          {start.getTime() <= Date.now() && <div className="banner amber mt-12">La date de début doit être dans le futur.</div>}
        </div>
      </div>
      <div className="cta-bar"><button className="btn btn-primary btn-block" disabled={!valid} onClick={submit}>Publier l’event 🎉</button></div>
    </>
  );
}
