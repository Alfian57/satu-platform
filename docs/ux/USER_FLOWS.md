# User Flows SATU

## Pengenalan dari Landing Publik

Navbar dan footer menampilkan simbol logo konsep kedua beserta nama SATU.
Tautan identitas pada navbar tetap kembali ke awal halaman dan memiliki fokus
keyboard. Simbol yang sama dipakai auth, sidebar seluruh role, portofolio
publik, serta favicon. Pergantian identitas bukan langkah alur baru dan tidak
mengubah tujuan tautan atau kewenangan pengguna.

Pengunjung membaca nilai SATU pada hero, memilih tahap perjalanan untuk
memahami konteksnya, melihat pratinjau baca-saja berlabel Data synthetic,
kemudian mengikuti demo perjalanan mahasiswa tanpa karya terdahulu. Graf dan tabel hubungan tersedia sebagai pelengkap, bukan perjalanan utama. Pilihan peran menjelaskan pekerjaan
serta batas akses, bukan mengubah jenis akun registrasi. Bagian privasi
membedakan portofolio yang diizinkan dari bukti dan diskusi privat.

Sapa aku membuka sapaan maskot yang tidak memiliki batas waktu. Pengunjung
dapat memilih Lihat cara kerja atau menutup sapaan. Tidak ada navigasi otomatis
atau overlay yang menutupi aksi utama. Menu mobile adalah disclosure navigasi,
bukan modal. Tab memiliki kontrol panah, Home, dan End; tahap sebelumnya dan
selanjutnya hanya mengganti penjelasan lokal. Pengunjung baru menuju registrasi
mahasiswa, sementara akun masuk menuju dashboard melalui route yang sama.
Graf memiliki loading, error, coba lagi, filter, reset, dan tabel alternatif.
Reduced motion mempertahankan isi serta tindakan tanpa entrance atau tilt.

Di sekitar maskot, kartu Temukan proyek, Berkarya bersama, dan Susun portofolio
membuka penjelasan konsep di area sapaan yang sama. Pilihan tidak mengubah
akun, mengirim permintaan backend, atau menggulir halaman otomatis. Pengunjung
dapat mengikuti tautan section secara eksplisit atau menutup penjelasan untuk
kembali ke kartu pemicu. Kartu terpilih memakai teks Dipilih dan aria-pressed.
Halo, orbit, serta lembar arsip bersifat dekoratif. Penjelasan berbentuk balon
percakapan berlabel Pesan dari maskot. Desktop menempatkannya di lajur kiri
gambar burung dalam panggung yang sama, sejajar tubuh burung. Pada mobile,
balon muncul langsung setelah burung dan sebelum kartu portofolio. Ekor balon
mengarah ke maskot dan tidak menjadi kontrol. Penjelasan bukan chat, pesan
akun, atau fitur AI. Tidak ada cadangan tinggi di bawah hero saat ditutup;
isi yang melebihi 20rem bisa digulir tanpa menimpa elemen lain. Tidak ada
scroll halaman otomatis saat memilih kartu.

Pada demo, pengunjung memilih lembar proyek, tim, kontribusi, validasi,
portofolio, atau anggota tim. Pilihan menyorot hubungan terdekat dan memperbarui
panel rincian tanpa scroll otomatis. Rincian membuka panel melalui anchor
eksplisit; tombol objek terkait melanjutkan penjelasan di panel yang sama.
Fokus tahap mempertahankan semua simpul peta untuk konteks, tetapi menyaring
Daftar hubungan. Tab mempertahankan pilihan yang sama dan bisa dipakai dengan
panah, Home, dan End. Reset kembali ke peta semua tahap tanpa pilihan.
Seluruh contoh synthetic mengikuti kontribusi Budi hingga portofolio Budi;
Siti hanya ditampilkan sebagai rekan tim, bukan sumber karya Budi.

### Demo Perjalanan T10

`Profil tanpa karya -> peluang pemula -> pengajuan singkat -> keputusan pemilik -> tugas nyata -> kontribusi individual -> validasi/revisi -> karya privat -> pilihan berbagi`

Pengunjung mengikuti contoh Budi dengan Sebelumnya/Berikutnya atau memilih tahap. Skenario Kapasitas penuh menjelaskan bahwa pengajuan tidak memesan tempat dan keputusan perlu diperiksa ulang. Skenario Perlu revisi mempertahankan pengakuan sebagai hasil setelah bukti diperbaiki, bukan otomatis setelah mengirim. Reset kembali ke awal tanpa mengubah akun, consent atau data aplikasi. Semua keadaan merupakan simulasi lokal berlabel Data synthetic, bukan hasil pilot atau command nyata. Judul tahap menerima fokus saat tahap atau skenario berubah; tidak ada autoplay. Graf existing hanya dibuka bila pengunjung memilih disclosure pelengkap.

## 1. Student Activation

`Nomor WhatsApp -> OTP -> private username dan password -> consent -> institution dan NIM -> roster match -> profile minimum -> dashboard`

Recovery:

- OTP terlambat atau expired: resend dengan cooldown dan attempt feedback.
- Phone sudah dipakai: tampilkan account recovery tanpa mengungkap detail account.
- NIM atau nomor WhatsApp tidak cocok dengan roster: kirim afiliasi untuk
  manual review dan simpan draft onboarding. Tampilkan status menunggu review,
  jangan mengirim profile sebelum membership berstatus verified, dan sediakan
  tindakan untuk memeriksa status lagi.
- Roster belum tersedia: simpan request tanpa menyatakan student tidak sah.

Sebelum masuk atau registrasi, panel kiri menjadi pengantar visual kolaborasi
dengan maskot dan balon sapaan. Kartu fitur tidak diulang dari hero landing.
Motif arsip, halo, dan aksen kecil hanya dekorasi. Pengantar tidak menjadi langkah
tambahan dan tidak mengubah login, pengiriman OTP, verifikasi WhatsApp,
pemulihan akun, maupun afiliasi. Pada mobile, pengantar diringkas agar form
cepat terlihat. Pada layar besar, dua kolom berkembang secara proporsional;
isinya rata atas agar formulir tidak turun akibat centering vertikal. Ukuran
container, form, maskot, bubble, dan tipografi bertambah terbatas sesuai lebar
serta tinggi layar pada login, register, dan OTP. Layar lebar pendek tetap
ringkas; mobile tidak ikut dibesarkan. Header dan pengantar tetap ringkas.
Tepi kanan tautan beranda sejajar dengan kartu form.
Login diberi jarak antarisian lebih lega daripada register; bantuan tetap terlihat,
input 16px, serta kontrol minimal 44px. Form panjang, error, dan tahap OTP
tetap memakai scroll halaman native tanpa footer terkunci atau konten dipotong.

