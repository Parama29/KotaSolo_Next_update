/* RuteSolo - Info praktis tiap tempat: Instagram, alamat/lokasi, jam buka, telepon, website.
 *
 * Sumber: PDF "Projek Website FDTSLO x SMA ABBS" (IG, telepon, website, jam Astana Oetara,
 * sebagian alamat) + alamat yang dicek dari pemberitaan/direktori. Field yang kosong TIDAK ditampilkan
 * (kecuali jam buka: tampil "belum tersedia" supaya kelihatan masih perlu diisi).
 *
 * Cara menambah/mengubah: edit PLACE_INFO. `match` dicocokkan ke nama destinasi (tidak peka huruf besar).
 *   instagram : username tanpa @        address : alamat jalan        area : keterangan lokasi tambahan
 *   hours     : teks bebas, mis. 'Setiap hari · 08.00–17.00 WIB'      phone / website / note : opsional
 *   schedule  : jam buka TERSTRUKTUR untuk status "Buka sekarang / Tutup" (WIB). Daftar jendela waktu:
 *               [{ days:[0..6] (0=Minggu), open:'09:00', close:'15:00' }]  — kosongkan bila belum pasti.
 *   access    : kemudahan akses, semua opsional: { fee, parking, toilet, wudu, disabled, note }
 *               Hanya isi yang ada sumbernya; yang kosong disembunyikan.
 */
const PLACE_INFO = [
    { match: /masjid agung/i,
      instagram: 'masjidagungsurakarta', phone: '(0271) 643363',
      address: 'Jl. Masjid Agung No.1, Kauman, Pasar Kliwon, Surakarta 57122',
      area: 'Di sisi barat Alun-Alun Utara Keraton Kasunanan',
      access: { fee: 'Gratis' } },
    { match: /al.?wustho/i,
      phone: '(0271) 634648',
      address: 'Jl. Kartini No.3, Ketelan, Banjarsari, Surakarta',
      area: 'Di sebelah barat Pura Mangkunegaran' },
    { match: /zayed/i,
      instagram: 'masjidzayedsolo', phone: '0811-2902-666',
      address: 'Jl. Ahmad Yani, Kel. Gilingan, Kec. Banjarsari, Surakarta',
      access: {
          disabled: 'Tersedia lift untuk difabel, lansia, dan ibu hamil',
          parking: 'Area parkir sekitar masjid terbatas; bus wisata tidak boleh parkir dekat masjid (ada kantong parkir + shuttle, info 2023 — cek kondisi terbaru)'
      } },
    { match: /masjid laweyan/i,
      instagram: 'masjidlaweyan',
      address: 'Jl. Liris No.1, Belukan, Pajang, Laweyan, Surakarta',
      area: 'Di kawasan Kampung Batik Laweyan' },
    { match: /dhamma sundara|vihara/i,
      phone: '(0271) 643749',
      address: 'Jl. Ir. Juanda No. 223 B, Pucangsawit, Jebres, Surakarta' },
    { match: /indraprast/i,
      phone: '0818-0444-8188',
      area: 'Kel. Sondakan, Kec. Laweyan, Surakarta' },
    { match: /poo an kiong/i,
      instagram: 'pooankiong.solo', phone: '085198235135',
      address: 'Jl. Yos Sudarso No.122, Jayengan, Serengan, Surakarta',
      area: 'Di sebelah barat Pasar Klewer, kawasan Pecinan Solo' },
    { match: /margoyudan/i,
      instagram: 'gkj_margoyudan', phone: '(0271) 633311' },
    { match: /petrus/i,
      instagram: 'parokisantopetrus', phone: '(0271) 712300',
      area: 'Timur laut Perempatan Gendengan, kawasan Purwosari' },
    { match: /antonius/i,
      instagram: 'parokipurbayan', website: 'https://parokipurbayan.org/', phone: '(0271) 636324',
      area: 'Kawasan Purbayan, dekat Pasar Gede' },
    { match: /maria regina|regina/i,
      instagram: 'komsospurbowardayan', website: 'https://purbowardayan.com/', phone: '(0271) 654290',
      area: 'Kel. Tegalharjo, Kec. Jebres, Surakarta' },
    { match: /astana oetara/i,
      instagram: 'astanaoetaraofficial', website: 'https://www.astanaoetara.com/',
      hours: 'Selasa, Rabu, Kamis, Sabtu, Minggu · 09.00–15.00 WIB (melalui pendaftaran online)',
      schedule: [{ days: [2, 3, 4, 6, 0], open: '09:00', close: '15:00' }],
      access: { note: 'Kunjungan lewat pendaftaran online' } },
    { match: /langgar merdeka/i,
      address: 'Jl. Dr. Radjiman No. 565, Laweyan, Surakarta',
      area: 'Penunjuk arah ke Kampoeng Batik Laweyan' }
];

