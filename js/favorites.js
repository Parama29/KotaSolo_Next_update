/* RuteSolo - Favorit, itinerary (.txt), dan bagikan ke WhatsApp
 *
 * Tersimpan di localStorage perangkat (tanpa login). Tombol "Simpan" ada di info tiap tempat
 * (place-info.js); tombol mengambang "Favorit (n)" muncul di kiri bawah setelah ada yang disimpan.
 * Butuh: place-info.js (placeTextLines, findPlaceById, routeToPlace), utils.js (escapeHtml).
 */
const Favorites = (function () {
    const KEY = 'rutasolo:favorites';
    let ids = load();
    let fab = null, panel = null;

    function load() {
        try {
            const v = JSON.parse(localStorage.getItem(KEY) || '[]');
            return Array.isArray(v) ? v.map(Number).filter(Number.isFinite) : [];
        } catch (e) { return []; }
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) { /* mode privat / penuh */ } }

    const has = function (id) { return ids.indexOf(Number(id)) !== -1; };
    const list = function () { return ids.map(findPlaceById).filter(Boolean); };

    function toggle(id) {
        id = Number(id);
        if (has(id)) ids = ids.filter(function (x) { return x !== id; });
        else ids.push(id);
        changed();
    }
    function remove(id) { ids = ids.filter(function (x) { return x !== Number(id); }); changed(); }
    function clear() { ids = []; changed(); }
    function move(id, dir) {
        const i = ids.indexOf(Number(id)), j = i + dir;
        if (i < 0 || j < 0 || j >= ids.length) return;
        const t = ids[i]; ids[i] = ids[j]; ids[j] = t;
        changed();
    }

    function changed() {
        save();
        syncButtons();
        syncFab();
        if (panel && !panel.hidden) renderPanel();
    }

    /* perbarui tombol hati di panel info tempat yang sedang tampil */
    function syncButtons() {
        document.querySelectorAll('[data-place-action="fav"]').forEach(function (btn) {
            const on = has(btn.getAttribute('data-id'));
            btn.classList.toggle('is-fav', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            const label = btn.querySelector('span');
            if (label) label.textContent = on ? 'Tersimpan' : 'Simpan';
        });
    }

    /* ---------- itinerary ---------- */

    function wibDate(style) {
        try {
            return new Intl.DateTimeFormat(style === 'iso' ? 'en-CA' : 'id-ID',
                style === 'iso' ? { timeZone: 'Asia/Jakarta' } : { timeZone: 'Asia/Jakarta', dateStyle: 'full' }).format(new Date());
        } catch (e) { return new Date().toISOString().slice(0, 10); }
    }

    function itineraryText() {
        const items = list();
        const out = ['ITINERARY WISATA SOLO — RuteSolo', 'Dibuat ' + wibDate() + ' (WIB)', ''];
        items.forEach(function (d, i) {
            const lines = placeTextLines(d, false);
            out.push((i + 1) + '. ' + lines[0]);
            lines.slice(1).forEach(function (l) { out.push('   ' + l); });
            out.push('');
        });
        out.push('Cek jadwal BST & rute terbaru: ' + location.origin + location.pathname);
        out.push('Catatan: jam buka dan jadwal bisa berubah, hubungi tempat sebelum berangkat.');
        return out.join('\n');
    }

    function whatsappText() {
        const out = ['*Itinerary Wisata Solo*', ''];
        list().forEach(function (d, i) {
            const lines = placeTextLines(d, true);
            out.push((i + 1) + '. *' + lines[0] + '*');
            lines.slice(1).forEach(function (l) { out.push(l); });
            out.push('');
        });
        out.push('Rute BST: ' + location.origin + location.pathname);
        return out.join('\n');
    }

    function download() {
        if (!ids.length) return;
        const blob = new Blob([itineraryText()], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'itinerary-solo-' + wibDate('iso') + '.txt';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }

    function shareWhatsApp() {
        if (!ids.length) return;
        window.open('https://wa.me/?text=' + encodeURIComponent(whatsappText()), '_blank', 'noopener');
    }

    /* ---------- UI: tombol mengambang + panel ---------- */

    function syncFab() {
        if (!fab) return;
        fab.hidden = ids.length === 0;
        const n = fab.querySelector('.fav-count');
        if (n) n.textContent = ids.length;
        if (!ids.length && panel) panel.hidden = true;
    }

    function renderPanel() {
        const items = list();
        const body = items.length
            ? items.map(function (d, i) {
                return '<li class="fav-item"><div class="fav-item-main"><b>' + (i + 1) + '. ' + escapeHtml(d.name) + '</b>' +
                    '<small>' + escapeHtml(d.category || '') + '</small></div>' +
                    '<div class="fav-item-actions">' +
                    '<button type="button" data-fav-act="up" data-id="' + d.id + '" aria-label="Naikkan" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
                    '<button type="button" data-fav-act="down" data-id="' + d.id + '" aria-label="Turunkan" ' + (i === items.length - 1 ? 'disabled' : '') + '>↓</button>' +
                    '<button type="button" data-fav-act="route" data-id="' + d.id + '">Rute</button>' +
                    '<button type="button" data-fav-act="remove" data-id="' + d.id + '" aria-label="Hapus dari favorit">✕</button>' +
                    '</div></li>';
            }).join('')
            : '<li class="fav-empty">Belum ada tempat tersimpan.</li>';
        panel.querySelector('.fav-list').innerHTML = body;
        panel.querySelectorAll('[data-fav-foot]').forEach(function (b) { b.disabled = !items.length; });
    }

    function open() {
        renderPanel();
        panel.hidden = false;
    }

    function build() {

        fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'fav-fab';
        fab.hidden = true;
        fab.innerHTML = '♥ Favorit <span class="fav-count">0</span>';
        fab.addEventListener('click', open);
        document.body.appendChild(fab);

        panel = document.createElement('div');
        panel.className = 'fav-panel';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Favorit dan itinerary');
        panel.innerHTML =
            '<div class="fav-sheet">' +
            '<div class="fav-head"><h4>Favorit &amp; Itinerary</h4><button type="button" class="fav-close" data-fav-act="close" aria-label="Tutup">✕</button></div>' +
            '<ul class="fav-list"></ul>' +
            '<div class="fav-foot">' +
            '<button type="button" class="fav-primary" data-fav-foot data-fav-act="download">Unduh itinerary (.txt)</button>' +
            '<button type="button" data-fav-foot data-fav-act="whatsapp">Bagikan WhatsApp</button>' +
            '<button type="button" data-fav-foot data-fav-act="clear">Hapus semua</button>' +
            '</div></div>';
        panel.addEventListener('click', function (e) {
            if (e.target === panel) { panel.hidden = true; return; }
            const btn = e.target.closest && e.target.closest('[data-fav-act]');
            if (!btn) return;
            const act = btn.getAttribute('data-fav-act'), id = btn.getAttribute('data-id');
            if (act === 'close') panel.hidden = true;
            else if (act === 'up') move(id, -1);
            else if (act === 'down') move(id, 1);
            else if (act === 'remove') remove(id);
            else if (act === 'route') { panel.hidden = true; routeToPlace(findPlaceById(id)); }
            else if (act === 'download') download();
            else if (act === 'whatsapp') shareWhatsApp();
            else if (act === 'clear') { if (confirm('Hapus semua favorit?')) clear(); }
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel) panel.hidden = true; });
        document.body.appendChild(panel);
        syncFab();
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
        else build();
    }

    return { has: has, toggle: toggle, remove: remove, move: move, clear: clear, list: list,
             itineraryText: itineraryText, whatsappText: whatsappText, open: open };
})();
