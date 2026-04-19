import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Drawer.css';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Drawer({ open, onClose, title, side = 'right', children, className = '' }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    drawerRef.current?.focus();
    return () => prev?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="claude-theme">
      <div
        className="claude-drawer__scrim"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'claude-drawer-title' : undefined}
        tabIndex={-1}
        className={['claude-drawer', `claude-drawer--${side}`, className].filter(Boolean).join(' ')}
      >
        {(title || onClose) && (
          <div className="claude-drawer__header">
            {title && <h2 id="claude-drawer-title" className="claude-drawer__title">{title}</h2>}
            {onClose && (
              <button
                type="button"
                className="claude-icon-btn claude-icon-btn--ghost"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}
        <div className="claude-drawer__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
