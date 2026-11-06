import { getState, setState } from './map-state.js';
import { setDestinations, GROUPS, applyVisibility } from './map-layers.js';
import { getMap } from './map-engine.js';
import { distanceMeters, toast } from './map-utils.js';
import { logEvent } from './map-activity-log.js';

export const NEARBY_RADIUS_M = 2000;

let _circle = null;
let _selectHandler = null;

export function registerSelectHandler(fn) {
  _selectHandler = fn;
}

/** Apakah user location sudah diketahui. */
export function hasLocation() {
  return Boolean(getState('userLocation'));
}

/**
 * Masuk ke mode nearby — filter destinasi dalam 2km, tampilkan sebagai dot.
 * @returns {boolean} berhasil atau tidak
 */
export function enterNearbyMode({ silent = false } = {}) {
  const userLoc = getState('userLocation');
  const all = getState('destinations');

  if (!userLoc) {
    if (!silent) toast('Aktifkan lokasi untuk mode nearby.');
    return false;
  }
  if (!all.length) return false;

  const nearby = all.filter((d) => {
    const dist = distanceMeters(userLoc, { lat: d.lat, lng: d.lng });
    return dist <= NEARBY_RADIUS_M;
  });

  setState({ viewMode: 'nearby' });

  const handler = _selectHandler || (() => {});
  setDestinations(nearby, handler, getState('selectedId'), { simple: true });

  _drawCircle(userLoc);
  _hideTransitLayers();

  logEvent('nearby_mode', {
    description: `Mode nearby aktif (${nearby.length} destinasi dalam 2km)`,
    nearbyCount: nearby.length,
    radiusMeters: NEARBY_RADIUS_M
  });

  if (!silent) {
    toast(`${nearby.length} destinasi dalam radius 2km`);
  }
  return true;
}

/** Keluar dari nearby — semua destinasi (dot jika belum 'called'). */
export function exitNearbyMode() {
  _removeCircle();

  const all = getState('destinations');
  const handler = _selectHandler || (() => {});
  setState({ viewMode: 'all' });
  setDestinations(all, handler, getState('selectedId'));

  // Kembalikan transit layer sesuai state toggle
  for (const key of ['bst-stops', 'krl-stops', 'bst-routes']) {
    applyVisibility(key);
  }
}

/**
 * Mode fallback saat belum ada lokasi: tampilkan semua destinasi sebagai dot
 * agar peta tidak kosong, disertai prompt.
 */
export function enterIdleMode({ silent = false } = {}) {
  _removeCircle();

  const all = getState('destinations');
  const handler = _selectHandler || (() => {});
  setState({ viewMode: 'idle' });
  setDestinations(all, handler, getState('selectedId'), { simple: true });

  _hideTransitLayers();

  if (!silent) {
    toast('Aktifkan lokasi (tombol 🎯) untuk melihat destinasi dalam 2km.');
  }
}

/* ---------- helpers ---------- */

function _drawCircle(loc) {
  const map = getMap();
  if (!map) return;
  _removeCircle();
  _circle = L.circle([loc.lat, loc.lng], {
    radius: NEARBY_RADIUS_M,
    color: '#2f9cf4',
    weight: 1.5,
    fillColor: '#2f9cf4',
    fillOpacity: 0.06,
    dashArray: '6 6',
    interactive: false
  }).addTo(map);
}

function _removeCircle() {
  const map = getMap();
  if (map && _circle) {
    map.removeLayer(_circle);
    _circle = null;
  }
}

function _hideTransitLayers() {
  const map = getMap();
  if (!map) return;
  for (const key of ['bst-stops', 'krl-stops', 'bst-routes']) {
    const g = GROUPS[key];
    if (g && map.hasLayer(g)) map.removeLayer(g);
  }
}