### Profil Kemampuan T03

`Afiliasi terverifikasi -> Profil kemampuan -> kemampuan atau minat -> jadwal opsional -> bukti awal opsional -> simpan -> jelajahi peluang`

Menu akun dan arahan Beranda membuka Profil kemampuan lewat named route.
Profil existing dimuat tanpa meminta afiliasi ulang. Minat menyatakan arah
belajar atau kolaborasi, bukan kemampuan tervalidasi. Mahasiswa boleh menyimpan
tanpa karya dan tanpa jadwal; label tersimpan tidak sama dengan siap untuk
pencocokan. Keahlian dan jadwal diperlukan untuk kesiapan pencocokan, tetapi
penelusuran peluang tetap mengikuti afiliasi, bukan riwayat kontribusi.

Pada pelengkapan afiliasi, keahlian dan jadwal dapat dilewati. Sesudah kampus
terkonfirmasi, profil yang sudah ada dibuka lewat editor, bukan ditimpa dengan
draft modal. Menutup dan membuka kembali modal mempertahankan draft dalam sesi.

Jadwal existing dipertahankan per baris, termasuk jam dan zona waktu berbeda.
Simpan profil dan jadwal atomik. Kegagalan validasi atau jaringan mempertahankan
draft. Snapshot yang berubah meminta muat ulang, dengan konfirmasi sebelum
mengganti draft. Izin portofolio/perekrut tidak diubah oleh simpan kemampuan.

Bukti awal hanya tautan HTTPS privat berlabel Belum ditinjau. Kampus menerima
berkas dan bukti melalui pengajuan Kontribusi existing, bukan otomatis melalui
profil. Sumber disetujui dibaca dari keputusan kampus pada kontribusi pemilik;
persetujuan itu tidak menyatakan seluruh keahlian pemilik telah diuji.
Tautan awal tidak masuk proyeksi publik/perekrut dan tidak diambil server.

Modal afiliasi dapat ditutup saat tidak processing. Pending atau suspended
tidak memaksa modal berulang; Beranda tetap menawarkan tindakan pemulihan.
Profil kosong atau belum lengkap pada afiliasi terverifikasi mengarah ke
Profil kemampuan, bukan membuat data default ataupun menahan navigasi.

### Pengenalan Beranda Mahasiswa

Setelah pelengkapan profil ditutup, beranda memprioritaskan status penting,
langkah utama dari server, dan proyek aktif. Jika afiliasi belum terverifikasi
atau akses ditangguhkan, jelaskan alasan menu kolaborasi belum tersedia tanpa
membuka akses baru.

Hero menyapa mahasiswa dan mengarahkan ke langkah utama. Pada tablet dan
desktop, ruang atas hero menjaga maskot serta fokusnya tetap terpisah dari
navbar. Mahasiswa dengan
afiliasi terverifikasi juga dapat membuka daftar proyek dari hero. Setelah
hero dan pemberitahuan, desktop menempatkan pekerjaan utama di kiri dan
rekomendasi di kanan. Pada mobile, langkah utama dan proyek aktif tampil
sebelum rekomendasi, bekal profil, dan informasi validasi. Ringkasan alur
menutup halaman sebagai bantuan yang selalu dapat dibuka kembali. Data
loading, kosong, gagal, terlarang, dan kedaluwarsa tetap memiliki penjelasan
serta tindakan aktual sesuai respons server.

Beranda membedakan lembar langkah utama yang paling menonjol, daftar pekerjaan
aktif yang mudah dipindai, dan rekomendasi peluang dengan peran aktual.
Bekal profil serta informasi validasi lebih tenang, sementara ringkasan alur
berupa empat penjelasan terbuka, bukan status perjalanan mahasiswa. Aksen
lembar arsip mendampingi maskot pada hero dan kondisi proyek kosong. Respons
hover, tekan, dan fokus tidak mengubah data atau memindahkan susunan halaman.
Masukan rekomendasi yang sedang dikirim memiliki label processing yang terlihat;
hasilnya tetap mengikuti server. Reduced motion mempertahankan semua kontrol
dan informasi tanpa gerak tambahan.

Panduan singkat menjelaskan `Proyek -> Kontribusi -> Validasi kampus -> Portofolio`.
Tugas yang selesai belum otomatis menjadi kontribusi terverifikasi. Kontribusi
diajukan beserta bukti, ditinjau kampus, dan hanya kontribusi yang disetujui dapat
menjadi entri portofolio terverifikasi. Pengaturan visibilitas tetap dikendalikan
mahasiswa; portofolio publik dan izin ditemukan perekrut merupakan pilihan
terpisah.

Panduan muncul sekali per akun pada browser setelah onboarding tertutup dan
tidak mengganggu formulir atau dialog/menu lain. Menutup atau melewati panduan
mencatat penanda sudah dilihat. Tombol `Pahami alur SATU` selalu dapat membuka
penjelasan kembali. Storage yang tidak tersedia memakai fallback dalam memori
selama sesi aplikasi. Panduan tidak memiliki command bisnis atau akses data baru.

`Ringkasan -> Mulai tur -> Beranda -> Proyek -> Kontribusi -> Portofolio -> Selesai`

Tur menjelaskan beberapa bagian pada setiap menu dan menyorot elemen yang
tersedia. Berikutnya dan Sebelumnya menjaga progres saat membuka halaman lewat
Inertia dan Wayfinder. Tidak ada pengiriman formulir atau perubahan consent.
Jika afiliasi belum terverifikasi atau ditangguhkan, tur dibatasi pada Beranda
dan status afiliasi. Kegagalan membuka menu memiliki retry; target yang tidak
tersedia dijelaskan tanpa menampilkan sorotan palsu.

