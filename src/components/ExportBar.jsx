export default function ExportBar({ onExportImage, disabled }) {
  const base =
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onExportImage}
        disabled={disabled}
        className={`${base} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download as Image
      </button>
    </div>
  );
}
