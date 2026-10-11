# Product Requirements Document: SATU

## 1. Ringkasan dan Status

SATU berfokus pada kesempatan kolaborasi berbasis kemampuan bagi mahasiswa yang belum terlihat atau memiliki jaringan terbatas. Rilis inti membuktikan satu perjalanan pada satu kampus: menunjukkan kemampuan dan minat, menemukan peran, bergabung dengan rekan baru, bekerja, membuktikan kontribusi individual, dan memperoleh pengakuan kampus.

Portofolio merupakan alat pembuktian. Profil yang tampil tanpa kesempatan berkolaborasi belum menjadi hasil utama. Produk tidak mengidentifikasi kepribadian atau menjanjikan penerimaan otomatis.

Dokumen ini mencatat target yang disetujui pada 9 Oktober 2026, bukan daftar kemampuan yang seluruhnya sudah berjalan. Status pelaksanaan dan acceptance criteria per pekerjaan mengikuti GitHub issues serta bukti verifikasi. Tidak ada perubahan issue, milestone, atau runtime hanya karena dokumen ini diperbarui.

Sumber kebenaran: [PRODUCT.md](../../PRODUCT.md). Alur terinci: [BUSINESS_FLOW.md](./BUSINESS_FLOW.md). Tahapan dan dependensi: [ROADMAP.md](../implementation/ROADMAP.md).

## 2. Masalah Utama dan Hipotesis

Mahasiswa dengan kemampuan yang belum terlihat atau jaringan terbatas kesulitan memperoleh kesempatan berperan dan pengakuan berbasis bukti.

Hipotesis yang perlu divalidasi:

- Informasi peluang dan pemilihan anggota dapat bergantung pada lingkaran pertemanan atau visibilitas, bukan hanya kebutuhan peran.
- Mahasiswa belum mempunyai cara yang nyaman untuk menunjukkan kemampuan dan mengajukan minat tanpa harus mempromosikan diri secara intensif.
- Kampus memerlukan bukti kontribusi individual dan alasan keputusan, bukan kesan popularitas.
- Daftar profil atau rekomendasi saja belum cukup jika tidak menghasilkan pengajuan, keputusan, serta kolaborasi nyata.

Hipotesis tersebut bukan klaim bahwa semua kampus melakukan diskriminasi. Pemalu, introvert, belum dikenal, dan jarang berkolaborasi bukan kategori yang setara dan tidak digunakan sebagai label, skor, atau dasar kelayakan pengguna.

## 3. Pengguna dan Pekerjaan yang Dibantu

### Mahasiswa

Menunjukkan kemampuan, minat, serta ketersediaan; menemukan peluang yang dapat dimasuki; mengajukan peran; memahami keputusan; bekerja dengan rekan baru; membuktikan kontribusi; serta mengendalikan berbagi portofolio. Mahasiswa tanpa karya atau riwayat kolaborasi tetap memiliki pintu masuk.

### Pemilik proyek atau pengelola tim

Menyatakan tujuan, kebutuhan peran, kapasitas, kriteria, dan tingkat kesiapan yang diperlukan; meninjau pengajuan berdasarkan kebutuhan aktual; mencatat alasan; membagi tugas; serta mendukung kontribusi individual.

### Operator atau peninjau kampus

Meninjau afiliasi dan kontribusi, memahami batas bukti, melihat pengakuan yang diizinkan, dan menindaklanjuti kebutuhan kesempatan yang dipilih mahasiswa. Tidak memberi label kepribadian atau melakukan eskalasi otomatis.

### Admin platform

Mengelola institusi dan undangan operator dengan otorisasi serta audit. Menjaga kelangsungan alur inti tanpa mengambil alih keputusan tim atau validasi kampus.

### Perekrut

Peran pengembangan lanjutan. Tidak menjadi dependensi untuk mahasiswa mendapatkan kesempatan kolaborasi pada rilis inti.

## 4. Cakupan dan Tujuan Rilis

### Inti

- Identitas, afiliasi, profil kemampuan dan minat, ketersediaan, serta notifikasi utama.
- Peluang, peran, pencocokan transparan, pengajuan dan keputusan, tim, serta ruang kerja dasar.
- Kontribusi individual, bukti, validasi, revisi, dan portofolio yang dapat dibagikan sesuai izin.
- Operasi kampus, pengelolaan akses platform, pengukuran hasil yang diizinkan, landing, dan demonstrasi inti.

