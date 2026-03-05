import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, X, Download, Loader2 } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ModeToggle from './components/ModeToggle';
import BatchSelector from './components/BatchSelector';
import CourseSelector from './components/CourseSelector';
import DatesheetTable from './components/DatesheetTable';
import { parseFile, filterByBatch, filterByCourses, sortRows } from './utils/dataProcessor';
import { exportToImage } from './utils/exporter';

const DEFAULT_COLUMNS = [
  { id: 'slot', label: 'Time' },
  { id: 'date', label: 'Date' },
  { id: 'day', label: 'Day' },
  { id: 'courseName', label: 'Subject' },
];

const DEFAULT_THEME = {
  headerBg: '#0f172a',
  headerText: '#ffffff',
  bodyText: '#000000',
  rowOdd: '#ffffff',
  rowEven: '#f8fafc',
  accentBg: '#fbbf24',
  accentText: '#000000',
  border: '#0f172a',
};

function createEditableRows(sourceRows, columns) {
  const columnIds = columns.map((c) => c.id);
  return sourceRows.map((row) => {
    const next = {};
    for (const id of columnIds) {
      next[id] = row?.[id] ?? '';
    }
    return next;
  });
}

function moveItem(items, from, to) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const clone = [...items];
  const [picked] = clone.splice(from, 1);
  clone.splice(to, 0, picked);
  return clone;
}

