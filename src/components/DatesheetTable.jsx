import { forwardRef } from 'react';

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

const DatesheetTable = forwardRef(function DatesheetTable({ rows, title }, ref) {
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
        <div style={{ border: '2.5px solid #0f172a', display: 'inline-block', borderRadius: '2px', overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {['Time', 'Date', 'Day', 'Subject'].map((h) => (
                  <th key={h} style={HEAD_CELL}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                >
                  <td style={{ ...BASE_CELL, fontWeight: '600', color: '#000000' }}>{r.slot}</td>
                  <td style={{ ...BASE_CELL, fontWeight: '700', color: '#000000' }}>{r.date}</td>
                  <td style={{ ...BASE_CELL, fontWeight: '600', color: '#000000' }}>{r.day}</td>
                  <td style={{
                    ...BASE_CELL,
                    ...SUBJECT_SCREEN,
                    fontWeight: '800',
                    color: '#000000',
                    backgroundColor: '#fbbf24',
                    border: '1px solid #f59e0b',
                  }}>
                    {r.courseName}
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
