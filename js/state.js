/* RuteSolo - State global & referensi elemen DOM */

let filter           = 'all';
let catFilter        = 'all'; // filter kategori destinasi
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

let map;