export default function App() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [allRows, setAllRows]       = useState([]);
  const [batches, setBatches]       = useState([]);
  const [courses, setCourses]       = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [mode, setMode]             = useState('batch');
  const [selectedBatch, setSelectedBatch]   = useState('');
  const [selectedNames, setSelectedNames]   = useState([]);
  const [fileUploaded, setFileUploaded]     = useState(false);
  const [exporting, setExporting]           = useState(false);
  const [confirmReset, setConfirmReset]     = useState(false);
  const [tableColumns, setTableColumns]     = useState(DEFAULT_COLUMNS);
  const [editableRows, setEditableRows]     = useState([]);
  const [tableTheme, setTableTheme]         = useState(DEFAULT_THEME);
  const confirmTimerRef = useRef(null);
  const customColCountRef = useRef(1);
  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const tableRef = useRef(null);

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

  useEffect(() => {
    setTableColumns(DEFAULT_COLUMNS);
    setTableTheme(DEFAULT_THEME);
    setEditableRows(createEditableRows(displayRows, DEFAULT_COLUMNS));
    customColCountRef.current = 1;
  }, [displayRows]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTypeError = useCallback((msg) => setError(msg), []);

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

  const handleExportImage = useCallback(async () => {
    const el = tableRef.current;
    if (!el || exporting) return;
    setExporting(true);
    const slug = (mode === 'batch' && selectedBatch)
      ? selectedBatch.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      : 'custom';
    try { await exportToImage(el, `datesheet-${slug}.png`); }
    finally { setExporting(false); }
  }, [exporting, mode, selectedBatch]);

  const handleReset = useCallback(() => {
    setAllRows([]); setBatches([]); setCourses([]);
    setSelectedBatch(''); setSelectedNames([]);
    setFileUploaded(false); setError(''); setConfirmReset(false);
    setTableColumns(DEFAULT_COLUMNS);
    setEditableRows([]);
    setTableTheme(DEFAULT_THEME);
    customColCountRef.current = 1;
  }, []);

  const handleResetClick = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      confirmTimerRef.current = setTimeout(() => setConfirmReset(false), 3000);
    } else {
      clearTimeout(confirmTimerRef.current);
      handleReset();
    }
  }, [confirmReset, handleReset]);

  const handleCellChange = useCallback((rowIndex, columnId, value) => {
    setEditableRows((prev) => prev.map((row, idx) => (
      idx === rowIndex ? { ...row, [columnId]: value } : row
    )));
  }, []);

  const handleRowMove = useCallback((rowIndex, direction) => {
    const nextIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    setEditableRows((prev) => moveItem(prev, rowIndex, nextIndex));
  }, []);

  const handleRowRemove = useCallback((rowIndex) => {
    setEditableRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  }, []);

  const handleRowAdd = useCallback(() => {
    setEditableRows((prev) => {
      const next = {};
      for (const col of tableColumns) next[col.id] = '';
      return [...prev, next];
    });
  }, [tableColumns]);

  const handleColumnRename = useCallback((columnId, label) => {
    setTableColumns((prev) => prev.map((col) => (
      col.id === columnId ? { ...col, label } : col
    )));
  }, []);

  const handleColumnMove = useCallback((columnIndex, direction) => {
    const nextIndex = direction === 'left' ? columnIndex - 1 : columnIndex + 1;
    setTableColumns((prev) => moveItem(prev, columnIndex, nextIndex));
  }, []);

  const handleColumnRemove = useCallback((columnId) => {
    setTableColumns((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((col) => col.id !== columnId);
    });
    setEditableRows((prev) => prev.map((row) => {
      const next = { ...row };
      delete next[columnId];
      return next;
    }));
  }, []);

  const handleColumnAdd = useCallback(() => {
    const newId = `custom_${customColCountRef.current}`;
    const newLabel = `Custom ${customColCountRef.current}`;
    customColCountRef.current += 1;
    setTableColumns((prev) => [...prev, { id: newId, label: newLabel }]);
    setEditableRows((prev) => prev.map((row) => ({ ...row, [newId]: '' })));
  }, []);

  const handleThemeChange = useCallback((key, value) => {
    setTableTheme((prev) => ({ ...prev, [key]: value }));
  }, []);

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
            role={fileUploaded ? 'button' : undefined}
            onClick={fileUploaded ? handleResetClick : undefined}
            className={`text-[11px] font-mono font-bold tracking-[0.3em] uppercase select-none ${
              fileUploaded ? 'cursor-pointer' : ''
            }`}
          >
            <span className="text-white/40">date</span>
            <span className={`text-amber-400 transition-colors ${fileUploaded ? 'hover:text-amber-300' : ''}`}>
              sheeter
            </span>
          </span>

          {fileUploaded && (
            <button
              onClick={handleResetClick}
              className={`text-[11px] font-mono tracking-widest transition-colors ${
                confirmReset
                  ? 'text-rose-400 font-bold'
                  : 'text-white/30 hover:text-rose-400'
              }`}
            >
              {confirmReset ? (
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
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12">

        {error && (
          <div className="glass-error text-rose-300 rounded-2xl px-5 py-3.5 text-sm font-mono flex items-start justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              aria-label="Dismiss error"
              className="text-rose-400/50 hover:text-rose-300 transition-colors flex-shrink-0 mt-0.5 flex items-center"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {!fileUploaded && (
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
            <FileUploader onFileLoaded={handleFile} isLoading={isLoading} onTypeError={handleTypeError} />
          </section>
        )}

        {fileUploaded && (
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
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-950 text-[11px] font-mono font-black tracking-widest rounded-xl hover:bg-amber-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
                  >
                    {exporting ? (
                      <><Loader2 size={13} strokeWidth={2.5} className="animate-spin" />Generating</>
                    ) : (
                      <><Download size={13} strokeWidth={2.5} />Save as image</>
                    )}
                  </button>
                </div>
                <div className="glass rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-mono text-white/45 tracking-widest uppercase">
                      table editor
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleColumnAdd}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-widest bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
                      >
                        add column
                      </button>
                      <button
                        onClick={handleRowAdd}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-widest bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
                      >
                        add row
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                      ['headerBg', 'Header BG'],
                      ['headerText', 'Header Text'],
                      ['bodyText', 'Body Text'],
                      ['rowOdd', 'Row 1'],
                      ['rowEven', 'Row 2'],
                      ['accentBg', 'Accent BG'],
                      ['accentText', 'Accent Text'],
                      ['border', 'Border'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-[10px] font-mono text-white/55 tracking-wide uppercase">
                        <input
                          type="color"
                          value={tableTheme[key]}
                          onChange={(e) => handleThemeChange(key, e.target.value)}
                          className="h-8 w-8 rounded border border-white/20 bg-transparent p-0 cursor-pointer"
                          aria-label={label}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <DatesheetTable
                  rows={editableRows}
                  columns={tableColumns}
                  ref={tableRef}
                  theme={tableTheme}
                  onCellChange={handleCellChange}
                  onMoveRow={handleRowMove}
                  onRemoveRow={handleRowRemove}
                  onMoveColumn={handleColumnMove}
                  onRemoveColumn={handleColumnRemove}
                  onRenameColumn={handleColumnRename}
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

        <footer className="text-xs font-mono text-white/25 pt-10 border-t border-white/[0.06] tracking-widest">
          100% client-side · zero telemetry · zero trust required.
        </footer>
      </main>
    </div>
  );
}

