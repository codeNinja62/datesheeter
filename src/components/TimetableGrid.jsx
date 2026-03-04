import { forwardRef } from 'react';

// ─── Color palette (pastel, print-safe) ──────────────────────────────────────

const PALETTE = [
  '#bbdefb', // blue-100
  '#c8e6c9', // green-100
  '#fff9c4', // yellow-100
  '#ffccbc', // deep-orange-100
  '#e1bee7', // purple-100
  '#b2dfdb', // teal-100
  '#f8bbd0', // pink-100
  '#dcedc8', // light-green-100
  '#b3e5fc', // light-blue-100
  '#ffe0b2', // orange-100
  '#d1c4e9', // deep-purple-100
  '#c5cae9', // indigo-100
  '#cfd8dc', // blue-grey-100
  '#f0f4c3', // lime-100
];

// Reserved soft green for library / seminar / workshop special sessions
const SPECIAL_COLOR = '#c8e6c9';
const SPECIAL_KEYWORDS = ['library', 'seminar', 'workshop', 'lunch', 'break', 'meeting'];

function stableColor(text) {
  // Use the substring before the first '(' as the "base name" so that
  // "(Gp-01)" and "(Gp-02)" variants of the same course share a color.
  const base = text.split('(')[0].trim().toLowerCase();

  if (SPECIAL_KEYWORDS.some((k) => base.includes(k))) return SPECIAL_COLOR;

  // djb2-style hash over the base name
  let hash = 5381;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) + hash) ^ base.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return PALETTE[hash % PALETTE.length];
}

// ─── Inline style constants ───────────────────────────────────────────────────

const FONT = '"Inter", Arial, Helvetica, sans-serif';

const BASE = {
  border: '1px solid #9ca3af',
  verticalAlign: 'middle',
  textAlign: 'center',
  fontSize: '0.78rem',
  color: '#111827',
  padding: '6px 10px',
};

const HEADER_CELL = {
  ...BASE,
  backgroundColor: '#1e293b',
  color: '#ffffff',
  fontWeight: '800',
  fontSize: '0.78rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '10px 14px',
  whiteSpace: 'nowrap',
};

const TIME_CELL = {
  ...BASE,
  backgroundColor: '#f1f5f9',
  fontWeight: '700',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  padding: '8px 12px',
  minWidth: '90px',
};

const LUNCH_CELL = {
  ...BASE,
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontWeight: '700',
  fontSize: '0.78rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '7px 14px',
  textAlign: 'center',
};

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = forwardRef(function TimetableGrid({ timetable }, ref) {
  if (!timetable) return null;

  const { title, days, timeSlots, cells, lunchAfter, legend } = timetable;
  const colCount = days.length + 1; // time col + day cols

  return (
    <div
      ref={ref}
      className="inline-block"
      style={{
        fontFamily: FONT,
        backgroundColor: '#ffffff',
        padding: '28px 32px 32px',
      }}
    >
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <p
        style={{
          textAlign: 'center',
          fontWeight: '900',
          fontSize: '1.05rem',
          margin: '0 0 4px 0',
          color: '#1e293b',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}
      >
        {title}
      </p>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div
        style={{
          border: '2.5px solid #1e293b',
          display: 'inline-block',
          borderRadius: '3px',
          overflow: 'hidden',
          marginTop: '16px',
          width: '100%',
        }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          {/* Col groups for equal-width day columns */}
          <colgroup>
            <col style={{ width: '100px' }} />
            {days.map((d) => (
              <col key={d} />
            ))}
          </colgroup>

          {/* Header row */}
          <thead>
            <tr>
              <th style={HEADER_CELL}>TIME / DAYS</th>
              {days.map((day) => (
                <th key={day} style={HEADER_CELL}>{day}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((slot) => {
              const isAfterLunch = lunchAfter === slot;
              return (
                <>
                  {/* Timetable data row */}
                  <tr key={slot}>
                    <td style={TIME_CELL}>{slot}</td>
                    {days.map((day) => {
                      const entries = cells[slot]?.[day] ?? [];
                      return (
                        <td
                          key={day}
                          style={{
                            ...BASE,
                            padding: 0,
                            verticalAlign: entries.length > 1 ? 'top' : 'middle',
                          }}
                        >
                          {entries.length === 0 ? (
                            <span style={{ display: 'block', padding: '8px 6px', color: '#d1d5db' }}>—</span>
                          ) : (
                            entries.map((entry, ei) => (
                              <div
                                key={ei}
                                style={{
                                  backgroundColor: stableColor(entry),
                                  padding: '5px 6px',
                                  borderBottom:
                                    ei < entries.length - 1 ? '1px solid rgba(0,0,0,0.08)' : undefined,
                                  fontSize: '0.74rem',
                                  fontWeight: '600',
                                  lineHeight: 1.35,
                                  textAlign: 'center',
                                }}
                              >
                                {entry}
                              </div>
                            ))
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Lunch + Prayer Break separator */}
                  {isAfterLunch && (
                    <tr key={`${slot}-lunch`}>
                      <td
                        colSpan={colCount}
                        style={LUNCH_CELL}
                      >
                        Lunch + Prayer Break
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────── */}
      {legend.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <LegendTable legend={legend} />
        </div>
      )}
    </div>
  );
});

// ─── Legend sub-component ─────────────────────────────────────────────────────

function LegendTable({ legend }) {
  if (!legend.length) return null;
  const headers = Object.keys(legend[0]);

  const LGND_HEAD = {
    ...BASE,
    backgroundColor: '#fef3c7',
    color: '#78350f',
    fontWeight: '800',
    fontSize: '0.73rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '7px 10px',
    whiteSpace: 'nowrap',
  };
  const LGND_CELL = {
    ...BASE,
    fontSize: '0.73rem',
    padding: '6px 10px',
    textAlign: 'left',
  };

  return (
    <div
      style={{
        border: '2px solid #1e293b',
        borderRadius: '3px',
        overflow: 'hidden',
        display: 'inline-block',
        width: '100%',
      }}
    >
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={LGND_HEAD}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {legend.map((row, ri) => (
            <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              {headers.map((h) => (
                <td key={h} style={LGND_CELL}>{row[h] ?? ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimetableGrid;
