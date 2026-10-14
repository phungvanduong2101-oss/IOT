/**
 * charts.js
 * Manages Chart.js initialization and live data updates for all sensor charts.
 */

'use strict';

/* ── Shared chart defaults ───────────────────────────────────────────── */
const CHART_DEFAULTS = {
  maxPoints: 10,
  tension:   0.4,
  borderWidth: 2,
  fill: false,
  pointRadius: 0,
  pointHoverRadius: 4,
};

/* ── Helper: format current time as HH:mm:ss ─────────────────────────── */
function getTimeLabel() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/* ── Helper: build dashed grid line plugin options ───────────────────── */
function gridOptions() {
  return {
    color: '#d0d0d0',
    lineWidth: 1,
    borderDash: [4, 4],
  };
}

/* ── Helper: create initial dummy history ────────────────────────────── */
function generateInitialData(min, max, count = 10) {
  return Array.from({ length: count }, () =>
    parseFloat((Math.random() * (max - min) + min).toFixed(1))
  );
}

function generateInitialLabels(count = 10) {
  const labels = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 2000);
    const pad = n => String(n).padStart(2, '0');
    labels.push(`${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`);
  }
  return labels;
}

/* ── Push a new point; keep only the last N ──────────────────────────── */
function pushDataPoint(chart, label, value) {
  const { data } = chart;
  data.labels.push(label);
  data.datasets[0].data.push(value);
  if (data.labels.length > CHART_DEFAULTS.maxPoints) {
    data.labels.shift();
    data.datasets[0].data.shift();
  }
  chart.update('none'); // skip animation for smooth live feel
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Temperature Chart                                                     */
/* ────────────────────────────────────────────────────────────────────── */
function createTempChart() {
  const ctx = document.getElementById('tempChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels:   generateInitialLabels(),
      datasets: [{
        label:       'Nhiệt độ (°C)',
        data:        generateInitialData(15, 40),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244,67,54,0.08)',
        fill:        true,
        tension:     CHART_DEFAULTS.tension,
        borderWidth: CHART_DEFAULTS.borderWidth,
        pointRadius: CHART_DEFAULTS.pointRadius,
        pointHoverRadius: CHART_DEFAULTS.pointHoverRadius,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          grid:  gridOptions(),
        },
        y: {
          min: 5,
          max: 50,
          ticks: { stepSize: 5, font: { size: 10 }, color: '#888' },
          grid:  gridOptions(),
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(1)} °C`,
          },
        },
      },
    },
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Humidity Chart                                                        */
/* ────────────────────────────────────────────────────────────────────── */
function createHumidChart() {
  const ctx = document.getElementById('humidChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels:   generateInitialLabels(),
      datasets: [{
        label:       'Độ ẩm (%)',
        data:        generateInitialData(30, 80),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33,150,243,0.08)',
        fill:        true,
        tension:     CHART_DEFAULTS.tension,
        borderWidth: CHART_DEFAULTS.borderWidth,
        pointRadius: CHART_DEFAULTS.pointRadius,
        pointHoverRadius: CHART_DEFAULTS.pointHoverRadius,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          grid:  gridOptions(),
        },
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 10, font: { size: 10 }, color: '#888' },
          grid:  gridOptions(),
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(1)} %`,
          },
        },
      },
    },
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Light Chart                                                           */
/* ────────────────────────────────────────────────────────────────────── */
function createLightChart() {
  const ctx = document.getElementById('lightChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels:   generateInitialLabels(),
      datasets: [{
        label:       'Ánh sáng (Lux)',
        data:        generateInitialData(400, 900),
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255,193,7,0.08)',
        fill:        true,
        tension:     CHART_DEFAULTS.tension,
        borderWidth: CHART_DEFAULTS.borderWidth,
        pointRadius: CHART_DEFAULTS.pointRadius,
        pointHoverRadius: CHART_DEFAULTS.pointHoverRadius,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          grid:  gridOptions(),
        },
        y: {
          min: 0,
          max: 1000,
          ticks: { stepSize: 100, font: { size: 10 }, color: '#888' },
          grid:  gridOptions(),
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(0)} Lux`,
          },
        },
      },
    },
  });
}

/* ── Public API ──────────────────────────────────────────────────────── */
const ChartsModule = (() => {
  let tempChart, humidChart, lightChart;

  function init() {
    tempChart  = createTempChart();
    humidChart = createHumidChart();
    lightChart = createLightChart();
  }

  /**
   * Add a new data point to all charts and return the latest values.
   * @returns {{ temp: number, humid: number, light: number }}
   */
  function update() {
    const label = getTimeLabel();

    const temp  = parseFloat((Math.random() * 25 + 15).toFixed(1));   // 15–40 °C
    const humid = parseFloat((Math.random() * 50 + 30).toFixed(1));   // 30–80 %
    const light = Math.round(Math.random() * 500 + 400);              // 400–900 Lux

    pushDataPoint(tempChart,  label, temp);
    pushDataPoint(humidChart, label, humid);
    pushDataPoint(lightChart, label, light);

    return { temp, humid, light };
  }

  return { init, update };
})();
