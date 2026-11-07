import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventItem, Person } from '../data/types';
import { catById } from '../data/catalog';
import { Icon } from './Icon';
import { useStore } from '../store/store';

export function Avatar({ person, size = 40, online }: { person: Pick<Person, 'name' | 'color'>; size?: number; online?: boolean }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: person.color, fontSize: size * 0.4 }} aria-label={person.name}>
      {person.name.charAt(0).toUpperCase()}
      {online && <span className="dot" />}
    </span>
  );
}

export function AvatarStack({ ids, size = 30, max = 4, extra = 0 }: { ids: string[]; size?: number; max?: number; extra?: number }) {
  const { person } = useStore();
  const shown = ids.slice(0, max);
  const rest = ids.length - shown.length + extra;
  return (
    <div className="stack">
      {shown.map((id) => <Avatar key={id} person={person(id)} size={size} />)}
      {rest > 0 && (
        <span className="avatar" style={{ width: size, height: size, background: 'var(--surface-2)', color: 'var(--muted)', fontSize: size * 0.34 }}>+{rest}</span>
      )}
    </div>
  );
}

/** Image d'event avec repli dégradé + emoji si l'image manque ou ne charge pas. */
export function Media({ event, className = '', style, emojiSize = 44, children }: { event: EventItem; className?: string; style?: React.CSSProperties; emojiSize?: number; children?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const c = catById(event.category);
  return (
    <div className={`media ${className}`} style={style}>
      <div className="fallback" style={{ background: `linear-gradient(140deg, ${c.color}, #1a1a2e 130%)`, fontSize: emojiSize }}>
        <span aria-hidden>{c.emoji}</span>
      </div>
      {event.image && !failed && <img src={event.image} alt="" loading="lazy" onError={() => setFailed(true)} />}
      {children}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function TopBar({ title, right, back = true, onBack }: { title?: ReactNode; right?: ReactNode; back?: boolean; onBack?: () => void }) {
  const nav = useNavigate();
  return (
    <div className="topbar">
      {back && (
        <button className="icon-btn" aria-label="Retour" onClick={onBack ?? (() => (window.history.length > 1 ? nav(-1) : nav('/')))}>
          <Icon name="back" />
        </button>
      )}
      <h1 className="ellipsis">{title}</h1>
      {right}
    </div>
  );
}

export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  if (!open) return null;
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={label} aria-modal="true">
        <div className="grab" />
        {children}
      </div>
    </>
  );
}

export function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="row gap-4" role={onChange ? 'radiogroup' : undefined} aria-label="Note">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} onClick={() => onChange?.(n)} style={{ color: n <= value ? '#F59E0B' : 'var(--line)', cursor: onChange ? 'pointer' : 'default' }}>
          <Icon name="star" size={size} fill="currentColor" stroke={0} />
        </button>
      ))}
    </div>
  );
}

export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="big">{emoji}</div>
      <div className="title-s" style={{ color: 'var(--text)' }}>{title}</div>
      {text && <p className="small mt-4">{text}</p>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}
