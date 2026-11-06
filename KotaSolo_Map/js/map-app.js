/**
 * Solo Explorer — Application entry point
 */

import { CONFIG } from './map-config.js';
import { fetchInitialData } from './map-api.js';
import { initMap, getMap, flyTo } from './map-engine.js';
import { setDestinations, setStops, setRoutes, renderRoutes } from './map-layers.js?v=20261105-1';
import { initSearch } from './map-search.js';
import { initFilters, filterByCategory } from './map-filters.js';
import { initBottomSheet, openSheet, closeSheet } from './map-bottomsheet.js?v=20261104-1';
import { initLocation } from './map-location.js';
import { getState, setState } from './map-state.js';
import { toast, escapeHtml } from './map-utils.js';
import { initActivityLog, logEvent, getSyncStatus, flushToServer } from './map-activity-log.js';
import { registerSelectHandler, enterNearbyMode, exitNearbyMode, enterIdleMode } from './map-nearby.js';

function updateIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Fungsi helper untuk menutup semua panel
function closeAllPanels() {
  document.querySelectorAll('.layer-panel').forEach(p => p.classList.remove('is-open'));
  document.querySelectorAll('.map-controls .icon-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

(async function bootstrap() {
  try {
    initTheme();
    initActivityLog();

    const map = initMap('map');
    setState({ mapReady: true });

    initBottomSheet();
    initLocation();
    registerSelectHandler(handleDestinationSelect);

    initFilters({
      onFilterChange: (cat) => {
        if (getState('viewMode') === 'nearby') exitNearbyMode();
        logEvent('category_filter', { description: `Filter kategori: ${cat}`, category: cat });
        applyCategoryFilter(cat);
        closeAllPanels(); // Tutup panel saat filter diubah
      },
      onLayerChange: (key, visible) => {
        if (getState('viewMode') === 'nearby') exitNearbyMode();
        logEvent('layer_toggle', { description: `Layer ${key} ${visible ? 'ditampilkan' : 'disembunyikan'}`, layer: key, visible });
        toast(`${label(key)} ${visible ? 'ditampilkan' : 'disembunyikan'}`);
      }
    });

    initSearch({
      onSelectDestination: (item, kind) => {
        closeAllPanels();
        if (kind === 'stop') {
          flyTo(item.lat, item.lng, 16);
          logEvent('stop_view', { description: `Melihat halte: ${item.name}`, stop: { id: item.id, name: item.name, lat: item.lat, lng: item.lng } });
        } else {
          if (getState('viewMode') !== 'all') exitNearbyMode();
          handleDestinationSelect(item);
        }
      }
    });

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => map.zoomOut());

    // ---- Nearby ----
    document.getElementById('btn-nearby')?.addEventListener('click', () => {
      closeAllPanels();
      if (!getState('userLocation')) {
        toast('Aktifkan lokasi terlebih dahulu (tombol 🎯).');
        return;
      }
      if (getState('viewMode') === 'nearby') exitNearbyMode(); else enterNearbyMode();
      syncNearbyButton();
    });

    // ---- Setup Event Listener Panel (Layer, Rute, Log) ----
    setupPanelToggles();

    // ---- Setup Route Panel ----
    setupRoutePanel();

    // ---- Log status panel Sinkronisasi ----
    document.getElementById('log-sync-now')?.addEventListener('click', async () => {
      const r = await flushToServer();
      updateLogStatus();
      if (r.ok) toast(`Tersinkron: ${r.sent} entri.`);
      else toast(`Sinkron gagal: ${r.error || 'unknown'}`);
    });

    // ---- Klik peta / luar area untuk tutup semua panel ----
    map.on('click', () => {
      closeAllPanels();
      closeSheet();
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.layer-panel') && !e.target.closest('.map-controls')) {
        closeAllPanels();
      }
    });

    // ---- Load data ----
    let data;
    try {
      data = await fetchInitialData();
    } catch (err) {
      showError('Gagal memuat data peta.', err);
      hideLoading();
      return;
    }

    setState({
      destinations: data.destinations,
      stops: data.stops,
      routes: data.routes
    });

    setStops(data.stops, handleStopSelect);
    if (data.routes && data.routes.length) setRoutes(data.routes);

    if (getState('userLocation')) {
      enterNearbyMode({ silent: true });
    } else {
      enterIdleMode({ silent: true });
    }
    syncNearbyButton();

    if (data.destinations.length) {
      const latlngs = data.destinations.map((d) => [d.lat, d.lng]);
      try { map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 13 }); } catch (_) {}
    }

    hideLoading();
    updateIcons();

    if (data.destinations.length === 0) {
      showError('Tidak ada data destinasi. Periksa endpoint API pada js/map-config.js.');
    }

    const params = new URLSearchParams(location.search);
    const deepId = params.get('dest');
    if (deepId) {
      const d = data.destinations.find((x) => x.id === deepId);
      if (d) setTimeout(() => handleDestinationSelect(d), 300);
    }

  } catch (err) {
    console.error('[Bootstrap Error]', err);
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 20px;">
          <i data-lucide="alert-triangle" width="32" style="color: var(--primary); margin-bottom: 12px;"></i>
          <strong>Terjadi kesalahan sistem</strong>
          <p style="font-size: 13px; margin-top: 8px; color: var(--text-muted);">${escapeHtml(err.message || String(err))}</p>
          <button onclick="location.reload()" class="btn btn--primary" style="margin-top: 16px; width: auto;">Muat Ulang Peta</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }
})();

