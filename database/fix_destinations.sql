-- RuteSolo: perbaiki tabel destinations (aman dijalankan berulang)
-- Jalankan di phpMyAdmin > pilih database > tab SQL.

ALTER TABLE destinations ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10,7) NULL;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7) NULL;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Isi koordinat & gambar tiap destinasi
UPDATE destinations SET latitude=-7.5775, longitude=110.8291, image_url='assets/images/keraton-surakarta.jpg' WHERE id=1;
UPDATE destinations SET latitude=-7.5732, longitude=110.8319, image_url='assets/images/pasar-klewer.jpg' WHERE id=2;
UPDATE destinations SET latitude=-7.5608, longitude=110.8345, image_url='assets/images/taman-sriwedari.jpg' WHERE id=3;
UPDATE destinations SET latitude=-7.5762, longitude=110.8273, image_url='assets/images/kampung-batik-kauman.jpg' WHERE id=4;
UPDATE destinations SET latitude=-7.5741, longitude=110.8327, image_url='assets/images/masjid-agung-surakarta.jpg' WHERE id=5;
UPDATE destinations SET latitude=-7.5605, longitude=110.8352, image_url='assets/images/wayang-orang-sriwedari.jpg' WHERE id=6;
UPDATE destinations SET latitude=-7.5686, longitude=110.8227, image_url='assets/images/pura-mangkunegaran.jpg' WHERE id=7;
UPDATE destinations SET latitude=-7.568, longitude=110.8143, image_url='assets/images/museum-batik-danar-hadi-v2.jpg' WHERE id=8;
UPDATE destinations SET latitude=-7.5651, longitude=110.8125, image_url='assets/images/museum-radya-pustaka-v2.jpg' WHERE id=9;
UPDATE destinations SET latitude=-7.5697, longitude=110.8311, image_url='assets/images/benteng-vastenburg.jpg' WHERE id=10;
UPDATE destinations SET latitude=-7.5693, longitude=110.8302, image_url='assets/images/pasar-gede.jpg' WHERE id=11;
UPDATE destinations SET latitude=-7.5688, longitude=110.7953, image_url='assets/images/kampung-batik-laweyan.jpg' WHERE id=12;
UPDATE destinations SET latitude=-7.5542, longitude=110.8075, image_url='assets/images/taman-balekambang-v2.jpg' WHERE id=13;
UPDATE destinations SET latitude=-7.5942, longitude=110.8654, image_url='assets/images/solo-safari-v2.jpg' WHERE id=14;
UPDATE destinations SET latitude=-7.5596, longitude=110.854, image_url='assets/images/taman-cerdas-jebres.jpg' WHERE id=15;
UPDATE destinations SET latitude=-7.57, longitude=110.829, image_url='assets/images/galabo-solo.jpg' WHERE id=16;
UPDATE destinations SET latitude=-7.5708, longitude=110.8304, image_url='assets/images/gedung-djoeang-45-v2.jpg' WHERE id=17;
UPDATE destinations SET latitude=-7.5725, longitude=110.8129, image_url='assets/images/museum-keris-nusantara-v2.jpg' WHERE id=18;
UPDATE destinations SET latitude=-7.5497, longitude=110.8084, image_url='assets/images/stadion-manahan-v2.jpg' WHERE id=19;
UPDATE destinations SET latitude=-7.558, longitude=110.822, image_url='assets/images/solo-grand-mall-v2.jpg' WHERE id=20;
UPDATE destinations SET latitude=-7.553, longitude=110.864, image_url='assets/images/taman-jurug-v2.jpg' WHERE id=21;
UPDATE destinations SET latitude=-7.6042, longitude=110.7153, image_url='assets/images/rumah-atsiri-v2.jpg' WHERE id=22;

-- Tags tersimpan dengan backslash (\"keraton\") sehingga bukan JSON valid; bersihkan.
UPDATE destinations SET tags = REPLACE(tags, '\\"', '"') WHERE tags LIKE '%\\\\"%';

-- Cek hasil:
SELECT id, name, latitude, longitude, LEFT(tags, 40) AS tags FROM destinations ORDER BY id;
