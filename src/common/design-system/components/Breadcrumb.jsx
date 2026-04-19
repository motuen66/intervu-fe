import './Breadcrumb.css';

export function Breadcrumb({ items, separator = '/', className = '', ...props }) {
  return (
    <nav aria-label="Breadcrumb" {...props}>
      <ol className={['claude-breadcrumb', className].filter(Boolean).join(' ')}>
        {items.map((item, i) => (
          <li key={i} className="claude-breadcrumb__item" aria-current={i === items.length - 1 ? 'page' : undefined}>
            {i > 0 && <span className="claude-breadcrumb__separator" aria-hidden="true">{separator}</span>}
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
