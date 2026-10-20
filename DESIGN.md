---
name: SATU
description: Buku Besar Kolaborasi dengan maskot burung yang menemani mahasiswa bekerja bersama
---

# Design System: SATU

## Arah Visual

SATU menggabungkan struktur **Buku Besar Kolaborasi** dengan suasana langit yang terang, ramah, dan penuh rasa ingin tahu. Informasi tetap tertata dan dapat dipercaya. Maskot burung raja udang menjadi teman visual yang mengantar pengguna ke tindakan berikutnya.

Landing memakai mode **Persuade**. Auth, onboarding, dan dashboard memakai mode **Operate**. Palet biru, putih dan oranye mengikuti maskot: biru menjadi warna utama, putih memberi ruang baca, dan oranye menjadi warna sekunder. Sudut yang lembut serta ilustrasi maskot membangun suasana. Hierarki data, izin, status, deadline, dan aksi tetap terbaca terlebih dahulu. Maskot boleh keluar dari tepi card atau panggungnya selama tidak menutupi teks, kontrol, atau batas viewport.

Gunakan maskot yang sama pada semua role dan route. Pertahankan bentuk, proporsi, pola bulu biru, dada ivory, marking jingga, paruh grafit, kaki, dan tas buku cross-body. Referensi sumber disimpan di `resources/images/mascot/reference/`: `maskot-01-burung-arsip.png` untuk material dan ekspresi, serta `maskot-01-burung-arsip-turnaround.png` untuk identitas dan empat sudut pandang. Artwork runtime teroptimasi disimpan di `public/images/mascot-*.webp`.

**Karakter visual:**

- Biru langit yang lapang, kartu putih, dan CTA kobalt yang mudah dikenali.
- Maskot menjadi focal point landing dan greeting dashboard, serta pemandu kecil pada auth dan onboarding.
- Card dipakai untuk grouping yang jelas; bobot visual mengikuti prioritas tindakan dan data, bukan membuat semua informasi tampak setara.
- Oranye adalah warna sekunder SATU, bukan hanya warna maskot atau penanda wajib. Setiap redesign memakai sentuhan oranye yang terlihat dan selektif pada badge, ikon pendukung, penekanan judul, bidang sekunder atau aksi sekunder yang sesuai. Biru serta putih tetap dominan. Terapkan pada surface yang sedang dikerjakan, bukan perubahan massal halaman lain. Jingga gelap juga dipakai untuk bintang wajib dengan petunjuk serta atribut required. Status domain tetap memakai warna semantic khusus.
- Interaksi terasa hidup melalui pilihan tahap, tab, hover, tap, dan feedback singkat. Motion tidak menjadi syarat untuk memahami atau menyelesaikan task.

## Tokens

### Warna

| Token            | Nilai   | Pemakaian                           |
| ---------------- | ------- | ----------------------------------- |
| Canvas           | #F3F9FF | Latar global                        |
| Surface          | #FFFFFF | Form, card, menu, panel             |
| Ink              | #17345A | Teks utama dan icon penting         |
| Muted            | #526B85 | Copy pendukung dan metadata         |
| Primary          | #1764E8 | CTA dan selected navigation         |
| Primary hover    | #1454C4 | Hover dan pressed CTA               |
| Focus            | #1746B0 | Focus keyboard yang terlihat        |
| Soft blue        | #E7F2FF | Selected surface dan grouped region |
| Soft border      | #D9E8F5 | Pemisah dan card border             |
| Input boundary   | #7892AE | Batas input dan select              |
| Feather accent   | #FFB85C | Dekorasi maskot, bukan status       |
| Orange secondary | #FFB85C | Aksen sekunder identitas SATU       |
| Orange soft      | #FFF4E5 | Bidang sekunder hangat              |
| Orange ink       | #C2410C | Teks dan ikon pada bidang hangat    |
| Orange border    | #F2D3A9 | Batas dekoratif bidang hangat       |
| Required mark    | #C2410C | Bintang wajib register dan afiliasi |

Primary/putih memiliki rasio kontras 5.22:1, muted/putih 5.53:1, dan input boundary memenuhi kontras non-teks terhadap canvas. Token verified, pending, dan correction tetap dipakai untuk status domain, selalu bersama label atau icon yang menjelaskan artinya.

Oranye terang dipakai untuk aksen atau latar, bukan teks kecil di atas putih
maupun latar tombol berteks putih. Gunakan Orange ink untuk teks/ikon hangat
dan periksa kontras terhadap permukaan aktual. Oranye sekunder bukan status
pending, error atau verified, dan tidak mengubah warna fokus maupun aksi utama.

### Tipografi

**Familjen Grotesk** tetap menjadi font display dan body. **Azeret Mono** hanya untuk referensi, timestamp, dan metadata teknis. Familjen menggunakan fallback sans-serif umum tanpa emoji.

| Level    | Ukuran                     | Pemakaian                    |
| -------- | -------------------------- | ---------------------------- |
| Display  | clamp(2.5rem, 5vw, 4.5rem) | Headline landing             |
| Headline | 2rem / 1.15                | Greeting dan pesan utama     |
| Title    | 1.25rem / 1.3              | Nama section dan object      |
| Body     | 1rem / 1.6                 | Form, instruksi, explanation |
| Label    | 0.75rem / 1.35             | Status dan metadata          |

### Bentuk dan Elevasi

| Token                  | Nilai                            |
| ---------------------- | -------------------------------- |
| radius-xs, radius-sm   | 4px, 6px                         |
| radius-md, radius-lg   | 12px, 16px                       |
| radius-xl, radius-2xl  | 20px, 24px                       |
| radius-3xl, radius-4xl | 28px, 32px                       |
| shadow-sm              | 0 4px 14px rgb(23 52 90 / 0.045) |
| shadow-md              | 0 12px 32px rgb(23 52 90 / 0.09) |
| shadow-lg              | 0 20px 60px rgb(23 52 90 / 0.14) |

Card utama memakai radius 24px, hero sampai 32px, dialog 24px, dan button/input 12px. Shadow membantu memisahkan layer; row tabel tidak mendapat shadow sendiri. Sheet mobile tetap menempel ke tepi layar.

Primary action dan form penting memakai tinggi 44px. Kontrol padat boleh memakai 36px. Ring fokus memakai outline 2px atau lebih, offset 2px, dan tidak dihilangkan oleh custom state.

### Motion

- Durasi token: fast 140ms, standard 220ms, dan deliberate 420ms.
- Maskot masuk sekali dengan gerak singkat. Hover atau tap memberi lift/tilt kecil; pointer parallax dibatasi pada pointer halus dan tidak mengubah task.
- Tidak ada animasi berulang otomatis, scroll hijack, atau gerak yang menahan informasi penting.
- prefers-reduced-motion menampilkan gambar statis dan menonaktifkan entrance, parallax, transform, serta smooth scroll.

## Komposisi Surface

### Hero Admin Universitas

Seluruh hero ruang Admin Universitas memakai CampusOperationHeader formal,
tanpa maskot, plate ilustrasi mahasiswa, sapaan atau headline promosi. Ini
termasuk Ringkasan, Mahasiswa, peninjauan afiliasi, Roster, Validasi kontribusi,
Peringkat, Bantuan kesempatan, Pengaturan universitas beserta submenunya,
fitur lanjutan yang diizinkan, serta Pengaturan akun pribadi ketika admin
membukanya. Hero mahasiswa dan halaman autentikasi tidak ikut berubah.

Bahasa Buku Besar Kolaborasi diterjemahkan sebagai lembar operasi putih,
border lembut, radius 24px, bayangan tipis dan ikon outline dalam tile biru.
Judul 24px/30px menjelaskan pekerjaan, copy 14px/24px dan nama universitas
tetap dari server. Aksen oranye selektif berupa detail motif dan eyebrow,
bukan warna status baru. Padding 20px/24px/32px menyesuaikan region.

Latar berupa SVG/CSS statis tanpa bitmap: panel rangkuman pada Ringkasan,
lembar identitas pada Mahasiswa/afiliasi/admin, tabel kosong pada roster dan
kredit, dokumen pada validasi, guratan ukur pada peringkat, lembar berjalin
pada bantuan/inklusi, susunan tag pada katalog, jalur pertukaran pada
sinkronisasi, dan garis pengaturan pada universitas/akun. Motif berkontras
rendah terkonsentrasi di kanan dan memudar sebelum area teks, tidak berupa
grafik data, status, hasil evaluasi atau kontrol. Dekorasi aria-hidden dan
pointer-events none, tanpa hover atau animasi.

Baris tindakan dan catatan tetap mengikuti izin/keadaan server. Pada mobile
judul, kampus, tindakan serta catatan membungkus dalam alur normal tanpa slot
maskot kosong. Satu h1, fokus terlihat, target 44px, 320px sampai ultrawide,
zoom 200%, reduced motion dan keadaan izin dicabut tetap terjaga. Keamanan,
filter, dialog, konfirmasi password serta command tidak berubah.

### Landing

Seluruh sistem memakai simbol burung-buku konsep kedua. Master transparan
berada di `public/image/logo-satu-konsep-02.png`; asset runtime bersama adalah
`public/images/logo.png` berukuran 256px. Wordmark SATU tetap berupa teks.
Komponen AppLogo dipakai oleh landing, auth, sidebar seluruh role, dan header
portofolio publik. Simbol tampil utuh dengan object-contain: 32px secara default,
56px pada sidebar, 44px pada footer, serta 36px pada navbar landing.
Fokus tautan dan identitas maskot tetap dipertahankan.

Favicon memakai simbol yang sama: PNG transparan 64px, ICO multiukuran
16/32/48px, SVG mandiri dengan bitmap tertanam, serta apple-touch-icon 180px
berlatar putih. URL logo dan ikon memiliki versi logo-02 untuk memperbarui
cache browser. Asset pada path lama diganti, bukan hanya tautannya.

Gunakan header putih berlapis, hero editorial terbuka, dan panggung langit khusus maskot. Lembar manfaat berilustrasi, demo kesempatan sampai pengakuan, pilihan peran, batas privasi, dan footer tetap menjelaskan produk dengan fakta runtime yang tersedia.

Landing memakai komposisi editorial terbuka. Navbar mengikuti referensi
`navbar.png`: panel putih kebiruan ringkas dengan batas samping yang sejajar konten
landing, memakai gutter bersama. Panel setinggi 76px dengan sudut 26px pada desktop, border putih serta bayangan
lembut. Logo burung dan wordmark SATU berada di kiri. Menu dibungkus pil
biru pucat dengan pilihan aktif putih dan teks biru. Tombol Masuk berbentuk
pil putih berborder; Daftar mahasiswa berupa pil biru bergradasi dengan panah
miring dalam lingkaran tipis. CTA navbar boleh memakai bayangan biru lembut
sesuai referensi ini. Wadah di belakang panel tetap transparan. Hero tidak
lagi berupa kotak biru penuh: teks berada pada canvas terang dan maskot
mempunyai panggung langit sendiri. Judul Familjen Grotesk 40px sampai 72px,
berkembang sampai 96px pada ultrawide. Body 16px sampai 18px (24px pada hero
ultrawide); metadata minimal 12px. Semua section tetap memakai gutter
clamp(1rem, 5vw, 1.25rem) pada mobile, lalu clamp(1.25rem, 7.2vw, 18rem).

Hero mengikuti revisi terbaru referensi pemilik produk `satu-hero.png`:
judul ink dan biru dua baris dengan garis aksen, label universitas, paragraf
serta dua aksi di kiri; burung besar di kanan. Hanya dua lembar konsep,
Proyek Kampus dan Bangun portofolio, mendampingi burung. Satu garis orbit
tipis dengan dua titik biru serta landasan elips memberi kedalaman.
Tidak ada kumpulan ikon pendidikan, pesawat, hati, kilau, avatar atau pita
cahaya tebal di sekitar maskot.

