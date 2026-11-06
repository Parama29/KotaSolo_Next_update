const COLORS = {
    indigo: 'var(--mode-bst)',
    maroon: 'var(--mode-krl)',
    sogan:  'var(--mode-angkot)',
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
            const scriptPath = path.replace(/\/script\.js$/i, '');
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
    { id: 'angkot', label: 'Angkot', icon: 'car', color: 'var(--mode-angkot)' },
    { id: 'ojol', label: 'Ojol', icon: 'bike', color: 'var(--mode-ojol)' }
];

// Fallback destinations

const DEST_FALLBACK = [
    { id:1, name:'Keraton Kasunanan Surakarta', category:'Budaya & Sejarah', desc:'Istana resmi Kasunanan Surakarta, pusat budaya Jawa yang masih aktif digunakan.', tags:['keraton','istana','budaya','sejarah','jawa','kerajaan'], coords:[-7.5775,110.8291], img:'assets/images/keraton-surakarta.jpg', options:[['bst','Koridor 2 Kartasura-Gladag','Rp 3.700','25 menit'],['angkot','Jalur AC Pasar Gede-Gladag','Rp 5.000','20 menit'],['ojol','Dari lokasi Anda','Rp 12rb-18rb','15 menit']] },
    { id:2, name:'Pasar Klewer', category:'Belanja', desc:'Pusat grosir batik terbesar di Solo, tepat di sisi barat Alun-alun Utara.', tags:['pasar','belanja','batik','grosir','textile'], coords:[-7.5732,110.8319], img:'assets/images/pasar-klewer.jpg', options:[['bst','Koridor 1 Palur-Klewer','Rp 3.700','30 menit'],['krl','Stasiun Purwosari + angkot','Rp 8.000','40 menit'],['ojol','Dari lokasi Anda','Rp 10rb-15rb','12 menit']] },
    { id:3, name:'Taman Sriwedari', category:'Rekreasi', desc:'Taman hiburan legendaris dengan gedung wayang orang dan area terbuka hijau.', tags:['taman','rekreasi','hiburan','wayang','sriwedari'], coords:[-7.5608,110.8345], img:'assets/images/taman-sriwedari.jpg', options:[['bst','Koridor 2 Kartasura-Sriwedari','Rp 3.700','22 menit'],['angkot','Jalur B Gading-Sriwedari','Rp 5.000','18 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','10 menit']] },
    { id:4, name:'Kampung Batik Kauman', category:'Budaya & Sejarah', desc:'Kampung wisata batik tertua di Solo dengan lorong-lorong rumah kolonial.', tags:['kampung','batik','kauman','budaya','sejarah','kolonial'], coords:[-7.5762,110.8273], img:'assets/images/kampung-batik-kauman.jpg', options:[['bst','Koridor 1 Palur-Gladag + jalan kaki','Rp 3.700','28 menit'],['ojol','Dari lokasi Anda','Rp 10rb-16rb','13 menit']] },
    { id:5, name:'Masjid Agung Surakarta', category:'Budaya & Sejarah', desc:'Masjid kerajaan yang berdiri sejak era Pakubuwono III, tepat di samping Pasar Klewer.', tags:['masjid','agung','islam','kerajaan','pakubuwono','sejarah'], coords:[-7.5741,110.8327], img:'assets/images/masjid-agung-surakarta.jpg', options:[['bst','Koridor 2 Kartasura-Danar Hadi','Rp 3.700','24 menit'],['krl','Stasiun Purwosari + jalan kaki','Rp 8.000','35 menit'],['ojol','Dari lokasi Anda','Rp 9rb-13rb','11 menit']] },
    { id:6, name:'Gedung Wayang Orang Sriwedari', category:'Rekreasi', desc:'Panggung wayang orang tertua di Indonesia, masih menggelar pertunjukan rutin.', tags:['wayang','orang','sriwedari','teater','budaya','pertunjukan'], coords:[-7.5605,110.8352], img:'assets/images/wayang-orang-sriwedari.jpg', options:[['bst','Koridor 1 Palur-Sriwedari','Rp 3.700','35 menit'],['angkot','Jalur A Gading-Sriwedari','Rp 6.000','30 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','10 menit']] },
    { id:7, name:'Pura Mangkunegaran', category:'Budaya & Sejarah', desc:'Pura berarsitektur Jawa-Eropa dengan koleksi sejarah Kadipaten Mangkunegaran.', tags:['pura','mangkunegaran','budaya','sejarah','kerajaan','istana'], coords:[-7.5686,110.8227], img:'assets/images/pura-mangkunegaran.jpg', options:[['bst','Koridor 1 Palur-Mangkunegaran','Rp 3.700','20 menit'],['krl','Stasiun Solo Balapan + jalan kaki','Rp 8.000','25 menit'],['ojol','Dari lokasi Anda','Rp 10rb-16rb','10 menit']] },
    { id:8, name:'Museum Batik Danar Hadi', category:'Museum', desc:'Museum batik dengan koleksi kain tradisional Nusantara di dalam kompleks House of Danar Hadi.', tags:['museum','batik','danar hadi','budaya','kain','sejarah'], coords:[-7.5680,110.8143], img:'assets/images/museum-batik-danar-hadi.jpg', options:[['bst','Koridor 2 Kartasura-Slamet Riyadi','Rp 3.700','24 menit'],['angkot','Pasar Gede-Sriwedari','Rp 5.000','20 menit'],['ojol','Dari lokasi Anda','Rp 10rb-16rb','11 menit']] },
    { id:9, name:'Museum Radya Pustaka', category:'Museum', desc:'Museum tertua di Indonesia yang menyimpan naskah, arca, dan benda bersejarah Jawa.', tags:['museum','radya pustaka','sejarah','budaya','naskah','arca'], coords:[-7.5651,110.8125], img:'assets/images/museum-radya-pustaka.jpg', options:[['bst','Koridor 2 Kartasura-Sriwedari','Rp 3.700','22 menit'],['angkot','Jalur B Gading-Sriwedari','Rp 5.000','18 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','10 menit']] },
    { id:10, name:'Benteng Vastenburg', category:'Budaya & Sejarah', desc:'Benteng peninggalan kolonial di pusat kota yang kini menjadi ruang acara dan sejarah.', tags:['benteng','vastenburg','sejarah','kolonial','landmark','kota'], coords:[-7.5697,110.8311], img:'assets/images/benteng-vastenburg.jpg', options:[['bst','Koridor 1 Palur-Gladag','Rp 3.700','25 menit'],['krl','Stasiun Solo Balapan + BST','Rp 8.000','30 menit'],['ojol','Dari lokasi Anda','Rp 10rb-15rb','12 menit']] },
    { id:11, name:'Pasar Gede Harjonagoro', category:'Belanja & Kuliner', desc:'Pasar tradisional ikonik untuk berburu jajanan, bahan segar, dan kuliner khas Solo.', tags:['pasar gede','pasar','kuliner','jajanan','belanja','tradisional'], coords:[-7.5693,110.8302], img:'assets/images/pasar-gede.jpg', options:[['bst','Koridor 1 Palur-Pasar Gede','Rp 3.700','27 menit'],['angkot','Terminal Tirtonadi-Pasar Gede','Rp 5.000','22 menit'],['ojol','Dari lokasi Anda','Rp 9rb-15rb','12 menit']] },
    { id:12, name:'Kampung Batik Laweyan', category:'Belanja & Budaya', desc:'Kampung saudagar batik dengan workshop, toko kain, dan gang bersejarah yang khas.', tags:['laweyan','kampung batik','batik','belanja','budaya','kampung wisata'], coords:[-7.5688,110.7953], img:'assets/images/kampung-batik-laweyan.jpg', options:[['bst','Koridor 2 Kartasura-Laweyan','Rp 3.700','30 menit'],['angkot','Jalur A Gading-Laweyan','Rp 5.000','25 menit'],['ojol','Dari lokasi Anda','Rp 12rb-18rb','14 menit']] },
    { id:13, name:'Taman Balekambang', category:'Taman & Rekreasi', desc:'Taman kota bersejarah dengan ruang hijau, danau, serta area rekreasi keluarga.', tags:['balekambang','taman','rekreasi','keluarga','ruang hijau','danau'], coords:[-7.5542,110.8075], img:'assets/images/taman-balekambang.jpg', options:[['bst','Koridor 1 Palur-Manahan','Rp 3.700','28 menit'],['angkot','Pasar Gede-Balekambang','Rp 5.000','24 menit'],['ojol','Dari lokasi Anda','Rp 10rb-16rb','13 menit']] },
    { id:14, name:'Solo Safari', category:'Taman & Rekreasi', desc:'Destinasi edukasi satwa dan rekreasi keluarga dengan area jelajah yang interaktif.', tags:['solo safari','kebun binatang','satwa','rekreasi','keluarga','edukasi'], coords:[-7.5942,110.8654], img:'assets/images/solo-safari.jpg', options:[['bst','Koridor 3 Terminal-Jurug','Rp 3.700','35 menit'],['angkot','Jalur timur Palur-Jurug','Rp 6.000','30 menit'],['ojol','Dari lokasi Anda','Rp 15rb-24rb','18 menit']] },
    { id:15, name:'Taman Cerdas Jebres', category:'Taman & Rekreasi', desc:'Ruang edukasi dan bermain publik yang ramah keluarga di kawasan Jebres.', tags:['taman cerdas','jebres','taman','edukasi','keluarga','rekreasi'], coords:[-7.5596,110.8540], img:'assets/images/taman-cerdas-jebres.jpg', options:[['bst','Koridor 1 Palur-Jebres','Rp 3.700','25 menit'],['angkot','Pasar Gede-Jebres','Rp 5.000','20 menit'],['ojol','Dari lokasi Anda','Rp 9rb-15rb','11 menit']] },
    { id:16, name:'Galabo Solo', category:'Kuliner', desc:'Sentra kuliner malam di pusat kota untuk menikmati hidangan khas Solo dan jajanan lokal.', tags:['galabo','kuliner','kuliner malam','jajanan','makanan','street food'], coords:[-7.5700,110.8290], img:'assets/images/galabo-solo.jpg', options:[['bst','Koridor 1 Palur-Gladag','Rp 3.700','25 menit'],['krl','Stasiun Solo Balapan + BST','Rp 8.000','30 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','10 menit']] },
    { id:17, name:'Gedung Djoeang 45', category:'Budaya & Sejarah', desc:'Bangunan bersejarah dekat Benteng Vastenburg yang menjadi ruang kreatif dan kuliner.', tags:['gedung djoeang','djoeang 45','sejarah','kolonial','kuliner','landmark'], coords:[-7.5708,110.8304], img:'assets/images/gedung-djoeang-45.svg', options:[['bst','Koridor 1 Palur-Gladag','Rp 3.700','25 menit'],['angkot','Pasar Gede-Gladag','Rp 5.000','20 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','11 menit']] },
    { id:18, name:'Museum Keris Nusantara', category:'Museum', desc:'Museum tematik yang mengenalkan keris sebagai warisan budaya dan karya seni Nusantara.', tags:['museum keris','keris','museum','budaya','pusaka','nusantara'], coords:[-7.5725,110.8129], img:'assets/images/museum-keris-nusantara.jpg', options:[['bst','Koridor 2 Kartasura-Sriwedari','Rp 3.700','22 menit'],['angkot','Jalur B Gading-Sriwedari','Rp 5.000','18 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','10 menit']] }
    ,{ id:19, name:'Stadion Manahan Solo', category:'Olahraga & Rekreasi', desc:'Stadion berstandar internasional dan ikon kota Solo, sering menggelar konser dan event besar.', tags:['stadion','manahan','olahraga','konser','event','sepakbola'], coords:[-7.5497,110.8084], img:'assets/images/stadion-manahan.jpg', options:[['bst','Koridor 1 Palur-Manahan','Rp 3.700','20 menit'],['angkot','Pasar Gede-Manahan','Rp 5.000','18 menit'],['ojol','Dari lokasi Anda','Rp 9rb-14rb','10 menit']] }
    ,{ id:20, name:'Solo Grand Mall', category:'Belanja', desc:'Pusat perbelanjaan modern di jantung kota Solo dengan beragam tenant fashion, kuliner, dan hiburan.', tags:['mall','belanja','fashion','kuliner','hiburan','modern'], coords:[-7.5580,110.8220], img:'assets/images/solo-grand-mall.jpg', options:[['bst','Koridor 2 Kartasura-SGM','Rp 3.700','18 menit'],['krl','Stasiun Solo Balapan + jalan kaki','Rp 8.000','25 menit'],['ojol','Dari lokasi Anda','Rp 8rb-13rb','8 menit']] }
    ,{ id:21, name:'Taman Satwa Taru Jurug', category:'Taman & Rekreasi', desc:'Kebun binatang tertua di Solo dengan koleksi satwa dan area bermain keluarga di tepi Bengawan Solo.', tags:['kebun binatang','jurug','satwa','taman','rekreasi','keluarga'], coords:[-7.5530,110.8640], img:'assets/images/taman-jurug.jpg', options:[['bst','Koridor 3 Terminal-Jurug','Rp 3.700','30 menit'],['angkot','Jalur timur-Jurug','Rp 5.000','25 menit'],['ojol','Dari lokasi Anda','Rp 12rb-18rb','15 menit']] }
    ,{ id:22, name:'Rumah Atsiri Indonesia', category:'Wisata Edukasi', desc:'Museum dan taman tanaman aromatik interaktif dengan pemandangan indah khas pedesaan Solo.', tags:['rumah atsiri','aromatik','museum','edukasi','taman','wisata'], coords:[-7.6042,110.7153], img:'assets/images/rumah-atsiri.jpg', options:[['ojol','Dari lokasi Anda','Rp 20rb-30rb','30 menit']] }
];
var _rawModes = (window.__MODES__ && window.__MODES__.length) ? window.__MODES__ : null;
var MODES = _rawModes
    ? _rawModes.map(function(m) {
        var slug = typeof m.slug === 'string' && /^[a-z0-9-]+$/i.test(m.slug) ? m.slug : 'all';
        var fallback = MODES_FALLBACK.find(function(f) { return f.id === slug; });
        return {
            id:    slug,
            label: typeof m.name === 'string' ? m.name : slug,
            icon:  (fallback ? fallback.icon : (m.icon || 'bus')),
            color: 'var(--mode-' + slug + ')',
        };
    })
    : MODES_FALLBACK;