/* ---------- Setup UI ---------- */
function setupPanelToggles() {
  const togglePanel = (btnId, panelId) => {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCurrentlyOpen = panel.classList.contains('is-open');
      closeAllPanels();
      
      if (!isCurrentlyOpen) {
        panel.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        closeSheet(); // Tutup bottom sheet detail destinasi
        if (panelId === 'log-panel') updateLogStatus();
      }
    });
  };

  togglePanel('btn-routes', 'route-panel');
  togglePanel('btn-layers', 'layer-panel');
  togglePanel('btn-log', 'log-panel');

  // Tombol X (close)
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPanels();
    });
  });
}

function setupRoutePanel() {
  const list = document.getElementById('route-list');
  if (!list) return;

  const routeCodes = ['1', '2', '3', '4', '5', '6', 'F7', 'F8', 'F9', 'F10', 'F12', 'S1', 'S2'];
  
  list.innerHTML = '';
  routeCodes.forEach(code => {
    if (!CONFIG.routeColors[code]) return;
    const lbl = document.createElement('label');
    lbl.className = 'layer-item route-item';
    lbl.innerHTML = `
      <input type="checkbox" value="${code}" data-route="${code}" checked>
      <span class="route-color-swatch" style="background-color: ${CONFIG.routeColors[code]}"></span>
      <span>Rute ${code}</span>
    `;
    list.appendChild(lbl);
  });

  list.addEventListener('change', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
      const checked = Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
      const isAllChecked = checked.length === routeCodes.length;
      const activeCodes = isAllChecked ? [] : checked;
      
      renderRoutes(activeCodes);
      
      logEvent('route_filter', {
        description: `Filter rute: ${checked.join(', ') || 'Semua'}`,
        routes: checked
      });
    }
  });
}

/* ---------- Handlers ---------- */
function handleDestinationSelect(dest) {
  closeAllPanels();
  if (getState('viewMode') !== 'all') {
    setState({ viewMode: 'all' });
    setDestinations(getState('destinations'), handleDestinationSelect, dest.id);
  } else {
    setDestinations(getState('destinations'), handleDestinationSelect, dest.id);
  }

  setState({ selectedId: dest.id });
  flyTo(dest.lat, dest.lng, Math.max(getMap().getZoom(), 16));

  logEvent('destination_view', {
    description: `Membuka destinasi: ${dest.name}`,
    destination: { id: dest.id, name: dest.name, category: dest.category, lat: dest.lat, lng: dest.lng }
  });

  if (window.matchMedia('(min-width: 768px)').matches) {
    renderSidebarCard(dest);
  } else {
    openSheet(dest, { map: getMap() });
  }
}

function handleStopSelect(stop) {
  closeAllPanels();
  flyTo(stop.lat, stop.lng, 16);
  toast(`Mendekati ${stop.name || 'Halte'}`);
  logEvent('stop_view', {
    description: `Melihat halte: ${stop.name}`,
    stop: { id: stop.id, name: stop.name, lat: stop.lat, lng: stop.lng }
  });
}

function applyCategoryFilter(cat) {
  const filtered = filterByCategory(getState('destinations'), cat);
  setState({ viewMode: 'all' });
  setDestinations(filtered, handleDestinationSelect, getState('selectedId'));
  updateIcons();

  if (!filtered.some((d) => d.id === getState('selectedId'))) {
    setState({ selectedId: null });
    closeSheet();
  }

  if (filtered.length) {
    const latlngs = filtered.map((d) => [d.lat, d.lng]);
    try { getMap().fitBounds(latlngs, { padding: [40, 40], maxZoom: 15 }); } catch (_) {}
  }
}