### Pengembangan lanjutan

Gamifikasi, Talent Portal, pemetaan kredit dan sinkronisasi akademik, serta graf dan engine inklusi lanjutan. FR-06, FR-08, FR-09, dan bagian inklusi lanjutan FR-07 tetap menjadi kontrak saat modul digunakan, tetapi bukan acceptance rilis inti. Penundaan tidak menghapus data atau menutup gate.

Tujuan rilis adalah membuktikan alur kesempatan sampai pengakuan, mempertahankan batas izin, dan menyiapkan evaluasi manfaat. Rilis tidak mensyaratkan seluruh milestone historis M0 sampai M9 selesai jika bagian yang ditunda tidak menjadi dependensi inti.

## 5. Functional Requirements

### FR-01 Identitas dan afiliasi (inti)

- Registrasi terbuka hanya membuat akun mahasiswa. Username privat dan password digunakan untuk masuk; username tidak menjadi identitas publik.
- Nomor WhatsApp terverifikasi melalui OTP dengan expiry, rate limit, batas percobaan, replay protection, serta pemulihan akun.
- Afiliasi memakai exact match NIM dan nomor terverifikasi pada roster institusi. Mismatch, ambiguity, atau roster belum tersedia mempunyai jalur peninjauan dan status yang jelas.
- Operator diprovisikan melalui undangan terkontrol, bukan registrasi terbuka.
- Afiliasi, akun, profil, dan izin berbagi tetap state terpisah. Status menunggu tidak mengklaim profil telah disimpan jika operasi tersebut belum diizinkan server.

### FR-02 Profil kemampuan dan notifikasi (inti)

- Profil memuat nama tampilan, program studi, minat, keahlian yang dinyatakan, tingkat kesiapan, dan ketersediaan sesuai kontrak.
- Bukti kemampuan yang diizinkan ditampilkan dengan sumber dan batas verifikasi. Pernyataan sendiri tidak diberi label tervalidasi hanya karena telah diisi.
- Mahasiswa tanpa bukti terdahulu dapat menunjukkan minat dan mencari peran pemula. Riwayat kontribusi, jumlah relasi, atau popularitas bukan syarat minimum aktivasi.
- Izin akses bukti profil, validasi tautan/berkas, dan perlindungan data ditetapkan sebelum surface baru diimplementasikan.
- Kontrak T03: Profil kemampuan dapat dibuat atau diperbarui tanpa bukti dan tanpa jadwal; data tersimpan berbeda dari siap untuk pencocokan. Minat tidak dianggap keahlian yang telah diuji. Bukti awal hanya tautan HTTPS privat bagi pemilik, tanpa preview/fetch server atau publikasi otomatis. Sumber kontribusi disetujui dibaca dari keputusan tersimpan, bukan label atau ID kiriman mahasiswa. Unggah berkas dan peninjauan kampus tetap melalui alur Kontribusi existing.
- Notification center adalah sumber canonical untuk pengajuan, keputusan, tugas, validasi, dan revisi. Kanal WhatsApp mengikuti tujuan serta preferensi yang diizinkan.

### FR-03 Peluang, pencocokan, dan tim (inti)

