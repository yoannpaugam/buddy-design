import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { CATEGORIES } from '../data/catalog';
import type { Filters } from '../data/types';
import { DEFAULT_FILTERS, filterSummary, matches } from '../lib/logic';
import { Icon } from '../components/Icon';
import { Toggle } from '../components/ui';

const DATES: { id: Filters['date']; label: string }[] = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'tomorrow', label: 'Demain' },
  { id: 'weekend', label: 'Week-end' },
  { id: 'week', label: '7 jours' },
  { id: 'all', label: 'Peu importe' },
];
const HOUR_PRESETS = [
  { label: 'Journée', from: 9, to: 18 },
  { label: 'Soirée', from: 18, to: 24 },
  { label: 'Après-midi & soir', from: 15, to: 22 },
  { label: 'Toute la journée', from: 0, to: 24 },
];

export function FiltersPage() {
  const { s, events, setFilters } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState<Filters>(s.filters);
  const up = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));
  const count = events.filter((e) => matches(e, f, s.user)).length;

  return (
    <>
      <div className="screen with-cta">
        <div className="dark-head">
          <div className="row between">
            <button className="icon-btn glass" aria-label="Fermer" onClick={() => nav(-1)}><Icon name="close" /></button>
            <h1 className="title-m" style={{ color: '#fff' }}>Filtres</h1>
            <button className="small" style={{ color: 'var(--coral-mid)', fontWeight: 700 }} onClick={() => setF({ ...DEFAULT_FILTERS, query: f.query })}>Réinitialiser</button>
          </div>
          <div className="search mt-16" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'none' }}>
            <Icon name="search" size={18} />
            <input style={{ color: '#fff' }} value={f.query} onChange={(e) => up({ query: e.target.value })} placeholder="Théâtre, jazz, Bouffay…" aria-label="Recherche" />
          </div>
          <div className="mt-16" style={{ background: 'rgba(255,92,87,0.14)', border: '1px solid rgba(255,92,87,0.35)', borderRadius: 14, padding: '12px 14px' }}>
            <div className="tiny" style={{ color: 'var(--coral-mid)', fontWeight: 700 }}>✨ TA SORTIE</div>
            <div className="mt-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>« {filterSummary(f)} »</div>
          </div>
        </div>

        <div className="pad">
          <Section title="Date">
            <div className="row wrap gap-8">
              {DATES.map((d) => <button key={d.id} className={`chip ${f.date === d.id ? 'on' : ''}`} onClick={() => up({ date: d.id })}>{d.label}</button>)}
            </div>
          </Section>

          <Section title="Heure de début" value={f.hourFrom === 0 && f.hourTo === 24 ? 'Peu importe' : `${f.hourFrom}h – ${f.hourTo}h`}>
            <div className="row wrap gap-8">
              {HOUR_PRESETS.map((h) => <button key={h.label} className={`chip ${f.hourFrom === h.from && f.hourTo === h.to ? 'on' : ''}`} onClick={() => up({ hourFrom: h.from, hourTo: h.to })}>{h.label}</button>)}
            </div>
            <div className="card mt-12" style={{ padding: '10px 16px' }}>
              <label className="row between small"><span className="muted">À partir de</span><b>{f.hourFrom}h</b></label>
              <input type="range" min={0} max={23} value={f.hourFrom} aria-label="Heure de début minimale" onChange={(e) => up({ hourFrom: Math.min(+e.target.value, f.hourTo - 1) })} />
              <label className="row between small"><span className="muted">Jusqu’à</span><b>{f.hourTo}h</b></label>
              <input type="range" min={1} max={24} value={f.hourTo} aria-label="Heure de début maximale" onChange={(e) => up({ hourTo: Math.max(+e.target.value, f.hourFrom + 1) })} />
            </div>
          </Section>

          <Section title="Distance" value={f.maxKm >= 30 ? 'Partout' : `${f.maxKm} km max`}>
            <input type="range" min={1} max={30} value={f.maxKm} aria-label="Distance maximale" onChange={(e) => up({ maxKm: +e.target.value })} />
            <div className="row between tiny muted"><span>1 km</span><span>🚶 {f.maxKm <= 2 ? 'À pied' : f.maxKm <= 6 ? 'À vélo' : 'En transport'}</span><span>30 km+</span></div>
          </Section>

          <Section title="Prix" value={f.freeOnly ? 'Gratuit' : f.maxPrice >= 100 ? 'Peu importe' : `≤ ${f.maxPrice} €`}>
            <div className="card row between" style={{ padding: '12px 16px' }}>
              <span style={{ fontWeight: 600 }}>Gratuit uniquement</span>
              <Toggle on={f.freeOnly} onChange={(v) => up({ freeOnly: v })} label="Gratuit uniquement" />
            </div>
            {!f.freeOnly && (
              <div className="mt-12">
                <input type="range" min={5} max={100} step={5} value={f.maxPrice} aria-label="Prix maximum" onChange={(e) => up({ maxPrice: +e.target.value })} />
                <div className="row between tiny muted"><span>5 €</span><span>100 €+</span></div>
              </div>
            )}
          </Section>

          <Section title="Catégories" value={f.categories.length ? `${f.categories.length} choisie${f.categories.length > 1 ? 's' : ''}` : 'Toutes'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIES.map((c) => {
                const on = f.categories.includes(c.id);
                return (
                  <button key={c.id} aria-pressed={on} onClick={() => up({ categories: on ? f.categories.filter((x) => x !== c.id) : [...f.categories, c.id] })}
                    className="card" style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderWidth: 2, borderColor: on ? 'var(--coral)' : 'var(--line)', background: on ? 'var(--coral-light)' : 'var(--surface)' }}>
                    <span style={{ fontSize: 22 }}>{c.emoji}</span><b style={{ fontSize: 12.5 }}>{c.label}</b>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Accessibilité">
            <div className="card row between" style={{ padding: '12px 16px' }}>
              <span><b>♿ Accès PMR</b><div className="tiny muted">Lieux accessibles en fauteuil</div></span>
              <Toggle on={f.pmr} onChange={(v) => up({ pmr: v })} label="Accès PMR" />
            </div>
          </Section>
        </div>
      </div>
      <div className="cta-bar">
        <button className="btn btn-primary btn-block" disabled={!count} onClick={() => { setFilters(f); nav('/explorer', { replace: true }); }}>
          {count ? `Voir les résultats · ${count}` : 'Aucun résultat'}
        </button>
      </div>
    </>
  );
}

function Section({ title, value, children }: { title: string; value?: string; children: React.ReactNode }) {
  return (
    <section className="mt-24">
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 className="title-s">{title}</h2>
        {value && <span className="small coral" style={{ fontWeight: 700 }}>{value}</span>}
      </div>
      {children}
    </section>
  );
}
