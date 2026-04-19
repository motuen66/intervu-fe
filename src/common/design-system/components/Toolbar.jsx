import './Toolbar.css';

export function Toolbar({ sticky, group, actions, children, className = '', ...props }) {
  const classes = ['claude-toolbar', sticky && 'claude-toolbar--sticky', className].filter(Boolean).join(' ');
  return (
    <div className={classes} role="toolbar" {...props}>
      {group && <div className="claude-toolbar__group">{group}</div>}
      {children}
      {actions && <div className="claude-toolbar__actions">{actions}</div>}
    </div>
  );
}
