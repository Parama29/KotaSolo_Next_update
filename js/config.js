/* RuteSolo - Konfigurasi dasar: warna, API_BASE, fallback moda */

const COLORS = {
    indigo: 'var(--mode-bst)',
    maroon: 'var(--mode-krl)',
    sogan:  'var(--accent-2)',
    gold:   'var(--mode-ojol)',
    ink:    'var(--mode-all)'
};

const API_BASE = (function () {
    try {
        const src = document.currentScript && document.currentScript.src
            ? document.currentScript.src
            : '';
        if (src) {
            const path = new URL(src, window.location.href).pathname;
            const scriptPath = path.replace(/\/js\/[^\/]*$/i, '');
            return scriptPath ? scriptPath + '/api' : '/api';
        }
    } catch (error) {
        // Fallback for environments where currentScript is unavailable.
    }
    return '/api';
})();

// Fallback modes

const MODES_FALLBACK = [
    { id: 'all', label: 'Semua Moda', icon: 'layout-grid', color: 'var(--mode-all)' },
    { id: 'bst', label: 'BST', icon: 'bus', color: 'var(--mode-bst)' },
    { id: 'krl', label: 'KRL', icon: 'train-front', color: 'var(--mode-krl)' },
    { id: 'ojol', label: 'Ojol', icon: 'bike', color: 'var(--mode-ojol)' }
];

// Fallback destinations