Aksen hero mengikuti tiga warna maskot: biru tetap dominan, putih memberi
ruang, dan feather accent #FFB85C menjadi garis lengkung di bawah judul.
Ikon universitas memakai bidang ivory hangat; ikon kolaborasi di antara tiga
pilihan fitur serta ikon demo memakai jingga gelap #9A510F agar tetap terbaca.
Border aksi demo bernuansa pasir #EAC99B, tanpa mengganti CTA utama biru.
Cahaya radial jingga transparan di belakang ilustrasi memberi kehangatan,
bukan lingkaran solid, kartu tambahan atau informasi baru. Cahaya berada dalam
panggung, statis dan tidak menerima input. Warna jingga tidak dipakai sebagai
status, izin, penanda menu atau jaminan hasil. Ukuran hero, artwork, copy,
fokus, dialog serta perilaku navbar tidak berubah.

Latar pembuka memakai asset gambar terpisah yang disiapkan dari referensi
terbaru: gradasi putih ke biru pucat, lengkungan atas, lengkungan kiri
serta lapisan gelombang bawah dan kanan mengikuti contoh. Gunakan asset
tersebut secara langsung, bukan gelombang SVG rekaan. Pada rasio referensi,
gambar memenuhi pembuka tanpa memotong motif; layar lain menyesuaikan ukuran
latar serta konten. Teks, navbar dan kontrol tetap HTML responsif.

Hero dan Cara kerja memakai canvas biru yang sama tanpa batas horizontal
kontras. Ujung bawah gambar latar hero memudar selama 7rem sampai 14rem,
menyesuaikan lebar layar, agar gelombang menyatu dengan canvas tanpa terpotong.
Cara kerja meneruskan suasana langit melalui cahaya biru sangat lembut di
belakang kartu, dengan ujung atas dan bawah transparan. Lapisan dekoratif
tidak menerima input, tidak menutupi isi dan tidak mengubah tinggi atau jarak
section. Ini transisi warna statis, bukan animasi scroll atau artwork baru.

CTA hero tidak memakai bayangan, termasuk saat hover atau fokus. CTA navbar
mengikuti elevasi lembut pada referensi `navbar.png`. Identitas burung, warna bulu dan tas tetap mengikuti master
SATU. Dua kartu di dalam ilustrasi hanya dekorasi konsep, bukan data akun,
statistik, keputusan validasi atau kontrol interaktif. Tiga pilihan fitur
berikon tetap di tengah bawah komposisi. Maskot tidak bergerak saat hover,
memilih topik atau membuka penjelasan.

Master ilustrasi sederhana dan latar disimpan sebagai
`resources/images/mascot/landing-hero-calm.png` dan
`resources/images/mascot/landing-hero-background.png`. Provenance dan prompt
kedua asset dicatat pada `landing-hero-calm.provenance.json` di folder yang sama.
Output runtime transparan dan latar memakai WebP dengan sumber responsif.
Ilustrasi serta latar bersifat dekoratif dan memakai alt kosong.

Tiga manfaat menjadi lembar ilustratif berbeda: pencarian peran, hubungan
kerja dan arsip kontribusi. Ilustrasi HTML/SVG hanya menjelaskan konsep, bukan
data akun, tombol palsu, statistik atau keputusan nyata. Kartu memiliki
judul, nomor tahap dan tautan demo. Motif arsip, radius 24px, bidang biru lembut
dan elevasi selektif tetap mewarisi SATU.

Urutan isi adalah hero, tiga ringkasan manfaat, satu demo perjalanan utama
synthetic tanpa peta pelengkap, pilihan mahasiswa/operator, batas privasi,
tanya-jawab, dan ajakan mulai. Demo menggantikan perjalanan dan pratinjau
berulang. Lembar contoh bersusun, penanda tahap dan ikon aktor memberi
kedalaman; status tetap menggunakan teks. Pilihan peran memakai tab keyboard
dan panel mengikuti isi, tanpa minimum tinggi besar. Tanya-jawab memakai
pemisah tipis serta disclosure native. Pilihan jangkauan karya menggunakan
kontrol 44px, penanda centang dan status teks yang berubah pada pratinjau
synthetic; pilihan tidak disimpan ke akun. Penutup memakai bidang ink dengan
teks putih dan maskot existing. Semua contoh bertanda Data synthetic dan
bukan command nyata.
Bidang putih, bagian terbuka, serta panggung biru bergantian agar tiap bagian
memiliki karakter tanpa mengganti identitas global.

Pembuka mengisi minimal satu viewport kecil (100svh), termasuk area navbar 100px
pada desktop dan 88px pada mobile/tablet. Navigasi penuh muncul mulai lebar
container 72rem; di bawahnya memakai disclosure mobile. Pilihan aktif mengikuti
section yang terlihat tepat di bawah navbar. Klik menu, scroll manual,
tautan hash awal, riwayat browser dan perubahan layout memperbarui penanda
yang sama pada desktop/mobile. Satu tautan per navigasi memakai
aria-current=location. Beranda aktif pada area awal; section tanpa menu
mengikuti pilihan sebelumnya. Scroll manual tidak menulis hash atau
menambahkan riwayat. Fokus dan reduced motion tetap mengikuti anchor native.
Saat menu dipilih, penanda langsung berpindah ke tujuan dan tidak mengikuti
section perantara selama scroll otomatis. Klik berikutnya mengganti tujuan.
Sesudah tujuan tercapai, scroll berhenti, atau pengguna menggulir manual,
penanda kembali mengikuti posisi section tanpa mengubah fokus atau riwayat.
Pada navigasi desktop, satu pil putih dekoratif bergeser ke posisi pilihan
aktif selama 280ms, termasuk penyesuaian lebar sesuai teks menu. Pil mengikuti
klik terbaru tanpa pantulan atau animasi berulang. Posisi awal tidak dianimasikan,
dan reduced motion memindahkannya langsung. Teks, fokus dan aria-current
tetap diperbarui segera. Mobile mempertahankan pilihan aktif dalam disclosure
yang menutup setelah menu dipilih.
Hero memakai sisa tinggi layar dengan ruang vertikal seimbang dan tautan
Gulir untuk mengenal SATU di bawah. Pada laptop 1280x720, 1366x768, 1440x900,
1536x864 dan layar besar, isi hero awal terlihat utuh pada zoom 100%;
bagian berikutnya baru muncul setelah digulir. Gunakan min-height dan alur
dokumen, bukan tinggi terkunci, clipping atau scroll snap. Mobile, teks
panjang dan zoom tetap boleh memanjangkan halaman.

Maskot hero merupakan ilustrasi statis, bukan tombol. Tidak ada Sapa aku,
parallax, hover atau reaksi gambar saat memilih topik. Temukan proyek,
Berkarya bersama dan Susun portofolio memakai kontrol teks minimal 44px.
Memilih topik membuka dialog penjelasan lokal hanya atas tindakan pengguna,
bukan balon yang menggeser komposisi. Dialog memiliki judul, uraian singkat,
tombol Mengerti dan kontrol Tutup; Escape menutupnya dan fokus kembali ke
pemicu terakhir. Fokus tetap berada di dialog selama terbuka. Tidak ada
navigasi otomatis, perubahan akun atau klaim fitur AI. Posisi, ukuran serta
transform burung tetap sama sebelum dan sesudah membuka penjelasan.
Reduced motion meniadakan transisi tanpa menghapus isi atau kontrol.

Entrance dan reveal terjadi sekali selama 420ms dengan jeda berurutan maksimal
160ms pada kelompok elemen. Jalur dekoratif tergambar sekali saat bagian
terlihat. Pergantian panel dan respons kontrol memakai 220ms. Hanya ikon atau
dekorasi yang bergerak saat hover, bukan posisi kartu atau teks. Konten tetap terlihat tanpa observer atau JavaScript.
Tidak ada loop otomatis atau scroll hijack. Reduced motion meniadakan entrance,
tilt, reveal, dan smooth scroll. Hero memakai WebP existing berprioritas tinggi;
maskot penutup lazy. Landing hanya memuat demo perjalanan utama, tanpa modul graf pelengkap.

### Landing: Peran sampai Penutup

Bagian 03 sampai ajakan mulai memakai satu canvas langit berkelanjutan,
berawal #F8FBFF sesuai ujung demo dan berakhir #F3F9FF sesuai awal footer.
Cahaya biru sangat lembut memudar di tepi; tidak ada blok putih penuh atau
garis horizontal kontras antarseksi. Permukaan putih dipakai untuk informasi,
bukan mengganti latar setiap section. Gutter bersama dan tinggi mengikuti isi.

Peran dibuka dengan heading ink/biru serta ilustrasi hubungan mahasiswa dan
Admin Universitas yang dekoratif, bukan statistik. Tab terang memperlihatkan
satu pilihan putih dengan ikon, centang dan aria-selected. Panel putih bersudut
28px mempertemukan penjelasan terbuka dengan jalur tiga langkah pada lembar
arsip biru. Langkah memakai nomor serta konektor dekoratif, tanpa klaim tugas
sudah selesai. Min-height kosong tidak ditambahkan. Tab panah, Home dan End,
focus ring dan konteks penjelasan existing dipertahankan.

Privasi menampilkan perbedaan ringkasan karya yang dapat dibagikan dengan
bukti serta percakapan yang tidak ikut menjadi portofolio publik. Tiga pilihan
Hanya saya dan Publik memakai ikon serta label. Lembar contoh berlapis
memperbarui label jangkauan dan penjelasan sopan, bukan consent akun.
Identitas buku/arsip menggantikan dekorasi sidik jari. Data synthetic dan
batas simulasi tetap terlihat, tanpa perlu membaca hover atau warna saja.

Tanya-jawab memakai indeks 05 dan satu lembar putih berisi baris disclosure
native bernomor. Nomor dekoratif, teks pertanyaan dan tombol buka/tutup
terbaca jelas; jawaban membungkus tanpa tinggi terkunci. Catatan pengantar
menautkan kembali ke demo, bukan chat atau kanal bantuan rekaan.

Ajakan mulai mempertahankan bidang ink, gradasi biru, ilustrasi arsip dan
maskot guide existing dengan panggung serta sapaan dekoratif statis.
Maskot tidak menjadi tombol atau chat. Konten dan CTA mendahului ilustrasi
pada layar sempit; dekorasi tambahan boleh disembunyikan di mobile.
Footer menyambung canvas dengan identitas, navigasi, nama universitas dari
server dan watermark SATU dekoratif yang lebih tenang. Tautan kembali ke
atas tetap anchor native. Semua aksi akun memakai Wayfinder existing.

Warna/fade singkat mengikuti 220ms dan reduced motion; tidak ada hover yang
menggeser kartu, animasi berulang atau scroll hijack. Kontrol minimal 44px,
fokus tidak terpotong, kontras AA, reflow 320px sampai layar besar serta zoom
200% tetap menjadi pemeriksaan. Tidak ada data, provider, izin atau fitur baru.

### Demo Perjalanan Utama T10

Demo memakai komposisi buku perjalanan kolaborasi: bingkai putih radius 28px,
bayangan lembut, kepala berikon buku dan label Data synthetic yang terlihat.
Judul section memisahkan pesan ink dan biru, dengan catatan ringkas bahwa
pengunjung dapat mencoba tanpa akun. Tidak memakai chrome browser palsu.
Mulai 1280px, delapan tahap menjadi indeks vertikal terang di kiri; tablet
memakai empat kolom dan mobile dua kolom tanpa gulir internal. Nomor dalam
lingkaran, bidang biru dan aria-current menandai satu tahap aktif. Angka
menjelaskan urutan cerita, bukan penyelesaian aktivitas atau progres akun.

Cerita dan panggung pratinjau berdampingan mulai 1024px, menumpuk pada mobile.
Judul 28px sampai 44px, body 16px/28px dan metadata minimal 12px mewarisi
Familjen. Panggung memakai cahaya biru, grid arsip sangat halus dan lapisan
kertas dekoratif. Profil menonjolkan bekal pemula, proyek menampilkan buku,
pengajuan menghubungkan mahasiswa dan pemilik, keputusan membedakan peran,
pekerjaan serta portofolio memakai sketsa, bukti memakai lembar berkas dan
peninjauan memakai tanda keputusan. Fakta tetap berupa teks, bukan kontrol
palsu, sertifikat, skor atau grafik rekaan. Status selalu ikon dan label;
warna perhatian tidak dianggap persetujuan atau penolakan kemampuan.

