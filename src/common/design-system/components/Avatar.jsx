import './Avatar.css';

export function Avatar({ size = 'md', src, alt, initials, className = '', ...props }) {
  const classes = ['claude-avatar', `claude-avatar--${size}`, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...props}>
      {src ? <img src={src} alt={alt || initials || 'Avatar'} /> : (initials || '?')}
    </span>
  );
}