- Proyek menyatakan tujuan, kebutuhan peran, keahlian, kapasitas, kriteria pemilihan, tenggat yang relevan, serta apakah peran menerima pemula.
- Kontrak T04: penerimaan pemula per peran bernilai ya, tidak, atau belum dinyatakan. Kriteria pemilihan berupa penjelasan pemilik, bukan skor atau verifikasi otomatis. Filter pemula serta tempat tersedia tersimpan pada URL dan diperiksa server dalam tenant yang diizinkan; saat digabung, keduanya mengacu pada peran yang sama. Total, anggota aktif, dan tempat tersisa dibedakan tanpa membocorkan daftar anggota. Peran yang sudah dirujuk tim/pengajuan/undangan tidak dihapus atau dibuat ulang ketika mengedit informasi. Kapasitas tidak dapat dikurangi di bawah anggota aktif.
- Peluang yang dibuka untuk mahasiswa terverifikasi dalam kampus dapat ditemukan tanpa undangan personal. Proyek privat tetap mengikuti izin dan tidak dibocorkan.
- Penelusuran memiliki filter pada URL. Pengguna tetap dapat menelusuri ketika rekomendasi kosong, sedang dihitung, atau stale.
- Pencocokan memakai tepat empat dimensi yang didukung: `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`. Versi, alasan, data terbatas, dan feedback tersedia tanpa membuka sinyal inklusi.
- Perubahan profil, kebutuhan peran, kapasitas, dan lifecycle memicu invalidasi atau pembaruan rekomendasi melalui command/event/job yang eksplisit. GET tidak membuat record default atau menyimpan hasil hitung.
- Kontrak T05: kebijakan `opportunity-v2-neutral` hanya pada versi baru yang dibuat eksplisit oleh admin berwenang. Empat dimensi dipertahankan; konektivitas netral tanpa membaca metadata jaringan, dan waktu netral jika proyek belum menyimpan kebutuhan waktu. Bandingkan peran tersedia; revalidasi sumber, tenant, kapasitas dan versi ketika job berjalan maupun hasil dibaca. Antrean persisten dapat direkonsiliasi, retry idempotent, kegagalan tidak mengklaim hasil baru. Feedback menyembunyikan/tidak relevan tetap dihormati antar-batch. Tidak ada syarat karya atau skor kepribadian. Profil belum siap memakai penelusuran manual. Default production terkunci hingga gate disetujui.
- Kasus tanpa riwayat dan tanpa portofolio mempunyai kebijakan yang jelas, tidak otomatis mendapat kelayakan terendah. Kecocokan dasar tetap mengikuti kebutuhan nyata; hasil tidak menjamin penerimaan.
- Pengajuan cukup menyatakan peran, minat, kemampuan yang relevan, dan ketersediaan. Tidak mewajibkan kemampuan berbicara publik, kepribadian, atau jumlah teman.
- Keputusan pengajuan memiliki alasan berdasarkan kriteria peran. Catatan internal dan data pelamar lain tidak dibagikan kepada pemohon.
- Pembentukan tim dan perubahan kapasitas atomik, institution-scoped, serta diautorisasi Policy. Permintaan ganda, kapasitas penuh, pembatalan, dan keputusan stale memiliki pemulihan.
- Kontrak T06: tiga jawaban singkat yang sengaja dibagikan menjadi ringkasan pengajuan, bukan promosi diri atau publikasi bukti profil. Penerimaan dan penolakan wajib beralasan; revisi sumber diperiksa di bawah lock proyek sebelum keputusan. Penarikan hanya oleh pemohon dan hanya pending. Riwayat keputusan pribadi memiliki pagination, alasan legacy yang kosong tidak direkayasa, dan membership aktif tetap menjadi syarat workspace. Notifikasi database diantrekan setelah commit, tidak menjanjikan delivery WhatsApp atau penerimaan otomatis.

### FR-04 Kolaborasi dan ruang kerja (inti)

- Tim mempunyai tugas, penanggung jawab, tenggat, diskusi, dan bukti privat yang cukup untuk bekerja bersama.
- Anggota memahami perannya dan dapat menemukan pekerjaan berikutnya tanpa harus aktif dalam percakapan publik.
- Database merupakan sumber kebenaran. Reverb/Echo mengirim delta berotorisasi setelah commit; reconnect melakukan reconciliation.
- Drag hanya peningkatan kenyamanan. Keyboard dan command tombol tetap menyelesaikan tugas.
- Isi percakapan tidak dianalisis untuk kepribadian, sentiment, kondisi psikologis, atau diagnosis.
- Kontrak T07: pilihan tugas pribadi dan belum ditugaskan berlaku pada query server, termasuk pagination. Arahan Beranda membuka tugas aktual. Bukti privat dapat diunggah tanpa pesan; relasi tugas/bukti individual ditentukan saat penyusunan Kontribusi, bukan diasumsikan saat unggah. Revisi tugas mencakup metadata serta assignment dan diperiksa di bawah lock. Refresh tidak menimpa draft; hasil mutasi belum pasti diperiksa lewat GET. Izin dicabut menyembunyikan snapshot privat lama. Pemulihan tersedia tanpa drag, percakapan publik, atau animasi.

