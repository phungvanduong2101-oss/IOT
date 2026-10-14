/**
 * main.js
 * Entry point: bootstraps all modules and starts the live-update loop.
 */

'use strict';

/* ── DOM references for sensor value displays ─────────────────────────── */
const tempValueEl  = document.getElementById('temp-value');
const humidValueEl = document.getElementById('humid-value');
const lightValueEl = document.getElementById('light-value');

/* ── Update the sidebar value readouts ───────────────────────────────── */
function updateValueDisplays({ temp, humid, light }) {
  if (tempValueEl)  tempValueEl.textContent  = `${temp}°C`;
  if (humidValueEl) humidValueEl.textContent = `${humid}%`;
  if (lightValueEl) lightValueEl.textContent = `${light} LX`;
}

/* ── Bootstrap ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Initialize charts (creates Chart.js instances + initial data)
  ChartsModule.init();

  // 2. Set initial value displays from the last data point of each chart
  //    We do one immediate update so the panels aren't blank.
  const firstValues = ChartsModule.update();
  updateValueDisplays(firstValues);

  // 3. Initialize device controls
  DevicesModule.init();

  // 4. Start live update loop: every 2 seconds
  setInterval(() => {
    const latestValues = ChartsModule.update();
    updateValueDisplays(latestValues);
  }, 2000);

  // 5. Navbar active link tracking
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.querySelector('a').addEventListener('click', e => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
});
