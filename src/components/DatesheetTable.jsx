import { Fragment, forwardRef, useRef, useState } from 'react';

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
  onInsertRowAfter,
  onReorderColumn,
  onInsertColumnAfter,
  onRenameColumn,
}, ref) {
  const dragColumnIdxRef = useRef(-1);
  const dragRowIdxRef = useRef(-1);
  const [columnDropTarget, setColumnDropTarget] = useState(-1);
  const [rowDropTarget, setRowDropTarget] = useState(-1);
  const [selectedColumn, setSelectedColumn] = useState(-1);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [editingColumnId, setEditingColumnId] = useState('');
  const safeColumns = columns || [];
  const safeTheme = theme || FALLBACK_THEME;

  const beginColumnDrag = (index) => {
    dragColumnIdxRef.current = index;
  };

  const dropColumn = (toIndex) => {
    const fromIndex = dragColumnIdxRef.current;
    dragColumnIdxRef.current = -1;
    setColumnDropTarget(-1);
    if (fromIndex < 0 || fromIndex === toIndex) return;
    onReorderColumn(fromIndex, toIndex);
  };

  const beginRowDrag = (index) => {
    dragRowIdxRef.current = index;
  };

  const dropRow = (toIndex) => {
    const fromIndex = dragRowIdxRef.current;
    dragRowIdxRef.current = -1;
    setRowDropTarget(-1);
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

        <div style={{ border: `2.5px solid ${safeTheme.border}`, display: 'inline-block', borderRadius: '2px', overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <caption className="sr-only">Editable datesheet table with drag and drop row and column ordering.</caption>
            <thead>
              <tr>
                {safeColumns.map((col, colIndex) => (
                  <th
                    key={col.id}
                    draggable
                    onDragStart={() => beginColumnDrag(colIndex)}
                    onDragEnd={() => {
                      dragColumnIdxRef.current = -1;
                      setColumnDropTarget(-1);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setColumnDropTarget(colIndex);
                    }}
                    onDragLeave={() => setColumnDropTarget(-1)}
                    onDrop={() => dropColumn(colIndex)}
                    onClick={() => setSelectedColumn(colIndex)}
                    className={`relative select-none table-header-drag ${columnDropTarget === colIndex ? 'table-drop-target-col' : ''}`}
                    style={{
                      ...HEAD_CELL,
                      backgroundColor: safeTheme.headerBg,
                      color: safeTheme.headerText,
                      border: `1px solid ${safeTheme.border}`,
                    }}
                  >
                    <div className="min-w-[130px]">
                      {editingColumnId === col.id ? (
                        <input
                          value={col.label}
                          onChange={(e) => onRenameColumn(col.id, e.target.value)}
                          onBlur={() => setEditingColumnId('')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingColumnId('');
                            }
                          }}
                          autoFocus
                          className="no-export w-full bg-white/95 text-slate-900 rounded px-2 py-1 text-[11px] font-mono font-bold"
                          aria-label={`Rename ${col.label} column`}
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedColumn(colIndex);
                            setEditingColumnId(col.id);
                          }}
                          className="block px-2 py-1 rounded cursor-text"
                          title="Tap to edit column name"
                        >
                          {col.label || 'Untitled'}
                        </span>
                      )}
                    </div>
                    {selectedColumn === colIndex && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInsertColumnAfter(colIndex);
                        }}
                        className="no-export table-insert-chip absolute -right-3 -bottom-3 h-6 w-6"
                        aria-label={`Add column after ${col.label}`}
                        title="Add column"
                      >
                        +
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <Fragment key={i}>
                  <tr
                    draggable
                    onDragStart={(e) => {
                      const tag = e.target?.tagName?.toLowerCase();
                      if (tag === 'input' || tag === 'button') {
                        e.preventDefault();
                        return;
                      }
                      beginRowDrag(i);
                    }}
                    onDragEnd={() => {
                      dragRowIdxRef.current = -1;
                      setRowDropTarget(-1);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setRowDropTarget(i);
                    }}
                    onDragLeave={() => setRowDropTarget(-1)}
                    onDrop={() => dropRow(i)}
                    onClick={() => setSelectedRow(i)}
                    className={`table-row-drag ${rowDropTarget === i ? 'table-drop-target-row' : ''}`}
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
                  </tr>
                  {selectedRow === i && (
                    <tr className="no-export">
                      <td colSpan={safeColumns.length} style={{ padding: '4px 0', border: 'none' }}>
                        <div className="flex justify-center">
                          <button
                            onClick={() => onInsertRowAfter(i)}
                            className="table-insert-chip h-6 w-6"
                            aria-label={`Add row after ${i + 1}`}
                            title="Add row"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default DatesheetTable;
