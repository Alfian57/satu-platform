---
name: SATU
description: Buku Besar Kolaborasi dengan maskot burung yang menemani mahasiswa bekerja bersama
---

# Design System: SATU

## Arah Visual

SATU menggabungkan struktur **Buku Besar Kolaborasi** dengan suasana langit yang terang, ramah, dan penuh rasa ingin tahu. Informasi tetap tertata dan dapat dipercaya. Maskot burung raja udang menjadi teman visual yang mengantar pengguna ke tindakan berikutnya.

Landing memakai mode **Persuade**. Auth, onboarding, dan dashboard memakai mode **Operate**. Warna biru muda, permukaan putih, sudut yang lembut, dan ilustrasi maskot membangun suasana. Hierarki data, izin, status, deadline, dan aksi tetap terbaca terlebih dahulu. Maskot boleh keluar dari tepi card atau panggungnya selama tidak menutupi teks, kontrol, atau batas viewport.

Gunakan maskot yang sama pada semua role dan route. Pertahankan bentuk, proporsi, pola bulu biru, dada ivory, marking jingga, paruh grafit, kaki, dan tas buku cross-body. Referensi sumber disimpan di `resources/images/mascot/reference/`: `maskot-01-burung-arsip.png` untuk material dan ekspresi, serta `maskot-01-burung-arsip-turnaround.png` untuk identitas dan empat sudut pandang. Artwork runtime teroptimasi disimpan di `public/images/mascot-*.webp`.

**Karakter visual:**

- Biru langit yang lapang, kartu putih, dan CTA kobalt yang mudah dikenali.
- Maskot menjadi focal point landing dan greeting dashboard, serta pemandu kecil pada auth dan onboarding.
- Card dipakai untuk grouping yang jelas; bobot visual mengikuti prioritas tindakan dan data, bukan membuat semua informasi tampak setara.
- Aksen jingga hanya dekoratif dan mengikuti marking bulu maskot. Status domain memakai warna semantic khusus.
- Interaksi terasa hidup melalui pilihan tahap, tab, hover, tap, dan feedback singkat. Motion tidak menjadi syarat untuk memahami atau menyelesaikan task.

## Tokens

### Warna

| Token          | Nilai   | Pemakaian                           |
| -------------- | ------- | ----------------------------------- |
| Canvas         | #F3F9FF | Latar global                        |
| Surface        | #FFFFFF | Form, card, menu, panel             |
| Ink            | #17345A | Teks utama dan icon penting         |
| Muted          | #526B85 | Copy pendukung dan metadata         |
| Primary        | #1764E8 | CTA dan selected navigation         |
| Primary hover  | #1454C4 | Hover dan pressed CTA               |
| Focus          | #1746B0 | Focus keyboard yang terlihat        |
| Soft blue      | #E7F2FF | Selected surface dan grouped region |
| Soft border    | #D9E8F5 | Pemisah dan card border             |
| Input boundary | #7892AE | Batas input dan select              |
| Feather accent | #FFB85C | Dekorasi maskot, bukan status       |

Primary/putih memiliki rasio kontras 5.22:1, muted/putih 5.53:1, dan input boundary memenuhi kontras non-teks terhadap canvas. Token verified, pending, dan correction tetap dipakai untuk status domain, selalu bersama label atau icon yang menjelaskan artinya.

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

### Landing

Seluruh sistem memakai simbol burung-buku konsep kedua. Master transparan
berada di `public/image/logo-satu-konsep-02.png`; asset runtime bersama adalah
`public/images/logo.png` berukuran 256px. Wordmark SATU tetap berupa teks.
Komponen AppLogo dipakai oleh landing, auth, sidebar seluruh role, dan header
portofolio publik. Simbol tampil utuh dengan object-contain: 32px secara default,
56px pada sidebar, 44px pada footer/mobile landing, serta 48px pada navbar
landing mulai sm. Fokus tautan, gutter, dan maskot tidak berubah.

