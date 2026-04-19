import './Button.css';

export function Button({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  iconOnly = false,
  as: Tag = 'button',
  children,
  className = '',
  ...props
}) {
  const classes = [
    'claude-btn',
    `claude-btn--${variant}`,
    `claude-btn--${size}`,
    loading && 'claude-btn--loading',
    (disabled || loading) && 'claude-btn--disabled',
    iconOnly && 'claude-btn--icon-only',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} disabled={Tag === 'button' ? disabled || loading : undefined} {...props}>
      {loading && <span className="claude-btn__spinner" aria-hidden="true" />}
      {children}
    </Tag>
  );
}
