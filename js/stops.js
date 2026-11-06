/* RuteSolo - Halte di peta: marker logo kecil, popup naik/turun, halte terdekat untuk planner */

/*
 * Data halte datang dari index.php lewat window.__STOPS__, format tiap item:
 *   [id, nama, latitude, longitude, [kode rute...], isHub(0/1)]
 */
const BUS_ICON_SVG =
    '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#fff" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>' +
    '<path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>' +
    '<circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>';

const HALTE_FAR_ZOOM   = 12;   // di bawah zoom ini marker diperkecil
const HALTE_MAX_WALK_M = 1200; // maks jalan kaki ke/dari halte (origin→board dan alight→dest)
const HALTE_MAX_XFER_M = 350;  // maks jalan kaki antar halte saat pindah rute
const TRANSIT_WALK_WEIGHT       = 4;   // jalan kaki dianggap 4x lebih "mahal" dari naik bus
const TRANSIT_XFER_PENALTY_M    = 700; // penalti tiap transit (tunggu bus, setara 700 m)
const TRANSIT_MAX_TRANSFERS     = 2;   // maksimal berapa kali pindah rute
const TRANSIT_RIDE_FACTOR       = 1.3; // jarak jalan raya ≈ 1.3 × garis lurus

const HalteStops = {
    list: [],
    layer: null,
    tripLayer: null,
    enabled: true,
    visibleCodes: null,

    /* ---------- data ---------- */

    setRows(rows) {
        this.list = (Array.isArray(rows) ? rows : []).map(function (row) {
            return {
                id: row[0],
                name: String(row[1] || 'Halte'),
                coords: [Number(row[2]), Number(row[3])],
                routes: Array.isArray(row[4]) ? row[4] : [],
                hub: !!row[5],
                marker: null
            };
        }).filter(function (s) {
            return Number.isFinite(s.coords[0]) && Number.isFinite(s.coords[1]);
        });
    },

    async load() {
        this.setRows(window.__STOPS__);
        if (this.list.length) return;
        try {
            const response = await fetch(API_BASE + '/stops');
            if (!response.ok) throw new Error('API /stops mengembalikan ' + response.status);
            const payload = await response.json();
            const items = (payload && payload.data) || [];
            this.setRows(items.map(function (s) {
                const services = Array.isArray(s.services) ? s.services : [];
                return [
                    s.id, s.name, s.latitude, s.longitude,
                    services.map(function (v) { return v.route_code; }),
                    services.some(function (v) { return v.is_departure_hub; }) ? 1 : 0
                ];
            }));
        } catch (error) {
            console.error('Data halte gagal dimuat:', error);
        }
    },

    /* ---------- marker ---------- */

    makeIcon(stop, opts) {
        opts = opts || {};
        const color = routeColor(stop.routes[0]);
        const cls = ['halte-pin'];
        if (stop.hub) cls.push('halte-pin--hub');
        if (stop.routes.length > 1) cls.push('halte-pin--multi');
        if (opts.role) cls.push('halte-pin--' + opts.role);
        const size = opts.role ? 34 : (stop.hub ? 26 : 22);
        const label = opts.role
            ? '<span class="halte-pin__tag">' +
              (opts.role === 'naik' ? 'Naik' : opts.role === 'transit' ? 'Transit' : 'Turun') +
              '</span>'
            : '';
        return L.divIcon({
            className: 'halte-icon',
            html: '<span class="' + cls.join(' ') + '" style="--halte-color:' + color + '">' +
                  BUS_ICON_SVG + '</span>' + label,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    },

    popupHtml(stop) {
        const badges = stop.routes.map(function (code) {
            return '<span class="halte-badge" style="--halte-color:' + routeColor(code) + '">' +
                   escapeHtml(code) + '</span>';
        }).join('');
        const near = this.nearestDestinations(stop.coords, 3, 1500).map(function (n) {
            return '<li><span>' + escapeHtml(n.destination.name) + '</span><em>' +
                   formatDistance(n.meters) + '</em></li>';
        }).join('');
        return '<div class="halte-pop" data-stop-id="' + stop.id + '">' +
               '<strong class="halte-pop__name">' + escapeHtml(stop.name) + '</strong>' +
               '<span class="halte-pop__sub">' + (stop.hub ? 'Halte utama &middot; ' : 'Halte &middot; ') +
               'bisa naik &amp; turun di sini</span>' +
               '<div class="halte-pop__routes">' + badges + '</div>' +
               (near ? '<div class="halte-pop__near"><b>Turun di sini, jalan ke:</b><ul>' + near + '</ul></div>' : '') +
               '<button type="button" class="halte-pop__btn" data-act="board">Naik di sini (jadikan titik awal)</button>' +
               '</div>';
    },

    build() {
        const self = this;
        this.layer = L.layerGroup();
        this.list.forEach(function (stop) {
            const marker = L.marker(stop.coords, {
                icon: self.makeIcon(stop),
                title: stop.name,
                keyboard: true,
                riseOnHover: true
            });
            marker.bindPopup(function () { return self.popupHtml(stop); }, { minWidth: 210, maxWidth: 270 });
            stop.marker = marker;
        });
        this.refresh();
    },

    isShown(stop) {
        if (!this.enabled) return false;
        if (!this.visibleCodes) return true;
        return stop.routes.some(function (code) { return this.visibleCodes.indexOf(code) !== -1; }, this);
    },

    refresh() {
        if (!map || !this.layer) return;
        const self = this;
        this.list.forEach(function (stop) {
            const show = self.isShown(stop);
            const has  = self.layer.hasLayer(stop.marker);
            if (show && !has) self.layer.addLayer(stop.marker);
            if (!show && has) self.layer.removeLayer(stop.marker);
        });
        if (!map.hasLayer(this.layer)) this.layer.addTo(map);
        this.updateButton();
    },

    updateButton() {
        const btn = document.getElementById('halteToggle');
        if (!btn) return;
        btn.setAttribute('aria-pressed', String(this.enabled));
        btn.textContent = (this.enabled ? 'Sembunyikan' : 'Tampilkan') + ' halte (' + this.list.length + ')';
    },

    /* ---------- pencarian terdekat ---------- */

    nearestDestinations(point, limit, maxMeters) {
        return DEST.map(function (d) {
            return { destination: d, meters: haversine(point, d.coords) * 1000 };
        }).filter(function (n) { return n.meters <= maxMeters; })
          .sort(function (a, b) { return a.meters - b.meters; })
          .slice(0, limit);
    },

    nearestStops(point, limit) {
        return this.list.map(function (stop) {
            return { stop: stop, meters: haversine(point, stop.coords) * 1000 };
        }).sort(function (a, b) { return a.meters - b.meters; }).slice(0, limit);
    },

    /* -----------------------------------------------------------------------
     * planTrip — cari perjalanan transit terbaik dari origin ke dest.
     *
     * Alur yang dicari:
     *   titik awal → jalan ke halte naik TERDEKAT → naik rute A
     *   → (bila perlu) TURUN & PINDAH rute di halte transit yang lebih dekat ke tujuan
     *   → turun di halte TERDEKAT dengan tujuan → jalan ke tujuan.
     *
     * Dasarnya Dijkstra pada state (halte, rute, jumlah transit):
     *   - mulai   : origin → halte mana pun ≤ HALTE_MAX_WALK_M      (biaya jalan × bobot)
     *   - naik bus: halte-i → halte-j pada rute yang sama           (jarak tempuh × 1.3)
     *   - transit : turun di halte-j, jalan ≤ HALTE_MAX_XFER_M ke halte-m,
     *               naik rute lain                                   (jalan × bobot + penalti tunggu)
     *   - selesai : turun di halte mana pun ≤ HALTE_MAX_WALK_M dari tujuan
     * Jalan kaki diberi bobot 4× lebih mahal dari naik bus, jadi hasilnya otomatis
     * memilih halte naik/turun yang dekat, dan hanya pindah rute kalau memang menolong.
     * Maks TRANSIT_MAX_TRANSFERS kali transit. Hasil null → tidak ada rute (sarankan ojol).
     * --------------------------------------------------------------------- */
    planTrip(origin, dest) {
        if (!this.list.length) return null;

        const stops = this.list;
        const maxWalk = HALTE_MAX_WALK_M;
        const W  = TRANSIT_WALK_WEIGHT;
        const dm = function (a, b) { return haversine(a, b) * 1000; };

        const byRoute = {};
        stops.forEach(function (s, i) {
            s.routes.forEach(function (r) { (byRoute[r] = byRoute[r] || []).push(i); });
        });
        const dOrigin = stops.map(function (s) { return dm(origin, s.coords); });
        const dDest   = stops.map(function (s) { return dm(dest, s.coords); });

        // halte lain yang cukup dekat untuk jalan kaki saat transit (dihitung sekali per halte)
        const nearCache = {};
        const nearOf = function (i) {
            if (nearCache[i]) return nearCache[i];
            const out = [];
            stops.forEach(function (s, j) {
                if (j === i) return;
                const d = dm(stops[i].coords, s.coords);
                if (d <= HALTE_MAX_XFER_M) out.push({ j: j, d: d });
            });
            return (nearCache[i] = out);
        };

        // ---- min-heap sederhana ----
        const heap = [];
        const push = function (item) {
            heap.push(item);
            let c = heap.length - 1;
            while (c > 0) {
                const p = (c - 1) >> 1;
                if (heap[p].cost <= heap[c].cost) break;
                const t = heap[p]; heap[p] = heap[c]; heap[c] = t; c = p;
            }
        };
        const pop = function () {
            const top = heap[0], last = heap.pop();
            if (heap.length) {
                heap[0] = last;
                let p = 0;
                for (;;) {
                    const l = p * 2 + 1, r = l + 1;
                    let m = p;
                    if (l < heap.length && heap[l].cost < heap[m].cost) m = l;
                    if (r < heap.length && heap[r].cost < heap[m].cost) m = r;
                    if (m === p) break;
                    const t = heap[p]; heap[p] = heap[m]; heap[m] = t; p = m;
                }
            }
            return top;
        };

        // state: stop index, rute, jumlah transit, riding (sudah naik bus ≥1 halte?)
        const keyOf = function (i, r, k, riding) { return i + '|' + r + '|' + k + '|' + (riding ? 1 : 0); };
        const best = {};
        const prev = {};
        const relax = function (i, r, k, riding, cost, from) {
            const key = keyOf(i, r, k, riding);
            if (best[key] !== undefined && best[key] <= cost) return;
            best[key] = cost;
            prev[key] = from;
            push({ cost: cost, key: key, i: i, r: r, k: k, riding: riding });
        };

        stops.forEach(function (s, i) {
            if (dOrigin[i] > maxWalk) return;
            s.routes.forEach(function (r) {
                relax(i, r, 0, false, dOrigin[i] * W, { type: 'start', walk: dOrigin[i] });
            });
        });

        let goal = null;
        while (heap.length) {
            const cur = pop();
            if (best[cur.key] < cur.cost) continue;            // entri usang
            if (goal && cur.cost >= goal.total) break;         // tidak mungkin lebih murah lagi

            if (cur.riding && dDest[cur.i] <= maxWalk) {
                const total = cur.cost + dDest[cur.i] * W;
                if (!goal || total < goal.total) goal = { total: total, key: cur.key };
            }

            // naik bus ke halte lain di rute yang sama
            (byRoute[cur.r] || []).forEach(function (j) {
                if (j === cur.i) return;
                const ride = dm(stops[cur.i].coords, stops[j].coords) * TRANSIT_RIDE_FACTOR;
                relax(j, cur.r, cur.k, true, cur.cost + ride, { type: 'ride', pk: cur.key });
            });

            // turun lalu pindah rute (hanya setelah benar-benar naik bus)
            if (cur.riding && cur.k < TRANSIT_MAX_TRANSFERS) {
                const cands = [{ j: cur.i, d: 0 }].concat(nearOf(cur.i));
                cands.forEach(function (c) {
                    stops[c.j].routes.forEach(function (r2) {
                        if (r2 === cur.r) return;
                        relax(c.j, r2, cur.k + 1, false,
                            cur.cost + c.d * W + TRANSIT_XFER_PENALTY_M,
                            { type: 'xfer', pk: cur.key, walk: c.d });
                    });
                });
            }
        }

        if (!goal) return null;

        // ---- susun ulang jalur dari state akhir ----
        const chain = [];
        for (let key = goal.key; key; key = prev[key].pk) chain.unshift(key);
        const legs = [], transfers = [];
        let leg = null, walkStart = 0;
        chain.forEach(function (key) {
            const p = prev[key];
            const parts = key.split('|');
            const stop = stops[Number(parts[0])], route = parts[1];
            if (p.type === 'start') {
                walkStart = p.walk;
                leg = { route: route, from: stop, to: null };
            } else if (p.type === 'ride') {
                leg.to = stop;
            } else {
                legs.push(leg);
                transfers.push({ fromStop: leg.to, toStop: stop, walk: p.walk,
                                 fromRoute: leg.route, toRoute: route });
                leg = { route: route, from: stop, to: null };
            }
        });
        legs.push(leg);
        legs.forEach(function (l) {
            l.rideMeters = dm(l.from.coords, l.to.coords) * TRANSIT_RIDE_FACTOR;
        });

        const first = legs[0], last = legs[legs.length - 1];
        return {
            origin: origin, dest: dest,
            legs: legs, transfers: transfers,
            walkStart: walkStart,
            walkEnd: dm(last.to.coords, dest),
            // alias supaya kompatibel dengan kode lama
            board: first.from, boardMeters: walkStart,
            alight: last.to,   alightMeters: dm(last.to.coords, dest),
            routes: legs.map(function (l) { return l.route; }),
            needsTransfer: transfers.length > 0
        };
    },

    /* -----------------------------------------------------------------------
     * transitPath — potong geometri rute di antara halte untuk tiap leg.
     * Leg yang geometrinya tidak ketemu digambar garis lurus putus-putus (approx).
     * --------------------------------------------------------------------- */
    transitPath(trip) {
        if (!trip || !trip.legs || !trip.legs.length || typeof TransitGeometry === 'undefined') return null;

        const MAX_SNAP_M = 450;
        const SLACK_M    = 80;
        const MAX_CAND   = 12;

        const candidates = function (seg, latlng) {
            const all = seg.map(function (p, i) {
                return { i: i, d: haversine(latlng, [p[1], p[0]]) * 1000 };
            });
            const minD = all.reduce(function (m, c) { return Math.min(m, c.d); }, Infinity);
            if (minD > MAX_SNAP_M) return null;
            return all.filter(function (c) { return c.d <= minD + SLACK_M; })
                      .sort(function (a, b) { return a.d - b.d; })
                      .slice(0, MAX_CAND);
        };

        const buildLeg = function (code, coordA, coordB) {
            let best = null;
            (TransitGeometry[code] || []).forEach(function (seg) {
                const as = candidates(seg, coordA);
                const bs = candidates(seg, coordB);
                if (!as || !bs) return;
                const cum = [0];
                for (let k = 1; k < seg.length; k++) {
                    cum.push(cum[k - 1] + haversine([seg[k-1][1], seg[k-1][0]], [seg[k][1], seg[k][0]]) * 1000);
                }
                as.forEach(function (a) {
                    bs.forEach(function (b) {
                        if (a.i === b.i) return;
                        const cost = Math.abs(cum[a.i] - cum[b.i]) + (a.d + b.d) * 3;
                        if (!best || cost < best.cost) best = { cost: cost, seg: seg, a: a.i, b: b.i };
                    });
                });
            });
            if (!best) return null;
            const lo  = Math.min(best.a, best.b);
            const hi  = Math.max(best.a, best.b);
            const pts = best.seg.slice(lo, hi + 1).map(function (p) { return [p[1], p[0]]; });
            if (best.a > best.b) pts.reverse();
            return { code: code, latlngs: pts };
        };

        const out = trip.legs.map(function (l) {
            return buildLeg(l.route, l.from.coords, l.to.coords) ||
                   { code: l.route, latlngs: [l.from.coords, l.to.coords], approx: true };
        });
        // kalau tidak satu pun punya geometri asli, biarkan planner memakai garis cadangan
        return out.some(function (l) { return !l.approx; }) ? { legs: out } : null;
    },

    clearTrip() {
        if (this.tripLayer && map) map.removeLayer(this.tripLayer);
        this.tripLayer = null;
        if (typeof TransitSchedule !== 'undefined') TransitSchedule.unwatch();
    },

    /* Gambar jalur + marker di peta, kembalikan bounds */
    drawTrip(trip) {
        this.clearTrip();
        if (!trip || !map) return null;

        const walkStyle = { color: '#94a3b8', weight: 4, opacity: 0.9, dashArray: '2 8', lineCap: 'round' };
        const layers    = [];
        const bounds    = L.latLngBounds([trip.origin, trip.dest]);
        const first     = trip.legs[0];
        const last      = trip.legs[trip.legs.length - 1];

        // Jalur bus tiap leg
        if (trip.path && trip.path.legs) {
            trip.path.legs.forEach(function (leg) {
                if (!leg || !leg.latlngs.length) return;
                const style = { color: routeColor(leg.code), weight: 6, opacity: 0.95,
                                lineCap: 'round', lineJoin: 'round' };
                if (leg.approx) { style.dashArray = '10 8'; style.opacity = 0.7; }
                const line = L.polyline(leg.latlngs, style)
                    .bindPopup('BST · Rute ' + escapeHtml(leg.code));
                layers.push(line);
                try { bounds.extend(line.getBounds()); } catch (e) { /* skip */ }
            });
        }

        // Jalan kaki: awal → halte naik, halte turun → tujuan
        layers.push(L.polyline([trip.origin, first.from.coords], walkStyle));
        layers.push(L.polyline([last.to.coords, trip.dest], walkStyle));

        // Titik transit
        const self = this;
        trip.transfers.forEach(function (t, n) {
            const walks = t.walk > 10;
            if (walks) layers.push(L.polyline([t.fromStop.coords, t.toStop.coords], walkStyle));
            const popup =
                '<strong>Transit ' + (n + 1) + ': ' + escapeHtml(t.fromStop.name) + '</strong><br>' +
                'Turun dari rute <b>' + escapeHtml(t.fromRoute) + '</b>' +
                (walks ? ', jalan ' + formatDistance(t.walk) + ' ke ' + escapeHtml(t.toStop.name) : '') +
                ', lanjut naik rute <b>' + escapeHtml(t.toRoute) + '</b>';
            layers.push(L.marker(t.fromStop.coords, {
                icon: self.makeIcon(t.fromStop, { role: 'transit' }), zIndexOffset: 750
            }).bindPopup(popup));
            if (walks) {
                layers.push(L.marker(t.toStop.coords, {
                    icon: self.makeIcon(t.toStop, { role: 'transit' }), zIndexOffset: 750
                }).bindPopup(popup));
            }
            try { bounds.extend(t.fromStop.coords); bounds.extend(t.toStop.coords); } catch (e) { /* skip */ }
        });

        layers.push(
            L.marker(first.from.coords, {
                icon: this.makeIcon(first.from, { role: 'naik' }), zIndexOffset: 800
            }).bindPopup(
                '<strong>Naik di ' + escapeHtml(first.from.name) + '</strong><br>' +
                'Rute <b>' + escapeHtml(first.route) + '</b><br>' +
                'Jalan ' + formatDistance(trip.walkStart) + ' dari titik awal'
            )
        );
        layers.push(
            L.marker(last.to.coords, {
                icon: this.makeIcon(last.to, { role: 'turun' }), zIndexOffset: 800
            }).bindPopup(
                '<strong>Turun di ' + escapeHtml(last.to.name) + '</strong><br>' +
                'Dari rute <b>' + escapeHtml(last.route) + '</b><br>' +
                'Jalan ' + formatDistance(trip.walkEnd) + ' ke tujuan'
            )
        );

        this.tripLayer = L.layerGroup(layers).addTo(map);
        return bounds;
    },

    /* Teks panduan + jam WIB di panel hasil planner */
    tripHtml(trip) {
        const hasSched = typeof TransitSchedule !== 'undefined';
        if (!trip) {
            if (hasSched) TransitSchedule.unwatch();
            return '<div class="pr-stops pr-stops--empty" id="prStops">' +
                   '<i data-lucide="info" width="14"></i> ' +
                   'Tidak ada rute BST yang menghubungkan titik awal dan tujuan ' +
                   '(halte harus &lt;1.2 km dari keduanya, maks. ' + TRANSIT_MAX_TRANSFERS + 'x transit). ' +
                   'Pertimbangkan ojol untuk perjalanan ini.</div>';
        }

        const tl = hasSched ? (trip.timeline = TransitSchedule.annotate(trip)) : null;
        if (tl) TransitSchedule.watch(trip);

        const mkBadge = function (code) {
            return '<span class="halte-badge" style="--halte-color:' + routeColor(code) + '">' +
                   escapeHtml(code) + '</span>';
        };
        const row = function (cls, tagCls, tag, body) {
            return '<div class="pr-stop-row pr-stop-row--' + cls + '">' +
                   '<span class="pr-stop-tag' + (tagCls ? ' pr-stop-tag--' + tagCls : '') + '">' + tag + '</span>' +
                   '<div>' + body + '</div></div>';
        };
        const tm = function (min, est) {
            return '<span class="pr-time' + (est ? ' pr-time--est' : '') + '">' +
                   (est ? '±' : '') + TransitSchedule.fmt(min) + '</span>';
        };
        const mnt = function (m) { return Math.max(0, Math.round(m)) + ' mnt'; };
        // baris keberangkatan bus: jam, lama tunggu, jadwal berikutnya, catatan
        const departLine = function (st) {
            return '<span>Bus rute ' + mkBadge(st.route) + ' berangkat ' + tm(st.depart, !st.exact) +
                   ' &middot; tunggu ' + mnt(st.wait) + '</span>' +
                   (st.later && st.later.length
                       ? '<span class="pr-note">Berikutnya: ' + st.later.map(function (x) { return TransitSchedule.fmt(x); }).join(', ') + '</span>'
                       : '') +
                   (!st.exact && st.note ? '<span class="pr-note">Estimasi — ' + escapeHtml(st.note) + '</span>' : '');
        };

        const first  = trip.legs[0];
        const last   = trip.legs[trip.legs.length - 1];
        const nTrans = trip.transfers.length;
        let n = 1;

        let html = '<div class="pr-stops" id="prStops">' +
            '<div class="pr-section-label"><i data-lucide="bus" width="12"></i> Panduan naik BST' +
            (nTrans ? ' · ' + nTrans + 'x transit' : ' · langsung') + '</div>';

        if (tl) {
            html += '<div class="pr-clock"><span>Sekarang <b data-wib-clock>' + tl.now.label + '</b></span>' +
                    '<span>Tiba di tujuan ' + tm(tl.arriveDest, tl.hasEstimate) + ' (' + tl.totalMin + ' mnt)</span></div>';
        }

        // 1 — naik di halte terdekat dari titik awal
        html += row('naik', '', n++ + '&nbsp;Naik',
            '<strong>' + escapeHtml(first.from.name) + '</strong>' +
            '<span>Jalan ' + formatDistance(trip.walkStart) +
                (tl ? ' (' + tl.walkMin(trip.walkStart) + ' mnt) &middot; tiba di halte ' + tm(tl.steps[0].arriveStop) : ' dari titik awal') + '</span>' +
            (tl ? departLine(tl.steps[0]) : '<span>Naik rute ' + mkBadge(first.route) + '</span>'));

        // 2.. — transit: turun, jalan, naik rute lain
        trip.transfers.forEach(function (t, i) {
            const walks = t.walk > 10;
            const a = tl && tl.steps[i], b = tl && tl.steps[i + 1];
            html += row('transit', 'transit', n++ + '&nbsp;Transit',
                '<strong>' + escapeHtml(t.fromStop.name) + '</strong>' +
                '<span>Turun dari rute ' + mkBadge(t.fromRoute) + (a ? ' ' + tm(a.arrive, !a.exact) : '') + '</span>' +
                (walks ? '<span>Jalan ' + formatDistance(t.walk) +
                         (tl ? ' (' + tl.walkMin(t.walk) + ' mnt)' : '') + ' ke ' + escapeHtml(t.toStop.name) + '</span>'
                       : '<span>Pindah di halte yang sama</span>') +
                (b ? departLine(b) : '<span>Naik rute ' + mkBadge(t.toRoute) + '</span>'));
        });

        // terakhir — turun di halte terdekat dengan tujuan
        const ls = tl && tl.steps[tl.steps.length - 1];
        html += row('turun', '', n + '&nbsp;Turun',
            '<strong>' + escapeHtml(last.to.name) + '</strong>' +
            (ls ? '<span>Tiba di halte ' + tm(ls.arrive, !ls.exact) + '</span>' : '<span>Dari rute ' + mkBadge(last.route) + '</span>') +
            '<span>Jalan ' + formatDistance(trip.walkEnd) +
                (tl ? ' (' + tl.walkMin(trip.walkEnd) + ' mnt) &middot; tiba di tujuan ' + tm(tl.arriveDest, tl.hasEstimate) : ' ke tujuan') + '</span>');

        if (tl) {
            html += '<p class="pr-note">Jam WIB real time, dihitung bila berangkat sekarang dan diperbarui otomatis. ' +
                    (tl.hasEstimate ? '± = estimasi. ' : '') +
                    'Waktu naik bus dihitung ±20 km/jam, jalan kaki ±4,5 km/jam; jadwal bisa bergeser karena lalu lintas.</p>';
        }
        return html + '</div>';
    }
};

function formatDistance(meters) {
    return meters < 1000
        ? Math.max(10, Math.round(meters / 10) * 10) + ' m'
        : (meters / 1000).toFixed(1) + ' km';
}

async function initStops() {
    if (!map || !window.L) return;
    const toggle = document.getElementById('halteToggle');
    await HalteStops.load();
    if (!HalteStops.list.length) {
        if (toggle) toggle.textContent = 'Data halte tidak tersedia';
        return;
    }
    HalteStops.build();

    const container = map.getContainer();
    const applyZoom = function () {
        container.classList.toggle('halte-zoom-far', map.getZoom() < HALTE_FAR_ZOOM);
    };
    map.on('zoomend', applyZoom);
    applyZoom();

    document.addEventListener('transit:visibility', function (event) {
        HalteStops.visibleCodes = (event.detail && event.detail.codes) || null;
        HalteStops.refresh();
    });

    if (toggle) {
        toggle.disabled = false;
        toggle.addEventListener('click', function () {
            HalteStops.enabled = !HalteStops.enabled;
            HalteStops.refresh();
        });
    }

    map.on('popupopen', function (event) {
        const root = event.popup.getElement();
        const btn  = root && root.querySelector('.halte-pop [data-act="board"]');
        if (!btn) return;
        const stop = HalteStops.list.find(function (s) {
            return String(s.id) === btn.closest('.halte-pop').dataset.stopId;
        });
        if (!stop) return;
        btn.addEventListener('click', function () {
            setOrigin(stop.coords[0], stop.coords[1]);
            const status = document.getElementById('plannerStatus');
            if (status) status.textContent = 'Titik awal diatur ke ' + stop.name + '. Pilih destinasi lalu klik Cari Rute.';
            map.closePopup();
            const planner = document.getElementById('rencana');
            if (planner) planner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}
