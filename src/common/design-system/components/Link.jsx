import './Link.css';

export function Link({ href, inverted, children, className = '', ...props }) {
  const classes = ['claude-link', inverted && 'claude-link--inverted', className].filter(Boolean).join(' ');
  const Tag = href ? 'a' : 'button';
  return <Tag href={href} className={classes} {...props}>{children}</Tag>;
}
