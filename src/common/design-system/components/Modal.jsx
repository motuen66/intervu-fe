import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Modal({ open, onClose, title, footer, size, children, className = '' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    dialogRef.current?.focus();
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
    <div
      className="claude-theme claude-modal__scrim"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'claude-modal-title' : undefined}
        tabIndex={-1}
        className={['claude-modal__dialog', size && `claude-modal__dialog--${size}`, className].filter(Boolean).join(' ')}
      >
        {(title || onClose) && (
          <div className="claude-modal__header">
            {title && <h2 id="claude-modal-title" className="claude-modal__title">{title}</h2>}
            {onClose && (
              <button type="button" className="claude-modal__close" onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            )}
          </div>
        )}
        <div className="claude-modal__body">{children}</div>
        {footer && <div className="claude-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
