# Business Flow SATU

## 1. Fokus dan Status Alur

Alur inti adalah kesempatan kolaborasi berbasis kemampuan sampai pengakuan kontribusi. Penjelasan ini merupakan kontrak target, bukan klaim semua sambungan runtime sudah tersedia. Requirements mengikuti [PRD](./PRD.md), fokus mengikuti [PRODUCT](../../PRODUCT.md), dan urutan pengerjaan mengikuti [ROADMAP](../implementation/ROADMAP.md).

Account, afiliasi, profil kemampuan dan visibility portofolio adalah state terpisah. Registrasi terbuka hanya menghasilkan akun mahasiswa. Semua operasi tenant-owned memakai institusi aktif. In-app notification canonical; WhatsApp kanal delivery sesuai tujuan dan preferensi. Pemulihan merupakan bagian alur utama.

Keputusan 17 Oktober 2026 menghapus role perekrut dan admin platform terpisah.
Alur aktif hanya Mahasiswa serta Admin Universitas UTY. Talent Portal dan kontak
perekrut di bawah adalah riwayat yang dihentikan, bukan alur pengembangan yang
dapat diaktifkan melalui konfigurasi. Data lama tidak memberi role atau izin baru.

Kontrak target 14 Oktober 2026 memakai satu universitas dan dua role inti:
Mahasiswa serta Admin Universitas. Istilah operator atau peninjau di bawah
menyatakan pekerjaan dalam role Admin Universitas. U03 memakai satu sumber
izin membership UTY dan alias teknis `campus_admin`; flag platform lama tidak
memberi akses. Route platform existing dialihkan atau dilindungi dengan izin
baru. U04 menyederhanakan aktivasi dan konteks mahasiswa; U05 menyediakan satu
navigasi serta pengaturan admin. Profil universitas dibaca dari server dan
perubahan melalui deployment; semester mengikuti impor roster. Katalog dan
akses admin memakai operasi berotorisasi, bukan pendaftaran institusi baru.
Rujukan kewenangan: [PRD](./PRD.md#matriks-kewenangan-inti).

## 2. Provisioning Universitas dan Admin

1. Operasi deployment menetapkan satu universitas yang valid serta aktif dari konfigurasi, kemudian memprovisikan admin pertama secara terkontrol. Tidak ada persetujuan institusi baru dalam UI produk inti.
2. Admin Universitas mengelola profil kampus, semester serta katalog keahlian dan dapat mengundang admin berikutnya melalui WhatsApp memakai undangan sekali pakai.
3. Penerima memverifikasi nomor, menetapkan username privat dan password, lalu menerima role Admin Universitas pada universitas yang sama. Setiap akun mempunyai identitas dan audit sendiri.
4. Undangan kedaluwarsa, digunakan ulang, dicabut atau salah nomor tidak memberi peran istimewa dan mempunyai pemulihan. Pengelolaan admin memerlukan autentikasi ulang yang sesuai; admin aktif terakhir tidak dapat dinonaktifkan atau dicabut.
5. Konfigurasi hilang atau tidak aktif menampilkan keadaan terkunci. Server tidak memilih universitas pertama atau memberi izin dari ID kiriman klien. Pemulihan konfigurasi dilakukan melalui operasi deployment, dengan data dan riwayat dipertahankan.

## 3. Aktivasi dan Kemampuan Awal Mahasiswa

1. Mahasiswa memverifikasi nomor WhatsApp, menetapkan username privat/password, serta persetujuan yang diperlukan.
2. Pop-up awal hanya mengajukan afiliasi. Mahasiswa membaca nama universitas server lalu wajib mengisi NIM, fakultas, program studi dan angkatan masuk. Form tidak dapat ditutup sebelum pengajuan valid; Keluar akun tetap tersedia. Exact match nomor terverifikasi serta NIM pada roster mengaktifkan afiliasi; mismatch masuk peninjauan Admin Universitas. ID institusi lain yang dikirim klien ditolak.
3. Pengajuan pending yang sudah tercatat menutup form dan membuka status Beranda. Status menunggu menjelaskan apa yang masih diizinkan, tanpa mengklaim operasi profil atau akses proyek sudah terbuka.
4. Setelah afiliasi terverifikasi, mahasiswa melengkapi Bekal kemampuan dan Cara berkolaborasi. Data akademik terisi dari pengajuan tanpa input ulang. Mahasiswa menyatakan keahlian, minat, dan ketersediaan; karya atau jadwal boleh kosong. Bukti awal hanya dibagikan sesuai izin dan mempunyai sumber/batas verifikasi.
5. Mahasiswa tanpa karya atau relasi terdahulu tetap dapat menyiapkan profil dan menelusuri peluang pemula setelah prasyarat akses terpenuhi.
6. Profil yang diisi sendiri tidak otomatis menjadi kompetensi terverifikasi.

## 4. Peluang dan Rekomendasi sampai Pengajuan

1. Pemilik membuka peluang dengan tujuan, kebutuhan peran, kapasitas, kriteria, serta penerimaan pemula yang jelas.
2. Mahasiswa menelusuri peluang yang dibuka dalam scope institusinya, tanpa harus mendapat undangan personal. Proyek privat tetap terlindungi.
3. Rekomendasi berasal dari input aktual dan versi pencocokan yang dapat dijelaskan; profil/proyek berubah memicu invalidasi atau pembaruan melalui operasi eksplisit.
4. Pencocokan mempertahankan empat dimensi. Data terbatas tidak menjadi label kepribadian atau hukuman otomatis.
5. Mahasiswa tetap dapat menelusuri saat rekomendasi belum tersedia. GET tidak membuat rekomendasi atau data default.
6. Mahasiswa memilih peran dan mengajukan minat dengan informasi relevan. Tidak ada syarat jumlah teman, popularitas, atau gaya bicara.

## 5. Keputusan dan Tim

1. Pemilik meninjau pengajuan berdasarkan kebutuhan peran dan bukti yang diizinkan.
2. Keputusan disertai alasan yang dapat dipahami pemohon tanpa membocorkan catatan internal atau pelamar lain.
3. Policy memeriksa scope, lifecycle, kapasitas, dan kewenangan. Penerimaan atomik membentuk membership yang sah.
4. Pemohon menerima status serta tindakan berikutnya. Pencocokan bukan jaminan diterima.
5. Membership membuka workspace; permintaan ganda, stale, penuh, penolakan, pembatalan, atau izin hilang memiliki pemulihan.
6. Hubungan kerja baru dibuktikan melalui partisipasi tim yang sah, bukan follower atau inferensi isi pesan.

## 6. Kolaborasi sampai Kontribusi Individual

1. Tim membagi tugas serta penanggung jawab sehingga setiap anggota memahami perannya.
2. Anggota bekerja, berkomunikasi seperlunya, serta menyimpan bukti privat tanpa wajib tampil aktif dalam percakapan publik.
3. Database commit menjadi sumber kebenaran, lalu Reverb mengirim delta berotorisasi. Reconnect melakukan reconciliation.
4. Mahasiswa menyatakan pekerjaan individual, klaim, ringkasan, tugas/peran, dan bukti. Hasil tim tidak otomatis diklaim sama oleh semua anggota.
5. Pengiriman masuk antrean peninjau kampus. Beranda memprioritaskan pekerjaan atau revisi aktual sebelum peluang baru.

## 7. Validasi dan Pengakuan

1. Admin Universitas membaca versi yang diajukan, bukti, dan konteks sesuai standar yang disepakati. Draft dan bukti awal profil tetap privat.
2. Peninjau menyetujui, meminta perbaikan, atau menolak langsung. Team confirmation tidak diperlukan.
3. Keputusan tersimpan append-only dengan alasan serta versi yang benar. Admin tidak dapat meninjau kontribusi sendiri. Dua admin yang meninjau bersamaan harus memeriksa sumber terbaru dan tidak menggandakan atau menimpa keputusan.
4. Revisi membuat versi baru tanpa menimpa riwayat. Mahasiswa memahami tindakan berikutnya.
5. Approval membentuk atau memperbarui portofolio bersumber jelas secara idempotent.
6. Portofolio menjelaskan batas pengakuan. Approval tidak memublikasikan bukti privat atau menyatakan semua skill pemilik sudah diuji.
7. Mahasiswa memilih visibility dan dapat mencabut berbagi sesuai kontrak. Gamifikasi, perekrut, atau kredit bukan prasyarat pengakuan inti.
8. Notifikasi serta kanal penting mengikuti tujuan dan preferensi.

## 8. Tindak Lanjut Kesempatan oleh Kampus

1. Mahasiswa memilih untuk menyampaikan kebutuhan kesempatan atau dukungan; bukan ditetapkan sebagai pemalu oleh sistem.
2. Admin Universitas yang ditunjuk sebagai peninjau mengakses konteks/bukti yang diizinkan dan mencatat alasan serta tindak lanjut. Role admin saja tidak membuka berkas bantuan atau sinyal inklusi; consent, masa akses dan gate tetap diperiksa.
3. Dukungan diarahkan pada peluang yang relevan. Mahasiswa tetap bebas mengajukan, menolak, atau tidak bergabung.
4. Mencatat tindak lanjut tidak otomatis mengirim kontak atau membuktikan kolaborasi telah terjadi.
5. Hasil yang diketahui ditelusuri sampai pengajuan, tim, kontribusi, atau pengakuan tanpa label kepribadian.
6. Indikator jaringan dan sinyal terbatas tetap mengikuti gate privacy/governance; tidak menjadi daftar publik.

## 9. Evaluasi Hasil

1. Tentukan populasi, periode, denominator, sumber, baseline, dan target yang disepakati.
2. Mahasiswa tanpa kontribusi terdahulu tidak dikeluarkan hanya karena belum memenuhi definisi active member gamifikasi.
3. Bedakan peluang dilihat, pengajuan, keputusan, bergabung, hubungan kerja baru, serta pengakuan. Jumlah profil/rekomendasi bukan outcome kolaborasi.
4. Riwayat di luar SATU yang tidak diketahui menjadi keterbatasan, bukan dianggap nol tanpa penjelasan.
5. Agregat dan studi pengguna mengikuti izin serta perlindungan kelompok kecil.
6. Data sintetis berlabel untuk demonstrasi; data nyata hanya setelah gate yang relevan selesai. Tidak ada klaim dampak yang belum diuji.

## 10. Alur Pengembangan Lanjutan

Bagian ini tetap merupakan kontrak ketika modul digunakan, bukan dependensi rilis inti.

### Gamifikasi

Approval dapat memicu XP idempotent serta evaluasi badge bila modul diaktifkan sesuai kebijakan. Periode semester, kelompok minimal lima, average verified XP, individual opt-in, dan shared rank tetap berlaku. Sinyal inklusi serta connectivity tidak menjadi input peringkat. Ledger dan consent tidak dihapus ketika modul ditunda.

### Analitik Inklusi Lanjutan

Metadata kolaborasi yang sah dapat membentuk graf serta sinyal berversi di balik feature flag. Data sintetis tidak menggantikan gate data nyata. Peninjau berwenang mencatat tinjauan manusia; tidak ada diagnosis, auto-contact, pemaksaan, atau keputusan merugikan. Isi pesan tidak dianalisis.

### Talent Portal

Organisasi perekrut terverifikasi serta hak akses internal aktif diperlukan. Search memakai proyeksi yang diizinkan. Permintaan kontak dan handoff memerlukan consent mahasiswa. Pencabutan visibility menghentikan exposure berikutnya sesuai retensi. Perekrut tidak menerima bukti privat atau sinyal inklusi.

### Integrasi Akademik

Provider di balik contract dan sandbox baseline. Sambungan dari aktivitas disetujui ke sync candidate harus benar-benar diimplementasikan serta diverifikasi sebelum diklaim tersedia. Pemetaan versi, idempotensi, retry, failure queue, dan reconciliation tetap berlaku. Koneksi nyata membutuhkan persetujuan eksternal.

## 11. Data Rights dan Pemulihan

Akses, koreksi, pencabutan consent/visibility, dan penghapusan mengikuti retensi serta audit append-only. Security event dicatat tanpa OTP atau secret. Penundaan modul tidak otomatis menghapus data, melemahkan izin, atau menutup gate. Perubahan runtime membutuhkan rencana transisi dan pemulihan terpisah.

## 12. Transisi Akun dan Jalur Lama

1. Inventaris akun `platform_admin`, membership `campus_admin`, undangan,
   resource dan consumer yang bergantung pada keduanya. Identifikasi
   universitas sasaran serta konflik secara eksplisit; akun lintas institusi
   tidak otomatis mendapat akses.
2. Tetapkan satu konteks universitas server dan pemetaan admin pada U02 serta
   U03. Pertahankan ID pelaku, versi keputusan, audit, consent dan relasi
   `institution_id`; persetujuan lama tidak ditulis ulang dengan role baru.
3. Arahkan akun berizin ke ruang Admin Universitas. Jalur persetujuan institusi
   baru dan operasi lintas institusi dipensiunkan dengan pemeriksaan server,
   bukan hanya dihilangkan dari sidebar. Jalur lama menyediakan pengalihan
   berotorisasi atau penolakan yang jelas sesuai pemetaan route.
4. Inventaris otorisasi perekrut, versi pencocokan dan modul lanjutan sebelum
   menghentikan flag admin global. Pencabutan izin serta consumer inti tetap
   dapat berjalan; penggabungan role tidak mengaktifkan gate atau memindahkan
   data institusi lain.
5. Verifikasi transisi dengan data sintetis, backup serta pemulihan sebelum
   mengubah akun atau konfigurasi aplikasi yang digunakan pengguna.
