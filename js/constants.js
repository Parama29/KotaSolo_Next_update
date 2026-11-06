/* RuteSolo - Konstanta: gradien, tiket masuk, titik transport, tarif */

const MODE_GRADIENTS = {
    bst:    'linear-gradient(to top, #6366f1cc, #6366f122)',
    krl:    'linear-gradient(to top, #ec4899cc, #ec489922)',
    ojol:   'linear-gradient(to top, #22d3eecc, #22d3ee22)',
    all:    'linear-gradient(to top, #7c3aedcc, #7c3aed22)',
};

// Entry fees

const ENTRY_FEES = {
    23: { fee: 0, note: 'Gratis', free: true },
    24: { fee: 0, note: 'Gratis', free: true },
    25: { fee: 0, note: 'Gratis', free: true },
    26: { fee: 0, note: 'Gratis', free: true },
    27: { fee: 0, note: 'Gratis', free: true },
    28: { fee: 0, note: 'Gratis', free: true },
    29: { fee: 0, note: 'Gratis', free: true },
    30: { fee: 0, note: 'Gratis', free: true },
    31: { fee: 0, note: 'Gratis', free: true },
    32: { fee: 0, note: 'Gratis', free: true },
    33: { fee: 0, note: 'Gratis', free: true },
};

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
    ojol: [
        { id:'ojol-current', name:'Lokasi saya sekarang', coords: null },
    ]
};
const TRANSPORT_FARES = {
    bst:    { type:'flat', amount:4000, note:'Tarif flat BST' },
    krl:    { type:'flat', amount:8000, note:'Tarif flat KRL' },
    ojol:   { type:'per_km', perKm:2300, bookingFee:2500, minFare:7000, note:'Rp 2rb/km + booking Rp 2.5rb' },
};

const MODE_RGB = {
    bst:    '99,102,241',
    krl:    '236,72,153',
    ojol:   '34,211,238',
    all:    '124,58,237',
};
