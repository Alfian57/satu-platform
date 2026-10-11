# Business Flow SATU

## 1. Fokus dan Status Alur

Alur inti adalah kesempatan kolaborasi berbasis kemampuan sampai pengakuan kontribusi. Penjelasan ini merupakan kontrak target, bukan klaim semua sambungan runtime sudah tersedia. Requirements mengikuti [PRD](./PRD.md), fokus mengikuti [PRODUCT](../../PRODUCT.md), dan urutan pengerjaan mengikuti [ROADMAP](../implementation/ROADMAP.md).

Account, afiliasi, profil kemampuan, visibility portofolio, dan hak akses perekrut adalah state terpisah. Registrasi terbuka hanya menghasilkan akun mahasiswa. Semua operasi tenant-owned memakai institusi aktif. In-app notification canonical; WhatsApp kanal delivery sesuai tujuan dan preferensi. Pemulihan merupakan bagian alur utama.

## 2. Provisioning Institusi dan Operator

1. Admin platform meninjau serta menyetujui institusi dengan audit.
2. Operator diundang melalui WhatsApp memakai undangan sekali pakai.
3. Penerima memverifikasi nomor, menetapkan username privat dan password, lalu menerima peran terkontrol.
4. Undangan kedaluwarsa, digunakan ulang, atau salah nomor tidak memberi peran istimewa dan mempunyai pemulihan.

## 3. Aktivasi dan Kemampuan Awal Mahasiswa

1. Mahasiswa memverifikasi nomor WhatsApp, menetapkan username privat/password, serta persetujuan yang diperlukan.
2. Mahasiswa memilih kampus dan NIM. Exact match nomor terverifikasi serta NIM pada roster mengaktifkan afiliasi; mismatch masuk peninjauan.
3. Status menunggu menjelaskan apa yang masih diizinkan, tanpa mengklaim operasi profil atau akses proyek sudah terbuka.
4. Mahasiswa menyatakan keahlian, minat, dan ketersediaan. Bukti awal hanya dibagikan sesuai izin dan mempunyai sumber/batas verifikasi.
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

1. Peninjau kampus membaca versi, bukti, dan konteks sesuai standar yang disepakati.
2. Peninjau menyetujui, meminta perbaikan, atau menolak langsung. Team confirmation tidak diperlukan.
3. Keputusan tersimpan append-only dengan alasan serta versi yang benar.
4. Revisi membuat versi baru tanpa menimpa riwayat. Mahasiswa memahami tindakan berikutnya.
5. Approval membentuk atau memperbarui portofolio bersumber jelas secara idempotent.
6. Portofolio menjelaskan batas pengakuan. Approval tidak memublikasikan bukti privat atau menyatakan semua skill pemilik sudah diuji.
7. Mahasiswa memilih visibility dan dapat mencabut berbagi sesuai kontrak. Gamifikasi, perekrut, atau kredit bukan prasyarat pengakuan inti.
8. Notifikasi serta kanal penting mengikuti tujuan dan preferensi.

## 8. Tindak Lanjut Kesempatan oleh Kampus

1. Mahasiswa memilih untuk menyampaikan kebutuhan kesempatan atau dukungan; bukan ditetapkan sebagai pemalu oleh sistem.
2. Peninjau yang berwenang mengakses konteks/bukti yang diizinkan dan mencatat alasan serta tindak lanjut.
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
