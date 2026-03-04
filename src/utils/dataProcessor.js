import * as XLSX from 'xlsx';

// ─── Column concept synonym maps ──────────────────────────────────────────────
//
// Each entry is a list of fragments that could appear (anywhere) in a column
// header. Matching is bidirectional substring:
//   headerCell.includes(fragment) || fragment.includes(headerCell)
//
const CONCEPTS = {
  batch: [
    'batch', 'section', 'group', 'class', 'programme', 'program',
    'dept', 'department', 'roll', 'semester group', 'sem group',
  ],
  date: [
    'exam date', 'examination date', 'schedule date', 'test date', 'date',
  ],
  day: [
    'weekday', 'day of week', 'day',
  ],
  slot: [
    'time slot', 'exam time', 'exam slot', 'timing', 'time', 'slot',
    'period', 'shift', 'session', 'duration',
  ],
  course: [
    'course name', 'subject name', 'paper name', 'course title', 'subject title',
    'paper title', 'module name', 'course', 'subject', 'paper', 'module', 'title',
  ],
  // Explicitly recognised but IGNORED in output
  _skip: [
    'course code', 'subject code', 'paper code', 'code',
    'faculty', 'teacher', 'instructor', 'lecturer', 'invigilator',
    'room', 'venue', 'hall', 'block', 'marks', 'credit', 'credit hour',
  ],
};

const DAY_NAMES = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const MONTH_NAMES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const MAX_SCAN = 30; // max rows to scan for a header row

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // cellDates:true → XLSX converts Excel date serials to JS Date objects
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames.length) {
          reject(new Error('The file contains no sheets.'));
          return;
        }

        // Try every sheet; keep the one that yields the most data rows.
        let bestResult = null;
        const sheetErrors = [];

        for (const sheetName of workbook.SheetNames) {
          try {
            const result = parseSheet(workbook.Sheets[sheetName]);
            if (!bestResult || result.rows.length > bestResult.rows.length) {
              bestResult = result;
            }
          } catch (err) {
            sheetErrors.push(`  • ${sheetName}: ${err.message}`);
          }
        }

        if (!bestResult || bestResult.rows.length === 0) {
          const detail = sheetErrors.length
            ? `\n\nSheet details:\n${sheetErrors.join('\n')}`
            : '';
          reject(new Error(
            'No exam data could be extracted from this file.' +
            '\nExpected columns (any order, any reasonable name): ' +
            'Batch/Section, Date, Slot/Time, Course/Subject.' +
            detail
          ));
          return;
        }

        resolve(bestResult);
      } catch (err) {
        reject(new Error(`Could not read file: ${err.message}`));
      }
    };

    reader.onerror = () =>
      reject(new Error('Failed to read the file. Is it corrupted or still open in Excel?'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Sheet parser ─────────────────────────────────────────────────────────────

function parseSheet(sheet) {
  // defval:'' → empty cells become '' not undefined
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!json.length) throw new Error('Sheet is empty.');

  const { headerIdx, colMap } = findHeader(json);

  const seen   = new Set();
  const rows   = [];
  const batchSet  = new Set();
  const courseSet = new Set();

  for (let i = headerIdx + 1; i < json.length; i++) {
    const r = json[i];
    if (!r || r.length === 0) continue;

    const batch      = cellStr(r, colMap.batch);
    const courseName = cellStr(r, colMap.course);

    if (!batch && !courseName) continue;
    if (looksLikeHeaderRow(r))  continue;

    // ── Resolve date + day ─────────────────────────────────────────────────
    let date = '';
    let day  = '';

    if (colMap.date !== -1 && colMap.day !== -1) {
      // Ideal: separate Date and Day columns
      date = normalizeDate(cellStr(r, colMap.date));
      day  = capitalizeDay(cellStr(r, colMap.day));
    } else if (colMap.date !== -1) {
      // Date column only — derive Day from the parsed date
      date = normalizeDate(cellStr(r, colMap.date));
      day  = dayFromDateStr(date);
    } else if (colMap.combined !== -1) {
      // Single column containing both date and day name ("09-03-2026 ,Monday")
      const split = splitDateDay(cellStr(r, colMap.combined));
      date = split.date;
      day  = split.day;
    }

    const slot = cellStr(r, colMap.slot);

    const key = [batch, date, slot, courseName].join('\x00');
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ batch, date, day, slot, courseName });
    if (batch)      batchSet.add(batch);
    if (courseName) courseSet.add(courseName);
  }

  if (rows.length === 0) {
    throw new Error(`Header found at row ${headerIdx + 1} but no data rows followed.`);
  }

  return {
    rows,
    batches: [...batchSet].sort(),
    courses: [...courseSet].sort(),
  };
}

