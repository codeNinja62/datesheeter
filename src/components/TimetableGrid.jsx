import { forwardRef } from 'react';

// ─── Theme (matches datesheet: dark navy #0f172a + amber #fbbf24) ─────────────

const NAVY   = '#0f172a';
const BORDER = '#d1d5db';

const PALETTE = [
  '#fef9c3','#dbeafe','#fce7f3','#dcfce7',
  '#ffedd5','#e0f2fe','#f3e8ff','#d1fae5',
  '#fef3c7','#ede9fe','#fee2e2','#ecfdf5',
];

const SPECIAL_KEYWORDS = ['library', 'seminar', 'workshop', 'meeting'];

function stableColor(text) {
  if (!text) return '#ffffff';
  const base = text.split('(')[0].trim().toLowerCase();
  if (SPECIAL_KEYWORDS.some((k) => base.includes(k))) return '#d1fae5';
  let hash = 5381;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) + hash) ^ base.charCodeAt(i);
    hash = hash >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// ─── Style constants ──────────────────────────────────────────────────────────

const FONT = '"Inter", Arial, Helvetica, sans-serif';

const BASE = {
  border: `1px solid ${BORDER}`,
  verticalAlign: 'middle',
  textAlign: 'center',
  fontSize: '0.82rem',
  color: '#000000',
  padding: '8px 12px',
  lineHeight: 1.4,
  whiteSpace: 'pre-line',    // preserve \n as line breaks
  wordBreak: 'break-word',
};

const HEADER_CELL = {
  ...BASE,
  whiteSpace: 'nowrap',
  border: `1px solid ${NAVY}`,
  backgroundColor: NAVY,
  color: '#ffffff',
  fontWeight: '800',
  fontSize: '0.88rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '13px 28px',
};

const TIME_CELL = {
  ...BASE,
  whiteSpace: 'nowrap',
  border: `1px solid ${BORDER}`,
  backgroundColor: '#f8fafc',
  color: '#000000',
  fontWeight: '600',
  fontSize: '0.82rem',
  padding: '11px 14px',
};

const LUNCH_CELL = {
  ...BASE,
  whiteSpace: 'nowrap',
  border: `1px solid #fbbf24`,
  backgroundColor: '#fbbf24',
  color: '#000000',
  fontWeight: '800',
  fontSize: '0.92rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '13px 28px',
  textAlign: 'center',
};

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = forwardRef(function TimetableGrid({ timetable }, ref) {
  if (!timetable) return null;

  const { title, days, slots } = timetable;
  const colCount = days.length + 1;

  // Flatten slots into per-physical-row descriptors.
  // Banners ({ type:'banner', text }) become their own row type.
  const tableRows = [];
  for (const slot of slots) {
    if (slot.type === 'banner') {
      tableRows.push({ type: 'banner', text: slot.text });
      continue;
    }
    const rowCount = slot.rows.length;
    slot.rows.forEach((rowDict, ri) => {
      tableRows.push({
        type:    'slot',
        isFirst: ri === 0,
        time:    slot.time,
        rowspan: rowCount,
        rowDict,
        rowIndex: tableRows.length,
      });
    });
  }

  return (
    <div
      ref={ref}
      className="inline-block"
      style={{ fontFamily: FONT, backgroundColor: '#ffffff', padding: '28px 32px 32px' }}
    >
      {/* Title */}
      <p style={{
        textAlign: 'center', fontWeight: '900', fontSize: '1.3rem',
        margin: '0 0 20px 0', color: '#000000', letterSpacing: '-0.01em',
      }}>
        {title}
      </p>

      {/* Grid */}
      <div style={{
        border: `2.5px solid ${NAVY}`, display: 'inline-block',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Time</th>
              {days.map((day) => <th key={day} style={HEADER_CELL}>{day}</th>)}
            </tr>
          </thead>

          <tbody>
            {tableRows.map((tr, idx) => {
              if (tr.type === 'banner') {
                return (
                  <tr key={`banner-${idx}`}>
                    <td colSpan={colCount} style={LUNCH_CELL}>{tr.text}</td>
                  </tr>
                );
              }
              return (
                <tr
                  key={`row-${idx}`}
                  style={{ backgroundColor: tr.rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                >
                  {tr.isFirst && (
                    <td rowSpan={tr.rowspan} style={TIME_CELL}>{tr.time}</td>
                  )}

                  {days.map((day) => {
                    const text = tr.rowDict[day] ?? '';
                    return (
                      <td
                        key={day}
                        style={{
                          ...BASE,
                          backgroundColor: text ? stableColor(text) : '#ffffff',
                          fontWeight: text ? '700' : '400',
                          color: text ? '#000000' : '#d1d5db',
                        }}
                      >
                        {text || '\u2014'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TimetableGrid;
