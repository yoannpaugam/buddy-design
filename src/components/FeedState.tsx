import { useStore } from '../store/store';
import { relTime } from '../lib/logic';

/** État du chargement des vrais événements + mention de la source (obligation de la Licence Ouverte). */
export function FeedState({ credit = true }: { credit?: boolean }) {
  const { feed, reloadFeed } = useStore();
  if (feed.status === 'loading') {
    return (
      <div className="col gap-14 mt-16" aria-busy="true" aria-label="Chargement des événements">
        {[0, 1].map((i) => <div key={i} className="card" style={{ height: 210, background: 'var(--surface-2)', border: 0, opacity: 0.7 }} />)}
        <p className="small muted" style={{ textAlign: 'center' }}>Chargement des événements de Nantes…</p>
      </div>
    );
  }
  if (feed.status === 'error') {
    return (
      <div className="banner amber mt-16" role="alert">
        <span>📡</span>
        <div className="grow">Impossible de charger les événements. Vérifie ta connexion.</div>
        <button className="btn btn-sm btn-dark" onClick={reloadFeed}>Réessayer</button>
      </div>
    );
  }
  if (!credit) return null;
  return (
    <p className="tiny muted mt-8">
      Données : {feed.sources.map((s, i) => (
        <span key={s.id}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{s.name}</a></span>
      ))} ({feed.sources[0]?.license ?? 'Licence Ouverte 2.0'}){feed.generatedAt ? ` · mis à jour ${relTime(feed.generatedAt)}` : ''}{feed.stale ? ' · données de secours' : ''}
    </p>
  );
}
