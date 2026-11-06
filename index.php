<?php
$destData  = [];
$modesData = [];

function normalizeTags($raw)
{
    if (empty($raw)) {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }

    $tags = [];
    foreach ($decoded as $value) {
        if (is_string($value) && trim($value) !== '') {
            $tags[] = trim($value);
        }
    }

    return $tags;
}

try {
    require_once __DIR__ . '/api/db.php';

    $modesRaw = db()->query(
        "SELECT id, slug, name, icon, color FROM transport_modes WHERE slug <> 'angkot' ORDER BY id"
    )->fetchAll();

    foreach ($modesRaw as $m) {
        $modesData[] = [
            'id'    => (int) $m['id'],
            'slug'  => $m['slug'],
            'name'  => $m['name'],
            'icon'  => $m['icon'],
            'color' => 'var(--mode-' . $m['slug'] . ')',
        ];
    }

    $destRaw = db()->query(
        'SELECT id, name, category, description AS descr, tags, latitude, longitude, image_url AS img FROM destinations ORDER BY id'
    )->fetchAll();

    $routesRaw = db()->query(
        'SELECT r.destination_id, m.slug AS mode_slug, r.description, r.fare, r.duration_minutes FROM routes r JOIN transport_modes m ON m.id = r.mode_id WHERE m.slug <> \'angkot\' ORDER BY r.destination_id, r.duration_minutes'
    )->fetchAll();

    $routesByDest = [];
    foreach ($routesRaw as $r) {
        $did = (int) $r['destination_id'];
        $routesByDest[$did][] = [
            $r['mode_slug'],
            $r['description'],
            $r['fare'],
            $r['duration_minutes'] . ' menit',
        ];
    }

    foreach ($destRaw as $d) {
        $id = (int) $d['id'];
        $destData[] = [
            'id'       => $id,
            'name'     => $d['name'],
            'category' => $d['category'],
            'desc'     => $d['descr'],
            'tags'     => normalizeTags($d['tags']),
            'coords'   => [(float) $d['latitude'], (float) $d['longitude']],
            'img'      => $d['img'],
            'options'  => isset($routesByDest[$id]) ? $routesByDest[$id] : [],
        ];
    }

} catch (Throwable $e) {
    error_log('RuteSolo page data error: ' . $e->getMessage());
    $destData  = [];
    $modesData = [];
}

// Cadangan destinasi: kalau database kosong/gagal ATAU jumlahnya lebih sedikit dari
// data/destinations.json, pakai file JSON (supaya semua destinasi tetap tampil).
$destFile = __DIR__ . '/data/destinations.json';
if (is_file($destFile)) {
    $decodedDest = json_decode((string) file_get_contents($destFile), true);
    if (is_array($decodedDest) && count($decodedDest) > count($destData)) {
        $destData = [];
        foreach ($decodedDest as $d) {
            $opts = [];
            foreach ((isset($d['options']) && is_array($d['options'])) ? $d['options'] : [] as $o) {
                if (!is_array($o) || ($o['mode'] ?? '') === 'angkot') {
                    continue;
                }
                $opts[] = [$o['mode'] ?? '', $o['description'] ?? '', $o['fare'] ?? '', $o['duration'] ?? ''];
            }
            $destData[] = [
                'id'       => (int) ($d['id'] ?? 0),
                'name'     => $d['name'] ?? '',
                'category' => $d['category'] ?? '',
                'desc'     => $d['description'] ?? '',
                'tags'     => isset($d['tags']) && is_array($d['tags']) ? $d['tags'] : [],
                'coords'   => [(float) ($d['latitude'] ?? 0), (float) ($d['longitude'] ?? 0)],
                'img'      => $d['image_url'] ?? '',
                'options'  => $opts,
            ];
        }
    }
}

$stopsData = [];
try {
    $stopsRaw = db()->query(
        'SELECT s.id, s.stop_name, s.latitude, s.longitude, svc.route_code, svc.is_departure_hub
         FROM transport_stops s
         LEFT JOIN route_stop_services svc ON svc.stop_id = s.id
         ORDER BY s.id, svc.route_code'
    )->fetchAll();

    $stopsById = [];
    foreach ($stopsRaw as $row) {
        $sid = (int) $row['id'];
        if (!isset($stopsById[$sid])) {
            $stopsById[$sid] = [
                $sid,
                $row['stop_name'],
                (float) $row['latitude'],
                (float) $row['longitude'],
                [],
                0,
            ];
        }
        if ($row['route_code'] !== null) {
            $stopsById[$sid][4][] = $row['route_code'];
            if (!empty($row['is_departure_hub'])) {
                $stopsById[$sid][5] = 1;
            }
        }
    }
    $stopsData = array_values($stopsById);
} catch (Throwable $e) {
    error_log('RuteSolo stops data error: ' . $e->getMessage());
    $stopsData = [];
}