function getPlaceInfo(destination) {
    const name = destination && destination.name ? destination.name : '';
    return PLACE_INFO.find(function (p) { return p.match.test(name); }) || null;
}

/* ---------- status buka/tutup (WIB, real time) ---------- */

const PLACE_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function wibWeekdayMinutes(date) {
    const parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit',
        minute: '2-digit', hourCycle: 'h23' }).formatToParts(date || new Date())
        .forEach(function (p) { parts[p.type] = p.value; });
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return { day: day, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

const toMin = function (hhmm) { const m = String(hhmm).split(':'); return Number(m[0]) * 60 + Number(m[1]); };
const fmtHm = function (hhmm) { return hhmm.replace(':', '.') + ' WIB'; };

/* → { state: 'open'|'closed'|'unknown', text } */
function placeStatus(info, date) {
    if (!info || !info.schedule || !info.schedule.length) return { state: 'unknown', text: '' };
    const now = wibWeekdayMinutes(date);
    for (let i = 0; i < info.schedule.length; i++) {
        const w = info.schedule[i];
        if (w.days.indexOf(now.day) !== -1 && now.minutes >= toMin(w.open) && now.minutes < toMin(w.close)) {
            return { state: 'open', text: 'Buka sekarang · tutup ' + fmtHm(w.close) };
        }
    }
    for (let d = 0; d <= 7; d++) {
        const day = (now.day + d) % 7;
        const opens = info.schedule.filter(function (w) {
            return w.days.indexOf(day) !== -1 && (d > 0 || now.minutes < toMin(w.open));
        }).sort(function (a, b) { return toMin(a.open) - toMin(b.open); });
        if (opens.length) {
            const when = d === 0 ? 'hari ini' : d === 1 ? 'besok' : PLACE_DAYS[day];
            return { state: 'closed', text: 'Tutup · buka lagi ' + when + ' ' + fmtHm(opens[0].open) };
        }
    }
    return { state: 'closed', text: 'Tutup' };
}

function refreshPlaceStatus() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-place-status]').forEach(function (el) {
        const dest = findPlaceById(el.getAttribute('data-place-status'));
        const st = placeStatus(getPlaceInfo(dest));
        el.className = 'place-status place-status--' + st.state;
        el.textContent = st.text;
    });
}

/* ---------- helper umum ---------- */

function findPlaceById(id) {
    return (typeof DEST !== 'undefined' ? DEST : []).find(function (d) { return String(d.id) === String(id); }) || null;
}

function placeMapsUrl(dest) {
    return dest && dest.coords && dest.coords[0] != null
        ? 'https://www.google.com/maps/search/?api=1&query=' + dest.coords[0] + ',' + dest.coords[1] : '';
}

/* halte BST terdekat dari sebuah tempat (nama halte unik, maks `limit`, ≤ maxM meter) */
function nearestHalteFor(dest, limit, maxM) {
    if (!dest || typeof HalteStops === 'undefined' || !HalteStops.list || !HalteStops.list.length) return [];
    const seen = {};
    return HalteStops.nearestStops(dest.coords, 12).filter(function (n) {
        if (n.meters > (maxM || 1500) || seen[n.stop.name]) return false;
        return (seen[n.stop.name] = true);
    }).slice(0, limit || 3);
}

