# Product

## Identitas dan Fokus Produk

SATU adalah Sistem Aktivitas Talenta Universitas. Produk yang diajukan pada perlombaan adalah platform SATU, bukan sistem untuk mengelola perlombaan.

Masalah utama yang dituju adalah mahasiswa dengan kemampuan yang belum terlihat atau jaringan kolaborasi terbatas kesulitan mendapatkan kesempatan untuk berperan dan memperoleh pengakuan berbasis bukti. Ketergantungan kesempatan pada kedekatan personal atau popularitas merupakan hipotesis yang perlu divalidasi pada kampus sasaran, bukan klaim bahwa setiap kampus melakukan diskriminasi.

Tujuan SATU adalah membuka kesempatan kolaborasi berbasis kemampuan, kebutuhan proyek, dan ketersediaan, bukan popularitas atau kedekatan personal. Mahasiswa dapat menunjukkan kemampuan, menemukan peran, bergabung dengan rekan baru, bekerja, serta memperoleh pengakuan atas kontribusinya.

SATU tidak mendeteksi kepribadian atau memberi label mahasiswa sebagai pemalu, introvert, ekstrovert, atau tidak kompeten. Minimnya aktivitas bukan bukti kurang kemampuan atau kebutuhan intervensi. Kesempatan yang adil tidak berarti otomatis mengutamakan satu kepribadian atau mengurangi kesempatan mahasiswa lain.

## Alur Nilai Utama

`Tunjukkan kemampuan dan minat -> temukan peluang dan peran -> ajukan minat -> keputusan tim yang dapat dipahami -> kolaborasi nyata -> kontribusi dan bukti -> validasi kampus -> pengakuan melalui portofolio`

Portofolio adalah alat pembuktian dan pengakuan, bukan pengganti kesempatan bergabung. Profil yang terlihat tanpa kesempatan berkolaborasi belum memenuhi tujuan produk. Relasi yang dimaksud adalah hubungan kerja melalui kolaborasi, bukan jumlah pengikut, popularitas, atau daftar teman.

Mahasiswa tanpa karya terdahulu tetap mempunyai jalur masuk melalui peluang yang menerima pemula. Keahlian yang dinyatakan sendiri dibedakan dari kontribusi yang telah ditinjau. Label kontribusi terverifikasi tidak menjadi jaminan bahwa seluruh keahlian pemilik telah diuji.

Profil kemampuan T03 dapat disimpan tanpa karya, tanpa kontribusi terdahulu, dan tanpa jadwal. Minat serta tingkat keahlian berasal dari pernyataan mahasiswa. Kesiapan untuk pencocokan memerlukan keahlian dan jadwal; belum memenuhi kebutuhan itu tidak menutup penelusuran peluang bagi mahasiswa dengan afiliasi terverifikasi. Bukti awal berupa tautan HTTPS opsional yang privat bagi pemilik, bukan bukti yang telah dinilai kampus. Unggah berkas serta akses reviewer tetap melalui Kontribusi; pengaturan jangkauan portofolio tidak memublikasikan tautan bukti awal.

Peluang T04 menjelaskan tujuan melalui uraian proyek serta kebutuhan, kriteria pemilihan, dan penerimaan pemula per peran. Pemilik menyatakan penerimaan pemula secara eksplisit; data lama yang belum diisi berlabel Belum dinyatakan, bukan otomatis menerima atau menolak. Kapasitas terisi berasal dari anggota aktif, termasuk pemilik hanya jika memiliki keanggotaan aktif. Pengajuan serta undangan menunggu tidak memesan tempat. Tempat tersisa tidak menjamin pengajuan masih dibuka atau penerimaan; lifecycle, tenggat, kapasitas tim/peran, afiliasi dan Policy tetap menentukan tindakan yang tersedia.

## Batas Rilis yang Difokuskan

