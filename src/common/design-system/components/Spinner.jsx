import './Spinner.css';

export function Spinner({ size = 'md', inverted, className = '', ...props }) {
  const classes = [
    'claude-spinner',
    `claude-spinner--${size}`,
    inverted && 'claude-spinner--inverted',
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes} role="status" aria-label="Loading" {...props} />;
}