Favicon memakai simbol yang sama: PNG transparan 64px, ICO multiukuran
16/32/48px, SVG mandiri dengan bitmap tertanam, serta apple-touch-icon 180px
berlatar putih. URL logo dan ikon memiliki versi logo-02 untuk memperbarui
cache browser. Asset pada path lama diganti, bukan hanya tautannya.

Gunakan header ringkas, hero copy dan CTA yang jelas, serta panggung biru muda dengan maskot besar yang keluar dari batas card di sisi yang memiliki ruang. Jaga teks dan CTA di lapisan atas yang bebas dari tabrakan. Journey kolaborasi, demo kesempatan sampai pengakuan dengan peta pelengkap, role selector, batas privasi, dan footer tetap menjelaskan produk dengan fakta runtime yang tersedia.

Redesign landing memakai komposisi editorial: hero dua kolom pada desktop,
urutan teks lalu maskot pada mobile, judul Familjen Grotesk 32px pada mobile
sampai 72px pada desktop sebagai varian Persuade,
body 16px sampai 18px, serta metadata minimal 12px. Header berisi identitas
asli, tautan section, dan aksi akun; mobile memakai disclosure navigasi dengan
tombol 44px. Breakpoint navigasi header mengikuti lebar container agar zoom tidak membuat navigasi dan aksi akun meluap. Motif lembar arsip bersama dan aksen bulu jingga hanya mendampingi
hero serta ajakan penutup. Kartu tidak terangkat saat hover.

Seluruh landing memakai container fluid tanpa batas lebar tetap 80rem.
Header, hero, setiap section, dan footer berbagi gutter horizontal
16px pada mobile, lalu clamp(1rem, 5.5vw, 10rem) mulai lebar 640px sampai
160px pada layar sangat besar. Konten sedikit lebih ke tengah tanpa kembali
ke batas lebar tetap. Panjang paragraf tetap dibatasi untuk
keterbacaan; grid dan panel mengikuti ruang tersedia. Panggung maskot desktop
bertambah proporsional dari 38rem sampai 52rem, dengan gambar maksimal 28rem,
tanpa menjauhkan balon percakapan dari burung atau mengubah urutan mobile.

Pada desktop, kolom teks hero rata atas dengan kolom panggung maskot. Inset
atas teks 8px mengikuti ruang kartu fitur pada panggung, bukan dipusatkan
vertikal berdasarkan tinggi area sapaan. Pada mobile, teks tetap mendahului
maskot tanpa inset desktop tambahan.

Isi kotak hero utama mendapat inset horizontal tersendiri: 20px pada mobile,
32px mulai tablet, lalu clamp(4rem, 4vw, 6rem) mulai desktop. Teks, tindakan,
panggung maskot, dan ringkasan bawah bergerak sedikit ke tengah secara simetris.
Container luar, posisi kotak, gutter landing, navbar, dan ajakan penutup tidak
berubah. Inset bertambah terbatas pada layar besar tanpa mempersempit mobile.

Urutan isi adalah hero, perjalanan interaktif, pratinjau fitur berselang-seling,
demo perjalanan utama synthetic dengan peta pelengkap, pilihan peran, batas privasi, dan ajakan mulai. Perjalanan
serta pilihan peran memakai tab keyboard dan panel bergeometri stabil. Semua
pratinjau bertanda Data synthetic, bersifat baca-saja, dan bukan command nyata.
Bidang putih, bagian terbuka, serta panggung biru bergantian agar tiap bagian
memiliki karakter tanpa mengganti identitas global.

Maskot interaktif khusus landing menampilkan petunjuk Sapa aku dan sapaan yang
bertahan sampai ditutup pengguna. Tombol Lihat cara kerja merupakan pilihan
eksplisit, bukan navigasi otomatis. Pointer halus dapat memberi tilt maksimal
dua derajat dan pergeseran maksimal empat piksel. Tap dan keyboard memberi
reaksi yang setara. Gambar statis tidak disajikan seolah memiliki rig kedipan
atau kepakan sayap. Sapaan mendapat ruang sendiri, tidak menutupi CTA.

