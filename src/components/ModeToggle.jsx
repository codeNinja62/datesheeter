export default function ModeToggle({ mode, onModeChange }) {
  const btn = (val, label) => (
    <button
      onClick={() => onModeChange(val)}
      className={`px-4 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
        mode === val
          ? 'bg-amber-400 text-zinc-950'
          : 'text-zinc-400 hover:text-zinc-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex gap-1 p-1 border border-zinc-800 rounded bg-zinc-900">
      {btn('batch', 'by batch')}
      {btn('custom', 'custom')}
    </div>
  );
}