Pembentukan tim T06 memakai ringkasan minat, kemampuan relevan atau kebutuhan
belajar, dan ketersediaan yang sengaja diajukan mahasiswa. Tidak membuka bukti
awal profil. Pemilik dapat membaca ringkasan karya yang secara eksplisit
dibagikan untuk kampus/publik, bersumber pada kontribusi approved versi aktual,
dan konsisten dengan pemilik serta institusi. Pencabutan visibility menghentikan
pembacaan berikutnya; ketiadaan karya bukan tanda kurang kemampuan.
Pemilik menerima atau menolak dengan alasan terkait kebutuhan
peran, pemohon dapat menarik pengajuan pending dan membaca riwayat pribadi.
Keputusan memeriksa sumber terbaru; penerimaan dan kapasitas tersimpan atomik.
Keanggotaan aktif yang sah, bukan status pengajuan saja, membuka ruang kerja.
Notifikasi aplikasi diantrekan setelah commit; pengiriman eksternal dan dampak
hubungan kerja nyata tidak diklaim telah terbukti.

Keputusan fokus pada 9 Oktober 2026 menggantikan kewajiban rilis untuk menyelesaikan seluruh kapabilitas proposal. Rilis membuktikan satu alur nilai utama pada satu kampus pilot. Seluruh data tenant-owned tetap institution-scoped agar pembatasan pilot tidak menjadi hardcoded single-tenant.

Target inti rilis:

- identitas dengan username privat, password, dan verifikasi nomor WhatsApp;
- afiliasi kampus melalui exact match NIM dan nomor terverifikasi pada roster, dengan peninjauan manual sebagai pemulihan;
- profil kemampuan, minat, bukti yang diizinkan, dan ketersediaan, termasuk jalur mahasiswa tanpa portofolio;
- peluang proyek dengan kebutuhan peran, kapasitas, kriteria pemilihan, dan penerimaan pemula yang jelas;
- penemuan dan pencocokan transparan yang tersambung ke perubahan profil serta peluang aktual;
- pengajuan bergabung, keputusan beralasan, pembentukan tim, tugas, dan ruang kerja yang mendukung kolaborasi nyata;
- kontribusi individual, bukti privat, validasi langsung oleh peninjau kampus, revisi, dan portofolio dengan kendali berbagi;
- operasi kampus untuk afiliasi, validasi, serta tindak lanjut kesempatan yang diizinkan dan tidak memberi stigma;
- pengelolaan institusi dan operator oleh admin platform, notifikasi utama, pemulihan, keamanan, dan aksesibilitas;
- landing dan demonstrasi alur utama dengan data sintetis berlabel.

Pengembangan lanjutan, bukan kriteria kelulusan rilis inti:

- XP, badge, dan peringkat;
- Talent Portal, verifikasi organisasi perekrut, hak akses, dan permintaan kontak;
- pemetaan kredit dan sinkronisasi akademik;
- graf sosial serta engine dan UI analitik inklusi lanjutan.

Penundaan bukan perintah menghapus kode, riwayat, persetujuan, atau data. Peralihan navigasi, route, listener, job, dan notifikasi modul lanjutan memerlukan inventaris dependensi serta keputusan implementasi eksplisit. Menyembunyikan menu saja tidak membuktikan bahwa modul sudah dinonaktifkan dengan aman. Kontrak keamanan dan tata kelola tetap berlaku pada modul yang masih tersedia.

Transisi T02 membatasi penempatan navigasi: empat menu inti mahasiswa dan operasi afiliasi/roster/validasi kampus didahulukan; fitur lanjutan berada pada bagian terpisah. Route, consumer approval, proyeksi, scheduler, job, data, audit, serta pencabutan izin existing tetap dipertahankan. Tidak ada persetujuan mematikan background processing atau membuka gate data nyata melalui transisi ini.

## Pengguna dan Kewenangan

- Mahasiswa: registrasi terbuka; mengelola afiliasi, kemampuan, minat, ketersediaan, proyek, tim, kontribusi, portofolio, dan izin berbagi.
- Operator atau peninjau kampus: akses melalui alur terkontrol dan undangan WhatsApp; meninjau afiliasi serta bukti kontribusi dan membantu akses kesempatan sesuai kewenangan, bukan menentukan kepribadian.
- Admin platform: menyetujui institusi, mengundang operator, dan mengawasi operasi berotorisasi. Bukan pusat pengalaman mahasiswa.
- Perekrut: pengguna pengembangan lanjutan. Akses tetap memerlukan organisasi terverifikasi dan hak akses aktif jika modul digunakan.

Username hanya dipakai untuk login dan pengaturan keamanan akun. Username tidak tampil pada profil, portofolio, aktivitas publik, atau Talent Portal. SATU tidak memakai email pada target alur produk.

