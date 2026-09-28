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

Gunakan header ringkas, hero copy dan CTA yang jelas, serta panggung biru muda dengan maskot besar yang keluar dari batas card di sisi yang memiliki ruang. Jaga teks dan CTA di lapisan atas yang bebas dari tabrakan. Journey kolaborasi, synthetic graph demo, role selector, batas privasi, dan footer tetap menjelaskan produk dengan fakta runtime yang tersedia.

### Auth dan Onboarding

Auth memakai panel form putih dan ruang ilustrasi maskot yang terpisah. Pada mobile, form mendapat prioritas dan maskot mengintip dari tepi panel tanpa mengecilkan tap target. Onboarding memisahkan progress, form, dan status afiliasi; area form dapat digulir, tombol tahap tetap dapat dicapai, dan maskot tidak berada di focus order kecuali disajikan sebagai tombol sapaan.

### Dashboard dan Shell

Student dashboard menempatkan salam, satu nextAction yang nyata, dan pekerjaan aktif pada kolom utama. Maskot keluar dari hero card ke ruang dekorasi yang disediakan. Rekomendasi dan explanation berada di panel pendukung. Tidak ada streak, XP, goal, completion percent, atau leaderboard palsu.

Sidebar dan header mewarisi warna, radius, tipografi, serta focus treatment yang sama. Redesign dashboard mahasiswa tidak mengubah aturan navigasi atau isi surface campus, recruiter, dan platform.

## Interaksi dan Asset

Komponen Mascot bersama memakai pose welcome, guide, peek, atau celebrate. Gambar dekoratif mempunyai alt kosong dan tidak masuk tab order. Jika maskot dapat disapa, tampilkan sebagai tombol bernama “Sapa maskot SATU”; tap, Enter, dan Space memberi reaksi singkat serta copy yang tetap terbaca saat motion mati.

Emoji tidak dipakai dalam UI atau dokumentasi produk. Gunakan ikon dari lucide-react yang sudah tersedia. Asset bitmap tidak menggantikan graph, status, kontrol, atau data semantik. Runtime memakai gambar WebP transparan; master dan turnaround tetap disimpan utuh sebagai referensi.

## Kebenaran Produk

Gunakan alur username dan password, nomor WhatsApp, OTP, status afiliasi, serta data dashboard yang diberikan runtime. Jangan menambahkan email, pelanggan, harga, testimoni, hasil pilot, benchmark, streak, XP, atau angka impact tanpa sumber data yang sudah disetujui. Synthetic demo harus tetap berlabel **Data synthetic**.

Jangan tampilkan label stigmatisasi atau sinyal inclusion kepada student maupun recruiter. Private username, nomor telepon, raw evidence, isi diskusi, dan detail audit tidak boleh bocor pada projection publik atau recruiter.

## Accessibility dan Responsive

Targetnya WCAG 2.2 AA: landmark dan heading semantik, label dan error association, keyboard operation, visible focus, reduced motion, contrast, zoom 200%, dan reflow dari 320px. Semua action yang aktif menunjukkan pointer cursor; control disabled menggunakan cursor not-allowed dan tetap menjelaskan statusnya.

Wrapper ilustrasi dapat overflow dari card, sedangkan background card berada di layer terpisah. Konten dan focus indicator tetap berada di dalam viewport. Minimum, typical, maximum, loading, empty, processing, success, validation, network, stale, forbidden, expired, dan partial state dirancang sesuai kontrak surface.
