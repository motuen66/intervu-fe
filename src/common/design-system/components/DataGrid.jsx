import './DataGrid.css';

export function DataGrid({ columns, rows, striped, dense, className = '', getRowStyle, ...props }) {
  const tableClasses = [
    'claude-grid',
    striped && 'claude-grid--striped',
    dense && 'claude-grid--dense',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="claude-grid-wrap">
      <table className={tableClasses} {...props}>
        <thead className="claude-grid__head">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="claude-grid__cell" style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="claude-grid__row" style={getRowStyle ? getRowStyle(row, i) : undefined}>
              {columns.map((col) => (
                <td key={col.key} className="claude-grid__cell">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
