/* RuteSolo - Chip moda, kartu destinasi, hasil, pencarian */

// Kumpulkan semua kategori unik dari DEST, selalu taruh 'all' pertama
function getCategories() {
    const cats = [...new Set(DEST.map(d => d.category))].sort();
    return ['all', ...cats];
}

// Ikon per kategori
const CAT_ICONS = {
    'all':                 'layout-grid',
    'Budaya & Sejarah':    'landmark',
    'Museum':              'building-2',
    'Belanja':             'shopping-bag',
    'Belanja & Kuliner':   'shopping-cart',
    'Belanja & Budaya':    'store',
    'Kuliner':             'utensils',
    'Rekreasi':            'ferris-wheel',
    'Taman & Rekreasi':    'trees',
    'Olahraga & Rekreasi': 'trophy',
    'Wisata Edukasi':      'graduation-cap',
    'Wisata Religi':       'church',
    'Wisata Belanja':      'shopping-bag',
    'Wisata Experience':   'ferris-wheel',
    'Wisata Sejarah':      'landmark',
};

function renderCategoryTabs() {
    const wrap = document.getElementById('categoryTabs');
    if (!wrap) return;
    const cats = getCategories();
    wrap.innerHTML = cats.map(c => {
        const label = c === 'all' ? 'Semua' : c;
        const icon  = CAT_ICONS[c] || 'map-pin';
        return `<button class="cat-tab${catFilter === c ? ' active' : ''}" data-cat="${c}" aria-pressed="${catFilter === c}">
            <i data-lucide="${icon}" width="14" height="14" aria-hidden="true"></i>
            ${escapeHtml(label)}
        </button>`;
    }).join('');

    wrap.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            catFilter = btn.dataset.cat;
            content.classList.add('content--fading');
            setTimeout(() => {
                content.classList.remove('content--fading');
                renderCategoryTabs();
                if (selected) { renderResult(selected); } else { renderCards(); }
            }, 200);
        });
    });

    createIconsSafe();
}

function renderChips() {
    chips.innerHTML = MODES.map(m => `
        <button class="chip${filter === m.id ? ' active' : ''}" data-id="${m.id}">
            <i data-lucide="${m.icon}" style="width:16px;height:16px;color:${filter === m.id ? '#fff' : 'var(--mode-' + m.id + ')'}"></i>
            ${m.label}
        </button>
    `).join('');

    chips.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(event) {
            filter = button.dataset.id;
            const rect   = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className   = 'ripple';
            ripple.style.left  = (event.clientX - rect.left) + 'px';
            ripple.style.top   = (event.clientY - rect.top)  + 'px';
            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 450);
            content.classList.add('content--fading');
            setTimeout(() => {
                content.classList.remove('content--fading');
                renderChips();
                renderCategoryTabs();
                if (selected) { renderResult(selected); } else { renderCards(); }
            }, 200);
        });
    });

    createIconsSafe();
}

// Render cards

function renderCards() {
    selected = null;

    const filteredDest = filter === 'all'
        ? DEST
        : DEST.filter(d => d.options.some(o => o[0] === filter));

    // Terapkan filter kategori
    const displayDest = catFilter === 'all'
        ? filteredDest
        : filteredDest.filter(d => d.category === catFilter);

    sIndex = 0;

    content.innerHTML = `
        <div class="slider" id="slider">
            <button type="button" class="arrow slider-arrow prev" id="sliderPrev" aria-label="Foto sebelumnya"><i data-lucide="chevron-left"></i></button>
            <div class="slider-viewport" id="sliderViewport">
            <div class="slider-track" id="sliderTrack">
            ${displayDest.length === 0
                ? `<div class="cat-empty">
                    <i data-lucide="search-x" width="40" height="40" aria-hidden="true"></i>
                    <p>Tidak ada destinasi untuk kategori ini dengan filter moda yang dipilih.</p>
                    </div>`
                : displayDest.map((d, index) => {
                const uniqueModes = [...new Set(d.options.map(o => o[0]))];
                return `
                <article class="card slide" data-slide="${index}">
                    <div class="photo">
                        <img src="${escapeHtml(d.img)}" alt="${escapeHtml(d.name)}" loading="lazy" decoding="async"
                            onerror="this.closest('.photo').classList.add('photo--fallback');this.style.display='none';">
                        <span class="badge category">${escapeHtml(d.category)}</span>
                    </div>
                    <div class="card-body">
                        <div class="card-meta">
                            <span><i data-lucide="map-pin" width="13"></i> Solo, Jawa Tengah</span>
                            <span class="local-pick"><i data-lucide="sparkles" width="13"></i> Pilihan lokal</span>
                        </div>
                        <h3>${escapeHtml(d.name)}</h3>
                        <p>${escapeHtml(d.desc)}</p>
                        ${d.options.length > 0 ? `
                        <div class="transport-pills">
                            ${uniqueModes.map(modeId => `
                                <span class="transport-pill" style="--pill-color:var(--mode-${modeId})">
                                    <i data-lucide="${mode(modeId).icon}" width="13"></i>
                                    ${escapeHtml(mode(modeId).label)}
                                </span>
                            `).join('')}
                        </div>
                        ` : ''}
                        <button class="route-btn" data-id="${d.id}">
                            Lihat rute <i data-lucide="chevron-right" width="14"></i>
                        </button>
                    </div>
                </article>`;
            }).join('')}
            </div>
            </div>
            <button type="button" class="arrow slider-arrow next" id="sliderNext" aria-label="Foto berikutnya"><i data-lucide="chevron-right"></i></button>
        </div>
    `;

    const viewport = document.getElementById('sliderViewport');
    const track    = document.getElementById('sliderTrack');

    if (!track || !track.children.length) {
        createIconsSafe();
        return;
    }

    track.querySelectorAll('.slide').forEach(slide => {
        slide.addEventListener('click', event => {
            const idx = Number(slide.dataset.slide);
            if (idx !== sIndex) {
                event.preventDefault();
                goSlide(idx);
                return;
            }
            const button = event.target.closest('.route-btn');
            if (button) {
                const destination = DEST.find(d => d.id == button.dataset.id);
                renderResult(destination);
                scrollToContent();
            }
        });
    });

    document.getElementById('sliderPrev').onclick = () => goSlide(sIndex - 1);
    document.getElementById('sliderNext').onclick = () => goSlide(sIndex + 1);

    let startX = 0, startY = 0;
    viewport.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    viewport.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        // abaikan scroll vertikal yang kebetulan miring
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        goSlide(dx > 0 ? sIndex - 1 : sIndex + 1);
    }, { passive: true });

    createIconsSafe();
    positionSlider();
    requestAnimationFrame(positionSlider);
}

