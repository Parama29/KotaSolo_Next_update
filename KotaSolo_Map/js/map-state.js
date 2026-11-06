/**
 * Solo Explorer — Centralised application state
 */

const _state = {
  destinations: [],
  stops: [],
  routes: [],
  activeCategory: 'all',
  searchQuery: '',
  selectedId: null,
  viewMode: 'idle', // 'idle' | 'nearby' | 'all'
  layers: {
    destinations: true,
    'bst-stops': true,
    'krl-stops': false,
    'bst-routes': true
  },
  bottomsheet: 'closed',
  theme: 'dark',
  userLocation: null,
  mapReady: false,
  loading: false,
  error: null
};
  
  const _listeners = new Set();
  
  export function subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }
  
  function _emit(patch) {
    for (const fn of _listeners) {
      try { fn(_state, patch); } catch (e) { console.error('state listener error', e); }
    }
  }
  
  export function setState(patch) {
    Object.assign(_state, patch);
    _emit(patch);
  }
  
  export function getState(key) {
    return key === undefined ? { ..._state } : _state[key];
  }
  
  export function toggleLayer(layerKey, value) {
    const layers = { ..._state.layers, [layerKey]: value ?? !_state.layers[layerKey] };
    setState({ layers });
    return layers[layerKey];
  }
  
  export function resetTransient() {
    setState({ searchQuery: '', selectedId: null, bottomsheet: 'closed' });
  }

  