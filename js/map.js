/* RuteSolo - Inisialisasi peta Leaflet */

const MAP_DEFAULT = { center: [-7.5670, 110.8300], zoomDesktop: 13, zoomMobile: 12 };

function mapDefaultZoom() {
    return window.innerWidth < 800 ? MAP_DEFAULT.zoomMobile : MAP_DEFAULT.zoomDesktop;
}

/* Marker destinasi wisata (diisi di initMap) + tombol filter kategori di atas peta. */
const destMarkers = [];

function initDestToggles() {
    if (!map || !destMarkers.length) return;
    let box = document.getElementById('destToggles');
    if (!box) {                              // index.php belum diperbarui → buat wadahnya lewat JS
        const after = document.getElementById('routeToggles');
        if (!after || !after.parentNode) return;
        box = document.createElement('div');
        box.id = 'destToggles';
        box.className = 'bst-map-toggles dest-map-toggles';
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', 'Tampilkan destinasi wisata per kategori');
        after.parentNode.insertBefore(box, after.nextSibling);
    }
    box.innerHTML = '';

    const cats = [...new Set(destMarkers.map(d => d.category))].sort();
    let active = null;                       // null = semua kategori tampil
    const buttons = [];

    function makeButton(label, icon, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-outline bst-map-toggle dest-map-toggle';
        b.innerHTML = '<i data-lucide="' + icon + '"></i><span></span>';
        b.lastChild.textContent = label;
        b.addEventListener('click', onClick);
        box.appendChild(b);
        return b;
    }

    function apply(fit) {
        const shown = [];
        destMarkers.forEach(d => {
            const show = !active || d.category === active;
            if (show && !map.hasLayer(d.marker)) d.marker.addTo(map);
            if (!show && map.hasLayer(d.marker)) map.removeLayer(d.marker);
            if (show) shown.push(d.marker.getLatLng());
        });
        buttons.forEach(b => {
            const on = b.cat === active;
            b.el.classList.toggle('is-active', on);
            b.el.setAttribute('aria-pressed', String(on));
        });
        if (fit && active && shown.length) {
            try { map.fitBounds(L.latLngBounds(shown), { padding: [40, 40], maxZoom: 15 }); } catch (e) { /* abaikan */ }
        }
    }

    const title = document.createElement('span');
    title.className = 'bst-map-legend__title';
    title.textContent = 'Destinasi';
    box.appendChild(title);

    buttons.push({ cat: null, el: makeButton('Semua destinasi', 'map-pinned', () => { active = null; apply(false); }) });
    cats.forEach(cat => {
        const icon = (typeof CAT_ICONS !== 'undefined' && CAT_ICONS[cat]) || 'map-pin';
        const el = makeButton(cat, icon, () => { active = (active === cat) ? null : cat; apply(true); });
        el.title = 'Tampilkan hanya ' + cat + ' (klik lagi untuk semua)';
        buttons.push({ cat: cat, el: el });
    });

    apply(false);
    if (typeof createIconsSafe === 'function') createIconsSafe();
}

function initMap() {
    var mapElement = document.getElementById('map');
    if (!mapElement) return;
    if (!window.L || typeof window.L.map !== 'function') {
        mapElement.innerHTML = '<div class="map-error" role="alert">Peta tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.</div>';
        return;
    }

    const isMobile = window.innerWidth < 800;

    map = L.map('map', {
        center: MAP_DEFAULT.center,
        zoom: mapDefaultZoom(),
        zoomControl: !isMobile,
    });

    if (isMobile) L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (!DEST || !DEST.length) {
        L.marker([-7.5670, 110.8300]).addTo(map)
         .bindPopup('<div style="font-family:\'Plus Jakarta Sans\',sans-serif;padding:8px 10px;"><strong style="font-size:13px;color:#ec4899;">Data destinasi tidak tersedia</strong><br><span style="font-size:11px;color:#9ca3af;">Periksa koneksi database</span></div>')
         .openPopup();
    } else {
        DEST.forEach(destination => {
            const marker = L.marker(destination.coords).addTo(map);
            destMarkers.push({ marker: marker, category: destination.category });
            marker.bindPopup(`
                <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px 2px;">
                    <strong style="font-size:13px;color:#7c3aed;">${escapeHtml(destination.name)}</strong><br>
                    <span style="font-size:11px;color:#9ca3af;">${escapeHtml(destination.category)}</span>
                </div>
            `);
        });
    }

    map.on('click', event => {
        if (!selectingMapOrigin) return;
        setOrigin(event.latlng.lat, event.latlng.lng);
        selectingMapOrigin = false;
        document.getElementById('plannerStatus').textContent = 'Titik awal dipilih dari peta.';
    });

    setTimeout(() => map.invalidateSize(), 100);
    initDestToggles();
    loadBstRouteOverlay();
}