/* ---------- Helpers ---------- */
function syncNearbyButton() {
  const btn = document.getElementById('btn-nearby');
  if (!btn) return;
  btn.classList.toggle('is-active', getState('viewMode') === 'nearby');
}

function updateLogStatus() {
  const status = getSyncStatus();
  const countEl = document.getElementById('log-count');
  const syncEl  = document.getElementById('log-last-sync');
  if (countEl) countEl.textContent = String(status.localCount);
  if (syncEl) {
    if (status.lastSyncAt > 0) syncEl.textContent = new Date(status.lastSyncAt).toLocaleTimeString('id-ID');
    else syncEl.textContent = '—';
  }
}

function renderSidebarCard(dest) {
  const container = document.getElementById('sidebar-content');
  if (!container) return;
  const catLabel = CONFIG.categories[dest.category]?.label || dest.category;

  container.innerHTML = `
    <div class="card">
      <div class="card__media">
        ${dest.image ? `<img src="${escapeHtml(dest.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      </div>
      <div class="card__body">
        <div class="card__cat">${escapeHtml(catLabel)}</div>
        <h3 class="card__title">${escapeHtml(dest.name)}</h3>
        <p class="card__desc">${escapeHtml(dest.description || 'Tidak ada deskripsi.')}</p>
        <div class="card__meta">
          ${dest.address ? `<span><i data-lucide="map-pin" width="14"></i> ${escapeHtml(dest.address)}</span>` : ''}
          <span><i data-lucide="crosshair" width="14"></i> ${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}</span>
        </div>
        <div class="card__actions">
          <button class="btn btn--primary" data-action="route"><i data-lucide="navigation" width="16"></i> Rute</button>
          <button class="btn btn--ghost" data-action="share"><i data-lucide="share-2" width="16"></i> Bagikan</button>
        </div>
      </div>
    </div>
  `;
  updateIcons();

  container.querySelector('[data-action="route"]')?.addEventListener('click', () => {
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
    logEvent('route_open', { description: `Membuka rute ke: ${dest.name}`, destination: { id: dest.id, name: dest.name, category: dest.category, lat: dest.lat, lng: dest.lng }, route: 'google-maps', routeUrl });
    window.open(routeUrl, '_blank');
  });

  container.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('dest', dest.id);
    logEvent('share', { description: `Membagikan destinasi: ${dest.name}`, destination: { id: dest.id, name: dest.name, category: dest.category }, url: url.toString() });
    if (navigator.share) {
      try { await navigator.share({ title: dest.name, url: url.toString() }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(url.toString()); toast('Tautan disalin.'); } catch (_) { prompt('Salin tautan:', url.toString()); }
    }
  });
}

function initTheme() {
  let saved = 'dark';
  try { saved = localStorage.getItem(CONFIG.storage.theme) || 'dark'; } catch (e) {}
  document.documentElement.dataset.theme = saved;
  updateThemeIcons(saved);

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(CONFIG.storage.theme, next); } catch (e) {}
    updateThemeIcons(next);
    logEvent('theme_change', { theme: next, description: `Tema diubah ke ${next}` });
  }
}

function updateThemeIcons(theme) {
  const iconName = theme === 'dark' ? 'moon' : 'sun';
  document.getElementById('theme-icon')?.setAttribute('data-lucide', iconName);
  const btnMobile = document.getElementById('theme-toggle-mobile');
  if (btnMobile) {
    const mobileIcon = btnMobile.querySelector('i');
    if (mobileIcon) mobileIcon.setAttribute('data-lucide', iconName);
  }
  updateIcons();
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.classList.add('is-hidden');
  setTimeout(() => overlay.setAttribute('hidden', ''), 350);
}

function showError(message, err) {
  const container = document.getElementById('sidebar-content');
  if (!container) return;
  container.innerHTML = `
    <div class="error-state" style="margin: 16px; text-align: center;">
      <i data-lucide="alert-triangle" width="32" style="color: var(--primary); margin-bottom: 12px;"></i>
      <strong>${escapeHtml(message)}</strong>
      <p style="font-size: 13px; margin-top: 8px;">Buka konsol browser untuk detail.</p>
      ${err ? `<small style="display:block; margin-top:8px; opacity:0.6;">${escapeHtml(String(err.message || err))}</small>` : ''}
    </div>
  `;
  updateIcons();
}

function label(key) {
  return { destinations: 'Destinasi', 'bst-stops': 'Halte BST', 'krl-stops': 'Stasiun KRL', 'bst-routes': 'Rute BST' }[key] || key;
}