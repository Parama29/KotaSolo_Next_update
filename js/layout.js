/* RuteSolo - Tema, navbar, menu mobile, scroll, gesture */

function initTheme() {
    let saved;
    try { saved = localStorage.getItem('theme'); } catch(e) {}
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme       = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    updateToggleState(theme);
}

function updateToggleState(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Aktifkan light mode' : 'Aktifkan dark mode');
    const moon = btn.querySelector('.icon-moon');
    const sun  = btn.querySelector('.icon-sun');
    if (moon) moon.style.display = isDark  ? 'block' : 'none';
    if (sun)  sun.style.display  = !isDark ? 'block' : 'none';
}

function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme;
        const next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        updateToggleState(next);
        try { localStorage.setItem('theme', next); } catch(e) {}
    });
}



function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('navbar--scrolled', window.scrollY > 80);
    }, { passive: true });
}



const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav       = document.getElementById('mainNav');
const menuIcon      = document.getElementById('menuIcon');
const closeIcon     = document.getElementById('closeIcon');

function closeMobileMenu() {
    mainNav.classList.remove('active');
    const menuIconEl  = document.getElementById('menuIcon');
    const closeIconEl = document.getElementById('closeIcon');
    if (menuIconEl)  menuIconEl.style.display  = 'block';
    if (closeIconEl) closeIconEl.style.display = 'none';
    const overlay = document.getElementById('navOverlay');
    if (overlay) overlay.classList.remove('active');
    const navbarEl = document.querySelector('.navbar');
    if (navbarEl) navbarEl.classList.remove('menu-open');
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
}

if (mobileMenuBtn) {
    mobileMenuBtn.onclick = () => {
        const isOpen = mainNav.classList.toggle('active');
        const menuIconEl  = document.getElementById('menuIcon');
        const closeIconEl = document.getElementById('closeIcon');
        if (menuIconEl)  menuIconEl.style.display  = isOpen ? 'none'  : 'block';
        if (closeIconEl) closeIconEl.style.display = isOpen ? 'block' : 'none';
        const overlay = document.getElementById('navOverlay');
        if (overlay) overlay.classList.toggle('active', isOpen);
        const navbarEl = document.querySelector('.navbar');
        if (navbarEl) navbarEl.classList.toggle('menu-open', isOpen);
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    };
    mainNav.querySelectorAll('a').forEach(link => { link.onclick = () => closeMobileMenu(); });
}

function initNavOverlay() {
    const overlay = document.getElementById('navOverlay');
    if (overlay) overlay.addEventListener('click', closeMobileMenu);
}



function initNavbarSearch() {
    const trigger = document.getElementById('searchTrigger');
    const dropdown = document.getElementById('navSearchDropdown');
    const inputEl = document.getElementById('searchInput');

    if (!trigger || !dropdown) return;

    trigger.onclick = (e) => {
        e.stopPropagation();
        const isHidden = dropdown.hidden;
        dropdown.hidden = !isHidden;
        if (isHidden) {
            setTimeout(() => inputEl.focus(), 100);
        }
    };
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search-wrap')) {
            dropdown.hidden = true;
        }
    });
    if (inputEl) {
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.hidden = true;
                trigger.focus();
            }
        });
    }
}



function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    function observeCards() {
        document.querySelectorAll('.card:not(.visible)').forEach((card, i) => {
            card.style.setProperty('--stagger-delay', `${i * 80}ms`);
            observer.observe(card);
        });
    }

    window.__observeCards = observeCards;
    observeCards();
}



function initGestures() {
    const stage = document.getElementById('galleryStage');
    if (!stage || stage._gestureInit) return;
    stage._gestureInit = true;
    stage.addEventListener('mouseenter', () => clearInterval(gTimer));
    stage.addEventListener('mouseleave', resetTimer);
    let startX = 0, startY = 0;
    stage.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        // abaikan scroll vertikal yang kebetulan miring
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        goGallery(dx > 0 ? -1 : 1);
    }, { passive: true });
}