Batas penjelasan tetap tersedia pada disclosure. Berikutnya dan Sebelumnya
menjadi satu pasangan navigasi di footer bersama petunjuk kelanjutan.
Tiga pilihan skenario memakai tombol berlabel dan uraian pendek, dengan
penanda pilihan selain warna. Reset tetap di kepala. Catatan simulasi lokal
terpisah dari status akun dan tidak menyimpan data. Lebar pratinjau maksimal
40rem dan cerita 42ch; celah serta padding fluid menyesuaikan layar besar.
Tinggi mengikuti isi tanpa ruang kosong terkunci. Pergantian pratinjau memakai
fade singkat 220ms, tanpa gerak kartu saat hover atau loop. Reduced motion
meniadakan transisi. Kontrol 44px, fokus terlihat, disabled not-allowed dan
reflow tetap berlaku. Tidak ada dropdown, peta atau daftar hubungan pelengkap
pada landing; transisi setelah demo langsung menuju penjelasan peran.

### Demo Peta Kolaborasi

Riwayat desain, bukan surface landing aktif. Sejak 19 Oktober 2026, dropdown
pelengkap beserta pemuatan modulnya dihapus dari landing. Catatan berikut
dipertahankan sebagai referensi komponen lama, bukan acceptance rilis landing.

Demo menggunakan kartu arsip HTML dan konektor SVG dekoratif, bukan titik
canvas kecil. Panggung biru berpola titik halus, lapisan kertas, border lembut,
dan bayangan md membangun kedalaman tanpa kartu terangkat saat hover. Ikon
folder, tim, catatan, perisai centang, dan buku berasal dari Lucide existing;
mahasiswa memakai inisial synthetic. Judul simpul 18px sampai 20px, metadata
minimal 12px, dan seluruh pilihan berlabel serta bertarget minimal 44px.

Lima simpul utama terbaca horizontal bila ruang peta mencukupi, lalu vertikal
pada mobile. Anggota tim menjadi cabang yang terpisah. Peta menggunakan viewport
maksimal 42rem dengan scroll native dan hint gulir, bukan scroll hijack.
Focus keyboard dapat menjangkau seluruh simpul. Biru menandai pilihan
dan hubungan terdekat; simpul lain tetap terbaca. Status Dipilih dan Terhubung
tidak hanya bergantung pada warna. Filter Fokus tahap mempertahankan konteks
peta, sementara Daftar hubungan menyaring catatan sesuai pilihan. Panel detail
di bawah peta menjelaskan objek, peran, sumber, hubungan, dan langkah berikutnya.

Data synthetic mengikuti satu kontribusi Budi sampai keputusan dan portofolio
Budi. Keanggotaan Siti tidak dijadikan sumber karya Budi. Tab Peta kolaborasi
dan Daftar hubungan mempertahankan pilihan, mendukung keyboard, dan menyediakan
representasi tabel/text yang setara. Reset kembali ke peta, semua tahap, dan
tanpa pilihan. Transisi warna serta panel singkat 220ms; tidak ada gerakan
otomatis berulang. Konektor tidak menjadi syarat memahami hubungan, dan reduced
motion tetap statis. Loading memakai geometri peta; error modul tetap memiliki
pemulihan Muat ulang halaman tanpa menghilangkan CTA landing.

### Auth dan Onboarding

Informasi akademik menggunakan input angkatan masuk empat digit, serta dua
dropdown Fakultas dan Program studi yang berdampingan mulai sm dan menumpuk
pada mobile. Kontrol native berukuran minimal 44px dengan font 16px, label
terhubung, bantuan dan error per isian mengikuti token input SATU. Program
yang belum dapat dipilih memakai cursor not-allowed dan petunjuk fakultas.
Tidak menambah langkah, hero, aset atau identitas visual baru.

Aktivasi U04 mewarisi dialog serta tiga langkah existing, tanpa identitas
visual baru. Universitas tujuan berupa lembar biru lembut read-only dengan
nama 16px bold dan copy 14px/24px. NIM mendahului bekal profil. Pending memakai
bidang semantic dengan pemeriksaan status. Fakultas, program studi, dan
angkatan masuk yang dikirim bersama permohonan ditandai sebagai draft pribadi;
isian tersebut otomatis mengisi form Profil kemampuan setelah afiliasi
terverifikasi. Isian profil lain yang belum tersimpan dijelaskan terpisah.
Locked memakai uraian singkat pada
header, pesan pemulihan pada isi dan tidak mengulang indikator langkah.
Maskot mobile berada utuh pada slot 80px, gambar 96px dengan inset atas nol;
tidak menimpa heading atau tombol tutup. Footer dapat membungkus dan ikut
scroll, bukan menutup form. Pilihan hari menjadi empat kolom pada mobile lalu
tujuh pada tablet agar target tetap minimal 44px. Field error terhubung dengan
ringkasan; keyboard, pemulihan fokus dan reduced motion tetap diwarisi.

Auth memakai panel form putih dan ruang ilustrasi maskot yang terpisah. Pada mobile, form mendapat prioritas dan maskot mengintip dari tepi panel tanpa mengecilkan tap target. Onboarding memisahkan progress, form, dan status afiliasi; area form dapat digulir, tombol tahap tetap dapat dicapai, dan maskot tidak berada di focus order kecuali disajikan sebagai tombol sapaan.

Login dan registrasi mengikuti referensi pemilik produk `public/referensi/login.png`.
Latar gambar biru-putih mempertahankan lengkungan besar dan cahaya lembut dari
referensi, tanpa teks, form atau maskot yang tertanam di dalam gambar. Panel
kiri memakai heading ink/biru, orbit putih tipis, bidang langit berpola titik,
arsip, bintang kecil serta keping biru/jingga yang dekoratif. Maskot berdiri
pada landasan elips dan balon HTML berada di sebelah kirinya. Kartu fitur dari
landing tidak diulang. Semua dekorasi mengabaikan pointer dan urutan fokus.
Pose login khusus menyapa kembali melalui gestur membungkuk ringan dan sayap
dekat dada; pose registrasi mengajak mulai dengan jurnal kecil tanpa tulisan
serta sayap mengarah ke formulir. Keduanya tetap burung yang sama, bukan gaya
render atau identitas baru. Warna, pola bulu, material, paruh, kaki dan tas
cross-body mengikuti dua master referensi. PNG transparan serta provenance
berada di resources/images/mascot; WebP runtime login dan register dipisahkan
dari welcome/guide/peek agar pemakaian halaman lain tidak berubah. Gambar
dekoratif tetap ber-alt kosong dalam tombol sapaan yang berlabel. Jurnal
bukan form, data atau hasil validasi.

Container berada di tengah horizontal dan ruang isi memusat secara vertikal
di bawah header ketika tinggi mencukupi. Flex dan grid tetap mengikuti tinggi
isi: form register, error atau OTP yang lebih panjang memperbesar halaman dan
dapat digulir dari atas. Tidak memakai tinggi terkunci, transform negatif atau
pemusatan yang memotong tepi atas. Desktop memakai dua kolom dengan gutter
6.5vw, container berkembang terbatas sampai 128rem dan form sampai 44rem.
Pada rasio referensi 1672x941, komposisi mendekati proporsi referensi, bukan
form sempit yang tersisa di pojok layar. Header, form dan tautan beranda
memakai batas kanan yang sama. Heading pengantar 44px sampai 80px, heading
form 28px sampai 40px, teks isian minimal 16px, kontrol 44px sampai 60px, serta
padding kartu 24px sampai 48px mengikuti lebar dan tinggi layar. Layar pendek
memakai kepadatan yang lebih ringkas tanpa memotong bantuan atau error.

Form putih memiliki sudut 28px sampai 36px, bayangan biru lembut, label serta
petunjuk tetap terlihat, ikon username dan password seperti referensi, dan
CTA biru bergradasi dengan bentuk pil. Ikon dekoratif tidak mengganti label,
tidak menangkap klik dan tidak menimpa toggle sandi. Border input tetap memakai
kontras token aksesibel. Checkbox Ingat saya tidak otomatis dicentang untuk
meniru gambar. Register memakai bahasa visual yang sama dengan jarak lebih
padat untuk lima isian, persetujuan dan tahap OTP existing. Ketika isi form
memiliki lebar minimal 420px, Nama/Nama pengguna dan Password/Konfirmasi
password berdampingan; nomor WhatsApp, persetujuan serta aksi tetap penuh.
Di bawah lebar itu semua field menumpuk tanpa memperkecil target.

Tombol Masuk pada login serta Kirim kode verifikasi pada register tidak berubah
warna, bayangan atau posisi saat hover. Pointer, fokus keyboard, processing dan
disabled tetap tersedia. Hanya register yang memakai bintang jingga gelap
setelah label isian wajib, termasuk persetujuan dan kode OTP. Petunjuk singkat
menjelaskan arti bintang; atribut required tetap menjadi sumber semantik.
Login tidak memakai bintang. Penanda bukan pengganti pesan validasi.

Di bawah 1024px, satu kolom berada di tengah, heading promosi disembunyikan,
maskot 80px dan satu balon singkat mendahului form. Bidang langit diringkas,
dekorasi kecil disembunyikan. Ruang vertikal sisa tetap dibagi seimbang jika
muat; bila tidak, semua isi mengalir dan dapat digulir. Reflow 320px, zoom 200%,
fokus, state validasi/jaringan dan reduced motion wajib utuh. Tidak menambah
animasi berulang atau mengubah username, sandi, WhatsApp, OTP, recovery maupun
afiliasi. Recovery tidak menerima layout baru ini.

Konfirmasi password mewarisi background auth-entry-background, header, grid
terpusat dan kartu putih login/register. Panel kiri memakai pengantar tentang
kendali akun, balon HTML ringkas dan pose confirm-access yang memegang gembok
kuningan. Warna biru, putih serta aksen oranye mengikuti token SATU. Maskot
statis, bukan tombol sapaan, status berhasil atau hasil pemeriksaan keamanan.
Field password saat ini memakai ikon dekoratif, toggle bernama, bantuan serta
bintang jingga gelap dengan atribut required. CTA Konfirmasi dan lanjutkan
tidak berubah saat hover; processing/disabled serta fokus tetap jelas. Tautan
Pengaturan akun memberi jalan keluar tanpa mengirim konfirmasi. Error summary
menerima fokus, validasi gagal mengosongkan password dan respons belum pasti
tidak mengklaim berhasil. Form tetap menuju route Fortify existing melalui
Wayfinder dan pengalihan tujuan diputuskan server, bukan URL kiriman browser.

### Pop-up Pengajuan Afiliasi

Pengajuan afiliasi mewarisi canvas langit, ink, biru, putih, radius dan font
SATU, dengan oranye sekunder pada badge pengantar, garis penekanan judul,
bidang bubble ivory hangat dan cahaya lembut di panggung maskot. Border dan
ikon bubble ikut memakai token hangat. Aksi utama tetap biru, warna status
tidak berubah, dan aksen tidak menambah elemen atau animasi.
Dialog berada di tengah dengan lebar terbatas 72rem dan tinggi mengikuti
isi, maksimal 94svh. Desktop memakai pengantar biru sekitar sepertiga lebar
serta lembar form putih. Pada mobile, pengantar menjadi strip ringkas dan
seluruh kolom form, termasuk header, dapat digulir agar layar pendek serta
zoom tidak memotong isian atau tindakan akhir. Pada tinggi maksimal 540px,
pengantar disembunyikan agar formulir mendapat ruang. Tidak ada tinggi kosong yang
dipaksakan. Form pelengkapan kemampuan setelah verifikasi tidak dirombak.

Maskot khusus affiliation-check membawa clipboard identitas kosong dan
menunjuk lembar, bukan tanda persetujuan, kartu mahasiswa nyata atau hasil
verifikasi. Identitas, bulu, warna dan tas buku mengikuti dua referensi master.
PNG transparan serta provenance tersimpan; WebP responsif terpisah dari pose
login dan register. Ilustrasi statis, alt kosong, tidak menjadi target fokus,
dan tidak menutupi teks. Bubble HTML memberi arahan sesuai pengajuan,
peninjauan atau keadaan terkunci. Bidang lengkung serta landasan elips cukup
menjadi atmosfer, tanpa tumpukan kartu dekoratif.