Perpindahan mempertahankan panel pada posisi yang sama. Sorotan lama meredup,
halaman digulir lembut hanya jika bagian yang dikenalkan belum terlihat, lalu
sorotan baru muncul. Indikator langkah hanya menjelaskan urutan tur. Pengguna
dapat menutup atau melewati tur selama perpindahan. Preferensi reduced motion
memakai perpindahan langsung dengan informasi dan kontrol yang sama.

Lewati, tombol tutup, atau Escape mengakhiri tur pada halaman saat ini. Selesai
atau dilewati menyimpan penanda tur per akun/browser. Tombol Panduan menu pada
header memulai ulang dari Beranda. Saat reload di tengah tur, mahasiswa dapat
memulai ulang melalui tombol tersebut. Ringkasan dapat ditawarkan lagi di
Beranda jika tur versi ini belum selesai atau dilewati.

## 2. Recommendation sampai Active Team

### Navigasi Aplikasi

Navigasi inti mahasiswa berisi Beranda, Proyek, Kontribusi dan Portofolio.
Operator mengutamakan Ringkasan, Afiliasi kampus, Roster mahasiswa dan Validasi
kontribusi. Fitur lanjutan memakai disclosure terpisah, tertutup pada halaman
inti dan terbuka ketika salah satu route lanjutan aktif. Ini pengelompokan
navigasi, bukan penghentian route, job, listener, consent atau Policy. Perekrut
existing tetap dapat membuka modulnya dengan penjelasan bahwa modul tersebut
merupakan pengembangan lanjutan. Menu akun dan notifikasi tetap tersedia.

Di Beranda, pemulihan afiliasi mendahului pekerjaan; setelah akses tersedia,
revisi yang masih diizinkan, tugas assigned belum selesai, serta proyek aktif
mendahului rekomendasi. Pengajuan pending mengarah ke status proyek. Daftar
proyek aktif mencakup pemilik dan anggota tim aktif. Menunggu afiliasi hanya
mempertahankan draft onboarding, bukan menyatakan profil telah tersimpan.
Belum ada rekomendasi tidak berarti tidak mempunyai kesempatan.

Semua role memakai pola navigasi dan menu akun yang sama, dengan route serta
konteks kerja sesuai kewenangannya. Header menunjukkan halaman saat ini dan
tetap terlihat saat scroll. Pada mobile, buka drawer melalui toggle header,
pilih menu atau tutup melalui tombol tutup, Escape, atau backdrop. Fokus kembali
ke toggle pada halaman yang aktif. Pada desktop, sidebar dapat ditutup tanpa
mengubah data atau izin akun. Menu akun hanya menampilkan nama dan role;
private username tidak tampil di kerangka aplikasi.

Identitas SATU menjadi kepala sidebar yang lebih dominan: simbol burung-buku pada bidang
putih, wordmark yang lebih besar, kepanjangan nama dalam font body, serta label
role pada gradasi biru tipis. Motif arsip bersifat dekoratif. Menu aktif memakai
bidang biru lembut tanpa garis vertikal; hover tidak mengangkat atau menggeser
elemen. Navigasi dan kartu konteks berbagi area scroll agar nama panjang serta
layar pendek tidak menghalangi menu. Kepala dan tombol tutup tetap terlihat.
Kartu konteks tetap menunjukkan kampus/organisasi dan status aktual, bukan
kontrol baru. Tautan, izin role, fokus, dan reduced motion dipertahankan.

`Profile siap -> discovery/recommendation -> explanation -> project detail -> join/invite -> atomic decision -> active team -> workspace`

Capacity penuh, request ganda, permission hilang, dan stale recommendation harus memiliki recovery yang deterministic.

T06: pilih peran -> tulis minat, kemampuan relevan atau kebutuhan belajar,
dan ketersediaan singkat -> kirim -> pengajuan menunggu -> pemilik membaca
ringkasan serta kriteria aktual -> menerima atau menolak dengan alasan ->
pemohon membaca keputusan dan langkah berikutnya. Pengajuan disimpan dalam
field pesan existing dengan label jawaban; pesan lama tetap dibaca tanpa
mengarang jawaban. Tidak memerlukan bukti profil privat atau portofolio.

Penerimaan menyimpan keanggotaan, status pengajuan, kapasitas, audit dan event
keanggotaan dalam satu transaksi. Workspace hanya untuk anggota aktif yang
masih diizinkan. Pemohon dapat menarik pengajuan pending dengan konfirmasi;
pengajuan berikutnya menjadi record baru, tanpa menghapus keputusan lama.
Riwayat hanya pemohon sendiri atau pemilik proyek. Konflik kriteria/kapasitas
atau keputusan yang sudah diproses meminta pemeriksaan status terbaru. Hasil
command tidak pasti tidak dikirim ulang otomatis. Notifikasi canonical
diantrekan setelah commit dan mengarahkan ke status sumber, bukan bukti delivery
WhatsApp. Peristiwa pengajuan, keputusan dan keanggotaan dapat ditelusuri tanpa
mengumpulkan isi diskusi atau mengklaim hubungan kerja baru telah terbukti.

Jika undangan dan pengajuan yang sama masih menunggu ketika salah satunya
diterima, jalur lain berakhir dalam transaksi yang sama. Riwayat menyebut
keanggotaan dibentuk melalui jalur lain, bukan penolakan kemampuan atau
penarikan oleh pemohon. Tidak menyisakan tawaran aktif kepada anggota aktif.

Pemilik dapat membaca maksimal tiga ringkasan karya terkini per pemohon, hanya
jika entry portofolio dibagikan untuk kampus/publik, tidak ditarik, bersumber
pada kontribusi approved versi saat ini, dan identitas/institusi sumber konsisten.
Tautan detail existing memeriksa ulang Policy. Bukti privat dan catatan reviewer
tidak ikut diproyeksikan. Tidak ada karya yang dibagikan bukan tanda kurang
kemampuan. Pencabutan visibility menghilangkan karya pada pembacaan berikutnya.

