import { ENDPOINTS, CONFIG } from './map-config.js';
import { extractCoords, pickImage, pickId, validateCoords } from './map-utils.js';

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    const text = await res.text();
    if (!text.trim()) return null;
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function normaliseCategory(val) {
  const s = String(val || '').toLowerCase();
  if (s.includes('religi')) return 'religi';
  if (s.includes('sejarah')) return 'sejarah';
  if (s.includes('belanja')) return 'belanja';
  return 'experience';
}

function normaliseDestination(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const coords = validateCoords(raw.latitude ?? raw.lat, raw.longitude ?? raw.lng);
  if (!coords) return null;
  
  return {
    id: pickId(raw, 'dest-'),
    name: raw.name || 'Tanpa Nama',
    category: normaliseCategory(raw.category),
    description: raw.description || raw.desc || '',
    address: raw.address || 'Surakarta, Jawa Tengah',
    image: raw.image_url || raw.image || raw.img || '',
    lat: coords.lat,
    lng: coords.lng,
    raw
  };
}

function normaliseStop(raw) {
  if (!raw) return null;
  
  // Format dari stops.json: [id, name, lat, lng, routes, is_hub]
  if (Array.isArray(raw)) {
    const coords = validateCoords(raw[2], raw[3]);
    if (!coords) return null;

    // PARSING RUTE YANG SANGAT KUAT
    let routes = [];
    const rData = raw[4];
    if (Array.isArray(rData)) {
      routes = rData.map(r => String(r).trim().toUpperCase());
    } else if (typeof rData === 'string') {
      // Jika format "1, 2", pecah dan bersihkan spasi
      routes = rData.split(',').map(s => s.trim().toUpperCase());
    } else if (rData !== undefined && rData !== null) {
      // Jika hanya angka 1
      routes = [String(rData).trim().toUpperCase()];
    }

    return {
      id: 'stop-' + raw[0],
      name: raw[1],
      mode: 'bst', 
      routes: routes, // Menyimpan kode rute (contoh: ["1", "F7"])
      isHub: raw[5] === 1,
      lat: coords.lat,
      lng: coords.lng
    };
  }
  return null;
}

export async function fetchDestinations() {
  try {
    const data = await fetchJson(ENDPOINTS.destinations);
    const list = Array.isArray(data) ? data : [];
    return list.map(normaliseDestination).filter(Boolean);
  } catch (err) {
    console.error('[map-api] fetchDestinations failed:', err.message);
    return [];
  }
}

export async function fetchStops() {
  try {
    const data = await fetchJson(ENDPOINTS.stops);
    const list = Array.isArray(data) ? data : [];
    return list.map(normaliseStop).filter(Boolean);
  } catch (err) {
    console.error('[map-api] fetchStops failed:', err.message);
    return [];
  }
}

export async function fetchRoutes() {
  const routeCodes = ['1', '2', '3', '4', '5', 'F7', 'F8', 'F9', 'F10', 'F12', 'S1', 'S2'];
  const results = [];
  
  await Promise.all(routeCodes.map(async (code) => {
    try {
      const data = await fetchJson(`../data/routes/${code}.json`);
      if (data && data.segments) {
        results.push({ code, data });
      }
    } catch (e) {
      // Abaikan jika file rute tidak ditemukan
    }
  }));
  
  return results;
}

export async function fetchInitialData() {
  const [destinations, stops, routes] = await Promise.all([
    fetchDestinations(),
    fetchStops(),
    fetchRoutes()
  ]);
  return { destinations, stops, routes };
}