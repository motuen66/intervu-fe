/* DO NOT import this file from main.jsx or app layouts.
   Import only on opt-in pages/routes to keep legacy styles intact. */
import './index.css';

export function ClaudeThemeProvider({ dark = false, children, className = '', style }) {
  return (
    <div
      className={['claude-theme', dark && 'claude-theme--dark', className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </div>
  );
}