Undangan pending yang belum kedaluwarsa memberi penerima terverifikasi akses
baca detail proyek privat untuk memahami peran dan mengambil keputusan.
Undangan tidak memberi akses workspace; mahasiswa lain, undangan dicabut atau
kedaluwarsa tidak mendapat preview ini. Penelusuran tetap tidak membocorkan
proyek privat kepada nonanggota. Penerimaan revalidasi keanggotaan, tenant,
kapasitas serta lifecycle dalam transaksi existing.

### Penemuan, Detail, dan Penyusunan Proyek

T05: simpan perubahan profil/peran/tim -> commit -> permintaan pembaruan
institution-scoped -> job membaca sumber dan izin terbaru -> hasil batch atomik
-> Beranda membaca alasan, peran tersedia, versi dan batas waktu. GET tidak
membuat permintaan atau hasil. Perbarui rekomendasi merupakan POST eksplisit;
Periksa status hanya reload region. Antrean, gagal, kedaluwarsa, input berubah
atau versi belum sesuai tetap memiliki jalur Jelajahi peluang. Hasil tidak
menjamin penerimaan, tidak memakai karya atau relasi sebagai syarat, dan
feedback menyembunyikan/tidak relevan tetap berlaku pada batch baru.

T04 menambah filter penerimaan pemula dan tempat tersedia pada URL. Keduanya
membaca data server; ketika digabung, peran yang menerima pemula harus masih
mempunyai tempat pada proyek yang menerima pengajuan. Tanpa profil atau karya,
mahasiswa terverifikasi tetap dapat membaca peluang dan mengajukan melalui
flow existing. Pemula tidak berarti diterima otomatis.

Pemilik mengisi tujuan pada uraian, tugas peran, kriteria pemilihan dan pilihan
penerimaan pemula. Data yang belum diisi dijelaskan sebagai belum dinyatakan.
Detail dan kartu membedakan kapasitas total, anggota aktif dan sisa fisik;
tenggat/lifecycle tetap dapat menutup pengajuan. Pengajuan dan undangan pending
tidak dihitung sebagai anggota. Perubahan peran mempertahankan ID dan referensi
existing, tanpa menghapus riwayat atau mengurangi kapasitas di bawah anggota.

`Proyek -> Peluang atau Proyek saya -> filter URL -> hasil sesuai institusi -> detail/ruang kerja`

Peluang membaca proyek yang dapat ditemukan dalam kampus. Proyek saya memakai
query server untuk proyek milik mahasiswa atau tim yang masih diikuti secara
aktif, bukan menyaring hasil satu halaman di browser. Draft sendiri serta
proyek privat yang diizinkan tetap dapat ditemukan pada pilihan ini. Pilihan
disimpan pada `view`, kembali ke halaman pertama ketika berubah, dan memakai
default status/visibilitas sesuai pilihan. Pagination dan refresh membaca
filter yang telah diterapkan; retry mengulang query yang gagal. Empty memberi
penjelasan berbeda antara belum menemukan peluang dan belum mempunyai proyek.
Membuka pilihan tidak mengajukan, menerima anggota, atau menulis record baru.

`Cari proyek -> buka Filter tambahan bila perlu -> Terapkan filter -> baca kartu peluang -> Lihat proyek -> pahami kebutuhan -> ajukan bergabung atau buka ruang kerja sesuai izin`

Pencarian tetap terlihat saat filter tambahan ditutup. Ringkasan pilihan yang
diterapkan berasal dari filter respons server. Hasil dan pagination memakai
URL yang sama dengan perilaku sebelumnya. Ringkasan kartu tidak menggantikan
rincian peran/keahlian pada detail. Kapasitas total tidak dinyatakan sebagai
slot tersisa.

Kartu peluang memberi prioritas pada nama proyek serta kebutuhan peran,
bukan angka kapasitas atau skor baru. Bidang peran membedakan total, terisi,
dan tersisa dari agregat anggota aktif;
metadata deadline, kapasitas tim, dan pemilik tetap terpisah. Motif lembar arsip
berada pada hero dan kondisi hasil kosong. Detail memprioritaskan tindakan
yang diizinkan, lalu uraian terbuka dan lembar kebutuhan peran. Konteks kampus
serta tindakan destruktif memiliki penekanan lebih tenang.

Kartu peluang tetap statis saat pointer melewatinya, termasuk ikon tautan.
Judul serta tombol Lihat proyek tetap interaktif dan memiliki fokus keyboard
yang terlihat.

Tombol Buat proyek pada hero tidak berubah warna, bayangan, atau posisi saat
hover. Tombol tetap membuka editor dengan konteks kampus yang sama dan memiliki
indikator fokus keyboard.

Pada detail, tindakan tersedia sebelum isi panjang. Calon anggota dapat menuju
formulir pengajuan melalui tautan pada halaman yang sama bila diizinkan.
Pengajuan terkirim menunggu keputusan pemilik; anggota aktif dan penerima
undangan mendapat informasi sesuai statusnya. Pembentukan tim, penolakan,
pencabutan undangan, serta lifecycle tetap memakai command yang sudah ada.

`Buat atau edit proyek -> Informasi proyek -> Pengaturan tim -> Peran dan keahlian -> simpan draft, simpan dan buka, atau simpan perubahan`

Ketiga bagian tersedia dalam satu formulir, bukan wizard. Pada mobile, kartu,
kolom, dan tombol menumpuk tanpa menyembunyikan bantuan atau error. Penyimpanan
dan pembukaan tetap dua operasi yang berbeda; draft yang tersimpan tetapi belum
terbuka harus dijelaskan sebagai draft, bukan diminta dibuat ulang.

Informasi proyek merupakan lembar utama formulir. Pengaturan tim menjadi bagian
terbuka, dan tiap peran memiliki lembar tersendiri. Footer menunjukkan request
penyimpanan atau pembukaan yang sedang berjalan, bukan jaminan sudah tersimpan.
Respons hover, tekan, fokus, serta disclosure singkat tidak mengubah urutan
pengisian dan tetap dapat dipakai tanpa animasi pada reduced motion.

## 3. Realtime Task

`Buka workspace -> initial state dari database -> subscribe authorized channel -> command -> commit -> delta -> reconciliation`

Drag adalah enhancement. Keyboard dan button command tetap lengkap. Ketika reconnect, UI menunjukkan stale boundary sampai reconciliation selesai.