Panggung maskot pada hero memakai halo biru bertekstur titik, orbit tipis,
lembar arsip, dan aksen bulu jingga dekoratif. Tiga kartu putih berlapis
bertuliskan Temukan proyek, Berkarya bersama, dan Susun portofolio mengelilingi
gambar dalam slot grid tersendiri, bukan menutupi wajah atau tindakan utama.
Kartu memakai ikon Lucide, judul 14px, metadata 12px, radius 16px, bayangan
lembut, dan target minimal 44px. Kartu merupakan pilihan penjelasan lokal,
bukan status akun atau klaim karya yang telah divalidasi.

Memilih kartu membuka penjelasan maskot beserta tautan section yang relevan.
Pilihan ditandai label Dipilih dan aria-pressed. Sapaan serta penjelasan memakai
balon percakapan putih beradius 24px dengan ekor dekoratif mengarah ke burung.
Label Pesan dari maskot membedakan penjelasan lokal dari chat atau pesan akun.
Pada desktop, panggung memiliki lajur pesan di kiri gambar, sejajar vertikal
dengan tubuh burung, bukan panel di bawah copy utama. Kolom panggung mendapat
ruang lebih lebar agar balon tidak menimpa judul, CTA, kartu, atau wajah maskot.
Tinggi balon mengikuti isi sampai 20rem dengan scroll internal bila diperlukan.
Tidak ada cadangan tinggi di bawah hero ketika pesan ditutup. Menutupnya
mengembalikan fokus ke pemicu terakhir. Pointer halus memberi parallax kecil
pada gambar serta dekorasi dengan respons 220ms; tidak ada loop otomatis.
Mobile mempertahankan urutan kartu atas, gambar, lalu kartu bawah tanpa
overflow; balon tampil langsung setelah burung dan sebelum kartu portofolio
saat dibuka pada mobile, dengan ekor mengarah ke atas. Kartu proyek
dan kerja tim memakai jarak kolom 18px pada mobile dan 28px mulai tablet.
Pada desktop, kartu proyek bergeser 12px ke kiri dalam gutter yang tersedia.
Reduced motion menghapus transform dekorasi dan parallax tanpa
menghilangkan pilihan, penjelasan, atau fokus.

Entrance dan reveal terjadi sekali selama 420ms; pergantian panel serta respons
kontrol memakai 220ms. Konten tetap terlihat tanpa observer atau JavaScript.
Tidak ada loop otomatis atau scroll hijack. Reduced motion meniadakan entrance,
tilt, reveal, dan smooth scroll. Hero memakai WebP existing berprioritas tinggi;
maskot penutup lazy dan graf dimuat melalui boundary loading/error tersendiri.

### Demo Perjalanan Utama T10

Demo memakai lembar putih radius 24px, bidang biru lembut, shadow-md selektif,
ikon Lucide dan tipografi existing. Pilihan tahap serta skenario membungkus
pada mobile; rincian dan konteks menjadi dua kolom mulai desktop. Judul,
peran aktor, keadaan contoh dan langkah berikutnya mendahului metadata.
Tombol 44px, fokus terlihat, disabled not-allowed dan transisi warna 220ms
tetap mengikuti token global. Tidak ada autoplay, indikator progres akun,
graf popularitas atau identitas visual baru. Peta existing adalah pelengkap
dalam disclosure, bukan pengganti alur kesempatan sampai pengakuan.

### Demo Peta Kolaborasi

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

Auth memakai panel form putih dan ruang ilustrasi maskot yang terpisah. Pada mobile, form mendapat prioritas dan maskot mengintip dari tepi panel tanpa mengecilkan tap target. Onboarding memisahkan progress, form, dan status afiliasi; area form dapat digulir, tombol tahap tetap dapat dicapai, dan maskot tidak berada di focus order kecuali disajikan sebagai tombol sapaan.