### FR-05 Kontribusi dan pengakuan (inti)

- Setiap kontribusi menyatakan pekerjaan individual, tugas/peran, klaim, ringkasan, dan bukti. Hasil tim tidak otomatis menjadi klaim identik seluruh anggota.
- Campus reviewer dapat menyetujui, meminta revisi, atau menolak langsung. Team confirmation tidak diwajibkan.
- Standar bukti dan batas keputusan dijelaskan. Label terverifikasi merujuk sumber dan keputusan kontribusi, bukan jaminan semua skill pemilik atau kualitas absolut karya.
- Riwayat versi dan keputusan append-only; keputusan stale dan ganda ditolak secara aman.
- Kontribusi disetujui dapat menghasilkan portofolio bersumber jelas. Pembuatan portofolio tidak otomatis memublikasikan bukti privat.
- Pemilik mengendalikan visibility dan pencabutan berbagi. Persetujuan perekrut tetap terpisah pada modul lanjutan.
- Waktu atau SLA validasi tidak dijanjikan sebelum disepakati operator. Revisi memberikan langkah berikutnya yang dapat dipahami.

- Kontrak T08: klaim dan ringkasan individual menghasilkan karya privat atomik bersama keputusan approved. Revisi mengganti pilihan bukti tanpa menghapus riwayat. Submit, revisi dan keputusan memeriksa revisi aktual, termasuk ketersediaan bukti pada versi sama. Detail privat terbatas pemilik/operator; operator tidak membaca draft atau unggahan tanpa pengajuan. Panduan teknis tidak menutup gate standar kampus/SLA. Hasil jaringan belum pasti diperiksa melalui GET, bukan pengiriman ulang otomatis.

### FR-06 Gamifikasi (lanjutan)

- XP, badge, dan peringkat bukan syarat bergabung, pemilihan anggota, atau pengakuan kontribusi dalam alur inti.
- Jika modul digunakan, XP hanya dari kontribusi disetujui dengan sumber idempotent dan ledger append-only; badge memiliki aturan berversi.
- Kontrak kelompok default, individual opt-in, semester, average verified XP, minimum kelompok lima, dan shared rank tetap berlaku.
- Sinyal inklusi dan `connectivity_opportunity` tidak menjadi input peringkat. Penundaan tidak menghapus ledger atau consent.

### FR-07 Operasi kampus dan batas inklusi (inti terbatas, analitik lanjutan)

- Kontrak teknis T09: kebutuhan dipilih mahasiswa dengan consent eksplisit dan notice versi aktual. Kunci command unik mencegah pengajuan ganda; keputusan memerlukan revisi sumber. Peninjau yang ditunjuk menawarkan peran tersedia dalam tenant yang sama dengan alasan. Kebutuhan pemula hanya ditawarkan peran yang eksplisit menerima pemula. Penerimaan tawaran bukan pengajuan tim atau keanggotaan. Catatan manusia tetap berlabel catatan, bukan achieved. Consent dicabut atau masa akses berakhir menghentikan pembacaan kampus berikutnya; riwayat pemilik serta pencabutan tetap tersedia meski gate dimatikan atau afiliasi ditangguhkan. Tidak menyalin bukti awal profil, pesan atau kontak.

- Operasi inti meliputi roster, antrean afiliasi, antrean validasi, bukti yang diizinkan, dan ringkasan perjalanan kesempatan.
- Mahasiswa dapat memilih untuk menyampaikan kebutuhan kesempatan atau dukungan. Peninjau yang berwenang dapat mencatat tindak lanjut dan menghubungkannya dengan peluang yang relevan; pemilik tetap memilih untuk mengajukan atau bergabung.
- Tindak lanjut membutuhkan izin, tujuan, alasan, dan audit yang jelas. Tidak ada auto-contact, pemaksaan bergabung, diagnosis, atau keputusan merugikan.
- Penggunaan indikator jaringan atau sinyal terbatas untuk tinjauan tetap memerlukan tata kelola. Ketiadaan aktivitas bukan label kepribadian atau ketidakmampuan.
- Graf SNA dan engine inklusi lanjutan tetap di balik feature flag. Data nyata memerlukan DPIA, dasar pemrosesan, retensi, pemberitahuan, kontrol akses, serta prosedur manusia yang disetujui.
- Sinyal terbatas tidak ditampilkan kepada mahasiswa, rekan tim, atau perekrut. Data sintetis tidak melewati gate menjadi pemrosesan nyata.

