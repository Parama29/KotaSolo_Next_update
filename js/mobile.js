/* RuteSolo - Penyempurnaan mobile
   - peta terkunci di layar sentuh (scroll halaman tidak "tersangkut" di peta)
   - filter peta dilipat di HP
   - tinggi chat AI mengikuti keyboard HP
   - halaman dikunci saat menu / chat layar penuh terbuka
   - hasil planner otomatis di-scroll ke layar di HP
   Dimuat paling akhir (setelah main.js) supaya peta & elemen lain sudah ada. */
(function () {
    'use strict';

    var root   = document.documentElement;
    var coarse = window.matchMedia('(hover: none) and (pointer: coarse)');
    var narrow = window.matchMedia('(max-width: 799px)');
    var phone  = window.matchMedia('(max-width: 599px)');

    /* 1. Kunci peta: satu jari = scroll halaman. Ketuk "Aktifkan geser peta" untuk menggeser/zoom peta. */
    function initMapLock() {
        if (!coarse.matches || typeof map === 'undefined' || !map || !window.L) return;
        var container = map.getContainer();
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-lock-btn';
        container.appendChild(btn);
        L.DomEvent.disableClickPropagation(btn); // jangan dianggap klik peta (mode "Pilih di peta")

        var unlocked = false;
        function apply() {
            container.classList.toggle('map-locked', !unlocked);
            if (unlocked) {
                map.dragging.enable();
                if (map.touchZoom) map.touchZoom.enable();
            } else {
                map.dragging.disable();
                if (map.touchZoom) map.touchZoom.disable();
            }
            btn.setAttribute('aria-pressed', String(unlocked));
            btn.textContent = unlocked ? 'Kunci peta (scroll halaman)' : 'Aktifkan geser peta';
        }
        btn.addEventListener('click', function () { unlocked = !unlocked; apply(); });

        // ketuk di luar peta = kunci lagi
        document.addEventListener('touchstart', function (e) {
            if (unlocked && !container.contains(e.target)) { unlocked = false; apply(); }
        }, { passive: true });

        apply();
    }

    /* 2. Tombol "Filter jalur" untuk melipat legenda & tombol jalur di HP (CSS menyembunyikannya di desktop). */
    function initMapFilter() {
        var toolbar = document.querySelector('.map-toolbar');
        var halte   = document.getElementById('halteToggle');
        if (!toolbar || !halte || document.getElementById('mapFilterBtn')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'mapFilterBtn';
        btn.className = 'btn-outline map-filter-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'routeLegend');
        btn.textContent = 'Filter jalur';
        halte.insertAdjacentElement('afterend', btn);
        btn.addEventListener('click', function () {
            var open = toolbar.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', String(open));
            btn.textContent = open ? 'Tutup filter' : 'Filter jalur';
        });
    }

    /* 3. Chat layar penuh mengikuti area yang benar-benar kelihatan (keyboard iOS/Android). */
    function initViewportVars() {
        var vv = window.visualViewport;
        if (!vv) return;
        function set() {
            root.style.setProperty('--vvh', vv.height + 'px');
            root.style.setProperty('--vvt', vv.offsetTop + 'px');
        }
        vv.addEventListener('resize', set);
        vv.addEventListener('scroll', set);
        set();
    }

    /* 4. Kunci scroll halaman saat menu layar penuh / chat layar penuh terbuka. */
    function initScrollLock() {
        var chat = document.getElementById('aiChatContainer');
        var nav  = document.getElementById('mainNav');
        function update() {
            var locked = (chat && chat.classList.contains('active') && phone.matches) ||
                         (nav && nav.classList.contains('active') && narrow.matches);
            root.classList.toggle('is-locked', !!locked);
        }
        var mo = new MutationObserver(update);
        if (chat) mo.observe(chat, { attributes: true, attributeFilter: ['class'] });
        if (nav)  mo.observe(nav,  { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', update);
        update();
    }

    /* 5. Di HP, hasil planner muncul di bawah form: geser otomatis supaya langsung kelihatan. */
    function initPlannerScroll() {
        var box = document.getElementById('plannerResult');
        if (!box) return;
        new MutationObserver(function (records) {
            if (!narrow.matches) return;
            var added = records.some(function (r) {
                return Array.prototype.some.call(r.addedNodes, function (n) {
                    return n.nodeType === 1 && (n.matches('.pr-result') || n.querySelector('.pr-result'));
                });
            });
            if (added) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }).observe(box, { childList: true });
    }

    /* 6. Putar layar -> ukuran peta ikut dihitung ulang. */
    function initOrientation() {
        window.addEventListener('orientationchange', function () {
            setTimeout(function () {
                if (typeof map !== 'undefined' && map) map.invalidateSize();
            }, 300);
        });
    }

    initMapLock();
    initMapFilter();
    initViewportVars();
    initScrollLock();
    initPlannerScroll();
    initOrientation();
})();