if (!MODES.some(function(m){ return m.id === 'all'; })) MODES = [MODES_FALLBACK[0]].concat(MODES);

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeDestination(destination) {
    var item = destination || {};
    var coords = Array.isArray(item.coords) && item.coords.length === 2
        ? [Number(item.coords[0]), Number(item.coords[1])]
        : [NaN, NaN];
    return {
        id: item.id,
        name: typeof item.name === 'string' ? item.name : 'Destinasi tanpa nama',
        category: typeof item.category === 'string' ? item.category : 'Destinasi',
        desc: typeof item.desc === 'string' ? item.desc : '',
        tags: Array.isArray(item.tags) ? item.tags.filter(function(tag) {
            return typeof tag === 'string';
        }) : [],
        coords: coords,
        img: typeof item.img === 'string' ? item.img : '',
        options: Array.isArray(item.options) ? item.options.filter(function(option) {
            return Array.isArray(option) && option.length >= 4;
        }) : []
    };
}

var DEST = ((window.__DEST__ && window.__DEST__.length) ? window.__DEST__ : DEST_FALLBACK)
    .map(normalizeDestination)
    .filter(function(destination) {
        return Number.isFinite(destination.coords[0]) && Number.isFinite(destination.coords[1]);
    });


const GALLERY = (function() {
    if (!DEST || !DEST.length) return DEST_FALLBACK.slice(0, 6);
    var base = DEST.slice(0, 5);
    var sixth = DEST[5];
    if (sixth) {
        base.push(Object.assign({}, sixth, { name: 'Wayang Orang Sriwedari', desc: 'Pertunjukan panggung tertua di Indonesia, masih hidup di tengah kota.' }));
    }
    return base;
})();



