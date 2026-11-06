import { getMap, flyTo } from './map-engine.js';
import { userIcon } from './map-markers.js';
import { setState } from './map-state.js';
import { toast, distanceMeters } from './map-utils.js';
import { logEvent, logPosition } from './map-activity-log.js';
import { enterNearbyMode } from './map-nearby.js';

let _marker = null;
let _watchId = null;
let _lastLoggedPos = null;

export function initLocation() {
  const btn = document.getElementById('btn-locate');
  if (!btn) return;
  btn.addEventListener('click', locateUser);
}

function locateUser() {
  const btn = document.getElementById('btn-locate');
  if (!navigator.geolocation) {
    toast('Perangkat tidak mendukung geolokasi.');
    return;
  }

  btn.classList.add('is-active');
  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  });

  function onSuccess(pos) {
    const { latitude, longitude, accuracy } = pos.coords;

    window.__SE_USER_LOC__ = { lat: latitude, lng: longitude, accuracy };
    setState({ userLocation: { lat: latitude, lng: longitude, accuracy } });

    const map = getMap();
    if (!map) return;

    if (_marker) map.removeLayer(_marker);
    _marker = L.marker([latitude, longitude], {
      icon: userIcon(),
      zIndexOffset: 2000
    }).addTo(map);

    L.circle([latitude, longitude], {
      radius: Math.min(accuracy || 50, 200),
      color: '#2f9cf4',
      weight: 1,
      fillOpacity: 0.08
    }).addTo(map);

    flyTo(latitude, longitude, 16);
    toast('Lokasi ditemukan.');
    btn.classList.remove('is-active');

    // Log posisi awal
    _lastLoggedPos = { lat: latitude, lng: longitude };
    logEvent('user_location', {
      description: 'Lokasi pengguna diperoleh',
      accuracy
    });

    // Masuk mode nearby otomatis
    enterNearbyMode({ silent: false });

    // Mulai tracking untuk mencatat rute yang dilalui
    _startWatching();
  }

  function onError(err) {
    btn.classList.remove('is-active');
    const msg = {
      1: 'Izin lokasi ditolak.',
      2: 'Lokasi tidak tersedia.',
      3: 'Waktu permintaan lokasi habis.'
    }[err.code] || 'Gagal mendapatkan lokasi.';
    toast(msg);
  }
}

function _startWatching() {
  if (_watchId !== null) return;
  if (!navigator.geolocation) return;

  _watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      window.__SE_USER_LOC__ = { lat: latitude, lng: longitude, accuracy };
      setState({ userLocation: { lat: latitude, lng: longitude, accuracy } });

      if (_marker) _marker.setLatLng([latitude, longitude]);

      // Log jika berpindah > 40 m
      if (_lastLoggedPos) {
        const moved = distanceMeters(_lastLoggedPos, { lat: latitude, lng: longitude });
        if (moved > 40) {
          _lastLoggedPos = { lat: latitude, lng: longitude };
          logEvent('user_position', {
            description: 'Posisi pengguna berubah',
            movedMeters: Math.round(moved)
          });
        }
      } else {
        _lastLoggedPos = { lat: latitude, lng: longitude };
      }
    },
    (err) => console.warn('[Location] watch error:', err),
    { enableHighAccuracy: true, maximumAge: 20000, timeout: 15000 }
  );
}