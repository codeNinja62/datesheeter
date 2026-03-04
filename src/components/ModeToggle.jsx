export default function ModeToggle({ mode, onModeChange }) {
  const btn = (val, label) => (
    <button
      onClick={() => onModeChange(val)}
      className={`px-4 py-1.5 text-[11px] font-mono font-bold rounded-lg tracking-widest transition-all duration-200 ${
        mode === val
          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
          : 'text-white/35 hover:text-white/70'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="glass inline-flex gap-1 p-1 rounded-xl">
      {btn('batch', 'by batch')}
      {btn('custom', 'custom')}
    </div>
  );
}
