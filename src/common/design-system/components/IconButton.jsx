import './IconButton.css';

export function IconButton({ variant = 'ghost', size, disabled, children, className = '', 'aria-label': ariaLabel, ...props }) {
  const classes = [
    'claude-icon-btn',
    `claude-icon-btn--${variant}`,
    size && `claude-icon-btn--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  );
}