// Cadangan: kalau database gagal/kosong, pakai data/stops.json (format baris sama)
if (empty($stopsData)) {
    $stopsFile = __DIR__ . '/data/stops.json';
    if (is_file($stopsFile)) {
        $decodedStops = json_decode((string) file_get_contents($stopsFile), true);
        if (is_array($decodedStops)) {
            $stopsData = $decodedStops;
        }
    }
}

$jsonFlags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
$destJson  = json_encode($destData, $jsonFlags);
$modesJson = json_encode($modesData, $jsonFlags);
$stopsJson = json_encode($stopsData, $jsonFlags);
$destJson  = $destJson === false ? '[]' : $destJson;
$modesJson = $modesJson === false ? '[]' : $modesJson;
$stopsJson = $stopsJson === false ? '[]' : $stopsJson;
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content">
    <meta name="color-scheme" content="dark light">
    <meta name="theme-color" content="#121510">
    <meta name="description" content="Temukan destinasi wisata Solo dan cara tercepat mencapainya dengan BST, KRL, atau ojol.">
    <title>RuteSolo - Panduan Wisata Kota Solo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="styles.css?v=<?php echo @filemtime(__DIR__ . '/styles.css') ?: time(); ?>">
    <script>
    (function(){
        var t; try{t=localStorage.getItem('theme');}catch(e){}
        if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
        document.documentElement.dataset.theme=t;
    })();
    </script>
</head>
<body>

<header class="navbar" id="navbar">
    <div class="container navin">
        <a href="#beranda" class="brand">
            <div class="brand-icon" aria-hidden="true"><i data-lucide="map-pin-check"></i></div>
            RuteSolo
        </a>
        <nav id="mainNav" aria-label="Navigasi utama">
            <a href="#beranda">Beranda</a>
            <a href="#destinasi">Destinasi</a>
            <a href="#rencana">Planner</a>
            <a href="#tentang">Tentang</a>
        </nav>
        <div class="nav-actions">
            <div class="nav-search-wrap">
                <button class="search-trigger" id="searchTrigger" aria-label="Cari destinasi">
                    <i data-lucide="search" width="17" height="17"></i>
                </button>
                <div class="nav-search-dropdown" id="navSearchDropdown" hidden>
                    <div class="search-box">
                        <i data-lucide="search" aria-hidden="true"></i>
                        <input id="searchInput" type="text"
                               placeholder="Cari destinasi..."
                               autocomplete="off" aria-label="Cari destinasi wisata">
                    </div>
                    <div class="suggestions" id="suggestions" hidden
                         role="listbox" aria-label="Hasil pencarian"></div>
                </div>
            </div>
            <button class="theme-toggle" id="themeToggle" aria-label="Aktifkan light mode" aria-pressed="true">
                <i data-lucide="moon" class="icon-moon" width="17" height="17"></i>
                <i data-lucide="sun"  class="icon-sun"  width="17" height="17" style="display:none"></i>
            </button>
            <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Buka menu" aria-expanded="false">
                <i data-lucide="menu" id="menuIcon"  width="20"></i>
                <i data-lucide="x"   id="closeIcon" width="20" style="display:none"></i>
            </button>
        </div>
    </div>
</header>

<div id="navOverlay" class="nav-overlay" aria-hidden="true"></div>

