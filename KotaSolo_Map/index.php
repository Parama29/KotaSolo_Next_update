<?php declare(strict_types=1); ?>
<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#241916">
<title>Solo Explorer — Peta Interaktif Kota Surakarta</title>
<link rel="manifest" href="manifest.webmanifest?v=20261104-1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<link rel="stylesheet" href="css/map-theme.css">
<link rel="stylesheet" href="css/map.css">
<link rel="stylesheet" href="css/map-components.css?v=<?= filemtime(__DIR__ . '/css/map-components.css') ?>">
<link rel="stylesheet" href="css/map-responsive.css">
</head>
<body>
<a class="skip-link" href="#map">Lewati ke peta</a>

<div id="app" class="app">
  <aside id="sidebar" class="sidebar" aria-label="Panel pencarian dan filter">
    <header class="sidebar__header">
      <a class="brand" href="../index.php" aria-label="Kembali ke KotaSolo">
        <span class="brand__mark" aria-hidden="true"><i data-lucide="map-pin" width="18"></i></span>
        <span class="brand__text">
          <strong>Solo Explorer</strong>
          <small>Peta Interaktif</small>
        </span>
      </a>
      <button id="theme-toggle" class="icon-btn" type="button" aria-label="Ganti tema">
        <i data-lucide="moon" id="theme-icon" width="18"></i>
      </button>
    </header>

    <div class="search" role="search">
      <i data-lucide="search" class="search__icon" width="18" aria-hidden="true"></i>
      <input id="search-input" class="search__input" type="search" autocomplete="off" placeholder="Cari destinasi atau halte..." aria-autocomplete="list" aria-controls="search-suggestions" aria-expanded="false">
      <button id="search-clear" class="search__clear icon-btn" type="button" aria-label="Hapus pencarian" hidden><i data-lucide="x" width="16"></i></button>
      <ul id="search-suggestions" class="suggestions" role="listbox" hidden></ul>
    </div>

    <nav class="chips" aria-label="Filter kategori">
      <button class="chip is-active" data-category="all" type="button">Semua</button>
      <button class="chip" data-category="religi" type="button">Religi</button>
      <button class="chip" data-category="sejarah" type="button">Sejarah</button>
      <button class="chip" data-category="belanja" type="button">Belanja</button>
      <button class="chip" data-category="experience" type="button">Experience</button>
    </nav>

    <section id="sidebar-content" class="sidebar__content" aria-live="polite">
      <div class="hint">
        <i data-lucide="map" width="32" style="opacity:0.2; margin-bottom:12px; display:inline-block;"></i>
        <p>Pilih destinasi pada peta, atau cari melalui kolom di atas untuk melihat detail.</p>
      </div>
    </section>

    <footer class="sidebar__footer">
      <a href="../index.php" class="link-back"><i data-lucide="arrow-left" width="14"></i> Kembali ke Beranda</a>
    </footer>
  </aside>

  <main class="map-wrap">
    <!-- Mobile Top Bar -->
    <div class="mobile-top-bar">
      <a href="../index.php" class="icon-btn" aria-label="Kembali"><i data-lucide="arrow-left" width="20"></i></a>
      <div class="search" role="search">
        <i data-lucide="search" class="search__icon" width="16" aria-hidden="true"></i>
        <input id="search-input-mobile" class="search__input" type="search" autocomplete="off" placeholder="Cari destinasi..." aria-autocomplete="list" aria-controls="search-suggestions-mobile" aria-expanded="false">
        <button id="search-clear-mobile" class="search__clear icon-btn" type="button" aria-label="Hapus pencarian" hidden><i data-lucide="x" width="14"></i></button>
        <ul id="search-suggestions-mobile" class="suggestions" role="listbox" hidden></ul>
      </div>
      <button id="theme-toggle-mobile" class="icon-btn" type="button" aria-label="Ganti tema">
        <i data-lucide="sun-moon" width="18"></i>
      </button>
    </div>

    <!-- Mobile Floating Chips -->
    <nav class="mobile-chips" aria-label="Filter kategori">
      <button class="chip is-active" data-category="all" type="button">Semua</button>
      <button class="chip" data-category="religi" type="button">Religi</button>
      <button class="chip" data-category="sejarah" type="button">Sejarah</button>
      <button class="chip" data-category="belanja" type="button">Belanja</button>
      <button class="chip" data-category="experience" type="button">Experience</button>
    </nav>

    <!-- Map Container -->
    <div id="map" class="map" role="application" aria-label="Peta interaktif Surakarta"></div>

    <!-- Map Controls -->
    <div class="map-controls" aria-label="Kontrol peta">
      <button id="btn-nearby" class="icon-btn map-controls__btn" type="button" aria-label="Mode nearby" title="Mode Nearby 2km">
        <i data-lucide="radar" width="20"></i>
      </button>
      <button id="btn-locate" class="icon-btn map-controls__btn" type="button" aria-label="Lokasi saya" title="Lokasi saya">
        <i data-lucide="locate-fixed" width="20"></i>
      </button>
      <button id="btn-routes" class="icon-btn map-controls__btn" type="button" aria-label="Filter rute" aria-expanded="false" aria-controls="route-panel" title="Filter Rute">
        <i data-lucide="route" width="20"></i>
      </button>
      <button id="btn-layers" class="icon-btn map-controls__btn" type="button" aria-label="Kelola lapisan" aria-expanded="false" aria-controls="layer-panel" title="Lapisan">
        <i data-lucide="layers" width="20"></i>
      </button>
      <button id="btn-log" class="icon-btn map-controls__btn" type="button" aria-label="Status sinkronisasi log" aria-expanded="false" aria-controls="log-panel" title="Status Sinkronisasi">
        <i data-lucide="cloud" width="20"></i>
      </button>
    </div>

    <div class="zoom-controls" aria-label="Zoom">
      <button id="btn-zoom-in" class="icon-btn" type="button" aria-label="Perbesar"><i data-lucide="plus" width="20"></i></button>
      <button id="btn-zoom-out" class="icon-btn" type="button" aria-label="Perkecil"><i data-lucide="minus" width="20"></i></button>
    </div>

    <!-- Panel Filter Rute -->
    <div id="route-panel" class="layer-panel route-panel" aria-label="Filter rute">
      <div class="layer-panel__header">
        <h2 class="layer-panel__title">Filter Rute BST</h2>
        <button class="panel-close icon-btn" type="button" aria-label="Tutup panel"><i data-lucide="x" width="18"></i></button>
      </div>
      <div id="route-list" class="route-list">
        <!-- Terisi via JavaScript -->
      </div>
    </div>

    <!-- Panel Lapisan Peta -->
    <div id="layer-panel" class="layer-panel" aria-label="Panel lapisan">
      <div class="layer-panel__header">
        <h2 class="layer-panel__title">Lapisan Peta</h2>
        <button class="panel-close icon-btn" type="button" aria-label="Tutup panel"><i data-lucide="x" width="18"></i></button>
      </div>
      <label class="layer-item">
        <input type="checkbox" data-layer="destinations" checked>
        <span>Destinasi Wisata</span>
      </label>
      <label class="layer-item">
        <input type="checkbox" data-layer="bst-stops" checked>
        <span>Halte BST</span>
      </label>
      <label class="layer-item">
        <input type="checkbox" data-layer="krl-stops">
        <span>Stasiun KRL</span>
      </label>
      <label class="layer-item">
        <input type="checkbox" data-layer="bst-routes" checked>
        <span>Rute BST</span>
      </label>
    </div>

    <!-- Activity Sync Status -->
    <div id="log-panel" class="layer-panel log-panel" aria-label="Status sinkronisasi log">
      <div class="layer-panel__header">
        <h2 class="layer-panel__title">Status Log</h2>
        <button class="panel-close icon-btn" type="button" aria-label="Tutup panel"><i data-lucide="x" width="18"></i></button>
      </div>
      <p class="log-panel__count">Buffer lokal: <strong id="log-count">0</strong> entri</p>
      <p class="log-panel__count" style="margin-top:4px;">Sinkron terakhir: <strong id="log-last-sync">—</strong></p>
      <p class="log-panel__hint">Log aktivitas dikirim otomatis ke server. Hanya pemilik web yang bisa mengaksesnya.</p>
      <div class="log-panel__actions">
        <button id="log-sync-now" class="btn btn--primary" type="button"><i data-lucide="cloud-upload" width="14"></i> Sinkron Sekarang</button>
      </div>
    </div>

    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="loading-overlay" class="loading-overlay" aria-busy="true">
      <div class="spinner" aria-hidden="true"></div>
      <p>Memuat data peta...</p>
    </div>
  </main>

  <section id="bottomsheet" class="bottomsheet" aria-hidden="true" aria-label="Detail destinasi">
    <header class="bottomsheet__handle" aria-label="Geser untuk menyesuaikan">
      <span class="bottomsheet__handle-bar" aria-hidden="true"></span>
    </header>
    <div id="bottomsheet-content" class="bottomsheet__content"></div>
  </section>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script type="module" src="js/map-app.js?v=<?= filemtime(__DIR__ . '/js/map-app.js') ?>"></script>
</body>
</html>