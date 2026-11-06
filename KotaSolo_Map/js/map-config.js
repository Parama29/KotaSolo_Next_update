/**
 * Solo Explorer — Centralised Configuration
 */

export const CONFIG = {
  api: {
    base: '..',
    destinations: '/data/destinations.json',
    stops:        '/data/stops.json',
  },

  map: {
    center: [-7.5670, 110.8300],
    zoom: 13,
    minZoom: 10,
    maxZoom: 19,
    maxBounds: [[-7.75, 110.65], [-7.40, 111.00]],
    maxBoundsViscosity: 0.7
  },

  tile: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  },

  markers: {
    stopMinZoom: 13,
  },

  storage: {
    theme: 'solo-explorer:theme',
    favorites: 'solo-explorer:favorites'
  },

  categories: {
    all:        { label: 'Semua',      icon: 'map' },
    religi:     { label: 'Religi',     icon: 'mosque' },
    sejarah:    { label: 'Sejarah',    icon: 'landmark' },
    belanja:    { label: 'Belanja',    icon: 'shopping-bag' },
    experience: { label: 'Experience', icon: 'sparkles' }
  },

    routeColors: {
      '1':   '#1d4ed8', // Biru tua (sesuai "F1 biru tua")
      '2':   '#f59e0b', // Oranye
      '3':   '#d6c19d', // Beige / Coklat Muda
      '4':   '#84cc16', // Hijau Terang
      '5':   '#8b5cf6', // Ungu
      '6':   '#10b981', // Hijau Tosca (fallback untuk 6)
      'F7':  '#dc2626', // Merah (lebih pekat dari sebelumnya)
      'F8':  '#8e44ad', // Ungu Gelap
      'F9':  '#14b8a6', // Teal / Cyan-Hijau
      'F10': '#f97316', // Oranye Amber (bukan kuning)
      'F12': '#f43f5e', // Pink
      'S1':  '#b45309', // Coklat Tua
      'S2':  '#22c55e', // Hijau
    },

  requestTimeoutMs: 12000,
  searchDebounceMs: 220,

  /* === Activity Log (server sync) === */
  log: {
    endpoint: '../api/log.php',
    token: 'GANTI-DENGAN-STRING-ACAK-MIN-32-KARAKTER-xxxxxxxxxxxx',
    flushIntervalMs: 60000,
    flushOnCount: 20,
    maxLocalBuffer: 500,
    minSyncIntervalMs: 15000
  }
};

export const ENDPOINTS = {
  destinations: CONFIG.api.base + CONFIG.api.destinations,
  stops:        CONFIG.api.base + CONFIG.api.stops,
};