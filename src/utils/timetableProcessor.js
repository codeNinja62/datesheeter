import * as XLSX from 'xlsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOT_RE = /^\d{3,4}\s*[-–]\s*\d{3,4}$|^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}/;

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseTimetableFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });

        if (!wb.SheetNames.length) {
          reject(new Error('The file contains no sheets.'));
          return;
        }

        const timetables = {};
        const errors = [];

        for (const sheetName of wb.SheetNames) {
          try {
            timetables[sheetName] = parseSheet(wb.Sheets[sheetName], sheetName);
          } catch (err) {
            errors.push(`  • ${sheetName}: ${err.message}`);
          }
        }

        if (!Object.keys(timetables).length) {
          reject(new Error(
            'No timetable data could be extracted from this file.' +
            (errors.length ? '\n\nSheet details:\n' + errors.join('\n') : '')
          ));
          return;
        }

        resolve({ batches: Object.keys(timetables), timetables });
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

function parseSheet(sheet, sheetName) {
  if (!sheet['!ref']) throw new Error('Sheet is empty.');

  const range  = XLSX.utils.decode_range(sheet['!ref']);
  const merges = sheet['!merges'] || [];

  // ── Build a flat 2D grid, propagating top-left value into every merged cell ─
  //    This is essential because Excel merges repeat the value only at [s.r][s.c].
  const grid = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    grid[r] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      grid[r][c] = cell ? cleanCell(cell) : '';
    }
  }

  // Fill merged-cell ranges so we can track time-slot boundaries correctly.
  // For day-content columns this would double-count, so we keep a separate
  // "mergeMap" that tells us which cells are non-top-left of a merge.
  const mergeNonOrigin = new Set(); // "r,c" strings of non-origin merge cells
  for (const { s, e } of merges) {
    const val = grid[s.r]?.[s.c] ?? '';
    for (let r = s.r; r <= e.r; r++) {
      for (let c = s.c; c <= e.c; c++) {
        if (r !== s.r || c !== s.c) {
          if (!grid[r]) grid[r] = [];
          grid[r][c] = val;
          mergeNonOrigin.add(`${r},${c}`);
        }
      }
    }
  }

  // ── Probe for title text (rows 0-3 before the day-header row) ───────────────
  let title = sheetName;

  // ── Find the day-header row ──────────────────────────────────────────────────
  let dayHeaderRow = -1;
  let dayColumns   = []; // [{ day: 'Monday', colIdx }]
  let timeColIdx   = 0;

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 25); r++) {
    const row   = grid[r] || [];
    const dayHits = row.filter((cell) => {
      const lc = String(cell ?? '').toLowerCase().trim();
      return DAY_NAMES.some((d) => lc === d);
    });

    if (dayHits.length >= 3) {
      dayHeaderRow = r;
      // Collect title from the row just above (skip empty rows)
      for (let tr = r - 1; tr >= range.s.r; tr--) {
        const txt = (grid[tr] || []).map((c) => String(c ?? '').trim()).filter(Boolean).join(' ');
        if (txt.length > 10) { title = txt; break; }
      }

      for (let c = range.s.c; c <= range.e.c; c++) {
        const lc = String(row[c] ?? '').toLowerCase().trim();
        // Time/Days header?
        if (lc.includes('time') || lc === 'time / days' || lc === 'time/days') {
          timeColIdx = c;
        }
        // Day column?
        const dayName = DAY_NAMES.find((d) => lc === d);
        if (dayName) {
          dayColumns.push({ day: cap(dayName), colIdx: c });
        }
      }
      break;
    }
  }

  if (dayHeaderRow === -1 || dayColumns.length === 0) {
    throw new Error('Day header row (Monday, Tuesday …) not found.');
  }

  // ── Walk rows after the day-header row ───────────────────────────────────────
  const timeSlots    = [];                // ordered
  const cells        = {};               // cells[slot][day] = string[]
  const lunchRows    = new Set();        // row indices that are lunch breaks
  let   currentSlot  = null;
  let   lunchAfter   = null;

  // Legend vars
  let inLegend       = false;
  let legendHeaders  = null;
  const legend       = [];

  for (let r = dayHeaderRow + 1; r <= range.e.r; r++) {
    const row      = grid[r] || [];
    const timeCell = String(row[timeColIdx] ?? '').trim();
    const timeLc   = timeCell.toLowerCase();

    // ── Empty skeleton row ──────────────────────────────────────────────────
    if (!timeCell && row.every((c) => !String(c ?? '').trim())) continue;

    // ── Legend header detection ─────────────────────────────────────────────
    //    The legend starts with a row whose first meaningful cell is "Code"
    //    or matches a course-code pattern like "CS-340"
    if (!inLegend && (timeLc === 'code' || timeLc.includes('course code'))) {
      inLegend = true;
      legendHeaders = row.map((c) => String(c ?? '').trim()).filter(Boolean);
      continue;
    }

    // ── Lunch / Prayer Break ────────────────────────────────────────────────
    if (timeLc.includes('lunch') || timeLc.includes('prayer') || timeLc.includes('namaz')) {
      lunchRows.add(r);
      lunchAfter = currentSlot; // mark which slot is followed by lunch
      continue;
    }

    // ── Legend data rows ────────────────────────────────────────────────────
    if (inLegend) {
      // Any row with a code-like first cell belongs to the legend
      if (!timeCell) continue;
      const entry = {};
      let hi = 0;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const val = String(row[c] ?? '').trim();
        if (!val) continue;
        const header = legendHeaders?.[hi] ?? `col${c}`;
        if (!entry[header]) { entry[header] = val; hi++; }
        else { hi++; } // blank or already set
      }
      if (Object.keys(entry).length) legend.push(entry);
      continue;
    }

    // ── Time slot detection ─────────────────────────────────────────────────
    if (TIME_SLOT_RE.test(timeCell)) {
      // Only register the slot if this is the origin cell (not a merged repeat)
      if (!mergeNonOrigin.has(`${r},${timeColIdx}`)) {
        currentSlot = timeCell;
        if (!timeSlots.includes(currentSlot)) {
          timeSlots.push(currentSlot);
          cells[currentSlot] = {};
          for (const { day } of dayColumns) cells[currentSlot][day] = [];
        }
      }
    }

    if (!currentSlot) continue;

    // ── Collect course entries for this row ─────────────────────────────────
    for (const { day, colIdx } of dayColumns) {
      const raw = String(row[colIdx] ?? '').trim();
      if (!raw) continue;

      // Non-origin merged cells would give the same text → skip duplicates
      if (mergeNonOrigin.has(`${r},${colIdx}`)) continue;

      // Split on line breaks (in-cell newlines from Excel)
      const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (!cells[currentSlot][day].includes(line)) {
          cells[currentSlot][day].push(line);
        }
      }
    }
  }

  if (!timeSlots.length) {
    throw new Error('No time slots found (expected format: 0800-0950).');
  }

  return {
    title,
    days: dayColumns.map((d) => d.day),
    timeSlots,
    cells,
    lunchAfter,
    legend,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanCell(cell) {
  // rich-text cells (type 's') → XLSX gives .v as plain string already
  if (cell.v === undefined && cell.h) return String(cell.h).replace(/<[^>]*>/g, '').trim();
  if (cell.v instanceof Date) return '';
  return String(cell.v ?? '').trim();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
