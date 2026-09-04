import { useEffect } from 'react';
import { Icon, type IconName } from './Icons';

export interface MenuItem {
  label: string;
  icon?: IconName;
  onClick?: () => void;
  sep?: boolean;
  disabled?: boolean;
}

export function ContextMenu({
  x, y, items, onClose,
}: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [onClose]);

  return (
    <ul className="context-menu" style={{ left: x, top: y }} onPointerDown={(e) => e.stopPropagation()}>
      {items.map((it, i) =>
        it.sep ? (
          <hr key={i} />
        ) : (
          <li
            key={i}
            data-disabled={it.disabled}
            onClick={() => { if (!it.disabled) { it.onClick?.(); onClose(); } }}
          >
            <span className="mi">{it.icon ? <Icon name={it.icon} size={16} /> : null}</span>
            {it.label}
          </li>
        ),
      )}
    </ul>
  );
}