T07: `Beranda -> tugas aktual -> Tugas saya atau detail tugas -> baca hasil dan penanggung jawab -> kerjakan -> unggah bukti privat tanpa pesan -> catat kontribusi individual`.

Semua tugas dan Belum ditugaskan tetap tersedia untuk koordinasi tim. Diskusi
bersifat opsional, bukan feed popularitas. Bukti tanpa pesan berada dalam daftar
tersendiri; unggahan tidak otomatis menjadi klaim tugas atau portofolio.
Refresh mempertahankan draft tugas. Konflik meminta pemeriksaan data terbaru,
bukan mengganti revisi draft diam-diam. Hasil command atau unggah yang belum
pasti memerlukan pembacaan database sebelum pengiriman lain. Tidak ada retry
mutasi otomatis. Kehilangan izin menyembunyikan data privat yang lama.

## 4. Contribution sampai Recognition

`Submit version dan evidence -> campus queue -> approve/revision/reject -> portfolio projection -> notification`

XP dan badge merupakan consumer lanjutan dari approval yang masih dipertahankan
pada runtime. Bukan syarat memperoleh portofolio dan tidak menjadi langkah
wajib dalam pengenalan alur inti. T02 tidak menghentikan consumer tersebut.

Campus reviewer mengambil keputusan langsung. Team confirmation tidak diperlukan. Revision membuat version baru tanpa menimpa history.

### Kontrak Pengakuan T08

Mahasiswa menjelaskan bagian pekerjaan sendiri, hasil yang bisa diperiksa,
serta hubungan setiap bukti dengan klaim. Ringkasan dapat menjadi isi karya
yang dipilih untuk dibagikan; pernyataan dan berkas tidak ikut dipublikasikan.
Panduan teknis bukan standar bukti final kampus atau janji SLA.

Detail individual tidak dibuka kepada rekan tim. Operator melihat versi yang
sudah dikirim, bukan draft baru yang belum diajukan. Unduh bukti memakai
endpoint privat berotorisasi dan hanya bukti yang sah dalam pengajuan.
Persetujuan mencatat keputusan dan karya privat atomik sebelum consumer
lanjutan. Judul karya berasal dari klaim individual, bukan nama proyek bersama.

Revisi memakai pilihan bukti versi baru. Melepas pilihan tidak menghapus
berkas maupun rujukan versi lama. Revisi sumber diperiksa pada submit,
perubahan dan review, termasuk bukti yang dihapus pada versi yang sama.
Ketidakpastian jaringan atau konflik menahan pengiriman lain hingga pembacaan
terbaru. Draft tidak ditimpa otomatis. Mengambil versi terbaru meminta
konfirmasi ketika perubahan belum tersimpan.

### Pengajuan dan Revisi Mahasiswa

`Kontribusi -> pilih proyek dan tugas -> jelaskan pekerjaan -> pilih bukti privat dan pernyataan -> simpan draft -> periksa versi tersimpan -> kirim untuk validasi kampus`

Daftar menyediakan pencarian dan filter status lokal, bukan statistik seluruh
kampus. Pengenalan tiga tahap menjelaskan hubungan penyusunan, validasi, dan
portofolio tanpa menyatakan tahap pengguna sudah selesai. Simpan draft tidak
sama dengan Kirim untuk validasi. Detail menunjukkan status, tindakan yang
diizinkan, versi aktif, bukti, keputusan kampus, dan riwayat.

Kartu catatan menonjolkan langkah berikutnya sesuai status aktual, bukan
persentase perjalanan atau estimasi pemeriksaan. Pengenalan alur tetap terbuka
dan tidak menunjukkan tahap pengguna telah selesai. Motif arsip hanya pada
hero serta kondisi daftar kosong. Kartu dan tombol utama hero tetap statis
saat hover, dengan fokus keyboard yang terlihat.

Detail membedakan lembar versi aktif dan bukti privat dari keputusan kampus,
jejak pekerjaan, serta riwayat versi yang terbuka. Formulir memberi prioritas
pada cerita pekerjaan, lalu bukti dan pernyataan. Status menyimpan atau mengirim
tampil selama request terkait; keberhasilan hanya mengikuti respons server.

`Catatan revisi -> perbarui catatan/bukti -> simpan versi baru -> periksa draft baru -> kirim kembali`

Pada mobile, status dan tindakan detail tampil sebelum isi panjang. Isian
composer dipertahankan saat validasi atau koneksi gagal. Saat composer dibuka,
pengiriman versi tersimpan tidak ditawarkan sampai mahasiswa menyimpan atau
kembali ke detail. Bukti tetap berada di ruang kerja dan tidak otomatis menjadi
bagian portofolio publik. Versi lama dan keputusan sebelumnya tidak ditimpa.

Membuka editor memindahkan fokus ke judul formulir. Membatalkan edit
mengembalikan fokus ke tombol edit. Catatan alasan dan saran kampus tetap
terbaca selama perbaikan.
Penolakan validasi pengiriman menampilkan seluruh pesan yang dikembalikan
server dan memindahkan fokus ke ringkasan error, termasuk saat versi belum ada.

### Pengelolaan Portofolio

`Kontribusi disetujui -> karya tersimpan -> buka Portofolio -> periksa sumber dan status -> pilih jangkauan karya -> simpan jangkauan`

Koleksi menyediakan pencarian dan filter lokal terhadap karya yang sudah dimuat.
Pengaturan karya, pengaturan profil, dan izin ditemukan perekrut dipisahkan.
Atur jangkauan membuka formulir per kartu tanpa mengubah pilihan tersimpan.
Tautan kendali profil pada hero membantu menjangkau pengaturan pada mobile.
Pilihan formulir yang belum disimpan tidak dinyatakan sebagai visibilitas aktif.

Koleksi mengutamakan judul serta cerita karya, dengan satu kolom sampai xl dan
dua kolom mulai 2xl. Jangkauan tersimpan, versi sumber, serta tanggal menjadi
metadata yang lebih tenang. Motif arsip hanya mendampingi hero serta kondisi
kosong. Kartu dan tombol utama hero tetap statis saat hover, sementara fokus
keyboard dan tindakan tetap tersedia.

