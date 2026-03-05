import { forwardRef, useRef } from 'react';

const BASE_CELL = {
  border: '1px solid #d1d5db',
  padding: '11px 28px',
  textAlign: 'center',
  verticalAlign: 'middle',
  // No whiteSpace here — on-screen cells wrap naturally.
  // The [data-exporting] CSS rule in index.css restores nowrap during export.
  fontSize: '0.92rem',
  color: '#000000',
};

// Enforces wrapping + min-width on the Subject column only, for screen display.
const SUBJECT_SCREEN = {
  minWidth: '160px',
  wordBreak: 'break-word',
};

const HEAD_CELL = {
  ...BASE_CELL,
  fontSize: '0.88rem',
  fontWeight: '800',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#ffffff',
  backgroundColor: '#0f172a',
  border: '1px solid #0f172a',
  padding: '13px 28px',
};

const BUTTON_CLASS = 'no-export px-2 py-1 text-[10px] font-mono font-bold rounded border border-black/20 hover:bg-black/5 transition-colors';
const FALLBACK_THEME = {
  headerBg: '#0f172a',
  headerText: '#ffffff',
  bodyText: '#000000',
  rowOdd: '#ffffff',
  rowEven: '#f8fafc',
  accentBg: '#fbbf24',
  accentText: '#000000',
  border: '#0f172a',
};

const DatesheetTable = forwardRef(function DatesheetTable({
  rows,
  columns,
  title,
  theme,
  onCellChange,
  onReorderRow,
  onRemoveRow,
  onReorderColumn,
  onRemoveColumn,
  onRenameColumn,
}, ref) {
  const dragColumnIdxRef = useRef(-1);
  const dragRowIdxRef = useRef(-1);
  const safeColumns = columns || [];
  const safeTheme = theme || FALLBACK_THEME;

  const beginColumnDrag = (index) => {
    dragColumnIdxRef.current = index;
  };

  const dropColumn = (toIndex) => {
    const fromIndex = dragColumnIdxRef.current;
    dragColumnIdxRef.current = -1;
    if (fromIndex < 0 || fromIndex === toIndex) return;
    onReorderColumn(fromIndex, toIndex);
  };

  const beginRowDrag = (index) => {
    dragRowIdxRef.current = index;
  };

  const dropRow = (toIndex) => {
    const fromIndex = dragRowIdxRef.current;
    dragRowIdxRef.current = -1;
    if (fromIndex < 0 || fromIndex === toIndex) return;
    onReorderRow(fromIndex, toIndex);
  };

  if (!rows || rows.length === 0) {
    return (
      <p className="text-center text-white/30 font-mono text-sm py-10">
        Select a batch or courses above.
      </p>
    );
  }

  return (
    <div className="table-scroll overflow-x-auto flex justify-center">
      <div
        ref={ref}
        className="inline-block"
        style={{
          fontFamily: '"Inter", Arial, Helvetica, sans-serif',
          backgroundColor: '#ffffff',
          padding: '28px 32px 32px',
        }}
      >
        {/* Title */}
        <p
          style={{
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '1.3rem',
            margin: '0 0 20px 0',
            color: '#000000',
            letterSpacing: '-0.01em',
          }}
        >
          {title || 'Datesheet'}
        </p>

        {/* Table with outer border */}
        <div style={{ border: `2.5px solid ${safeTheme.border}`, display: 'inline-block', borderRadius: '2px', overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {safeColumns.map((col, colIndex) => (
                  <th
                    key={col.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropColumn(colIndex)}
                    style={{
                      ...HEAD_CELL,
                      backgroundColor: safeTheme.headerBg,
                      color: safeTheme.headerText,
                      border: `1px solid ${safeTheme.border}`,
                    }}
                  >
                    <div className="flex flex-col gap-2 min-w-[130px]">
                      <input
                        value={col.label}
                        onChange={(e) => onRenameColumn(col.id, e.target.value)}
                        className="no-export w-full bg-white/95 text-slate-900 rounded px-2 py-1 text-[11px] font-mono font-bold"
                        aria-label={`Rename ${col.label} column`}
                      />
                      <div className="no-export flex items-center justify-center gap-1.5">
                        <button
                          className={BUTTON_CLASS}
                          draggable
                          onDragStart={() => beginColumnDrag(colIndex)}
                          onDragEnd={() => {
                            dragColumnIdxRef.current = -1;
                          }}
                        >
                          drag
                        </button>
                        <button
                          className={BUTTON_CLASS}
                          onClick={() => onRemoveColumn(col.id)}
                          disabled={safeColumns.length <= 1}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th
                  className="no-export"
                  style={{
                    ...HEAD_CELL,
                    backgroundColor: safeTheme.headerBg,
                    color: safeTheme.headerText,
                    border: `1px solid ${safeTheme.border}`,
                    minWidth: '160px',
                  }}
                >
                  row actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropRow(i)}
                  style={{ backgroundColor: i % 2 === 0 ? safeTheme.rowOdd : safeTheme.rowEven }}
                >
                  {safeColumns.map((col) => {
                    const isAccent = col.id === 'courseName';
                    return (
                      <td
                        key={`${i}-${col.id}`}
                        style={{
                          ...BASE_CELL,
                          ...(isAccent ? SUBJECT_SCREEN : null),
                          color: isAccent ? safeTheme.accentText : safeTheme.bodyText,
                          backgroundColor: isAccent ? safeTheme.accentBg : 'transparent',
                          border: `1px solid ${isAccent ? safeTheme.accentBg : safeTheme.border}`,
                        }}
                      >
                        <input
                          value={r[col.id] ?? ''}
                          onChange={(e) => onCellChange(i, col.id, e.target.value)}
                          className="editable-cell-input w-full bg-transparent border-none outline-none text-center text-[0.92rem] font-semibold"
                          style={{ color: isAccent ? safeTheme.accentText : safeTheme.bodyText }}
                          aria-label={`${col.label} row ${i + 1}`}
                        />
                      </td>
                    );
                  })}
                  <td className="no-export" style={{ ...BASE_CELL, border: `1px solid ${safeTheme.border}` }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        className={BUTTON_CLASS}
                        draggable
                        onDragStart={() => beginRowDrag(i)}
                        onDragEnd={() => {
                          dragRowIdxRef.current = -1;
                        }}
                      >
                        drag
                      </button>
                      <button
                        className={BUTTON_CLASS}
                        onClick={() => onRemoveRow(i)}
                      >
                        remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default DatesheetTable;
