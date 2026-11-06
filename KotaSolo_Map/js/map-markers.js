import { CONFIG } from './map-config.js';

const iconSvg = {
  'map': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  'mosque': '<path d="M3 19h18"/><path d="M3 21h18"/><path d="M21 19V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v14"/><path d="M10 5v4"/><path d="M14 5v4"/><path d="M10 9h4"/><path d="M8 21v-4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4"/><path d="M12 21v-4"/>',
  'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>'
};

export function destinationIcon(destination, selected = false, simple = false) {
  if (simple) {
    const cls = ['se-marker', 'se-marker--simple', `se-marker--${destination.category}`, selected ? 'se-marker--simple-selected' : ''].filter(Boolean).join(' ');
    return L.divIcon({ className: cls, html: `<div class="se-marker__simple-dot"></div>`, iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10] });
  }

  const cat = CONFIG.categories[destination.category] || CONFIG.categories.experience;
  const symbol = cat.icon;
  const cls = ['se-marker', `se-marker--${destination.category}`, selected ? 'se-marker--selected' : ''].filter(Boolean).join(' ');
  const svgContent = iconSvg[symbol] || iconSvg['sparkles'];

  return L.divIcon({
    className: cls,
    html: `<div class="se-marker__inner"><svg class="se-marker__glyph" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -30]
  });
}

/**
 * Mengatur gaya warna titik halte berdasarkan rute yang dilewati.
 */
function getStopStyle(routes, activeCodes = []) {
  const fallbackColor = '#e0713a';

  if (!routes || !Array.isArray(routes) || routes.length === 0) {
    return `background-color: ${fallbackColor};`;
  }

  // Normalisasi daftar kode aktif menjadi uppercase
  const activeUpper = activeCodes.map(c => String(c).trim().toUpperCase());

  // Filter rute berdasarkan kode aktif (case-insensitive)
  let routesToShow = routes;
  if (activeUpper.length > 0) {
    const filtered = routes.filter(r =>
      activeUpper.includes(String(r).trim().toUpperCase())
    );
    if (filtered.length > 0) routesToShow = filtered;
  }

  // Map kode rute → warna, deduplikasi
  const colors = routesToShow
    .map(r => {
      const key = String(r).trim().toUpperCase();
      if (CONFIG.routeColors[key]) return CONFIG.routeColors[key];
      // fallback case-insensitive lookup
      const foundKey = Object.keys(CONFIG.routeColors)
        .find(k => k.toUpperCase() === key);
      return foundKey ? CONFIG.routeColors[foundKey] : fallbackColor;
    })
    .filter((c, i, arr) => arr.indexOf(c) === i); // hapus warna duplikat

  if (colors.length === 1) {
    return `background-color: ${colors[0]};`;
  }

  // Pie chart (conic-gradient) untuk halte multi-rute
  const step = 360 / colors.length;
  const stops = colors.map((color, i) =>
    `${color} ${i * step}deg ${(i + 1) * step}deg`
  );

  return `background-color: ${colors[0]}; background-image: conic-gradient(${stops.join(', ')});`;
}

export function stopIcon(stop, activeCodes = []) {
  const cls = `se-stop-marker ${stop.mode === 'krl' ? 'se-stop-marker--krl' : ''}`;
  const styleStr = getStopStyle(stop.routes, activeCodes);

  return L.divIcon({
    className: cls,
    html: `<div class="se-stop-marker__inner" style="${styleStr}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

export function buildDestinationLayer(destinations, onSelect, selectedId = null, options = {}) {
  const group = L.layerGroup();
  const simple = options.simple === true;
  for (const d of destinations) {
    const marker = L.marker([d.lat, d.lng], {
      icon: destinationIcon(d, d.id === selectedId, simple),
      title: d.name, riseOnHover: true, keyboard: true
    });
    marker.on('click', () => onSelect(d));
    marker._seDestId = d.id;
    group.addLayer(marker);
  }
  return group;
}

export function buildStopLayer(stops, mode, onSelect, activeCodes = []) {
  const group = L.layerGroup();
  const filtered = stops.filter((s) => s.mode === mode);
  
  for (const s of filtered) {
    const m = L.marker([s.lat, s.lng], {
      icon: stopIcon(s, activeCodes),
      title: `${s.name} (${s.routes ? s.routes.join(', ') : '-'})`,
      riseOnHover: true
    });
    m.on('click', () => onSelect(s));
    group.addLayer(m);
  }
  return { group, stops: filtered };
}

export function userIcon() {
  return L.divIcon({
    className: 'se-user-marker', html: `<div class="se-user-marker__dot"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8]
  });
}