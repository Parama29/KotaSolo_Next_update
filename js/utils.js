/* RuteSolo - Fungsi bantu umum */

function parseFare(fareStr) {
    if (!fareStr || typeof fareStr !== 'string') return { min: 0, max: 0 };
    var s = fareStr.replace(/Rp/g,'').replace(/\s/g,'').replace(/\./g,'');
    var parts = s.split('-');
    var parseOne = function(p) {
        p = p.trim();
        if (p.indexOf('rb') !== -1) return parseInt(p) * 1000;
        if (p.indexOf('jt') !== -1) return parseInt(p) * 1000000;
        return parseInt(p) || 0;
    };
    var min = parseOne(parts[0]);
    var max = parts.length > 1 ? parseOne(parts[1]) : min;
    return { min: min, max: max };
}

function formatRp(num) {
    return 'Rp ' + String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function sanitizeDesc(str) {
    if (!str || typeof str !== 'string') return str || '';
    return str
        .replace(/\uFFFD/g, '\u00B7')
        .trim();
}

function createIconsSafe() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}
// Transport points & fares

function haversine(a, b) {
    var R = 6371;
    var dLat = (b[0] - a[0]) * Math.PI / 180;
    var dLon = (b[1] - a[1]) * Math.PI / 180;
    var sin2 = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(a[0]*Math.PI/180) * Math.cos(b[0]*Math.PI/180) *
               Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1-sin2));
}
function calcTransportFare(modeId, originCoords, destCoords) {
    var fare = TRANSPORT_FARES[modeId];
    if (!fare) return null;

    if (fare.type === 'flat') {
        return {
            min: fare.amount,
            max: fare.amount,
            label: formatRp(fare.amount),
            note: fare.note,
            isFlat: true
        };
    }

    if (fare.type === 'per_km' && originCoords && destCoords && 
        Array.isArray(originCoords) && originCoords.length === 2 &&
        Array.isArray(destCoords) && destCoords.length === 2) {
        var km = haversine(originCoords, destCoords);
        km = km * 1.2;
        var total = Math.max(fare.minFare, Math.round(km * fare.perKm) + fare.bookingFee);
        var min = Math.round(total * 0.90 / 500) * 500;
        var max = Math.round(total * 1.15 / 500) * 500;
        return {
            min: min,
            max: max,
            label: formatRp(min) + (min !== max ? ' - ' + formatRp(max) : ''),
            note: fare.note + ' (' + km.toFixed(1) + ' km)',
            isFlat: false,
            km: km
        };
    }

    return null;
}

function mode(id) {
    if (!MODES || !MODES.length) return { id: 'all', label: 'Semua Moda', icon: 'layout-grid', color: 'var(--mode-all)' };
    return MODES.find(x => x.id === id) || MODES[0];
}

function scrollToContent() {
    var s = document.getElementById('destinasi');
    if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const MODE_PRIORITY = { bst: 1, krl: 2, ojol: 3 };

function sortOptions(options) {
    return [...options].sort((a, b) => (MODE_PRIORITY[a[0]] || 9) - (MODE_PRIORITY[b[0]] || 9));
}
