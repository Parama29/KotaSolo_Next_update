/* RuteSolo - Data destinasi & moda (dari PHP, dengan fallback) */

const DEST_FALLBACK = [
    { id:1, name:"Masjid Agung Kraton Surakarta", category:"Wisata Religi", desc:"Masjid jami Keraton Kasunanan (1763–1768); pusat ibadah Jumat/Id dan tradisi keraton seperti Sekaten, Grebeg, dan Maulid.", tags:["masjid", "kraton", "islam", "keraton", "sejarah", "religi"], coords:[-7.5744033,110.8265936], img:"assets/images/masjid-agung.png", options:[["bst", "Koridor 2 Kartasura-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:2, name:"Masjid Al Wustho Mangkunegaran", category:"Wisata Religi", desc:"Masjid Mangkunegaran di barat Pura; dirancang Herman Thomas Karsten, dibuka untuk umum 1924, kini dikelola Kemenag dan masyarakat.", tags:["masjid", "mangkunegaran", "islam", "pura", "religi"], coords:[-7.5654454,110.8214387], img:"assets/images/masjid-al-wustho.png", options:[["bst", "Koridor 1 Palur-Mangkunegaran", "Rp 3.700", ""], ["krl", "Stasiun Solo Balapan + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:3, name:"Masjid Raya Sheikh Zayed Solo Surakarta", category:"Wisata Religi", desc:"Replika Sheikh Zayed Grand Mosque Abu Dhabi, hibah dari UEA; diresmikan 2022, kapasitas 10.000, memadukan arsitektur Timur Tengah dan motif batik.", tags:["masjid", "sheikh zayed", "islam", "modern", "megah", "religi"], coords:[-7.5549587,110.8270355], img:"assets/images/masjid-raya.png", options:[["bst", "Koridor 2 Kartasura-Manahan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-14rb", ""]] },
    { id:4, name:"Masjid Laweyan", category:"Wisata Religi", desc:"Salah satu masjid tertua Solo (1546, era Pajang); dahulu tempat pemujaan Hindu Jawa lalu dialihfungsikan jadi masjid.", tags:["masjid", "laweyan", "islam", "batik", "sejarah", "religi"], coords:[-7.571462,110.792558], img:"assets/images/masjid-laweyan.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 12rb-18rb", ""]] },
    { id:5, name:"Vihara Dhamma Sundara", category:"Wisata Religi", desc:"Vihara Buddha dan wisata budaya di Jebres; diresmikan 2002, punya candi putih beratap stupa, relief Buddha, dan patung gajah putih.", tags:["vihara", "buddha", "meditasi", "religi", "damai"], coords:[-7.5698423,110.8487998], img:"assets/images/vihara-dhamma.png", options:[["bst", "Koridor 1 Palur-Jebres", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:6, name:"Pura Indraprasta", category:"Wisata Religi", desc:"Pura Hindu gaya Bali di Sondakan (1986); punya Padma Sana, kain poleng, Bale Agung, dan Bale Gong; pintu tengah dibuka saat Nyepi.", tags:["pura", "hindu", "bali", "religi", "sakral"], coords:[-7.5653241,110.7871019], img:"assets/images/pura-indraprastra.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 12rb-18rb", ""]] },
    { id:7, name:"TITD Poo An Kiong", category:"Wisata Religi", desc:"Klenteng Tiga Tradisi di barat Pasar Klewer (1828–1881); cagar budaya 2013 dan mencerminkan akulturasi Tionghoa-Jawa.", tags:["kelenteng", "tri dharma", "tionghoa", "religi", "budaya"], coords:[-7.5748026,110.8228019], img:"assets/images/klenteng-poo.png", options:[["bst", "Koridor 1 Palur-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-15rb", ""]] },
    { id:8, name:"Gereja Kristen Jawa Margoyudan", category:"Wisata Religi", desc:"Gereja Kristen Jawa yang berdiri 1916; gedung kapasitas 400 diresmikan 1921 dan jadi cikal bakal jemaat GKJ di sekitar Solo.", tags:["gereja", "kristen", "jawa", "sejarah", "religi"], coords:[-7.5583272,110.8295303], img:"assets/images/gereja-jawa.png", options:[["bst", "Koridor 2 Kartasura-Manahan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-14rb", ""]] },
    { id:9, name:"Gereja Katolik Paroki Santo Petrus, Purwosari Gendengan", category:"Wisata Religi", desc:"Gereja Katolik tertua kedua Solo; diberkati 1940, jadi paroki mandiri 1942, sempat terdampak pendudukan Jepang.", tags:["gereja", "katolik", "santo petrus", "kolonial", "religi"], coords:[-7.5651094,110.8062759], img:"assets/images/gereja-st.petrus.png", options:[["bst", "Koridor 2 Kartasura-Purwosari", "Rp 3.700", ""], ["krl", "Stasiun Purwosari + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:10, name:"Gereja Katolik Paroki Santo Antonius Padua, Purbayan", category:"Wisata Religi", desc:"Gereja Katolik tertua Solo; bangunan kolonial 1916 dan induk bagi banyak paroki di Solo Raya.", tags:["gereja", "katolik", "santo antonius", "purbayan", "religi"], coords:[-7.5687813,110.8298146], img:"assets/images/gereja-st.antonius.png", options:[["bst", "Koridor 1 Palur-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-15rb", ""]] },
    { id:11, name:"Gereja Katolik Paroki Santa Perawan Maria Regina, Purbowardayan", category:"Wisata Religi", desc:"Dibangun 1956–1961; kapasitas 2.000+; arsitektur salib dengan pendopo terbuka yang dikenal sebagai konsep “Kandang Sapi”.", tags:["gereja", "katolik", "maria regina", "modern", "religi"], coords:[-7.5592515,110.8353547], img:"assets/images/gereja-maria.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-14rb", ""]] },
    { id:12, name:"Astana Oetara (Museum & Situs Cagar Budaya K.G.P.A.A. Mangkunegara VI)", category:"Wisata Religi", desc:"Museum dan situs cagar budaya terkait K.G.P.A.A. Mangkunegara VI, bagian dari warisan Mangkunegaran di Solo utara.", tags:["astana", "mangkunegaran", "makam", "museum", "cagar budaya", "religi"], coords:[-7.5473069,110.8237853], img:"assets/images/astana-oetara.png", options:[["bst", "Koridor 1 Palur-Mangkunegaran", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 11rb-17rb", ""]] },
    { id:13, name:"Langgar Merdeka Laweyan", category:"Wisata Religi", desc:"Langgar (musala) bersejarah di Kampung Laweyan yang lekat dengan tradisi saudagar batik dan sejarah pergerakan di Laweyan.", tags:["langgar", "laweyan", "islam", "batik", "sejarah", "religi"], coords:[-7.568764,110.7934263], img:"assets/images/langgar-merdeka-laweyan.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 13rb-19rb", ""]] },
    { id:14, name:"Pasar Klewer", category:"Wisata Belanja", desc:"Pusat grosir batik dan tekstil terbesar di Solo, bersebelahan dengan Keraton Kasunanan.", tags:["pasar", "batik", "tekstil", "grosir", "oleh-oleh", "belanja"], coords:[-7.5753702,110.8267448], img:"assets/images/pasar-klewer.png", options:[["bst", "Koridor 1 Palur-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:15, name:"Pasar Gede Hardjonagoro", category:"Wisata Belanja", desc:"Pasar tradisional ikonik rancangan Thomas Karsten, terkenal dengan jajanan khas Solo dan dekat kawasan Pecinan.", tags:["pasar", "tradisional", "kuliner", "jajanan", "karsten", "belanja"], coords:[-7.569377,110.8315563], img:"assets/images/pasar-gede-hardjonagoro.png", options:[["bst", "Koridor 1 Palur-Pasar Gede", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 8rb-14rb", ""]] },
    { id:16, name:"Pasar Legi", category:"Wisata Belanja", desc:"Pasar tradisional besar di utara Mangkunegaran, pusat kebutuhan pokok, sayur, dan jajanan pasar.", tags:["pasar", "tradisional", "sembako", "jajanan", "belanja"], coords:[-7.5626552,110.8247223], img:"assets/images/pasar-legi.png", options:[["bst", "Koridor 1 Palur-Mangkunegaran", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:17, name:"PASAR JONGKE", category:"Wisata Belanja", desc:"Pasar tradisional di kawasan Laweyan, cocok untuk merasakan kehidupan pasar warga lokal.", tags:["pasar", "tradisional", "laweyan", "lokal", "belanja"], coords:[-7.5675534,110.7892989], img:"assets/images/pasar-jongke.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 13rb-19rb", ""]] },
    { id:18, name:"Pasar Triwindu", category:"Wisata Belanja", desc:"Pasar barang antik dan lawasan dekat Pura Mangkunegaran; tempat berburu kerajinan, perabot, dan koleksi jadul.", tags:["pasar", "antik", "barang lawas", "kerajinan", "mangkunegaran", "belanja"], coords:[-7.5691764,110.8225383], img:"assets/images/pasar-triwindu.png", options:[["bst", "Koridor 1 Palur-Mangkunegaran", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:19, name:"Jayengan Kampoeng Permata", category:"Wisata Belanja", desc:"Sentra perhiasan dan batu permata di kawasan Jayengan, Solo.", tags:["permata", "perhiasan", "batu mulia", "jayengan", "belanja"], coords:[-7.575797,110.8202906], img:"assets/images/jayengan-kampoeng-permata.png", options:[["bst", "Koridor 2 Kartasura-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:20, name:"Batik Keris Heritage", category:"Wisata Belanja", desc:"Gerai dan galeri batik heritage di Jalan Slamet Riyadi; tempat belanja batik sekaligus mengenal sejarah batik Solo.", tags:["batik", "heritage", "galeri", "oleh-oleh", "belanja", "experience", "sejarah"], coords:[-7.5642782,110.7992539], img:"assets/images/batik-keris-heritage.png", options:[["bst", "Koridor 2 Kartasura-Purwosari", "Rp 3.700", ""], ["krl", "Stasiun Purwosari + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 12rb-18rb", ""]] },
    { id:21, name:"House Of Danar Hadi", category:"Wisata Belanja", desc:"Galeri dan museum batik Danar Hadi di bekas rumah saudagar bergaya indis; koleksi batik kuno dan butik batik.", tags:["batik", "museum", "danar hadi", "galeri", "belanja", "experience", "sejarah"], coords:[-7.5687523,110.8163603], img:"assets/images/house-of-danar-hadi.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:22, name:"Kampung Batik Laweyan", category:"Wisata Belanja", desc:"Kampung sentra batik tertua di Solo dengan rumah juragan batik, galeri, dan workshop.", tags:["batik", "laweyan", "kampung wisata", "workshop", "belanja", "experience"], coords:[-7.5700737,110.7977996], img:"assets/images/kampung-batik-laweyan.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 12rb-18rb", ""]] },
    { id:23, name:"Kampung Batik Kauman", category:"Wisata Belanja", desc:"Kampung batik di dekat Keraton dengan rumah-rumah batik tulis dan cap serta lorong-lorong kampung bersejarah.", tags:["batik", "kauman", "kampung wisata", "keraton", "belanja", "experience"], coords:[-7.5733936,110.8263087], img:"assets/images/kampung-batik-kauman.png", options:[["bst", "Koridor 1 Palur-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:24, name:"Sentra IKM Mebel Sri kayu", category:"Wisata Belanja", desc:"Sentra industri kecil menengah mebel dan furnitur kayu di Solo.", tags:["mebel", "furnitur", "kayu", "ikm", "belanja"], coords:[-7.5567312,110.8329099], img:"assets/images/sentra-ikm-mebel-sri-kayu.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:25, name:"Solo Paragon Mall", category:"Wisata Belanja", desc:"Pusat perbelanjaan modern di Jalan Dr. Radjiman dengan pilihan ritel, kuliner, dan hiburan.", tags:["mall", "modern", "kuliner", "hiburan", "belanja"], coords:[-7.5624118,110.8100122], img:"assets/images/solo-paragon-mall.png", options:[["bst", "Koridor 2 Kartasura-Manahan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 11rb-17rb", ""]] },
    { id:26, name:"NEO Solo Grand Mall", category:"Wisata Belanja", desc:"Pusat perbelanjaan modern di Solo dengan pilihan ritel, kuliner, dan hiburan keluarga.", tags:["mall", "modern", "kuliner", "hiburan", "belanja"], coords:[-7.5667758,110.8074996], img:"assets/images/neo-solo-grand-mall.png", options:[["bst", "Koridor 2 Kartasura-Purwosari", "Rp 3.700", ""], ["krl", "Stasiun Purwosari + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 11rb-17rb", ""]] },
    { id:27, name:"Solo Square Mall", category:"Wisata Belanja", desc:"Pusat perbelanjaan di kawasan Solo Baru/Laweyan sisi barat dengan ritel dan kuliner.", tags:["mall", "modern", "kuliner", "keluarga", "belanja"], coords:[-7.5610763,110.7884408], img:"assets/images/solo-square-mall.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 13rb-19rb", ""]] },
    { id:28, name:"Solo Safari", category:"Wisata Experience", desc:"Kebun binatang di tepi Bengawan Solo, Jebres; wisata satwa dan edukasi keluarga hasil revitalisasi Taman Satwa Taru Jurug.", tags:["kebun binatang", "satwa", "keluarga", "edukasi", "bengawan solo", "experience"], coords:[-7.5643553,110.8586618], img:"assets/images/solo-safari.png", options:[["bst", "Koridor 1 Palur-Jebres", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 12rb-18rb", ""]] },
    { id:29, name:"Taman Balekambang Surakarta", category:"Wisata Experience", desc:"Taman rekreasi peninggalan Mangkunegara VII (1921) dengan kolam, area hijau, patung, dan panggung terbuka.", tags:["taman", "mangkunegaran", "rekreasi", "keluarga", "alam", "experience"], coords:[-7.5535395,110.8099885], img:"assets/images/taman-balekambang-surakarta.png", options:[["bst", "Koridor 2 Kartasura-Manahan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 11rb-17rb", ""]] },
    { id:30, name:"Gedung Wayang Orang Sriwedari", category:"Wisata Experience", desc:"Gedung pertunjukan wayang orang Sriwedari; menikmati seni pertunjukan tradisional Jawa secara langsung.", tags:["wayang orang", "sriwedari", "pertunjukan", "seni", "budaya", "experience"], coords:[-7.5693693,110.8125044], img:"assets/images/gedung-wayang-orang-sriwedari.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:31, name:"Tumurun Museum", category:"Wisata Experience", desc:"Museum seni swasta di pusat kota Solo dengan koleksi seni rupa dan budaya dalam bangunan bersejarah.", tags:["museum", "seni", "koleksi", "budaya", "experience"], coords:[-7.5704316,110.8164131], img:"assets/images/tumurun-museum.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:32, name:"Tahir Solo Museum", category:"Wisata Experience", desc:"Museum seni di Solo bagian timur untuk menikmati koleksi dan pameran seni.", tags:["museum", "seni", "koleksi", "pameran", "experience"], coords:[-7.5560941,110.8495577], img:"assets/images/tahir-solo-museum.png", options:[["bst", "Koridor 1 Palur-Jebres", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 11rb-17rb", ""]] },
    { id:33, name:"Keraton Kasunanan Surakarta Hadiningrat", category:"Wisata Sejarah", desc:"Istana Kasunanan Surakarta (berdiri 1745), pusat tradisi dan budaya Jawa dengan museum dan bangunan bersejarah.", tags:["keraton", "kasunanan", "istana", "museum", "budaya", "sejarah"], coords:[-7.5777426,110.8279099], img:"assets/images/keraton-kasunanan-surakarta-hadiningrat.png", options:[["bst", "Koridor 2 Kartasura-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:34, name:"Pura Mangkunegaran", category:"Wisata Sejarah", desc:"Istana Mangkunegaran (1757) dengan pendopo agung, museum, dan koleksi pusaka serta kesenian.", tags:["pura", "mangkunegaran", "istana", "pendopo", "museum", "sejarah"], coords:[-7.5667848,110.8229253], img:"assets/images/pura-mangkunegaran.png", options:[["bst", "Koridor 1 Palur-Mangkunegaran", "Rp 3.700", ""], ["krl", "Stasiun Solo Balapan + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:35, name:"Loji Gandrung", category:"Wisata Sejarah", desc:"Bangunan kolonial bersejarah yang kini menjadi rumah dinas Wali Kota Surakarta.", tags:["kolonial", "loji", "arsitektur", "heritage", "sejarah"], coords:[-7.5669623,110.8095059], img:"assets/images/loji-gandrung.png", options:[["bst", "Koridor 2 Kartasura-Purwosari", "Rp 3.700", ""], ["krl", "Stasiun Purwosari + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:36, name:"Gedung Djoeang 45", category:"Wisata Sejarah", desc:"Gedung bersejarah peninggalan masa perjuangan kemerdekaan di Solo.", tags:["perjuangan", "kemerdekaan", "1945", "gedung bersejarah", "sejarah"], coords:[-7.5737524,110.8322289], img:"assets/images/gedung-djoeang-45.png", options:[["bst", "Koridor 1 Palur-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:37, name:"Museum Radya Pustaka", category:"Wisata Sejarah", desc:"Museum tertua di Indonesia (1890) di kawasan Sriwedari; koleksi pusaka, arca, wayang, dan naskah Jawa.", tags:["museum", "radya pustaka", "sriwedari", "koleksi", "naskah", "sejarah"], coords:[-7.568643,110.814418], img:"assets/images/museum-radya-pustaka.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:38, name:"Museum Keris Nusantara", category:"Wisata Sejarah", desc:"Museum yang menyimpan dan memamerkan keris dari berbagai daerah Nusantara beserta sejarah dan filosofinya.", tags:["museum", "keris", "pusaka", "budaya", "sejarah"], coords:[-7.5691921,110.8109919], img:"assets/images/museum-keris-nusantara.png", options:[["bst", "Koridor 1 Palur-Sriwedari", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:39, name:"Dalem Hardjonegaran /Batik Go Tik Swan", category:"Wisata Sejarah", desc:"Kediaman maestro batik Go Tik Swan (KRT Hardjonagoro), kini dikenal sebagai rumah budaya dan batik.", tags:["dalem", "batik", "go tik swan", "heritage", "budaya", "sejarah"], coords:[-7.5768833,110.8220243], img:"assets/images/dalem-hardjonegaran-batik-go-tik-swan.png", options:[["bst", "Koridor 1 Palur-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:40, name:"Dalem Joyokusuman", category:"Wisata Sejarah", desc:"Dalem (kediaman bangsawan) bersejarah di sisi selatan kawasan Keraton Surakarta.", tags:["dalem", "bangsawan", "keraton", "heritage", "sejarah"], coords:[-7.5811553,110.8238604], img:"assets/images/dalem-joyokusuman.png", options:[["bst", "Koridor 2 Kartasura-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 10rb-16rb", ""]] },
    { id:41, name:"Ndalem Priyosuhartan", category:"Wisata Sejarah", desc:"Rumah tradisional Jawa bersejarah di kawasan Laweyan.", tags:["ndalem", "laweyan", "rumah jawa", "heritage", "sejarah"], coords:[-7.5684477,110.7976673], img:"assets/images/ndalem-priyosuhartan.png", options:[["bst", "Koridor 2 Kartasura-Laweyan", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 12rb-18rb", ""]] },
    { id:42, name:"Monumen Pers Nasional", category:"Wisata Sejarah", desc:"Museum dan monumen pers Indonesia, menempati bekas Societeit Sasana Soeka (1918); menyimpan koleksi surat kabar dan arsip pers.", tags:["museum", "pers", "jurnalistik", "sejarah", "arsip"], coords:[-7.5650984,110.818085], img:"assets/images/monumen-pers-nasional.png", options:[["bst", "Koridor 1 Palur-Mangkunegaran", "Rp 3.700", ""], ["krl", "Stasiun Solo Balapan + jalan kaki", "Rp 8.000", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] },
    { id:43, name:"Kampung Wisata Budaya Baluwarti", category:"Wisata Sejarah", desc:"Kampung di dalam benteng Keraton Kasunanan; menyusuri permukiman abdi dalem dan suasana budaya Jawa.", tags:["kampung wisata", "baluwarti", "keraton", "budaya", "sejarah"], coords:[-7.5756088,110.8247214], img:"assets/images/kampung-wisata-budaya-baluwarti.png", options:[["bst", "Koridor 2 Kartasura-Gladag", "Rp 3.700", ""], ["ojol", "Dari lokasi Anda", "Rp 9rb-15rb", ""]] }
];
var _rawModes = (window.__MODES__ && window.__MODES__.length)
    ? window.__MODES__.filter(function(m) { return m.slug !== 'angkot'; })
    : null;
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

function normalizeOption(option) {
    // Terima format array [mode, desc, fare, durasi] maupun objek {mode, description, fare}
    if (Array.isArray(option)) {
        return option.length >= 3 ? [option[0], option[1], option[2], option[3] || ''] : null;
    }
    if (option && typeof option === 'object') {
        return [option.mode, option.description || option.desc || '', option.fare || '', option.duration || ''];
    }
    return null;
}

function normalizeDestination(destination) {
    var item = destination || {};
    var lat = item.latitude != null ? item.latitude : (Array.isArray(item.coords) ? item.coords[0] : NaN);
    var lng = item.longitude != null ? item.longitude : (Array.isArray(item.coords) ? item.coords[1] : NaN);
    var desc = typeof item.desc === 'string' ? item.desc : (typeof item.description === 'string' ? item.description : '');
    var img  = typeof item.img === 'string' ? item.img : (typeof item.image_url === 'string' ? item.image_url : '');
    return {
        id: item.id,
        name: typeof item.name === 'string' ? item.name : 'Destinasi tanpa nama',
        category: typeof item.category === 'string' ? item.category : 'Destinasi',
        desc: desc,
        tags: Array.isArray(item.tags) ? item.tags.filter(function(tag) {
            return typeof tag === 'string';
        }) : [],
        coords: [Number(lat), Number(lng)],
        img: img,
        options: (Array.isArray(item.options) ? item.options : [])
            .map(normalizeOption)
            .filter(function(option) { return option && option[0] !== 'angkot'; })
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
