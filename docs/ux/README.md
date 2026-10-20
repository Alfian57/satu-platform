# Kontrak UI/UX SATU

## Persiapan UI

Sebelum mengubah UI, baca `PRODUCT.md`, `docs/product/PRD.md`, `DESIGN.md`, `SCREEN_INVENTORY.md`, dan `CONTENT_ACCESSIBILITY.md`. Baca juga dokumen UX dan engineering yang relevan dengan surface serta route yang dikerjakan.

Untuk surface baru atau perubahan behavior, dokumentasikan audience, job, outcome, batas permission, interaksi, responsive behavior, accessibility, dan state yang berlaku pada `SCREEN_INVENTORY.md` serta dokumen UX yang relevan. Jika ada issue, tautkan sumber tersebut dari issue. Perbarui dokumen pemilik saat kontrak berubah.

## Pemeriksaan Implementasi UI

1. Pastikan job, audience, mode, outcome, boundaries, interaksi, states, dan open gate jelas.
2. Bangun dengan token dan primitive Buku Besar Kolaborasi.
3. Periksa hierarchy, accessibility, responsive behavior, performance, dan product truth.
4. Periksa error, overflow, offline, stale, permission, empty, destructive, dan synthetic state yang relevan.
5. Rapikan motion, copy, alignment, density, dan interaksi akhir.

## Kesiapan Perubahan

- Behavior surface tercatat di `SCREEN_INVENTORY.md` dan dokumen UX terkait, selaras dengan DESIGN.
- Backend route, Policy, projection, dan state contract diketahui.
- Minimum, typical, maximum content serta error/recovery state didefinisikan.
- Scope dan kriteria penerimaan perubahan dapat diperiksa.

## Kriteria Selesai

- UI konsisten dengan selected direction dan reusable primitives.
- Wayfinder dipakai untuk backend route.
- WCAG 2.2 AA, keyboard, focus, reduced motion, responsive, dan semantic state diperiksa.
- Screenshot atau rekaman state disertakan bila diperlukan untuk memahami perubahan UI.
- Periksa visual hierarchy, accessibility, responsive states, recovery, dan product truth sebelum release gate.

## Asset Gambar

Identitas universitas pada sidebar memakai logo UTY yang diberikan pemilik
produk melalui public/images/uty-2.png (684x684 RGBA). Source dipertahankan,
SHA-256 dbe38f102ae218e3aa94047ae94132cea84e3309bc1e7239925aced07525157b.
Runtime public/images/university-uty.webp memakai resize LANCZOS 256x256 dan
kompresi WebP lossless, 62.470 byte. Bentuk serta transparansi dipertahankan,
tanpa image generation, pewarnaan ulang atau perubahan logo SATU. Logo
dekoratif mempunyai alt kosong karena nama universitas sudah berupa teks;
status afiliasi tetap label terpisah, bukan makna dari logo.

Gunakan asset hanya bila memberi informasi atau atmosfer yang tidak efektif melalui semantic UI. AI agent boleh membuat gambar sendiri dengan image generation jika belum ada asset yang disetujui. Simpan source, alt purpose, license atau generation provenance, dan optimized output. Jangan mengganti chart, graph, status, atau interactive control dengan gambar statis.

Untuk generate gambar maskot, gunakan [`maskot-01-burung-arsip-turnaround.png`](../../resources/images/mascot/reference/maskot-01-burung-arsip-turnaround.png) sebagai acuan identitas dan sudut pandang. Gunakan [`maskot-01-burung-arsip.png`](../../resources/images/mascot/reference/maskot-01-burung-arsip.png) sebagai acuan material dan ekspresi. Pertahankan bentuk, warna, pola bulu, dan tas maskot kecuali pengguna memilih perubahan.

Artwork runtime saat ini memakai WebP transparan `public/images/mascot-welcome.webp`, `mascot-guide.webp`, dan `mascot-peek.webp`. Gambar welcome dan guide dibuat dengan image generation menggunakan dua acuan di atas; peek memakai gambar maskot terpilih. Simpan master dan turnaround di `resources/images/mascot/reference/`, terpisah dari WebP runtime. Komponen menyajikan dekorasi dengan alt kosong, atau tombol aksesibel bila reaksi maskot dapat dipicu.