Detail memberi prioritas pada ringkasan karya dan memisahkan fakta sumber dari
kendali profil serta jangkauan karya. Status menyimpan terlihat selama request;
pengaturan tidak dinyatakan tersimpan sebelum respons sukses. Pada halaman
publik, karya terbaru tetap mengikuti urutan server dan tidak membuka data
privat atau pengaturan pemilik.

Untuk halaman publik, profil dan karya sama-sama dipilih Publik. Tidak membuat
tautan berbagi dari ID profil privat bila server belum menyediakan identifier.

`Buka kendali profil -> pilih jangkauan profil -> pilih izin ditemukan perekrut bila diinginkan -> simpan pengaturan`

Menyimpan pilihan tidak menjamin dilihat atau dihubungi perekrut. Bukti privat
dan catatan kampus tidak masuk halaman publik. Refresh mempertahankan filter
dan mengambil karya terkini. Perubahan server yang berbeda dari token formulir
ditampilkan sebagai stale; mengambil pengaturan terbaru adalah tindakan
eksplisit, bukan overwrite otomatis. Validasi atau kegagalan koneksi tidak
menghapus pilihan lokal, dan error menerima fokus.

Pada detail mobile, pengaturan karya tersedia sebelum ringkasan panjang.
Pengunjung halaman publik hanya membaca identitas dan karya yang diproyeksikan
server. Saat publikasi tidak tersedia, identitas serta karya tidak ditampilkan.

## 5. Leaderboard

`Pilih semester dan kategori -> baca aturan serta jumlah anggota -> lihat peringkat -> buka penjelasan perhitungan`

Heading filter terbuka, sedangkan pilihan semester dan kategori serta hasil
memakai lembar putih berelevasi lembut. Nama entitas dan angka XP diberi
hierarki lebih jelas tanpa podium atau penanda khusus untuk peringkat teratas.
Motif arsip hanya mendampingi hero serta kondisi hasil kosong. Fakta hasil pada
mobile, panduan perhitungan, dan badge tetap mudah dibaca tanpa kartu bersarang.
Baris hasil tidak bergerak atau berubah saat hover; fokus tindakan tetap jelas.

Panel persetujuan berbeda secara visual dari panduan. Status menyimpan memiliki
ruang tetap dan hanya muncul saat command persetujuan, bukan saat filter memuat.
Keberhasilan mengikuti respons server. Transisi kontrol singkat menghormati
pengurangan gerakan, dan informasi tetap tersedia tanpa animasi.

Program studi dan tim menggunakan rata-rata XP terverifikasi per anggota aktif,
dengan minimum publikasi lima anggota. Individual memakai total XP
terverifikasi, tanpa minimum kelompok. XP berasal dari kontribusi yang
disetujui kampus. Skor sama berbagi peringkat yang sama; urutan berasal dari
server, bukan nomor baris pada halaman.

`Buka pengaturan individual -> baca data dan pembaca pada dialog -> konfirmasi persetujuan -> baca status tersimpan -> tunggu hasil perhitungan tersedia`

Persetujuan tidak diaktifkan saat memilih kategori atau memulai tur.
Mahasiswa dapat membatalkan dialog tanpa perubahan. Penarikan melalui dialog
konfirmasi menyembunyikan baris pada pembacaan berikutnya tanpa menghapus XP
atau badge. Program studi/tim tetap dapat dibaca tanpa persetujuan individual.
Pengaturan tidak ditawarkan kepada operator kampus.

Perubahan semester, kategori, pagination, dan refresh mempertahankan data lama
selama memuat. Kegagalan memiliki retry pilihan yang gagal; status forbidden
menyembunyikan hasil lama. Snapshot kedaluwarsa tetap berlabel waktu dan tidak
diklaim terkini setelah refresh jika server masih menyatakan stale. Detail
perhitungan ditutup saat konteks berubah. Pada mobile hasil berubah menjadi
kartu berlabel tanpa kehilangan penjelasan, anggota pembagi, atau status
kelompok dilindungi.

## Ringkasan Operasional Kampus

`Kampus aktif -> Ringkasan -> pilih periode dan program -> Terapkan filter -> baca fakta serta cakupan -> buka antrean yang relevan`

Header menampilkan kampus aktif, bukan konteks tenant tersembunyi. Afiliasi
menunggu memakai jumlah membership pending dalam cakupan ringkasan, bukan
jumlah permintaan afiliasi di antrean. Pintasan Afiliasi, Validasi kontribusi,
serta Roster membawa institusi yang sama tanpa mengirim command. Ringkasan
kontribusi belum terhubung sehingga tidak mengklaim jumlah nol. Waktu tinjauan
adalah rata-rata dari keputusan afiliasi, bukan target SLA. Proyek aktif dan
ditutup dijelaskan berdasarkan kelompok status backend, bukan bukti karya selesai.

Filter tanggal membaca waktu pencatatan keanggotaan, proyek, atau keputusan
afiliasi sesuai sumber. Program studi memakai kecocokan nama penuh dan hanya
berlaku pada keanggotaan serta daftar anggota. Distribusi seluruh program
memakai total profil pada distribusi, bukan jumlah anggota terfilter sebagai
denominator. Pagination dan refresh tidak menerapkan draft isian diam-diam.
Hasil server dan pilihan belum diterapkan dibedakan; error mempertahankan isian.

Grafik komposisi keanggotaan dan status proyek berada dalam kartu fakta,
bukan panel tambahan. Legenda tetap menampilkan label serta hitungan aktual
tanpa harus hover. Grafik tidak menyiratkan tren waktu atau keberhasilan karya.
Jika total proyek mencakup status di luar tiga kelompok, sisanya ditandai
Status lainnya. Data kosong dijelaskan tanpa mengarang irisan atau batang.
Hero, filter, pintasan, serta daftar dipadatkan; kontrol tetap minimal 44px.
Penjelasan sumber tambahan dapat dibuka lewat Tentang data ringkasan.
Hero mengikuti Cari Talenta perekrut dengan gradasi, motif arsip, serta maskot,
tetap menampilkan kampus aktif. Filter hanya menampilkan isian serta tombol,
satu baris jika region cukup lebar, lalu membungkus di tablet/mobile. Judul,
Hasil saat ini, dan paragraf penjelasan tanggal tidak ditampilkan. Bantuan
tetap terhubung untuk screen reader; definisi cakupan berada pada Tentang data
ringkasan. Status draft dan validasi tetap terlihat ketika relevan. Perubahan
ini tidak menerapkan isian otomatis.