Login dan registrasi memakai panggung kolaborasi khusus pada panel kiri:
halo berpola titik, orbit tipis, motif arsip bersama, aksen bulu hangat,
balon sapaan, dan maskot sebagai fokus visual. Kartu konsep proyek, kontribusi,
serta portofolio tidak diulang dari hero landing. Motif arsip dan kilau kecil
hanya dekorasi, bukan kontrol atau data akun. Slot grid memisahkan balon dan maskot agar
tidak menutupi wajah, teks, atau fokus. Warna dan tipografi mewarisi token SATU.
Login dan registrasi memakai header setinggi minimal 64px dengan padding
vertikal 10px. Isi rata atas, bukan dipusatkan vertikal: inset utama atas 8px
dan bawah 24px, dengan jarak mobile 12px. Form berpadding 20px pada mobile dan
24px mulai tablet; judul 28px, deskripsi 14px dengan jarak baris 20px, serta
jarak antarkolom isian registrasi 16px. Login memakai padding 24px pada mobile
dan 32px mulai tablet, jarak header form 28px, jarak antarisian 24px,
serta jarak label ke input 8px agar tidak terasa rapat. Input tetap 16px, tinggi input dan tombol minimal
44px, label serta bantuan tetap terlihat. Pemisah dekoratif bertuliskan atau dihapus;
tautan pindah login/registrasi tetap di bawah garis tipis.
Container tumbuh sampai 100rem dengan gutter responsif 5.5vw; panggung
maksimal 42rem, maskot 26rem, dan formulir maksimal 32rem pada layar besar.
Mulai lebar 1536px, ukuran mengikuti viewport: container
clamp(100rem, 80vw, 128rem), form clamp(32rem, 29vw, 42rem), panggung
clamp(42rem, 35vw, 54rem), serta maskot clamp(26rem, 20vw, 34rem).
Header memakai batas form dan container yang sama. Pada layar tinggi minimal
900px, judul form berkembang 30px sampai 36px, pengantar 48px sampai 64px,
body pengantar 18px, dan bubble 16px dengan lebar 15rem sampai 18rem.
Pada tinggi minimal 1000px, kontrol menjadi 48px dengan label/tombol 16px,
bantuan 14px, serta padding form dan jarak pengantar yang lebih lega.
Layar lebar tetapi pendek tetap memakai kepadatan dasar agar tidak menambah
scroll vertikal yang tidak perlu. Aturan berlaku pada login, register, dan OTP;
mobile, recovery, dan confirm-password tidak berubah.
Header mengikuti kolom dan batas formulir yang sama; tepi kanan tombol
Kembali ke beranda sejajar dengan tepi kanan kartu form, termasuk ultrawide.
Heading pengantar 36px sampai 48px, dengan margin 16px dan uraian 16px/26px.
Jarak panggung 20px, balon 16px, dan catatan privasi 16px menjaga karakter
visual tanpa memanjangkan form. Tinggi mengikuti isi, tidak memakai viewport
terkunci, transform negatif, atau pemotongan error dan tahap OTP.
Pada mobile, heading pengantar disembunyikan. Panggung ringkas dengan maskot
80px dan satu balon sapaan pendek mendahului form tanpa menambah kartu fitur.
Tidak menambah animasi berulang atau mengubah alur
username, password, WhatsApp, OTP, recovery, maupun afiliasi.

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
pada layar lebih kecil. Langkah utama berupa lembar kerja putih berelevasi md,
kepala bergradasi ringan, ikon kompas kobalt, judul dominan, fakta terbuka dengan
pemisah tipis, dan footer tindakan. Proyek aktif memiliki kepala bagian terbuka
dan satu daftar putih dengan row berpemisah, label langkah berikutnya, serta
bidang deadline semantic. Tidak ada shadow pada setiap row saat diam.
Panel rekomendasi biru lembut menonjolkan nama proyek, peran, serta alasan
pencocokan; tindakan outline menjaga bobotnya di bawah langkah utama.
Bekal profil dan informasi validasi menggunakan bagian terbuka tanpa kartu
tambahan. Ringkasan alur menutup halaman dengan empat penjelasan terbuka,
bukan progress tracker. Permukaan utama memakai radius 24px, gutter 24px,
serta tombol beradius 12px. Hero mempertahankan maskot welcome dan sapaan,
ditambah motif lembar arsip dekoratif serta penanda jingga kecil. Motif arsip
juga tersedia pada kondisi proyek kosong, bukan pada setiap kartu. Hero
Beranda memiliki margin atas tambahan 24px mulai sm dan 48px mulai lg untuk
menjaga maskot serta ring fokusnya terpisah dari navbar. Padding shell dan
jarak hero mobile tetap sama.

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

