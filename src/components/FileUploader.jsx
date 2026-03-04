import { useCallback } from 'react';

export default function FileUploader({ onFileLoaded, isLoading }) {
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileLoaded(file);
  }, [onFileLoaded]);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) onFileLoaded(file);
  }, [onFileLoaded]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className="relative flex flex-col items-start justify-center w-full max-w-sm glass rounded-2xl p-8 cursor-pointer group
        hover:border-amber-400/40 transition-all duration-300"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      {isLoading ? (
        <>
          <p className="text-amber-400 font-mono text-[11px] tracking-widest uppercase animate-pulse mb-1">Parsing…</p>
          <p className="text-white/20 font-mono text-[10px]">Extracting rows</p>
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4 group-hover:bg-amber-400/20 transition-colors">
            <span className="text-amber-400 text-sm font-bold">↑</span>
          </div>
          <p className="text-white font-semibold text-sm mb-1 group-hover:text-amber-400 transition-colors">
            Drop your file here
          </p>
          <p className="text-white/30 font-mono text-[10px] tracking-widest">.xlsx · .xls · .csv</p>
        </>
      )}
    </div>
  );
}
