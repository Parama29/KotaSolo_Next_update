/* RuteSolo - Perencana rute (titik awal, OSRM, ongkos) */

function setOrigin(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }
    document.getElementById('originLat').value = lat.toFixed(6);
    document.getElementById('originLng').value = lng.toFixed(6);
    if (!map) return true;
    if (originMarker) {
        originMarker.setLatLng([lat, lng]);
    } else {
        originMarker = L.marker([lat, lng]).addTo(map);
    }
    originMarker.bindPopup('Posisi awal perjalanan').openPopup();
    return true;
}



function resetMap() {
    const status = document.getElementById('plannerStatus');
    const result = document.getElementById('plannerResult');
    const select = document.getElementById('routeDestination');

    selectingMapOrigin = false;
    if (map) map.closePopup();
    if (originMarker && map) map.removeLayer(originMarker);
    originMarker = null;
    if (routeLayer && map) map.removeLayer(routeLayer);
    routeLayer = null;
    if (typeof HalteStops !== 'undefined') HalteStops.clearTrip();

    ['originLat', 'originLng'].forEach(id => { document.getElementById(id).value = ''; });
    if (select) {
        select.value = '';
        select.dispatchEvent(new Event('change'));
        const wrap = select.closest('.field-wrap');
        if (wrap) wrap.classList.remove('field-wrap--active');
    }
    const modeSel = document.getElementById('routeMode');
    if (modeSel) modeSel.value = 'public';
    if (result && result.dataset.emptyHtml !== undefined) {
        result.innerHTML = result.dataset.emptyHtml;
        createIconsSafe();
    }
    document.dispatchEvent(new CustomEvent('transit:reset'));
    if (map) map.setView(MAP_DEFAULT.center, mapDefaultZoom());
    if (status) status.textContent = 'Peta direset. Pilih titik awal dan destinasi baru.';
}

/* Kolom cari destinasi (pengganti dropdown).
 * Nilai destinasi tetap disimpan di <input type="hidden" id="routeDestination"> (berisi id),
 * jadi kode lain tetap cukup membaca/mengisi `#routeDestination` lalu memicu event "change". */
function initDestinationSearch(hidden) {
    const search = document.getElementById('routeDestinationSearch');
    const list   = document.getElementById('routeDestinationList');
    if (!hidden || !search || !list) return;

    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let items = [], active = -1;

    function matches(q) {
        const n = norm(q).trim();
        if (!n) return DEST.slice();
        const words = n.split(/\s+/);
        return DEST.filter(d => {
            const hay = norm(d.name + ' ' + (d.category || '') + ' ' + (d.tags || []).join(' '));
            return words.every(w => hay.indexOf(w) !== -1);
        }).sort((a, b) => {
            const as = norm(a.name).indexOf(n) === 0 ? 0 : 1, bs = norm(b.name).indexOf(n) === 0 ? 0 : 1;
            return as - bs;
        });
    }

    function highlight(name, q) {
        const n = norm(q).trim();
        const i = n ? norm(name).indexOf(n) : -1;
        if (i < 0) return escapeHtml(name);
        return escapeHtml(name.slice(0, i)) + '<mark>' + escapeHtml(name.slice(i, i + n.length)) + '</mark>' +
               escapeHtml(name.slice(i + n.length));
    }

    function render() {
        items = matches(search.value);
        active = items.length ? 0 : -1;
        list.innerHTML = items.length
            ? items.map((d, i) =>
                `<li role="option" id="dest-opt-${i}" data-id="${escapeHtml(d.id)}" class="${i === active ? 'is-active' : ''}">` +
                `<span class="dest-name">${highlight(d.name, search.value)}</span>` +
                `<small>${escapeHtml(d.category || '')}</small></li>`).join('')
            : '<li class="dest-empty" aria-disabled="true">Destinasi tidak ditemukan</li>';
        list.hidden = false;
        search.setAttribute('aria-expanded', 'true');
    }

    function close() {
        list.hidden = true;
        search.setAttribute('aria-expanded', 'false');
        search.removeAttribute('aria-activedescendant');
    }

    function setActive(i) {
        if (!items.length) return;
        active = (i + items.length) % items.length;
        list.querySelectorAll('li[role="option"]').forEach((li, k) => li.classList.toggle('is-active', k === active));
        const el = document.getElementById('dest-opt-' + active);
        if (el) { search.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' }); }
    }

    function choose(d) {
        search.value = d.name;
        hidden.value = String(d.id);
        hidden.dispatchEvent(new Event('change'));
        close();
    }

    // dipicu dari luar (tombol "Rute ke sini", reset peta): sinkronkan teks di kolom cari
    hidden.addEventListener('change', () => {
        const d = DEST.find(x => String(x.id) === hidden.value);
        search.value = d ? d.name : '';
    });

    search.addEventListener('focus', () => { search.select(); render(); });
    search.addEventListener('input', () => {
        if (hidden.value) {                           // mengetik ulang = batal pilihan lama
            const typed = search.value;
            hidden.value = ''; hidden.dispatchEvent(new Event('change'));
            search.value = typed;                     // listener change mengosongkan kolom, kembalikan ketikan
        }
        render();
        const exact = DEST.filter(d => norm(d.name) === norm(search.value).trim());
        if (exact.length === 1) hidden.value = String(exact[0].id);   // ketik nama persis → langsung terpilih
    });
    search.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(); else setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Enter') { if (!list.hidden && items[active]) { e.preventDefault(); choose(items[active]); } }
        else if (e.key === 'Escape') { close(); }
    });
    search.addEventListener('blur', () => {
        setTimeout(() => {
            close();
            if (!hidden.value) {                       // teks tidak cocok persis: kosongkan agar tidak menyesatkan
                const one = matches(search.value);
                if (search.value.trim() && one.length === 1) choose(one[0]);
                else if (search.value.trim()) search.value = '';
            }
        }, 120);
    });
    list.addEventListener('mousedown', e => {          // mousedown agar terjadi sebelum blur
        const li = e.target.closest('li[role="option"]');
        if (!li) return;
        e.preventDefault();
        const d = DEST.find(x => String(x.id) === li.getAttribute('data-id'));
        if (d) choose(d);
    });
    document.addEventListener('click', e => { if (!e.target.closest('.field-wrap--search')) close(); });

}

