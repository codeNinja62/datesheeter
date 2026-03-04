import { forwardRef } from 'react';

// ─── Color palette ────────────────────────────────────────────────────────────

const PALETTE = [
  '#bbdefb','#c8e6c9','#fff9c4','#ffccbc','#e1bee7',
  '#b2dfdb','#f8bbd0','#dcedc8','#b3e5fc','#ffe0b2',
  '#d1c4e9','#c5cae9','#cfd8dc','#f0f4c3',
];

const SPECIAL_KEYWORDS = ['library', 'seminar', 'workshop', 'meeting'];
const SPECIAL_COLOR    = '#c8e6c9';
const EMPTY_COLOR      = '#f8fafc';

function stableColor(text) {
  if (!text) return EMPTY_COLOR;
  const base = text.split('(')[0].trim().toLowerCase();
  if (SPECIAL_KEYWORDS.some((k) => base.includes(k))) return SPECIAL_COLOR;
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
  border: '1px solid #9ca3af',
  verticalAlign: 'middle',
  textAlign: 'center',
  fontSize: '0.76rem',
  color: '#111827',
  padding: '4px 8px',
  lineHeight: 1.3,
};

const HEADER_CELL = {
  ...BASE,
  backgroundColor: '#1e293b',
  color: '#ffffff',
  fontWeight: '800',
  fontSize: '0.76rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '10px 14px',
  whiteSpace: 'nowrap',
};

const TIME_CELL = {
  ...BASE,
  backgroundColor: '#f1f5f9',
  fontWeight: '700',
  fontSize: '0.73rem',
  whiteSpace: 'nowrap',
  padding: '6px 10px',
  minWidth: '90px',
};

const LUNCH_CELL = {
  ...BASE,
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontWeight: '700',
  fontSize: '0.76rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '7px 14px',
  textAlign: 'center',
};

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = forwardRef(function TimetableGrid({ timetable }, ref) {
  if (!timetable) return null;

  const { title, days, slots, lunchAfterSlot, legend } = timetable;
  const colCount = days.length + 1;

  // Build flat list of <tr> descriptors so we can use rowspan cleanly
  const tableRows = [];

  for (const slot of slots) {
    const rowCount = slot.rows.length;

    slot.rows.forEach((rowDict, ri) => {
      tableRows.push({
        isFirst:  ri === 0,
        time:     slot.time,
        rowspan:  rowCount,
        rowDict,
        isLunchAfter: ri === rowCount - 1 && lunchAfterSlot === slot.time,
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
        textAlign: 'center', fontWeight: '900', fontSize: '1rem',
        margin: '0 0 16px 0', color: '#1e293b', letterSpacing: '-0.01em', lineHeight: 1.35,
      }}>
        {title}
      </p>

      {/* Grid */}
      <div style={{
        border: '2.5px solid #1e293b', display: 'inline-block',
        borderRadius: '3px', overflow: 'hidden', width: '100%',
      }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '96px' }} />
            {days.map((d) => <col key={d} />)}
          </colgroup>

          <thead>
            <tr>
              <th style={HEADER_CELL}>TIME / DAYS</th>
              {days.map((day) => <th key={day} style={HEADER_CELL}>{day}</th>)}
            </tr>
          </thead>

          <tbody>
            {tableRows.map((tr, idx) => (
              <>
                <tr key={`row-${idx}`}>
                  {/* Time cell only on the first row of each slot (rowspan) */}
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
                          fontWeight: text ? '600' : '400',
                          color: text ? '#111827' : '#d1d5db',
                        }}
                      >
                        {text || '—'}
                      </td>
                    );
                  })}
                </tr>

                {/* Lunch + Prayer Break after the last row of the matching slot */}
                {tr.isLunchAfter && (
                  <tr key={`lunch-${idx}`}>
                    <td colSpan={colCount} style={LUNCH_CELL}>
                      Lunch + Prayer Break
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {legend && legend.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <LegendTable legend={legend} />
        </div>
      )}
    </div>
  );
});

// ─── Legend ───────────────────────────────────────────────────────────────────

function LegendTable({ legend }) {
  if (!legend.length) return null;
  const headers = Object.keys(legend[0]);

  const LGND_HEAD = {
    ...BASE,
    backgroundColor: '#fef3c7', color: '#78350f',
    fontWeight: '800', fontSize: '0.71rem',
    letterSpacing: '0.04em', textTransform: 'uppercase',
    padding: '7px 10px', whiteSpace: 'nowrap',
  };
  const LGND_CELL = { ...BASE, fontSize: '0.71rem', padding: '5px 10px', textAlign: 'left' };

  return (
    <div style={{
      border: '2px solid #1e293b', borderRadius: '3px',
      overflow: 'hidden', display: 'inline-block', width: '100%',
    }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={LGND_HEAD}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {legend.map((row, ri) => (
            <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              {headers.map((h) => <td key={h} style={LGND_CELL}>{row[h] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimetableGrid;
