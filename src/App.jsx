import { useState, useRef, useMemo, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import ModeToggle from './components/ModeToggle';
import BatchSelector from './components/BatchSelector';
import CourseSelector from './components/CourseSelector';
import DatesheetTable from './components/DatesheetTable';
import ExportBar from './components/ExportBar';
import { parseFile, filterByBatch, filterByCourses, sortRows } from './utils/dataProcessor';
import { exportToExcel, exportToImage } from './utils/exporter';

export default function App() {
  // Source data after parsing
  const [allRows, setAllRows] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('batch'); // 'batch' | 'custom'
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedNames, setSelectedNames] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);

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

  // ---------- Filtered & sorted rows ----------

  const displayRows = useMemo(() => {
    let filtered = [];
    if (mode === 'batch' && selectedBatch) {
      filtered = filterByBatch(allRows, selectedBatch);
    } else if (mode === 'custom' && selectedNames.length > 0) {
      filtered = filterByCourses(allRows, selectedNames);
    }
    return sortRows(filtered);
  }, [allRows, mode, selectedBatch, selectedNames]);

  // ---------- Export handlers ----------

  const handleExportImage = useCallback(() => {
    const el = tableRef.current;
    if (el) exportToImage(el);
  }, []);

  const handleExportExcel = useCallback(() => {
    exportToExcel(displayRows);
  }, [displayRows]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold text-indigo-700 tracking-tight">
            📅 Datesheet Generator
          </h1>
          {fileUploaded && (
            <button
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-red-500 transition"
            >
              Upload New File
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Upload Phase */}
        {!fileUploaded && (
          <section className="pt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2">
                Your Exam Schedule, Simplified
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Upload your university's master Excel datesheet and get a clean,
                personalized schedule in seconds. 100% private — nothing leaves your browser.
              </p>
            </div>
            <FileUploader onFileLoaded={handleFile} isLoading={isLoading} />
          </section>
        )}

        {/* Selection Phase */}
        {fileUploaded && (
          <section className="space-y-6">
            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                {allRows.length} rows
              </span>
              <span className="bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                {batches.length} batches
              </span>
              <span className="bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                {courses.length} courses
              </span>
            </div>

            {/* Mode Toggle */}
            <ModeToggle mode={mode} onModeChange={setMode} />

            {/* Selectors */}
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

            {/* Preview Phase */}
            {displayRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-slate-700">
                    Your Datesheet{' '}
                    <span className="text-indigo-500 font-normal text-base">
                      ({displayRows.length} exams)
                    </span>
                  </h3>
                  <ExportBar
                    onExportImage={handleExportImage}
                    onExportExcel={handleExportExcel}
                    disabled={displayRows.length === 0}
                  />
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

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-6 pb-4 border-t border-slate-100">
          Datesheet Generator — 100% client-side, zero data sent to any server.
        </footer>
      </main>
    </div>
  );
}