const walkMinutes = function (m) { return Math.max(1, Math.round(m / 75)); };
const distText = function (m) {
    return typeof formatDistance === 'function' ? formatDistance(m) : (m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km');
};

/* baris teks untuk itinerary / WhatsApp */
function placeTextLines(dest, compact) {
    const info = getPlaceInfo(dest) || {};
    const lines = [dest.name + (dest.category ? ' (' + dest.category + ')' : '')];
    if (info.address) lines.push('📍 ' + info.address);
    else if (info.area) lines.push('📍 ' + info.area);
    if (!compact && info.address && info.area) lines.push('   ' + info.area);
    const maps = placeMapsUrl(dest);
    if (maps) lines.push('🗺️ ' + maps);
    if (compact) return lines;
    if (info.hours) lines.push('🕒 ' + info.hours);
    if (info.instagram) lines.push('📷 https://www.instagram.com/' + info.instagram + '/');
    if (info.phone) lines.push('📞 ' + info.phone);
    const hs = nearestHalteFor(dest, 2);
    if (hs.length) {
        lines.push('🚌 Halte terdekat: ' + hs.map(function (n) {
            return n.stop.name + ' (' + distText(n.meters) + ', ±' + walkMinutes(n.meters) + ' mnt jalan)';
        }).join('; '));
    }
    return lines;
}

/* ---------- HTML info tempat, dipasang di bawah deskripsi (ui.js › renderResult) ---------- */

const ACCESS_LABELS = [
    ['fee', 'Tiket masuk', 'ticket'], ['parking', 'Parkir', 'car'], ['toilet', 'Toilet', 'bath'],
    ['wudu', 'Tempat wudu', 'droplets'], ['disabled', 'Ramah difabel', 'accessibility'], ['note', 'Catatan', 'info']
];

function placeInfoHtml(destination) {
    if (!destination) return '';
    const info = getPlaceInfo(destination) || {};
    const mapsUrl = placeMapsUrl(destination);
    const id = escapeHtml(destination.id);

    const igSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>' +
        '<circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';
    const lucide = function (name) { return '<i data-lucide="' + name + '" width="16"></i>'; };
    const link = function (href, text) {
        return '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(text) + '</a>';
    };
    const row = function (icon, label, body, extra) {
        return '<div class="place-row' + (extra ? ' ' + extra : '') + '"><span class="place-ic">' + icon +
               '</span><div><small>' + label + '</small>' + body + '</div></div>';
    };

    const rows = [];
    if (info.instagram) {
        rows.push(row(igSvg, 'Instagram', link('https://www.instagram.com/' + info.instagram + '/', '@' + info.instagram)));
    }
    if (info.address || info.area || mapsUrl) {
        let body = '';
        if (info.address) body += '<span>' + escapeHtml(info.address) + '</span>';
        if (info.area)    body += '<span class="place-sub">' + escapeHtml(info.area) + '</span>';
        if (mapsUrl)      body += '<span>' + link(mapsUrl, 'Buka di Google Maps') + '</span>';
        rows.push(row(lucide('map-pin'), 'Lokasi', body));
    }

    // jam buka + status real time
    const st = placeStatus(info);
    let hoursBody = '';
    if (st.state !== 'unknown') {
        hoursBody += '<span class="place-status place-status--' + st.state + '" data-place-status="' + id + '">' +
                     escapeHtml(st.text) + '</span>';
    }
    if (info.hours) hoursBody += '<span>' + escapeHtml(info.hours) + '</span>';
    rows.push(hoursBody
        ? row(lucide('clock'), 'Jam buka', hoursBody)
        : row(lucide('clock'), 'Jam buka',
              '<span class="place-sub">Belum tersedia — hubungi tempat atau cek Instagram-nya sebelum berkunjung.</span>',
              'place-row--muted'));

    // kemudahan akses
    const acc = info.access || {};
    const accRows = ACCESS_LABELS.filter(function (a) { return acc[a[0]]; }).map(function (a) {
        return row(lucide(a[2]), a[1], '<span>' + escapeHtml(acc[a[0]]) + '</span>');
    });
    if (accRows.length) rows.push(accRows.join(''));
    else rows.push(row(lucide('accessibility'), 'Kemudahan akses',
        '<span class="place-sub">Info tiket, parkir, toilet, dan fasilitas difabel belum tersedia.</span>', 'place-row--muted'));

    if (info.phone) rows.push(row(lucide('phone'), 'Telepon', link('tel:' + info.phone.replace(/[^0-9+]/g, ''), info.phone)));
    if (info.website) {
        rows.push(row(lucide('globe'), 'Website', link(info.website, info.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))));
    }

    // halte BST terdekat
    const hs = nearestHalteFor(destination, 3);
    if (hs.length) {
        const badge = function (code) {
            return '<span class="halte-badge" style="--halte-color:' + (typeof routeColor === 'function' ? routeColor(code) : '#888') + '">' +
                   escapeHtml(code) + '</span>';
        };
        rows.push(row(lucide('bus'), 'Halte BST terdekat', hs.map(function (n) {
            return '<span>' + escapeHtml(n.stop.name) + ' <span class="place-sub">· ' + distText(n.meters) +
                   ' · ±' + walkMinutes(n.meters) + ' mnt jalan</span>' +
                   (n.stop.routes && n.stop.routes.length ? '<br>' + n.stop.routes.map(badge).join(' ') : '') + '</span>';
        }).join('')));
    }

    const fav = typeof Favorites !== 'undefined' && Favorites.has(destination.id);
    const actions =
        '<div class="place-actions">' +
        '<button type="button" class="place-btn place-btn--primary" data-place-action="route" data-id="' + id + '">' +
            lucide('route') + '<span>Rute ke sini</span></button>' +
        '<button type="button" class="place-btn' + (fav ? ' is-fav' : '') + '" data-place-action="fav" data-id="' + id +
            '" aria-pressed="' + (fav ? 'true' : 'false') + '">' + lucide('heart') + '<span>' + (fav ? 'Tersimpan' : 'Simpan') + '</span></button>' +
        '<button type="button" class="place-btn" data-place-action="share" data-id="' + id + '">' +
            lucide('message-circle') + '<span>WhatsApp</span></button>' +
        '</div>';

    return '<div class="place-info">' + rows.join('') + '</div>' + actions;
}