### FR-08 Talent Portal (lanjutan)

- Organisasi serta membership perekrut diverifikasi dan membutuhkan hak akses internal aktif.
- Search hanya memakai proyeksi yang diizinkan mahasiswa. Bukti privat, pesan, username, NIM, dan sinyal inklusi tidak ikut diproyeksikan.
- Permintaan kontak dan handoff membutuhkan persetujuan mahasiswa. Pencabutan visibility menghentikan exposure berikutnya sesuai kontrak.
- Tidak ada harga, billing provider, atau pembayaran sebagai dependensi rilis inti.

### FR-09 Integrasi akademik (lanjutan)

- Provider berada di balik contract; sandbox tidak diklaim sebagai pengiriman nyata.
- Pemetaan kredit berversi, sync idempotent, retry, failure review, dan audit tetap berlaku jika modul digunakan.
- Koneksi nyata serta kebijakan kredit memerlukan keputusan eksternal. Modul tidak menjadi syarat kontribusi diakui atau peluang ditemukan pada rilis inti.

### FR-10 Landing dan demo utama (inti)

- Kontrak T10: demo publik lokal delapan tahap dimulai tanpa karya, menyediakan skenario penuh/revisi dan Reset tanpa POST atau penyimpanan akun. Kapasitas penuh berhenti sebelum ruang kerja; revisi tidak menghasilkan karya sampai ada persetujuan versi baru. Peta/tabel menjadi pelengkap. Suite actual Actions memakai dataset awal terisolasi yang menolak database berisi data dan dapat diulang dari memori kosong. Simulasi UI, tes operasi, dan hasil pilot dibedakan. UAT, fairness, concurrency MySQL, provider nyata dan recovery produksi tidak dianggap lulus karena suite SQLite.

- Landing menjelaskan satu masalah, alur kesempatan sampai pengakuan, dan batas produk dalam bahasa Indonesia.
- Demo mengikuti satu mahasiswa yang awalnya belum memiliki riwayat kolaborasi, menemukan peran, bekerja dengan rekan baru, serta memperoleh pengakuan berbasis bukti.
- Seluruh data contoh berlabel Data synthetic dan dapat direset. Demo tidak diklaim sebagai hasil pilot atau bukti diskriminasi.
- Tidak ada pelanggan, harga, testimoni, benchmark, atau klaim dampak yang direkayasa.
- Maskot, animasi, serta tur mendukung pemahaman dan dapat dikurangi; bukan syarat menyelesaikan alur.

### FR-11 Arahan kerja dan kenyamanan (inti)

- Beranda memberi satu tindakan utama berdasarkan keadaan aktual: pemulihan akses, revisi/pekerjaan berjalan, pengajuan yang menunggu, atau menemukan peluang ketika belum ada pekerjaan.
- Rekomendasi baru tidak selalu mengalahkan tugas aktif atau revisi yang perlu ditindaklanjuti.
- Navigasi mahasiswa berpusat pada Beranda, Proyek, Kontribusi, dan Portofolio; notifikasi dan akun tetap dapat diakses. Proyek membedakan peluang baru dan pekerjaan saya.
- Operator berfokus pada kesempatan yang perlu ditindaklanjuti, afiliasi, serta validasi. UI tidak menyajikan daftar mahasiswa berdasarkan kepribadian.
- Tur pilihan, label, empty state, dan bantuan menjelaskan fungsi tanpa pop-up wajib berulang. Seluruh state relevan mengikuti kontrak UX bersama.

### FR-12 Pengukuran hasil dan pembuktian (inti)