// ─── Header detection (scoring) ──────────────────────────────────────────────
//
// Score each candidate row by how many distinct column concepts it signals.
// The row with the highest score (must have batch + course at minimum) is the
// header. Scans up to MAX_SCAN rows so long institution title blocks are fine.
//

function findHeader(json) {
  let bestScore = -1;
  let bestIdx   = -1;
  let bestMap   = null;

  const limit = Math.min(json.length, MAX_SCAN);

  for (let i = 0; i < limit; i++) {
    const row = json[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const { score, colMap } = scoreRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIdx   = i;
      bestMap   = colMap;
    }
  }

  if (bestScore < 2 || !bestMap || bestMap.batch === -1 || bestMap.course === -1) {
    throw new Error(
      `Could not identify a header row (best score: ${bestScore}). ` +
      `Ensure columns exist for: Batch/Section, Date/Day, Slot/Time, Course/Subject.`
    );
  }

  return { headerIdx: bestIdx, colMap: bestMap };
}

function scoreRow(row) {
  const cells = row.map(c => normHeader(String(c ?? '')));

  const colMap = { batch: -1, date: -1, day: -1, combined: -1, slot: -1, course: -1 };
  const found  = new Set();

  for (let ci = 0; ci < cells.length; ci++) {
    const cell = cells[ci];
    if (!cell) continue;

    // Skip columns we intentionally ignore (code, faculty, room…)
    if (matchesConcept(cell, CONCEPTS._skip)) continue;

    // Batch
    if (colMap.batch === -1 && matchesConcept(cell, CONCEPTS.batch)) {
      colMap.batch = ci; found.add('batch'); continue;
    }

    // Course
    if (colMap.course === -1 && matchesConcept(cell, CONCEPTS.course)) {
      colMap.course = ci; found.add('course'); continue;
    }

    // Slot / Time
    if (colMap.slot === -1 && matchesConcept(cell, CONCEPTS.slot)) {
      colMap.slot = ci; found.add('slot'); continue;
    }

    // Date + Day (combined or separate)
    const isDate = matchesConcept(cell, CONCEPTS.date);
    const isDay  = matchesConcept(cell, CONCEPTS.day);

    if (isDate && isDay) {
      // e.g. "Day/Date", "Date & Day"
      if (colMap.combined === -1) { colMap.combined = ci; found.add('datetime'); }
    } else if (isDate) {
      if (colMap.date === -1) { colMap.date = ci; found.add('datetime'); }
    } else if (isDay) {
      if (colMap.date !== -1 && colMap.day === -1) {
        // Already have a date column — this is a separate day column
        colMap.day = ci;
      } else if (colMap.combined === -1 && colMap.date === -1) {
        // Tentatively treat "Day" as combined (values like "09-03-2026, Monday")
        colMap.combined = ci; found.add('datetime');
      }
    }
  }

  return { score: found.size, colMap };
}

// ─── Header matching helpers ──────────────────────────────────────────────────

function normHeader(s) {
  return s.toLowerCase().replace(/[\s_\-/&,]+/g, ' ').trim();
}

function matchesConcept(cellNorm, synonyms) {
  return synonyms.some(s => {
    const sn = normHeader(s);
    return cellNorm === sn || cellNorm.includes(sn) || sn.includes(cellNorm);
  });
}

// ─── Data-row helpers ─────────────────────────────────────────────────────────

function cellStr(row, idx) {
  if (idx === -1 || idx >= row.length) return '';
  const v = row[idx];
  if (v instanceof Date) return normalizeDate(v);
  return String(v ?? '').trim();
}

// Reject rows that repeat the header (common in multi-page Excel exports)
function looksLikeHeaderRow(row) {
  const cells = row.map(c => normHeader(String(c ?? '')));
  let hits = 0;
  for (const c of cells) {
    if (matchesConcept(c, CONCEPTS.batch))  hits++;
    if (matchesConcept(c, CONCEPTS.course)) hits++;
    if (matchesConcept(c, CONCEPTS.slot))   hits++;
  }
  return hits >= 2;
}

