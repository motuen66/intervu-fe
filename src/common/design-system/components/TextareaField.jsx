import './Field.css';

export function TextareaField({ id, label, hint, error, required, disabled, rows = 4, className = '', ...props }) {
  const fieldId = id || `claude-field-${Math.random().toString(36).slice(2, 8)}`;
  const classes = [
    'claude-field',
    error && 'claude-field--invalid',
    disabled && 'claude-field--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className={`claude-field__label${required ? ' claude-field__label--required' : ''}`} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className="claude-field__textarea"
        disabled={disabled}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      />
      {hint && !error && <span id={`${fieldId}-hint`} className="claude-field__hint">{hint}</span>}
      {error && <span id={`${fieldId}-error`} className="claude-field__error" role="alert">{error}</span>}
    </div>
  );
}