Login dan register memakai variasi tersendiri: `mascot-login-return` dan
`mascot-register-start`. Master PNG transparan serta
[`auth-mascots.provenance.json`](../../resources/images/mascot/auth-mascots.provenance.json)
berada di `resources/images/mascot/`. WebP 256px, 512px dan 1024px berada di
`public/images/` dan dipilih melalui srcset. Pose register juga dipakai pada
OTP, tanpa mencerminkan hasil verifikasi. Variasi ini tidak menimpa pose lama
atau mengganti identitas, tas, warna serta pola bulu referensi.

Latar login dan register mengikuti gambar `public/referensi/login.png`.
Master `resources/images/mascot/auth-entry-background.png` merupakan plate
latar tanpa teks, maskot atau kontrol. Runtime memakai
`public/images/auth-entry-background.webp` dengan konversi lossless.
Prompt, sumber, hash dan tujuan dekoratif dicatat di
[`auth-entry-background.provenance.json`](../../resources/images/mascot/auth-entry-background.provenance.json).
Field, balon, orbit dan elemen pendukung tetap HTML/CSS, bukan UI dalam gambar.

Pop-up afiliasi memakai pose `mascot-affiliation-check` dengan clipboard kosong.
Master PNG berada di `resources/images/mascot/`, WebP 256px/512px/1024px di
`public/images/`. Prompt serta sumber dicatat pada
[`affiliation-mascot.provenance.json`](../../resources/images/mascot/affiliation-mascot.provenance.json).
Ilustrasi dekoratif ini bukan hasil pencocokan atau persetujuan mahasiswa.
Pose lain tidak ditimpa.

Beranda yang menunggu verifikasi memakai pose `waiting-review` melalui asset
`mascot-waiting-lap`: duduk pada dudukan putih-biru sambil memangku satu buku
tertutup dengan kedua sayap. Tidak ada buku di bawah badan atau kaki, indikator
waktu maupun persetujuan. Artwork tidak memuat batu bertekstur; gundukan
putih-biru yang disukai pemilik produk tetap dibuat dalam CSS.
Identitas, warna dan tas cross-body tetap. Master PNG transparan
berada di `resources/images/mascot/`, dengan WebP 256px/512px/1024px di
`public/images/`. Sumber, prompt dan hasil optimasi dicatat pada
[`waiting-lap-mascot.provenance.json`](../../resources/images/mascot/waiting-lap-mascot.provenance.json).
Maskot dekoratif ini statis. Status pengajuan dan tindakan tetap HTML.
Asset waiting-review lama dan varian batu bertekstur dipertahankan sebagai
sumber edit, tidak dipakai runtime.

Hero Beranda pending memakai panorama `dashboard-affiliation-campus` yang
disiapkan mengikuti banner pada `beranda-verif.png`. Master PNG terpisah
berada di `resources/images/mascot/`, WebP 768px/1280px/2560px di `public/images/`.
Ilustrasi tidak memuat teks, kontrol atau maskot, dan bukan foto dokumentasi
kampus. Prompt, sumber serta hash dicatat pada
[`dashboard-affiliation-campus.provenance.json`](../../resources/images/mascot/dashboard-affiliation-campus.provenance.json).
Teks/tombol tetap HTML dan maskot memakai asset transparan waiting-review.

Panorama hanya dipakai pada hero; kartu afiliasi memakai bidang putih tanpa
gambar latar. Dokumen 3D dan folder 3D pada kartu pending serta terverifikasi memakai master
PNG transparan `dashboard-review-document.png` serta `dashboard-project-folder.png`
di `resources/images/mascot/`. WebP dokumen 256px/512px dan folder 128px/256px
berada di `public/images/`. Prompt serta hash tersimpan pada
[`dashboard-pending-cards.provenance.json`](../../resources/images/mascot/dashboard-pending-cards.provenance.json).
Keduanya dekoratif, bukan hasil persetujuan atau proyek mahasiswa yang ada.
Lengkung ivory, gelombang biru serta nomor alur tetap HTML/CSS. Teks, status
dan kontrol tidak dimasukkan ke asset gambar.

Hero Proyek dan Kontribusi memakai komponen StudentMenuHero bersama, dengan
pose terpisah project-plan dan contribution-notes. Maskot Kontribusi menulis
pada jurnal terbuka memakai pensil oranye, tanpa cap atau tanda persetujuan.
Master PNG transparan berada di `resources/images/mascot/mascot-contribution-notes.png`,
dengan WebP 256px/512px/1024px di `public/images/`. Referensi identitas, prompt
serta hash dicatat di
[`contribution-notes-mascot.provenance.json`](../../resources/images/mascot/contribution-notes-mascot.provenance.json).
Seluruh teks dan tindakan tetap HTML; animasi masuk satu kali mengikuti
Beranda/Proyek dan menghormati reduced motion. Pose lama tidak ditimpa.

