import * as XLSX from 'xlsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Matches "0800-0950", "08:00-09:50", "800-950", "1400–1550" etc.
const TIME_SLOT_RE = /^\d{3,4}\s*[-–]\s*\d{3,4}$|^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}/;

// ─── Public API ───────────────────────────────────────────────────────────────
//
// Returns:
//   {
//     sheets:     string[]                          — ordered sheet names
//     sections:   { [sheet]: string[] }             — section titles per sheet
//     timetables: { [sheet]: { [section]: data } }  — parsed grids
//   }
//
// Each "data" object:
//   {
//     title:          string
//     days:           string[]                  — e.g. ['Monday','Tuesday',…]
//     slots:          SlotEntry[]
//     legend:         object[]
//   }
//
// SlotEntry:
//   {
//     time:       string,
//     lunchAfter: boolean,                      — render a Lunch Break row AFTER this slot
//     rows:       Array<{ [day]: string }>       — one entry per physical Excel row
//   }
//
// Each physical Excel row in a time-slot block becomes exactly one entry in
// `rows`.  Day cells that are empty contain ''.  The TimetableGrid renders one
// <tr> per entry, with the time cell having rowspan = rows.length.
//

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

        const sheets     = [];
        const sections   = {};   // { sheetName: [sectionTitle, …] }
        const timetables = {};   // { sheetName: { sectionTitle: data } }
        const errors     = [];

        for (const sheetName of wb.SheetNames) {
          try {
            const parsed = parseSheet(wb.Sheets[sheetName], sheetName);
            if (!parsed.length) continue;

            sheets.push(sheetName);
            sections[sheetName]   = [];
            timetables[sheetName] = {};

            for (const sec of parsed) {
              // Deduplicate titles within the same sheet
              let key = sec.title;
              let n = 2;
              while (timetables[sheetName][key]) key = `${sec.title} (${n++})`;
              timetables[sheetName][key] = sec;
              sections[sheetName].push(key);
            }
          } catch (err) {
            errors.push(`  • ${sheetName}: ${err.message}`);
          }
        }

        if (!sheets.length) {
          reject(new Error(
            'No timetable data could be extracted from this file.' +
            (errors.length ? '\n\nSheet details:\n' + errors.join('\n') : '')
          ));
          return;
        }

        resolve({ sheets, sections, timetables });
      } catch (err) {
        reject(new Error(`Could not read file: ${err.message}`));
      }
    };

    reader.onerror = () =>
      reject(new Error('Failed to read the file. Is it corrupted or still open in Excel?'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Sheet → array of section objects ─────────────────────────────────────────
//
// One sheet may contain several stacked grids (one per section).
// We find every day-header row (≥3 day-name cells) and treat each as the
// start of a new section.  The bottom of the sheet may have a shared legend
// table (Code / Subject / Dept …) that is attached to every section.
//

function parseSheet(sheet, sheetName) {
  if (!sheet['!ref']) throw new Error('Sheet is empty.');

  const range  = XLSX.utils.decode_range(sheet['!ref']);
  const merges = sheet['!merges'] || [];

  // ── 1. Build flat 2D grid ──────────────────────────────────────────────────
  const grid = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    grid[r] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      grid[r][c] = cell ? cleanCell(cell) : '';
    }
  }

  // mergeOrigins: top-left cell of each merged region.
  // mergeNonOrigin: every other cell in the region.
  // We propagate the origin value into the whole region in the grid so that
  // repeated reads still see the text, but we track non-origins so we don't
  // double-count content.
  const mergeNonOrigin = new Set();  // "r,c"
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

  // ── 2. Locate all day-header rows ──────────────────────────────────────────
  const dayHeaderRows = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = grid[r] || [];
    const dayHits = row.filter((cell) => {
      const lc = String(cell ?? '').toLowerCase().trim();
      return DAY_NAMES.includes(lc);
    });
    if (dayHits.length < 3) continue;

    let timeColIdx = range.s.c;
    const dayColumns = [];

    for (let c = range.s.c; c <= range.e.c; c++) {
      const lc = String(row[c] ?? '').toLowerCase().trim();
      if (lc === 'time' || lc.includes('time') && lc.includes('day')) {
        timeColIdx = c;
        continue;
      }
      const dn = DAY_NAMES.find((d) => d === lc);
      if (dn) dayColumns.push({ day: cap(dn), colIdx: c });
    }

    if (dayColumns.length >= 3) {
      dayHeaderRows.push({ rowIdx: r, dayColumns, timeColIdx });
    }
  }

  if (!dayHeaderRows.length) {
    throw new Error('No day-header row (Monday, Tuesday …) found.');
  }

  // ── 3. Locate shared legend at bottom ─────────────────────────────────────
  let legendStartRow = range.e.r + 1;
  const sharedLegend = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const first = String(grid[r]?.[range.s.c] ?? '').trim().toLowerCase();
    if (first === 'code' || first === 'course code') {
      legendStartRow = r;
      const headers = (grid[r] || []).map((c) => String(c ?? '').trim()).filter(Boolean);
      for (let lr = r + 1; lr <= range.e.r; lr++) {
        const lrow = grid[lr] || [];
        const lFirst = String(lrow[range.s.c] ?? '').trim();
        if (!lFirst) continue;
        const entry = {};
        let hi = 0;
        for (let c = range.s.c; c <= range.e.c; c++) {
          const v = String(lrow[c] ?? '').trim();
          const h = headers[hi] ?? `col${c}`;
          entry[h] = v;
          hi++;
        }
        if (Object.keys(entry).some((k) => entry[k])) sharedLegend.push(entry);
      }
      break;
    }
  }

  // ── 4. Parse each section block ───────────────────────────────────────────
  const sections = [];

  for (let si = 0; si < dayHeaderRows.length; si++) {
    const { rowIdx: headerRow, dayColumns, timeColIdx } = dayHeaderRows[si];

    // --- Title: nearest non-empty text row above this header -----------------
    // Skip mergeNonOrigin positions to avoid repeating the value from merged cells.
    let title = sheetName;
    const prevHeader = si > 0 ? dayHeaderRows[si - 1].rowIdx : range.s.r - 1;
    for (let tr = headerRow - 1; tr > prevHeader; tr--) {
      const txt = (grid[tr] || [])
        .filter((_v, ci) => !mergeNonOrigin.has(`${tr},${ci}`))
        .map((c) => String(c ?? '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      if (txt.length > 10) { title = txt; break; }
    }

    // --- Row range for this section ------------------------------------------
    const blockEnd = si < dayHeaderRows.length - 1
      ? Math.min(dayHeaderRows[si + 1].rowIdx - 1, legendStartRow - 1)
      : legendStartRow - 1;

    // --- Walk rows and build slot→rows structure -----------------------------
    //
    // PHASE 1: Parse all rows into slots, with only a minimal inline guard
    // (skip rows where the time cell itself contains break text so it doesn't
    // contaminate a neighbouring slot).
    //
    // PHASE 2: Post-process — detect "break slots" (all non-empty day cells
    // contain break keywords) and convert them to a `lunchAfter` flag on the
    // preceding slot.  This is fully general-purpose: no hardcoded positions,
    // no fragile per-row state tracking.
    //

    const BREAK_KW = ['lunch', 'prayer', 'namaz', 'ramzan'];

    const slots = [];      // [{ time, lunchAfter, rows: [{day:string}] }]
    let currentSlot = null; // index into slots[]

    // ── Phase 1 ─────────────────────────────────────────────────────────────
    for (let r = headerRow + 1; r <= blockEnd; r++) {
      const row      = grid[r] || [];
      const timeCell = String(row[timeColIdx] ?? '').trim();
      const timeLc   = timeCell.toLowerCase();

      // Skip completely empty rows
      if (row.every((c) => !String(c ?? '').trim())) continue;

      // Inline guard: if the time cell itself is break text (horizontal merge
      // covers the time column), skip the row — it would otherwise be absorbed
      // into the preceding slot since it doesn't match TIME_SLOT_RE.
      if (!TIME_SLOT_RE.test(timeCell) && BREAK_KW.some((k) => timeLc.includes(k))) {
        continue;
      }

      // New time slot starts when the origin cell matches the time pattern
      if (TIME_SLOT_RE.test(timeCell) && !mergeNonOrigin.has(`${r},${timeColIdx}`)) {
        slots.push({ time: timeCell, lunchAfter: false, rows: [] });
        currentSlot = slots.length - 1;
      }

      if (currentSlot === null) continue;  // rows before any slot — skip

      // Build a row dict for this physical row across all day columns.
      // Only read a day cell if it is NOT a non-origin merged cell — otherwise
      // we'd be copying the same text from a vertically-merged course cell into
      // multiple rows, making duplicates.
      const rowDict = {};
      let hasContent = false;
      for (const { day, colIdx } of dayColumns) {
        let val = '';
        if (!mergeNonOrigin.has(`${r},${colIdx}`)) {
          val = String(row[colIdx] ?? '').trim();
        }
        rowDict[day] = val;
        if (val) hasContent = true;
      }

      if (hasContent) {
        slots[currentSlot].rows.push(rowDict);
      }
    }

    // ── Phase 2: detect break slots ─────────────────────────────────────────
    // A slot is a "break slot" if every non-empty day cell across ALL its rows
    // contains break-related text, and at least one cell does.
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      let hasBreakText      = false;
      let hasNonBreakContent = false;

      for (const row of slot.rows) {
        for (const { day } of dayColumns) {
          const v = (row[day] ?? '').trim();
          if (!v) continue;
          if (BREAK_KW.some((k) => v.toLowerCase().includes(k))) {
            hasBreakText = true;
          } else {
            hasNonBreakContent = true;
          }
        }
      }

      if (hasBreakText && !hasNonBreakContent) {
        // This is a break slot — mark the preceding slot and empty this one.
        if (i > 0) slots[i - 1].lunchAfter = true;
        slot.rows = [];
      }
    }

    // Drop slots with no rows
    const validSlots = slots.filter((s) => s.rows.length > 0);
    if (!validSlots.length) continue;

    sections.push({
      title,
      days: dayColumns.map((d) => d.day),
      slots: validSlots,
      legend: sharedLegend,
    });
  }

  return sections;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanCell(cell) {
  if (cell.v === undefined && cell.h) {
    // Convert <br> tags to newlines before stripping other HTML
    return String(cell.h)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  if (cell.v instanceof Date) return '';
  return String(cell.v ?? '').trim();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}