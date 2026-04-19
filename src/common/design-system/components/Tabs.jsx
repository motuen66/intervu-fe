import { useState } from 'react';
import './Tabs.css';

export function Tabs({ tabs, defaultTab, onChange, className = '' }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.value ?? 0);

  const handleSelect = (val) => {
    setActive(val);
    onChange?.(val);
  };

  return (
    <div className={['claude-tabs', className].filter(Boolean).join(' ')}>
      <div className="claude-tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active === tab.value}
            aria-controls={`claude-panel-${tab.value}`}
            id={`claude-tab-${tab.value}`}
            className={['claude-tabs__tab', active === tab.value && 'claude-tabs__tab--active'].filter(Boolean).join(' ')}
            onClick={() => handleSelect(tab.value)}
          >
            {tab.icon && tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.value}
          id={`claude-panel-${tab.value}`}
          role="tabpanel"
          aria-labelledby={`claude-tab-${tab.value}`}
          className="claude-tabs__panel"
          hidden={active !== tab.value}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
