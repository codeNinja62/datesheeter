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
      className="relative flex flex-col items-start justify-center w-full max-w-md border border-zinc-700 hover:border-amber-400 rounded-lg p-8 bg-zinc-900 transition-colors cursor-pointer group"
    >
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      {isLoading ? (
        <p className="text-amber-400 font-mono text-sm animate-pulse">parsing…</p>
      ) : (
        <>
          <p className="text-zinc-100 font-mono font-bold text-sm mb-1 group-hover:text-amber-400 transition-colors">
            drop file here
          </p>
          <p className="text-zinc-600 font-mono text-xs">.xlsx · .xls · .csv</p>
        </>
      )}
    </div>
  );
}