Daftar memakai referensi keanggotaan, peran, program, dan status afiliasi;
username tidak menjadi identitas tampilan. Data lama tetap tersedia saat
memuat, tetapi disembunyikan ketika akses ditolak. Retry meminta konteks yang
gagal dan hanya respons sukses mengonfirmasi pembaruan. Tidak menampilkan
data inclusion atau menganggap tautan modul sebagai izin aktivasi.

## Peninjauan Afiliasi Kampus

`Kampus aktif -> filter antrean -> Tinjau berkas -> ambil kunci -> periksa data masked dan hasil roster -> pilih keputusan serta alasan -> simpan atau lepas kunci`

Header putih ringkas memakai identitas kampus aktual, bukan hero promosi kedua.
Berkas memakai referensi AF-id tanpa username privat. Filter berlaku langsung;
jumlah hasil berasal dari paginator, sedangkan ringkasan membaca seluruh antrean
kampus. Kategori roster berubah dapat bertumpang tindih dengan hasil pencocokan.

Kunci operator lain serta roster berubah menonaktifkan tombol tinjau dengan
penjelasan. Kunci sendiri membuka formulir keputusan dan waktu kedaluwarsa
aktual. Pilihan keputusan mengubah daftar alasan yang tersedia, bukan mengirim
command. Simpan membawa expected_version, alasan, dan catatan yang sudah ada.
Sukses hanya mengikuti outcome server. Conflict atau versi usang mengarahkan
operator untuk memuat ulang tanpa mengklaim keputusan tersimpan. Form aktif
mendahului antrean di mobile agar tindakan tidak tenggelam di bawah daftar.

Loading awal memakai skeleton region; refresh mempertahankan berkas dan
menonaktifkan tindakan yang belum aman. Error jaringan mempertahankan konteks
dan menawarkan pemulihan. Akses ditolak menyembunyikan data antrean sebelumnya.
NIM serta WhatsApp tidak diperluas di frontend; tidak ada identitas rekaan,
tautan bukti baru, inclusion signal, atau perubahan workflow backend.

## 6. Inclusion Review

### Operasi Kampus Aktual

Roster memakai urutan `pilih CSV dan semester -> tinjau berkas -> periksa baris valid serta error -> impor baris valid -> riwayat roster`. Pratinjau belum berarti roster sudah aktif. Baris invalid tidak diimpor; jumlah dan status berasal dari server. Panduan format serta privasi mendampingi form tanpa mengulang nama kampus.

Validasi memakai urutan `pilih status dan urutan -> buka berkas kontribusi -> baca versi, klaim, bukti privat, dan riwayat -> setujui, minta perbaikan, atau tolak -> respons server`. Panel terpilih muncul sebelum antrean pada mobile. Alasan perbaikan/penolakan serta expected_version tetap mengikuti kontrak existing; desain tidak memperluas akses bukti.

Peninjauan inklusi menampilkan status fitur sebelum filter. Saat fitur nonaktif, antrean dan form keputusan tidak ditawarkan sebagai operasi aktif. Saat tersedia, peninjau memilih sinyal, membaca kecukupan data serta versi aktual, lalu mencatat kesimpulan, alasan faktual, dan tindakan pendukung bila ada. Ini pencatatan tinjauan manusia, bukan diagnosis atau pengiriman kontak. Ringkasan bukti terbaca; rincian teknis tersedia dalam disclosure, bukan JSON terpotong sebagai judul kartu.

`Feature aktif dan governance disetujui -> authorized reviewer -> signal queue -> evidence summary -> human review -> support action -> append-only record`

Feature disabled, synthetic-only, insufficient data, stale version, dan permission denied harus menjadi explicit state. Tidak ada auto-contact atau adverse action.

## 7. Recruiter Contact

`Organization verified -> entitlement active -> search safe projection -> candidate detail -> contact request -> student notification -> accept/decline -> limited contact handoff`

Jika visibility dicabut atau entitlement expired, kandidat hilang dari search dan action baru ditolak. History minimal dipertahankan sesuai retention.

Cari Talenta menampilkan status hak akses sebelum daftar. Hero, lembar pencarian,
kartu portofolio, serta panduan privasi mewarisi tampilan mahasiswa. Perekrut
mengisi kata kunci dan filter, menambah skill lewat Enter atau Tambah,
dibantu penjelasan singkat di bawah kata kunci, ketersediaan, dan institusi
kampus. Kata kunci menelusuri judul serta ringkasan profil, bukan filter skill.
Perekrut kemudian memilih Cari talenta. Pilihan diterapkan pada URL; pagination memakai
query yang sama. Hasil lama tetap terlihat selama refresh. Kondisi kosong
menawarkan penyesuaian filter, sedangkan hak akses belum aktif menjelaskan
kebutuhan organisasi dan aktivasi tanpa menawarkan pencarian yang terkunci.

Kartu hanya membaca recruiter-safe projection. Verifikasi, skill, badge, dan
ringkasan kontribusi tidak dibuat sebagai data contoh. Simpan kandidat atau
hapus simpanan memberi status processing terpisah, kemudian konfirmasi setelah
respons server. Error jaringan tidak menjanjikan command telah selesai.
Forbidden menyembunyikan data sebelumnya dan menyediakan pemeriksaan ulang.
Tautan profil, kandidat tersimpan, dan permintaan kontak tetap mengikuti alur
existing; redesign pencarian tidak mengubah consent ataupun contact handoff.

Detail kandidat meneruskan bahasa visual Cari Talenta. Profil, keahlian, badge,
dan kontribusi hanya membaca projection yang dibagikan; label verifikasi
portofolio mengikuti verified_at. Panel simpan mendahului isi panjang pada
mobile, dan confirmation mengikuti server. Jika simpan atau refresh menerima
403/404, profil sebelumnya disembunyikan. Kirim permintaan kontak pada detail
belum memiliki form, sehingga disabled dengan alasan terlihat. Tautan Lihat
permintaan kontak membuka daftar existing, bukan mengirim command atau
membuka nomor telepon. Pengiriman baru tidak termasuk redesign ini.

