/**
 * history-action.js
 * ──────────────────────────────────────────────────────────────────────
 * Manages the HISTORY ACTION page:
 *   - Mock data generation (~100 records)
 *   - Search by Device ID or Device Name
 *   - Filter by Device, Action, Status
 *   - Sort by newest / oldest (real timestamp comparison)
 *   - Pagination: 10 rows/page with ellipsis
 *
 * No external libraries used.
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   1. CONSTANTS & MOCK DATA
   ═══════════════════════════════════════════════════════════════════════ */

const DEVICES = [
  { id: 1, name: 'Quạt' },
  { id: 2, name: 'Đèn' },
  { id: 3, name: 'Điều hòa' },
];

const ACTIONS  = ['ON', 'OFF'];
const STATUSES = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'WAITING']; // weighted toward SUCCESS

/**
 * Generates ~100 action history records spread over ~3 minutes of history.
 * Records are created newest-first, then the array is shuffled slightly
 * so timestamps aren't perfectly sequential per device.
 */
function generateMockData() {
  const records = [];
  // Base time: 2026-01-01 12:00:10
  const baseTime = new Date('2026-01-01T12:00:10').getTime();
  const TOTAL    = 100;
  const STEP_MS  = 2000; // one event every ~2 s

  for (let i = 0; i < TOTAL; i++) {
    const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    // Spread backwards in time from the base
    const ts     = baseTime - i * STEP_MS - Math.round(Math.random() * 500);

    records.push({
      id:         i + 1,
      deviceId:   device.id,
      deviceName: device.name,
      action,
      status,
      createdAt:  ts,
    });
  }

  return records;
}

const ALL_DATA  = generateMockData();
const PAGE_SIZE = 10;

/* ═══════════════════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════════════════ */

const state = {
  query:        '',
  deviceFilter: 'ALL',
  actionFilter: 'ALL',
  statusFilter: 'ALL',
  sort:         'newest',
  currentPage:  1,
};

/* ═══════════════════════════════════════════════════════════════════════
   3. DATE FORMATTER
   ═══════════════════════════════════════════════════════════════════════ */

/** Format Unix-ms timestamp → DD-MM-YYYY HH:mm:ss */
function formatTime(ts) {
  const d   = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. FILTER + SORT PIPELINE
   ═══════════════════════════════════════════════════════════════════════ */

function getFilteredData() {
  const q = state.query.toLowerCase().trim();

  const result = ALL_DATA.filter(row => {
    // Search: Device ID (string) or Device Name
    const matchSearch =
      !q ||
      String(row.deviceId).includes(q) ||
      row.deviceName.toLowerCase().includes(q);

    // Device filter
    const matchDevice =
      state.deviceFilter === 'ALL' || row.deviceName === state.deviceFilter;

    // Action filter
    const matchAction =
      state.actionFilter === 'ALL' || row.action === state.actionFilter;

    // Status filter (WAITING in data vs dropdown value WAITING)
    const matchStatus =
      state.statusFilter === 'ALL' ||
      row.status === state.statusFilter;

    return matchSearch && matchDevice && matchAction && matchStatus;
  });

  // Sort by real timestamp
  result.sort((a, b) =>
    state.sort === 'newest'
      ? b.createdAt - a.createdAt
      : a.createdAt - b.createdAt
  );

  return result;
}

/* ═══════════════════════════════════════════════════════════════════════
   5. RENDER TABLE
   ═══════════════════════════════════════════════════════════════════════ */

const tbody = document.getElementById('ha-tbody');

/** Map status string → CSS class */
function statusClass(s) {
  if (s === 'SUCCESS') return 'status-success';
  if (s === 'FAILED')  return 'status-failed';
  return 'status-waiting'; // WAITING
}

/** Map status string → display label */
function statusLabel(s) {
  return s === 'WAITING' ? 'WAITING...' : s;
}

function renderTable(pageData) {
  if (pageData.length === 0) {
    tbody.innerHTML =
      '<tr class="ha-empty"><td colspan="5">Không tìm thấy dữ liệu</td></tr>';
    return;
  }

  tbody.innerHTML = pageData.map(row => `
    <tr>
      <td class="ha-col-id">${row.deviceId}</td>
      <td class="ha-col-name">${row.deviceName}</td>
      <td class="ha-col-action ${row.action === 'ON' ? 'action-on' : 'action-off'}">${row.action}</td>
      <td class="ha-col-status ${statusClass(row.status)}">${statusLabel(row.status)}</td>
      <td class="ha-col-time">${formatTime(row.createdAt)}</td>
    </tr>`
  ).join('');
}

/* ═══════════════════════════════════════════════════════════════════════
   6. RENDER PAGINATION
   ═══════════════════════════════════════════════════════════════════════ */

const paginationEl = document.getElementById('ha-pagination');

/**
 * Builds a page-number array inserting '...' between non-consecutive numbers.
 * Always shows: first page, last page, currentPage ±1.
 */
function buildPageArray(total, current) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const set = new Set([1, total, current, current - 1, current + 1]);
  const arr = [...set].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && arr[i] - arr[i - 1] > 1) result.push('...');
    result.push(arr[i]);
  }
  return result;
}

function makeBtn(innerHTML, disabled, onClick, extraClass = '') {
  const btn     = document.createElement('button');
  btn.className = `pg-btn${extraClass ? ' ' + extraClass : ''}`;
  btn.innerHTML = innerHTML;
  btn.disabled  = disabled;
  if (!disabled && onClick) btn.addEventListener('click', onClick);
  return btn;
}

function renderPagination(totalRecords) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const cur        = state.currentPage;
  paginationEl.innerHTML = '';

  // Previous
  paginationEl.appendChild(
    makeBtn('&lt;', cur === 1, () => goTo(cur - 1))
  );

  // Page numbers with ellipsis
  buildPageArray(totalPages, cur).forEach(p => {
    if (p === '...') {
      paginationEl.appendChild(makeBtn('...', true, null, 'pg-dots'));
    } else {
      const btn = makeBtn(p, false, () => goTo(p));
      if (p === cur) btn.classList.add('active');
      paginationEl.appendChild(btn);
    }
  });

  // Next
  paginationEl.appendChild(
    makeBtn('&gt;', cur === totalPages, () => goTo(cur + 1))
  );
}

function goTo(page) {
  state.currentPage = page;
  render();
}

/* ═══════════════════════════════════════════════════════════════════════
   7. MAIN RENDER ORCHESTRATOR
   ═══════════════════════════════════════════════════════════════════════ */

function render() {
  const filtered   = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Guard: reset to page 1 if current page exceeds new total
  if (state.currentPage > totalPages) state.currentPage = 1;

  const start    = (state.currentPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  renderTable(pageData);
  renderPagination(filtered.length);
}

/* ═══════════════════════════════════════════════════════════════════════
   8. EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════ */

/** Helper: attach change listener, reset to page 1, re-render */
function bindFilter(id, stateKey) {
  document.getElementById(id).addEventListener('change', e => {
    state[stateKey]  = e.target.value;
    state.currentPage = 1;
    render();
  });
}

document.getElementById('ha-search').addEventListener('input', e => {
  state.query       = e.target.value;
  state.currentPage = 1;
  render();
});

bindFilter('ha-device', 'deviceFilter');
bindFilter('ha-action', 'actionFilter');
bindFilter('ha-status', 'statusFilter');
bindFilter('ha-sort',   'sort');

/* ═══════════════════════════════════════════════════════════════════════
   9. BOOTSTRAP
   ═══════════════════════════════════════════════════════════════════════ */

render();