const MODE_GRADIENTS = {
    bst:    'linear-gradient(to top, #6366f1cc, #6366f122)',
    krl:    'linear-gradient(to top, #ec4899cc, #ec489922)',
    angkot: 'linear-gradient(to top, #f59e0bcc, #f59e0b22)',
    ojol:   'linear-gradient(to top, #22d3eecc, #22d3ee22)',
    all:    'linear-gradient(to top, #7c3aedcc, #7c3aed22)',
};

// Entry fees

const ENTRY_FEES = {
    1:  { fee: 15000, note: 'Tiket masuk', free: false },
    2:  { fee: 0, note: 'Gratis', free: true },
    3:  { fee: 5000, note: 'Tiket masuk', free: false },
    4:  { fee: 0, note: 'Gratis', free: true },
    5:  { fee: 0, note: 'Gratis', free: true },
    6:  { fee: 20000, note: 'Tiket pertunjukan', free: false },
    7:  { fee: 30000, note: 'Tiket masuk', free: false },
    8:  { fee: 35000, note: 'Tiket masuk', free: false },
    9:  { fee: 5000, note: 'Tiket masuk', free: false },
    10: { fee: 0, note: 'Gratis', free: true },
    11: { fee: 0, note: 'Gratis', free: true },
    12: { fee: 0, note: 'Gratis', free: true },
    13: { fee: 5000, note: 'Tiket masuk', free: false },
    14: { fee: 75000, note: 'Tiket dewasa', free: false },
    15: { fee: 0, note: 'Gratis', free: true },
    16: { fee: 0, note: 'Gratis', free: true },
    17: { fee: 0, note: 'Gratis', free: true },
    18: { fee: 10000, note: 'Tiket masuk', free: false },
    19: { fee: 0, note: 'Gratis', free: true },
    20: { fee: 0, note: 'Gratis', free: true },
    21: { fee: 20000, note: 'Tiket masuk', free: false },
    22: { fee: 50000, note: 'Tiket masuk', free: false },
};

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

const TRANSPORT_POINTS = {
    bst: [
        { id:'halte-gladag', name:'Halte Gladag', coords:[-7.5697, 110.8295] },
        { id:'halte-sriwedari', name:'Halte Sriwedari', coords:[-7.5625, 110.8145] },
        { id:'halte-manahan', name:'Halte Manahan', coords:[-7.5510, 110.8085] },
        { id:'halte-kartasura', name:'Terminal Kartasura', coords:[-7.5572, 110.7445] },
        { id:'halte-palur', name:'Terminal Palur', coords:[-7.5590, 110.8795] },
        { id:'halte-tirtonadi', name:'Terminal Tirtonadi', coords:[-7.5560, 110.8300] },
        { id:'halte-laweyan', name:'Halte Laweyan', coords:[-7.5690, 110.7985] },
        { id:'halte-pasar-gede', name:'Halte Pasar Gede', coords:[-7.5695, 110.8305] },
    ],
    krl: [
        { id:'st-solo-balapan', name:'Stasiun Solo Balapan', coords:[-7.5579, 110.8226] },
        { id:'st-purwosari', name:'Stasiun Purwosari', coords:[-7.5660, 110.8093] },
        { id:'st-solo-kota', name:'Stasiun Solo Kota', coords:[-7.5748, 110.8278] },
        { id:'st-sangkrah', name:'Stasiun Sangkrah', coords:[-7.5730, 110.8420] },
        { id:'st-jebres', name:'Stasiun Jebres', coords:[-7.5600, 110.8545] },
    ],
    angkot: [
        { id:'ak-pasar-gede', name:'Pasar Gede', coords:[-7.5693, 110.8302] },
        { id:'ak-tirtonadi', name:'Terminal Tirtonadi', coords:[-7.5560, 110.8300] },
        { id:'ak-kartasura', name:'Terminal Kartasura', coords:[-7.5572, 110.7445] },
        { id:'ak-jebres', name:'Terminal Jebres', coords:[-7.5600, 110.8545] },
        { id:'ak-gading', name:'Terminal Gading', coords:[-7.6040, 110.8270] },
    ],
    ojol: [
        { id:'ojol-current', name:'Lokasi saya sekarang', coords: null },
    ]
};
const TRANSPORT_FARES = {
    bst:    { type:'flat', amount:3700, note:'Tarif flat BST' },
    krl:    { type:'flat', amount:8000, note:'Tarif flat KRL' },
    angkot: { type:'flat', amount:5000, note:'Tarif flat angkot' },
    ojol:   { type:'per_km', perKm:2000, bookingFee:2500, minFare:7000, note:'Rp 2rb/km + booking Rp 2.5rb' },
};
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
const MODE_RGB = {
    bst:    '99,102,241',
    krl:    '236,72,153',
    angkot: '245,158,11',
    ojol:   '34,211,238',
    all:    '124,58,237',
};



let filter           = 'all';
let selected         = null;
let gIndex           = 0;
let sIndex           = 0;
let gTimer;
let routeLayer;
let originMarker;
let selectingMapOrigin = false;

const chips       = document.getElementById('chips');
const content     = document.getElementById('content');
const input       = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');



function mode(id) {
    if (!MODES || !MODES.length) return { id: 'all', label: 'Semua Moda', icon: 'layout-grid', color: 'var(--mode-all)' };
    return MODES.find(x => x.id === id) || MODES[0];
}