<main id="beranda">

    <section class="hero">
        <div class="hero-noise" aria-hidden="true"></div>
        <div class="container hero-content">

            <span class="eyebrow">
                <i data-lucide="sparkles" aria-hidden="true"></i>
                Panduan wisata lokal &middot; Surakarta
            </span>

            <h1>
                Jelajahi <span class="gradient-text">Solo</span>,<br>
                mulai dari sini.
            </h1>

            <p class="hero-sub">
                Temukan destinasi budaya, kuliner, dan rekreasi favorit
                beserta pilihan transportasi terbaik menuju ke sana.
            </p>

            <div class="chips" id="chips" role="group" aria-label="Filter moda transportasi"></div>

            <p class="hero-note">
                <i data-lucide="shield-check" width="13" aria-hidden="true"></i>
                Rute untuk perjalanan di dalam kota Solo
            </p>

        </div>
        <div class="hero-orb hero-orb--1" aria-hidden="true"></div>
        <div class="hero-orb hero-orb--2" aria-hidden="true"></div>
        <div class="hero-orb hero-orb--3" aria-hidden="true"></div>
    </section>


    <section class="section" id="destinasi" aria-labelledby="dest-heading">
        <div class="container">
            <div class="discovery-intro">
                <div>
                    <span class="section-kicker">Temukan pengalamanmu</span>
                    <h2 id="dest-heading">Wisata paling populer</h2>
                </div>
                <p>Pilih destinasi untuk melihat opsi transportasi yang tersedia.</p>
            </div>
            <div class="category-tabs-wrap" role="group" aria-label="Filter kategori destinasi">
                <div class="category-tabs" id="categoryTabs"></div>
            </div>
            <div id="content"></div>
        </div>
    </section>

    <div class="container"><div class="divider"></div></div>


    <section class="section" id="rencana" aria-labelledby="planner-heading">
        <div class="container">
            <div class="section-header">
                <span class="section-kicker">Biar gak nyasar</span>
                <h2 id="planner-heading">Rencanakan perjalananmu</h2>
            </div>
            <div class="planner">
                <div class="planner-form">
                    <div class="planner-form-header">
                        <div class="planner-step-badge" aria-hidden="true">01</div>
                        <div>
                            <h3>Titik berangkat</h3>
                            <p class="planner-help">GPS, klik peta, atau isi koordinat manual.</p>
                        </div>
                    </div>
                    <div class="origin-actions">
                        <button type="button" class="btn-outline" id="useLocation">
                            <i data-lucide="locate-fixed" width="15" aria-hidden="true"></i> Lokasi saya
                        </button>
                        <button type="button" class="btn-outline" id="pickOnMap">
                            <i data-lucide="mouse-pointer-2" width="15" aria-hidden="true"></i> Pilih di peta
                        </button>
                    </div>
                    <div class="planner-fields">
                        <div class="field-wrap">
                            <input id="originLat" type="number" step="any" placeholder=" " aria-label="Latitude titik awal">
                            <label for="originLat">Latitude</label>
                        </div>
                        <div class="field-wrap">
                            <input id="originLng" type="number" step="any" placeholder=" " aria-label="Longitude titik awal">
                            <label for="originLng">Longitude</label>
                        </div>
                    </div>
                    <div class="field-wrap field-wrap--search">
                        <input id="routeDestinationSearch" type="text" placeholder=" " autocomplete="off" spellcheck="false"
                               role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="routeDestinationList"
                               aria-label="Cari destinasi wisata">
                        <label for="routeDestinationSearch">Cari destinasi wisata</label>
                        <input type="hidden" id="routeDestination">
                        <ul class="dest-suggest" id="routeDestinationList" role="listbox" hidden></ul>
                    </div>
                    <div class="field-wrap">
                        <select id="routeMode" aria-label="Pilih moda transportasi">
                            <option value="public">Transportasi umum (BST / KRL)</option>
                            <option value="bst">BST</option>
                            <option value="krl">KRL</option>
                            <option value="ojol">Ojol last-mile</option>
                        </select>
                        <label for="routeMode">Moda utama</label>
                    </div>
                    <button type="button" class="btn-primary btn-submit" id="findRoute">
                        <i data-lucide="route" width="16" aria-hidden="true"></i>
                        Cari Rute
                        <span class="btn-shine" aria-hidden="true"></span>
                    </button>
                    <p class="planner-status" id="plannerStatus" role="status" aria-live="polite"></p>
                </div>
                <div class="planner-result" id="plannerResult">
                    <div class="planner-empty">
                        <div class="planner-empty-icon" aria-hidden="true">
                            <i data-lucide="map" width="26"></i>
                        </div>
                        <strong>Rute muncul di sini</strong>
                        <span>Isi titik awal dan pilih destinasi dulu.</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section section--map-cta" aria-labelledby="map-cta-heading">
        <div class="container">
            <div class="map-cta-card">
                <div class="map-cta-content">
                    <span class="section-kicker">Peta Interaktif</span>
                    <h2 id="map-cta-heading">Jelajahi Solo Lebih Dalam</h2>
                    <p>Gunakan peta interaktif kami untuk melihat rute transportasi, menemukan halte terdekat, dan merencanakan perjalanan Anda dengan lebih mudah.</p>
                    <a href="KotaSolo_Map/index.php" class="btn-primary btn-cta-map">
                        <i data-lucide="map" width="18" aria-hidden="true"></i> Buka Peta Interaktif Solo
                        <span class="btn-shine" aria-hidden="true"></span>
                    </a>
                </div>
                <div class="map-cta-visual" aria-hidden="true">
                    <!-- Ilustrasi dekoratif atau gambar statis peta -->
                    <div class="map-cta-grid"></div>
                    <div class="map-cta-pin"><i data-lucide="map-pin" width="24"></i></div>
                </div>
            </div>
        </div>
    </section>

    <div class="container"><div class="divider"></div></div>


    <section class="section" id="galeri" aria-labelledby="gallery-heading">
        <div class="container">
            <div class="section-header">
                <h2 id="gallery-heading">Wajah kota Solo</h2>
            </div>
            <div class="gallery">
                <div class="gallery-stage" id="galleryStage"></div>
            </div>
        </div>
    </section>

    <section class="section section--photos" id="foto-singkat" aria-label="Pilih foto">
        <div class="container">
            <div class="photo-grid" id="dots" role="tablist" aria-label="Pilih foto"></div>
        </div>
    </section>

