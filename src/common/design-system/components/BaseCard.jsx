import './BaseCard.css';

export function BaseCard({ variant, elevated, dark, interactive, featured, as: Tag = 'div', header, footer, children, className = '', ...props }) {
  const classes = [
    'claude-card',
    variant && `claude-card--${variant}`,
    elevated && 'claude-card--elevated',
    dark && 'claude-card--dark',
    interactive && 'claude-card--interactive',
    featured && 'claude-card--featured',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} tabIndex={interactive ? 0 : undefined} {...props}>
      {header && <div className="claude-card__header">{header}</div>}
      <div className="claude-card__body">{children}</div>
      {footer && <div className="claude-card__footer">{footer}</div>}
    </Tag>
  );
}
