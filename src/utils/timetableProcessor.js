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

        // Each sheet may contain multiple stacked section grids.
        // We flatten them all into a single timetables map keyed by section title.
        const timetables = {};
        const batches    = [];
        const errors     = [];

        for (const sheetName of wb.SheetNames) {
          try {
            const sections = parseSections(wb.Sheets[sheetName], sheetName);
            for (const section of sections) {
              // Deduplicate keys in case two sheets share a title
              let key = section.title;
              let n = 2;
              while (timetables[key]) key = `${section.title} (${n++})`;
              timetables[key] = section;
              batches.push(key);
            }
          } catch (err) {
            errors.push(`  • ${sheetName}: ${err.message}`);
          }
        }

        if (!batches.length) {
          reject(new Error(
            'No timetable data could be extracted from this file.' +
            (errors.length ? '\n\nSheet details:\n' + errors.join('\n') : '')
          ));
          return;
        }

        resolve({ batches, timetables });
      } catch (err) {
        reject(new Error(`Could not read file: ${err.message}`));
      }
    };

    reader.onerror = () =>
      reject(new Error('Failed to read the file. Is it corrupted or still open in Excel?'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Sheet → multiple sections ────────────────────────────────────────────────
//
// A single sheet may contain several stacked timetable grids, one per section
// (e.g. 13A, 13B, 13C …).  Each grid is preceded by a title row and a
// day-header row (Monday Tuesday … ).  We detect every day-header row and
// parse the block of rows beneath it as an independent section.
//
// At the very bottom of the sheet there is an optional shared legend table
// (Code / Subject / Dept / Instructor …) that applies to all sections.
//

function parseSections(sheet, sheetName) {
  if (!sheet['!ref']) throw new Error('Sheet is empty.');

  const range  = XLSX.utils.decode_range(sheet['!ref']);
  const merges = sheet['!merges'] || [];

  // ── 1. Build flat 2D grid with merged-cell values propagated ─────────────
  const grid = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    grid[r] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      grid[r][c] = cell ? cleanCell(cell) : '';
    }
  }

  // mergeNonOrigin: cells that are non-top-left of a merged region.
  // We skip these when reading time slots / course text to avoid duplicates.
  const mergeNonOrigin = new Set();
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

  // ── 2. Find all day-header rows ───────────────────────────────────────────
  //    A day-header row has ≥ 3 cells whose text exactly matches a day name.
  const dayHeaderRows = []; // [{ rowIdx, dayColumns, timeColIdx }]

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = grid[r] || [];
    const hits = row.filter((cell) => {
      const lc = String(cell ?? '').toLowerCase().trim();
      return DAY_NAMES.some((d) => lc === d);
    });
    if (hits.length >= 3) {
      let timeColIdx = range.s.c;
      const dayColumns = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const lc = String(row[c] ?? '').toLowerCase().trim();
        if (lc.includes('time') || lc === 'time / days' || lc === 'time/days') {
          timeColIdx = c;
        }
        const dayName = DAY_NAMES.find((d) => lc === d);
        if (dayName) dayColumns.push({ day: cap(dayName), colIdx: c });
      }
      if (dayColumns.length >= 3) {
        dayHeaderRows.push({ rowIdx: r, dayColumns, timeColIdx });
      }
    }
  }

  if (!dayHeaderRows.length) {
    throw new Error('No day-header row (Monday, Tuesday …) found in this sheet.');
  }

  // ── 3. Find shared legend start row ──────────────────────────────────────
  //    The legend is a table at the very bottom (after all section grids).
  //    It starts with a header row whose first non-empty cell is "Code" /
  //    "Course Code" etc.  We parse it once and share it across sections.
  let legendStartRow  = range.e.r + 1; // default: no legend
  let legendHeaders   = null;
  const sharedLegend  = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row  = grid[r] || [];
    const first = String(row[range.s.c] ?? '').trim().toLowerCase();
    if (first === 'code' || first.includes('course code')) {
      legendStartRow = r;
      legendHeaders  = row.map((c) => String(c ?? '').trim()).filter(Boolean);
      // Parse legend data rows
      for (let lr = r + 1; lr <= range.e.r; lr++) {
        const lrow = grid[lr] || [];
        const lFirst = String(lrow[range.s.c] ?? '').trim();
        if (!lFirst) continue;
        const entry = {};
        let hi = 0;
        for (let c = range.s.c; c <= range.e.c; c++) {
          const val = String(lrow[c] ?? '').trim();
          if (!val) { hi++; continue; }
          const header = legendHeaders?.[hi] ?? `col${c}`;
          entry[header] = val;
          hi++;
        }
        if (Object.keys(entry).length) sharedLegend.push(entry);
      }
      break;
    }
  }

  // ── 4. Parse each section block ───────────────────────────────────────────
  const sections = [];

  for (let si = 0; si < dayHeaderRows.length; si++) {
    const { rowIdx: dayHeaderRow, dayColumns, timeColIdx } = dayHeaderRows[si];

    // Section title: work backwards from dayHeaderRow to find the nearest
    // non-empty, non-day-header row with meaningful text (>10 chars).
    let title = sheetName;
    const prevDayHeader = si > 0 ? dayHeaderRows[si - 1].rowIdx : range.s.r - 1;
    for (let tr = dayHeaderRow - 1; tr > prevDayHeader; tr--) {
      const txt = (grid[tr] || [])
        .map((c) => String(c ?? '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      if (txt.length > 10) { title = txt; break; }
    }

    // Block of rows to process: from dayHeaderRow+1 up to (but not including)
    // the next day-header row, or the legend start, whichever comes first.
    const blockEnd = si < dayHeaderRows.length - 1
      ? Math.min(dayHeaderRows[si + 1].rowIdx - 1, legendStartRow - 1)
      : legendStartRow - 1;

    const timeSlots   = [];
    const cells       = {};
    let   currentSlot = null;
    let   lunchAfter  = null;

    for (let r = dayHeaderRow + 1; r <= blockEnd; r++) {
      const row      = grid[r] || [];
      const timeCell = String(row[timeColIdx] ?? '').trim();
      const timeLc   = timeCell.toLowerCase();

      // Skip fully-empty rows
      if (!timeCell && row.every((c) => !String(c ?? '').trim())) continue;

      // Lunch / Prayer Break separator
      if (timeLc.includes('lunch') || timeLc.includes('prayer') || timeLc.includes('namaz')) {
        lunchAfter = currentSlot;
        continue;
      }

      // Time slot detection
      if (TIME_SLOT_RE.test(timeCell) && !mergeNonOrigin.has(`${r},${timeColIdx}`)) {
        currentSlot = timeCell;
        if (!timeSlots.includes(currentSlot)) {
          timeSlots.push(currentSlot);
          cells[currentSlot] = {};
          for (const { day } of dayColumns) cells[currentSlot][day] = [];
        }
      }

      if (!currentSlot) continue;

      // Collect course text for each day column
      for (const { day, colIdx } of dayColumns) {
        if (mergeNonOrigin.has(`${r},${colIdx}`)) continue;
        const raw = String(row[colIdx] ?? '').trim();
        if (!raw) continue;
        const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (!cells[currentSlot][day].includes(line)) {
            cells[currentSlot][day].push(line);
          }
        }
      }
    }

    if (!timeSlots.length) continue; // empty block — skip

    sections.push({
      title,
      days: dayColumns.map((d) => d.day),
      timeSlots,
      cells,
      lunchAfter,
      legend: sharedLegend,
    });
  }

  if (!sections.length) {
    throw new Error('No time slots found in any section (expected format: 0800-0950).');
  }

  return sections;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanCell(cell) {
  if (cell.v === undefined && cell.h) return String(cell.h).replace(/<[^>]*>/g, '').trim();
  if (cell.v instanceof Date) return '';
  return String(cell.v ?? '').trim();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
