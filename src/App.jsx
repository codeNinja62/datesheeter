import { useState, useRef, useMemo, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import ModeToggle from './components/ModeToggle';
import BatchSelector from './components/BatchSelector';
import CourseSelector from './components/CourseSelector';
import DatesheetTable from './components/DatesheetTable';
import { parseFile, filterByBatch, filterByCourses, sortRows } from './utils/dataProcessor';
import { exportToImage } from './utils/exporter';

export default function App() {
  // Source data after parsing
  const [allRows, setAllRows] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('batch');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedNames, setSelectedNames] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Ref for the table element (used by image export)
  const tableRef = useRef(null);

  // ---------- Handlers ----------

  const handleFile = useCallback(async (file) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await parseFile(file);
      setAllRows(result.rows);
      setBatches(result.batches);
      setCourses(result.courses);
      setSelectedBatch('');
      setSelectedNames([]);
      setFileUploaded(true);
    } catch (err) {
      setError(err.message || 'Something went wrong while parsing the file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const displayRows = useMemo(() => {
    if (mode === 'batch' && selectedBatch)
      return sortRows(filterByBatch(allRows, selectedBatch));
    if (mode === 'custom' && selectedNames.length > 0)
      return sortRows(filterByCourses(allRows, selectedNames));
    return [];
  }, [allRows, mode, selectedBatch, selectedNames]);

  const handleExportImage = useCallback(async () => {
    const el = tableRef.current;
    if (!el || exporting) return;
    setExporting(true);
    try { await exportToImage(el); }
    finally { setExporting(false); }
  }, [exporting]);

  // ---------- Reset ----------

  const handleReset = () => {
    setAllRows([]);
    setBatches([]);
    setCourses([]);
    setSelectedBatch('');
    setSelectedNames([]);
    setFileUploaded(false);
    setError('');
  };

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-10 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
          <span className="text-sm font-mono font-bold tracking-widest text-amber-400 uppercase">
            Datesheet
          </span>
          {fileUploaded && (
            <button
              onClick={handleReset}
              className="text-xs font-mono text-zinc-500 hover:text-red-400 transition-colors"
            >
              ← new file
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-12 space-y-10">

        {/* Error */}
        {error && (
          <div className="border border-red-800 bg-red-950/40 text-red-400 rounded px-4 py-3 text-sm font-mono">
            {error}
          </div>
        )}

        {/* Upload */}
        {!fileUploaded && (
          <section className="pt-8 space-y-10">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 leading-none">
                Your schedule.<br />
                <span className="text-amber-400">No noise.</span>
              </h1>
              <p className="text-zinc-400 max-w-sm text-sm leading-relaxed">
                Drop the master Excel datesheet. Get a clean, personal schedule instantly.
                Nothing touches a server — ever.
              </p>
            </div>
            <FileUploader onFileLoaded={handleFile} isLoading={isLoading} />
          </section>
        )}

        {/* Selection + Preview */}
        {fileUploaded && (
          <section className="space-y-8">

            {/* Stats */}
            <div className="flex gap-6 text-xs font-mono text-zinc-500">
              <span><span className="text-zinc-200 font-bold">{allRows.length}</span> rows</span>
              <span><span className="text-zinc-200 font-bold">{batches.length}</span> batches</span>
              <span><span className="text-zinc-200 font-bold">{courses.length}</span> courses</span>
            </div>

            <ModeToggle mode={mode} onModeChange={setMode} />

            {mode === 'batch' ? (
              <BatchSelector
                batches={batches}
                selectedBatch={selectedBatch}
                onSelect={setSelectedBatch}
              />
            ) : (
              <CourseSelector
                courses={courses}
                selectedNames={selectedNames}
                onSelect={setSelectedNames}
              />
            )}

            {displayRows.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-mono text-zinc-500">
                    <span className="text-amber-400 font-bold">{displayRows.length}</span> exams
                  </p>
                  <button
                    onClick={handleExportImage}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-zinc-950 text-xs font-mono font-bold rounded hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {exporting ? 'Generating…' : '↓ Save as image'}
                  </button>
                </div>

                <DatesheetTable
                  rows={displayRows}
                  ref={tableRef}
                  title={
                    mode === 'batch' && selectedBatch
                      ? `Datesheet — ${selectedBatch}`
                      : 'Custom Datesheet'
                  }
                />
              </div>
            )}
          </section>
        )}

        <footer className="text-xs font-mono text-zinc-700 pt-8 border-t border-zinc-900">
          100% client-side · zero telemetry · zero trust required.
        </footer>
      </main>
    </div>
  );
}
