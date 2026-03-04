import { forwardRef } from 'react';

// ─── Theme ────────────────────────────────────────────────────────────────────

const ACCENT      = '#1a237e'; // deep indigo — header + borders
const ACCENT_SOFT = '#e8eaf6'; // very light indigo — time column bg
const ACCENT_MID  = '#3949ab'; // mid indigo — header text accent
const BORDER      = '#c5cae9'; // indigo-grey — internal borders
const ROW_ODD     = '#f9fafb';
const ROW_EVEN    = '#ffffff';

const PALETTE = [
  '#e3f2fd','#fce4ec','#f3e5f5','#e8f5e9',
  '#fff8e1','#e0f7fa','#fbe9e7','#f1f8e9',
  '#e8eaf6','#e0f2f1','#fff3e0','#ede7f6',
];

const SPECIAL_KEYWORDS = ['library', 'seminar', 'workshop', 'meeting'];
const SPECIAL_BG  = '#e8f5e9';
const EMPTY_BG    = ROW_EVEN;

function stableColor(text) {
  if (!text) return EMPTY_BG;
  const base = text.split('(')[0].trim().toLowerCase();
  if (SPECIAL_KEYWORDS.some((k) => base.includes(k))) return SPECIAL_BG;
  let hash = 5381;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) + hash) ^ base.charCodeAt(i);
    hash = hash >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// ─── Style constants ──────────────────────────────────────────────────────────

const FONT = '"Inter", "Segoe UI", Arial, sans-serif';

const BASE = {
  border: `1px solid ${BORDER}`,
  verticalAlign: 'middle',
  textAlign: 'center',
  fontSize: '0.75rem',
  color: '#1a1a2e',
  padding: '5px 9px',
  lineHeight: 1.35,
};

const HEADER_CELL = {
  ...BASE,
  border: `1px solid ${ACCENT}`,
  background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_MID} 100%)`,
  color: '#ffffff',
  fontWeight: '700',
  fontSize: '0.73rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '11px 14px',
  whiteSpace: 'nowrap',
};

const HEADER_FIRST = {
  ...HEADER_CELL,
  background: `linear-gradient(135deg, #0d1257 0%, ${ACCENT} 100%)`,
  color: '#c5cae9',
  fontSize: '0.68rem',
  letterSpacing: '0.08em',
};

const TIME_CELL = {
  ...BASE,
  border: `1px solid ${BORDER}`,
  borderRight: `2px solid ${ACCENT}`,
  backgroundColor: ACCENT_SOFT,
  color: ACCENT,
  fontWeight: '700',
  fontSize: '0.7rem',
  whiteSpace: 'nowrap',
  padding: '5px 10px',
  minWidth: '96px',
};

const LUNCH_CELL = {
  border: `1px solid #f59e0b`,
  backgroundColor: '#fffbeb',
  color: '#92400e',
  fontWeight: '800',
  fontSize: '0.76rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '9px 0',
  textAlign: 'center',
  width: '100%',
  display: 'block',
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
      {/* Title bar */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_MID} 100%)`,
        borderRadius: '6px 6px 0 0',
        padding: '14px 20px 12px',
        marginBottom: 0,
      }}>
        <p style={{
          textAlign: 'center', fontWeight: '800', fontSize: '0.95rem',
          margin: 0, color: '#ffffff', letterSpacing: '0.01em', lineHeight: 1.4,
        }}>
          {title}
        </p>
      </div>

      {/* Grid */}
      <div style={{
        border: `2px solid ${ACCENT}`,
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        overflow: 'hidden',
      }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '100px' }} />
            {days.map((d) => <col key={d} />)}
          </colgroup>

          <thead>
            <tr>
              <th style={HEADER_FIRST}>TIME</th>
              {days.map((day) => <th key={day} style={HEADER_CELL}>{day}</th>)}
            </tr>
          </thead>

          <tbody>
            {tableRows.map((tr, idx) => (
              <>
                <tr
                  key={`row-${idx}`}
                  style={{ backgroundColor: tr.rowIndex % 2 === 0 ? ROW_ODD : ROW_EVEN }}
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
                          backgroundColor: text ? stableColor(text) : 'transparent',
                          fontWeight: text ? '600' : '400',
                          color: text ? '#1a1a2e' : '#d1d5db',
                        }}
                      >
                        {text || '—'}
                      </td>
                    );
                  })}
                </tr>

                {tr.isLunchAfter && (
                  <tr key={`lunch-${idx}`}>
                    <td
                      colSpan={colCount}
                      style={{
                        border: `1px solid #f59e0b`,
                        borderLeft: `3px solid #f59e0b`,
                        borderRight: `3px solid #f59e0b`,
                        padding: 0,
                      }}
                    >
                      <div style={LUNCH_CELL}>🍽 &nbsp; Lunch Break &nbsp; 🍽</div>
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