## Prinsip Produk

1. Kesempatan berkolaborasi adalah hasil utama, bukan sekadar profil yang tampil.
2. Penilaian berlandaskan kebutuhan peran, kemampuan yang dapat dijelaskan, serta ketersediaan, bukan popularitas, IPK, atau kedekatan personal.
3. Mahasiswa tanpa relasi atau kontribusi terdahulu tidak otomatis dianggap tidak layak.
4. Pengajuan dan keputusan harus mudah dipahami; pencocokan tidak menjamin penerimaan atau mengambil keputusan tim otomatis.
5. Kontribusi individual dan bukti lebih penting daripada skor popularitas. Pengakuan tetap sesuai batas verifikasi.
6. Izin berbagi terlihat dan dapat dicabut. Bukti privat tidak menjadi publik secara otomatis setelah validasi.
7. Analitik memberi bahan tinjauan manusia, bukan label, diagnosis, keputusan merugikan, atau kontak otomatis.
8. Rencana, data sintetis, sandbox, kemampuan runtime, dan hasil pilot dibedakan dengan jelas.

## Pencocokan dan Kesempatan

Pencocokan mendukung tepat empat dimensi: `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`. Versi skor, input, bobot, dan alasan utama harus dapat diaudit. Jumlah pengikut, popularitas, kepribadian, dan IPK bukan input.

`connectivity_opportunity` mendukung kesempatan bekerja dengan rekan baru berdasarkan metadata yang sah, tanpa mengungkapkan sinyal inklusi kepada mahasiswa atau perekrut. Riwayat yang belum tersedia menjadi keadaan data terbatas, bukan hukuman otomatis. Kebijakan untuk keadaan tanpa riwayat perlu ditetapkan dan diuji sebelum digunakan pada data nyata.

Rekomendasi perlu diperbarui melalui operasi yang jelas ketika profil, kebutuhan peran, kapasitas, atau status peluang berubah. Request GET membaca data, tidak membuat record default atau menghitung dan menyimpan rekomendasi secara tersembunyi. Penelusuran proyek tetap tersedia saat rekomendasi belum ada atau sedang diproses.

Kontrak teknis T05 memakai kebijakan berversi `opportunity-v2-neutral` untuk pembaruan dinamis. Kebutuhan dibandingkan pada peran yang masih tersedia, bukan rata-rata semua peran termasuk yang penuh. Jadwal proyek yang belum tersedia menghasilkan nilai netral dan penjelasan keterbatasan, bukan klaim overlap atau target jam buatan. Dimensi hubungan tetap netral tanpa membaca metadata kolaborasi; karya, XP, IPK, kepribadian dan jumlah relasi bukan syarat. Profil tanpa keahlian atau jadwal tetap dapat menelusuri peluang, tetapi belum menghasilkan rekomendasi personal. Versi lama tidak diubah atau dianggap memakai kebijakan baru.

Perubahan sumber memicu permintaan pembaruan setelah commit. Job membaca ulang izin, tenant dan sumber aktual; hasil serta status batch tersimpan atomik dan pekerjaan ulang tidak menggandakan hasil. Pembacaan menolak hasil dengan versi/input/lifecycle yang berubah, menyediakan keadaan diproses, gagal, kedaluwarsa atau belum dikonfigurasi serta pemulihan eksplisit. Pilihan menyembunyikan atau tidak relevan tidak dibatalkan oleh pembaruan otomatis. Konfigurasi produksi default tidak aktif sampai kebijakan bobot, privacy, data terbatas dan UAT disetujui. Implementasi serta tes sintetis bukan penutupan gate atau bukti fairness pilot.

## Kolaborasi yang Nyaman

Ruang kerja mengutamakan tugas, hasil yang diharapkan, penanggung jawab, dan
tenggat. Mahasiswa dapat memilih tanggung jawab pribadi dan mengunggah bukti
privat tanpa pesan. Frekuensi percakapan dan jumlah anggota yang sedang online
bukan ukuran kemampuan atau kontribusi. Bukti tidak otomatis menjadi klaim
individual, hasil validasi, atau publikasi portofolio. Jalur pengakuan tetap
melalui Kontribusi dan keputusan peninjau berwenang.

