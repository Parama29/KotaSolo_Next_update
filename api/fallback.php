<?php
/*
 * Data cadangan RuteSolo (berbasis file) dipakai saat database tidak bisa dihubungi,
 * misalnya host MySQL InfinityFree tidak terjangkau dari XAMPP lokal.
 * Sumber: /data/destinations.json
 */

function rutesolo_fallback_modes()
{
    return array(
        array('id' => 1, 'slug' => 'bst',    'name' => 'BST',            'icon' => 'bus',         'color' => '#1F2E45'),
        array('id' => 2, 'slug' => 'krl',    'name' => 'KRL',            'icon' => 'train-front', 'color' => '#8C2F27'),
        array('id' => 3, 'slug' => 'angkot', 'name' => 'Angkot',         'icon' => 'car',         'color' => '#6B4226'),
        array('id' => 4, 'slug' => 'ojol',   'name' => 'Ojol Last-mile', 'icon' => 'bike',        'color' => '#B9862F'),
    );
}

function rutesolo_fallback_destinations()
{
    $file = dirname(__DIR__) . '/data/destinations.json';
    if (!is_file($file)) return array();
    $rows = json_decode((string) file_get_contents($file), true);
    if (!is_array($rows)) return array();
    $list = array();
    foreach ($rows as $row) {
        if (!is_array($row) || !isset($row['id'], $row['name'])) continue;
        $list[] = $row;
    }
    return $list;
}

/* Rute per destinasi dalam format yang sama dengan endpoint /routes. */
function rutesolo_fallback_routes()
{
    $modeIds = array();
    $modeNames = array();
    foreach (rutesolo_fallback_modes() as $m) {
        $modeIds[$m['slug']] = $m['id'];
        $modeNames[$m['slug']] = $m['name'];
    }
    $rows = array();
    $n = 0;
    foreach (rutesolo_fallback_destinations() as $d) {
        $options = isset($d['options']) && is_array($d['options']) ? $d['options'] : array();
        foreach ($options as $o) {
            if (!isset($o['mode']) || !isset($modeIds[$o['mode']])) continue;
            $n++;
            $rows[] = array(
                'id'               => $n,
                'destination_id'   => (int) $d['id'],
                'destination_name' => (string) $d['name'],
                'mode_id'          => $modeIds[$o['mode']],
                'mode'             => $o['mode'],
                'mode_name'        => $modeNames[$o['mode']],
                'description'      => isset($o['description']) ? (string) $o['description'] : '',
                'fare'             => isset($o['fare']) ? (string) $o['fare'] : '',
                'duration_minutes' => (int) (isset($o['duration']) ? $o['duration'] : 0),
                'latitude'         => (float) $d['latitude'],
                'longitude'        => (float) $d['longitude'],
            );
        }
    }
    return $rows;
}

/* Teks pengetahuan untuk chatbot AI, sama formatnya dengan versi database. */
function rutesolo_fallback_knowledge()
{
    $destinations = rutesolo_fallback_destinations();
    if (!$destinations) return '';

    $text  = "DATA RESMI RUTESOLO\n\nMODA TRANSPORTASI:\n";
    foreach (rutesolo_fallback_modes() as $m) {
        $text .= '- ' . $m['name'] . ' (' . $m['slug'] . ")\n";
    }

    $text .= "\nDESTINASI:\n";
    foreach ($destinations as $d) {
        $text .= "\n";
        $text .= 'ID: ' . $d['id'] . "\n";
        $text .= 'Nama: ' . $d['name'] . "\n";
        $text .= 'Kategori: ' . (isset($d['category']) ? $d['category'] : '') . "\n";
        $text .= 'Deskripsi: ' . (isset($d['description']) ? $d['description'] : '') . "\n";
        if (!empty($d['tags']) && is_array($d['tags'])) {
            $text .= 'Tag: ' . implode(', ', $d['tags']) . "\n";
        }
        $text .= 'Koordinat: ' . $d['latitude'] . ', ' . $d['longitude'] . "\n";
    }

    $text .= "\nRUTE TRANSPORTASI:\n";
    $names = array();
    foreach (rutesolo_fallback_modes() as $m) $names[$m['slug']] = $m['name'];
    foreach ($destinations as $d) {
        $options = isset($d['options']) && is_array($d['options']) ? $d['options'] : array();
        foreach ($options as $o) {
            $slug = isset($o['mode']) ? $o['mode'] : '';
            $text .= "\n";
            $text .= 'Destinasi: ' . $d['name'] . "\n";
            $text .= 'Moda: ' . (isset($names[$slug]) ? $names[$slug] : $slug) . "\n";
            $text .= 'Rute: ' . (isset($o['description']) ? $o['description'] : '') . "\n";
            $text .= 'Tarif: ' . (isset($o['fare']) ? $o['fare'] : '') . "\n";
            $text .= 'Durasi: ' . (isset($o['duration']) ? $o['duration'] : '') . "\n";
        }
    }
    return $text;
}
