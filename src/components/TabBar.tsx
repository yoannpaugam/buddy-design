import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';
import { useStore } from '../store/store';

const TABS = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/explorer', label: 'Explorer', icon: 'search' },
  { to: '/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/messages', label: 'Messages', icon: 'chat' },
];

export function TabBar() {
  const { s } = useStore();
  const unread = s.conversations.reduce((n, c) => n + (c.archived ? 0 : c.unread), 0) + s.requests.length;
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <Icon name={t.icon} size={23} />
          {t.label}
          {t.to === '/messages' && unread > 0 && <span className="badge">{unread}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
