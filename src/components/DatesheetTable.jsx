import { forwardRef } from 'react';

const innerBorder = '1px solid #888';

const cell = {
  border: innerBorder,
  padding: '10px 28px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const DatesheetTable = forwardRef(function DatesheetTable({ rows, title }, ref) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">
        No rows to display. Select a batch or courses above.
      </p>
    );
  }

  return (
    <div className="table-scroll overflow-x-auto flex justify-center">
      <div
        ref={ref}
        className="inline-block"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: '#fff' }}
      >
        <p
          style={{
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '1.35rem',
            margin: '0 0 14px 0',
            color: '#000',
            letterSpacing: '0.01em',
          }}
        >
          {title || 'Datesheet'}
        </p>

        {/* Thick outer border via wrapper div */}
        <div style={{ border: '3px solid #000', display: 'inline-block' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4B183' }}>
                {['Time', 'Date', 'Day', 'Subject'].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...cell,
                      fontWeight: '900',
                      fontSize: '1rem',
                      color: '#000',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ backgroundColor: '#fff' }}>
                  <td style={{ ...cell, fontWeight: '600' }}>{r.slot}</td>
                  <td style={{ ...cell, fontWeight: '600' }}>{r.date}</td>
                  <td style={{ ...cell, fontWeight: '600' }}>{r.day}</td>
                  <td
                    style={{
                      ...cell,
                      fontWeight: '900',
                      backgroundColor: '#FFFF00',
                    }}
                  >
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