function scrollToContent() {
    var s = document.getElementById('destinasi');
    if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const MODE_PRIORITY = { bst: 1, krl: 2, angkot: 3, ojol: 4 };

function sortOptions(options) {
    return [...options].sort((a, b) => (MODE_PRIORITY[a[0]] || 9) - (MODE_PRIORITY[b[0]] || 9));
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

    sIndex = 0;

    content.innerHTML = `
        <div class="slider" id="slider">
            <button type="button" class="arrow slider-arrow prev" id="sliderPrev" aria-label="Foto sebelumnya"><i data-lucide="chevron-left"></i></button>
            <div class="slider-viewport" id="sliderViewport">
            <div class="slider-track" id="sliderTrack">
            ${filteredDest.map((d, index) => {
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

    let startX = 0;
    viewport.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', e => {
        const delta = e.changedTouches[0].clientX - startX;
        if (delta > 50)       goSlide(sIndex - 1);
        else if (delta < -50) goSlide(sIndex + 1);
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
                <div class="transit-note">
                    <i data-lucide="info" width="15"></i>
                    Utamakan transportasi umum. Cek jadwal dan tarif terbaru sebelum berangkat.
                </div>
                ${options.length
                    ? options.map((option, index) => {
                        const transport = mode(option[0]);
                        const rgb       = MODE_RGB[option[0]] || '124,58,237';
                        return `
                            <div class="route-item${option[0] === 'ojol' ? ' last-mile' : ''}"
                                 style="--mode-color:var(--mode-${option[0]});--mode-color-rgb:${rgb}">
                                <div class="mode-icon" style="background:var(--mode-${option[0]})">
                                    <i data-lucide="${transport.icon}" width="18"></i>
                                </div>
                                <div class="route-main">
                                    <b>                                    ${escapeHtml(transport.label)}</b>
                                    <span>                                    ${escapeHtml(sanitizeDesc(option[1]))}</span>
                                </div>
                                <div class="route-meta">
                                    <div class="route-price">${escapeHtml(option[2])}</div>
                                    <div class="route-time">${escapeHtml(option[3])}</div>
                                </div>
                            </div>`;
                    }).join('')
                    : `<div class="empty-state">
                            <svg width="72" height="72" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                                <circle cx="40" cy="40" r="38" stroke="var(--border-strong)" stroke-width="2"/>
                                <circle cx="28" cy="34" r="4" fill="var(--text-3)"/>
                                <circle cx="52" cy="34" r="4" fill="var(--text-3)"/>
                                <path d="M26 54 Q40 46 54 54" stroke="var(--text-3)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                            </svg>
                            <p class="empty-text">Gak ada rute buat filter ini. Coba ganti pilihan moda atau pilih destinasi lain.</p>
                        </div>`
                }
                <div class="cost-summary" id="costSummary">
                    <div class="cost-summary__title"><i data-lucide="wallet" width="15"></i> Estimasi Dana</div>
                    <div class="cost-origin-wrap">
                        <label class="cost-origin-label">
                            <i data-lucide="map-pin" width="13"></i>
                            Berangkat dari
                        </label>
                        <div class="cost-origin-selects">
                            ${(function(){
                                var modes = [...new Set(destination.options.map(function(o){return o[0];}))];
                                var selects = modes.map(function(modeId) {
                                    var pts = TRANSPORT_POINTS[modeId] || [];
                                    if (!pts.length) return '';
                                    var mInfo = mode(modeId);
                                    var opts = pts.map(function(p) {
                                        return '<option value="' + p.id + '" data-lat="' + (p.coords ? p.coords[0] : '') + '" data-lng="' + (p.coords ? p.coords[1] : '') + '">' + p.name + '</option>';
                                    }).join('');
                                    return '<select class="cost-origin-select" data-mode="' + modeId + '" style="--mode-color:var(--mode-' + modeId + ')">'
                                        + '<option value="">-- Pilih titik ' + mInfo.label + ' --</option>'
                                        + opts + '</select>';
                                });
                                return selects.join('');
                            })()}
                        </div>
                    </div>
                    <div class="cost-summary__rows" id="costRows">
                        <p class="cost-hint"><i data-lucide="arrow-up" width="12"></i> Pilih titik keberangkatan untuk melihat estimasi ongkos</p>
                    </div>
                    <div class="cost-divider"></div>
                    <div class="cost-row">
                        <span class="cost-row__label"><i data-lucide="ticket" width="13"></i> Tiket masuk</span>
                        <span class="cost-row__value${(ENTRY_FEES[destination.id]||{free:true}).free ? ' cost-row__value--free' : ''}">${(function(){var e=ENTRY_FEES[destination.id]||{fee:0,free:true};return e.free?'Gratis':formatRp(e.fee);})()}</span>
                    </div>
                    ${(ENTRY_FEES[destination.id]||{}).note ? '<div class="cost-note">' + ((ENTRY_FEES[destination.id]||{}).note) + '</div>' : ''}
                    <div class="cost-total" id="costTotal" style="display:none">
                        <span>Total estimasi</span>
                        <strong id="costTotalValue">-</strong>
                    </div>
                    <p class="cost-disclaimer">*Tarif dapat berubah. Cek info terbaru sebelum berangkat.</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('closeBtn').onclick = () => {
        input.value = '';
        filter = 'all';
        renderChips();
        renderCards();
    };
    setTimeout(function() {
        var selects = document.querySelectorAll('.cost-origin-select');
        selects.forEach(function(sel) {
            sel.addEventListener('change', function() {
                updateCostSummary(destination);
            });
        });
        createIconsSafe();
    }, 0);
}
function updateCostSummary(destination) {
    var selects   = document.querySelectorAll('.cost-origin-select');
    var costRows  = document.getElementById('costRows');
    var costTotal = document.getElementById('costTotal');
    var costTotalValue = document.getElementById('costTotalValue');
    if (!costRows) return;
    var anySelected = false;
    var rows = [];
    var minTransportAll = Infinity;
    var maxTransportAll = 0;

    selects.forEach(function(sel) {
        if (!sel.value) return;
        anySelected = true;
        var modeId = sel.dataset.mode;
        var opt = sel.options[sel.selectedIndex];
        var lat = parseFloat(opt.dataset.lat);
        var lng = parseFloat(opt.dataset.lng);
        var originCoords = (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
        var destCoords   = destination.coords;
        var mInfo        = mode(modeId);

        var fareResult = calcTransportFare(modeId, originCoords, destCoords);
        if (!fareResult && modeId === 'ojol') {
            var oLat = parseFloat(document.getElementById('originLat').value);
            var oLng = parseFloat(document.getElementById('originLng').value);
            if (isFinite(oLat) && isFinite(oLng)) {
                fareResult = calcTransportFare('ojol', [oLat, oLng], destCoords);
            } else {
                rows.push('<p class="cost-hint">Ojol: isi titik awal di Route Planner untuk menghitung ongkos.</p>');
                return;
            }
        }
        if (!fareResult) return;

        minTransportAll = Math.min(minTransportAll, fareResult.min);
        maxTransportAll = Math.max(maxTransportAll, fareResult.max);

        rows.push(
            '<div class="cost-row cost-row--transport" style="--mode-color:var(--mode-' + modeId + ')">'
          + '<span class="cost-row__label">'
          + '<span class="cost-row__mode-dot" style="background:var(--mode-' + modeId + ')"></span>'
          + mInfo.label + '</span>'
          + '<div class="cost-row__right">'
          + '<span class="cost-row__value">' + fareResult.label + '</span>'
          + '<span class="cost-row__sub">' + (fareResult.isFlat ? 'Tarif tetap' : fareResult.note.split(' (')[0]) + '</span>'
          + '</div>'
          + '</div>'
        );
    });

    if (!anySelected) {
        costRows.innerHTML = '<p class="cost-hint"><i data-lucide="arrow-up" width="12"></i> Pilih titik keberangkatan untuk melihat estimasi ongkos</p>';
        if (costTotal) costTotal.style.display = 'none';
        createIconsSafe();
        return;
    }

    costRows.innerHTML = rows.join('');
    var ef = ENTRY_FEES[destination.id] || { fee: 0, free: true };
    var minTotal = (minTransportAll === Infinity ? 0 : minTransportAll) + ef.fee;
    var maxTotal = maxTransportAll + ef.fee;

    if (costTotal && costTotalValue) {
        costTotal.style.display = 'flex';
        costTotalValue.textContent = minTotal === maxTotal
            ? formatRp(minTotal)
            : formatRp(minTotal) + ' - ' + formatRp(maxTotal);
    }

    createIconsSafe();
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

// Gallery

function renderGallery() {
    const stage   = document.getElementById('galleryStage');
    const filmEl  = document.getElementById('dots');
    if (!GALLERY || !GALLERY.length) {
        stage.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:240px;padding:40px 20px;"><svg width="64" height="64" viewBox="0 0 80 80" fill="none" aria-hidden="true"><circle cx="40" cy="40" r="38" stroke="var(--border-strong)" stroke-width="2"/><circle cx="28" cy="34" r="4" fill="var(--text-3)"/><circle cx="52" cy="34" r="4" fill="var(--text-3)"/><path d="M26 54 Q40 46 54 54" stroke="var(--text-3)" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg><p style="margin-top:16px;color:var(--text-3);font-size:14px;font-family:\'Plus Jakarta Sans\',sans-serif">Galeri foto tidak tersedia</p></div>';
        filmEl.innerHTML = '';
        return;
    }
    if (!stage.dataset.built) {
        stage.innerHTML =
            GALLERY.map((item, index) => `
                <img class="${index === 0 ? 'active' : ''}" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}"
                     loading="lazy" decoding="async" onerror="this.style.display='none'">
            `).join('')
            + `
            <button class="arrow prev" id="prev" aria-label="Foto sebelumnya"><i data-lucide="chevron-left"></i></button>
            <button class="arrow next" id="next" aria-label="Foto berikutnya"><i data-lucide="chevron-right"></i></button>
            <div class="caption">
                <span class="badge" id="gCount"></span>
                <h3 id="gTitle"></h3>
                <p id="gDesc"></p>
            </div>`;
        filmEl.innerHTML = GALLERY.map((item, index) => `
            <button class="thumb" data-i="${index}"
                    aria-label="Lihat foto ${escapeHtml(item.name)}"
                    style="background-image:url('${escapeHtml(item.img)}')"><span class="thumb-overlay"></span></button>
        `).join('');
        document.getElementById('prev').onclick = () => goGallery(-1);
        document.getElementById('next').onclick = () => goGallery(1);
        filmEl.querySelectorAll('.thumb').forEach(button => {
            button.onclick = () => {
                gIndex = Number(button.dataset.i);
                renderGallery();
                resetTimer();
                const target = document.getElementById('galeri');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        });
        stage.dataset.built = '1';
        createIconsSafe();
    }
    const current = GALLERY[gIndex];
    stage.querySelectorAll('img').forEach((img, index) => img.classList.toggle('active', index === gIndex));
    filmEl.querySelectorAll('.thumb').forEach((thumb, index) => thumb.classList.toggle('active', index === gIndex));
    document.getElementById('gCount').textContent = (gIndex + 1) + ' / ' + GALLERY.length;
    document.getElementById('gTitle').textContent = current.name;
    document.getElementById('gDesc').textContent = current.desc;
}

function goGallery(direction) {
    gIndex = (gIndex + direction + GALLERY.length) % GALLERY.length;
    renderGallery();
    resetTimer();
}

function resetTimer() {
    clearInterval(gTimer);
    gTimer = setInterval(() => {
        gIndex = (gIndex + 1) % GALLERY.length;
        renderGallery();
    }, 4500);
}



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
    let startX = 0;
    stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend',   e => {
        const delta = e.changedTouches[0].clientX - startX;
        if (delta > 50)       goGallery(-1);
        else if (delta < -50) goGallery(1);
    }, { passive: true });
}



let map;

function initMap() {
    var mapElement = document.getElementById('map');
    if (!mapElement) return;
    if (!window.L || typeof window.L.map !== 'function') {
        mapElement.innerHTML = '<div class="map-error" role="alert">Peta tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.</div>';
        return;
    }

    const isMobile = window.innerWidth < 800;

    map = L.map('map', {
        center: [-7.5670, 110.8300],
        zoom: isMobile ? 12 : 13,
        zoomControl: !isMobile,
    });

    if (isMobile) L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (!DEST || !DEST.length) {
        L.marker([-7.5670, 110.8300]).addTo(map)
         .bindPopup('<div style="font-family:\'Plus Jakarta Sans\',sans-serif;padding:8px 10px;"><strong style="font-size:13px;color:#ec4899;">Data destinasi tidak tersedia</strong><br><span style="font-size:11px;color:#9ca3af;">Periksa koneksi database</span></div>')
         .openPopup();
    } else {
        DEST.forEach(destination => {
            const marker = L.marker(destination.coords).addTo(map);
            marker.bindPopup(`
                <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px 2px;">
                    <strong style="font-size:13px;color:#7c3aed;">${escapeHtml(destination.name)}</strong><br>
                    <span style="font-size:11px;color:#9ca3af;">${escapeHtml(destination.category)}</span>
                </div>
            `);
        });
    }

    map.on('click', event => {
        if (!selectingMapOrigin) return;
        setOrigin(event.latlng.lat, event.latlng.lng);
        selectingMapOrigin = false;
        document.getElementById('plannerStatus').textContent = 'Titik awal dipilih dari peta.';
    });

    setTimeout(() => map.invalidateSize(), 100);
    loadBstRouteOverlay();
}

const TRANSIT_GROUPS = [
    { id: 'bst', label: 'BST 1–5', popup: 'BST · Koridor ', dash: null, routes: [
        { code: '1', color: '#c84c3a' }, { code: '2', color: '#3879b8' },
        { code: '3', color: '#36846a' }, { code: '4', color: '#8656a6' },
        { code: '5', color: '#c28a27' } ] },
    { id: 'f', label: 'Rute F7–F12', popup: 'Rute ', dash: null, routes: [
        { code: 'F7',  color: '#d9822b' }, { code: 'F8',  color: '#2a9d8f' },
        { code: 'F9',  color: '#e76f9a' }, { code: 'F10', color: '#5c6bc0' },
        { code: 'F12', color: '#7a8b3a' } ] },
    { id: 's', label: 'Rute S1–S2', popup: 'Rute ', dash: '8 6', routes: [
        { code: 'S1', color: '#0ea5b7' }, { code: 'S2', color: '#e11d48' } ] }
];

function loadBstRouteOverlay() {
    const box    = document.getElementById('routeToggles');
    const legend = document.getElementById('routeLegend');
    const status = document.getElementById('bstRouteStatus');
    if (!map || !window.L || !box || !legend || !status) return;

    const groups = TRANSIT_GROUPS.map(g => Object.assign({}, g, {
        visible: true, loaded: 0, btn: null,
        routes: g.routes.map(r => Object.assign({}, r, { layer: null, btn: null }))
    }));
    groups.forEach(g => g.routes.forEach(r => { r.group = g; }));
    const routeList = groups.reduce((all, g) => all.concat(g.routes), []);
    let selectedCode = null;

    box.innerHTML = '';
    groups.forEach(g => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-outline bst-map-toggle';
        b.disabled = true;
        b.textContent = 'Memuat ' + g.label + '...';
        box.appendChild(b);
        g.btn = b;
    });
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn-outline bst-map-toggle';
    resetBtn.textContent = 'Tampilkan semua jalur';
    resetBtn.disabled = true;
    box.appendChild(resetBtn);

    legend.innerHTML = '';
    groups.forEach(g => {
        const title = document.createElement('span');
        title.className = 'bst-map-legend__title';
        title.textContent = g.id === 'bst' ? 'BST' : g.id.toUpperCase();
        legend.appendChild(title);
        g.routes.forEach(r => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'bst-legend-btn';
            b.style.setProperty('--route-color', r.color);
            b.setAttribute('aria-pressed', 'false');
            b.title = 'Tampilkan hanya rute ' + r.code;
            b.disabled = true;
            b.innerHTML = '<i></i>' + r.code;
            legend.appendChild(b);
            r.btn = b;
        });
    });

    function validSegment(segment) {
        return Array.isArray(segment) && segment.length >= 2 && segment.every(point =>
            Array.isArray(point) && point.length >= 2 &&
            Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
            point[0] >= -180 && point[0] <= 180 && point[1] >= -90 && point[1] <= 90);
    }

    async function loadRoute(route) {
        try {
            const response = await fetch(`${API_BASE}/transit-routes?route_code=${encodeURIComponent(route.code)}`);
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            const payload  = await response.json();
            const segments = payload && payload.data && payload.data.segments;
            if (!Array.isArray(segments) || !segments.length) throw new Error('Route geometry is missing');
            if (!segments.every(validSegment)) throw new Error('Route geometry contains invalid coordinates');
            route.layer = L.geoJSON({
                type: 'FeatureCollection',
                features: segments.map(s => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: s } }))
            }, {
                style: { color: route.color, weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: route.group.dash },
                bubblingMouseEvents: false
            });
            route.layer.bindPopup(route.group.popup + route.code);
            route.group.loaded++;
        } catch (error) {
            console.error(`Rute ${route.code} gagal dimuat:`, error);
        }
    }

    function applyVisibility() {
        routeList.forEach(r => {
            if (!r.layer) return;
            const show = selectedCode ? r.code === selectedCode : r.group.visible;
            if (show && !map.hasLayer(r.layer)) r.layer.addTo(map);
            if (!show && map.hasLayer(r.layer)) map.removeLayer(r.layer);
            r.layer.setStyle({ weight: selectedCode === r.code ? 6 : 4 });
            if (show && selectedCode === r.code) r.layer.bringToFront();
            r.btn.classList.toggle('is-active', selectedCode === r.code);
            r.btn.classList.toggle('is-dim', !!selectedCode && selectedCode !== r.code);
            r.btn.setAttribute('aria-pressed', String(selectedCode === r.code));
            r.btn.title = selectedCode === r.code
                ? 'Klik lagi untuk menampilkan semua jalur'
                : 'Tampilkan hanya rute ' + r.code;
        });
        groups.forEach(g => {
            if (!g.loaded) return;
            const shown = selectedCode ? g.routes.some(r => r.code === selectedCode) : g.visible;
            g.btn.textContent = (shown ? 'Sembunyikan ' : 'Tampilkan ') + g.label;
            g.btn.setAttribute('aria-pressed', String(shown));
        });
        resetBtn.disabled = !selectedCode && groups.every(g => !g.loaded || g.visible);

        const total  = routeList.length;
        const loaded = routeList.filter(r => r.layer).length;
        let text;
        if (selectedCode) {
            text = `Hanya rute ${selectedCode} ditampilkan. Klik lagi untuk menampilkan semua.`;
        } else {
            const shown = groups.filter(g => g.visible && g.loaded).map(g => g.label);
            text = shown.length ? `Ditampilkan: ${shown.join(', ')}.` : 'Semua jalur disembunyikan.';
        }
        if (loaded < total) text += ` ${loaded} dari ${total} rute berhasil dimuat.`;
        status.textContent = text;
    }

    function selectRoute(route) {
        if (selectedCode === route.code) {
            selectedCode = null;
            applyVisibility();
            return;
        }
        selectedCode = route.code;
        applyVisibility();
        try { map.fitBounds(route.layer.getBounds(), { padding: [30, 30] }); } catch (e) { /* bounds tidak tersedia */ }
    }

    Promise.all(routeList.map(loadRoute)).then(() => {
        if (!routeList.some(r => r.layer)) {
            status.textContent = 'Jalur gagal dimuat. Periksa koneksi API.';
        }
        groups.forEach(g => {
            if (!g.loaded) { g.btn.textContent = g.label + ' tidak tersedia'; return; }
            g.btn.disabled = false;
            g.btn.addEventListener('click', () => {
                selectedCode = null;
                g.visible = !g.visible;
                applyVisibility();
            });
        });
        routeList.forEach(r => {
            if (!r.layer) { r.btn.title = 'Rute ' + r.code + ' tidak tersedia'; return; }
            r.btn.disabled = false;
            r.btn.addEventListener('click', () => selectRoute(r));
        });
        resetBtn.addEventListener('click', () => {
            selectedCode = null;
            groups.forEach(g => { g.visible = true; });
            applyVisibility();
        });
        if (routeList.some(r => r.layer)) applyVisibility();
    });
}

function setOrigin(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }
    document.getElementById('originLat').value = lat.toFixed(6);
    document.getElementById('originLng').value = lng.toFixed(6);
    if (!map) return true;
    if (originMarker) {
        originMarker.setLatLng([lat, lng]);
    } else {
        originMarker = L.marker([lat, lng]).addTo(map);
    }
    originMarker.bindPopup('Posisi awal perjalanan').openPopup();
    return true;
}



function initRoutePlanner() {
    const destinationSelect = document.getElementById('routeDestination');
    const status            = document.getElementById('plannerStatus');
    const result            = document.getElementById('plannerResult');
    destinationSelect.innerHTML = '<option value="">Pilih destinasi...</option>' +
        DEST.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)}</option>`).join('');
    destinationSelect.addEventListener('change', function() {
        const wrap = this.closest('.field-wrap');
        if (wrap) wrap.classList.toggle('field-wrap--active', this.value !== '');
    });

    const locBtn = document.getElementById('useLocation');
    locBtn.onclick = () => {
        if (!window.isSecureContext) {
            status.textContent = 'GPS hanya jalan di HTTPS. Buka situs lewat https:// atau isi koordinat manual.';
            return;
        }
        if (!navigator.geolocation) {
            status.textContent = 'Browser tidak mendukung lokasi perangkat.';
            return;
        }
        locBtn.disabled = true;
        status.textContent = 'Mencari lokasi... (izinkan akses lokasi jika diminta)';

        const done = () => { locBtn.disabled = false; };
        const ok = pos => {
            done();
            setOrigin(pos.coords.latitude, pos.coords.longitude);
            if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 15);
            status.textContent = 'Lokasi awal berhasil digunakan (akurasi \u00b1' + Math.round(pos.coords.accuracy) + ' m).';
        };
        const fail = err => {
            done();
            const msg = {
                1: 'Izin lokasi ditolak. Ketuk ikon gembok di address bar > Izin > Lokasi > Izinkan, lalu coba lagi.',
                2: 'Lokasi tidak terdeteksi. Pastikan GPS/Lokasi HP aktif.',
                3: 'Waktu pencarian lokasi habis. Coba lagi di tempat terbuka atau klik peta.'
            };
            status.textContent = msg[err && err.code] || 'Lokasi tidak tersedia. Klik peta atau isi koordinat.';
        };

        // Coba cepat (jaringan/wifi) dulu, kalau gagal baru GPS akurasi tinggi.
        navigator.geolocation.getCurrentPosition(ok, err => {
            if (err && err.code === 1) return fail(err);
            status.textContent = 'Mencoba GPS akurasi tinggi...';
            navigator.geolocation.getCurrentPosition(ok, fail,
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
        }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    };

    document.getElementById('pickOnMap').onclick = () => {
        if (!map) {
            status.textContent = 'Peta belum tersedia. Isi koordinat secara manual.';
            return;
        }
        selectingMapOrigin = true;
        status.textContent = 'Klik titik awal pada peta di bawah.';
        map.getContainer().scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    document.getElementById('findRoute').onclick = async () => {
        const lat         = Number(document.getElementById('originLat').value);
        const lng         = Number(document.getElementById('originLng').value);
        const destination = DEST.find(item => item.id === Number(destinationSelect.value));
        const selectedMode = document.getElementById('routeMode').value;

        if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180 || !destination) {
            status.textContent = 'Isi posisi awal dan pilih destinasi terlebih dahulu.';
            return;
        }

        if (selectedMode !== 'public' && selectedMode !== 'all' &&
            !destination.options.some(o => o[0] === selectedMode)) {
            status.textContent = 'Moda ini tidak tersedia untuk destinasi tersebut. Pilih moda lain.';
            return;
        }

        status.textContent = 'Menghitung rute jalan...';
        result.classList.add('loading');

        try {
            const coords   = `${lng},${lat};${destination.coords[1]},${destination.coords[0]}`;
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
            );
            if (!response.ok) throw new Error('Routing unavailable');

            const data = await response.json();
            if (!data.routes || !data.routes.length) throw new Error('No route');

            if (!map || !window.L) throw new Error('Map unavailable');
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#7c3aed', weight: 5, opacity: 0.85 }
            }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });

            const distance  = (data.routes[0].distance / 1000).toFixed(1);
            const duration  = Math.ceil(data.routes[0].duration / 60);
            const modeLabel = selectedMode === 'public' ? 'BST/KRL/angkot' : (mode(selectedMode) || {}).label || selectedMode;
            var km = parseFloat(distance);
            var ef = ENTRY_FEES[destination.id] || { fee: 0, free: true, note: '' };

            var modesFareCalc = [];
            if (selectedMode === 'public' || selectedMode === 'bst' || selectedMode === 'all') {
                modesFareCalc.push({ id:'bst',    label:'BST Batik Solo Trans', fare:3700,  fareStr:'Rp 3.700', fareMax:3700,  note:'Tarif flat, tidak per km' });
            }
            if (selectedMode === 'public' || selectedMode === 'krl' || selectedMode === 'all') {
                modesFareCalc.push({ id:'krl',    label:'KRL Commuter Line',    fare:8000,  fareStr:'Rp 8.000', fareMax:8000,  note:'Tarif flat Solo-Jogja' });
            }
            if (selectedMode === 'public' || selectedMode === 'angkot' || selectedMode === 'all') {
                modesFareCalc.push({ id:'angkot', label:'Angkot',               fare:5000,  fareStr:'Rp 5.000', fareMax:5000,  note:'Tarif flat dalam kota' });
            }
            if (selectedMode === 'ojol' || selectedMode === 'all') {
                var ojolBase = Math.round(km * 2000 / 500) * 500 + 2500;
                var ojolMin  = Math.max(7000, Math.round(ojolBase * 0.9 / 500) * 500);
                var ojolMax  = Math.max(ojolMin, Math.round(ojolBase * 1.15 / 500) * 500);
                modesFareCalc.push({ id:'ojol', label:'Ojol (GoRide/GrabBike)', fare:ojolMin, fareMax:ojolMax,
                    fareStr: ojolMin===ojolMax ? formatRp(ojolMin) : formatRp(ojolMin)+' - '+formatRp(ojolMax),
                    note:'Rp 2.000/km + booking Rp 2.500' });
            }
            var availModes = destination.options.map(function(o){return o[0];});
            modesFareCalc = modesFareCalc.filter(function(m){ return availModes.indexOf(m.id) !== -1; });
            if (!modesFareCalc.length) {
                if (selectedMode !== 'public' && selectedMode !== 'all') {
                    throw new Error('Selected transport mode unavailable');
                }
                modesFareCalc = destination.options.map(function(o){
                    var fare = parseFare(o[2]);
                    var m = mode(o[0]);
                    return { id:o[0], label:m.label, fare:fare.min, fareMax:fare.max,
                             fareStr:fare.min===fare.max?formatRp(fare.min):formatRp(fare.min)+' - '+formatRp(fare.max),
                             note:o[1] };
                });
            }

            var modeRows = modesFareCalc.map(function(m) {
                return '<div class="pr-mode-row">'
                     + '<div class="pr-mode-left">'
                     + '<span class="pr-mode-dot" style="background:var(--mode-'+m.id+')"></span>'
                     + '<div class="pr-mode-info"><span class="pr-mode-name">'+escapeHtml(m.label)+'</span>'
                     + '<span class="pr-mode-note">'+escapeHtml(m.note)+'</span></div>'
                     + '</div>'
                     + '<span class="pr-mode-fare" style="color:var(--mode-'+m.id+')">'+m.fareStr+'</span>'
                     + '</div>';
            }).join('');

            var cheapest = modesFareCalc.length ? Math.min.apply(null, modesFareCalc.map(function(m){return m.fare;})) : 0;
            var priciest = modesFareCalc.length ? Math.max.apply(null, modesFareCalc.map(function(m){return m.fareMax||m.fare;})) : 0;
            var totalMin = cheapest + ef.fee;
            var totalMax = priciest + ef.fee;
            var totalStr = totalMin===totalMax ? formatRp(totalMin) : formatRp(totalMin)+' - '+formatRp(totalMax);

            result.innerHTML =
                '<div class="pr-result">'
              + '<div class="pr-header">'
              + '<i data-lucide="route" width="20"></i>'
              + '<div><strong class="pr-dest-name">'+escapeHtml(destination.name)+'</strong>'
              + '<span class="pr-route-info">'+distance+' km &nbsp;&middot;&nbsp; sekitar '+duration+' menit</span>'
              + '</div></div>'
              + '<div class="pr-section-label"><i data-lucide="bus" width="12"></i> Estimasi ongkos transport</div>'
              + '<div class="pr-mode-list">'+modeRows+'</div>'
              + '<div class="pr-divider"></div>'
              + '<div class="pr-ticket-row">'
              + '<span class="pr-ticket-label"><i data-lucide="ticket" width="13"></i> Tiket masuk</span>'
              + '<span class="pr-ticket-value'+(ef.free?' pr-ticket-free':'')+'">'+(ef.free?'Gratis':formatRp(ef.fee))+'</span>'
              + '</div>'
              + (ef.note?'<p class="pr-ticket-note">'+escapeHtml(ef.note)+'</p>':'')
              + '<div class="pr-total"><span>Total estimasi</span><strong class="pr-total-value">'+totalStr+'</strong></div>'
              + '<p class="pr-disclaimer">*Tarif dapat berubah. Cek info terbaru sebelum berangkat.</p>'
              + '</div>';
            status.textContent = 'Rute berhasil ditampilkan untuk ' + modeLabel + '.';
            createIconsSafe();
        } catch (error) {
            console.error('Route planner error:', error);
            status.textContent = 'Rute belum tersedia. Periksa koneksi atau gunakan panduan moda di kartu destinasi.';
        } finally {
            result.classList.remove('loading');
        }
    };
}

