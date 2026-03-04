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
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden">

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="glow-orb absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-violet-600/20 blur-[96px]" />
        <div className="glow-orb absolute top-1/2 -right-48 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[96px]" style={{ animationDelay: '3s' }} />
        <div className="glow-orb absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full bg-blue-700/10 blur-[96px]" style={{ animationDelay: '5.5s' }} />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-amber-400 uppercase">
            Datesheet
          </span>
          {fileUploaded && (
            <button
              onClick={handleReset}
              className="text-[11px] font-mono text-white/30 hover:text-rose-400 tracking-widest transition-colors"
            >
              ← new file
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-14 space-y-12">

        {/* Error */}
        {error && (
          <div className="glass border-rose-500/30 text-rose-300 rounded-2xl px-5 py-4 text-sm font-mono" style={{ borderColor: 'rgba(244,63,94,0.25)' }}>
            {error}
          </div>
        )}

        {/* Upload */}
        {!fileUploaded && (
          <section className="pt-10 space-y-12">
            <div className="space-y-5">
              <p className="text-[11px] font-mono tracking-[0.35em] text-amber-400/70 uppercase">Schedule Generator</p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Your schedule.<br />
                <span className="text-amber-400">Flawlessly.</span>
              </h1>
              <p className="text-white/40 max-w-xs text-sm leading-relaxed font-light">
                Drop the master Excel datesheet. Receive surgical precision — client-side, zero telemetry, zero compromise.
              </p>
            </div>
            <FileUploader onFileLoaded={handleFile} isLoading={isLoading} />
          </section>
        )}

        {/* Selection + Preview */}
        {fileUploaded && (
          <section className="space-y-8">

            {/* Stats */}
            <div className="glass rounded-2xl px-6 py-4 inline-flex gap-8 text-[11px] font-mono">
              <span className="text-white/35"><span className="text-white font-bold text-sm">{allRows.length}</span> rows</span>
              <span className="text-white/35"><span className="text-white font-bold text-sm">{batches.length}</span> batches</span>
              <span className="text-white/35"><span className="text-white font-bold text-sm">{courses.length}</span> courses</span>
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
                  <p className="text-[11px] font-mono text-white/30 tracking-widest">
                    <span className="text-amber-400 font-bold text-sm">{displayRows.length}</span> exams
                  </p>
                  <button
                    onClick={handleExportImage}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-950 text-[11px] font-mono font-black tracking-widest rounded-xl hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
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

        <footer className="text-[10px] font-mono text-white/15 pt-10 border-t border-white/5 tracking-widest">
          100% client-side · zero telemetry · zero trust required.
        </footer>
      </main>
    </div>
  );
}
