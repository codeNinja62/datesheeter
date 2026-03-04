import { ChevronDown } from 'lucide-react';

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
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={14} strokeWidth={2.5} />
      </div>
    </div>
  );
}
