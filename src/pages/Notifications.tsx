import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import type { Notification } from '../data/types';
import { dayDiff, relTime } from '../lib/logic';
import { Empty, Seg, TopBar } from '../components/ui';

export function Notifications() {
  const { s, markAllRead, markRead } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<'all' | Notification['kind']>('all');
  const list = s.notifications.filter((n) => tab === 'all' || n.kind === tab);
  const today = list.filter((n) => dayDiff(new Date(n.at)) === 0);
  const older = list.filter((n) => dayDiff(new Date(n.at)) !== 0);
  const unread = s.notifications.some((n) => !n.read);

  const Item = ({ n }: { n: Notification }) => (
    <button className="list-item" style={{ background: n.read ? undefined : 'var(--coral-light)', alignItems: 'flex-start' }}
      onClick={() => { markRead(n.id); if (n.link) nav(n.link); }}>
      <span className="ico" style={{ background: 'var(--surface)' }}>{n.icon}</span>
      <span className="grow">
        <span className="small" style={{ lineHeight: 1.45, display: 'block' }} dangerouslySetInnerHTML={{ __html: n.text }} />
        <span className="tiny muted">{relTime(n.at)}</span>
      </span>
      {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', marginTop: 6 }} />}
    </button>
  );

  return (
    <div className="screen">
      <TopBar title="Notifications" right={unread ? <button className="link" onClick={markAllRead}>Tout lire</button> : undefined} />
      <div className="pad">
        <Seg value={tab} onChange={setTab} options={[{ id: 'all', label: 'Toutes' }, { id: 'social', label: 'Social' }, { id: 'event', label: 'Events' }, { id: 'agenda', label: 'Agenda' }]} />
        {today.length > 0 && <><h2 className="eyebrow muted mt-24" style={{ marginBottom: 10 }}>Aujourd’hui</h2><div className="list">{today.map((n) => <Item key={n.id} n={n} />)}</div></>}
        {older.length > 0 && <><h2 className="eyebrow muted mt-24" style={{ marginBottom: 10 }}>Plus tôt</h2><div className="list">{older.map((n) => <Item key={n.id} n={n} />)}</div></>}
        {!list.length && <Empty emoji="🔔" title="Rien de neuf" text="Les réponses à tes appels, rappels et nouveautés arrivent ici." />}
      </div>
    </div>
  );
}
