export default function BatchSelector({ batches, selectedBatch, onSelect }) {
  return (
    <div className="w-full max-w-xs space-y-2">
      <label className="block text-[10px] font-mono text-white/30 tracking-[0.3em] uppercase">Batch</label>
      <select
        value={selectedBatch}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full glass rounded-xl px-4 py-2.5 text-sm font-mono text-white
          focus:outline-none focus:border-amber-400/50 transition-all cursor-pointer
          appearance-none"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" style={{ background: '#0f0f23' }}>select batch</option>
        {batches.map((b) => (
          <option key={b} value={b} style={{ background: '#0f0f23' }}>{b}</option>
        ))}
      </select>
    </div>
  );
}
