import './Code.css';

export function Code({ block, children, className = '', ...props }) {
  const Tag = block ? 'pre' : 'code';
  const classes = ['claude-code', block && 'claude-code--block', className].filter(Boolean).join(' ');
  return <Tag className={classes} {...props}><code>{children}</code></Tag>;
}
