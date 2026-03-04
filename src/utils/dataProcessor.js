import * as XLSX from 'xlsx';

/**
 * Parse an uploaded Excel/CSV file and return cleaned data.
 *
 * Expected input columns (order matters):
 *   Batch | Day | Slot | Course Name | Course Code | Faculty
 *
 * Processing steps:
 *   1. Drop the Faculty column.
 *   2. Split "Day" into Date and Day (e.g. "09-03-2026 ,Monday" → date + day).
 *   3. Deduplicate rows that are identical after Faculty removal.
 *
 * Returns: { rows, batches, courses }
 *   rows   – array of { batch, date, day, slot, courseName, courseCode }
 *   batches – sorted unique batch names
 *   courses – sorted unique { courseName, courseCode } objects
 */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length < 2) {
          reject(new Error('The file appears to be empty or has no data rows.'));
          return;
        }

        // ---------- Find the real header row ----------
        // The sheet may have title rows above the actual column headers
        // (e.g. "NUST School of..." / "UG Datesheet for MSE - Spring 2026").
        // Scan until we find a row that contains "batch" and "day".
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(json.length, 10); i++) {
          const row = json[i];
          if (!Array.isArray(row)) continue;
          const cells = row.map((c) => String(c ?? '').trim().toLowerCase());
          if (cells.some((c) => c === 'batch') && cells.some((c) => c.includes('day') || c.includes('date'))) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) {
          reject(
            new Error(
              'Could not locate the header row. Make sure your file has columns: Batch, Day, Slot, Course Name, Course Code.'
            )
          );
          return;
        }

        // ---------- Normalise header row ----------
        const rawHeaders = json[headerRowIdx].map((h) => String(h ?? '').trim().toLowerCase());

        // Build an index map so we can handle slight naming variations
        const indexOf = (candidates) =>
          rawHeaders.findIndex((h) => candidates.some((c) => h.includes(c)));

        const batchIdx = indexOf(['batch']);
        const dayIdx = indexOf(['day', 'date']);
        const slotIdx = indexOf(['slot', 'time']);
        const courseNameIdx = indexOf(['course name', 'coursename', 'course_name']);
        const courseCodeIdx = indexOf(['course code', 'coursecode', 'course_code']);
        // Faculty column is intentionally ignored

        if ([batchIdx, dayIdx, slotIdx, courseNameIdx, courseCodeIdx].includes(-1)) {
          reject(
            new Error(
              'Could not find all required columns. Expected: Batch, Day, Slot, Course Name, Course Code.'
            )
          );
          return;
        }

        // ---------- Parse rows (start after the header row) ----------
        const seen = new Set();
        const rows = [];
        const batchSet = new Set();
        const courseMap = new Map(); // courseCode → courseName
        const courseNameSet = new Set(); // unique course names for selector

        for (let i = headerRowIdx + 1; i < json.length; i++) {
          const r = json[i];
          if (!r || r.length === 0) continue;

          const batch = String(r[batchIdx] ?? '').trim();
          const rawDay = String(r[dayIdx] ?? '').trim();
          const slot = String(r[slotIdx] ?? '').trim();
          const courseName = String(r[courseNameIdx] ?? '').trim();
          const courseCode = String(r[courseCodeIdx] ?? '').trim();

          if (!batch && !courseName) continue; // skip truly empty rows

          // --- Split Day into Date & Day ---
          const { date, day } = splitDateDay(rawDay);

          // --- Dedup key (everything except Faculty) ---
          const key = [batch, date, day, slot, courseName, courseCode].join('||');
          if (seen.has(key)) continue;
          seen.add(key);

          rows.push({ batch, date, day, slot, courseName, courseCode });
          if (batch) batchSet.add(batch);
          if (courseCode) courseMap.set(courseCode, courseName);
          if (courseName) courseNameSet.add(courseName);
        }

        const batches = [...batchSet].sort();
        const courses = [...courseNameSet].sort();

        resolve({ rows, batches, courses });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Split a combined date/day string into separate date and day parts.
 *
 * Handles formats like:
 *   "09-03-2026 ,Monday"
 *   "09-03-2026, Monday"
 *   "Monday 09-03-2026"
 *   "2026-03-09 Monday"
 *   Or just a plain date / day string.
 */
function splitDateDay(raw) {
  if (!raw) return { date: '', day: '' };

  const dayNames = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];

  // Try to find a day‑name inside the string
  const lc = raw.toLowerCase();
  let dayName = '';
  for (const d of dayNames) {
    if (lc.includes(d)) {
      dayName = d.charAt(0).toUpperCase() + d.slice(1);
      break;
    }
  }

  // Remove the day name (case-insensitive) + surrounding punctuation to isolate the date
  let datePart = raw;
  if (dayName) {
    datePart = raw.replace(new RegExp(dayName, 'i'), '').replace(/[,\s]+/g, ' ').trim();
  }

  // If datePart looks like an Excel serial number, convert it
  if (/^\d{5}$/.test(datePart)) {
    datePart = excelSerialToDate(Number(datePart));
  }

  return { date: datePart || raw, day: dayName };
}

/**
 * Convert an Excel date serial number to DD-MM-YYYY string.
 */
function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/* ---- Filtering helpers ---- */

export function filterByBatch(rows, batch) {
  return rows.filter((r) => r.batch === batch);
}

export function filterByCourses(rows, courseNames) {
  const set = new Set(courseNames);
  return rows.filter((r) => set.has(r.courseName));
}

/* ---- Sort helper — sort by date then slot ---- */
export function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const da = parseDate(a.date);
    const db = parseDate(b.date);
    if (da - db !== 0) return da - db;
    return a.slot.localeCompare(b.slot);
  });
}

function parseDate(str) {
  // Try DD-MM-YYYY
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(d)) return d.getTime();
  }
  const d = new Date(str);
  return isNaN(d) ? 0 : d.getTime();
}
