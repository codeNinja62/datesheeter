export default function BatchSelector({ batches, selectedBatch, onSelect }) {
  return (
    <div className="w-full max-w-xs">
      <label className="block text-sm font-medium text-slate-600 mb-1">
        Select Batch
      </label>
      <select
        value={selectedBatch}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
      >
        <option value="">— Choose a batch —</option>
        {batches.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}