- Kontrak teknis T09 menyediakan snapshot operasional restricted dengan pengguna unik terverifikasi saat pembacaan sebagai denominator, bukan E pada T0 atau definisi gamifikasi. Indikator sumber aktual tidak membentuk funnel berurutan. Pengiriman kontribusi memakai audit submit, bukan updated_at; pengakuan memerlukan versi/review/karya konsisten. Sumber view dan hubungan kerja baru yang belum lengkap ditandai unavailable, bukan nol. Minimum kelompok kecil dan persetujuan evaluasi wajib eksplisit, tanpa default rekaan. Evaluasi pilot, consent/dasar pemrosesan, snapshot populasi awal, periode, baseline dan target tetap memerlukan persetujuan manusia menurut audit alur.

- Ukur perjalanan dari profil siap, peluang dilihat, pengajuan, keputusan, bergabung, hubungan kerja baru, kontribusi diajukan, hingga pengakuan.
- Peluang dilihat, rekomendasi dibuat, dan jumlah profil bukan bukti bahwa kolaborasi telah terjadi.
- Definisi peserta, denominator, periode, sumber, kualitas data, dan duplikasi ditentukan sebelum pengumpulan. Tidak mensyaratkan kontribusi disetujui untuk memasukkan mahasiswa baru dalam populasi evaluasi.
- Hubungan kerja baru dihitung dari partisipasi tim yang sah dalam periode yang ditetapkan, bukan isi pesan. Riwayat di luar SATU yang tidak diketahui dinyatakan sebagai keterbatasan.
- Metrik agregat dan studi pengguna mengikuti izin, retensi, serta perlindungan kelompok kecil. Tidak memublikasikan identitas atau status jaringan terbatas.
- Baseline, target pilot, dan ambang kelulusan manfaat disepakati pemilik produk dan kampus setelah validasi awal. Angka belum ditentukan tidak diisi asumsi.
- Audit alur dan uji usability dibedakan dari bukti dampak nyata. Hasil sintetis tidak dipakai untuk klaim peningkatan kesempatan atau keadilan.

Rancangan awal populasi, indikator, skenario, sumber, dan keterbatasan tersedia pada [Audit Alur Kesempatan Kolaborasi](./COLLABORATION_AUDIT.md). Definisi tersebut belum mengaktifkan pengumpulan data atau menggantikan persetujuan target pilot.

## 6. Persyaratan Kualitas

Perilaku dan state mengikuti [Screen Inventory](../ux/SCREEN_INVENTORY.md), [Content dan Accessibility](../ux/CONTENT_ACCESSIBILITY.md), serta [Loading States](../ux/LOADING_STATES.md). Dokumen UX surface dan kontrak engineering yang relevan harus diselaraskan sebelum implementasi tahap yang mengubah perilaku atau data.

- WCAG 2.2 AA, keyboard, visible focus, reduced motion, serta reflow mulai 320px sampai desktop besar.
- Empty, loading, processing, success, validation, network/HTTP error, forbidden, stale, reconnect, overflow, dan destructive state sesuai kebutuhan surface.
- Tenant isolation pada query, Policy, job, cache, storage, export, serta broadcast. Proyeksi sensitif memakai allowlist dan tes negatif.
- Database MySQL sebagai target produksi; SQLite hanya untuk tes ringan yang kompatibel.
- Job retryable, idempotent, serta dapat direkonsiliasi. GET tetap read-only.
- Tidak menambah dependency atau menghapus struktur data modul lanjutan tanpa keputusan implementasi.
- Identitas visual mengikuti [DESIGN.md](../../DESIGN.md), bukan tema baru per halaman.

## 7. Acceptance Rilis Inti

- Perjalanan pengguna baru dapat diselesaikan dari afiliasi sampai peluang dan tim tanpa wajib memiliki relasi atau portofolio terdahulu.
- Peluang menerima pemula benar-benar dapat ditemukan dan diajukan; kriteria serta alasan keputusan tidak memakai popularitas, kepribadian, atau IPK.
- Rekomendasi untuk perubahan data pengguna aktual mempunyai pemicu dan hasil yang teruji, bukan hanya record seeder.
- Tugas, bukti individual, pengiriman, keputusan, revisi, portofolio, dan izin berbagi terhubung dengan sumber yang konsisten.
- Operasi kampus menghasilkan tindak lanjut yang dapat dipahami dan diizinkan, bukan sekadar daftar profil atau graf.
- Surface lanjutan tidak menjadi hambatan alur inti; rencana transisi tidak menghapus data, consent, audit, atau pemulihan.
- Alur kritis lulus pada mobile dan desktop, termasuk akses ditolak, konflik, pemrosesan, jaringan gagal, dan reconnect.
- Security, privacy, cross-tenant, aksesibilitas, reliability, serta recovery lulus sesuai kontrak.
- Demo sintetis berlabel dan dapat direset; uji pengguna nyata hanya setelah gate terkait selesai.
- Produk tidak mengklaim manfaat pilot sebelum evaluasi dengan definisi metrik dan keterbatasan yang disepakati.
- Final UAT dan persetujuan visual tersedia. Gate modul lanjutan tidak dianggap selesai karena ditunda.

