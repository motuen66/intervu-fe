import './Text.css';

const TAG_MAP = {
  'body-lg': 'p',
  body: 'p',
  'body-sm': 'p',
  'body-serif': 'p',
  caption: 'span',
  label: 'span',
  overline: 'span',
  micro: 'span',
};

export function Text({ as, variant = 'body', secondary, tertiary, inverted, medium, children, className = '', ...props }) {
  const Tag = as || TAG_MAP[variant] || 'p';
  const classes = [
    'claude-text',
    `claude-text--${variant}`,
    secondary && 'claude-text--secondary',
    tertiary && 'claude-text--tertiary',
    inverted && 'claude-text--inverted',
    medium && 'claude-text--medium',
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes} {...props}>{children}</Tag>;
}
