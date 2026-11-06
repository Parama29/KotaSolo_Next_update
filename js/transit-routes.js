/* RuteSolo - Jalur BST/F/S di peta + filter rute */

// Geometri tiap rute (kode -> array segmen [[lng,lat],...]) supaya planner bisa ikut jalur BST.
const TransitGeometry = {};


function loadBstRouteOverlay() {
    const box    = document.getElementById('routeToggles');
    const legend = document.getElementById('routeLegend');
    const status = document.getElementById('bstRouteStatus');
    if (!map || !window.L || !box || !legend || !status) return;

    const groups = TRANSIT_GROUPS.map(g => Object.assign({}, g, {
        visible: true, loaded: 0, btn: null,
        routes: g.routes.map(r => Object.assign({}, r, { layer: null, btn: null }))
    }));
    groups.forEach(g => g.routes.forEach(r => { r.group = g; }));
    const routeList = groups.reduce((all, g) => all.concat(g.routes), []);
    let selectedCode = null;

    box.innerHTML = '';
    groups.forEach(g => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-outline bst-map-toggle';
        b.disabled = true;
        b.textContent = 'Memuat ' + g.label + '...';
        box.appendChild(b);
        g.btn = b;
    });
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn-outline bst-map-toggle';
    resetBtn.textContent = 'Tampilkan semua jalur';
    resetBtn.disabled = true;
    box.appendChild(resetBtn);

    legend.innerHTML = '';
    groups.forEach(g => {
        const title = document.createElement('span');
        title.className = 'bst-map-legend__title';
        title.textContent = g.id === 'bst' ? 'BST' : g.id.toUpperCase();
        legend.appendChild(title);
        g.routes.forEach(r => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'bst-legend-btn';
            b.style.setProperty('--route-color', r.color);
            b.setAttribute('aria-pressed', 'false');
            b.title = 'Tampilkan hanya rute ' + r.code;
            b.disabled = true;
            b.innerHTML = '<i></i>' + r.code;
            legend.appendChild(b);
            r.btn = b;
        });
    });

    function validSegment(segment) {
        return Array.isArray(segment) && segment.length >= 2 && segment.every(point =>
            Array.isArray(point) && point.length >= 2 &&
            Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
            point[0] >= -180 && point[0] <= 180 && point[1] >= -90 && point[1] <= 90);
    }

    async function loadRoute(route) {
        try {
            const response = await fetch(`${API_BASE}/transit-routes?route_code=${encodeURIComponent(route.code)}`);
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            const payload  = await response.json();
            const segments = payload && payload.data && payload.data.segments;
            if (!Array.isArray(segments) || !segments.length) throw new Error('Route geometry is missing');
            if (!segments.every(validSegment)) throw new Error('Route geometry contains invalid coordinates');
            TransitGeometry[route.code] = segments;
            route.layer = L.geoJSON({
                type: 'FeatureCollection',
                features: segments.map(s => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: s } }))
            }, {
                style: { color: route.color, weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: route.group.dash },
                bubblingMouseEvents: false
            });
            route.layer.bindPopup(route.group.popup + route.code);
            route.group.loaded++;
        } catch (error) {
            console.error(`Rute ${route.code} gagal dimuat:`, error);
        }
    }

    function applyVisibility() {
        routeList.forEach(r => {
            if (!r.layer) return;
            const show = selectedCode ? r.code === selectedCode : r.group.visible;
            if (show && !map.hasLayer(r.layer)) r.layer.addTo(map);
            if (!show && map.hasLayer(r.layer)) map.removeLayer(r.layer);
            r.layer.setStyle({ weight: selectedCode === r.code ? 6 : 4 });
            if (show && selectedCode === r.code) r.layer.bringToFront();
            r.btn.classList.toggle('is-active', selectedCode === r.code);
            r.btn.classList.toggle('is-dim', !!selectedCode && selectedCode !== r.code);
            r.btn.setAttribute('aria-pressed', String(selectedCode === r.code));
            r.btn.title = selectedCode === r.code
                ? 'Klik lagi untuk menampilkan semua jalur'
                : 'Tampilkan hanya rute ' + r.code;
        });
        groups.forEach(g => {
            if (!g.loaded) return;
            const shown = selectedCode ? g.routes.some(r => r.code === selectedCode) : g.visible;
            g.btn.textContent = (shown ? 'Sembunyikan ' : 'Tampilkan ') + g.label;
            g.btn.setAttribute('aria-pressed', String(shown));
        });
        resetBtn.disabled = !selectedCode && groups.every(g => !g.loaded || g.visible);

        const total  = routeList.length;
        const loaded = routeList.filter(r => r.layer).length;
        let text;
        if (selectedCode) {
            text = `Hanya rute ${selectedCode} ditampilkan. Klik lagi untuk menampilkan semua.`;
        } else {
            const shown = groups.filter(g => g.visible && g.loaded).map(g => g.label);
            text = shown.length ? `Ditampilkan: ${shown.join(', ')}.` : 'Semua jalur disembunyikan.';
        }
        if (loaded < total) text += ` ${loaded} dari ${total} rute berhasil dimuat.`;
        status.textContent = text;

        document.dispatchEvent(new CustomEvent('transit:visibility', {
            detail: { codes: routeList
                .filter(r => selectedCode ? r.code === selectedCode : r.group.visible)
                .map(r => r.code) }
        }));
    }

    function selectRoute(route) {
        if (selectedCode === route.code) {
            selectedCode = null;
            applyVisibility();
            return;
        }
        selectedCode = route.code;
        applyVisibility();
        try { map.fitBounds(route.layer.getBounds(), { padding: [30, 30] }); } catch (e) { /* bounds tidak tersedia */ }
    }

    Promise.all(routeList.map(loadRoute)).then(() => {
        if (!routeList.some(r => r.layer)) {
            status.textContent = 'Jalur gagal dimuat. Periksa koneksi API.';
        }
        groups.forEach(g => {
            if (!g.loaded) { g.btn.textContent = g.label + ' tidak tersedia'; return; }
            g.btn.disabled = false;
            g.btn.addEventListener('click', () => {
                selectedCode = null;
                g.visible = !g.visible;
                applyVisibility();
            });
        });
        routeList.forEach(r => {
            if (!r.layer) { r.btn.title = 'Rute ' + r.code + ' tidak tersedia'; return; }
            r.btn.disabled = false;
            r.btn.addEventListener('click', () => selectRoute(r));
        });
        resetBtn.addEventListener('click', () => {
            selectedCode = null;
            groups.forEach(g => { g.visible = true; });
            applyVisibility();
        });
        document.addEventListener('transit:reset', () => {
            selectedCode = null;
            groups.forEach(g => { g.visible = true; });
            applyVisibility();
        });
        if (routeList.some(r => r.layer)) applyVisibility();
    });
}