function goSlide(index) {
    const track = document.getElementById('sliderTrack');
    if (!track || !track.children.length) return;
    sIndex = Math.max(0, Math.min(track.children.length - 1, index));
    positionSlider();
}

function positionSlider() {
    const viewport = document.getElementById('sliderViewport');
    const track    = document.getElementById('sliderTrack');
    if (!viewport || !track || !track.children.length) return;
    const slides = Array.from(track.children);
    sIndex = Math.max(0, Math.min(slides.length - 1, sIndex));
    const active = slides[sIndex];
    const offset = viewport.clientWidth / 2 - (active.offsetLeft + active.offsetWidth / 2);
    track.style.transform = 'translateX(' + offset + 'px)';
    slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === sIndex);
        slide.setAttribute('aria-hidden', i === sIndex ? 'false' : 'true');
    });
    const prev = document.getElementById('sliderPrev');
    const next = document.getElementById('sliderNext');
    if (prev) prev.disabled = sIndex === 0;
    if (next) next.disabled = sIndex === slides.length - 1;
}

window.addEventListener('resize', positionSlider);


function renderResult(destination) {
    if (!destination) { return; }
    selected = destination;

    const options = sortOptions(destination.options.filter(o =>
        filter === 'all' || o[0] === filter
    ));

    const firstMode       = options.length ? options[0][0] : 'all';
    const overlayGradient = MODE_GRADIENTS[firstMode] || MODE_GRADIENTS.all;

    content.innerHTML = `
        <div class="result">
            <div class="result-hero">
                <img src="${escapeHtml(destination.img)}" alt="${escapeHtml(destination.name)}" loading="eager" decoding="async">
                <div class="result-overlay" style="background:${overlayGradient}"></div>
                <button class="close" id="closeBtn"><i data-lucide="x"></i></button>
                <div class="result-info">
                    <span class="badge">${escapeHtml(destination.category)}</span>
                    <h3>${escapeHtml(destination.name)}</h3>
                </div>
            </div>
            <div class="route-body">
                <p class="route-desc">${escapeHtml(destination.desc)}</p>
                ${typeof placeInfoHtml === 'function' ? placeInfoHtml(destination) : ''}
            </div>
        </div>
    `;

    document.getElementById('closeBtn').onclick = () => {
        input.value = '';
        filter    = 'all';
        catFilter = 'all';
        renderChips();
        renderCategoryTabs();
        renderCards();
    };
    setTimeout(function() {
        createIconsSafe();
    }, 0);
}


function search() {
    const query = input.value.trim().toLowerCase();

    const list = query
        ? DEST.filter(d =>
            d.name.toLowerCase().includes(query)     ||
            d.category.toLowerCase().includes(query) ||
            d.desc.toLowerCase().includes(query)     ||
            d.tags.some(t => t.toLowerCase().includes(query))
          )
        : [];

    suggestions.hidden = !list.length;
    chips.style.opacity = list.length ? '0' : '1';
    chips.style.pointerEvents = list.length ? 'none' : '';

    suggestions.innerHTML = list.map((d, i) => `
        <button data-id="${d.id}" style="animation-delay:${i * 50}ms">
            <i data-lucide="map-pin" width="15"></i>
            ${escapeHtml(d.name)}
        </button>
    `).join('');

    suggestions.querySelectorAll('button').forEach(button => {
        button.onclick = () => {
            const destination = DEST.find(item => item.id == button.dataset.id);
            input.value        = destination.name;
            suggestions.hidden = true;
            chips.style.opacity = '1';
            chips.style.pointerEvents = '';
            renderResult(destination);
            scrollToContent();
        };
    });

    createIconsSafe();
}

input.addEventListener('input', search);

document.addEventListener('click', event => {
    if (!event.target.closest('.nav-search-wrap')) {
        suggestions.hidden = true;
        chips.style.opacity = '1';
        chips.style.pointerEvents = '';
    }
});
