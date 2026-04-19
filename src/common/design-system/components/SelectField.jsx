import './Field.css';
import './SelectField.css';

export function SelectField({ id, label, hint, error, required, disabled, children, className = '', ...props }) {
  const fieldId = id || `claude-select-${Math.random().toString(36).slice(2, 8)}`;
  const wrapClasses = [
    'claude-select',
    error && 'claude-select--invalid',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClasses}>
      {label && (
        <label className={`claude-field__label${required ? ' claude-field__label--required' : ''}`} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className="claude-select__trigger"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <span id={`${fieldId}-hint`} className="claude-field__hint">{hint}</span>}
      {error && <span id={`${fieldId}-error`} className="claude-field__error" role="alert">{error}</span>}
    </div>
  );
}