// ===== RuteSolo AI Chatbot =====
const AI_ENDPOINT = API_BASE + '/ai.php';
let aiHistory = [];

const aiFab = document.getElementById('aiFab');
const aiChatContainer = document.getElementById('aiChatContainer');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatSend = document.getElementById('aiChatSend');

function toggleChat() {
    if (!aiChatContainer) return;
    aiChatContainer.classList.toggle('active');
    if (aiChatContainer.classList.contains('active')) {
        if (aiChatMessages.children.length === 0) {
            addMessage('bot', 'Halo, Wisatawan! 👋<br>Saya RuteSolo AI, asisten virtual yang siap membantu perjalanan Anda di Solo.');
            setTimeout(() => {
                addMessage('bot', 'Ada yang bisa saya bantu terkait rekomendasi tempat wisata atau rute transportasi di Solo?');
            }, 800);
        }
        if (aiChatInput) aiChatInput.focus();
    }
}

if (aiFab) aiFab.addEventListener('click', toggleChat);
if (aiChatClose) aiChatClose.addEventListener('click', toggleChat);

function addMessage(sender, text) {
    if (!aiChatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;
    msgDiv.innerHTML = text;
    aiChatMessages.appendChild(msgDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

async function handleSend() {
    if (!aiChatInput) return;
    const text = aiChatInput.value.trim();
    if (!text) return;

    addMessage('user', escapeHtml(text));
    aiChatInput.value = '';

    // Snapshot riwayat sebelumnya (maks 12) untuk dikirim ke backend.
    // Backend akan menambahkan pesan terbaru dari field "message".
    const historyForRequest = aiHistory.slice(-12);

    // Simpan pesan user ke riwayat lokal.
    aiHistory.push({ role: 'user', text: text });
    if (aiHistory.length > 12) aiHistory = aiHistory.slice(-12);

    try {
        const response = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                history: historyForRequest
            })
        });

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();

        if (!data || typeof data.reply !== 'string' || data.reply.trim() === '') {
            throw new Error('Empty reply from AI');
        }

        // Simpan jawaban model ke riwayat lokal.
        aiHistory.push({ role: 'model', text: data.reply });
        if (aiHistory.length > 12) aiHistory = aiHistory.slice(-12);

        // Tampilkan jawaban dengan aman (tanpa raw HTML) & dukung newline.
        addMessage('bot', escapeHtml(data.reply).replace(/\n/g, '<br>'));
        createIconsSafe();
    } catch (error) {
        // Fallback ke balasan template lokal jika Gemini tidak tersedia.
        const fallbackReply = generateAiReply(text.toLowerCase());
        addMessage('bot', fallbackReply);
        createIconsSafe();
    }
}