Portofolio memakai pose portfolio-showcase yang memperlihatkan map karya,
sedangkan Peringkat memakai ranking-context yang membaca laporan dengan kaca
pembesar. Keduanya tidak memuat cap, medali, skor atau klaim hasil. Master PNG
transparan berada di `resources/images/mascot/mascot-portfolio-showcase.png`
dan `resources/images/mascot/mascot-ranking-context.png`; WebP 256px/512px/1024px
berada di `public/images/`. Referensi, prompt dan hash dicatat di
[`portfolio-showcase-mascot.provenance.json`](../../resources/images/mascot/portfolio-showcase-mascot.provenance.json)
dan [`ranking-context-mascot.provenance.json`](../../resources/images/mascot/ranking-context-mascot.provenance.json).
Hero memakai StudentMenuHero tanpa perubahan jangkauan karya, persetujuan
peringkat atau pose lama. Halaman portofolio publik tidak memakai pose baru.

Latar lima menu memakai plate berbeda: student-hero-home (kampus ilustratif),
student-hero-projects (rancangan), student-hero-contributions (jurnal),
student-hero-portfolio (galeri bingkai kosong) dan student-hero-rankings
(skala ukur tanpa angka). Imagegen bawaan membuat satu gambar per tema.
Master PNG 2172x724 disimpan di resources/images/mascot; WebP 768px, 1280px
dan 2048px di public/images dipilih lewat srcset StudentHeroBackdrop.
Prompt lengkap, tujuan, generation ID, hash dan anggaran hasil optimasi ada pada
[`student-hero-backgrounds.provenance.json`](../../resources/images/mascot/student-hero-backgrounds.provenance.json).
Plate hanya atmosfer dekoratif, bukan foto UTY, karya, data, grafik atau hasil
verifikasi. Maskot, teks dan kontrol tetap terpisah. Panorama Beranda pending
dan asset lama tidak ditimpa. Motif SVG arsip tetap dipakai pada kondisi kosong,
bukan ditumpuk di atas plate hero baru. Gambar yang gagal tidak menutup kontrol.

Pengaturan akun memakai pose account-care dengan satu kunci kuningan dan
tas asli, serta plate settings berupa ceruk arsip ivory-biru dengan aksen
oranye. Keduanya dibuat dengan imagegen bawaan; maskot mengikuti dua referensi
identitas canonical. Master PNG berada di resources/images/mascot dengan nama
mascot-account-care dan student-hero-settings. WebP maskot 256px/512px/1024px
mempertahankan alpha; plate 768px/1280px/2048px disajikan melalui srcset.
Prompt lengkap, generation ID, sumber, ukuran serta hash dicatat pada
[`settings-hero.provenance.json`](../../resources/images/mascot/settings-hero.provenance.json).
Keduanya dekoratif dengan alt kosong, bukan status keamanan, hasil verifikasi
atau kontrol akun. Asset menu lain tidak ditimpa. Teks, status, navigasi serta
form tetap HTML dan dapat digunakan ketika gambar gagal dimuat.

Konfirmasi password memakai pose confirm-access yang memegang gembok kuningan,
statis tanpa sapaan atau reaksi terhadap hasil validasi. Master PNG transparan
resources/images/mascot/mascot-confirm-access.png mengikuti dua referensi
identitas. WebP 256px/512px/1024px berada di public/images; prompt, generation
ID, hash serta hasil optimasi dicatat pada
[`confirm-access-mascot.provenance.json`](../../resources/images/mascot/confirm-access-mascot.provenance.json).
Halaman memakai ulang auth-entry-background dari login/register, bukan plate
baru. Maskot bukan hasil konfirmasi; form, bantuan, balon serta status tetap
HTML. Pose login, register dan halaman lain tidak diganti.

## Ownership

Global visual change dimiliki `DESIGN.md`. Surface inventory dan behavior dimiliki `SCREEN_INVENTORY.md` beserta dokumen UX terkait. Canonical copy dan accessibility dimiliki `CONTENT_ACCESSIBILITY.md`. Task status dimiliki GitHub issue, bukan dokumen UX.