function initRoutePlanner() {
    const destinationSelect = document.getElementById('routeDestination');
    const status            = document.getElementById('plannerStatus');
    const result            = document.getElementById('plannerResult');
    result.dataset.emptyHtml = result.innerHTML; // simpan tampilan awal untuk reset
    document.querySelectorAll('[data-reset-map]').forEach(btn => btn.addEventListener('click', resetMap));
    initDestinationSearch(destinationSelect);
    destinationSelect.addEventListener('change', function() {
        const wrap = this.closest('.field-wrap');
        if (wrap) wrap.classList.toggle('field-wrap--active', this.value !== '');
    });

    const locBtn = document.getElementById('useLocation');
    locBtn.onclick = () => {
        if (!window.isSecureContext) {
            status.textContent = 'GPS hanya jalan di HTTPS. Buka situs lewat https:// atau isi koordinat manual.';
            return;
        }
        if (!navigator.geolocation) {
            status.textContent = 'Browser tidak mendukung lokasi perangkat.';
            return;
        }
        locBtn.disabled = true;
        status.textContent = 'Mencari lokasi... (izinkan akses lokasi jika diminta)';

        const done = () => { locBtn.disabled = false; };
        const ok = pos => {
            done();
            setOrigin(pos.coords.latitude, pos.coords.longitude);
            if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 15);
            status.textContent = 'Lokasi awal berhasil digunakan (akurasi \u00b1' + Math.round(pos.coords.accuracy) + ' m).';
        };
        const fail = err => {
            done();
            const msg = {
                1: 'Izin lokasi ditolak. Ketuk ikon gembok di address bar > Izin > Lokasi > Izinkan, lalu coba lagi.',
                2: 'Lokasi tidak terdeteksi. Pastikan GPS/Lokasi HP aktif.',
                3: 'Waktu pencarian lokasi habis. Coba lagi di tempat terbuka atau klik peta.'
            };
            status.textContent = msg[err && err.code] || 'Lokasi tidak tersedia. Klik peta atau isi koordinat.';
        };

        // Coba cepat (jaringan/wifi) dulu, kalau gagal baru GPS akurasi tinggi.
        navigator.geolocation.getCurrentPosition(ok, err => {
            if (err && err.code === 1) return fail(err);
            status.textContent = 'Mencoba GPS akurasi tinggi...';
            navigator.geolocation.getCurrentPosition(ok, fail,
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
        }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    };

    document.getElementById('pickOnMap').onclick = () => {
        if (!map) {
            status.textContent = 'Peta belum tersedia. Isi koordinat secara manual.';
            return;
        }
        selectingMapOrigin = true;
        status.textContent = 'Klik titik awal pada peta di bawah.';
        map.getContainer().scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    document.getElementById('findRoute').onclick = async () => {
        const lat         = Number(document.getElementById('originLat').value);
        const lng         = Number(document.getElementById('originLng').value);
        const destination = DEST.find(item => item.id === Number(destinationSelect.value));
        const selectedMode = document.getElementById('routeMode').value;

        if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180 || !destination) {
            status.textContent = 'Isi posisi awal dan pilih destinasi terlebih dahulu.';
            return;
        }

        if (selectedMode !== 'public' && selectedMode !== 'all' &&
            !destination.options.some(o => o[0] === selectedMode)) {
            status.textContent = 'Moda ini tidak tersedia untuk destinasi tersebut. Pilih moda lain.';
            return;
        }

        status.textContent = 'Menghitung rute jalan...';
        result.classList.add('loading');

        try {
            const coords   = `${lng},${lat};${destination.coords[1]},${destination.coords[0]}`;
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
            );
            if (!response.ok) throw new Error('Routing unavailable');

            const data = await response.json();
            if (!data.routes || !data.routes.length) throw new Error('No route');

            if (!map || !window.L) throw new Error('Map unavailable');
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#7c3aed', weight: 5, opacity: 0.85 }
            });

            // Halte naik/turun terdekat (hanya untuk moda transportasi umum / BST)
            let trip = null;
            const useStops = HalteStops.list.length > 0 &&
                (selectedMode === 'public' || selectedMode === 'bst' || selectedMode === 'all');
            HalteStops.clearTrip();
            if (useStops) {
                trip = HalteStops.planTrip([lat, lng], destination.coords);
                if (trip) trip.path = HalteStops.transitPath(trip);
                if (trip && typeof TransitSchedule !== 'undefined') trip.timeline = TransitSchedule.annotate(trip);
            }
            const tripBounds = trip ? HalteStops.drawTrip(trip) : null;
            const followsTransit = !!(trip && trip.path);
            const bounds = L.latLngBounds([]);
            if (!followsTransit) { routeLayer.addTo(map); bounds.extend(routeLayer.getBounds()); }
            if (tripBounds) bounds.extend(tripBounds);
            map.fitBounds(bounds, { padding: [30, 30] });

            const distance  = (data.routes[0].distance / 1000).toFixed(1);
            const duration  = Math.ceil(data.routes[0].duration / 60);
            const modeLabel = selectedMode === 'public' ? 'BST/KRL' : (mode(selectedMode) || {}).label || selectedMode;
            var km = parseFloat(distance);
            var ef = ENTRY_FEES[destination.id] || { fee: 0, free: true, note: '' };

            var modesFareCalc = [];
            if (selectedMode === 'public' || selectedMode === 'bst' || selectedMode === 'all') {
                modesFareCalc.push({ id:'bst',    label:'BST Batik Solo Trans', fare:3700,  fareStr:'Rp 3.700', fareMax:3700,  note:'Tarif flat, tidak per km' });
            }
            if (selectedMode === 'public' || selectedMode === 'krl' || selectedMode === 'all') {
                modesFareCalc.push({ id:'krl',    label:'KRL Commuter Line',    fare:8000,  fareStr:'Rp 8.000', fareMax:8000,  note:'Tarif flat Solo-Jogja' });
            }
            if (selectedMode === 'ojol' || selectedMode === 'all') {
                var ojolBase = Math.round(km * 2000 / 500) * 500 + 2500;
                var ojolMin  = Math.max(7000, Math.round(ojolBase * 0.9 / 500) * 500);
                var ojolMax  = Math.max(ojolMin, Math.round(ojolBase * 1.15 / 500) * 500);
                modesFareCalc.push({ id:'ojol', label:'Ojol (GoRide/GrabBike)', fare:ojolMin, fareMax:ojolMax,
                    fareStr: ojolMin===ojolMax ? formatRp(ojolMin) : formatRp(ojolMin)+' - '+formatRp(ojolMax),
                    note:'Rp 2.000/km + booking Rp 2.500' });
            }
            var availModes = destination.options.map(function(o){return o[0];});
            modesFareCalc = modesFareCalc.filter(function(m){ return availModes.indexOf(m.id) !== -1; });
            if (!modesFareCalc.length) {
                if (selectedMode !== 'public' && selectedMode !== 'all') {
                    throw new Error('Selected transport mode unavailable');
                }
                modesFareCalc = destination.options.map(function(o){
                    var fare = parseFare(o[2]);
                    var m = mode(o[0]);
                    return { id:o[0], label:m.label, fare:fare.min, fareMax:fare.max,
                             fareStr:fare.min===fare.max?formatRp(fare.min):formatRp(fare.min)+' - '+formatRp(fare.max),
                             note:o[1] };
                });
            }

            var modeRows = modesFareCalc.map(function(m) {
                return '<div class="pr-mode-row">'
                     + '<div class="pr-mode-left">'
                     + '<span class="pr-mode-dot" style="background:var(--mode-'+m.id+')"></span>'
                     + '<div class="pr-mode-info"><span class="pr-mode-name">'+escapeHtml(m.label)+'</span>'
                     + '<span class="pr-mode-note">'+escapeHtml(m.note)+'</span></div>'
                     + '</div>'
                     + '<span class="pr-mode-fare" style="color:var(--mode-'+m.id+')">'+m.fareStr+'</span>'
                     + '</div>';
            }).join('');

            var cheapest = modesFareCalc.length ? Math.min.apply(null, modesFareCalc.map(function(m){return m.fare;})) : 0;
            var priciest = modesFareCalc.length ? Math.max.apply(null, modesFareCalc.map(function(m){return m.fareMax||m.fare;})) : 0;
            var totalMin = cheapest + ef.fee;
            var totalMax = priciest + ef.fee;
            var totalStr = totalMin===totalMax ? formatRp(totalMin) : formatRp(totalMin)+' - '+formatRp(totalMax);

            result.innerHTML =
                '<div class="pr-result">'
              + '<div class="pr-header">'
              + '<i data-lucide="route" width="20"></i>'
              + '<div><strong class="pr-dest-name">'+escapeHtml(destination.name)+'</strong>'
              + '<span class="pr-route-info">'+distance+' km &nbsp;&middot;&nbsp; '
              + (trip && trip.timeline
                    ? 'BST sekitar '+trip.timeline.totalMin+' menit, tiba ±'+TransitSchedule.fmt(trip.timeline.arriveDest)
                    : 'sekitar '+duration+' menit')
              + '</span>'
              + '</div></div>'
              + (useStops ? HalteStops.tripHtml(trip) : '')
              + '<div class="pr-section-label"><i data-lucide="bus" width="12"></i> Estimasi ongkos transport</div>'
              + '<div class="pr-mode-list">'+modeRows+'</div>'
              + '<div class="pr-divider"></div>'
              + '<div class="pr-ticket-row">'
              + '<span class="pr-ticket-label"><i data-lucide="ticket" width="13"></i> Tiket masuk</span>'
              + '<span class="pr-ticket-value'+(ef.free?' pr-ticket-free':'')+'">'+(ef.free?'Gratis':formatRp(ef.fee))+'</span>'
              + '</div>'
              + (ef.note?'<p class="pr-ticket-note">'+escapeHtml(ef.note)+'</p>':'')
              + '<div class="pr-total"><span>Total estimasi</span><strong class="pr-total-value">'+totalStr+'</strong></div>'
              + '<p class="pr-disclaimer">*Tarif dapat berubah. Cek info terbaru sebelum berangkat.</p>'
              + '</div>';
            status.textContent = 'Rute berhasil ditampilkan untuk ' + modeLabel + '.';
            createIconsSafe();
        } catch (error) {
            console.error('Route planner error:', error);
            status.textContent = 'Rute belum tersedia. Periksa koneksi atau gunakan panduan moda di kartu destinasi.';
        } finally {
            result.classList.remove('loading');
        }
    };
}
