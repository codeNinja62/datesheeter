import { forwardRef } from 'react';

// ─── Theme (matches datesheet: dark navy + amber) ─────────────────────────────

const NAVY   = '#0f172a';
const AMBER  = '#fbbf24';
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
  lineHeight: 1.35,
};

const HEADER_CELL = {
  ...BASE,
  border: `1px solid ${NAVY}`,
  backgroundColor: NAVY,
  color: '#ffffff',
  fontWeight: '800',
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '13px 14px',
  whiteSpace: 'nowrap',
};

const TIME_CELL = {
  ...BASE,
  border: `1px solid ${BORDER}`,
  borderRight: `2px solid ${NAVY}`,
  backgroundColor: '#f8fafc',
  color: '#000000',
  fontWeight: '700',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  padding: '8px 10px',
  minWidth: '96px',
};

const LUNCH_CELL = {
  border: `1px solid ${AMBER}`,
  backgroundColor: '#fefce8',
  color: '#92400e',
  fontWeight: '800',
  fontSize: '0.8rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '10px 14px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = forwardRef(function TimetableGrid({ timetable }, ref) {
  if (!timetable) return null;

  const { title, days, slots, lunchAfterSlot } = timetable;
  const colCount = days.length + 1; // time col + day cols

  // Build flat list of <tr> descriptors so we can use rowspan cleanly
  const tableRows = [];
  for (const slot of slots) {
    const rowCount = slot.rows.length;
    slot.rows.forEach((rowDict, ri) => {
      tableRows.push({
        isFirst:      ri === 0,
        time:         slot.time,
        rowspan:      rowCount,
        rowDict,
        isLunchAfter: ri === rowCount - 1 && lunchAfterSlot === slot.time,
        rowIndex:     tableRows.length,
      });
    });
  }

  return (
    <div
      ref={ref}
      className="inline-block"
      style={{ fontFamily: FONT, backgroundColor: '#ffffff', padding: '28px 32px 36px' }}
    >
      {/* Title */}
      <p style={{
        textAlign: 'center', fontWeight: '900', fontSize: '1.1rem',
        margin: '0 0 18px 0', color: '#000000', letterSpacing: '-0.01em', lineHeight: 1.4,
      }}>
        {title}
      </p>

      {/* Grid */}
      <div style={{ border: `2.5px solid ${NAVY}`, borderRadius: '2px', overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '100px' }} />
            {days.map((d) => <col key={d} />)}
          </colgroup>

          <thead>
            <tr>
              <th style={HEADER_CELL}>Time</th>
              {days.map((day) => <th key={day} style={HEADER_CELL}>{day}</th>)}
            </tr>
          </thead>

          <tbody>
            {tableRows.map((tr, idx) => (
              <>
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
                        {text || '—'}
                      </td>
                    );
                  })}
                </tr>

                {tr.isLunchAfter && (
                  <tr key={`lunch-${idx}`}>
                    <td colSpan={colCount} style={LUNCH_CELL}>
                      Lunch Break
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TimetableGrid;
