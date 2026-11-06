/**
 * Solo Explorer — Activity Logger (Server-Synced)
 *
 * Alur:
 *   logEvent()  →  localStorage buffer  →  flushToServer()  →  api/log.php
 *
 * Auto-flush terjadi pada:
 *   - interval 60 detik
 *   - setelah 20 entri baru
 *   - saat tab disembunyikan (visibilitychange)
 *   - saat halaman ditutup (pagehide, via sendBeacon)
 *   - saat koneksi kembali online
 *
 * Setelah flush sukses, entri dihapus dari localStorage.
 * User TIDAK bisa mengunduh log — hanya pemilik web via admin/logs.php.
 */

import { CONFIG } from './map-config.js';

const STORAGE_KEY = 'solo-explorer:activity-log';
const SYNC_KEY    = 'solo-explorer:last-sync-at';
const MAX_LOCAL   = CONFIG.log?.maxLocalBuffer ?? 500;

let _sessionId = null;
let _lastPosLogAt = 0;
let _lastSyncAt = 0;
let _flushTimer = null;
let _isFlushing = false;
let _dirtyCount = 0;

/* ============================================================
   INIT
   ============================================================ */

export function initActivityLog() {
  _sessionId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  _lastSyncAt = Number(localStorage.getItem(SYNC_KEY) || 0);

  logEvent('session_start', {
    description: 'Pengguna membuka Solo Explorer',
    userAgent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight }
  });

  // Scheduler
  _flushTimer = setInterval(() => {
    flushToServer().catch(() => {});
  }, CONFIG.log?.flushIntervalMs ?? 60000);

  // Flush saat tab disembunyikan
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushToServer({ beacon: true }).catch(() => {});
    }
  });

  // Flush saat halaman ditutup
  window.addEventListener('pagehide', () => {
    flushToServer({ beacon: true }).catch(() => {});
  });

  // Flush saat online kembali
  window.addEventListener('online', () => {
    flushToServer().catch(() => {});
  });
}

export function getSessionId() {
  return _sessionId;
}

/* ============================================================
   LOG WRITER
   ============================================================ */

export function logEvent(type, data = {}) {
  const loc = window.__SE_USER_LOC__ || null;

  const entry = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    sessionId: _sessionId,
    type,
    time: new Date().toISOString(),
    url: location.href,
    userPoint: loc
      ? { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy ?? null }
      : null,
    ...data
  };

  const log = getLog();
  log.push(entry);
  if (log.length > MAX_LOCAL) log.splice(0, log.length - MAX_LOCAL);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (e) {
    console.warn('[Log] gagal simpan lokal:', e);
  }

  _dirtyCount++;

  if (_dirtyCount >= (CONFIG.log?.flushOnCount ?? 20)) {
    flushToServer().catch(() => {});
  }

  return entry;
}

export function getLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLogCount() {
  return getLog().length;
}

/* ============================================================
   POSITION LOGGER (throttled)
   ============================================================ */

export function logPosition(force = false) {
  const now = Date.now();
  if (!force && now - _lastPosLogAt < 25000) return;
  if (!window.__SE_USER_LOC__) return;
  _lastPosLogAt = now;
  logEvent('user_position', {
    description: 'Posisi pengguna diperbarui'
  });
}

/* ============================================================
   SERVER SYNC
   ============================================================ */

export async function flushToServer({ beacon = false } = {}) {
  if (_isFlushing) return { ok: false, sent: 0, error: 'in-progress' };

  const minInterval = CONFIG.log?.minSyncIntervalMs ?? 15000;
  if (!beacon && Date.now() - _lastSyncAt < minInterval) {
    return { ok: false, sent: 0, error: 'throttled' };
  }

  const entries = getLog();
  if (entries.length === 0) return { ok: true, sent: 0 };

  const payload  = JSON.stringify({ entries });
  const endpoint = CONFIG.log?.endpoint || '../api/log.php';
  const token    = CONFIG.log?.token || '';

  _isFlushing = true;

  try {
    let success = false;

    if (beacon && navigator.sendBeacon) {
      // sendBeacon tidak bisa kirim header custom → token di query
      const url  = `${endpoint}?t=${encodeURIComponent(token)}&beacon=1`;
      const blob = new Blob([payload], { type: 'application/json' });
      success = navigator.sendBeacon(url, blob);
    } else {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Log-Token': token
        },
        body: payload,
        keepalive: true,
        credentials: 'same-origin'
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        success = json.ok === true;
      }
    }

    if (success) {
      // Hapus yang sudah terkirim; pertahankan entri baru selama request
      const sentIds = new Set(entries.map(e => e.id));
      const remaining = getLog().filter(e => !sentIds.has(e.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));

      _lastSyncAt = Date.now();
      localStorage.setItem(SYNC_KEY, String(_lastSyncAt));
      _dirtyCount = 0;

      return { ok: true, sent: entries.length };
    }

    return { ok: false, sent: 0, error: 'server-rejected' };
  } catch (err) {
    return { ok: false, sent: 0, error: String(err?.message || err) };
  } finally {
    _isFlushing = false;
  }
}

/** Status untuk panel sinkron di UI publik (read-only). */
export function getSyncStatus() {
  return {
    localCount: getLogCount(),
    lastSyncAt: _lastSyncAt,
    sessionId: _sessionId
  };
}