Database menentukan keadaan kerja. Refresh mempertahankan draft; revisi tugas
termasuk penanggung jawab mencegah penimpaan data yang berubah. Pengiriman yang
hasilnya belum pasti diperiksa melalui pembacaan terbaru, bukan retry mutasi
otomatis. Izin kerja yang hilang menyembunyikan snapshot privat lama.

## Pengakuan Individual

Kontribusi memisahkan klaim dan ringkasan karya yang dapat dibagikan dari
pernyataan, berkas bukti, serta catatan keputusan privat. Anggota satu proyek
dapat membuktikan pekerjaan berbeda. Bukti bersama perlu diterangkan
hubungannya dengan bagian pekerjaan sendiri, bukan dianggap hasil milik semua.

T08 menyimpan keputusan approved dan karya privat dalam transaksi yang sama,
dengan sumber versi yang konsisten. Pengakuan tidak bergantung pada XP,
badge atau kredit. Persetujuan tidak otomatis memublikasikan berkas, dan
jangkauan portofolio tetap pilihan pemilik. Detail individual hanya bagi
pemilik berizin dan operator kampus pada versi yang sudah dikirim, bukan
rekan tim atau draft baru yang belum diajukan. Revisi mempertahankan riwayat
dan mengganti pilihan bukti secara eksplisit. Panduan bukti teknis tidak
menggantikan standar, SLA, retensi atau persetujuan kampus yang belum disepakati.

## Operasi Kampus dan Batas Analitik

T09 menyediakan permintaan bantuan sukarela yang terpisah dari analitik
inklusi. Kebutuhan yang sengaja dikirim mempunyai notice, masa akses dan
consent per berkas. Peninjau yang ditunjuk menawarkan peran tersedia dengan
alasan; peran untuk kebutuhan pemula harus eksplisit menerima pemula.
Mahasiswa menerima, menolak atau mencabut izin, tanpa auto-contact atau
keanggotaan otomatis. Catatan tindak lanjut dan persetujuan tawaran bukan
bukti dukungan berhasil. Riwayat minimal tetap sesuai tujuan retensi yang
harus disetujui, bukan dihapus diam-diam.

Ringkasan T09 adalah snapshot operasional restricted, bukan evaluasi impact.
Denominator memasukkan mahasiswa terverifikasi saat pembacaan meskipun
belum punya karya, XP atau riwayat tim. Pengajuan, keputusan, event bergabung,
audit submit dan pengakuan sumber konsisten dibedakan. Peluang dilihat dan
hubungan kerja baru tetap belum dapat dihitung bila sumber/definisi belum
memadai. Agregat membutuhkan persetujuan evaluasi dan minimum kelompok khusus,
tanpa meminjam aturan gamifikasi. Default bantuan/evaluasi tertutup;
persetujuan data nyata, retensi penyimpanan, reviewer dan UAT tetap gate manusia.

Operasi inti membantu peninjau melihat bukti yang diizinkan, mengambil keputusan validasi yang beralasan, dan menindaklanjuti kebutuhan kesempatan yang dipilih mahasiswa. Pencatatan kebutuhan dukungan tidak otomatis mengirim pesan, membuka kontak, atau memaksa mahasiswa bergabung.

Social Network Analysis merupakan pengembangan lanjutan untuk menilai kesempatan kolaborasi, bukan kondisi psikologis. SATU tidak menganalisis isi pesan untuk sentiment, kepribadian, atau diagnosis. Sinyal inklusi hanya tersedia bagi peninjau berwenang, tidak bagi mahasiswa, rekan tim, atau perekrut, serta tidak menjadi input peringkat.

Engine dan UI inklusi tetap di balik feature flag. Data sintetis tidak menggantikan persetujuan aktivasi data nyata. DPIA, dasar pemrosesan, retensi, pemberitahuan, kontrol akses, dan prosedur tinjauan manusia tetap merupakan gate yang harus diselesaikan pemiliknya.

## Kontrak Modul Lanjutan yang Dipertahankan

XP hanya berasal dari kontribusi yang disetujui dan ledger append-only. Badge memakai aturan berversi. Kontrak peringkat kelompok, individual opt-in, semester, rata-rata verified XP, minimum kelompok lima, dan shared rank tetap berlaku jika gamifikasi digunakan. Sinyal inklusi dan `connectivity_opportunity` tidak menjadi input skor peringkat.

