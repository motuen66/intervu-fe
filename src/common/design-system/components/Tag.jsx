import './Tag.css';

export function Tag({ removable, onRemove, interactive, active, children, className = '', ...props }) {
  const classes = [
    'claude-tag',
    interactive && 'claude-tag--interactive',
    active && 'claude-tag--active',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
      {removable && (
        <button type="button" className="claude-tag__remove" onClick={onRemove} aria-label="Remove">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
