import './SectionShell.css';

export function SectionShell({ dark, narrow, hero, as: Tag = 'section', children, className = '', ...props }) {
  const classes = [
    'claude-section',
    dark && 'claude-section--dark',
    narrow && 'claude-section--narrow',
    hero && 'claude-section--hero',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} {...props}>
      <div className="claude-section__inner">{children}</div>
    </Tag>
  );
}