Nama universitas dari server tampil dalam strip read-only. NIM dan angkatan
berdampingan, disusul fakultas serta program studi yang saling terkait;
mobile menumpuk. Label tetap terlihat, kontrol minimal 48px dengan teks
16px dan batas input aksesibel.
Isian afiliasi yang wajib dan masih dapat diisi memakai bintang jingga gelap
setelah label NIM, angkatan, fakultas dan program studi. Nama universitas serta
nilai akademik yang sudah terkunci tidak diberi bintang. Arti bintang
dijelaskan pada pengantar; penanda aria-hidden tidak mengganti atribut required.
Petunjuk ringkas dekat field; peringatan
bahwa data akademik tidak dapat diubah setelah dikirim tampil sekali dengan
jelas. Panel pencocokan menjelaskan penggunaan NIM dan WhatsApp terverifikasi,
bukan klaim afiliasi telah disetujui. Ajukan afiliasi menjadi aksi utama yang
statis saat hover; pointer, fokus, disabled dan pemrosesan tetap jelas.

Dialog wajib tetap menahan Escape serta klik luar, tanpa tombol tutup.
Keluar akun tersedia. Error, jaringan belum pasti, pending, penolakan/revisi,
konfigurasi hilang dan suspended mempertahankan pemulihan serta draft existing.
Tidak menambah field, tahap, request otomatis atau perubahan otorisasi.

### Dashboard dan Shell

Profil kemampuan mewarisi AppPage, header putih ke accent ringkas, radius
24px, shadow-sm dan judul 24px/30px. Lembar formulir putih shadow-md berpadding
20px/24px membedakan informasi, keahlian/minat dan jadwal. Label pernyataan
sendiri serta status kesiapan memakai teks/ikon dan token existing, bukan
skor atau progres. Bukti opsional berada pada disclosure tenang. Panel bantuan
20rem/22rem mulai xl menumpuk pada mobile; kontrol minimal 44px, fokus terlihat,
footer tidak fixed, dan motion 220ms menghormati reduced motion. Tidak membuat
tema, aset atau hero promosi baru untuk profil.

Navigasi inti memakai empat menu mahasiswa serta empat operasi kampus yang
menunjang kolaborasi. Fitur lanjutan ditempatkan pada disclosure berlabel yang
lebih tenang, tanpa palet atau identitas baru. Pilihan Peluang dan Proyek saya
memakai kontrol 44px, bidang biru lembut serta penanda teks/semantik. Menu
lanjutan aktif tetap terlihat pada disclosure yang terbuka. Pengelompokan ini
tidak mengubah warna, logo, hero maskot, izin, maupun consumer data existing.

Student dashboard menempatkan salam, satu nextAction yang nyata, dan pekerjaan aktif pada kolom utama. Maskot keluar dari hero card ke ruang dekorasi yang disediakan. Rekomendasi dan explanation berada di panel pendukung. Tidak ada streak, XP, goal, completion percent, atau leaderboard palsu.

Pembaruan T05 mempertahankan panel rekomendasi biru lembut dan hierarki
pendukung. Status antrean, kedaluwarsa, konfigurasi dan gagal memakai teks serta
ikon semantic, tanpa progres persen atau animasi berulang. Alasan dan
keterbatasan mendahului metadata versi/waktu. Perbarui rekomendasi, Periksa
status dan Jelajahi peluang bertarget 44px, membungkus pada mobile dan memiliki
fokus terlihat. Request singkat memakai status inline; antrean backend bukan
loading skeleton tanpa batas.

Beranda memakai hero selebar area konten dengan gradasi biru langit, ruang teks
yang lapang, dan panggung maskot terpisah. Di bawah hero, kolom pekerjaan utama
dan panel rekomendasi memakai grid dua kolom mulai ukuran xl, lalu menumpuk
pada layar lebih kecil. Langkah utama berupa lembar kerja putih/biru berelevasi
lembut, gelombang dekoratif, ikon kompas kobalt, judul dominan, fakta berborder,
dan footer tindakan. Proyek aktif memiliki kepala berikon dalam
satu lembar putih dengan row berpemisah, label langkah berikutnya, serta
bidang deadline semantic. Tidak ada shadow pada setiap row saat diam.
Panel rekomendasi biru lembut menonjolkan nama proyek, peran, serta alasan
pencocokan; tindakan outline menjaga bobotnya di bawah langkah utama.
Bekal profil dan informasi validasi dikelompokkan dalam satu kartu pendukung.
Ringkasan alur menutup halaman dengan empat penjelasan bernomor terhubung,
bukan progress tracker. Kartu referensi memakai radius 18px, gutter 16px,
serta tombol beradius 12px. Hero mempertahankan maskot welcome dan sapaan,
ditambah latar halaman kampus ilustratif sesuai kontrak Latar hero menu mahasiswa.
Motif arsip tetap tersedia pada kondisi proyek kosong, bukan pada setiap kartu. Hero
terverifikasi memiliki margin atas 16px mulai sm dan 24px mulai lg, naik
sedikit tanpa mengubah desain, isi atau maskot welcome. Keadaan lain memakai
margin atas tambahan 24px mulai sm dan 48px mulai lg untuk
menjaga maskot serta ring fokusnya terpisah dari navbar. Padding shell dan
jarak hero mobile tetap sama.

Beranda saat afiliasi pending_review memakai varian tersendiri hanya jika
universitas siap, WhatsApp terverifikasi dan roster tidak meminta pengajuan
ulang. Hero mengikuti referensi pemilik produk `resources/images/mascot/reference/beranda-verif.png`: banner
panorama kampus biru/putih dengan border putih, radius 18px dan tinggi desktop
sekitar 190px sampai 200px pada ruang desktop yang cukup. Sapaan berikon tangan jingga, judul navy dengan
kata tercatat berwarna biru, dua baris penjelasan dan CTA biru berada di kiri.
Maskot waiting-review berada sekitar 83% lebar banner, bukan menempel ke tepi
kanan. Pusat maskot dan lengkung lingkaran putih/oranye selaras. Lengkung
memakai satu pita lebar transparan dengan sorot jingga lembut di kanan atas,
bukan dua cincin tebal yang terpisah. Pose waiting-review memakai artwork
mascot-waiting-lap: maskot duduk pada dudukan putih-biru sebelumnya sambil
memangku satu buku tertutup dengan kedua sayap. Buku tidak menjadi alas duduk
atau pijakan. Ekspresi tenang menunggu, identitas serta tas cross-body tetap.
Buku dan maskot menjadi satu asset transparan tanpa batu bertekstur.
Dudukan memakai kembali gundukan CSS rendah cembung dengan puncak ivory,
bayangan kontak dan sisi depan biru, selebar sekitar 1,4 kali kanvas maskot.
Penempatan maskot disesuaikan agar duduk menempel pada permukaan tersebut.
Lengkung, kilau dan teks tetap HTML/CSS.
Kilau jingga kecil mengikuti tiga posisi pada referensi.
Kaki tetap terpisah dari batas bawah banner.
Pada ruang desktop lebih sempit, komposisi bergeser agar teks tetap utuh.
Artwork kampus hanya ilustrasi dekoratif, bukan foto atau bukti
verifikasi universitas. Asset panorama tidak mengandung teks, maskot atau UI;
nama, status, tombol dan maskot terpisah sebagai HTML. Bidang baca terang
menjaga kontras. Jangan mengubah sidebar agar menyerupai navigasi rekaan pada
gambar. Banner tidak mendapat badge atau caption tambahan. Pada mobile, teks
dan tindakan tetap utuh sementara kampus serta maskot memakai ruang tersendiri
tanpa menutupi kontrol. Artwork statis dan tidak keluar ke navbar. Tautan
Lihat status afiliasi menuju heading kartu status, bukan POST.

Kartu di bawah banner mengikuti detail referensi `resources/images/mascot/reference/beranda-verif.png`, bukan lembar polos.
Kartu Afiliasi kampus sedang ditinjau memakai ikon dokumen jingga, lengkung
ivory pada sudut kiri bawah, kilau kecil, header Pengajuan tercatat dan badge
pending semantic di kanan. Periksa afiliasi berupa tombol outline biru.
Kartu Menunggu verifikasi afiliasi memakai bidang putih tanpa gambar latar,
universitas server dan catatan batas akses. Panorama hanya digunakan pada hero.
Keduanya berdampingan jika ruang konten mencukupi, menumpuk pada mobile.

Langkah utama memakai gradasi putih/biru, tiga fakta dalam bidang berborder
tipis serta ilustrasi dokumen 3D di sudut kanan bawah, di atas gelombang biru.
Ilustrasi tidak memuat checkmark atau simbol persetujuan karena status masih
menunggu. Proyek aktif menjadi lembar putih dengan kondisi kosong bergaris
putus-putus, ikon folder, tindakan existing dan folder 3D kecil di kanan.
Panel rekomendasi memakai ikon bohlam jingga dan bidang status biru lembut.
Bekal kolaborasi serta validasi kontribusi digabung secara visual dalam satu
lembar pendukung, bukan kartu terpisah dengan dekorasi baru. Ringkasan alur
menjadi strip putih/biru dengan pengantar di kiri, empat nomor terhubung dan
aksi bantuan di kanan pada layar lebar. Nomor menjelaskan urutan produk,
bukan tahap verifikasi yang telah selesai. Deskripsi serta batas proses tetap
tersedia, bukan disembunyikan demi meniru gambar. Kartu bersudut 18px, elevasi
biru lembut dan padding 16px sampai 20px. Dekorasi tidak menimpa teks/aksi;
pada ruang sempit ilustrasi diperkecil atau diberi ruang tersendiri.
Tidak menambah progres, tahap selesai, estimasi waktu atau klaim admin sudah mulai meninjau.
Nama panjang membungkus, teks tindakan minimal 44px, fokus terlihat dan hover
tetap statis. Revisi/penolakan, roster berubah, suspended, nomor belum verified,
konfigurasi hilang mempertahankan varian pemulihan existing.

Kartu Beranda mahasiswa terverifikasi memakai bahasa visual kartu referensi
yang sama: Langkah utama dengan gelombang biru dan dokumen dekoratif, fakta
berborder serta aksi aktual; Proyek aktif sebagai satu lembar dengan row
ringkas atau kondisi kosong berfolder; Rekomendasi dengan ikon jingga dan
bidang isi biru; Bekal kolaborasi/Validasi dalam satu panel; serta strip alur.
Hero terverifikasi tidak diubah menjadi banner panorama pending. Presentasi
referenceLayout terpisah dari status pendingAffiliation. Status, hitungan,
alasan rekomendasi, versi, masa berlaku, batas kecocokan dan masukan tetap
berasal dari server. Tidak menampilkan kartu menunggu afiliasi atau nilai
rekaan pada mahasiswa terverifikasi. Error/forbidden/stale tidak disamarkan
sebagai kondisi kosong. Ilustrasi memberi ruang untuk teks dan tindakan,
termasuk dua aksi Langkah utama; mobile menumpuk tanpa overlap atau overflow.

Respons hover dan tekan memakai durasi standard 220ms, elevasi ringan, serta
pergeseran ikon atau tombol paling banyak 2px sampai 4px tanpa reflow.
Masukan rekomendasi memiliki area status inline dengan ruang tetap sehingga
processing tidak menggeser kontrol. Fokus tetap jelas pada tautan dan tombol,
termasuk masukan rekomendasi. Reduced motion menghapus gerak tambahan.

Sidebar dan header mewarisi warna, radius, tipografi, serta focus treatment yang sama. Redesign dashboard mahasiswa tidak mengubah aturan navigasi atau isi surface campus, recruiter, dan platform.

Kerangka aplikasi memakai satu sidebar dan header bersama untuk seluruh role.
Sidebar putih memiliki pemisah lembut, identitas SATU, label role biru muda,
tautan beradius 16px dengan ikon di bidang kecil. Menu aktif memakai bidang biru
muda serta teks dan ikon biru, tanpa garis vertikal tambahan. Kartu konteks di
bawah menampilkan kampus atau organisasi nyata. Nama panjang membungkus, tidak
disembunyikan.

