export default function BatchSelector({ batches, selectedBatch, onSelect }) {
  return (
    <div className="w-full max-w-xs space-y-2">
      <label className="block text-[10px] font-mono text-white/30 tracking-[0.3em] uppercase">Batch</label>
      <div className="relative">
        <select
          value={selectedBatch}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full glass glass-focus rounded-xl px-4 py-2.5 pr-9 text-sm font-mono text-white
            transition-all cursor-pointer appearance-none"
          style={{ colorScheme: 'dark' }}
        >
          <option value="" style={{ background: '#0f0f23' }}>select batch</option>
          {batches.map((b) => (
            <option key={b} value={b} style={{ background: '#0f0f23' }}>{b}</option>
          ))}
        </select>
        {/* Custom chevron — appearance-none removes native arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
