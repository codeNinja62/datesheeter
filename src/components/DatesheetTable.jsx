import { forwardRef } from 'react';

const DatesheetTable = forwardRef(function DatesheetTable({ rows, title }, ref) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">
        No rows to display. Select a batch or courses above.
      </p>
    );
  }

  return (
    <div className="table-scroll overflow-x-auto">
      <table
        ref={ref}
        className="w-full min-w-[520px] font-sans"
        style={{ borderCollapse: 'collapse' }}
      >
        <thead>
          {/* Title row */}
          <tr>
            <th
              colSpan={4}
              className="text-center text-xl font-extrabold py-4 px-4 bg-white text-black"
              style={{ border: '2.5px solid #000' }}
            >
              {title || 'Datesheet'}
            </th>
          </tr>
          {/* Column headers */}
          <tr style={{ backgroundColor: '#F5B895' }}>
            {['Time', 'Date', 'Day', 'Subject'].map((h) => (
              <th
                key={h}
                className="text-center font-extrabold text-black py-3 px-6 text-base"
                style={{ border: '2.5px solid #000' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="bg-white">
              <td
                className="text-center font-semibold text-black py-3 px-6 whitespace-nowrap"
                style={{ border: '2.5px solid #000' }}
              >
                {r.slot}
              </td>
              <td
                className="text-center font-semibold text-black py-3 px-6 whitespace-nowrap"
                style={{ border: '2.5px solid #000' }}
              >
                {r.date}
              </td>
              <td
                className="text-center font-semibold text-black py-3 px-6"
                style={{ border: '2.5px solid #000' }}
              >
                {r.day}
              </td>
              <td
                className="text-center font-extrabold text-black py-3 px-6"
                style={{ border: '2.5px solid #000', backgroundColor: '#FFFF00' }}
              >
                {r.courseName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default DatesheetTable;
