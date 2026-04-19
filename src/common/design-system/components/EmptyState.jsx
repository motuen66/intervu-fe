import './EmptyState.css';

export function EmptyState({ art, title, body, actions, shadowed, className = '', ...props }) {
  const classes = ['claude-empty', shadowed && 'claude-empty--shadowed', className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...props}>
      {art && <div className="claude-empty__art">{art}</div>}
      {title && <p className="claude-empty__title">{title}</p>}
      {body && <p className="claude-empty__body">{body}</p>}
      {actions && <div className="claude-empty__actions">{actions}</div>}
    </div>
  );
}
