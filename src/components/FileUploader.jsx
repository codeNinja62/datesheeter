import { useCallback, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

const ALLOWED_EXT = ['.xlsx', '.xls', '.csv'];

function isAllowed(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return ALLOWED_EXT.some((ext) => name.endsWith(ext));
}

export default function FileUploader({ onFileLoaded, isLoading, onTypeError }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!isAllowed(file)) {
      onTypeError?.(`"${file.name}" is not supported. Use .xlsx, .xls, or .csv.`);
      return;
    }
    onFileLoaded(file);
  }, [onFileLoaded, onTypeError]);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after a reset
    if (inputRef.current) inputRef.current.value = '';
    if (file) onFileLoaded(file);
  }, [onFileLoaded]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    // Only clear when leaving the zone itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`relative flex flex-col items-start justify-center w-full max-w-sm rounded-2xl p-8 cursor-pointer
        transition-all duration-300 glass
        ${isDragging ? '[border-color:rgb(251_191_36_/_0.6)] bg-amber-400/5' : 'hover:[border-color:rgb(251_191_36_/_0.35)]'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      {isLoading ? (
        <>
          <Loader2 className="text-amber-400 animate-spin mb-3" size={18} strokeWidth={2} />
          <p className="text-amber-400 font-mono text-[11px] tracking-widest uppercase mb-1">Parsing</p>
          <p className="text-white/20 font-mono text-[10px]">Extracting rows</p>
        </>
      ) : (
        <>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            isDragging ? 'bg-amber-400/25' : 'bg-amber-400/10'
          }`}>
            <Upload className="text-amber-400" size={15} strokeWidth={2.5} />
          </div>
          <p className={`font-semibold text-sm mb-1 transition-colors ${isDragging ? 'text-amber-400' : 'text-white'}`}>
            {isDragging ? 'Release to upload' : 'Drop your file here'}
          </p>
          <p className="text-white/30 font-mono text-[10px] tracking-widest">.xlsx · .xls · .csv</p>
        </>
      )}
    </div>
  );
}
