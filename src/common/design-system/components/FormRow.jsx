import './FormRow.css';

export function FormRow({ inline, stacked, children, className = '', ...props }) {
  const classes = [
    'claude-form-row',
    inline && 'claude-form-row--inline',
    stacked && 'claude-form-row--stacked',
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes} {...props}>{children}</div>;
}
