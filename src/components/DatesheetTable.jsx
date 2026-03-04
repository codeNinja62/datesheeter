import { forwardRef } from 'react';

const DatesheetTable = forwardRef(function DatesheetTable({ rows }, ref) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">
        No rows to display. Select a batch or courses above.
      </p>
    );
  }

  return (
    <div className="table-scroll overflow-x-auto rounded-xl shadow-sm border border-slate-200">
      <table ref={ref} className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="bg-indigo-600 text-white text-left">
            <th className="px-5 py-3 font-semibold">#</th>
            <th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3 font-semibold">Day</th>
            <th className="px-5 py-3 font-semibold">Time</th>
            <th className="px-5 py-3 font-semibold">Course Code</th>
            <th className="px-5 py-3 font-semibold">Course Name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`${
                i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              } hover:bg-indigo-50 transition-colors`}
            >
              <td className="px-5 py-3 text-slate-400 font-mono">{i + 1}</td>
              <td className="px-5 py-3 text-slate-700 font-medium whitespace-nowrap">
                {r.date}
              </td>
              <td className="px-5 py-3 text-slate-600">{r.day}</td>
              <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.slot}</td>
              <td className="px-5 py-3 text-indigo-600 font-medium">{r.courseCode}</td>
              <td className="px-5 py-3 text-slate-700">{r.courseName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default DatesheetTable;
