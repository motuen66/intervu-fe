import './Toggle.css';

export function Checkbox({ id, label, disabled, children, className = '', ...props }) {
  const inputId = id || `claude-cb-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label className={['claude-checkbox', className].filter(Boolean).join(' ')}>
      <input id={inputId} type="checkbox" className="claude-checkbox__input" disabled={disabled} {...props} />
      {(label || children) && <span className="claude-checkbox__label">{label || children}</span>}
    </label>
  );
}

export function Radio({ id, label, disabled, children, className = '', ...props }) {
  const inputId = id || `claude-radio-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label className={['claude-radio', className].filter(Boolean).join(' ')}>
      <input id={inputId} type="radio" className="claude-radio__input" disabled={disabled} {...props} />
      {(label || children) && <span className="claude-radio__label">{label || children}</span>}
    </label>
  );
}

export function Switch({ id, label, checked, onChange, disabled, children, className = '', ...props }) {
  const inputId = id || `claude-sw-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label className={['claude-switch', className].filter(Boolean).join(' ')}>
      <span className="claude-switch__track">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="claude-switch__input"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        <span className="claude-switch__thumb" />
      </span>
      {(label || children) && <span className="claude-switch__label">{label || children}</span>}
    </label>
  );
}