Menu minimal 52px memakai label 14px, ikon 18px pada bidang 36px, serta radius
16px. Pilihan aktif memiliki border primary/15, gradasi accent, dan shadow-sm
yang statis. Ikon aktif berada pada bidang putih. Hover hanya mengubah warna
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

Primitive bersama mempertahankan radius tombol/input 12px, kartu/dialog 24px,
badge pill, teks status semantic, dan shadow lembut. Tombol utama berukuran
44px, tombol padat 36px, dan fokus tetap terlihat. Dialog memakai permukaan
putih, backdrop grafit 40%, judul yang tidak tertutup tombol tutup, serta batas
tinggi viewport dengan scroll internal. Drawer memakai easing 420ms saat masuk
dan 220ms saat keluar. Reduced motion meniadakan gerak tambahan. Styling
primitive tidak menggantikan state, validasi, atau otorisasi pada konsumennya.

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

Penemuan proyek memakai hero biru muda berelevasi md, maskot guide dekoratif,
motif lembar arsip, dan tindakan membuat proyek.
Tombol Buat proyek pada hero tetap statis saat hover, tanpa perubahan warna,
bayangan, atau posisi. Pointer serta indikator fokus keyboard dipertahankan.
Pencarian menjadi lembar utama putih dengan border biru ringan serta shadow md;
filter tambahan berada dalam
disclosure bernama dengan ringkasan pilihan yang sudah diterapkan.
Kartu peluang memakai grid dua kolom mulai xl, satu kolom pada mobile, border
lembut, radius 24px, judul 20px sampai 24px, ringkasan tiga baris, serta bidang
kebutuhan peran bergradasi biru lembut. Keahlian dan metadata deadline,
kapasitas, serta pemilik memiliki bobot lebih tenang tanpa kartu bersarang.
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

Ruang kerja T07 mewarisi lembar tugas, input, dialog dan token SATU. Kepala
ringkas serta arahan kerja terbuka mendahului pilihan tugas. Detail menonjolkan
hasil yang diharapkan dan penanggung jawab. Bukti privat berdiri sendiri sebelum
diskusi opsional. Kartu memakai radius 24px dan bayangan lembut selektif, bukan
identitas baru atau maskot pada tiap tugas. Panel menumpuk pada mobile, fokus
detail terlihat, error membungkus, dan gerak nonesensial dinonaktifkan pada
reduced motion.

### Kontribusi Mahasiswa

T08 mempertahankan lembar individual existing. Panduan bukti dan batas validasi
memakai disclosure putih/biru lembut, bukan hero baru. Ringkasan yang dapat
dibagikan diberi label jelas; pernyataan serta bukti berlabel privat. Pemulihan
snapshot memakai bidang correction dengan tombol 44px, fokus terlihat dan
konfirmasi sebelum membuang draft. Bukti reviewer memakai tautan privat
existing. Motion dan susunan mobile tetap mewarisi token bersama.

Daftar, penyusunan draft, detail, dan revisi memakai batas konten AppPage yang
sama dengan Beranda dan Proyek. Hero biru langit membentang selebar konten,
dengan maskot guide dekoratif pada daftar. Kartu putih beradius 24px, bidang
biru lembut, gutter 24px, dan tindakan 44px mempertahankan identitas global.

Daftar memakai pencarian dan pilihan status lokal terhadap entri yang sudah
dikirim server. Kartu menonjolkan tugas, proyek, status, versi, dan waktu
pembaruan aktual. Penjelasan Susun, Kirim, dan Kelola portofolio adalah
pengenalan alur, bukan progres atau jaminan validasi. Tidak menambahkan XP,
persentase, atau statistik contoh.

Hero berelevasi md memakai motif lembar arsip dan penanda jingga dekoratif
yang sama dengan Proyek. Kondisi daftar kosong memakai ilustrasi arsip tanpa
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