Polesan sidebar memakai kepala gradasi dari accent/80 ke putih, motif arsip SVG
dekoratif selebar 80px dengan opacity 35%, serta label role pada pill putih
dengan border primary/10. Simbol burung-buku berada pada bidang putih 56px
beradius 16px dan shadow-sm. Wordmark 26px memakai Familjen Grotesk
bold; kepanjangan nama memakai font body 11px dengan warna muted, bukan metadata
monospaced kecil. Varian tata letak ini khusus sidebar; artwork mewarisi logo
bersama yang juga digunakan landing dan auth.

Menu minimal 52px memakai label 14px, ikon outline Lucide 20px dengan stroke
1,75 pada bidang 36px, serta radius
16px. Pilihan aktif memiliki border primary/15, gradasi accent, dan shadow-sm
yang statis. Ikon aktif berada pada bidang putih dengan border oranye tipis;
ikon nonaktif tanpa kotak berlapis agar lebih tenang. Beranda memakai House,
Proyek FolderKanban, Kontribusi NotebookPen, Portofolio GalleryVerticalEnd dan
Peringkat ChartBar. Ikon menu admin memakai keluarga outline yang sama,
tanpa podium, data atau status baru. Hover hanya mengubah warna
selama 220ms, tanpa lift, scale, perpindahan ikon, atau garis vertikal biru.
Kartu konteks memakai nama aktual, font 14px dengan jarak baris 24px, bidang
putih ke accent/65, ikon 40px, dan shadow-sm. Label konteks 11px serta status
semantic tetap lebih tenang daripada nama. Menu dan kartu konteks berbagi area
scroll; kartu berada di bawah pada tinggi normal. Kepala dan tombol tutup
mobile tetap terlihat saat area ini digulir. Lebar sidebar, fokus, batas konten
halaman, serta reduced motion tetap diwarisi.
Header setinggi 64px memakai canvas transparan dengan border lembut, identitas
ruang kerja, jejak halaman, dan kontrol beradius 12px atau 16px. Avatar dan label
role menjelaskan konteks akun, bukan skor atau progres. Mobile memakai drawer
di tepi layar dengan tombol tutup 44px dan fokus yang kembali ke toggle header.

Toggle header dan tombol tutup drawer memakai Menu dengan tiga garis horizontal
yang tetap sama saat buka/tutup, tanpa morph atau rotasi. Label Buka navigasi
atau Tutup navigasi, aria-expanded, aria-controls, pintasan keyboard, cookie
desktop dan pemulihan fokus tetap. Ikon dekoratif tidak dibaca dua kali.
Kartu identitas universitas memakai logo UTY dari public/images/uty-2.png,
dioptimalkan menjadi university-uty.webp 256px. Logo tampil utuh dengan
object-contain pada bidang putih, terpisah dari logo SATU dan label status.
Nama universitas tetap dari server; logo tidak menyatakan afiliasi sudah sah.
Konteks tanpa afiliasi tetap memakai ikon generik, bukan identitas terverifikasi.
Label Afiliasi kampus tidak ditampilkan pada kartu sidebar mahasiswa; logo,
nama universitas serta status tetap. Region tetap bernama Universitas untuk
pembaca layar. Label Universitas pada kartu admin tetap ringkas.

Primitive bersama mempertahankan radius tombol/input 12px, kartu/dialog 24px,
badge pill, teks status semantic, dan shadow lembut. Tombol utama berukuran
44px, tombol padat 36px, dan fokus tetap terlihat. Dialog memakai permukaan
putih, backdrop grafit 40%, judul yang tidak tertutup tombol tutup, serta batas
tinggi viewport dengan scroll internal. Drawer memakai easing 420ms saat masuk
dan 220ms saat keluar. Reduced motion meniadakan gerak tambahan. Styling
primitive tidak menggantikan state, validasi, atau otorisasi pada konsumennya.

Dialog aktivasi mahasiswa mempunyai mode wajib untuk pengajuan afiliasi dan
pelengkapan profil sesudah verified. Form wajib tidak menampilkan tombol tutup
dan menahan Escape serta klik luar; Keluar akun tetap tersedia. Fokus awal
berada pada judul, urutan fokus tetap di dialog, dan isi dapat digulir pada layar
pendek. Panel status pending yang sudah tercatat dapat ditutup. Pengajuan awal
tidak menampilkan indikator langkah kemampuan. Setelah verifikasi, pelengkapan
menampilkan dua langkah Bekal kemampuan dan Cara berkolaborasi dengan token
yang sama.

Beranda mahasiswa memakai ringkasan alur empat bagian sebagai penjelasan, bukan
progress tracker. Bagian terbuka, pemisah lembut, ikon biru, dan tipografi existing
menjaga keterbacaan. Dialog `Pahami alur SATU` memakai primitive Dialog bersama,
radius 24px, konten yang dapat digulir, serta tombol dengan tinggi minimum 44px.
Maskot pose guide menjadi dekorasi kecil dan tidak mengambil ruang tindakan.
Penjelasan afiliasi memakai label, ikon, serta token status yang tersedia.
Hero maskot dan palet global tidak berubah.

Tur menu mahasiswa memakai bingkai biru lembut beradius 24px, ring putih tipis,
dan backdrop grafit 38% yang menjaga konteks halaman tetap terlihat. Panel putih
beradius 24px memiliki kepala biru muda, maskot guide kecil, label menu, serta
indikator langkah tur (bukan progres aktivitas mahasiswa). Panel tetap di kanan
bawah pada desktop dan di bawah dengan margin 12px pada mobile. Tombol navigasi
dan tutup selalu berada di luar animasi pergantian copy. Tinggi panel stabil
antar langkah (416px desktop, 448px mobile, dibatasi viewport). Area penjelasan
dapat digulir, sementara header dan kontrol tetap terlihat pada layar pendek.

Panel masuk dengan fade dan lift kecil selama 420ms, lalu keluar dengan fade
220ms. Sorotan meredup sebelum berpindah dan muncul kembali setelah scroll
selesai. Scroll terprogram memakai easing 420ms hanya bila target belum terlihat
di ruang bebas antara header dan panel. Pergantian halaman tidak mereset scroll
secara mendadak. Area yang disorot tetap dekoratif dan tidak membuka interaksi
di luar modal. Target hilang memakai penjelasan tanpa sorotan. Reduced motion
menghapus animasi dan smooth scroll tanpa mengubah urutan atau isi tur.

### Latar hero menu mahasiswa

Lima menu mempunyai latar berbeda dalam satu keluarga Buku Besar Kolaborasi:
Beranda memakai halaman kampus ilustratif, Proyek memakai lembar rancangan
dengan garis konstruksi, Kontribusi memakai lengkung halaman jurnal dan pita
oranye, Portofolio memakai ceruk galeri dengan bingkai kosong, dan Peringkat
memakai lengkung skala ukur tanpa angka. Semuanya memakai material ivory,
biru langit, cahaya lembut dan detail oranye selektif. Gambar bukan foto UTY,
data mahasiswa, karya, kemajuan, hasil validasi atau skor peringkat.

StudentHeroBackdrop menyajikan plate dekoratif terpisah dari teks, kontrol
dan maskot. Asset WebP responsif dipilih sesuai lebar hero; gambar statis,
aria-hidden dan tidak menangkap pointer. Bagian kiri terang untuk kontras
teks; detail terkonsentrasi di kanan. Pada region sempit, gambar diperkecil
kontrasnya dan memudar sebelum area baca. Jika gambar gagal dimuat, gradasi
biru-putih menjadi fallback tanpa menghilangkan fungsi. Tidak menambah kartu
melayang, watermark arsip bertumpuk, partikel atau animasi latar.

Penempatan maskot memakai aturan bersama Beranda terverifikasi: kanvas 208px
pada mobile, 39% lebar hero dengan batas 320px mulai viewport 40rem, lalu 36%
dengan batas 384px mulai 64rem. Jarak kanan 0px/8px/28px dan tepi bawah -28px
sama di kelima menu. Maskot boleh melewati tepi hero; hanya lapisan gambar
latar yang terklip. Mobile menyediakan ruang ilustrasi di bawah teks, sedangkan
layar lebih lebar membatasi lebar copy. Tinggi minimal hero 320px mulai 40rem,
margin atas 16px/24px dan jarak isi berikutnya minimal 40px menjaga maskot tidak
menabrak navbar, teks, tombol atau bagian berikutnya. Pose dan animasi masuk
420ms tetap; tidak ada reaksi hover baru. StudentHeroMascot menjadi pembungkus
bersama, bukan variasi ukuran tersendiri per menu.
Pada hero Proyek, Kontribusi, Portofolio dan Peringkat, baris aksi berjarak
36px dari deskripsi pada mobile dan 48px mulai viewport 640px. Tombol dan
konteks universitas/catatan turun bersama dalam alur normal, bukan transform
atau posisi absolut. Jarak catatan setelah aksi tetap 16px. Konten yang
membungkus menambah tinggi hero secara alami; posisi maskot, judul serta
fungsi tombol tidak berubah. Hero Pengaturan akun mempertahankan jarak 20px.

Beranda pending mempertahankan panorama dan komposisi beranda-verif yang telah
disetujui. Forbidden mempertahankan pemulihan tanpa membuka snapshot atau
kontrol lama. Latar daftar Peringkat ini khusus mahasiswa; admin memakai
hero formal tanpa maskot dan tanpa aksi mahasiswa. Detail, editor, landing, auth dan kartu isi tidak
ikut berubah. Periksa 320px sampai ultrawide, sidebar terbuka/tertutup, zoom
200%, fokus, kontras, reduced motion, loading, kosong, gagal dan pemulihan.

### Proyek Mahasiswa

T06 mempertahankan lembar tim existing: tiga isian singkat berlabel, kriteria
peran pada bidang biru lembut, serta dialog keputusan 24px tanpa identitas baru.
Riwayat berupa baris terbuka dengan status teks, waktu, alasan dan langkah
berikutnya. Konfirmasi penerimaan memakai primary, penolakan/penarikan memakai
destructive. Semua kontrol minimal 44px, error/fokus dan disabled jelas. Refresh
mempertahankan konten, dialog menggulir pada layar pendek, teks membungkus pada
320px sampai desktop besar, dan tidak menambah motion yang esensial.

T04 menambahkan fakta kapasitas aktual serta pernyataan penerimaan pemula dalam
bidang kebutuhan peran existing. Label tiga keadaan selalu berupa teks, bukan
warna saja. Kriteria pemilihan terbuka pada detail; daftar tetap ringkas.
Filter dan isian tambahan memakai label, bantuan, kontrol 44px serta token
input/fokus bersama. Kartu tetap statis saat hover, dan mobile membungkus fakta
serta pilihan tanpa mengecilkan teks. Tidak ada skor kelayakan, podium, atau
ilustrasi baru. Data lama berlabel Belum dinyatakan.

Daftar, detail, serta editor proyek memakai batas kiri-kanan konten yang sama
dengan Beranda melalui AppPage, tanpa pembatas lebar halaman tambahan. Hero
detail dan editor membentang selebar area konten. Grid isi dan panel konteks
berada di bawah hero, berjarak 24px, dengan ukuran kolom pendukung yang sama
seperti Beranda. Pada mobile, isi lalu panel konteks menumpuk dalam batas yang
sama. Pembatas panjang baris teks tetap boleh dipakai untuk keterbacaan.