## 8. Non-goals

- Menentukan kepribadian, mengelompokkan introvert/ekstrovert, menganalisis pesan untuk diagnosis, atau memaksa mahasiswa bersosialisasi.
- Menggantikan pemilihan manusia dengan penerimaan otomatis atau menjamin kesempatan bagi setiap pengajuan.
- Popularitas, jumlah pengikut, IPK, kepribadian, atau skor inklusi sebagai penentu kelayakan.
- Menjadi media sosial umum, sistem nilai akademik, atau sistem pengelolaan perlombaan.
- Menyelesaikan modul lanjutan, rollout multi-kampus, billing, pricing, atau koneksi API nyata sebagai prasyarat rilis inti.
- Menghapus implementasi, riwayat, consent, atau data lama melalui perubahan dokumen.

## 9. Gates dan Keputusan yang Masih Dibutuhkan

- Institusi pilot, format roster, reviewer, standar bukti, jalur pemula, serta dukungan operasional.
- Validasi masalah, baseline, definisi hubungan kerja baru, populasi evaluasi, dan target manfaat.
- Kebijakan pencocokan tanpa riwayat, versi bobot, kecukupan data, dan peninjauan fairness.
- Dasar pemrosesan, pemberitahuan, retensi, akses bukti, tindak lanjut kesempatan, data rights, serta DPIA sesuai tujuan data.
- Persetujuan visual dan UAT; rencana aman pembatasan modul lanjutan.
- Gate analitik inklusi, perekrut, gamifikasi, dan integrasi nyata tetap terbuka sesuai [DECISIONS.md](../governance/DECISIONS.md).

Gate hanya diselesaikan pemilik yang berwenang melalui keputusan eksplisit. Penundaan modul bukan persetujuan pemrosesan nyata.

## 10. Traceability Requirement dan Tahap

ID FR-01 sampai FR-10 dipertahankan agar referensi lama tidak hilang. Status inti atau lanjutan pada dokumen ini mengatur prioritas target, bukan mengubah status issue.

| Requirement | Hasil yang diperiksa                                   | Tahap implementasi |
| ----------- | ------------------------------------------------------ | ------------------ |
| FR-01       | Akun, afiliasi, dan akses operator                     | T03, T10           |
| FR-02       | Kemampuan, bukti awal, ketersediaan, dan notifikasi    | T03, T06, T07      |
| FR-03       | Peluang, rekomendasi dinamis, dan pembentukan tim      | T04, T05, T06      |
| FR-04       | Kolaborasi nyata dan pemulihan workspace               | T07, T10           |
| FR-05       | Bukti individual, revisi, dan pengakuan                | T08, T10           |
| FR-06       | Penundaan gamifikasi yang tidak merusak alur inti      | T02                |
| FR-07       | Operasi kampus dan batas tinjauan kesempatan           | T09, T10           |
| FR-08       | Penundaan Talent Portal tanpa menghapus data atau izin | T02                |
| FR-09       | Penundaan integrasi tanpa merusak riwayat              | T02                |
| FR-10       | Landing serta demo perjalanan inti                     | T10                |
| FR-11       | Arahan pekerjaan dan navigasi yang fokus               | T02, T06, T07, T08 |
| FR-12       | Definisi metrik dan evaluasi manfaat                   | T01, T09, T10      |

Rincian keluaran, dependensi, dan kriteria selesai setiap tahap berada pada [ROADMAP.md](../implementation/ROADMAP.md#tahapan-implementasi-fokus).
