/* RuteSolo - Slideshow hero: foto destinasi tampil bergantian sebagai latar */

function initHeroSlideshow() {
    const hero = document.querySelector('.hero');
    const content = hero && hero.querySelector('.hero-content');
    if (!hero || !content) return;

    const MAX_SLIDES = 8;
    const INTERVAL_MS = 6500;

    // Satu foto per destinasi (tanpa duplikat), maksimal MAX_SLIDES.
    const seen = new Set();
    const items = DEST.filter(d => {
        if (!d.img || seen.has(d.img)) return false;
        seen.add(d.img);
        return true;
    }).slice(0, MAX_SLIDES);
    if (items.length < 2) return;

    const wrap = document.createElement('div');
    wrap.className = 'hero-slides';
    wrap.setAttribute('aria-hidden', 'true');
    const slides = items.map(() => {
        const el = document.createElement('div');
        el.className = 'hero-slide';
        wrap.appendChild(el);
        return el;
    });
    hero.insertBefore(wrap, hero.firstChild);

    const caption = document.createElement('p');
    caption.className = 'hero-caption';
    caption.setAttribute('aria-live', 'polite');
    content.appendChild(caption);

    const dotsBox = document.createElement('div');
    dotsBox.className = 'hero-dots';
    dotsBox.setAttribute('role', 'group');
    dotsBox.setAttribute('aria-label', 'Pilih foto latar');
    const dots = items.map((item, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hero-dot';
        b.setAttribute('aria-label', 'Tampilkan foto ' + item.name);
        b.addEventListener('click', () => { goTo(i); restart(); });
        dotsBox.appendChild(b);
        return b;
    });
    content.appendChild(dotsBox);

    const loaded = new Array(items.length).fill(false);
    const failed = new Array(items.length).fill(false);

    function load(i) {
        return new Promise(resolve => {
            if (loaded[i]) return resolve(true);
            if (failed[i]) return resolve(false);
            const img = new Image();
            img.onload = () => {
                slides[i].style.backgroundImage = 'url("' + items[i].img.replace(/"/g, '%22') + '")';
                loaded[i] = true;
                resolve(true);
            };
            img.onerror = () => { failed[i] = true; resolve(false); };
            img.src = items[i].img;
        });
    }

    let current = -1;

    async function show(i) {
        if (!(await load(i))) return false;
        slides.forEach((el, n) => el.classList.toggle('is-active', n === i));
        dots.forEach((el, n) => {
            el.classList.toggle('is-active', n === i);
            el.setAttribute('aria-current', n === i ? 'true' : 'false');
        });
        caption.textContent = 'Foto: ' + items[i].name;
        current = i;
        wrap.classList.add('ready');
        // Siapkan foto berikutnya di belakang layar supaya pergantian mulus.
        load((i + 1) % items.length);
        return true;
    }

    async function goTo(i) {
        const ok = await show(i);
        if (!ok) await next();
    }

    async function next() {
        for (let step = 1; step <= items.length; step++) {
            const idx = (current + step + items.length) % items.length;
            if (await show(idx)) return;
        }
    }

    let timer = null;
    function restart() {
        clearInterval(timer);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        timer = setInterval(() => { if (!document.hidden) next(); }, INTERVAL_MS);
    }

    (async () => {
        await next(); // tampilkan foto pertama yang berhasil dimuat
        if (current < 0) {
            // Tidak ada foto yang bisa dimuat: buang elemen kosong.
            wrap.remove(); caption.remove(); dotsBox.remove();
            return;
        }
        restart();
    })();
}
