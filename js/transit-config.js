/* RuteSolo - Konfigurasi jalur transit (warna & grup rute) */

const TRANSIT_GROUPS = [
    { id: 'bst', label: 'BST 1–5', popup: 'BST · Koridor ', dash: null, routes: [
        { code: '1', color: '#0088c3' }, { code: '2', color: '#fb8a17' },
        { code: '3', color: '#e2af79' }, { code: '4', color: '#9bba3b' },
        { code: '5', color: '#9f91c6' } ] },
    { id: 'f', label: 'Rute F7–F12', popup: 'Rute ', dash: null, routes: [
        { code: 'F7',  color: '#96393f' }, { code: 'F8',  color: '#5c4273' },
        { code: 'F9',  color: '#41b7b6' }, { code: 'F10', color: '#e49535' },
        { code: 'F12', color: '#d33739' } ] },
    { id: 's', label: 'Rute S1–S2', popup: 'Rute ', dash: '8 6', routes: [
        { code: 'S1', color: '#a14f23' }, { code: 'S2', color: '#548f45' } ] }
];

const TRANSIT_ROUTE_INFO = (function () {
    const info = {};
    TRANSIT_GROUPS.forEach(g => g.routes.forEach(r => {
        info[r.code] = { color: r.color, group: g.id, label: g.popup + r.code };
    }));
    return info;
})();

function routeColor(code) {
    return (TRANSIT_ROUTE_INFO[code] || {}).color || '#7c3aed';
}
