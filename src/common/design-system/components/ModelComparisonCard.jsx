import './ModelComparisonCard.css';

export function ModelComparisonGrid({ children, className = '', ...props }) {
  return <div className={['claude-compare', className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}

export function ModelComparisonCard({ title, price, description, meta, features, cta, badges, featured, className = '', ...props }) {
  const classes = ['claude-compare__card', featured && 'claude-compare__card--featured', className].filter(Boolean).join(' ');
  const bodyText = description || meta;
  return (
    <div className={classes} {...props}>
      {title && <h3 className="claude-compare__title">{title}</h3>}
      {price && <p className="claude-compare__price">{price}</p>}
      {badges && <div className="claude-compare__badges">{badges}</div>}
      {bodyText && <p className="claude-compare__meta">{bodyText}</p>}
      {features && features.length > 0 && (
        <ul className="claude-compare__features">
          {features.map((f, i) => (
            <li key={i} className="claude-compare__feature">{f}</li>
          ))}
        </ul>
      )}
      {cta && <div className="claude-compare__cta">{cta}</div>}
    </div>
  );
}
