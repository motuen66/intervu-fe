import './Badge.css';

export function Badge({ variant = 'neutral', children, className = '', ...props }) {
  const classes = ['claude-badge', `claude-badge--${variant}`, className].filter(Boolean).join(' ');
  return <span className={classes} {...props}>{children}</span>;
}