Penemuan proyek memakai hero ringkas putih ke biru langit, lengkung lembar
arsip yang tenang, aksen oranye, dan tindakan membuat proyek. Background
memakai plate lembar rancangan sesuai kontrak Latar hero menu mahasiswa,
tanpa watermark arsip tambahan atau perubahan ukuran hero dan maskot.
Pose khusus
project-plan memperlihatkan burung membawa rancangan proyek dengan tas asli;
gambar transparan dekoratif hanya berada pada hero. Saat masuk menu, maskot
memakai satu animasi satu-mascot-enter 420ms dengan easing SATU yang sama
dengan Beranda: fade, naik 16px dan scale 0,96 menuju ukuran penuh. Tidak
berulang saat filter, pagination atau pilihan tampilan diperbarui, tanpa
reaksi hover. Reduced motion tetap statis dan tidak menunda tindakan halaman.
Ukuran dan posisi maskot memakai aturan bersama Beranda pada kontrak latar
hero menu mahasiswa, termasuk ruang ilustrasi di bawah copy mobile. Tidak
menempatkan maskot kecil di sudut judul atau mengurungnya di dalam kartu.
Hero tidak mengulang statistik, badge keberhasilan atau ilustrasi pada setiap
kartu. Pilihan Peluang dan Proyek saya menjadi navigasi berbidang biru lembut
dengan ikon serta status aria-pressed. Pencarian langsung mengikuti navigasi;
bantuan kesempatan berada setelah hasil sebagai tindakan pendukung.
Tombol Buat proyek pada hero tetap statis saat hover, tanpa perubahan warna,
bayangan, atau posisi. Pointer serta indikator fokus keyboard dipertahankan.
Pencarian menjadi lembar utama putih dengan border biru ringan serta shadow sm;
filter tambahan berada dalam
disclosure bernama dengan ringkasan pilihan yang sudah diterapkan.
Kartu peluang memakai grid dua kolom ketika region hasil selebar 54rem,
satu kolom di bawahnya, border lembut, radius 20px, judul 20px sampai 24px,
ringkasan tiga baris, serta bidang kebutuhan peran biru lembut. Peran menjadi
baris berlabel dengan penerimaan pemula dan kapasitas aktual, bukan tumpukan
kartu kecil. Keahlian dan metadata deadline, kapasitas, serta pemilik memiliki
bobot lebih tenang tanpa kartu bersarang. Pemilik dan tautan detail mengakhiri
lembar. Pintasan Peran pemula mendapat ikon oranye pada bidang ivory, tanpa
menjadikan oranye sebagai status domain. Skeleton mengikuti susunan baru;
kondisi kosong memakai folder arsip bersama dan tindakan pemulihan.
Tautan detail memakai outline biru. Kartu tidak bergerak atau mengubah border
dan bayangan saat pointer hover; ikon tautan juga tetap statis. Focus-within
tetap meningkatkan elevasi untuk akses keyboard. Kartu bukan tombol
bersarang dan semua tindakan tetap dapat diakses tanpa hover. Motif arsip juga
menemani kondisi hasil kosong, bukan setiap kartu. Kartu hanya memakai data
proyek aktual. Daftar dan detail membedakan kapasitas total, anggota aktif,
dan tempat tersisa dari agregat server. Sisa fisik tidak berarti pengajuan
terbuka; lifecycle dan tenggat tetap menentukan ketersediaan.

Detail dan editor memakai kepala biru muda berelevasi md dan aksen lembar arsip
dekoratif pada desktop. Uraian detail serta konteks kampus menjadi bagian
terbuka; kebutuhan peran memakai lembar putih dengan bidang biru lembut.
Panel tindakan berelevasi md mendahului isi panjang. Ajukan bergabung, Buka
proyek, atau Buka ruang kerja menjadi aksi utama sesuai izin; pembatalan
memakai outline correction yang tenang sebelum dialog konfirmasi.
Pembentukan tim memiliki kepala terbuka, kapasitas aktual dalam bidang biru,
serta form dan dialog terpisah. Tidak menambahkan command atau izin baru.
Editor membedakan lembar informasi utama putih, pengaturan tim terbuka,
lembar tiap peran, dan panel simpan berelevasi md. Tiga nomor bagian adalah
urutan pengisian, bukan persentase progres. Status request simpan atau membuka
draft memakai area inline yang tetap menyediakan ruang ketika kosong;
konfirmasi hasil hanya mengikuti server. Footer membungkus dan tidak menutupi
formulir pada mobile. Input, select, dan tindakan utama minimal 44px; data
panjang dapat membungkus dan dialog tetap dapat digulir. Transisi memakai
220ms dan reduced motion tetap statis. Loading mengikuti geometri kartu.

### Ruang Kerja Kolaborasi

Pintasan Peran pemula pada Peluang memakai kontrol outline 44px dan status pilihan teks/aria-pressed. Bantuan editor peran serta contoh tugas memakai disclosure atau bidang accent ringkas, body 14px/24px dan tombol 44px. Contoh mengisi draft lewat pilihan eksplisit. Tidak menambah hero, maskot, skor atau animasi baru.

Ruang kerja T07 mewarisi lembar tugas, input, dialog dan token SATU. Kepala
ringkas serta arahan kerja terbuka mendahului pilihan tugas. Detail menonjolkan
hasil yang diharapkan dan penanggung jawab. Bukti privat berdiri sendiri sebelum
diskusi opsional. Kartu memakai radius 24px dan bayangan lembut selektif, bukan
identitas baru atau maskot pada tiap tugas. Panel menumpuk pada mobile, fokus
detail terlihat, error membungkus, dan gerak nonesensial dinonaktifkan pada
reduced motion.

### Kontribusi Mahasiswa

Hero daftar mengikuti komponen StudentMenuHero bersama dengan Proyek:
bidang putih-biru, plate jurnal berlapis dan pita oranye sesuai kontrak latar bersama.
Maskot contribution-notes berdiri menyusun catatan pada jurnal terbuka dengan
pensil, mempertahankan tas asli. Tidak memuat cap, centang, medali atau hasil
validasi. Proporsi serta posisi mengikuti Beranda melalui StudentHeroMascot,
dengan animasi masuk 420ms; hover tidak menggerakkan maskot dan reduced motion
langsung menampilkan pose akhir. Judul dan tindakan menonjolkan pencatatan
pekerjaan individual serta bukti, bukan pengakuan otomatis. Susun kontribusi
tetap mengikuti izin server, Muat ulang mempertahankan state request dan
pengantar privasi tetap terbaca. Kartu daftar, detail dan composer tidak
diubah oleh penyelarasan hero ini.

T08 mempertahankan lembar individual existing. Panduan bukti dan batas validasi
memakai disclosure putih/biru lembut, bukan hero baru. Ringkasan yang dapat
dibagikan diberi label jelas; pernyataan serta bukti berlabel privat. Pemulihan
snapshot memakai bidang correction dengan tombol 44px, fokus terlihat dan
konfirmasi sebelum membuang draft. Bukti reviewer memakai tautan privat
existing. Motion dan susunan mobile tetap mewarisi token bersama.

Daftar, penyusunan draft, detail, dan revisi memakai batas konten AppPage yang
sama dengan Beranda dan Proyek. Hero putih-biru membentang selebar konten,
dengan maskot contribution-notes dekoratif pada daftar. Kartu putih beradius 24px, bidang
biru lembut, gutter 24px, dan tindakan 44px mempertahankan identitas global.

Daftar memakai pencarian dan pilihan status lokal terhadap entri yang sudah
dikirim server. Kartu menonjolkan tugas, proyek, status, versi, dan waktu
pembaruan aktual. Penjelasan Susun, Kirim, dan Kelola portofolio adalah
pengenalan alur, bukan progres atau jaminan validasi. Tidak menambahkan XP,
persentase, atau statistik contoh.

Hero memakai bayangan lembut dan latar jurnal yang berbeda dari Proyek.
Kondisi daftar kosong memakai ilustrasi arsip tanpa
maskot per kartu. Pengenalan tiga tahap menjadi bagian terbuka dengan pemisah
tipis. Pencarian menjadi lembar putih berelevasi md dengan border biru ringan.
Kartu catatan berjudul 20px sampai 24px memiliki bidang langkah berikutnya
sesuai status, disertai label dan copy, bukan warna saja. Versi serta waktu
pembaruan menjadi metadata terbuka. Kartu dan tombol utama hero tetap statis
saat hover; focus-within serta fokus tautan tetap terlihat. Transisi kontrol
memakai 220ms dan tidak diperlukan untuk memahami tindakan.

Detail memisahkan versi aktif, bukti privat, umpan balik kampus, jejak menuju
portofolio, dan riwayat versi. Panel tindakan berada di kanan pada desktop dan
sebelum isi pada mobile. Formulir draft/revisi memiliki tiga bagian terbuka:
sumber pekerjaan, catatan kontribusi, serta bukti dan pernyataan. Bukti memakai
pilihan berkas beradius lembut dengan label selected dan batas 20 berkas yang
tetap eksplisit. Empty, bukti tidak tersedia, loading, processing, validasi,
akses ditolak, dan network error tetap dibedakan tanpa menghapus isian.

Versi aktif merupakan lembar utama putih berelevasi md, sedangkan bukti memakai
bidang biru lembut dengan baris berkas putih. Keputusan kampus, jejak pekerjaan
berdasarkan event aktual, riwayat versi tersimpan, dan informasi pendukung
menjadi bagian terbuka. Catatan revisi mendahului editor dan tidak disembunyikan.
Formulir membedakan sumber pekerjaan terbuka, lembar catatan utama, serta bukti
dan pernyataan. Footer simpan serta panel langkah berikutnya memakai elevasi md
dan gradasi ringan. Status processing memiliki ruang inline yang tetap; hasil
simpan dan pengiriman mengikuti respons server. Tidak menambahkan progres
validasi, estimasi waktu, autosave, atau akses berkas privat baru.

### Portofolio Mahasiswa dan Publik

Pengaturan privasi hanya dua pilihan berlabel Hanya saya dan Publik. Petunjuk
pada bidang ivory hangat dengan aksen jingga menjelaskan bahwa profil privat
menutup seluruh karya, sedangkan profil publik tidak membuka karya privat.
Konflik dan hasil jaringan belum pasti menyediakan pemeriksaan GET, mempertahankan
pilihan lokal serta fokus error, dan menahan simpan ulang sampai sumber diperiksa.
Kontrol tetap 44px, responsif, serta memakai komponen dan token yang sama.

Hero daftar mahasiswa memakai StudentMenuHero bersama dengan Proyek dan
Kontribusi: putih-biru, ceruk galeri dengan bingkai kosong serta aksen oranye.
Pose portfolio-showcase memperlihatkan map karya terbuka dengan halaman
ilustratif tanpa klaim verifikasi. Ukuran serta posisi mengikuti Beranda
melalui StudentHeroMascot; animasi masuk 420ms satu kali, hover statis, dan
reduced motion tanpa animasi. Kendali profil, Lihat kontribusi dan Muat ulang
tetap mengikuti izin serta state existing. Konteks kampus hanya memakai data
yang boleh dibaca. Koleksi, pengaturan berbagi, detail dan halaman publik
tidak diubah oleh penyelarasan hero ini.

Daftar dan detail mahasiswa memakai AppPage tanpa pembatas lebar tambahan.
Hero putih-biru selebar konten diikuti grid koleksi atau rincian di kiri dan
kendali profil di kanan. Mobile menumpuk dalam batas konten yang sama. Kartu
putih beradius 24px, jarak 24px, bidang lembut, badge pill, dan tindakan 44px
mewarisi Beranda, Proyek, dan Kontribusi. Maskot portfolio-showcase pada daftar tetap
dekoratif, bukan ilustrasi karya atau pengganti data.

Koleksi ditampilkan sebagai kartu karya dengan judul, ringkasan, tingkat
verifikasi aktual, status berbagi, jangkauan, versi sumber, dan tanggal.
Pencarian serta filter lokal hanya membaca karya yang dikirim server. Kontrol
jangkauan per karya berada di bawah ringkasan kartu; pengaturan profil menutup
atau membuka jangkauan seluruh koleksi. Pilihan belum tersimpan tidak ditampilkan sebagai
izin aktif. Refresh dan deferred loading memakai skeleton geometri kartu;
empty, akses ditolak, sumber tidak tersedia, processing, konflik, dan kegagalan
jaringan tetap dibedakan.

Halaman publik memakai mode Experience dengan identitas pemilik pada hero,
kartu karya, fakta verifikasi, serta batas berbagi yang ringkas. Gunakan palet
dan token yang sama, tanpa sidebar mahasiswa, kontrol visibilitas, data sumber
privat, skor contoh, tombol kontak, atau tautan unduh palsu. Karya pertama
adalah karya terbaru sesuai urutan server, bukan rekomendasi atau penilaian.
State tidak tersedia tidak menampilkan identitas ataupun isi karya.