/* ---------- aksi tombol ---------- */

function routeToPlace(dest) {
    const sel = document.getElementById('routeDestination');
    if (!sel || !dest) return;
    sel.value = String(dest.id);
    sel.dispatchEvent(new Event('change'));
    const mode = document.getElementById('routeMode');
    if (mode) mode.value = 'public';
    const section = document.getElementById('rencana');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const status = document.getElementById('plannerStatus');
    const hasOrigin = document.getElementById('originLat').value && document.getElementById('originLng').value;
    if (hasOrigin) {
        if (status) status.textContent = 'Mencari rute ke ' + dest.name + '...';
        setTimeout(function () { document.getElementById('findRoute').click(); }, 450);
    } else if (status) {
        status.textContent = 'Tujuan diset ke "' + dest.name + '". Tentukan titik awal (lokasi saya atau klik peta), lalu klik Cari Rute.';
    }
}

function sharePlaceWhatsApp(dest) {
    const pageUrl = location.origin + location.pathname;
    const text = placeTextLines(dest, true).join('\n') + '\n\nLihat rute BST ke sana di RuteSolo: ' + pageUrl;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
}

if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('[data-place-action]');
        if (!btn) return;
        const dest = findPlaceById(btn.getAttribute('data-id'));
        if (!dest) return;
        const action = btn.getAttribute('data-place-action');
        if (action === 'route') routeToPlace(dest);
        else if (action === 'share') sharePlaceWhatsApp(dest);
        else if (action === 'fav' && typeof Favorites !== 'undefined') Favorites.toggle(dest.id);
    });

    setInterval(refreshPlaceStatus, 30000);

}
