import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, X, Download, Loader2, Calendar, Grid3X3 } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ModeToggle from './components/ModeToggle';
import BatchSelector from './components/BatchSelector';
import CourseSelector from './components/CourseSelector';
import DatesheetTable from './components/DatesheetTable';
import TimetableGrid from './components/TimetableGrid';
import { parseFile, filterByBatch, filterByCourses, sortRows } from './utils/dataProcessor';
import { parseTimetableFile } from './utils/timetableProcessor';
import { exportToImage } from './utils/exporter';

export default function App() {
  // ── Top-level app mode ──────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState('datesheet'); // 'datesheet' | 'timetable'

  // ── Datesheet state ─────────────────────────────────────────────────────────
  const [allRows, setAllRows]       = useState([]);
  const [batches, setBatches]       = useState([]);
  const [courses, setCourses]       = useState([]);
  const [dsIsLoading, setDsLoading] = useState(false);
  const [dsError, setDsError]       = useState('');
  const [mode, setMode]             = useState('batch');
  const [selectedBatch, setSelectedBatch]   = useState('');
  const [selectedNames, setSelectedNames]   = useState([]);
  const [dsFileUploaded, setDsFileUploaded] = useState(false);
  const [dsExporting, setDsExporting]       = useState(false);
  const [confirmReset, setConfirmReset]     = useState(false);
  const confirmTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  // ── Timetable state ─────────────────────────────────────────────────────────
  const [ttTimetables, setTtTimetables]       = useState({});
  const [ttBatches, setTtBatches]             = useState([]);
  const [ttSelectedBatch, setTtSelectedBatch] = useState('');
  const [ttIsLoading, setTtIsLoading]         = useState(false);
  const [ttError, setTtError]                 = useState('');
  const [ttFileUploaded, setTtFileUploaded]   = useState(false);
  const [ttExporting, setTtExporting]         = useState(false);
  const [ttConfirmReset, setTtConfirmReset]   = useState(false);
  const ttConfirmTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(ttConfirmTimerRef.current), []);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const tableRef  = useRef(null);
  const ttGridRef = useRef(null);

  // Cursor spotlight
  const spotRef = useRef(null);
  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;
    const move = (e) => {
      el.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const displayRows = useMemo(() => {
    if (mode === 'batch' && selectedBatch)
      return sortRows(filterByBatch(allRows, selectedBatch));
    if (mode === 'custom' && selectedNames.length > 0)
      return sortRows(filterByCourses(allRows, selectedNames));
    return [];
  }, [allRows, mode, selectedBatch, selectedNames]);

  const currentTimetable = ttTimetables[ttSelectedBatch] ?? null;

  // ═══════════════════════════════════════════════════════════════════════════
  // Datesheet handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTypeError = useCallback((msg) => setDsError(msg), []);

  const handleFile = useCallback(async (file) => {
    setDsLoading(true);
    setDsError('');
    try {
      const result = await parseFile(file);
      setAllRows(result.rows);
      setBatches(result.batches);
      setCourses(result.courses);
      setSelectedBatch('');
      setSelectedNames([]);
      setDsFileUploaded(true);
    } catch (err) {
      setDsError(err.message || 'Something went wrong while parsing the file.');
    } finally {
      setDsLoading(false);
    }
  }, []);

  const handleExportImage = useCallback(async () => {
    const el = tableRef.current;
    if (!el || dsExporting) return;
    setDsExporting(true);
    const slug = (mode === 'batch' && selectedBatch)
      ? selectedBatch.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      : 'custom';
    try { await exportToImage(el, `datesheet-${slug}.png`); }
    finally { setDsExporting(false); }
  }, [dsExporting, mode, selectedBatch]);

  const handleDsReset = useCallback(() => {
    setAllRows([]); setBatches([]); setCourses([]);
    setSelectedBatch(''); setSelectedNames([]);
    setDsFileUploaded(false); setDsError('');
    setConfirmReset(false);
  }, []);

  const handleDsResetClick = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      confirmTimerRef.current = setTimeout(() => setConfirmReset(false), 3000);
    } else {
      clearTimeout(confirmTimerRef.current);
      handleDsReset();
    }
  }, [confirmReset, handleDsReset]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Timetable handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTtTypeError = useCallback((msg) => setTtError(msg), []);

  const handleTtFile = useCallback(async (file) => {
    setTtIsLoading(true);
    setTtError('');
    try {
      const result = await parseTimetableFile(file);
      setTtTimetables(result.timetables);
      setTtBatches(result.batches);
      setTtSelectedBatch('');
      setTtFileUploaded(true);
    } catch (err) {
      setTtError(err.message || 'Something went wrong while parsing the timetable file.');
    } finally {
      setTtIsLoading(false);
    }
  }, []);

  const handleTtExportImage = useCallback(async () => {
    const el = ttGridRef.current;
    if (!el || ttExporting) return;
    setTtExporting(true);
    const slug = ttSelectedBatch.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    try { await exportToImage(el, `timetable-${slug}.png`); }
    finally { setTtExporting(false); }
  }, [ttExporting, ttSelectedBatch]);

  const handleTtReset = useCallback(() => {
    setTtTimetables({}); setTtBatches([]);
    setTtSelectedBatch(''); setTtFileUploaded(false);
    setTtError(''); setTtConfirmReset(false);
  }, []);

  const handleTtResetClick = useCallback(() => {
    if (!ttConfirmReset) {
      setTtConfirmReset(true);
      ttConfirmTimerRef.current = setTimeout(() => setTtConfirmReset(false), 3000);
    } else {
      clearTimeout(ttConfirmTimerRef.current);
      handleTtReset();
    }
  }, [ttConfirmReset, handleTtReset]);

  // ── Active-mode helpers (for header button) ─────────────────────────────────
  const activeFileUploaded    = appMode === 'datesheet' ? dsFileUploaded : ttFileUploaded;
  const activeConfirmReset    = appMode === 'datesheet' ? confirmReset   : ttConfirmReset;
  const handleActiveResetClick = appMode === 'datesheet' ? handleDsResetClick : handleTtResetClick;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden">

      {/* Cursor spotlight */}
      <div
        ref={spotRef}
        aria-hidden
        className="cursor-spotlight fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ willChange: 'transform' }}
      />

      {/* Header */}
      <header className="glass sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <span
            role={activeFileUploaded ? 'button' : undefined}
            onClick={activeFileUploaded ? handleActiveResetClick : undefined}
            className={`text-[11px] font-mono font-bold tracking-[0.3em] uppercase select-none ${
              activeFileUploaded ? 'cursor-pointer' : ''
            }`}
          >
            <span className="text-white/40">date</span>
            <span className={`text-amber-400 transition-colors ${activeFileUploaded ? 'hover:text-amber-300' : ''}`}>
              sheeter
            </span>
          </span>

          <div className="flex items-center gap-4">
            {/* App-mode toggle */}
            <div className="glass inline-flex gap-1 p-1 rounded-xl">
              <button
                onClick={() => setAppMode('datesheet')}
                title="Datesheets"
                className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg tracking-widest transition-all duration-200 inline-flex items-center gap-1.5 ${
                  appMode === 'datesheet'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-white/35 hover:text-white/70'
                }`}
              >
                <Calendar size={11} strokeWidth={2.5} />
                datesheet
              </button>
              <button
                onClick={() => setAppMode('timetable')}
                title="Weekly Timetables"
                className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg tracking-widest transition-all duration-200 inline-flex items-center gap-1.5 ${
                  appMode === 'timetable'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-white/35 hover:text-white/70'
                }`}
              >
                <Grid3X3 size={11} strokeWidth={2.5} />
                timetable
              </button>
            </div>

            {/* New-file reset — context-sensitive to active mode */}
            {activeFileUploaded && (
              <button
                onClick={handleActiveResetClick}
                className={`text-[11px] font-mono tracking-widest transition-colors ${
                  activeConfirmReset
                    ? 'text-rose-400 font-bold'
                    : 'text-white/30 hover:text-rose-400'
                }`}
              >
                {activeConfirmReset ? (
                  'confirm? click again'
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowLeft size={12} strokeWidth={2.5} />
                    new file
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12">

        {/* ══ DATESHEET MODE ════════════════════════════════════════════════════ */}
        {appMode === 'datesheet' && (
          <>
            {dsError && (
              <div className="glass-error text-rose-300 rounded-2xl px-5 py-3.5 text-sm font-mono flex items-start justify-between gap-4">
                <span>{dsError}</span>
                <button
                  onClick={() => setDsError('')}
                  aria-label="Dismiss error"
                  className="text-rose-400/50 hover:text-rose-300 transition-colors flex-shrink-0 mt-0.5 flex items-center"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {!dsFileUploaded && (
              <section className="pt-4 sm:pt-10 space-y-10 sm:space-y-12">
                <div className="space-y-5">
                  <p className="text-[11px] font-mono tracking-[0.35em] uppercase">
                    <span className="text-white/25">date</span>
                    <span className="text-amber-400/70">sheeter</span>
                  </p>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
                    Your schedule.<br />
                    <span className="text-amber-400">Flawlessly.</span>
                  </h1>
                  <p className="text-white/40 max-w-xs text-sm leading-relaxed font-light">
                    Drop the master Excel datesheet. Receive surgical precision — client-side, zero telemetry, zero compromise.
                  </p>
                </div>
                <FileUploader onFileLoaded={handleFile} isLoading={dsIsLoading} onTypeError={handleTypeError} />
              </section>
            )}

            {dsFileUploaded && (
              <section className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <div className="glass rounded-xl px-4 py-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-mono">
                    <span className="text-white/35"><span className="text-white font-bold text-sm">{allRows.length}</span> slots</span>
                    <span className="text-white/35"><span className="text-white font-bold text-sm">{batches.length}</span> batches</span>
                    <span className="text-white/35"><span className="text-white font-bold text-sm">{courses.length}</span> courses</span>
                  </div>
                  <ModeToggle mode={mode} onModeChange={setMode} />
                </div>

                <div key={mode} className="animate-fade-in-up">
                  {mode === 'batch' ? (
                    <BatchSelector batches={batches} selectedBatch={selectedBatch} onSelect={setSelectedBatch} />
                  ) : (
                    <CourseSelector courses={courses} selectedNames={selectedNames} onSelect={setSelectedNames} />
                  )}
                </div>

                {((mode === 'batch' && selectedBatch) || (mode === 'custom' && selectedNames.length > 0))
                  && displayRows.length === 0 && (
                  <p className="text-sm font-mono text-white/25 animate-fade-in-up">
                    No exams found for this selection.
                  </p>
                )}

                {displayRows.length > 0 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                      <p className="text-[11px] font-mono text-white/30 tracking-widest">
                        <span className="text-amber-400 font-bold text-sm">{displayRows.length}</span> exams
                      </p>
                      <button
                        onClick={handleExportImage}
                        disabled={dsExporting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-950 text-[11px] font-mono font-black tracking-widest rounded-xl hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
                      >
                        {dsExporting ? (
                          <><Loader2 size={13} strokeWidth={2.5} className="animate-spin" />Generating</>
                        ) : (
                          <><Download size={13} strokeWidth={2.5} />Save as image</>
                        )}
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
          </>
        )}

        {/* ══ TIMETABLE MODE ════════════════════════════════════════════════════ */}
        {appMode === 'timetable' && (
          <>
            {ttError && (
              <div className="glass-error text-rose-300 rounded-2xl px-5 py-3.5 text-sm font-mono flex items-start justify-between gap-4">
                <span style={{ whiteSpace: 'pre-wrap' }}>{ttError}</span>
                <button
                  onClick={() => setTtError('')}
                  aria-label="Dismiss error"
                  className="text-rose-400/50 hover:text-rose-300 transition-colors flex-shrink-0 mt-0.5 flex items-center"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {!ttFileUploaded && (
              <section className="pt-4 sm:pt-10 space-y-10 sm:space-y-12">
                <div className="space-y-5">
                  <p className="text-[11px] font-mono tracking-[0.35em] uppercase">
                    <span className="text-white/25">date</span>
                    <span className="text-amber-400/70">sheeter</span>
                    <span className="text-white/25"> · </span>
                    <span className="text-amber-400/50">timetable</span>
                  </p>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
                    Weekly grid.<br />
                    <span className="text-amber-400">Crystal clear.</span>
                  </h1>
                  <p className="text-white/40 max-w-xs text-sm leading-relaxed font-light">
                    Drop the timetable Excel file. Each sheet should be a batch/section. Get a clean weekly grid — ready to export.
                  </p>
                </div>
                <FileUploader onFileLoaded={handleTtFile} isLoading={ttIsLoading} onTypeError={handleTtTypeError} />
              </section>
            )}

            {ttFileUploaded && (
              <section className="space-y-8">
                {/* Stats bar */}
                <div className="glass rounded-xl px-4 py-2 inline-flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-mono">
                  <span className="text-white/35">
                    <span className="text-white font-bold text-sm">{ttBatches.length}</span> sections
                  </span>
                  {currentTimetable && (
                    <span className="text-white/35">
                      <span className="text-white font-bold text-sm">{currentTimetable.timeSlots.length}</span> time slots
                    </span>
                  )}
                </div>

                {/* Batch selector */}
                <div className="animate-fade-in-up">
                  <BatchSelector
                    batches={ttBatches}
                    selectedBatch={ttSelectedBatch}
                    onSelect={setTtSelectedBatch}
                  />
                </div>

                {ttSelectedBatch && !currentTimetable && (
                  <p className="text-sm font-mono text-white/25 animate-fade-in-up">
                    No timetable data found for this batch.
                  </p>
                )}

                {currentTimetable && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                      <p className="text-[11px] font-mono text-white/30 tracking-widest">
                        <span className="text-amber-400 font-bold text-sm">{ttSelectedBatch}</span>
                      </p>
                      <button
                        onClick={handleTtExportImage}
                        disabled={ttExporting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-950 text-[11px] font-mono font-black tracking-widest rounded-xl hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
                      >
                        {ttExporting ? (
                          <><Loader2 size={13} strokeWidth={2.5} className="animate-spin" />Generating</>
                        ) : (
                          <><Download size={13} strokeWidth={2.5} />Save as image</>
                        )}
                      </button>
                    </div>

                    {/* Timetable grid */}
                    <div className="table-scroll overflow-x-auto flex justify-center">
                      <TimetableGrid timetable={currentTimetable} ref={ttGridRef} />
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <footer className="text-xs font-mono text-white/25 pt-10 border-t border-white/[0.06] tracking-widest">
          100% client-side · zero telemetry · zero trust required.
        </footer>
      </main>
    </div>
  );
}