Polesan Portofolio memberi judul karya skala 20px pada mobile dan 24px mulai
sm, dengan ringkasan berjarak baris 28px. Koleksi satu kolom sampai xl dan dua
kolom mulai 2xl memberi ruang cerita di samping kendali profil. Heading koleksi
terbuka, pencarian memakai lembar putih dengan border primary/20 dan shadow-md,
sedangkan kartu karya memakai shadow-sm serta fakta sumber tanpa kartu kecil
di dalamnya. Fokus di dalam kartu dapat menguatkan border dan bayangan, tetapi
kartu dan tombol utama hero tidak berubah saat hover.

Motif arsip SVG mendampingi kondisi kosong, sementara hero memakai plate galeri;
aksen bulu hangat dipakai hanya pada hero koleksi. Kendali profil beradius 24px
memakai lapisan dari putih ke accent/60, fakta tersimpan dengan pembatas garis,
dan petunjuk ivory hangat untuk dua pilihan privasi. Kontrol jangkauan karya beradius
16px dengan lapisan lebih tenang. Pesan processing mendapat ruang tetap 20px,
ikon memuat bersifat dekoratif, dan perubahan tersimpan tetap mengikuti respons
server. Detail mengutamakan lembar ringkasan putih shadow-md dan fakta sumber
terbuka. Halaman publik mewarisi motif arsip, heading terbuka, judul karya yang
lebih besar, serta karya terbaru sebagai lembar utama tanpa animasi kartu.

### Peringkat Mahasiswa

Hero tersedia memakai StudentMenuHero yang sama dengan menu inti, termasuk
plate skala ukur tanpa angka dan oranye sekunder. Pose ranking-context membaca laporan ringkas
dengan kaca pembesar, tanpa angka, grafik hasil, medali, mahkota atau podium.
Maskot mendampingi pemahaman konteks, bukan menyatakan peringkat pribadi.
Proporsi serta animasi masuk mengikuti Proyek/Kontribusi, tanpa hover dan
statis pada reduced motion. Pahami perhitungan, konteks kampus dan tautan
Kontribusi tetap sesuai role. Filter, XP, persetujuan individual, kelompok
dilindungi serta forbidden tidak berubah; operator tetap tidak mendapat
tindakan individual mahasiswa. Keadaan forbidden mempertahankan kepala
pemulihan yang ringkas tanpa membuka data lama.

Ringkasan XP pribadi memakai lembar putih ringkas dengan angka monospaced,
semester berlabel dan tautan Kontribusi. Posisinya mendahului panel persetujuan,
tanpa podium, target buatan atau animasi angka. Hanya pemilik yang menerima
ringkasan ini; Admin Universitas tetap membaca kelompok. Navigasi mewarisi
menu biru lembut existing tanpa garis vertikal atau identitas baru.

Peringkat memakai hero putih-biru fullwidth dan maskot ranking-context dekoratif,
mewarisi batas AppPage serta gutter 24px dari Beranda. Grid hasil dan panel
pendukung berada di bawah hero, bukan membatasi lebarnya. Filter putih
beradius 24px memisahkan select semester dari tombol kategori berlabel,
dengan bidang biru lembut dan tanda centang pada pilihan aktif.

Tabel memakai angka monospaced, penanda urutan lembut, header ringan, dan
tindakan penjelasan 44px. Pada region sempit, kartu berlabel menggantikan
tabel agar isi tidak memerlukan scroll horizontal. Warna tidak menggantikan
label shared rank, XP terverifikasi, atau kelompok dilindungi. Tidak membuat
podium, progres kompetisi, atau skor tambahan. Rata-rata kelompok dan total
individual memiliki label berbeda sesuai kontrak server.

Panel persetujuan, panduan perhitungan, kesegaran data, dan badge memakai
kartu putih serta icon tile biru yang sama dengan Portofolio. Dialog
persetujuan dan penjelasan memiliki bidang konteks lembut, informasi
privasi yang jelas, fokus error, serta footer yang menumpuk pada mobile.
Empty, deferred, stale, error, dan forbidden mempertahankan bahasa visual
halaman tanpa mengklaim data atau persetujuan yang belum tersedia.

Polesan Peringkat memakai hero putih-biru dengan bayangan lembut, motif arsip
SVG bersama, penanda oranye dekoratif, serta maskot ranking-context yang tidak
menutupi teks. Konteks kampus dan tindakan berada di bawah pembatas putih.
Heading filter terbuka; lembar pilihan dan hasil beradius 24px dengan border
primary/20 dan shadow-md. Nama entitas 16px sampai 18px lebih kuat dari label
verifikasi; angka XP 14px monospaced tetap berbeda dari nomor peringkat. Semua
peringkat memakai penanda biru lembut yang sama, tanpa podium atau aksen juara.
Baris tidak bergerak atau berubah saat hover, dan hanya kontrol memiliki
respons interaksi. Fakta mobile memakai pembatas terbuka tanpa kartu kecil.

Panel persetujuan memakai lapisan dari putih ke accent/60 dan bayangan md.
Panduan perhitungan serta badge menjadi bagian terbuka dengan pemisah tipis,
sedangkan rumus tetap memiliki bidang biru lembut. Badge tidak menjadi skor
atau hadiah contoh. Area status persetujuan dan dialog memiliki ruang tetap
20px; loading filter tidak dilabeli sebagai menyimpan persetujuan. Dialog
memisahkan nama entitas, angka perhitungan, dan metadata sumber. Transisi
pilihan memakai 220ms dengan reduced motion; kondisi kosong memakai arsip
dekoratif dan penjelasan pemulihan, bukan ajakan kompetisi.

### Pengaturan Akun

Komposisi maskot berikut berlaku untuk Mahasiswa. Admin Universitas memakai
CampusOperationHeader formal bertema account, tanpa maskot atau slot gambar.

Profil, Keamanan, Tampilan, dan Hak Data memakai AppPage serta StudentMenuHero
dengan latar settings berupa ceruk arsip ivory-biru dan detail pembatas oranye.
Maskot account-care memegang satu kunci kuningan sambil menjaga tas aslinya;
ini ilustrasi kendali akun, bukan hasil pemeriksaan keamanan. Komposisi serta
ukuran maskot mewarisi Beranda, tidak bereaksi pada hover. Plate dan maskot
terpisah, WebP responsif, alt kosong, fallback gradasi tetap terbaca.

Navigasi empat kategori berada di bawah hero, dua kolom pada mobile dan empat
mulai layar lebar. Tile putih beradius 20px, ikon dalam bidang lembut dan label
Aktif melengkapi aria-current; pilihan biru tanpa garis vertikal. Form putih
radius 24px memiliki pembatas halus, ikon heading oranye dan footer simpan
yang tenang. Panduan memakai permukaan ivory-oranye yang ringan dan lembar
arsip dekoratif melalui CSS, bukan maskot berulang. Gutter 24px, formulir kiri
dan panduan kanan lalu menumpuk pada layar kecil. Tidak menambah skor, status
keamanan, tema atau pengaturan yang belum didukung.

Kartu formulir membedakan identitas, private username, dan password melalui
label jelas, bidang lembut, bantuan, serta footer simpan 44px. Status belum
tersimpan, processing, sukses, dan error tetap semantik. Kartu hapus akun
terpisah memakai border correction ringan pada permukaan putih, bukan bidang
merah dominan. Dialog memprioritaskan konsekuensi dan konfirmasi password;
username, password, serta data privat tidak menjadi dekorasi halaman.

Tampilan menyediakan preview statis warna dan struktur aktual, status Mode
terang aktif, serta penjelasan baca-saja. Tidak membuat toggle gelap, data
contoh tanpa label, animasi wajib, atau tombol yang tidak memiliki tindakan.

### Ruang Admin Universitas U05

Mahasiswa, Pengaturan universitas, Akun admin dan Katalog keahlian mewarisi
AppPage serta CampusOperationHeader. Header ringkas putih ke accent memakai
judul 24px/30px, ikon 48px, motif arsip dan nama universitas server. Navigasi
pengaturan memakai dua kolom mobile lalu empat desktop, bidang aktif biru
lembut tanpa garis vertikal. Daftar berupa row terbuka dengan pemisah, bukan
statistik popularitas. Lembar putih radius 24px, shadow-sm, body 14px/24px,
input 16px dan kontrol 44px menjaga ritme operasi existing. Dialog sensitif
memakai primitive bersama, langkah konfirmasi sandi dan tindakan eksplisit,
fokus error serta scroll native. Tidak ada hero promosi tambahan, aset baru,
hover terangkat, motion wajib, kalender palsu atau role admin kedua.

### Ringkasan Operator Kampus

Ringkasan memakai AppPage fullwidth dengan jarak region 16px/20px dan
CampusOperationHeader formal bertema overview. Judul Ringkasan kampus,
deskripsi operasional dan nama universitas menggantikan headline promosi,
maskot serta slot ilustrasi besar. Latar panel geometris hanya dekorasi,
bukan grafik hasil. Filter memakai lembar putih pading 16px, label 14px, input 16px,
dan kontrol 44px, tanpa judul serta footer penjelasan atau hasil saat ini.
Isian dan tombol berada dalam satu baris mulai lebar region 56rem; pada
region lebih sempit tombol berpindah baris. Bantuan isian tetap tersedia bagi
screen reader; definisi cakupan dapat dibuka pada Tentang data ringkasan.
Pilihan belum diterapkan serta error tetap terlihat ketika relevan.
Fakta memakai kartu putih pading
16px/20px, judul 16px, angka 30px, dan metadata tenang.

Grafik cincin 88px merangkum keanggotaan; batang bertumpuk merangkum status
proyek. Keduanya memakai warna primer dan semantik SATU, pemisah putih,
serta legenda label dan nilai aktual yang selalu terlihat. SVG dekoratif
tidak menggantikan informasi tekstual. Grafik tidak memiliki tren rekaan,
tooltip wajib, atau animasi berulang. Data kosong memperoleh penjelasan.

Langkah operasional menjadi dua baris ringkas dengan ikon, bantuan singkat,
dan pintasan afiliasi serta validasi tanpa statistik kontribusi placeholder.
Daftar anggota memakai heading terbuka serta tabel semantik mulai lebar
region 36rem; di bawahnya kartu berlabel menggantikan tabel. Tidak ada
avatar atau username privat. Referensi keanggotaan memakai Azeret Mono.
Status memakai ikon dan label, termasuk Ditangguhkan, bukan warna saja.

Distribusi program memakai bar biru lembut dekoratif serta nilai tekstual
dan denominator eksplisit. Panduan, definisi sumber, dan akses modul berada
di panel kanan 20rem/22rem mulai xl, kemudian setelah isi pada mobile.
Panel konteks dipadatkan; definisi tambahan memakai disclosure dengan fokus
terlihat dan target 44px. Live status kosong tidak mengambil ruang vertikal.
Empty memakai motif arsip bersama. Kartu tidak terangkat saat hover;
focus tetap terlihat. Refresh mempertahankan isi, processing memakai inline
status, dan reduced motion menghapus animasi skeleton serta transisi.

### Afiliasi Kampus Operator

Afiliasi memakai AppPage fullwidth dan header putih ringkas beradius 24px,
shadow-sm, icon tile ClipboardCheck biru lembut 48px, judul 24px/30px, dan
kampus aktif pada pill accent. Motif arsip dekoratif memberi karakter lembar
peninjauan tanpa maskot atau headline promosi. Filter hanya tiga kelompok
label 14px dan select 16px/44px dengan batas input serta fokus bersama.

Antrean memakai heading terbuka, berkas putih pading 16px/20px, referensi
AF-id dalam Azeret Mono, NIM dan WhatsApp lengkap berlabel untuk peninjau
berwenang dengan pemenggalan teks panjang, metadata 12px/20px, serta
status berikon dan teks. Warna status memakai token verified, pending, dan
correction, bukan identitas halaman baru. Kartu tidak terangkat saat hover.
Satu kolom berkas menjadi dua mulai lebar region antrean 64rem, tanpa
memperkecil teks atau memindahkan panel keputusan pada desktop biasa.
Panel kanan 20rem/22rem mulai xl memuat keputusan, ringkasan seluruh antrean,
roster aktif, serta bantuan kunci. Status aktif dan versi menjadi konteks,
bukan score atau progres keberhasilan mahasiswa. Form aktif mendahului
antrean pada mobile; kontrol keputusan serta tombol minimal 44px.

