/**
 * data-sensor.js
 * ──────────────────────────────────────────────────────────────────────
 * Handles: mock data generation, search, sensor/type filter,
 *          sort (newest/oldest by real timestamp), pagination (10/page).
 * No external libraries — pure vanilla JS.
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   1. MOCK DATA GENERATION
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Generates ~100 sensor records spread over the last ~3 minutes.
 * Each "tick" (every 2 s) produces 3 rows: Temp, Hum (DHT11) and Lux (LDR).
 * Total: 34 ticks × 3 = 102 records.
 */
function generateMockData() {
  const records = [];
  const now     = new Date('2026-01-01T12:00:09');
  const TICKS   = 34;       // 34 × 2 s ≈ 68 s of history
  const STEP_MS = 2000;

  for (let t = 0; t < TICKS; t++) {
    const ts = new Date(now.getTime() - t * STEP_MS);

    // DHT11 — Temp
    records.push({
      id:        1,
      sensor:    'DHT11',
      type:      'Temp',
      rawValue:  Math.round(Math.random() * 15 + 28),   // 28–43 °C
      unit:      '°C',
      timestamp: ts.getTime(),
    });

    // DHT11 — Hum
    records.push({
      id:        1,
      sensor:    'DHT11',
      type:      'Hum',
      rawValue:  Math.round(Math.random() * 30 + 40),   // 40–70 %
      unit:      '%',
      timestamp: ts.getTime(),
    });

    // LDR — Lux
    records.push({
      id:        2,
      sensor:    'LDR',
      type:      'Lux',
      rawValue:  Math.round(Math.random() * 400 + 600), // 600–1000 Lux
      unit:      '',
      timestamp: ts.getTime(),
    });
  }

  return records;
}

/* ═══════════════════════════════════════════════════════════════════════
   2. DATE FORMATTER
   ═══════════════════════════════════════════════════════════════════════ */

/** Format a Unix-ms timestamp as DD-MM-YYYY HH:mm:ss */
function formatTime(ts) {
  const d   = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3. STATE
   ═══════════════════════════════════════════════════════════════════════ */

const ALL_DATA   = generateMockData();   // immutable source
const PAGE_SIZE  = 10;

const state = {
  query:       '',
  sensorFilter:'ALL',
  typeFilter:  'ALL',
  sort:        'newest',    // 'newest' | 'oldest'
  currentPage: 1,
};

/* ═══════════════════════════════════════════════════════════════════════
   4. FILTER + SORT PIPELINE
   ═══════════════════════════════════════════════════════════════════════ */

function getFilteredData() {
  const q = state.query.toLowerCase().trim();

  let result = ALL_DATA.filter(row => {
    // Search: by ID (string match) or sensor name
    const matchSearch =
      !q ||
      String(row.id).includes(q) ||
      row.sensor.toLowerCase().includes(q);

    // Sensor filter
    const matchSensor =
      state.sensorFilter === 'ALL' || row.sensor === state.sensorFilter;

    // Type filter
    const matchType =
      state.typeFilter === 'ALL' || row.type === state.typeFilter;

    return matchSearch && matchSensor && matchType;
  });

  // Sort by real timestamp
  result.sort((a, b) =>
    state.sort === 'newest'
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp
  );

  return result;
}

/* ═══════════════════════════════════════════════════════════════════════
   5. RENDER TABLE
   ═══════════════════════════════════════════════════════════════════════ */

const tbody = document.getElementById('ds-tbody');

function renderTable(pageData) {
  if (pageData.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="5">Không có dữ liệu phù hợp</td></tr>';
    return;
  }

  tbody.innerHTML = pageData.map(row => {
    const typeClass = { Temp: 'type-temp', Hum: 'type-hum', Lux: 'type-lux' }[row.type] || '';
    const valClass  = { Temp: 'val-temp',  Hum: 'val-hum',  Lux: 'val-lux'  }[row.type] || '';
    const display   = `${row.rawValue}${row.unit}`;

    return `
      <tr>
        <td>${row.id}</td>
        <td>${row.sensor}</td>
        <td class="${typeClass}">${row.type}</td>
        <td class="${valClass}">${display}</td>
        <td class="col-time">${formatTime(row.timestamp)}</td>
      </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════════
   6. RENDER PAGINATION
   ═══════════════════════════════════════════════════════════════════════ */

const paginationEl = document.getElementById('ds-pagination');

/**
 * Builds the page-number array with "..." ellipsis.
 * Always shows: first page, last page, currentPage ±1.
 */
function buildPageArray(total, current) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const arr   = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

  // Insert '...' between non-consecutive numbers
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && arr[i] - arr[i - 1] > 1) result.push('...');
    result.push(arr[i]);
  }
  return result;
}

function renderPagination(totalRecords) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const cur        = state.currentPage;
  const pageArr    = buildPageArray(totalPages, cur);

  paginationEl.innerHTML = '';

  // Previous
  const prev = makeBtn('&lt;', cur === 1, () => goTo(cur - 1));
  paginationEl.appendChild(prev);

  // Page buttons
  pageArr.forEach(p => {
    if (p === '...') {
      const dots = document.createElement('button');
      dots.className   = 'pg-btn pg-dots';
      dots.textContent = '...';
      dots.disabled    = true;
      paginationEl.appendChild(dots);
    } else {
      const btn = makeBtn(p, false, () => goTo(p));
      if (p === cur) btn.classList.add('active');
      paginationEl.appendChild(btn);
    }
  });

  // Next
  const next = makeBtn('&gt;', cur === totalPages, () => goTo(cur + 1));
  paginationEl.appendChild(next);
}

function makeBtn(labelHTML, disabled, onClick) {
  const btn       = document.createElement('button');
  btn.className   = 'pg-btn';
  btn.innerHTML   = labelHTML;
  btn.disabled    = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

function goTo(page) {
  state.currentPage = page;
  render();
}

/* ═══════════════════════════════════════════════════════════════════════
   7. MAIN RENDER (orchestrator)
   ═══════════════════════════════════════════════════════════════════════ */

function render() {
  const filtered   = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Guard against currentPage > totalPages after filter change
  if (state.currentPage > totalPages) state.currentPage = 1;

  const start    = (state.currentPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  renderTable(pageData);
  renderPagination(filtered.length);
}

/* ═══════════════════════════════════════════════════════════════════════
   8. EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════ */

document.getElementById('ds-search').addEventListener('input', e => {
  state.query       = e.target.value;
  state.currentPage = 1;
  render();
});

document.getElementById('ds-sensor').addEventListener('change', e => {
  state.sensorFilter = e.target.value;
  state.currentPage  = 1;
  render();
});

document.getElementById('ds-type').addEventListener('change', e => {
  state.typeFilter  = e.target.value;
  state.currentPage = 1;
  render();
});

document.getElementById('ds-sort').addEventListener('change', e => {
  state.sort        = e.target.value;
  state.currentPage = 1;
  render();
});

/* ═══════════════════════════════════════════════════════════════════════
   9. BOOTSTRAP
   ═══════════════════════════════════════════════════════════════════════ */

render();