Kandidat tersimpan adalah koleksi organisasi dengan header ringkas yang
berbeda dari pencarian. Jumlah keseluruhan dan halaman mengikuti paginator
server. Perekrut membuka profil atau menghapus simpanan melalui dialog yang
menjelaskan dampak pada koleksi organisasi, bukan penghapusan profil.
Kartu tetap terlihat selama command diproses dan berubah setelah respons
server. Setelah berhasil, fokus kembali ke heading daftar. Pagination dan
refresh memakai data terbaru, bukan salinan state lokal. Hak akses belum
aktif berbeda dari koleksi kosong; 403 menyembunyikan hasil sebelumnya.

Permintaan kontak memakai kepala korespondensi ringkas tanpa menyalin hero
pencarian. Perekrut membaca tujuan dan pesan organisasi, memilih filter lokal
Semua, Menunggu, Disetujui, Ditolak, Kedaluwarsa, atau Dibatalkan, lalu memuat
ulang untuk memeriksa status terbaru. Riwayat tidak diklaim sebagai kontak
langsung atau jaminan akses nomor WhatsApp. Hak pencarian tidak aktif tidak
menyembunyikan riwayat yang masih diizinkan server.

`Permintaan menunggu -> Batalkan permintaan -> baca konsekuensi organisasi -> konfirmasi -> respons server -> status terbaru`

Dialog dapat dibatalkan tanpa command. Selama pengiriman, kontrol tutup dan
konfirmasi disabled, sementara kartu tetap tersedia. Keberhasilan mengikuti
server dan mengembalikan fokus ke heading daftar; kegagalan mempertahankan
konteks serta menyediakan muat ulang. Forbidden menyembunyikan riwayat dan
jumlah sebelumnya. Tidak menambah form pengiriman atau handoff kontak baru.

## 8. Academic Sync

Pemetaan kredit memakai `buat draft -> periksa jenis aktivitas, SKS, dan versi -> konfirmasi aktivasi -> aturan aktif`. Aktivasi menggantikan aturan aktif untuk jenis aktivitas yang sama tanpa menghapus riwayat. Penghentian dikonfirmasi dan tidak menulis ulang sinkronisasi historis. Draft dan aturan dihitung dari record aktual, bukan perkiraan capaian mahasiswa.

Sinkronisasi memakai `baca mode koneksi -> terapkan filter -> periksa hasil dan versi -> buka riwayat -> ulangi atau rekonsiliasi bila status mengizinkan -> respons server`. Kartu hasil menjelaskan sumber, versi pemetaan, jumlah percobaan, dan pesan aktual. Mode sandbox tetap berlabel uji coba. Ulangi mengantrekan request, bukan jaminan sukses provider; rekonsiliasi mencatat penyelesaian manual dengan alasan. Dialog tidak ditutup selama command diproses dan tidak menghapus alasan ketika validasi gagal.

`Mapping valid -> approved activity -> sync candidate -> queued -> provider response -> success atau review queue -> retry/reconcile`

Sandbox harus dapat memicu success, validation error, timeout, duplicate, dan recovery secara repeatable.

## 9. Account dan Data Rights

### Pengaturan Akun Aktual

`Menu akun -> Pengaturan -> Profil, Keamanan, atau Tampilan`

Profil mengubah nama akun dan private username untuk masuk. Username tidak
ditampilkan pada hero atau halaman publik. Isian dipertahankan ketika request
gagal dan penyimpanan memerlukan tindakan eksplisit. Afiliasi kampus dan
jangkauan Portofolio bukan pengaturan identitas akun ini.

`Keamanan -> password saat ini -> password baru -> konfirmasi -> perbarui -> respons server`

Validasi server dan konfirmasi autentikasi yang sudah tersedia tetap berlaku.
Saat validasi gagal, kolom password dikosongkan dan error summary menerima
fokus. Setelah sukses, kolom dikosongkan. Password tidak disimpan dalam storage
browser. Gangguan jaringan memiliki pesan pemulihan tanpa klaim berhasil.

`Profil -> Hapus akun -> baca konsekuensi -> password saat ini -> konfirmasi penghapusan`

Membuka dialog tidak menghapus akun. Membatalkan atau menutup sebelum pengiriman
membersihkan password dan mengembalikan fokus ke pemicu. Saat pengiriman
berlangsung, dialog dipertahankan sampai server memberi hasil agar error tidak
hilang. Sukses mengikuti redirect dan logout server. Jangan menyatakan semua
riwayat/audit ikut terhapus karena retensi memiliki batas produk tersendiri.

Tampilan menjelaskan mode terang yang sudah aktif. Tidak ada pilihan tema baru,
command penyimpanan, atau perubahan browser preference. Preview hanya
mengenalkan warna serta struktur SATU, bukan hasil atau data pengguna.

### Kontrak Data Rights

`Request -> verify identity -> classify data -> fulfill/correct/restrict/delete -> record result -> notify`

Append-only review dan audit data mengikuti approved retention serta legal exception. UI menjelaskan bagian yang tidak dapat langsung dihapus dan alasannya.

## T09: Bantuan Kesempatan Sukarela

`Proyek -> Bantuan kesempatan -> baca tujuan dan masa akses -> pilih kebutuhan -> izinkan peninjau -> kirim -> tawaran peran beralasan -> terima atau tolak -> jika berminat ajukan lewat Proyek`

Penerimaan tawaran tidak membuka ruang kerja atau kontak. Mahasiswa dapat mencabut izin kapan saja, termasuk setelah menerima tawaran. Riwayat pemilik dipertahankan; kampus tidak menerima snapshot baru setelah pencabutan atau expiry. Peninjau ditetapkan dalam konfigurasi institusi, bukan seluruh operator secara otomatis. Catatan tindak lanjut merupakan tindakan manusia, bukan klaim dukungan tercapai.

Setelah konflik atau hasil jaringan belum pasti, pengguna membaca ulang sebelum command berikutnya. Draft dipertahankan; memakai revisi terbaru untuk keputusan memerlukan tindakan eksplisit. Tidak mengulang command otomatis. Aktivasi dan kebijakan data nyata tetap keputusan manusia.
