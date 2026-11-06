import { getMap } from './map-engine.js';
import { buildDestinationLayer, buildStopLayer } from './map-markers.js';
import { CONFIG } from './map-config.js';

const groups = {
  destinations: null,
  'bst-stops': null,
  'krl-stops': null,
  'bst-routes': null
};

const stopMeta = {
  'bst-stops': { stops: [], mode: 'bst' },
  'krl-stops': { stops: [], mode: 'krl' }
};

let _zoomListenerAttached = false;
let _allRoutes = [];
let _allStops = [];
let _stopSelectHandler = null;

export function setDestinations(destinations, onSelect, selectedId = null, options = {}) {
  const map = getMap();
  if (!map) return;

  if (groups.destinations) map.removeLayer(groups.destinations);
  groups.destinations = buildDestinationLayer(destinations, (dest) => onSelect(dest), selectedId, options);

  groups.destinations.eachLayer((m) => {
    const id = m._seDestId;
    m._seDestData = destinations.find((d) => d.id === id);
  });

  groups.destinations.addTo(map);
  applyVisibility('destinations');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

export function setStops(stops, onSelect) {
  _allStops = stops;
  _stopSelectHandler = onSelect;
  renderStops();
}

export function setRoutes(routesData) {
  _allRoutes = routesData;
  renderRoutes();
}

export function renderRoutes(activeCodes = []) {
  const map = getMap();
  if (!map) return;
  if (groups['bst-routes']) map.removeLayer(groups['bst-routes']);

  const group = L.layerGroup();
  const isFiltering = activeCodes.length > 0;
  
  for (const route of _allRoutes) {
    if (isFiltering && !activeCodes.includes(route.code)) continue;
    if (!route || !route.data || !route.data.segments) continue;
    
    const latLngs = route.data.segments.map(segment => 
      segment.map(coord => [coord[1], coord[0]])
    );

    const polyline = L.polyline(latLngs, {
      color: CONFIG.routeColors[route.code] || '#a84b36',
      weight: 4,
      opacity: 0.8
    });
    
    polyline.bindPopup(`Rute ${route.code}`);
    group.addLayer(polyline);
  }
  
  groups['bst-routes'] = group;
  applyVisibility('bst-routes');

  // Sinkronisasi titik halte dengan filter rute
  renderStops(activeCodes);
}

export function renderStops(activeCodes = []) {
  const map = getMap();
  if (!map) return;
  const isFiltering = activeCodes.length > 0;

  for (const [key, mode] of [['bst-stops', 'bst'], ['krl-stops', 'krl']]) {
    if (groups[key]) map.removeLayer(groups[key]);
    
    let stopsToRender = _allStops.filter(s => s.mode === mode);
    
    if (isFiltering && mode === 'bst') {
      const activeUpper = activeCodes.map(c => String(c).trim().toUpperCase());
      stopsToRender = stopsToRender.filter(s => {
        if (!s.routes || !Array.isArray(s.routes)) return false;
        return s.routes.some(r =>
          activeUpper.includes(String(r).trim().toUpperCase())
        );
      });
    }

    const { group, stops: filtered } = buildStopLayer(stopsToRender, mode, _stopSelectHandler, activeCodes);
    groups[key] = group;
    stopMeta[key].stops = filtered;
    applyVisibility(key);
  }

  attachZoomVisibility();
}

export function applyVisibility(key) {
  const map = getMap();
  if (!map) return;
  const group = groups[key];
  if (!group) return;

  const wantsVisible = (window.__SE_LAYER_STATE__ || {})[key] === true;
  const inMap = map.hasLayer(group);

  if (wantsVisible && !inMap) group.addTo(map);
  if (!wantsVisible && inMap) map.removeLayer(group);

  if (key.endsWith('-stops') && inMap) {
    const z = map.getZoom();
    if (z < CONFIG.markers.stopMinZoom) {
      map.removeLayer(group);
      group._seAutoHidden = true;
    } else if (group._seAutoHidden) {
      group.addTo(map);
      group._seAutoHidden = false;
    }
  }
}

function attachZoomVisibility() {
  const map = getMap();
  if (!map || _zoomListenerAttached) return;
  _zoomListenerAttached = true;
  map.on('zoomend', () => {
    for (const key of ['bst-stops', 'krl-stops']) {
      if (groups[key]) {
        const wants = (window.__SE_LAYER_STATE__ || {})[key] === true;
        const inMap = map.hasLayer(groups[key]);
        const z = map.getZoom();
        if (wants && z < CONFIG.markers.stopMinZoom && inMap) {
          map.removeLayer(groups[key]);
          groups[key]._seAutoHidden = true;
        } else if (wants && z >= CONFIG.markers.stopMinZoom && !inMap) {
          groups[key].addTo(map);
          groups[key]._seAutoHidden = false;
        }
      }
    }
  });
}

export const GROUPS = groups;