// ─── Date normalisation ───────────────────────────────────────────────────────
//
// Accepts:
//   JS Date object (xlsx cellDates:true)
//   Excel serial "45899"
//   DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY
//   "9-Mar-2026", "09 March 2026", "March 9 2026"
//   Combined strings like "09-03-2026 ,Monday" (day-name stripped first)
//
// Returns: "DD-MM-YYYY" string, or the original string if unparseable.
//
function normalizeDate(raw) {
  if (!raw) return '';
  if (raw instanceof Date) {
    return fmtDate(raw.getUTCDate(), raw.getUTCMonth() + 1, raw.getUTCFullYear());
  }

  const s = String(raw).trim();
  if (!s) return '';

  // Excel serial
  if (/^\d{5}$/.test(s)) return excelSerialToDate(Number(s));

  // Strip any embedded day-name so it doesn't confuse the date patterns below
  let datePart = s;
  for (const dn of DAY_NAMES) {
    const re = new RegExp(`\\b${dn}\\b`, 'i');
    if (re.test(datePart)) {
      datePart = datePart.replace(re, '').replace(/[,;\s]+/g, ' ').trim();
      break;
    }
  }

  let m;

  // YYYY-MM-DD or YYYY/MM/DD
  m = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return fmtDate(+m[3], +m[2], +m[1]);

  // DD-MM-YYYY or DD/MM/YYYY
  m = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const [, a, b, yyyy] = m;
    // If first part > 12, it must be day
    if (+a > 12) return fmtDate(+a, +b, +yyyy);
    // If second part > 12, it must be day → British/US flip
    if (+b > 12) return fmtDate(+b, +a, +yyyy);
    // Ambiguous: default DD-MM (Pakistani convention)
    return fmtDate(+a, +b, +yyyy);
  }

  // "9 March 2026" or "9 March, 2026"
  m = datePart.match(/^(\d{1,2})\s+([a-z]+)\s*,?\s*(\d{4})$/i);
  if (m) {
    const mo = MONTH_NAMES[m[2].toLowerCase()];
    if (mo) return fmtDate(+m[1], mo, +m[3]);
  }

  // "March 9 2026" or "March 9, 2026"
  m = datePart.match(/^([a-z]+)\s+(\d{1,2})\s*,?\s*(\d{4})$/i);
  if (m) {
    const mo = MONTH_NAMES[m[1].toLowerCase()];
    if (mo) return fmtDate(+m[2], mo, +m[3]);
  }

  // "9-Mar-2026" or "9/Mar/2026"
  m = datePart.match(/^(\d{1,2})[-/\s]([a-z]+)[-/\s](\d{4})$/i);
  if (m) {
    const mo = MONTH_NAMES[m[2].toLowerCase()];
    if (mo) return fmtDate(+m[1], mo, +m[3]);
  }

  // Couldn't parse — return original (better than blank)
  return s;
}

function fmtDate(dd, mm, yyyy) {
  return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${yyyy}`;
}

function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  return fmtDate(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
}

// Derive the weekday name from a normalised "DD-MM-YYYY" string
function dayFromDateStr(ddmmyyyy) {
  if (!ddmmyyyy || !/^\d{2}-\d{2}-\d{4}$/.test(ddmmyyyy)) return '';
  const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (isNaN(d)) return '';
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()];
}

function capitalizeDay(raw) {
  const lc = String(raw ?? '').trim().toLowerCase();
  const match = DAY_NAMES.find(d => lc.includes(d));
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : raw;
}

// ─── Split a combined "date + day-name" cell ──────────────────────────────────
//
// e.g. "09-03-2026 ,Monday" → { date: "09-03-2026", day: "Monday" }
//      "Monday 09-03-2026"  → { date: "09-03-2026", day: "Monday" }
//      "9-Mar-2026"         → { date: "09-03-2026", day: "Monday" }  (day derived)
//
function splitDateDay(raw) {
  if (!raw) return { date: '', day: '' };

  const s   = String(raw).trim();
  const lc  = s.toLowerCase();

  let dayName = '';
  for (const d of DAY_NAMES) {
    if (lc.includes(d)) { dayName = d.charAt(0).toUpperCase() + d.slice(1); break; }
  }

  let dateFrag = s;
  if (dayName) {
    dateFrag = s
      .replace(new RegExp(`\\b${dayName}\\b`, 'i'), '')
      .replace(/[,;\s]+/g, ' ')
      .trim();
  }

  const date         = normalizeDate(dateFrag || s);
  const resolvedDay  = dayName || dayFromDateStr(date);

  return { date, day: resolvedDay };
}

// ─── Filtering helpers ────────────────────────────────────────────────────────

export function filterByBatch(rows, batch) {
  return rows.filter((r) => r.batch === batch);
}

export function filterByCourses(rows, courseNames) {
  const set = new Set(courseNames);
  return rows.filter((r) => set.has(r.courseName));
}

// ─── Sort helper ──────────────────────────────────────────────────────────────
//
// Primary:   date  (normalised to DD-MM-YYYY → unambiguous timestamp)
// Secondary: slot  (lexicographic — "09:30" sorts before "12:15")
//
export function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const da = dateToTimestamp(a.date);
    const db = dateToTimestamp(b.date);
    if (da !== db) return da - db;
    return a.slot.localeCompare(b.slot);
  });
}

function dateToTimestamp(ddmmyyyy) {
  if (!ddmmyyyy) return 0;
  const m = ddmmyyyy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    return isNaN(d) ? 0 : d.getTime();
  }
  const d = new Date(ddmmyyyy);
  return isNaN(d) ? 0 : d.getTime();
}
