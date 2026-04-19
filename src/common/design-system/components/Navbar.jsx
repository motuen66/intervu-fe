import { useState } from 'react';
import './Navbar.css';

export function Navbar({ brand, links = [], cta, dark, className = '', ...props }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={['claude-nav', dark && 'claude-nav--dark', className].filter(Boolean).join(' ')}
      aria-label="Main navigation"
      {...props}
    >
      {brand && (
        typeof brand === 'string'
          ? <a href="/" className="claude-nav__brand">{brand}</a>
          : <div className="claude-nav__brand">{brand}</div>
      )}

      <div className="claude-nav__links" role="list">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            role="listitem"
            className={['claude-nav__link', link.active && 'claude-nav__link--active'].filter(Boolean).join(' ')}
            aria-current={link.active ? 'page' : undefined}
          >
            {link.label}
          </a>
        ))}
      </div>

      {cta && <div className="claude-nav__cta">{cta}</div>}

      <button
        type="button"
        className="claude-nav__hamburger"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span /><span /><span />
      </button>

      <div className={['claude-nav__mobile', mobileOpen && 'claude-nav__mobile--open'].filter(Boolean).join(' ')}>
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            className={['claude-nav__link', link.active && 'claude-nav__link--active'].filter(Boolean).join(' ')}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        {cta && <div style={{ marginTop: 'var(--claude-space-4)' }}>{cta}</div>}
      </div>
    </nav>
  );
}
