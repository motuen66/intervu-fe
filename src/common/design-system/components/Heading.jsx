import './Heading.css';

const TAG_MAP = {
  display: 'h1',
  section: 'h2',
  'sub-lg': 'h3',
  sub: 'h3',
  'sub-sm': 'h4',
  feature: 'h5',
};

export function Heading({ as, variant = 'section', inverted, children, className = '', ...props }) {
  const Tag = as || TAG_MAP[variant] || 'h2';
  const classes = [
    'claude-heading',
    `claude-heading--${variant}`,
    inverted && 'claude-heading--inverted',
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes} {...props}>{children}</Tag>;
}
