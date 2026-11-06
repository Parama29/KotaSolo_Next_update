/* RuteSolo - Jadwal BST/Feeder + jam WIB real time + perkiraan waktu perjalanan
 *
 * Butuh: schedule-data.js (jadwalTransumSurakarta2026), utils.js (escapeHtml tidak dipakai di sini).
 * Dipakai oleh stops.js (HalteStops.tripHtml) dan planner.js.
 */

/* Kode rute di peta  →  id koridor di jadwal.
 * Isi `null` kalau jadwal rutenya belum ada. Rute tanpa jadwal tetap dihitung,
 * tapi ditampilkan sebagai ESTIMASI (±) dengan asumsi tunggu 8 menit. */
const SCHEDULE_ROUTE_MAP = {
    '1':   'bst-palur-bandara',
    '2':   'bst-palur-purwosari',
    '3':   'bst-kartasura-taman-lansia',
    '4':   'bst-kartasura-palur',
    '5':   'bst-kartasura-simpang-sidan',
    'F7':  'feeder-7',
    'F8':  'feeder-8',
    'F9':  'feeder-9',
    'F10': 'feeder-10',
    'F12': 'feeder-12',
    'S1':  null,
    'S2':  null
};

const TransitSchedule = (function () {
    const TZ               = 'Asia/Jakarta';
    const WALK_M_PER_MIN   = 75;    // ±4,5 km/jam
    const BUS_M_PER_MIN    = 330;   // ±20 km/jam rata-rata di kota
    const DEFAULT_WAIT_MIN = 8;     // tunggu bila tidak ada jadwal sama sekali
    const DAY              = 1440;
    const STOPWORDS        = { terminal: 1, halte: 1, stasiun: 1, sub: 1, bst: 1 };

    /* ---------- waktu WIB (tidak tergantung zona waktu perangkat) ---------- */

    const wibFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    function wibNow(date) {
        const parts = {};
        wibFormatter.formatToParts(date || new Date()).forEach(function (p) { parts[p.type] = p.value; });
        const h = Number(parts.hour) % 24, m = Number(parts.minute), s = Number(parts.second);
        return {
            minutes: h * 60 + m + s / 60,
            label: parts.hour + '.' + parts.minute + '.' + parts.second + ' WIB'
        };
    }

    const pad = function (n) { return (n < 10 ? '0' : '') + n; };

    /* menit sejak 00.00 hari ini (boleh ≥1440 = besok) → "14.32 WIB" / "besok 05.00 WIB" */
    function fmt(min) {
        const total = Math.round(min);
        const day = Math.floor(total / DAY);
        const rest = total - day * DAY;
        return (day >= 1 ? 'besok ' : '') + pad(Math.floor(rest / 60)) + '.' + pad(rest % 60) + ' WIB';
    }

    /* ---------- indeks jadwal ---------- */

    const tokens = function (s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/).filter(function (w) { return w && !STOPWORDS[w]; });
    };

    function parseWindow(text) {
        const m = String(text || '').match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
        return m ? { open: +m[1] * 60 + +m[2], close: +m[3] * 60 + +m[4] } : { open: 0, close: DAY - 1 };
    }

    const index = {};

    function buildIndex() {
        if (typeof jadwalTransumSurakarta2026 === 'undefined') return;
        jadwalTransumSurakarta2026.corridors.forEach(function (c) {
            const win = parseWindow(c.jamOperasional);
            const cols = c.kolom.map(function (name) {
                return { name: name, tokens: tokens(name), times: [], covered: {} };
            });
            let skipped = 0;
            c.jadwal.forEach(function (row) {
                const hour = parseInt(row.jam, 10);
                const cells = row.menit || [];
                let map;
                if (cells.length === cols.length) map = cells.map(function (cell, i) { return [i, cell]; });
                else if (cells.length === 1)      map = [[0, cells[0]]];   // feeder: satu deret = keberangkatan terminal awal
                else { skipped++; return; }                                // kolom tidak sejajar → jangan ditebak
                map.forEach(function (pair) {
                    const col = cols[pair[0]];
                    col.covered[hour] = true;
                    String(pair[1] || '').split(',').forEach(function (x) {
                        const mm = parseInt(x, 10);
                        if (Number.isFinite(mm) && mm >= 0 && mm <= 59) col.times.push(hour * 60 + mm);
                    });
                });
            });
            if (skipped) console.warn('Jadwal ' + c.id + ': ' + skipped + ' baris dilewati (jumlah kolom tidak sesuai).');
            cols.forEach(function (col) {
                col.times = col.times.filter(function (v, i, a) { return a.indexOf(v) === i; })
                                     .sort(function (a, b) { return a - b; });
            });
            index[c.id] = { corridor: c, cols: cols, open: win.open, close: win.close };
        });
    }
    buildIndex();

    function matchCols(idx, stopName) {
        const st = tokens(stopName);
        if (!st.length) return [];
        const inside = function (a, b) { return a.every(function (w) { return b.indexOf(w) !== -1; }); };
        return idx.cols.filter(function (c) {
            return c.times.length && c.tokens.length && (inside(c.tokens, st) || inside(st, c.tokens));
        });
    }

    /* ---------- keberangkatan berikutnya ---------- */

    // headway (menit) di sekitar jam t berdasarkan kolom terpadat di koridor itu
    function headwayNear(idx, tDay) {
        const hour = Math.floor(tDay / 60);
        let best = 0;
        for (let d = 0; d <= 3 && !best; d++) {
            [hour - d, hour + d].forEach(function (h) {
                idx.cols.forEach(function (col) {
                    if (!col.covered[h]) return;
                    const n = col.times.filter(function (x) { return Math.floor(x / 60) === h; }).length;
                    if (n > best) best = n;
                });
            });
        }
        return best ? 60 / best : 30;
    }

    /* Kembalikan {time, exact, later[], note, corridor}. time dalam menit sejak 00.00 hari ini. */
    function next(routeCode, stop, t) {
        const cid = SCHEDULE_ROUTE_MAP[routeCode];
        const idx = cid && index[cid];
        if (!idx) {
            return { time: t + DEFAULT_WAIT_MIN, exact: false, later: [], corridor: null,
                     note: 'jadwal rute ini belum tersedia' };
        }
        const day = Math.floor(t / DAY), tDay = t - day * DAY;
        const base = day * DAY;
        const out = { corridor: idx.corridor.nama };

        if (tDay > idx.close) {                       // sudah tutup → pertama besok
            const cols = matchCols(idx, stop.name);
            const first = cols.length ? Math.min.apply(null, cols.map(function (c) { return c.times[0]; })) : idx.open;
            return Object.assign(out, { time: base + DAY + first, exact: cols.length > 0, later: [],
                note: 'di luar jam operasional (' + idx.corridor.jamOperasional + ')' });
        }

        const cols = matchCols(idx, stop.name);
        if (cols.length) {
            const list = [].concat.apply([], cols.map(function (c) { return c.times; }))
                .filter(function (v, i, a) { return a.indexOf(v) === i; })
                .sort(function (a, b) { return a - b; });
            const i = list.findIndex(function (x) { return x >= tDay; });
            if (i !== -1) {
                return Object.assign(out, { time: base + list[i], exact: true,
                    later: list.slice(i + 1, i + 3).map(function (x) { return base + x; }) });
            }
            // data jadwal habis padahal masih jam operasional → estimasi dari headway terakhir
            const hw = headwayNear(idx, tDay);
            return Object.assign(out, { time: t + hw / 2, exact: false, later: [],
                note: 'jadwal pasti belum tercantum untuk jam ini' });
        }

        // halte bukan titik jadwal → perkiraan dari frekuensi koridor
        const hw = headwayNear(idx, Math.max(tDay, idx.open));
        const time = tDay < idx.open ? base + idx.open + hw / 2 : t + hw / 2;
        return Object.assign(out, { time: time, exact: false, later: [],
            note: 'halte ini bukan titik jadwal; perkiraan tiap ±' + Math.round(hw) + ' menit' });
    }

    /* ---------- hitung linimasa perjalanan ---------- */

    function annotate(trip, date) {
        if (!trip || !trip.legs || !trip.legs.length) return null;
        const now = wibNow(date);
        let t = now.minutes + trip.walkStart / WALK_M_PER_MIN;
        const steps = [];
        trip.legs.forEach(function (leg, i) {
            const d = next(leg.route, leg.from, t);
            const arrive = d.time + leg.rideMeters / BUS_M_PER_MIN;
            steps.push({
                route: leg.route, from: leg.from, to: leg.to,
                arriveStop: t, depart: d.time, arrive: arrive,
                wait: Math.max(0, d.time - t), exact: d.exact, later: d.later,
                note: d.note || '', corridor: d.corridor
            });
            t = arrive + (i < trip.transfers.length ? trip.transfers[i].walk / WALK_M_PER_MIN : 0);
        });
        const arriveDest = steps[steps.length - 1].arrive + trip.walkEnd / WALK_M_PER_MIN;
        return {
            now: now, steps: steps, arriveDest: arriveDest,
            totalMin: Math.ceil(arriveDest - now.minutes),
            hasEstimate: steps.some(function (s) { return !s.exact; }),
            walkMin: function (m) { return Math.max(1, Math.round(m / WALK_M_PER_MIN)); }
        };
    }

    /* ---------- jam WIB berjalan + segarkan panel tiap 20 detik ---------- */

    function tickClocks() {
        const label = wibNow().label;
        document.querySelectorAll('[data-wib-clock]').forEach(function (el) { el.textContent = label; });
    }

    let watched = null, watchTimer = null;

    function unwatch() {
        watched = null;
        if (watchTimer) { clearInterval(watchTimer); watchTimer = null; }
    }

    function watch(trip) {
        if (watched === trip) return;
        unwatch();
        watched = trip;
        watchTimer = setInterval(function () {
            const el = document.getElementById('prStops');
            if (!el || !watched) { unwatch(); return; }
            watched.timeline = annotate(watched);
            el.outerHTML = HalteStops.tripHtml(watched);
            if (typeof createIconsSafe === 'function') createIconsSafe();
            tickClocks();
        }, 20000);
    }

    if (typeof document !== 'undefined') {
        setInterval(tickClocks, 1000);
    }

    return { wibNow: wibNow, fmt: fmt, next: next, annotate: annotate, watch: watch, unwatch: unwatch,
             tickClocks: tickClocks, index: index };
})();
