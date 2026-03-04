export default function ModeToggle({ mode, onModeChange }) {
  const base =
    'px-5 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400';
  const active = 'bg-indigo-600 text-white shadow';
  const inactive = 'bg-white text-slate-600 hover:bg-slate-100';

  return (
    <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl">
      <button
        className={`${base} ${mode === 'batch' ? active : inactive}`}
        onClick={() => onModeChange('batch')}
      >
        By Batch
      </button>
      <button
        className={`${base} ${mode === 'custom' ? active : inactive}`}
        onClick={() => onModeChange('custom')}
      >
        Custom Courses
      </button>
    </div>
  );
}
