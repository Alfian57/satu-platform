# User Flows SATU

## Dua Role Aktif (17 Oktober 2026)

`Login -> izin Admin Universitas UTY aktual -> Ringkasan`

`Login -> akun tanpa izin admin -> Beranda mahasiswa -> verifikasi afiliasi jika diperlukan`

Role perekrut dan admin platform terpisah dihapus. Membership/flag lama tidak
memberi workspace atau izin tambahan. Pendaftaran hanya mahasiswa; undangan
hanya Admin Universitas. Alur Talent Portal dan kontak perekrut di bawah adalah
riwayat yang dihentikan, bukan fitur tertunda yang dapat diaktifkan. Pilihan
berbagi ke perekrut dihapus tanpa memublikasikan nilai lama otomatis. Status
pending atau ditangguhkan tetap status akses, bukan jenis role.

## Target Alur Universitas Tunggal U01

Copy antarmuka mengikuti satu universitas, UTY: nama universitas dibaca dari
server tanpa ajakan memilih kampus. Lintas program studi menjelaskan peluang
kolaborasi; lintas kampus bukan alur yang ditawarkan. Keadaan izin, data lama
dan konfigurasi tetap memiliki pemulihan, tanpa bahasa perpindahan kampus.

Kontrak target 14 Oktober 2026 memakai satu universitas dengan role Mahasiswa
dan Admin Universitas. Implementasi U02 sampai U06 mengikuti
[Roadmap](../implementation/ROADMAP.md#transisi-universitas-tunggal-u01-sampai-u06)
dan [matriks PRD](../product/PRD.md#matriks-kewenangan-inti). U01 memperbarui
kontrak; rincian surface existing di bawah tetap konteks runtime/transisi.

Runtime U03 menyatukan sumber izin admin pada membership UTY aktif, tanpa
bypass flag platform. Login admin menuju Ringkasan UTY; GET platform/afiliasi
lama beralih setelah otorisasi. Undangan dan status admin backend memakai
konfirmasi password, keputusan actual, revision serta proteksi admin terakhir.
Pemetaan akun lama hanya CLI terkontrol dengan dry run/cadangan/audit, bukan
registrasi publik atau pilihan role. UI pengaturan terpadu tersedia pada U05.

Mahasiswa memverifikasi WhatsApp dan membuat akun, membaca nama universitas
server, lalu mengisi NIM. Exact match roster atau keputusan admin mengaktifkan
afiliasi. Pending dan mismatch mempunyai pemulihan serta draft. Tidak ada
pilihan kampus atau afiliasi otomatis hanya karena satu universitas tersedia.
Nama universitas yang tidak tersedia atau tidak aktif menampilkan keadaan
terkunci dengan pemulihan, bukan dropdown kampus lain.

Alur mahasiswa tersebut tersedia pada U04. Shell, Beranda, profil serta daftar
proyek/kontribusi/portofolio membaca universitas yang sama. UI terpadu admin
tersedia pada U05; bukti teknis tidak menutup UAT/pilot atau concurrency MySQL U06.

Admin pertama diprovisikan melalui operasi deployment terkontrol. Admin
berikutnya diundang lewat WhatsApp, memverifikasi nomor dan menerima akses
universitas yang sama. Semua admin berizin menuju satu ruang Admin
Universitas; beberapa akun tetap mempunyai riwayat masing-masing.
Pengelolaan akses memerlukan autentikasi ulang yang sesuai, alasan dan audit;
pencabutan admin aktif terakhir ditolak dengan penjelasan dan langkah berikutnya.

Admin menemukan afiliasi atau kontribusi yang menunggu, membaca versi yang
diizinkan, lalu memutuskan dengan alasan. Draft privat dan kontribusi sendiri
tidak dapat ditinjau. Keputusan tim tetap milik pemilik proyek; izin portofolio
tetap milik mahasiswa. Bantuan kesempatan hanya dibaca oleh peninjau yang
ditunjuk dengan consent dan gate, bukan semua admin secara otomatis.

Menu target adalah Ringkasan, Mahasiswa, Roster mahasiswa, Validasi kontribusi,
Bantuan kesempatan dan Pengaturan. Landing serta tur memakai dua label role
inti setelah runtime sesuai; modul lanjutan tetap mengikuti status dan gate.
Jalur lama dialihkan dengan izin yang sah atau ditolak secara jelas. Keputusan
usang, dua admin bersamaan dan jaringan gagal tidak menimpa riwayat atau
menyatakan mutasi telah berhasil tanpa konfirmasi server.

## Ruang Admin Universitas U05

Semua menu admin menampilkan kepala operasi formal tanpa maskot. Motif latar
sesuai pekerjaan membedakan menu tanpa menjadi data atau kontrol. Peringkat
dan Pengaturan akun memakai versi admin; mahasiswa mempertahankan hero lama.
Nama universitas, tombol, alur filter, keputusan dan konfirmasi sandi tetap
berasal dari izin serta state existing. Tidak ada langkah atau command baru.

`Ringkasan -> Mahasiswa -> cari nama atau status -> Tinjau afiliasi -> kunci dan keputusan existing`

Daftar Mahasiswa hanya memuat identitas tampilan, program studi bila tersedia dan status afiliasi. Tidak membuka bukti profil atau kontak. Bantuan kesempatan membaca gate serta penunjukan peninjau sebelum menawarkan antrean, bukan otomatis memberi semua admin akses berkas.

`Pengaturan -> Profil universitas, Semester, Katalog keahlian atau Akun admin`

Profil universitas berasal dari konfigurasi deployment. Semester membaca roster aktif serta riwayat; perubahan melalui impor baru. Katalog memakai operasi existing tanpa mengklaim skill mahasiswa tervalidasi. Secret/provider dan pemilihan universitas tidak tersedia.

`Akun admin -> pilih tindakan -> baca konsekuensi -> konfirmasi sandi -> konfirmasi command -> respons server -> periksa daftar terbaru`

Konfirmasi sandi sendiri tidak mengirim undangan atau mengubah akses. Alasan serta revision keputusan dipertahankan ketika daftar berubah; konflik meminta menutup keputusan dan memilih sumber terbaru. Hasil belum pasti menahan command berikutnya sampai GET sukses. Tidak ada retry otomatis. Admin terakhir tetap terlindungi; pencabutan akses menyembunyikan data sebelumnya. Undangan lewat WhatsApp mempunyai status antrean/delivery dan expiry, tanpa token yang ditampilkan di daftar.

Landing, label role, bantuan mahasiswa dan undangan memakai Mahasiswa serta Admin Universitas. Nama UTY berasal dari server. Registrasi publik tetap mahasiswa; konfigurasi tidak tersedia dijelaskan tanpa kampus pengganti. Panduan existing tidak membuka gate atau menjalankan command.

## Pengenalan dari Landing Publik

Navbar dan footer menampilkan simbol logo konsep kedua beserta nama SATU.
Tautan identitas pada navbar tetap kembali ke awal halaman dan memiliki fokus
keyboard. Simbol yang sama dipakai auth, sidebar seluruh role, portofolio
publik, serta favicon. Pergantian identitas bukan langkah alur baru dan tidak
mengubah tujuan tautan atau kewenangan pengguna.

Pengunjung membaca nilai SATU pada hero terbuka, mengenali tiga hasil utama
melalui lembar ilustratif dengan tautan demo,
lalu mengikuti satu demo perjalanan mahasiswa tanpa karya terdahulu yang
berlabel Data synthetic, tanpa graf atau tabel hubungan pelengkap. Pilihan peran menjelaskan pekerjaan
serta batas akses, bukan mengubah jenis akun registrasi. Bagian privasi
membedakan portofolio yang diizinkan dari bukti dan diskusi privat.

Hero mengikuti contoh `satu-hero.png` dari pemilik produk. Label universitas,
judul dua baris beraksen garis lengkung, paragraf dan dua aksi berada di kiri.
Di kanan, burung SATU didampingi dua kartu konsep Proyek Kampus dan Bangun
portofolio, satu orbit tipis dengan dua titik biru serta landasan elips.
Ikon berlebih, avatar, kilau dan pita cahaya tebal dihapus. Latar gambar
terpisah mengikuti warna dan bentuk gelombang pada revisi terbaru referensi.
Dekorasi menjelaskan suasana kolaborasi dan bukan data akun.
Garis bawah judul serta detail ikon membawa aksen jingga dari bulu maskot,
diimbangi bidang ivory dan cahaya hangat transparan di belakang ilustrasi.
CTA utama dan navigasi tetap biru. Polesan warna tidak menambah langkah,
kontrol, klaim hasil atau gerakan maskot.
Saat beralih dari hero ke Cara kerja, gelombang latar memudar ke canvas biru
yang sama. Cara kerja meneruskan nuansa langit dengan cahaya biru lembut yang
transparan di kedua ujungnya, tanpa garis potong, gerak tambahan atau
perubahan tinggi hero. Teks, kartu dan tautan tetap berada pada alur semula.
Tiga pilihan penjelasan berikon berada di tengah di bawah kedua kolom.
Pada mobile, copy mendahului ilustrasi dan pilihan fitur. Teks serta semua
kontrol tetap HTML yang dapat diakses keyboard dan pembaca layar.

Panggung ilustrasi memakai versi HD dengan margin transparan yang lebih
rapat agar maskot tampak lebih besar. Sumber gambar mengikuti ukuran layar.
Seluruh artwork tetap utuh tanpa menghalangi teks, tombol atau navigasi;
pada laptop pendek, tingginya menyesuaikan ruang pembuka.

Navbar dan hero mengisi minimal satu layar pertama (100svh). Pada laptop
zoom 100%, seluruh isi hero terlihat, tetapi bagian manfaat belum muncul
sampai pengguna menggulir atau memilih Gulir untuk mengenal SATU. Tidak ada
scroll hijack, tinggi terkunci atau clipping. Mobile, teks panjang dan zoom
200% tetap mengalir vertikal. Navbar mempertahankan bentuk `navbar.png` dengan panel yang dipadatkan dan
batas samping sejajar konten landing. Tinggi panel desktop 76px, logo 36px,
judul merek 20px dan target tombol minimal 44px. Navbar memakai
pil menu dengan penanda section aktif, Masuk putih, dan Daftar mahasiswa biru dengan
panah miring melingkar serta bayangan lembut. Beranda kembali ke awal
landing; menu lain tetap menuju section SATU. Navigasi penuh mulai container
72rem, kemudian disclosure untuk layar sempit dan zoom. CTA hero tetap tanpa
bayangan. Fokus keyboard dan batas konten landing dipertahankan.

Penanda menu mengikuti section yang terlihat di bawah navbar, bukan selalu
Beranda. Klik menu atau tautan section lain, scroll manual, hash awal,
back/forward dan perubahan layout memperbarui pilihan yang sama pada desktop
dan mobile. Satu pilihan per navigasi memakai aria-current=location; section
tanpa menu mengikuti pilihan sebelumnya. Scroll manual tidak menulis hash
atau menambah riwayat. Perubahan penanda tidak memindahkan fokus.

Jika section atau pembungkusnya diganti ketika halaman terbuka, penanda
membaca ulang elemen aktual dan mengamati layout penggantinya. Elemen lama
yang sudah terlepas atau tidak ditampilkan tidak boleh mengaktifkan menu.
Perubahan tinggi isi tetap memperbarui posisi tanpa perlu memuat ulang halaman.

Memilih menu langsung memindahkan penanda ke tujuan dan menahannya selama
scroll otomatis melewati section lain. Pilihan menu berikutnya mengganti
tujuan segera. Setelah tujuan tercapai atau scroll berhenti, penanda kembali
mengikuti posisi. Wheel, sentuhan untuk menggulir dan tombol scroll keyboard
membatalkan penahanan agar navigasi manual tidak tertahan pada tujuan lama.
Pengurangan gerakan tetap dihormati dan anchor native tetap dipakai.
Pil putih desktop bergeser halus ke menu yang langsung diaktifkan, dengan
durasi 280ms dan lebar mengikuti label. Klik beruntun mengarahkan pil dari
posisi saat ini ke pilihan terbaru. Pengukuran awal dan reduced motion tidak
memainkan transisi. Dekorasi tidak mengambil fokus atau menerima klik;
penanda semantik tetap satu per navigasi. Disclosure mobile tetap menutup
setelah memilih menu.

Temukan proyek, Berkarya bersama dan Susun portofolio membuka dialog
penjelasan konsep melalui tap, Enter atau Space. Dialog hanya terbuka atas
tindakan eksplisit, tidak mengirim request atau mengubah akun. Fokus masuk
dan tetap berada di dialog; tombol Mengerti, Tutup atau Escape menutupnya
dan mengembalikan fokus ke pemicu terakhir. Penjelasan bukan chat atau fitur
AI. Tombol Sapa aku tidak tersedia. Gambar burung tidak berubah posisi,
ukuran atau transform ketika kursor melintas maupun dialog dibuka/ditutup.

Menu mobile tetap disclosure navigasi, bukan modal. Tab memiliki kontrol
panah, Home dan End. Pengunjung baru menuju registrasi mahasiswa, sementara
akun masuk menuju dashboard lewat Wayfinder. Demo perjalanan lokal tidak
memuat modul peta pelengkap. Reduced motion mempertahankan
isi serta tindakan tanpa entrance atau tilt.

Sejak 19 Oktober 2026, dropdown peta dan daftar hubungan pelengkap dihapus dari
landing. Pengunjung mengikuti satu simulasi perjalanan, lalu membaca penjelasan
peran. Tidak ada pemuatan graf, filter peta atau daftar hubungan tambahan.
Modul analitik dan izin aplikasi tidak berubah.

Bagian 03 sampai footer memakai canvas langit yang tersambung dengan demo.
Pengunjung memilih peran pada tab terang dan membaca penjelasan serta tiga
langkah pada lembar arsip. Ilustrasi hubungan mahasiswa dan Admin Universitas
hanya memperjelas konteks, bukan daftar pengguna atau statistik.

Privasi membedakan ringkasan karya dari bukti dan percakapan tim. Pilihan
berikon Hanya saya dan Publik mengubah label serta penjelasan contoh yang
sama, bukan izin akun. FAQ bernomor mempertahankan disclosure native dan
tautan kembali ke demo. Penutup ink memakai maskot dan sapaan statis,
bukan chat. Footer menampilkan identitas, navigasi dan nama universitas dari
server; informasi belum tersedia dinyatakan bila konteks hilang.

Tab keyboard, live region, fokus, anchor serta rute akun existing tetap
dipertahankan. Dekorasi tidak menangkap input. Mobile menumpuk konten dan
menyederhanakan panggung; layar besar tetap membatasi panjang paragraf.
Tidak ada animasi berulang, scroll hijack, command baru atau penyimpanan
simulasi. Reduced motion mempertahankan semua informasi.

### Demo Perjalanan T10

Landing memusatkan penjelasan pada satu demo. Hero mengenalkan kebutuhan mahasiswa, tiga ringkasan menjelaskan hasil yang dituju, lalu pengunjung mengikuti contoh Budi. Tidak ada perjalanan kedua atau tiga pratinjau panjang yang mengulang cerita. Pilihan peran berfokus pada mahasiswa dan operator kampus; modul lanjutan tidak menjadi ajakan utama. Tanya-jawab menjelaskan jalur pemula, keputusan tim, tinjauan dan izin berbagi sebelum ajakan membuat akun.

Bagian privasi menyediakan pilihan contoh Hanya saya dan Publik. Pilihan hanya mengganti pratinjau berlabel Data synthetic, tanpa menyimpan consent atau memublikasikan data. Ringkasan karya dibedakan dari berkas bukti dan percakapan tim. Penjelasan pilihan selalu tersedia dalam live region yang hemat.

Navigasi tahap demo berupa indeks vertikal terang mulai 1280px dan grid empat/dua kolom pada tablet/mobile. Nomor melingkar, bidang biru dan aria-current menjelaskan satu tahap aktif, bukan aktivitas akun yang sudah selesai. Kepala buku perjalanan memuat identitas Budi, Data synthetic dan Reset. Pilihan skenario beruraian pendek menjelaskan jalan utama, kapasitas penuh dan revisi. Panggung biru bergrid arsip serta kertas berlapis membedakan pratinjau dari cerita tanpa membuat kontrol palsu. Reveal sekali, fade pergantian 220ms dan respons kontrol mengikuti reduced motion; tidak ada animasi berulang atau gerak kartu saat hover. Panel peran dan izin berbagi tetap memakai lapisan arsip existing.

Demo menempatkan cerita singkat berdampingan dengan pratinjau yang berubah mengikuti tahap: profil Budi, peluang, pengajuan, peran tim, rancangan pekerjaan, kontribusi, keputusan kampus dan karya privat. Identitas aktor, status dan sumber tetap terbaca. Berikutnya menjadi satu tindakan lanjut di footer, bukan mengirim pengajuan atau keputusan nyata. Reset tersedia pada kepala; skenario penuh/revisi dan kembali tetap tersedia. Batas tiap tahap dapat dibaca pada disclosure. Panel mengikuti tinggi isinya. Tidak ada loop animasi, penyimpanan data demo, formulir palsu, atau kewajiban menuntaskan demo sebelum mendaftar.

`Profil tanpa karya -> peluang pemula -> pengajuan singkat -> keputusan pemilik -> tugas nyata -> kontribusi individual -> validasi/revisi -> karya privat -> pilihan berbagi`

Pengunjung mengikuti contoh Budi dengan Sebelumnya/Berikutnya atau memilih tahap. Skenario Kapasitas penuh menjelaskan bahwa pengajuan tidak memesan tempat dan keputusan perlu diperiksa ulang. Skenario Perlu revisi mempertahankan pengakuan sebagai hasil setelah bukti diperbaiki, bukan otomatis setelah mengirim. Reset kembali ke awal tanpa mengubah akun, consent atau data aplikasi. Semua keadaan merupakan simulasi lokal berlabel Data synthetic, bukan hasil pilot atau command nyata. Judul tahap menerima fokus saat tahap atau skenario berubah; tidak ada autoplay atau peta pelengkap.

## 1. Student Activation

`Nomor WhatsApp -> OTP -> username privat dan password -> consent -> pengajuan afiliasi wajib -> status peninjauan atau verifikasi -> afiliasi terverifikasi -> bekal kemampuan dan cara berkolaborasi -> Beranda`

### Aktivasi Satu Universitas U04

Mahasiswa membaca nama UTY tanpa memilih kampus. Pop-up pertama hanya memuat
NIM, fakultas, program studi dan angkatan masuk. Keempatnya wajib pada UI dan
server. Bekal kemampuan, cara berkolaborasi serta indikator tahapan profil belum
ditampilkan. Tombol tutup, Escape dan klik luar tidak menutup form wajib.
Keluar akun tersedia tanpa melewati pengajuan. Kewajiban pengajuan tetap
berlaku jika mahasiswa membuka editor profil melalui URL.
Ajukan afiliasi mengirim permintaan eksplisit, bukan membuat profil. Exact match roster
mengaktifkan afiliasi; roster belum tersedia atau mismatch membuka status
peninjauan. Periksa status afiliasi hanya membaca server. Keahlian, jadwal,
karya dan riwayat tim bukan syarat afiliasi atau penelusuran peluang setelah
akses terverifikasi. Profil existing dibuka melalui editor tanpa ditimpa.

Pengajuan tampil dalam dialog tengah dengan pengantar langit serta pose
maskot clipboard khusus afiliasi. Universitas read-only berada di atas empat
isian yang berpasangan pada desktop dan menumpuk pada mobile. Petunjuk
dipadatkan, tetapi peringatan bahwa data akademik tidak dapat diubah setelah
dikirim tetap jelas. Pengantar mobile ringkas; header dan form ikut digulir
pada layar pendek, sehingga Keluar akun, error serta Ajukan afiliasi dapat
dicapai. Ilustrasi bukan hasil verifikasi dan tidak menambah langkah.

Konfigurasi tidak tersedia, nomor belum verified atau akses suspended mempunyai
penjelasan terkunci. Tidak ada pilihan kampus lain atau retry POST otomatis.
Akun lama mengajukan afiliasi UTY dengan bukti yang sama; profil serta riwayat
kampus lama tidak dipindahkan. Bila konfigurasi berubah saat mengisi, draft
lama ditahan agar tidak dikirim sebagai profil kampus baru.

Setelah pengajuan pending dikonfirmasi tersimpan, modal menutup otomatis,
notifikasi pengajuan ditampilkan dan mahasiswa membaca status di Beranda.
Pemeriksaan status tetap dapat dibuka kembali; panel status ini dapat ditutup
karena pengajuan sudah tercatat. Setelah afiliasi verified, mahasiswa tanpa
profil melengkapi Bekal kemampuan dan Cara berkolaborasi dalam dua langkah.
Data akademik tidak diminta ulang. Editor Profil kemampuan juga dapat
menyelesaikan pelengkapan sehingga modal tidak menutupi editor yang sudah
berotorisasi. Form pelengkapan menutup setelah simpan dikonfirmasi, bukan
melalui Escape atau klik luar. Keahlian, karya dan jadwal tetap boleh kosong.

Saat pending_review biasa, Beranda menyapa mahasiswa lewat hero khusus dengan
maskot menunggu. Lihat status afiliasi menuju judul kartu informasi; kartu
tindakan Periksa afiliasi membuka panel status existing. Nama universitas,
status server serta batas penyimpanan profil dibaca bersama tanpa membuat
pengajuan baru. Roster yang berubah, revisi, penolakan atau keadaan terkunci
tetap mengikuti pemulihan masing-masing, bukan disamarkan sebagai menunggu.
Komposisi mengikuti banner panorama pada referensi `resources/images/mascot/reference/beranda-verif.png`, dengan maskot
menunggu sambil memangku buku dengan kedua sayap dan duduk langsung pada batu,
selaras dengan lengkung satu pita putih/jingga di sekitar 83%
lebar desktop lapang, serta teks/tindakan HTML di kiri. Ilustrasi bukan foto kampus
atau hasil peninjauan. Kartu di bawah banner mengikuti referensi yang sama:
aksen ivory pada pengajuan, bidang putih tanpa gambar latar pada afiliasi, dokumen 3D
pada Langkah utama, folder 3D pada proyek, serta panel pendukung dan strip
alur terstruktur. Ilustrasi bukan hasil persetujuan dan nomor alur bukan
tahap pengguna yang sudah selesai. Perubahan visual tidak mengubah
transisi aktivasi, draft, keputusan admin atau pembatasan akses.
Navigasi Inertia, pending dan jaringan gagal
mempertahankan draft dalam memori sesi akun. Fakultas, program studi dan
angkatan masuk yang dikirim bersama permohonan afiliasi tersimpan terenkripsi
sebagai draft server yang hanya dibaca mahasiswa pemilik. Nilai itu bukan profil
aktif dan tidak tampil di antrean admin. Setelah afiliasi disetujui, nilai
tersebut mengisi form Profil kemampuan dan draft dihapus ketika profil berhasil
disimpan. NIM yang belum diajukan serta isian lain tidak disimpan ke storage
browser persisten. Hasil pengiriman yang belum pasti menahan command sampai
pemeriksaan status terbaru. Revisi/penolakan menawarkan periksa isian dan
pengajuan eksplisit, suspended tidak dapat dipulihkan melalui pengajuan ulang.

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
Login menampilkan burung yang menyapa kembali dengan sedikit membungkuk,
sedangkan registrasi menampilkan ajakan mulai sambil membawa jurnal kosong.
Pose registrasi tetap sama pada tahap OTP. Variasi ini hanya ilustrasi,
bukan respons terhadap sandi, status pengiriman atau keberhasilan verifikasi.
Identitas burung dan tas SATU, balon HTML, serta interaksi sapaan tetap sama;
halaman lain mempertahankan pose existing.
Sapaan tekan memakai teks ringkas Halo lagi! pada login dan Ayo mulai! pada
register agar tidak menutupi wajah pada slot mobile.
Motif arsip, halo, dan aksen kecil hanya dekorasi. Pengantar tidak menjadi langkah
tambahan dan tidak mengubah login, pengiriman OTP, verifikasi WhatsApp,
pemulihan akun, maupun afiliasi. Pada mobile, pengantar diringkas agar form
cepat terlihat. Login dan register mengikuti referensi `public/referensi/login.png`:
latar lengkung biru-putih, panggung orbit dan landasan, balon di kiri burung,
form putih berikon serta tombol pil bergradasi. Pada layar besar, dua kolom
berkembang proporsional dan komposisi dipusatkan di ruang bawah header.
Pemusatan hanya memakai ruang yang tersedia, bukan offset negatif: form
register, OTP dan error panjang tetap dimulai di bawah header dan dapat
digulir seluruhnya. Satu kolom mobile juga terpusat jika muat, dengan form
sebagai prioritas dan dekorasi yang diringkas. Ukuran container, form, maskot,
balon dan tipografi tumbuh terbatas; layar lebar pendek tetap lebih ringkas.
Tepi kanan tautan beranda sejajar dengan kartu form.
Login diberi jarak antarisian lebih lega daripada register; bantuan tetap terlihat,
input 16px, serta kontrol minimal 44px. Form panjang, error, dan tahap OTP
tetap memakai scroll halaman native tanpa footer terkunci atau konten dipotong.

### Profil Kemampuan T03

Profil akademik pada aktivasi dan editor memakai angkatan masuk empat digit,
fakultas, lalu program yang tersedia dalam fakultas tersebut. Tahun masuk
bukan tingkat studi. Mengganti fakultas mengharuskan pemilihan program baru,
tanpa mengubah NIM, keahlian, jadwal atau izin berbagi. Nilai kosong pada profil
legacy dapat dilengkapi satu kali. Pengajuan afiliasi baru mewajibkan seluruh
data akademik tersebut. Nilai akademik nonkosong menjadi tetap setelah dikirim bersama
pengajuan afiliasi atau disimpan pada profil; mahasiswa tidak dapat mengganti
atau mengosongkannya dari modal maupun editor. Field yang kosong dapat diisi
satu kali. Server menolak perubahan nilai pada pengajuan ulang dan update
profil. Data lama yang tidak sesuai tetap ditampilkan tanpa menyiratkan bahwa
mahasiswa dapat mengubahnya.
Status menunggu afiliasi bukan kegagalan pendaftaran atau penilaian kemampuan.
Pengajuan yang belum dapat diverifikasi otomatis menunggu Admin Universitas;
mahasiswa cukup memeriksa status, kecuali daftar mahasiswa telah diperbarui
dan sistem meminta pengajuan ulang. Fakultas, program studi, dan angkatan masuk
yang dikirim bersama pengajuan menjadi draft terenkripsi privat. Nilai nonkosong
di draft tidak dapat diubah mahasiswa saat pengajuan ulang. Setelah afiliasi
terverifikasi, nilai itu mengisi form Profil kemampuan tanpa input ulang dan
ditampilkan hanya-baca. Nilai akademik nonkosong pada profil juga tetap
hanya-baca; nilai kosong dapat dilengkapi satu kali. Profil baru tetap disimpan
setelah afiliasi terverifikasi dan mahasiswa menyimpan
pelengkapannya. Isian profil lain yang belum dikirim tetap lokal dan dapat hilang
saat halaman dimuat ulang atau ditutup.

Pop-up pelengkapan tidak menampilkan akhiran `(opsional)` pada label Angkatan
masuk, Fakultas, Program studi, dan Tentang dirimu. Bagian Tentang dirimu pada
Profil kemampuan juga menghilangkan akhiran itu dari label Angkatan masuk,
Fakultas, Program studi, dan Cerita singkat. Penyederhanaan ini tidak mengubah
fakta bahwa kolom profil legacy boleh kosong. Pengajuan afiliasi baru wajib
memuat NIM, fakultas, program studi dan angkatan masuk.

`Afiliasi terverifikasi -> Profil kemampuan -> kemampuan atau minat -> jadwal opsional -> bukti awal opsional -> simpan -> jelajahi peluang`

Menu akun dan arahan Beranda membuka Profil kemampuan lewat named route.
Profil existing dimuat tanpa meminta afiliasi ulang. Minat menyatakan arah
belajar atau kolaborasi, bukan kemampuan tervalidasi. Mahasiswa boleh menyimpan
tanpa karya dan tanpa jadwal; label tersimpan tidak sama dengan siap untuk
pencocokan. Keahlian dan jadwal diperlukan untuk kesiapan pencocokan, tetapi
penelusuran peluang tetap mengikuti afiliasi, bukan riwayat kontribusi.

Pada pelengkapan afiliasi, keahlian dan jadwal dapat dilewati. Jika peninjauan
manual menunda afiliasi, fakultas, program studi dan angkatan masuk yang sudah
dikirim mengisi otomatis editor setelah kampus mengonfirmasi afiliasi. Mahasiswa
tidak perlu mengetik ulang. Profil yang sudah ada dibuka lewat editor, bukan
ditimpa dengan draft modal. Menutup dan membuka kembali modal mempertahankan
isian lokal dalam sesi.

Jadwal existing dipertahankan per baris, termasuk jam dan zona waktu berbeda.
Simpan profil dan jadwal atomik. Kegagalan validasi atau jaringan mempertahankan
draft. Snapshot yang berubah meminta muat ulang, dengan konfirmasi sebelum
mengganti draft. Penyimpanan profil pada editor yang dikonfirmasi server
menampilkan notifikasi `Data profil berhasil tersimpan.` lalu mengarahkan
mahasiswa ke Beranda, baik saat membuat maupun memperbarui profil yang sudah
ada sejak onboarding. Penyelesaian pop-up pelengkapan juga menampilkan
notifikasi dan menuju Beranda setelah hasil simpan dikonfirmasi. Validasi atau
jaringan gagal mempertahankan halaman serta draft tanpa notifikasi sukses.
Jika validasi konteks kampus tidak memastikan apakah profil sudah ada,
mahasiswa memuat data tersimpan sebelum mengulang tindakan. Izin
portofolio/perekrut tidak diubah oleh simpan kemampuan.

Bukti awal hanya tautan HTTPS privat berlabel Belum ditinjau. Kampus menerima
berkas dan bukti melalui pengajuan Kontribusi existing, bukan otomatis melalui
profil. Sumber disetujui dibaca dari keputusan kampus pada kontribusi pemilik;
persetujuan itu tidak menyatakan seluruh keahlian pemilik telah diuji.
Tautan awal tidak masuk proyeksi publik/perekrut dan tidak diambil server.

Form afiliasi wajib dan pelengkapan profil belum tersimpan tidak dapat ditutup
secara manual. Panel pending yang sudah tercatat boleh ditutup; suspended dan
konfigurasi terkunci menyediakan penjelasan, Periksa status serta Keluar akun.
Profil yang belum ada setelah verifikasi membuka pelengkapan dua langkah
atau editor Profil kemampuan. Profil yang sudah ada tidak dipaksa mengulang
pelengkapan hanya karena keahlian atau jadwal masih kosong.

### Pengenalan Beranda Mahasiswa

Maskot pada kelima hero memakai ukuran dan penempatan Beranda yang sama melalui
StudentHeroMascot. Kanvas 208px pada mobile berada di bawah teks; layar lebih
lebar memakai 39%/36% lebar hero dengan batas 320px/384px. Tepi bawah keluar
28px, disertai jarak aman ke bagian berikutnya dan navbar. Pose tiap menu serta
latar yang berbeda tetap. Ini perubahan presentasi, bukan tindakan, izin atau
tahap baru. Pending dan forbidden mempertahankan pemulihan existing.

Latar hero tiap menu membantu mengenali konteks tanpa menambah langkah:
halaman kampus untuk Beranda, rancangan untuk Proyek, jurnal untuk Kontribusi,
galeri bingkai kosong untuk Portofolio, dan skala ukur tanpa angka untuk
Peringkat. Seluruhnya dekoratif, bukan data, karya atau tanda selesai.
Area teks tetap terang dan gambar memudar pada ruang sempit. Fallback gradasi
menjaga fungsi ketika gambar gagal. Pose, ukuran, animasi masuk satu kali,
izin, tindakan dan state tidak berubah. Beranda pending tetap memakai panorama
referensi yang disetujui; halaman detail serta editor tidak berubah.

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
berupa empat penjelasan bernomor terhubung, bukan status perjalanan mahasiswa. Aksen
lembar arsip mendampingi maskot pada hero dan kondisi proyek kosong. Respons
hover, tekan, dan fokus tidak mengubah data atau memindahkan susunan halaman.
Masukan rekomendasi yang sedang dikirim memiliki label processing yang terlihat;
hasilnya tetap mengikuti server. Reduced motion mempertahankan semua kontrol
dan informasi tanpa gerak tambahan.

Pada afiliasi terverifikasi, kartu mengikuti bahasa visual referensi `resources/images/mascot/reference/beranda-verif.png`:
Langkah utama berilustrasi dokumen, lembar proyek ringkas, rekomendasi biru
beraksen jingga, serta Bekal kolaborasi dan Validasi dalam satu panel. Alasan,
batas kecocokan, versi serta masukan rekomendasi tidak disembunyikan. Hero
welcome tetap dengan margin atas 16px mulai sm dan 24px mulai lg. Pemilihan
presentasi tidak memakai status pending untuk mahasiswa verified dan tidak
mengubah prioritas tindakan, pemeriksaan akses atau transisi aktivasi.

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

Hero Proyek, Kontribusi, Portofolio dan Peringkat menempatkan baris tombol
lebih rendah, dengan jarak yang sama dari deskripsi: 36px pada mobile dan
48px mulai 640px. Konteks universitas serta catatan sesudah tombol ikut turun.
Perubahan hanya ritme ruang, bukan tujuan tautan, command, status atau urutan
kerja. Konten membungkus secara alami; hero Beranda dan Pengaturan akun tetap.

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

Toggle header dan tutup drawer kini memakai ikon tiga garis yang sama; nama
aksesibel tetap menjelaskan Buka navigasi atau Tutup navigasi. Ikon menu memakai
outline seragam dengan penanda aktif yang tenang dan border oranye selektif.
Kartu identitas universitas menampilkan logo UTY dari pemilik produk, dengan
nama serta status afiliasi existing. Logo bukan tanda persetujuan dan tidak
mengganti identitas SATU. Tidak mengubah menu tersedia atau tujuan tautannya.

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
jika profil dan entry portofolio sama-sama Publik, tidak ditarik, bersumber
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

Daftar Peluang dan Proyek saya memakai kepala ringkas dengan pose burung
project-plan membawa rancangan proyek, bukan ilustrasi pada tiap kartu.
Latar hero memakai plate rancangan kertas yang memudar
ke area teks, dengan cahaya hangat serta margin oranye. Motif hanya dekorasi
statis; bidang baca diperkuat pada mobile agar teks tetap tenang.
Maskot memakai ukuran dan posisi Beranda melalui StudentHeroMascot, termasuk
ruang ilustrasi mobile serta siluet yang melewati tepi bawah tanpa menutupi teks.
Saat menu dibuka, maskot masuk sekali dengan fade dan gerak naik 420ms seperti
Beranda. Filter, pagination dan pergantian tampilan tidak mengulang animasi;
reduced motion langsung menampilkan pose akhir tanpa menahan akses ke kontrol.
Navigasi dua tampilan, pencarian dan pintasan pemula tampil sebelum hasil.
Baris peran memperjelas penerimaan pemula serta tempat aktual, sementara
keahlian, deadline dan pemilik tetap tersedia. Biru-putih dominan dengan
aksen oranye selektif mengikuti Beranda. Bantuan kesempatan tetap pilihan
setelah hasil, bukan langkah wajib sebelum menelusuri. Hero dan kartu tidak
bereaksi terhadap hover; fokus keyboard tetap jelas. Penyelarasan ini hanya
mengubah presentasi daftar, bukan alur detail, editor atau ruang kerja.

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

Hero Kontribusi memakai komponen bersama dengan Proyek, dengan maskot khusus
menyusun jurnal dan pensil. Latar jurnal berlapis, aksen oranye dan animasi masuk tetap
selaras, tanpa cap atau tanda persetujuan. Hero tidak mengganti status catatan
dan tidak menyatakan bukti sudah disetujui. Susun kontribusi tetap mengikuti
izin; Muat ulang mempertahankan status pemrosesan dan pemulihan existing.
Pencarian, filter, daftar, detail serta pengiriman tidak berubah.

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

Hero daftar memakai StudentMenuHero dan pose memperlihatkan map karya terbuka,
dengan latar galeri bingkai kosong serta aksen oranye yang selaras dengan Proyek/Kontribusi.
Ilustrasi bukan karya pengguna atau bukti verifikasi. Kendali profil, tautan
Kontribusi dan Muat ulang tetap mengikuti izin; tidak mengubah pilihan berbagi.
Proporsi mengikuti lebar region, animasi masuk satu kali dan reduced motion
statis. Detail dan portofolio publik tetap pada desain serta batas existing.

`Kontribusi disetujui -> karya tersimpan -> buka Portofolio -> periksa sumber dan status -> pilih jangkauan karya -> simpan jangkauan`

Koleksi menyediakan pencarian dan filter lokal terhadap karya yang sudah dimuat.
Pengaturan profil dan karya hanya Hanya saya serta Publik. Profil Hanya saya
menutup seluruh karya bagi non-pemilik, termasuk admin. Profil Publik hanya
membuka karya yang juga Publik. Jangkauan lama diperlakukan privat tanpa
perubahan data otomatis. Izin peninjauan kontribusi bukan izin portofolio privat.
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

`Buka kendali profil -> pilih Hanya saya atau Publik -> simpan pengaturan`

Bukti privat
dan catatan kampus tidak masuk halaman publik. Refresh mempertahankan filter
dan mengambil karya terkini. Simpan membawa revisi privasi wajib yang mencakup
state dan jejak audit, termasuk perubahan bolak-balik pada detik sama.
Hasil jaringan belum pasti/5xx/konflik menahan pengiriman sampai pemeriksaan
GET berhasil. GET gagal tidak membuka retry mutasi. Perubahan server yang berbeda dari token formulir
ditampilkan sebagai stale; mengambil pengaturan terbaru adalah tindakan
eksplisit, bukan overwrite otomatis. Validasi atau kegagalan koneksi tidak
menghapus pilihan lokal, dan error menerima fokus.

Pada detail mobile, pengaturan karya tersedia sebelum ringkasan panjang.
Pengunjung halaman publik hanya membaca identitas dan karya yang diproyeksikan
server. Saat publikasi tidak tersedia, identitas serta karya tidak ditampilkan.

## Penguatan Kesempatan, Kerja Bersama dan Peninjauan

`Peluang -> Peran pemula -> peran menerima pemula dengan tempat tersedia -> baca hasil dan kriteria -> ajukan minat tertulis -> keputusan pemilik beralasan`.
Pintasan memakai filter server existing. Membuka pintasan tidak mengajukan atau menerima otomatis. Editor peran memberi bantuan menyatakan pekerjaan awal yang terukur serta pendampingan; contoh hanya mengisi kolom kosong atas pilihan pemilik.

`Tim aktif -> sepakati hasil -> bagi bagian pekerjaan -> tentukan pemeriksaan oleh rekan -> simpan tugas -> kerjakan dan unggah bukti -> ajukan kontribusi individual`.
Contoh deskripsi membantu menuliskan hasil, bagian sendiri dan koordinasi tanpa menambahkan kewajiban chat atau konfirmasi tim. Catatan tetap draft sampai disimpan dan tidak otomatis menugaskan anggota. Keanggotaan atau banyaknya percakapan bukan pembuktian hubungan kerja baru.

`Validasi kontribusi -> Pengajuan menunggu atau Hasil disetujui -> cari nama tampilan, proyek atau isi karya -> pilih berkas -> baca versi serta keputusan yang diizinkan`.
Pencarian, status dan urutan diperiksa server, tersimpan pada URL dan dibawa pada pagination. Ringkasan hasil disetujui memakai klaim serta ringkasan versi yang telah dikirim; tidak membuka draft, bukti profil atau izin portofolio baru. Detail peninjauan tetap mengikuti Policy existing.

Urutan pengajuan memakai audit pengiriman versi aktual dengan pemilik serta universitas yang konsisten. Sumber waktu yang belum tersedia ditampilkan apa adanya dan berada setelah waktu yang diketahui. Tim menetapkan peninjau utama/cadangan dan jadwal pemeriksaan di luar aplikasi sesuai panduan operasi; UI tidak menjanjikan batas waktu. Filter dan pemeriksaan GET tidak mencatat keputusan atau mengirim ulang notifikasi. Pergantian yang membuang catatan keputusan memerlukan konfirmasi existing.

## 5. Leaderboard

Refresh awal menampilkan shell dan skeleton hasil, lalu data atau keadaan gagal
yang dapat dipulihkan. Resolver deferred yang gagal tidak meninggalkan skeleton
tanpa akhir. Muat ulang hasil hanya membaca GET dengan semester/kategori yang
sama. Jaringan/HTTP gagal menyediakan retry; 401/403 tetap menyembunyikan data
lama. Tidak ada pengiriman consent, award atau rebuild karena refresh.

Persetujuan membawa versi tersimpan. Halaman lama ditolak tanpa menimpa pilihan
baru; mahasiswa membaca error dan memeriksa status melalui GET sebelum mencoba
lagi. Nomor individual disesuaikan setelah izin aktual disaring. Approved tanpa
award dijelaskan pada panel XP pribadi tanpa estimasi. Rekonsiliasi terjadwal
mencoba lagi setelah sumber semester historis valid, tanpa mengulang approval
atau membuat karya. Muat ulang tetap hanya membaca. Jumlah XP serta izin melihat
daftar individual tidak berubah.

Hero tersedia memakai komponen bersama dan maskot membaca laporan dengan kaca
pembesar, bukan perayaan juara. Pahami perhitungan menuju penjelasan existing;
Kontribusi saya hanya tersedia bagi mahasiswa. Latar skala ukur, oranye sekunder,
proporsi dan motion mengikuti menu inti. Pergantian kategori/semester tidak
mengulang animasi atau mengirim consent. Forbidden tetap pada pemulihan
existing tanpa hasil lama, dan izin operator tidak berubah.

Peringkat dibuka langsung setelah Portofolio pada navigasi mahasiswa, serta
melalui menu pembacaan kelompok Admin Universitas. Kontribusi approved
memicu ledger XP, kemudian perhitungan ulang setelah commit. Reversal serta
perubahan persetujuan juga meminta pembaruan. Queue worker memprosesnya;
refresh halaman hanya membaca hasil, tidak menjalankan award atau rebuild.
Ringkasan XP pribadi berasal dari ledger semester terpilih dan tersedia tanpa
opt-in. Tidak ada XP dari membuat akun, pesan, profil atau bergabung tim.
Semester roster terbaru tetap ditawarkan walaupun belum ada snapshot.
Ketika jumlah anggota contoh di bawah lima, perlindungan kelompok tetap aktif.

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

`Ruang Admin Universitas -> filter antrean -> baca NIM dan WhatsApp lengkap -> Tinjau berkas -> ambil kunci -> cocokkan identitas dan hasil roster -> pilih keputusan serta alasan -> simpan atau lepas kunci`

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
NIM serta WhatsApp lengkap berasal dari allowlist server khusus peninjau
afiliasi UTY berwenang, bukan direkonstruksi dari data tersamar. Gunakan hanya
untuk mencocokkan identitas mahasiswa. Nomor yang tidak tersedia ditandai
Belum tersedia. Daftar Mahasiswa dan undangan tidak membuka data tambahan.
Tidak ada username privat, identitas rekaan, tautan bukti baru, inclusion
signal, atau perubahan alur kunci dan keputusan. Akses ditolak menyembunyikan
antrean dan panel yang sebelumnya terbuka.

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

`Menu akun -> Pengaturan -> Profil, Keamanan, Tampilan, atau Hak Data`

Keempat kategori selalu dapat dipilih melalui navigasi bernama. Pilihan aktif
memiliki label Aktif dan aria-current; dua kolom mobile menjadi empat kolom
pada layar lebar. Hero bersama memakai maskot account-care yang memegang kunci
dan latar arsip pribadi. Ilustrasi bersifat dekoratif, tidak menyatakan akun
sudah aman, terverifikasi, atau permintaan data telah dipenuhi. Teks, status
dan kontrol tetap HTML. Ukuran maskot mengikuti hero menu Beranda, tanpa hover
atau animasi berulang; reduced motion menampilkan pose statis.

Profil mengubah nama akun dan private username untuk masuk. Username tidak
ditampilkan pada hero atau halaman publik. Isian dipertahankan ketika request
gagal dan penyimpanan memerlukan tindakan eksplisit. Afiliasi kampus dan
jangkauan Portofolio bukan pengaturan identitas akun ini.

`Keamanan -> password saat ini -> password baru -> konfirmasi -> perbarui -> respons server`

Jika halaman terlindungi meminta konfirmasi ulang, alurnya adalah
`halaman tujuan -> Konfirmasi password -> password saat ini -> konfirmasi -> tujuan server`.
Halaman konfirmasi memakai latar login/register dan maskot confirm-access
statis dengan gembok. Konfirmasi tidak mengubah password atau mengeksekusi
tindakan sensitif lain. Tombol kembali ke Pengaturan akun tidak mengirim form.
Password yang gagal validasi dikosongkan; error summary menerima fokus.
Gangguan jaringan atau sesi kedaluwarsa tidak dianggap konfirmasi berhasil.
Tujuan sesudah sukses tetap milik server, bukan parameter redirect baru di UI.

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

## Penggabungan modul lanjutan dengan alur inti

Hak Data tersedia dari Pengaturan. Ekspor memakai unduhan JSON, bukan navigasi Inertia. Koreksi dan pembatasan hanya mencatat permintaan untuk tindak lanjut. Hapus akun memakai dialog bersama dengan password saat ini dan mempertahankan audit.

Nomor WhatsApp pada detail kandidat atau riwayat permintaan hanya muncul dari handoff backend setelah persetujuan yang diizinkan. Nomor tidak dibuka oleh klik melihat profil. Snapshot lama disembunyikan ketika akses dicabut.

Operator berwenang dapat memilih Buat koneksi sandbox, memasukkan kunci penyedia, dan mengirim POST eksplisit. GET tidak membuat koneksi default. Validasi mempertahankan isian; hasil jaringan belum pasti diperiksa melalui muat ulang. Provider nyata tetap memerlukan persetujuan eksternal.