Radio memakai label utuh, focus-within yang terlihat, serta pilihan semantik.
Select dan textarea memakai font 16px; alasan, catatan, processing, error,
dan konsekuensi keputusan tetap terbaca. Empty memakai motif arsip bersama,
skeleton mengikuti region, refresh mempertahankan isi, dan reduced motion
meniadakan animasi nonesensial.

### Cari Talenta Perekrut

Cari Talenta memakai AppPage tanpa batas lebar tambahan, hero biru langit
selebar konten, maskot guide dekoratif, motif arsip, radius 24px, serta gutter
24px yang sama dengan menu mahasiswa. Hero menjelaskan pencarian portofolio
yang diizinkan mahasiswa, bukan menjanjikan kandidat terbaik atau skor cocok.
Status hak akses tetap terlihat sebelum hasil.

Pencarian berada pada lembar putih berelevasi md. Kata kunci menonjol;
ketersediaan, kampus, serta skill memiliki label 14px, input 16px, dan kontrol
minimal 44px. Hasil menampilkan heading terbuka, kartu portofolio putih
berelevasi sm, judul 20px sampai 24px, skill pada bidang biru lembut, serta
badge dan ringkasan kontribusi yang benar-benar dikirim projection.
Verifikasi hanya dilabeli jika verified_at tersedia. Kartu tidak terangkat
saat hover; fokus keyboard dan respons warna singkat tetap terlihat.

Kata kunci, ketersediaan, dan institusi kampus memiliki bantuan singkat tepat
di bawah kontrol, memakai body 14px/24px berwarna muted dan aria-describedby.
Bantuan menjelaskan pencarian pada judul atau ringkasan profil, status
ketersediaan, serta batas kampus tanpa menyatakan filter langsung diterapkan.

Filter dan panduan privasi serta navigasi tersimpan dan permintaan kontak
berada berdampingan mulai xl. Lembar pencarian mengikuti tinggi baris sampai
batas bawah panduan Baca kontribusi dan badge. Jarak antarkelompok isian
dibagi merata, dengan footer tindakan di bawah tanpa tinggi tetap. Mobile
tetap memakai tinggi sesuai isi dan jarak ringkas yang sama. Hasil berada pada baris tersendiri di bawahnya,
membentang selebar hero agar tiga kartu mendapat ruang pada desktop 1280px.
Mobile menumpuk hero, filter, hasil, lalu panduan. Grid kartu dan skeleton
mengikuti lebar area hasil: satu kolom di bawah 44rem, dua kolom mulai 44rem,
dan tiga kolom mulai 56rem. Jumlah hasil serta pagination tidak dibatasi. Motif arsip mendampingi
kondisi kosong, bukan maskot di setiap kartu. Processing pencarian dan simpan
dibedakan; konfirmasi simpan mengikuti server. Error menyediakan retry,
akses ditolak menyembunyikan hasil sebelumnya, dan reduced motion tetap statis.

### Detail Profil Kandidat Perekrut

Detail kandidat memakai hero gradasi biru langit selebar konten dengan motif
arsip bersama, headline 24px pada mobile dan 30px mulai sm, label FOLIO, kampus aktual, serta
status ketersediaan. Verifikasi portofolio hanya muncul jika verified_at ada;
tidak melabeli akun, skill, atau seluruh kontribusi sebagai terverifikasi.
Padding hero 24px, lalu 32px horizontal dan 28px vertikal mulai sm, tanpa
pembesaran tambahan pada desktop besar. Hero tidak memuat statistik atau
paragraf pengantar tambahan. Jumlah skill, badge, dan kontribusi berasal dari
projection dan berada di lembar Tentang kandidat, tanpa skor baru.

Lembar ringkasan putih memakai radius 24px, shadow-md, body 16px/28px, dan
keahlian pada bidang biru lembut. Badge menjadi bagian terbuka. Daftar karya
menonjolkan judul 20px/24px dan peran bila dibagikan; tidak membuat tautan
bukti privat atau label validasi yang tidak dikirim server. Empty memakai
motif arsip dan penjelasan singkat, bukan maskot pada setiap bagian.

Panel tindakan di kanan mulai xl mewarisi gutter 24px serta lebar 20rem/22rem.
Mobile menempatkannya sebelum isi panjang. Kontrol minimal 44px, fokus terlihat,
status processing dan konfirmasi server memakai live region hemat. Simpan
tidak optimistis; network error menyediakan muat ulang. 403/404 mengganti isi
profil dengan pemulihan tanpa menampilkan data lama. Tombol pengiriman kontak
yang belum memiliki form disabled dengan alasan, disertai tautan daftar
permintaan kontak yang benar-benar tersedia. Motion dan warna memakai token
bersama, tanpa hover lift atau animasi baru.

### Kandidat Tersimpan Perekrut

Koleksi organisasi memakai header putih ringkas, bukan hero pencarian kedua.
Judul 24px/30px, icon tile bookmark biru lembut 48px, copy 14px/24px, border
lembut, radius 24px, dan shadow-sm mewarisi SATU. Tidak ada maskot atau
headline promosi besar. Total berasal dari paginator server dan tidak
dilabeli sebagai jumlah kandidat pada halaman saat ini.

Daftar berupa lembar arsip satu kolom dengan judul kandidat 20px/24px,
FOLIO, kampus, status ketersediaan, serta verifikasi portofolio aktual.
Skill memakai bidang biru lembut; badge dan jumlah kontribusi yang dibagikan
menjadi metadata pendukung, bukan klaim skill atau seluruh karya tervalidasi.
Footer tindakan beradius 12px dengan tinggi 44px. Kartu tidak memiliki hover
lift; fokus tetap terlihat. Panel pendukung memakai lebar 20rem/22rem mulai
xl, lalu tampil setelah daftar pada mobile. Empty memakai ArchiveArt bersama.

Hapus simpanan memakai dialog putih beradius 24px, konsekuensi organisasi,
processing inline, serta hasil yang mengikuti server. Tidak menghapus kartu
sebelum konfirmasi respons. Refresh mempertahankan kartu dan menyediakan
skeleton bila koleksi sebelumnya kosong; network error menyediakan reload,
sedangkan 403 menyembunyikan data sebelumnya. Dialog mengikuti focus
restoration bersama, dan reduced motion meniadakan animasi skeleton.

### Permintaan Kontak Perekrut

Header korespondensi putih memakai icon tile Send biru lembut 48px,
headline 24px/30px, copy 14px/24px, serta konteks Persetujuan kandidat pada
bidang accent. Tidak memakai maskot atau hero promosi pencarian. Header
membentang selebar AppPage; isi dan panduan kanan memakai gutter 24px serta
lebar pendukung 20rem/22rem. Filter berupa tombol 44px yang membungkus,
dengan tanda centang dan aria-pressed pada pilihan aktif.

Kartu korespondensi putih beradius 24px dengan shadow-sm menonjolkan nama
kandidat 20px/24px, referensi permintaan, serta status berikon dan label.
Tujuan serta pesan memakai bidang biru lembut, teks 14px/24px dan ruang
yang memadai. Waktu kirim, batas tanggapan, serta tanggapan aktual menjadi
metadata terbuka. Tidak ada hover lift, nomor kontak, progres palsu, atau
janji handoff otomatis. Ringkasan kanan memakai data server tanpa skor baru.

Konfirmasi pembatalan mewarisi dialog bersama dengan bidang konsekuensi,
processing inline, fokus yang dikembalikan, dan hasil mengikuti server.
Empty memakai motif arsip bersama. Refresh mempertahankan riwayat, skeleton
hanya tanpa data sebelumnya, dan reduced motion meniadakan animasi.

## Interaksi dan Asset

### Lembar Operasi Kampus

Validasi menyediakan pilihan Pengajuan menunggu dan Hasil disetujui pada bidang putih dengan pilihan biru lembut. Pencarian berlabel memakai input 16px dan tindakan 44px. Ringkasan karya disetujui tampil terbuka pada kartu berkas dengan teks 14px/24px; waktu pengajuan menjadi metadata berlabel. Unknown timestamp mendapat uraian teks, bukan status keterlambatan atau SLA. Panel berkas tetap mendahului daftar pada mobile dan tidak menambah kolom kerja.

Roster, Validasi Kontribusi, Peninjauan Inklusi, Pemetaan Kredit, dan Sinkronisasi Akademik mewarisi header ringkas Afiliasi: putih ke accent, radius 24px, shadow-sm, ikon 48px, judul 24px/30px, copy 14px/24px, dan kampus aktual pada pill. Motif arsip bersama hanya dekorasi header atau empty state. Tidak mengulang hero maskot pencarian pada setiap menu.

Form utama beradius 24px memakai permukaan putih, padding 16px/20px, label 14px, input/select 16px dengan tinggi 44px, border input, dan focus ring bersama. Panduan langkah terbuka atau panel accent menerangkan urutan kerja, bukan tracker progres. Metadata 12px/20px lebih tenang daripada judul berkas 18px/20px dan angka kredit 24px. Status memakai token verified, pending, correction, ikon, dan teks Indonesia.

Header serta filter membentang selebar AppPage. Grid kerja memiliki gutter 24px; panel berkas atau panduan mendampingi isi tanpa kolom ketiga yang mempersempit antrean. Pada mobile panel berkas aktif mendahului daftar. Kartu hasil sinkronisasi dan aturan kredit memakai fakta berlabel, bukan tabel teknis padat; jumlah kolom mengikuti lebar region. Tabel roster tetap memiliki batas scroll internal bernama dan fokus terlihat. Kartu statis saat hover, respons warna kontrol 220ms, reduced motion tanpa transform/animasi. Konfirmasi, error, processing, dan empty mewarisi primitive global, tidak menciptakan palet atau identitas baru.

Komponen Mascot bersama memakai pose welcome, guide, peek, atau celebrate. Gambar dekoratif mempunyai alt kosong dan tidak masuk tab order. Jika maskot dapat disapa, tampilkan sebagai tombol bernama “Sapa maskot SATU”; tap, Enter, dan Space memberi reaksi singkat serta copy yang tetap terbaca saat motion mati.

Emoji tidak dipakai dalam UI atau dokumentasi produk. Gunakan ikon dari lucide-react yang sudah tersedia. Asset bitmap tidak menggantikan graph, status, kontrol, atau data semantik. Runtime memakai gambar WebP transparan; master dan turnaround tetap disimpan utuh sebagai referensi.

## Kebenaran Produk

Gunakan alur username dan password, nomor WhatsApp, OTP, status afiliasi, serta data dashboard yang diberikan runtime. Jangan menambahkan email, pelanggan, harga, testimoni, hasil pilot, benchmark, streak, XP, atau angka impact tanpa sumber data yang sudah disetujui. Synthetic demo harus tetap berlabel **Data synthetic**.

Jangan tampilkan label stigmatisasi atau sinyal inclusion kepada student maupun recruiter. Private username, nomor telepon, raw evidence, isi diskusi, dan detail audit tidak boleh bocor pada projection publik atau recruiter.

## Accessibility dan Responsive

Targetnya WCAG 2.2 AA: landmark dan heading semantik, label dan error association, keyboard operation, visible focus, reduced motion, contrast, zoom 200%, dan reflow dari 320px. Semua action yang aktif menunjukkan pointer cursor; control disabled menggunakan cursor not-allowed dan tetap menjelaskan statusnya.

Wrapper ilustrasi dapat overflow dari card, sedangkan background card berada di layer terpisah. Konten dan focus indicator tetap berada di dalam viewport. Minimum, typical, maximum, loading, empty, processing, success, validation, network, stale, forbidden, expired, dan partial state dirancang sesuai kontrak surface.

### Bantuan Kesempatan T09

Surface mewarisi AppPage dan CampusOperationHeader, warna, tipografi, radius
24px, elevasi lembut, input 16px dan tombol 44px. Kebutuhan, tawaran dan riwayat
berlabel jelas, bukan skor atau label mahasiswa. Form mendahului riwayat pada
mobile; lembar terbuka mempertahankan ritme serta ruang error. Tidak ada
identitas visual baru, maskot tambahan, hover terangkat atau motion wajib.
Ringkasan perjalanan menggunakan fakta teks dan sumber, bukan funnel sukses
yang mengandaikan semua tahap lengkap.
