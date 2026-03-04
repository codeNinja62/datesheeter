import { useCallback } from 'react';

export default function FileUploader({ onFileLoaded, isLoading }) {
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file) onFileLoaded(file);
    },
    [onFileLoaded]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onFileLoaded(file);
    },
    [onFileLoaded]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto border-2 border-dashed border-indigo-300 rounded-2xl p-10 bg-white/60 backdrop-blur hover:border-indigo-500 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      <svg
        className="w-12 h-12 text-indigo-400 mb-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.572 5.345A4.5 4.5 0 0118 19.5H6.75z"
        />
      </svg>
      {isLoading ? (
        <p className="text-indigo-600 font-medium animate-pulse">Processing file…</p>
      ) : (
        <>
          <p className="text-slate-700 font-medium text-lg">
            Drop your Excel datesheet here
          </p>
          <p className="text-slate-400 text-sm mt-1">or click to browse (.xlsx, .csv)</p>
        </>
      )}
    </div>
  );
}