Talent Portal tetap memakai proyeksi yang diizinkan mahasiswa serta hak akses internal. Bukti privat, isi diskusi, NIM, username, dan sinyal inklusi tidak boleh menjadi proyeksi perekrut. Billing provider, harga produksi, dan pembayaran tidak termasuk rilis inti.

Integrasi akademik tetap memakai contract dan sandbox adapter. Koneksi API kampus nyata memerlukan persetujuan eksternal. Versi pemetaan, riwayat sinkronisasi, idempotensi, dan audit tidak boleh dihapus karena perubahan fokus.

## Notifikasi dan Arsitektur

Notification center di dalam aplikasi adalah sumber notifikasi canonical. WhatsApp digunakan untuk OTP, undangan, tenggat atau revisi penting, serta peristiwa keamanan sesuai tujuan dan preferensi. Permintaan kontak tetap mengikuti persetujuan pada modul lanjutan.

Fonnte adalah provider awal di balik adapter milik aplikasi, queue, outbox, callback, retry, dan audit. Token tidak masuk browser atau log. Database merupakan sumber kebenaran; Reverb mengirim delta berotorisasi setelah commit.

## Demo dan Pembuktian Teknis T10

Landing dan tur mengikuti perjalanan kesempatan sampai pengakuan. Demo publik
mengikuti mahasiswa tanpa karya terdahulu, termasuk kapasitas penuh dan revisi.
Seluruh keadaan berlabel Data synthetic, hanya simulasi lokal dan dapat direset
tanpa command bisnis. Peta existing menjadi pelengkap, bukan analitik atau
laporan manfaat.

Dataset pengujian T10 hanya berjalan pada SQLite di memori dengan manifest
eksplisit. Ia menyiapkan aktor dan bekal awal, bukan menanam tim, tugas,
kontribusi atau karya selesai. Suite menjalankan Actions existing sampai
berbagi dan pencabutan, antrean notifikasi serta pemulihan snapshot uji.
Tidak mengubah database pengguna atau mengaktifkan gate data nyata.
Pengujian teknis bukan studi usability, final UAT, concurrency MySQL atau
drill backup/restore produksi. Pilot dan evaluasi manfaat tetap menunggu
persetujuan manusia serta baseline yang disepakati.

## Bukti Keberhasilan dan Kebenaran Runtime

Hasil utama yang akan diuji adalah mahasiswa yang sebelumnya belum berkolaborasi mendapat kesempatan bergabung, bekerja dengan rekan baru, serta memperoleh pengakuan atas kontribusi individual. Definisi populasi, periode, denominator, sumber data, dan keterbatasan harus dinyatakan sebelum pengukuran.

Tidak ada klaim hasil pilot, penurunan ketimpangan, peningkatan relasi, pelanggan, harga, testimoni, atau benchmark yang telah terbukti. Data sintetis mendemonstrasikan mekanisme, bukan dampak nyata atau bukti diskriminasi kampus.

Kode dan surface sejumlah modul sudah tersedia, tetapi keberadaan halaman tidak membuktikan seluruh alur terhubung. Pembaruan dokumen ini tidak mengubah runtime atau mengklaim seluruh target telah diimplementasikan. Status pelaksanaan mengikuti issue dan bukti verifikasi, bukan daftar target dalam dokumen.

Proposal pada `docs/reference/proposal_lomba.md` tetap input historis. Requirements terinci berada di [PRD](docs/product/PRD.md), alur pada [Business Flow](docs/product/BUSINESS_FLOW.md), dan tahapan pada [Roadmap](docs/implementation/ROADMAP.md).

## Aksesibilitas dan Identitas Visual

Semua surface menargetkan WCAG 2.2 AA: keyboard, fokus terlihat, reduced motion, status semantik, dan reflow dari mobile ke layar besar. Identitas Buku Besar Kolaborasi dan token SATU tetap mengikuti [DESIGN.md](DESIGN.md).

UI memprioritaskan pekerjaan yang sedang berjalan, kesempatan yang relevan, dan tindakan berikutnya. Tur atau pop-up adalah bantuan pilihan, bukan syarat memahami alur. Tidak ada label kepribadian, stigma, skor tersembunyi, atau penilaian nilai manusia.