if (aiChatSend) aiChatSend.addEventListener('click', handleSend);
if (aiChatInput) {
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function generateAiReply(query) {
    // 1. Check for greetings
    if (/halo|hai|hello|pagi|siang|malam|assalamualaikum/.test(query)) {
        return 'Halo! Ada yang bisa saya bantu untuk perjalanan Anda di Solo? Anda bisa bertanya tentang tempat wisata, kuliner, atau transportasi.';
    }

    // 2. Check for transport modes
    if (/bst|bus/.test(query)) return 'BST (Batik Solo Trans) adalah bus rapid transit dengan tarif flat Rp 3.700. Anda bisa melihat rute BST di peta atau di kartu destinasi.';
    if (/krl|kereta/.test(query)) return 'KRL Commuter Line melayani rute Solo-Jogja dengan tarif flat Rp 8.000. Stasiun utama di Solo adalah Solo Balapan dan Purwosari.';
    if (/angkot/.test(query)) return 'Angkot di Solo memiliki tarif flat Rp 5.000. Rute angkot biasanya menghubungkan terminal dan pasar tradisional.';
    if (/ojol|gojek|grab|ojek/.test(query)) return 'Ojol (GoRide/GrabBike) sangat praktis untuk last-mile. Estimasi tarifnya sekitar Rp 2.000/km + biaya booking Rp 2.500.';

    // 3. Check for categories
    const categories = ['budaya', 'sejarah', 'kuliner', 'makanan', 'belanja', 'taman', 'rekreasi', 'museum', 'edukasi'];
    const matchedCategory = categories.find(cat => query.includes(cat));
    if (matchedCategory) {
        const recs = DEST.filter(d => 
            d.category.toLowerCase().includes(matchedCategory) || 
            d.tags.some(t => t.toLowerCase().includes(matchedCategory)) ||
            d.desc.toLowerCase().includes(matchedCategory)
        ).slice(0, 3);
        
        if (recs.length > 0) {
            let reply = `Berikut rekomendasi tempat untuk kategori <strong>${matchedCategory}</strong>:<br><ul style="padding-left:16px; margin-top:8px;">`;
            recs.forEach(r => {
                reply += `<li style="margin-bottom:4px;"><strong>${escapeHtml(r.name)}</strong> - ${escapeHtml(r.category)}</li>`;
            });
            reply += '</ul>Anda bisa melihat rute transportasinya di kartu destinasi di halaman utama.';
            return reply;
        }
    }

    // 4. Check for specific destination names
    const matchedDest = DEST.find(d => query.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(query));
    if (matchedDest) {
        const entry = ENTRY_FEES[matchedDest.id] || { fee: 0, free: true, note: '' };
        const feeText = entry.free ? 'Gratis' : formatRp(entry.fee) + (entry.note ? ` (${entry.note})` : '');
        return `Tentu! <strong>${escapeHtml(matchedDest.name)}</strong> adalah destinasi ${escapeHtml(matchedDest.category)}. <br><br>${escapeHtml(matchedDest.desc)}<br><br>Tiket masuk: <strong>${feeText}</strong>.<br>Anda bisa melihat opsi transportasi dan estimasi biaya di kartu destinasi pada bagian "Wisata paling populer".`;
    }

    // 5. Check for "rekomendasi" / "wisata" / "tempat"
    if (/rekomendasi|wisata|tempat|liburan|jalan-jalan|jalan jalan/.test(query)) {
        const recs = DEST.slice(0, 3);
        let reply = `Berikut beberapa rekomendasi tempat wisata populer di Solo:<br><ul style="padding-left:16px; margin-top:8px;">`;
        recs.forEach(r => {
            reply += `<li style="margin-bottom:4px;"><strong>${escapeHtml(r.name)}</strong> - ${escapeHtml(r.category)}</li>`;
        });
        reply += '</ul>Anda bisa menjelajahi lebih banyak destinasi di halaman utama.';
        return reply;
    }

    // 6. Fallback
    return 'Maaf, saya belum mengerti pertanyaan Anda. Anda bisa bertanya tentang:<br>- Rekomendasi tempat (contoh: "kuliner", "museum", "batik")<br>- Transportasi (contoh: "BST", "KRL", "Ojol")<br>- Destinasi spesifik (contoh: "Keraton", "Pasar Klewer")';
}


initTheme();
initThemeToggle();
initNavbarScroll();
initNavOverlay();
initNavbarSearch();
renderChips();
renderCards();
renderGallery();
resetTimer();
initMap();
initRoutePlanner();
initGestures();
initScrollReveal();
