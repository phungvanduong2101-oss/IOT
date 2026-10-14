/**
 * devices.js
 * Manages device toggle switches and their visual state.
 */

'use strict';

const DevicesModule = (() => {

  /* ── Device registry ──────────────────────────────────────────────── */
  const DEVICES = [
    {
      toggleId: 'fan-toggle',
      cardId:   'device-fan',
      name:     'Quạt',
      onColor:  '#f44336',
    },
    {
      toggleId: 'ac-toggle',
      cardId:   'device-ac',
      name:     'Điều hòa',
      onColor:  '#2196F3',
    },
    {
      toggleId: 'light-toggle',
      cardId:   'device-light',
      name:     'Đèn',
      onColor:  '#FFC107',
    },
  ];

  /* ── Apply visual state based on checkbox ─────────────────────────── */
  function applyState(device, isOn) {
    const card = document.getElementById(device.cardId);
    if (!card) return;
    if (isOn) {
      card.classList.remove('off');
    } else {
      card.classList.add('off');
    }
  }

  /* ── Bind toggle events ───────────────────────────────────────────── */
  function init() {
    DEVICES.forEach(device => {
      const toggle = document.getElementById(device.toggleId);
      if (!toggle) return;

      // Set initial visual state
      applyState(device, toggle.checked);

      toggle.addEventListener('change', () => {
        applyState(device, toggle.checked);
        const status = toggle.checked ? 'BẬT' : 'TẮT';
        console.log(`[DeviceControl] ${device.name} → ${status}`);
      });
    });
  }

  /* ── Public: get current state of all devices ─────────────────────── */
  function getStates() {
    return DEVICES.reduce((acc, device) => {
      const toggle = document.getElementById(device.toggleId);
      acc[device.toggleId] = toggle ? toggle.checked : false;
      return acc;
    }, {});
  }

  return { init, getStates };
})();
