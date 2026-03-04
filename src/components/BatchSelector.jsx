export default function BatchSelector({ batches, selectedBatch, onSelect }) {
  return (
    <div className="w-full max-w-xs">
      <label className="block text-xs font-mono text-zinc-500 mb-1.5">batch</label>
      <select
        value={selectedBatch}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100 focus:border-amber-400 focus:outline-none transition-colors"
      >
        <option value="">select batch</option>
        {batches.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>
  );
}
