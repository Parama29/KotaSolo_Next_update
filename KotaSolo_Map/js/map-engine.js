/**
 * Solo Explorer — Leaflet engine
 */

import { CONFIG } from './map-config.js';

let _map = null;

export function initMap(containerId = 'map') {
  if (_map) return _map;

  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Map container #${containerId} not found`);

  const { center, zoom, minZoom, maxZoom, maxBounds, maxBoundsViscosity } = CONFIG.map;

  _map = L.map(container, {
    center,
    zoom,
    minZoom,
    maxZoom,
    maxBounds,
    maxBoundsViscosity,
    zoomControl: false,               // we render our own controls
    attributionControl: true,
    preferCanvas: true                // better performance for many markers
  });

  L.tileLayer(CONFIG.tile.url, {
    maxZoom: CONFIG.tile.maxZoom,
    attribution: CONFIG.tile.attribution
  }).addTo(_map);

  // Ensure tiles render correctly when layout changes
  window.addEventListener('resize', () => {
    if (_map) _map.invalidateSize({ pan: false });
  });

  // Mobile-safe resize when the visual viewport changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => _map && _map.invalidateSize({ pan: false }));
  }

  return _map;
}

export function getMap() {
  return _map;
}

export function flyTo(lat, lng, zoom) {
  if (!_map) return;
  _map.flyTo([lat, lng], zoom ?? _map.getZoom(), { duration: 0.6 });
}

export function fitBounds(latlngs) {
  if (!_map || !latlngs || !latlngs.length) return;
  _map.fitBounds(latlngs, { padding: CONFIG.markers.maxFitBoundsPadding, maxZoom: 16 });
}