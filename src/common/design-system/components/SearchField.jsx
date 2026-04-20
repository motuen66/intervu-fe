import './Field.css';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function SearchField({ id, label, hint, error, onClear, value, tone = 'secondary', className = '', ...props }) {
  const fieldId = id || `claude-search-${Math.random().toString(36).slice(2, 8)}`;
  const hasValue = value != null && String(value).length > 0;
  const wrapClasses = [
    'claude-field',
    'claude-field--with-icon',
    tone === 'secondary' && 'claude-field--tone-secondary',
    hasValue && 'claude-field--has-value',
    error && 'claude-field--invalid',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClasses}>
      {label && <label className="claude-field__label" htmlFor={fieldId}>{label}</label>}
      <div className="claude-field__control">
        <span className="claude-field__icon"><SearchIcon /></span>
        <input
          id={fieldId}
          type="search"
          className={`claude-field__input${tone === 'secondary' ? ' claude-field__input--secondary' : ''}`}
          value={value}
          aria-invalid={!!error}
          {...props}
        />
        {onClear && value && (
          <button
            type="button"
            className="claude-icon-btn claude-icon-btn--ghost claude-field__clear"
            onClick={onClear}
            aria-label="Clear search"
          >
            <ClearIcon />
          </button>
        )}
      </div>
      {hint && !error && <span id={`${fieldId}-hint`} className="claude-field__hint">{hint}</span>}
      {error && <span id={`${fieldId}-error`} className="claude-field__error" role="alert">{error}</span>}
    </div>
  );
}
