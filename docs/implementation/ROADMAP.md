# Roadmap Implementasi SATU: Kesempatan Kolaborasi Berbasis Kemampuan

## Strategi dan Status Dokumen

Roadmap ini menerjemahkan fokus yang disetujui pada 9 Oktober 2026 menjadi urutan pekerjaan. Tujuannya membuktikan kesempatan bergabung, hubungan kerja baru, dan pengakuan kontribusi, bukan menyelesaikan sebanyak mungkin modul.

Tahap T01 sampai T10 adalah urutan outcome dan dependensi, bukan status pekerjaan, persentase, atau milestone GitHub baru. Issue dan milestone existing tetap sumber kebenaran pelaksanaan. Perubahan GitHub hanya dilakukan melalui permintaan terpisah; dokumen ini tidak menyatakan seluruh pekerjaan lama telah selesai atau dipindahkan.

Gunakan implementasi yang sudah ada apabila sesuai kontrak. Audit gap sebelum membangun ulang. Tidak menghapus data atau menonaktifkan job, route, listener, dan permission melalui perubahan dokumentasi.

Sumber: [PRODUCT.md](../../PRODUCT.md), [PRD](../product/PRD.md), [Business Flow](../product/BUSINESS_FLOW.md), serta keputusan [DEC-033](../governance/DECISIONS.md#pemfokusan-rilis-kesempatan-kolaborasi).

## Tahapan Implementasi Fokus

Urutan utama:

`T01 -> T02 -> T03 -> T04 -> T05 -> T06 -> T07 -> T08 -> T09 -> T10`

Perubahan frontend dapat dipersiapkan setelah kontrak backend yang diperlukan jelas, tetapi belum dianggap selesai sebelum pengujian alur. Gate eksternal membatasi pilot data nyata, bukan menghalangi prototipe berlabel sintetis yang aman.

| Tahap | Fokus                                                | Dependensi                                  | Keluaran utama                                                                                                        | Kriteria selesai                                                                                                                                                  |
| ----- | ---------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T01   | Audit gap dan definisi pembuktian masalah            | Fokus produk disetujui                      | Peta alur aktual, skenario pengguna baru, inventaris dependensi, definisi evaluasi, dan daftar keputusan manusia      | Kemampuan aktual dipisahkan dari rencana; satu skenario inti dan cara menguji manfaat disepakati; tidak ada klaim hasil wawancara/pilot yang belum dilakukan      |
| T02   | Penyederhanaan navigasi dan pemisahan modul lanjutan | T01                                         | Kontrak UX, prioritas menu/beranda, serta rencana transisi fitur dengan dampak dan pemulihan                          | Pengguna memahami tindakan utama; dependensi modul lanjutan terpetakan; tidak ada penghapusan data atau pembukaan izin lewat perubahan menu                       |
| T03   | Profil kemampuan dan pintu masuk pemula              | T02, kontrak akses bukti dan afiliasi       | Profil, minat, ketersediaan, bukti berizin, batas verifikasi, serta jalur tanpa portofolio                            | Mahasiswa tanpa karya/relasi dapat menyiapkan profil dan mencari peluang; isian sendiri tidak tampil sebagai kompetensi tervalidasi                               |
| T04   | Peluang yang terbuka dan kebutuhan peran             | T03                                         | Discovery, filter, detail peran, kapasitas aktual, kriteria, serta peluang pemula                                     | Mahasiswa dalam scope yang diizinkan menemukan peluang tanpa undangan; dapat memahami peran dan kelayakan tanpa melihat data privat                               |
| T05   | Pencocokan dinamis yang dapat dijelaskan             | T03, T04, kebijakan tanpa riwayat           | Pemicu pembaruan, versi skor, empat dimensi, alasan, stale state, fallback, dan tes fairness                          | Perubahan profil/proyek menghasilkan rekomendasi aktual yang teruji; pengguna tanpa riwayat tidak dihukum otomatis; GET tidak menulis data                        |
| T06   | Pengajuan, keputusan, dan pembentukan relasi kerja   | T04, T05                                    | Pengajuan sederhana, status, keputusan beralasan, riwayat, notifikasi, serta tim atomik                               | Pengajuan sampai ke pengambil keputusan; penerimaan membentuk membership dan membuka workspace; penolakan dapat dipahami; tidak ada duplikasi/kelebihan kapasitas |
| T07   | Kolaborasi dan pekerjaan yang nyaman                 | T06                                         | Tugas/peran, penanggung jawab, bukti privat, diskusi, realtime, pemulihan, serta beranda kontekstual                  | Anggota mengetahui pekerjaan berikutnya dan bekerja dengan rekan baru; alur tidak bergantung pada aktivitas bicara, drag, atau animasi                            |
| T08   | Kontribusi individual sampai pengakuan               | T07, peninjau dan standar bukti             | Pengajuan bukti, versi, antrean kampus, alasan/revisi, portofolio bersumber, serta kendali berbagi                    | Kontribusi setiap anggota dibedakan; keputusan dan revisi terhubung; pengakuan dapat ditelusuri tanpa memublikasikan bukti privat                                 |
| T09   | Tindak lanjut kesempatan dan evaluasi kampus         | T06, T08, izin/retensi data evaluasi        | Kebutuhan dukungan pilihan, tindak lanjut manusia, konteks bukti berizin, dan ringkasan outcome                       | Kampus dapat menawarkan kesempatan yang relevan; mahasiswa tetap memilih; kasus mempunyai tindak lanjut yang tercatat tanpa label atau auto-contact               |
| T10   | Demo utuh, pengujian, dan pilot berizin              | T02 sampai T09; gate data nyata untuk pilot | Landing fokus, dataset sintetis yang dapat direset, browser/security/accessibility tests, UAT, serta laporan evaluasi | Satu perjalanan inti berjalan utuh dengan state gagal/pemulihan; demo tidak menjadi klaim dampak; pilot nyata hanya setelah persetujuan yang diperlukan           |

### T01: Audit Gap dan Definisi Pembuktian Masalah

Owner utama: product-design dan fullstack; QA membantu memetakan skenario.

1. Telusuri akun baru, afiliasi, profil, peluang, rekomendasi, pengajuan, tim, pekerjaan, kontribusi, keputusan kampus, dan portofolio.
2. Catat route, command, event, job, projection, dan dependency yang sudah ada. Bedakan tampilan, data seeded, serta sambungan yang belum tersedia.
3. Tetapkan skenario mahasiswa tanpa portofolio/riwayat, mahasiswa dengan bukti awal, pemilik proyek, peninjau kampus, dan admin platform.
4. Rencanakan wawancara mahasiswa serta pengelola kampus untuk memvalidasi hambatan kesempatan. Catat hasil hanya setelah kegiatan dilakukan.
5. Tentukan populasi evaluasi, periode, sumber, indikator hubungan kerja baru, baseline, serta target yang memerlukan persetujuan manusia.

Handoff: peta gap dan acceptance criteria untuk issue berikutnya. Gate wawancara, institusi pilot, dan target manfaat tidak dianggap selesai hanya karena dokumen tersedia.

Keluaran audit repository pada 9 Oktober 2026: [Audit Alur Kesempatan Kolaborasi](../product/COLLABORATION_AUDIT.md). Dokumen memisahkan sambungan statis, registrasi runtime, data contoh, serta verifikasi yang belum dilakukan. Skenario dan rancangan evaluasinya menjadi masukan konfirmasi pemilik produk/kampus, bukan penutupan gate atau klaim T01 telah tervalidasi di lapangan.

### T02: Penyederhanaan Navigasi dan Pemisahan Modul Lanjutan

Owner utama: product-design dan frontend; backend meninjau efek route/job/listener.

1. Rancang Beranda, Proyek, Kontribusi, serta Portofolio sebagai navigasi inti. Proyek membedakan Peluang dan Proyek saya.
2. Prioritaskan tugas/revisi atau pemulihan yang aktual sebelum rekomendasi baru. Bukan urutan kartu yang sama untuk semua keadaan.
3. Rancang operator berfokus pada afiliasi, validasi, serta tindak lanjut kesempatan tanpa klasifikasi kepribadian.
4. Inventaris gamifikasi, Talent Portal, integrasi akademik, dan analitik inklusi lanjutan: menu, route, Policy, event listener, job, notifikasi, seed, dan projection.
5. Tentukan batas rilis, cara membatasi surface, alasan disabled jika diperlukan, serta rollback. Jangan memutus event kontribusi yang juga digunakan portofolio.
6. Perbarui SCREEN_INVENTORY dan USER_FLOWS sebelum perubahan UI. Gunakan DESIGN yang ada; tur tetap pilihan.

Handoff: daftar perubahan UI dan rencana transisi yang dapat direview. Data, audit, consent, dan listener yang masih menjadi dependensi inti dipertahankan. Tidak menambah feature flag atau mematikannya tanpa keputusan implementasi.

Kontrak transisi T02 berada pada [Screen Inventory](../ux/SCREEN_INVENTORY.md#fokus-navigasi-dan-arahan-kerja-t02) serta [User Flows](../ux/USER_FLOWS.md#navigasi-aplikasi). Pembatasan berupa pengelompokan menu/tur dan arahan baca-saja; seluruh consumer, scheduler, route, Policy dan pencabutan izin existing tetap. Rollback hanya mengembalikan susunan menu/tur, tanpa perubahan schema atau penghapusan data. Penghentian modul secara penuh bukan keluaran transisi ini.

Implementasi T02 (10 Oktober 2026): navigasi inti dan disclosure lanjutan, pilihan Peluang/Proyek saya berbasis query server, prioritas pekerjaan aktual di Beranda, serta tur empat menu sudah tersedia. Uji regresi query/Policy dan GET baca-saja dapat dijalankan melalui `php .github/scripts/check-core-navigation.php`; seluruh fixture dipaksa memakai SQLite di memori. Panduan diuji melalui `node --test .github/scripts/check-feature-guide.cjs`. Pemeriksaan statis dan browser dengan data sintetis tidak menggantikan UAT mahasiswa/operator atau membuktikan dampak produk. Jalur pemula, pencocokan dinamis, serta dukungan operator tetap keluaran tahap berikutnya.

### T03: Profil Kemampuan dan Pintu Masuk Pemula

Owner utama: fullstack dan product-design.

1. Pastikan identitas serta afiliasi existing memiliki jalur pemulihan yang jelas. Jangan membuat mahasiswa mengulang onboarding tanpa kebutuhan.
2. Selaraskan keahlian yang dinyatakan, minat, dan ketersediaan dengan kontrak pencocokan.
3. Rancang bukti awal yang dapat diakses sesuai izin, termasuk status belum ditinjau dan sumber kontribusi yang sudah disetujui.
4. Tetapkan kontrak tautan/berkas, akses kampus, keamanan, serta batas proyeksi sebelum menyimpan bukti baru.
5. Sediakan jalur profil tanpa karya. Jangan memakai definisi active member gamifikasi yang mensyaratkan kontribusi disetujui sebagai syarat kelayakan peserta baru.

Verifikasi: tanpa bukti, data terbatas, jadwal kosong, menunggu afiliasi, validasi gagal, akses ditolak, dan penyimpanan jaringan gagal tidak berubah menjadi klaim profil siap/terverifikasi.

Implementasi T03 (10 Oktober 2026): halaman Profil kemampuan tersedia dari menu pengguna dan arahan Beranda, tanpa menambah menu inti kelima. Mahasiswa dapat menyimpan minat saja, keahlian yang dinyatakan sendiri, serta jadwal per baris. Profil tanpa karya tetap dapat menelusuri peluang. Afiliasi menggunakan konteks mahasiswa existing dan jalur pemulihan yang dapat dibuka atau ditutup; profil belum lengkap tidak memaksa onboarding berulang.

Bukti awal berupa tautan HTTPS opsional yang hanya dapat dibuka pemilik profil. Metadata lama dipertahankan kecuali diganti secara eksplisit. Tidak ada unggahan berkas baru, persetujuan otomatis atau pembagian bukti ke kampus, tim, perekrut dan publik. Sumber kontribusi berasal dari persetujuan versi aktual dalam tenant pemilik, dengan tautan detail tetap mengikuti Policy. Berkas dan peninjauan kampus tetap memakai alur Kontribusi existing. Kontraknya tercatat pada [Screen Inventory](../ux/SCREEN_INVENTORY.md#profil-kemampuan-dan-pintu-masuk-pemula-t03), [User Flows](../ux/USER_FLOWS.md#profil-kemampuan-t03), [Data Model](../engineering/DATA_MODEL.md), dan [Security Privacy](../engineering/SECURITY_PRIVACY.md).

Uji regresi dapat dijalankan melalui `php .github/scripts/check-student-capabilities.php` dan `node --test .github/scripts/check-student-capabilities.cjs`. Fixture backend memakai SQLite di memori, bukan database aplikasi. Penyimpanan profil/jadwal atomik, konflik revisi, metadata legacy, batas tenant, status pending/suspended, serta batas bukti dan proyeksi diuji. Pemeriksaan browser memakai data sintetis dan intersepsi seluruh mutasi. Verifikasi teknis ini tidak menggantikan UAT mahasiswa atau menutup gate pilot. Kriteria peluang pemula, pencocokan dinamis, keputusan tim dan pengakuan kontribusi tetap keluaran T04 sampai T08.

### T04: Peluang yang Terbuka dan Kebutuhan Peran

Owner utama: fullstack dan frontend.

1. Selaraskan editor proyek dengan tujuan, kebutuhan peran, kriteria, serta penerimaan pemula. Informasi harus berasal dari pemilik, bukan asumsi UI.
2. Bedakan kapasitas total, kapasitas terisi, dan tempat yang masih tersedia berdasarkan sumber aktual.
3. Pastikan peluang yang sengaja dibuka untuk mahasiswa kampus dapat ditemukan tanpa undangan. Proyek privat tidak ikut dibuka.
4. Tampilkan pencarian, filter URL, peran, tenggat relevan, dan tindakan pengajuan.
5. Sediakan pemulihan jika peluang kosong, penuh, tutup, dibatalkan, atau izin berubah.

Verifikasi: peluang pemula ditemukan oleh profil tanpa karya; scope tenant dan visibility benar; filter/pagination tidak menciptakan peluang contoh diam-diam.

Implementasi teknis 10 Oktober 2026: editor menyimpan pernyataan pemula dan kriteria pemilik, sementara daftar/detail membaca kapasitas anggota aktif. Filter pemula dan tempat tersedia memakai URL serta query server; kombinasi keduanya memerlukan peran yang sama. Edit mempertahankan ID peran dan menolak penghapusan referensi tim/pengajuan/undangan. Pengajuan existing memeriksa kapasitas di bawah lock proyek, tanpa mengubah flow keputusan T06. Null pada data lama berarti belum dinyatakan, bukan menerima pemula. Penyimpanan dengan hasil tidak pasti tidak dicoba ulang otomatis; draft yang sudah terbentuk mempunyai tautan pemulihan tersendiri.

Regresi: `php .github/scripts/check-project-opportunities.php` memakai SQLite di memori dan `node --test .github/scripts/check-project-opportunities.cjs` memeriksa copy status tanpa inferensi. Browser memakai fixture sintetis dengan seluruh mutasi diintersepsi, mencakup filter/pagination, kosong, lifecycle, 403, 422, konflik, jaringan, fokus kesalahan, reduced motion, 320px sampai 3440px, serta zoom 200%. Ini bukan bukti UAT, fairness atau dampak pilot. Pencocokan dinamis T05 belum diterapkan.

Database existing: jalankan `php artisan projects:sync-opportunity-schema --database=mysql --no-interaction` untuk inspeksi target. Tambahkan `--apply` setelah memeriksa koneksi/database; production juga memerlukan `--force`. Command hanya menambah dua kolom nullable yang belum ada, tanpa reset, penghapusan atau pengisian kebijakan pemula untuk data lama. Migration asal sudah memuat kolom untuk instalasi baru.

### T05: Pencocokan Dinamis yang Dapat Dijelaskan

Owner utama: backend dan QA; product-design/security-privacy meninjau kebijakan.

1. Tetapkan sumber input kebutuhan proyek, keahlian, jadwal, serta metadata hubungan yang sah. Jangan mengasumsikan overlap jadwal bila proyek tidak memiliki kebutuhan waktu.
2. Hubungkan perubahan input dengan invalidasi dan perhitungan ulang melalui Actions, Events, dan Jobs existing atau yang diperlukan. Hindari perhitungan tersimpan pada GET.
3. Pertahankan empat dimensi dan versi immutable. Tidak menambah personality score, popularitas, atau IPK.
4. Tetapkan perlakuan data kosong dan tanpa riwayat: label keterbatasan, kebijakan fallback, serta penelusuran manual.
5. Pertahankan alasan dan feedback, tanpa menampilkan jumlah koneksi privat atau sinyal inklusi.
6. Uji kondisi kapasitas/lifecycle berubah, pekerjaan berulang, job gagal, versi stale, dan permintaan lintas tenant.

Handoff: rekomendasi dari perubahan data pengguna aktual, bukan hanya fixture, disertai alasan dan batas ketidakpastian. Gate pemrosesan metadata dan kebijakan data terbatas diselesaikan sebelum pilot nyata.

Implementasi teknis 10 Oktober 2026: perubahan profil, kebutuhan proyek serta
anggota tim menerbitkan event setelah commit. Permintaan per kandidat/kampus
persisten, job membaca izin dan sumber terbaru, batch atomik dan revision
menjaga pekerjaan ulang/lama. Scheduler `matching:reconcile-refreshes` setiap
lima menit memulihkan antrean tertunda, versi berubah dan TTL enam jam. Retry
job memakai backoff 10/60/120 detik, tiga percobaan dan timeout 120 detik,
di bawah retry_after database/Redis 180 detik. Worker memakai antrean default;
jangan menjalankan command rekonsiliasi pada GET.

Kebijakan v2 hanya membandingkan peran tersedia. Jadwal proyek yang belum ada
dan dimensi hubungan netral, tanpa membaca jaringan atau bukti privat.
Versi legacy tidak diubah. Beranda menyediakan Perbarui rekomendasi (POST),
Periksa status (GET), alasan/batas hasil, serta penelusuran manual pada antrean,
gagal, kosong, stale dan konfigurasi belum tersedia. Pilihan sembunyikan/tidak
relevan tetap berlaku antar-batch. T06 belum dikerjakan lewat tahap ini.

Instalasi menjalankan migration tabel baru `matching_refresh_requests`, tanpa
reset atau migration tambahan untuk kolom tabel existing. Pembuatan konfigurasi
melalui `matching:create-score-version` memerlukan `--actor` admin platform,
`--score-version` baru dan `--weights` JSON empat dimensi secara eksplisit.
Tanpa `--activate`, versi tidak aktif. Periksa `--help`; tidak ada bobot produksi
default atau pembuatan versi diam-diam. Aktifkan hanya setelah persetujuan
kebijakan, dan jalankan worker/scheduler. Production juga tetap dikunci oleh
`MATCHING_PRODUCTION_APPROVED=false` secara default. Rekonsiliasi awal memproses
permintaan existing; profil lama tanpa permintaan menggunakan POST eksplisit.

Verifikasi melalui `php .github/scripts/check-dynamic-matching.php` memakai
SQLite di memori, termasuk tanpa karya/riwayat, perubahan sumber pada detik
yang sama, tenant, retry, rollback, feedback, versi dan expiry. Browser memakai
fixture sintetis dan intersepsi seluruh mutasi, bukan database aplikasi. Uji
teknis ini tidak menggantikan UAT, uji beban/concurrency MySQL produksi,
persetujuan bobot atau bukti manfaat/fairness pilot.

### T06: Pengajuan, Keputusan, dan Pembentukan Relasi Kerja

Owner utama: fullstack dan QA.

1. Pengajuan menjelaskan peran, minat, kemampuan relevan, dan ketersediaan tanpa formulir promosi diri yang tidak perlu.
2. Pemilik dapat membaca bukti yang memang diizinkan. Pemohon tidak melihat pelamar lain atau catatan internal.
3. Keputusan mengacu pada kriteria peran, mempunyai alasan, dan memberikan langkah berikutnya.
4. Penerimaan membuat membership atomik, mengubah kapasitas, mengirim notifikasi, serta membuka akses workspace yang sah.
5. Penolakan, pembatalan, permintaan ganda, kapasitas penuh, dan keputusan stale dapat dipahami tanpa jaminan penerimaan otomatis.
6. Catat peristiwa yang diperlukan untuk evaluasi sesuai kontrak FR-12. Relasi yang dimaksud berasal dari pekerjaan bersama, bukan follower.

Verifikasi: perjalanan pemohon dan pemilik sampai ke tim, policy lintas tenant, concurrency, alasan, serta delivery notifikasi.

Implementasi teknis 10 Oktober 2026: pengajuan memakai tiga jawaban singkat dan
peran opsional, tanpa syarat karya atau profil siap. Pemilik mendapat kriteria
aktual serta maksimal tiga ringkasan karya kampus/publik yang diizinkan, bukan
bukti privat. Penerimaan dan penolakan wajib alasan yang dibagikan; hash revisi
menolak keputusan lama di bawah lock proyek. Pemohon dapat menarik pending,
termasuk ketika proyek ditutup, dan membaca riwayat dengan pagination. Tawaran
pending lain berakhir saat membership terbentuk melalui jalur berbeda, tanpa
label penolakan kemampuan. Preview proyek privat memerlukan undangan pending
belum kedaluwarsa; workspace tetap memerlukan izin membership/lifecycle aktual.

Keanggotaan, kapasitas, keputusan, audit dan penyelesaian tawaran tersimpan
atomik. Event kapasitas T05 dipertahankan; event membership membedakan jenis
sumber. Notifikasi canonical database diantrekan setelah commit dan worker
tetap perlu dijalankan dalam operasi aplikasi. GET hanya membaca. Antarmuka
mengunci command saat kirim/refresh atau hasil tidak pasti sampai status terbaru
berhasil diperiksa; refresh tidak mengganti seluruh halaman dengan skeleton.

Regresi dapat dijalankan melalui `php .github/scripts/check-team-formation.php`.
79 pemeriksaan backend memakai SQLite di memori, termasuk replay/dua snapshot
pada tempat terakhir, rollback, batas tenant dan karya berizin, serta pemrosesan
job notifikasi sampai record canonical. 42 pemeriksaan browser memakai fixture
sintetis dengan seluruh mutasi diintersepsi, mencakup 320px sampai 3440px,
zoom 200%, reduced motion, keyboard/fokus, processing, konflik, network/HTTP
failure, forbidden, pagination dan pemulihan. Pemeriksaan teknis ini tidak
menggantikan uji concurrency nyata pada MySQL, uji beban, UAT atau persetujuan
pilot/retensi. Tidak mengklaim dampak relasi kerja dan tidak membuka gate T05.

### T07: Kolaborasi dan Pekerjaan yang Nyaman

Owner utama: fullstack, frontend, dan QA.

1. Perjelas tugas dan penanggung jawab sebagai jalan masuk kontribusi individual.
2. Pertahankan bukti privat serta diskusi seperlunya. Tidak membangun feed popularitas atau analisis isi pesan.
3. Selaraskan Beranda dengan tugas, revisi, dan konteks proyek aktif yang sebenarnya.
4. Pertahankan realtime authorized-after-commit, status stale, reconnect, serta reconciliation database.
5. Pastikan keyboard, mobile, layar pendek, dan reduced motion dapat menyelesaikan pekerjaan.

Verifikasi: mahasiswa menemukan tugas, bekerja, dan mengunggah bukti tanpa wajib berbicara publik; konflik task, upload gagal, permission berubah, serta koneksi terputus mempunyai pemulihan.

Status implementasi 11 Oktober 2026: pilihan tugas pribadi/belum ditugaskan,
tautan tugas aktual dari Beranda, unggah bukti tanpa pesan, revisi tugas termasuk
assignment, draft yang tidak ditimpa refresh, pemulihan GET tanpa retry mutasi,
delta bukti setelah commit, dan penyembunyian data saat izin hilang telah
diterapkan. Tenggat lokal dikirim sebagai UTC. Tidak ada perubahan schema.

Verifikasi sintetis: 60 pemeriksaan backend terisolasi melalui
[skrip ruang kerja](../../.github/scripts/check-workspace-collaboration.php),
serta 49 pemeriksaan antarmuka melalui
[fixture browser](../../.github/scripts/check-workspace-collaboration.cjs).
Fixture browser memakai server PHP/Vite lokal, Playwright dan Chromium yang
sudah tersedia, Reverb tiruan, serta intersepsi seluruh mutasi. Jika Playwright
tidak tersedia sebagai modul lokal, tentukan `SATU_PLAYWRIGHT_MODULE` dan
`SATU_BROWSER_EXECUTABLE` sebelum menjalankan skrip. Tidak menambah dependensi
aplikasi. Regresi T02, T05, dan T06 diperiksa ulang.

Belum diverifikasi: concurrency MySQL nyata, transport Reverb/worker produksi,
malware/retensi, serta UAT mahasiswa dan kampus. Tidak mengaktifkan matching
produksi, menganalisis percakapan, atau mengklaim dampak pilot. T08 tetap tahap
terpisah untuk standar bukti, validasi individual, dan pengakuan.

### T08: Kontribusi Individual sampai Pengakuan

Owner utama: fullstack, product-design, dan peninjau kampus.

1. Nyatakan pekerjaan individual, tugas/peran, klaim, ringkasan, pernyataan, dan bukti dari sumber yang sah.
2. Tetapkan standar bukti dan batas verifikasi bersama kampus. Jangan menjanjikan SLA yang belum disepakati.
3. Hubungkan pengiriman ke antrean reviewer berwenang; keputusan memakai versi yang tepat serta alasan untuk perbaikan/penolakan.
4. Revisi membuat versi baru tanpa menghapus versi atau keputusan lama.
5. Approval memperbarui portofolio bersumber jelas. Jangan mengaktifkan modul lanjutan sebagai syarat keberhasilan portofolio.
6. Bedakan bukti privat, ringkasan yang dapat dibagikan, visibility, dan pencabutan consent.

Status teknis T08 pada 11 Oktober 2026: implementasi dan verifikasi sintetis
tersedia. Klaim/ringkasan individual, penggantian bukti pada versi baru, token
sumber pada submit/revisi/review, antrean non-draft dan unduhan bukti pengajuan,
serta karya privat atomik bersama approval telah terhubung. Consumer lanjutan
existing tetap ada; tidak mengaktifkan gate modul lain atau menulis ulang
karya historical pada database aplikasi.

Verifikasi: 61 pemeriksaan backend pada SQLite di memori dan 46 pemeriksaan
browser dengan seluruh mutasi dicegat. Beberapa anggota satu proyek/bukti
bersama mendapat karya berbeda; tanpa bukti/file hilang/path tidak sah
ditolak; stale pada detik sama, rollback approval/karya, revisi append-only,
withdrawal, allowlist publik/perekrut, serta akses lintas tenant/role diperiksa.
Browser mencakup 320px sampai 3440px, zoom 200%, layar pendek, fokus error,
pemulihan draft/konflik, hasil jaringan belum pasti, submit ulang setelah
revisi, larangan retry otomatis, dan forbidden tanpa konten privat lama.
Regresi navigasi/profil/peluang/pencocokan/tim/ruang kerja tetap lulus.

Standar bukti final dan reviewer bersama kampus, SLA, retensi, privacy serta
UAT data nyata masih memerlukan pemilik berwenang. Tes sintetis bukan
persetujuan manusia atau pembuktian transaksi konkuren di MySQL produksi.

### T09: Tindak Lanjut Kesempatan dan Evaluasi Kampus

Status teknis 11 Oktober 2026: permintaan bantuan sukarela, consent per
berkas, peninjau yang ditunjuk, tawaran peran aktual, respons mahasiswa,
pencabutan, catatan serta riwayat append-only telah diimplementasikan.
Entry ada pada Proyek dan Ringkasan, tanpa menu inti baru atau engine inklusi.
Snapshot operasional menggunakan sumber aktual dan denominator terverifikasi
saat pembacaan, bukan kohort impact pada T0. View serta hubungan kerja baru
tetap unavailable karena instrumentasi/definisi/riwayat belum lengkap.

Aktivasi default tertutup. Kebijakan notice, tujuan, peninjau, masa akses,
retensi penyimpanan, persetujuan data nyata, manifest dataset, ambang kelompok
kecil dan evaluasi pilot belum disetujui oleh implementasi ini. GATE-001,
GATE-002 dan UAT tetap terbuka. Tes synthetic tidak membuktikan impact,
kelengkapan riwayat atau concurrency MySQL produksi.

Owner utama: product-design, fullstack, dan security-privacy; kampus menyetujui proses operasional.

1. Mulai dari kebutuhan yang dipilih mahasiswa serta bukti yang diizinkan, bukan hasil deteksi kepribadian.
2. Tetapkan peninjau, tujuan, akses, alasan, retensi, serta audit untuk tindak lanjut.
3. Hubungkan tawaran dukungan dengan peluang yang tersedia. Mahasiswa bebas menolak atau tidak mengajukan.
4. Catat tindakan manusia dan hasil yang diketahui. Jangan mengklaim dukungan tercapai hanya karena catatan disimpan.
5. Bentuk ringkasan perjalanan pengajuan, bergabung, hubungan kerja baru, kontribusi, dan pengakuan berdasarkan sumber aktual.
6. Pisahkan denominator mahasiswa eligible dari definisi kelompok gamifikasi; jangan mengeluarkan mahasiswa baru karena belum punya kontribusi.
7. Jaga privasi kelompok kecil serta akses restricted. Graf dan engine inklusi lanjutan tidak wajib dibuat/diaktifkan pada tahap ini.

Verifikasi: peninjau dapat menindaklanjuti kasus dengan peluang relevan; izin dicabut menghentikan exposure berikutnya; tidak ada auto-contact atau label; hasil sintetis dan nyata terpisah.

### T10: Demo Utuh, Pengujian, dan Pilot Berizin

Status teknis 11 Oktober 2026: landing, tur dan demo perjalanan sintetis
diselaraskan; graf menjadi pelengkap. Dataset awal terisolasi dan suite
Actions membuktikan perjalanan mahasiswa tanpa karya sampai pengakuan,
berbagi/pencabutan, termasuk admin platform, reviewer, mismatch afiliasi,
kapasitas stale, revisi, queue, fake provider dan restore logical uji.
Runner tersedia di CI. Verifikasi lokal: 65 pemeriksaan perjalanan T10,
regresi backend T02 sampai T09, 21 unit aset/tur/demo, 38 pemeriksaan browser
landing dan regresi workspace/kontribusi/bantuan lulus. Reflow 320px sampai
3440px, keyboard/fokus, zoom 200%, reduced motion, offline, loading dan
kegagalan modul peta diperiksa. Pint, lint, format, Wayfinder/TypeScript,
PHPStan, tautan/referensi dokumen dan diff check lulus.
Ini bukan status lulus rilis penuh: studi usability,
final UAT/persetujuan visual, concurrency MySQL, drill recovery produksi,
Reverb/provider nyata dan seluruh izin pilot masih memerlukan tindak lanjut.

Owner utama: QA, product-design, devops, serta pemilik kampus untuk pilot nyata.

1. Selaraskan landing, tur, dan demo dengan satu perjalanan inti. Tetap gunakan identitas dan aset SATU yang disetujui.
2. Siapkan dataset sintetis yang dapat direset, termasuk mahasiswa tanpa riwayat dan keadaan gagal.
3. Jalankan satu perjalanan utuh mahasiswa, pemilik proyek, peninjau, dan admin platform. Periksa bahwa hasil bukan sekadar halaman seeded.
4. Uji keamanan, cross-tenant, projection, concurrency, queue, notifikasi, backup/restore, dan provider degradation sesuai risiko.
5. Uji 320px sampai layar besar, keyboard, zoom, reduced motion, loading, processing, empty, network/HTTP error, forbidden, stale, dan reconnect.
6. Lakukan usability study dan final UAT. Pilot nyata hanya setelah institusi, izin data, retensi, standar bukti, serta proses dukungan disetujui.
7. Evaluasi manfaat terhadap baseline dan target yang disepakati; nyatakan keterbatasan serta kegagalan tanpa mengarang dampak.

Kriteria rilis: acceptance PRD inti terpenuhi. Demonstrasi sintetis boleh membuktikan mekanisme, tetapi bukan hasil pilot atau efektivitas mengurangi ketimpangan.

## Pembagian Prioritas

- Prioritas inti: akses dan profil pemula, peluang, pencocokan dinamis, pengajuan sampai tim, kontribusi individual, dan pengakuan.
- Prioritas pendukung: operasi kampus, admin platform, notifikasi, keamanan, aksesibilitas, serta evaluasi hasil.
- Ditunda: XP/badge/peringkat, Talent Portal, kredit/sinkronisasi akademik, graf dan engine inklusi lanjutan.
- Tidak dilakukan tanpa persetujuan: penghapusan data, penutupan gate, aktivasi analitik nyata, perubahan permission, dependency baru, atau mutasi GitHub.

## Pemetaan ke Milestone Existing

Nama berikut adalah struktur milestone historis, bukan perintah mengganti milestone atau klaim status terkini.

| Milestone existing                           | Bagian yang relevan untuk fokus inti                              | Tahap         |
| -------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| M0 Governance dan Delivery                   | Fokus, keputusan, kontrak issue, dan gate                         | T01           |
| M1 Visual Authority                          | Identitas global, navigasi, dan hierarki pekerjaan                | T02, T10      |
| M2 Identity, WhatsApp, Tenancy, dan Roster   | Identitas, afiliasi, provisioning, dan pemulihan                  | T03, T10      |
| M3 Profile, Skill, dan Notification          | Kemampuan, minat, ketersediaan, bukti berizin, notifikasi         | T03, T06, T07 |
| M4 Project, Matching, dan Team               | Peluang, pencocokan, pengajuan, dan tim                           | T04, T05, T06 |
| M5 Realtime Workspace                        | Pekerjaan, bukti privat, realtime, dan recovery                   | T07           |
| M6 Contribution, Portfolio, dan Gamification | Kontribusi serta portofolio inti; gamifikasi ditunda              | T08           |
| M7 Campus dan Inclusion                      | Operasi dan tindak lanjut inti; analitik inklusi lanjutan ditunda | T09           |
| M8 Talent, Academic, dan Landing             | Landing inti; Talent dan akademik ditunda                         | T02, T10      |
| M9 Production Readiness dan UAT              | Pengujian, evaluasi, operasi, serta demo jujur                    | T10           |

Issue lanjutan tidak ditutup sebagai selesai karena keluar dari prioritas inti. Reprioritisasi issue, milestone, atau Project memerlukan permintaan pengguna terpisah sesuai [kontrak implementasi](./README.md).

## Gate Rilis

- Fokus produk disetujui; validasi masalah, baseline, dan target manfaat tetap membutuhkan bukti serta keputusan pemilik.
- Afiliasi, standar bukti, peninjau, serta proses tindak lanjut disepakati kampus sebelum pilot nyata.
- Kebijakan pencocokan tanpa riwayat dan tujuan metadata ditinjau.
- Gate privacy, security, retensi, akses, serta data rights diselesaikan sesuai penggunaan data, termasuk evaluasi.
- Final visual approval, UAT, reliability, dan pemulihan lulus.
- Penundaan modul tidak menutup gate inklusi, perekrut, gamifikasi, atau provider akademik nyata.

## Aturan Pelaksanaan

Sebelum UI berubah, perbarui dokumen UX pemilik dan baca DESIGN. Sebelum entitas, event, izin, projection, atau integrasi berubah, perbarui kontrak engineering dan security/privacy yang relevan. Gunakan Laravel modular monolith, Actions, Policies, Form Requests, Jobs, serta named routes/Wayfinder sesuai konvensi existing.

Pemeriksaan runtime mengikuti AGENTS: lint, format, typecheck, PHPStan/Pint jika PHP berubah, tes relevan, dan inspeksi browser. Jangan menjalankan build untuk perubahan biasa tanpa alasan yang diizinkan. Dokumen melewati Prettier, pemeriksaan tautan, referensi requirement/UX, dan `git diff --check`.

Tidak ada estimasi durasi, persentase, atau status selesai yang diasumsikan dalam roadmap ini.

Bukti verifikasi teknis T09: 65 pemeriksaan backend dan 39 pemeriksaan browser
synthetic, termasuk pencabutan/expiry, lintas tenant/role, idempotensi, konflik,
kelompok dan sel kecil, pemulihan jaringan, fokus, reduced motion, reflow
320px sampai 3440px, layar pendek serta zoom 200%. Regresi T02 sampai T08
juga lulus. Dua tabel baru terpasang pada MySQL lokal tanpa data bantuan baru
atau perubahan data pengguna. Lint, TypeScript/Wayfinder, PHPStan, format,
tautan dokumentasi dan diff diperiksa. Ini bukan UAT kampus atau bukti impact.