</main>


<footer class="footer" id="tentang">
    <div class="container footer-inner">
        <div class="footer-brand">
            <div class="brand-icon brand-icon--sm" aria-hidden="true">
                <i data-lucide="map-pin-check"></i>
            </div>
            RuteSolo
        </div>
        <div class="footer-collab">
            <a href="https://www.instagram.com/transportforsolo?obrf=bWxrZHQ1eHF1bWhy" target="_blank" rel="noopener noreferrer">
                <img class="footer-logo" src="assets/images/logo-tfslo.png" alt="Logo TFSLO">
            </a>
            <div class="footer-collab-names">
                <span class="footer-collab-x" aria-hidden="true">✕</span>
                <span>Damar, Fahmi, Firman &amp; Parama</span>
            </div>
        </div>
    </div>
</footer>

<!-- RuteSolo AI Chatbot -->
<div class="ai-chat-container" id="aiChatContainer">
    <div class="ai-chat-header">
        <div class="ai-chat-header-info">
            <div class="brand-icon brand-icon--sm" aria-hidden="true">
                <i data-lucide="map-pin-check"></i>
            </div>
            <div>
                <h3>RuteSolo AI</h3>
                <p>Asisten Wisata Solo</p>
            </div>
        </div>
        <button class="ai-chat-close" id="aiChatClose" aria-label="Tutup chat">
            <i data-lucide="x" width="20"></i>
        </button>
    </div>
    <div class="ai-chat-messages" id="aiChatMessages">
        <!-- Messages will be injected here -->
    </div>
    <div class="ai-chat-input-area">
        <input type="text" id="aiChatInput" placeholder="Tanya rekomendasi tempat..." autocomplete="off" />
        <button id="aiChatSend" aria-label="Kirim pesan">
            <i data-lucide="send" width="18"></i>
        </button>
    </div>
</div>

<button class="ai-fab" id="aiFab" aria-label="Buka RuteSolo AI">
    <i data-lucide="map-pin-check"></i>
</button>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
window.__DEST__  = <?php echo $destJson; ?>;
window.__MODES__ = <?php echo $modesJson; ?>;
window.__STOPS__ = <?php echo $stopsJson; ?>;
</script>
<?php
$jsFiles = ['config', 'constants', 'data', 'utils', 'state', 'transit-config', 'transit-routes', 'schedule-data', 'schedule', 'place-info', 'favorites', 'layout', 'gallery', 'hero', 'ui', 'map', 'stops', 'planner', 'ai', 'main', 'mobile'];
foreach ($jsFiles as $jsFile) {
    $jsPath = 'js/' . $jsFile . '.js';
    $jsVer  = @filemtime(__DIR__ . '/' . $jsPath) ?: time();
    echo '<script src="' . $jsPath . '?v=' . $jsVer . '"></script>' . "\n";
}
?>
</body>
</html>
