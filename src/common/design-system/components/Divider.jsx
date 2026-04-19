import './Divider.css';

export function Divider({ vertical, emphasis, className = '', ...props }) {
  const classes = [
    'claude-divider',
    vertical && 'claude-divider--vertical',
    emphasis && 'claude-divider--emphasis',
    className,
  ].filter(Boolean).join(' ');

  return <hr className={classes} role="separator" aria-orientation={vertical ? 'vertical' : 'horizontal'} {...props} />;
}
