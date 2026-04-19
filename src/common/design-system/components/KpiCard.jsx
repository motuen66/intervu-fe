import './KpiCard.css';

export function KpiCard({ label, value, delta, deltaDirection = 'neutral', deltaDir, className = '', ...props }) {
  const dir = deltaDirection || deltaDir || 'neutral';
  return (
    <div className={['claude-kpi', className].filter(Boolean).join(' ')} {...props}>
      {label && <span className="claude-kpi__label">{label}</span>}
      {value !== undefined && <span className="claude-kpi__value">{value}</span>}
      {delta !== undefined && (
        <span className={`claude-kpi__delta claude-kpi__delta--${dir}`}>
          {dir === 'up' ? '↑' : dir === 'down' ? '↓' : ''}
          {delta}
        </span>
      )}
    </div>
  );
}