Daftar dan detail mahasiswa memakai AppPage tanpa pembatas lebar tambahan.
Hero biru langit selebar konten diikuti grid koleksi atau rincian di kiri dan
kendali profil di kanan. Mobile menumpuk dalam batas konten yang sama. Kartu
putih beradius 24px, jarak 24px, bidang lembut, badge pill, dan tindakan 44px
mewarisi Beranda, Proyek, dan Kontribusi. Maskot guide pada daftar tetap
dekoratif, bukan ilustrasi karya atau pengganti data.

Koleksi ditampilkan sebagai kartu karya dengan judul, ringkasan, tingkat
verifikasi aktual, status berbagi, jangkauan, versi sumber, dan tanggal.
Pencarian serta filter lokal hanya membaca karya yang dikirim server. Kontrol
jangkauan per karya berada di bawah ringkasan kartu; pengaturan profil terpisah
dari izin ditemukan perekrut. Pilihan belum tersimpan tidak ditampilkan sebagai
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

Motif arsip SVG yang sama dengan Beranda mendampingi hero serta kondisi kosong;
aksen bulu hangat dipakai hanya pada hero koleksi. Kendali profil beradius 24px
memakai lapisan dari putih ke accent/60, fakta tersimpan dengan pembatas garis,
dan bidang putih terpisah untuk izin perekrut. Kontrol jangkauan karya beradius
16px dengan lapisan lebih tenang. Pesan processing mendapat ruang tetap 20px,
ikon memuat bersifat dekoratif, dan perubahan tersimpan tetap mengikuti respons
server. Detail mengutamakan lembar ringkasan putih shadow-md dan fakta sumber
terbuka. Halaman publik mewarisi motif arsip, heading terbuka, judul karya yang
lebih besar, serta karya terbaru sebagai lembar utama tanpa animasi kartu.

### Peringkat Mahasiswa

Peringkat memakai hero biru langit fullwidth dan maskot guide dekoratif,
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

Polesan Peringkat memakai hero gradasi biru langit berelevasi md, motif arsip
SVG bersama, penanda bulu hangat dekoratif, serta maskot guide kecil yang tidak
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

Profil, Keamanan, dan Tampilan memakai AppPage serta hero biru langit fullwidth
dengan maskot guide dekoratif. Navigasi tiga kategori berada di bawah hero;
bidang putih beradius 24px, icon tile biru, dan pilihan aktif biru lembut
meneruskan shell tanpa penanda garis vertikal. Pada mobile label dan ikon
menumpuk di tiga kolom tanpa overflow. Formulir di kiri dan panduan di kanan
memakai gutter 24px, lalu menumpuk pada layar kecil.

Kartu formulir membedakan identitas, private username, dan password melalui
label jelas, bidang lembut, bantuan, serta footer simpan 44px. Status belum
tersimpan, processing, sukses, dan error tetap semantik. Kartu hapus akun
terpisah memakai border correction ringan pada permukaan putih, bukan bidang
merah dominan. Dialog memprioritaskan konsekuensi dan konfirmasi password;
username, password, serta data privat tidak menjadi dekorasi halaman.

Tampilan menyediakan preview statis warna dan struktur aktual, status Mode
terang aktif, serta penjelasan baca-saja. Tidak membuat toggle gelap, data
contoh tanpa label, animasi wajib, atau tombol yang tidak memiliki tindakan.

### Ringkasan Operator Kampus

Ringkasan memakai AppPage fullwidth dengan jarak region 16px/20px dan hero
yang mengikuti Cari Talenta perekrut: gradasi biru langit ke putih, radius
32px, border primary/10, shadow-md, motif arsip, dan aksen bulu jingga.
Pading 24px/32px/40px, headline 30px/36px/48px dengan baris penekanan biru,
copy 14px/16px, serta kampus aktif pada pill putih. Maskot guide memakai
slot 9rem/13rem/16rem mulai sm, tampil 112px pada mobile, tidak keluar menuju
navbar. Filter memakai lembar putih pading 16px, label 14px, input 16px,
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
AF-id dalam Azeret Mono, data masked berlabel, metadata 12px/20px, serta
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
