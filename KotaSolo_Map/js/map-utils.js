/**
 * Solo Explorer — Shared utilities
 */

/** Debounce — trailing-edge. */
export function debounce(fn, wait = 200) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  
  /** Escape HTML for safe innerHTML usage (only when unavoidable). */
  export function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  /** Validate a coordinate pair (returns null if invalid). */
  export function validateCoords(lat, lng) {
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
    if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
    if (la === 0 && lo === 0) return null;
    return { lat: la, lng: lo };
  }
  
  /** Haversine distance in metres. */
  export function distanceMeters(a, b) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  
  /** Format a distance in metres to friendly text. */
  export function formatDistance(m) {
    if (!Number.isFinite(m)) return '';
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }
  
  /** Extract first valid URL string from an object under common keys. */
  export function pickImage(obj) {
    if (!obj) return '';
    const candidates = [obj.image, obj.img, obj.foto, obj.gambar, obj.photo, obj.picture];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim().length > 0) return c.trim();
    }
    return '';
  }
  
  /** Normalise various lat/lng field names into {lat,lng}. */
  export function extractCoords(obj) {
    if (!obj) return null;
    const lat = obj.lat ?? obj.latitude ?? obj.y;
    const lng = obj.lng ?? obj.longitude ?? obj.lon ?? obj.x;
    return validateCoords(lat, lng);
  }
  
  /** Simple DOM helper: create element with attributes and children. */
  export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v != null) node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }
  
  /** Show a transient toast (bottom-centre). */
  export function toast(message, ms = 2600) {
    const node = document.getElementById('toast');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { node.hidden = true; }, ms);
  }
  
  /** Extract a stable "id" from a destination object (several fallbacks). */
  export function pickId(obj, prefix = '') {
    if (!obj) return prefix + Math.random().toString(36).slice(2, 8);
    const id = obj.id ?? obj.ID ?? obj.kode ?? obj.slug;
    if (id != null) return String(id);
    return prefix + Math.random().toString(36).slice(2, 8);
  }