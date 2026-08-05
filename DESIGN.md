---
name: SATU
description: Buku Besar Kolaborasi untuk kerja, kontribusi, dan validasi mahasiswa
---

<!-- SEED: established with the user before implementation; re-run $impeccable document once there's code to capture the actual tokens and components. -->

# Design System: SATU

## Overview

**Creative North Star: "Buku Besar Kolaborasi"**

SATU terasa seperti buku besar universitas yang berubah dari arsip pasif menjadi alat kerja hidup. Struktur ledger, tab indeks, catatan provenance, dan status validasi membantu pengguna memahami siapa mengerjakan apa, langkah berikutnya, serta bagaimana sebuah kontribusi memperoleh kepercayaan. Dunia ini bersifat institusional tanpa menjadi birokratis: bahasa ringkas, aksi cepat, dan ruang kolaborasi tetap terasa dibuat untuk mahasiswa.

Mode utama aplikasi adalah **Operate**. Ekspresi visual tidak boleh mengaburkan task, status, ownership, deadline, atau permission. Hierarki dibentuk oleh satu next action yang jelas, timeline atau ledger yang dapat dipindai, dan evidence yang selalu memiliki sumber. Dashboard generic berisi kumpulan kartu setara bukan pola default.

Motion mengikuti material administrasi yang hidup: baris diperbarui, tab berpindah, cap status memperoleh konfirmasi, dan evidence memasuki ledger. Tidak ada confetti atau animasi yang menyamarkan akibat tindakan.

**Key Characteristics:**

- Ledger dan provenance sebagai struktur informasi, bukan dekorasi nostalgia.
- Restricted color strategy dengan warna status yang konsisten dan tidak menjadi satu-satunya pembeda.
- Information-dense tetapi memiliki satu focal action per surface.
- Tab indeks, ruled fields, docket, receipt, dan validation mark sebagai keluarga bentuk.
- Bahasa non-stigmatisasi dan privacy boundary yang terlihat dari affordance.
- Responsive reflow menjaga urutan kerja, bukan sekadar mengecilkan desktop.

## Approved Reference Composition

Student dashboard
[A: Docket-first](.impeccable/explorations/dashboard-mahasiswa/comp-a-docket-first.png)
adalah reference composition pertama SATU. Ia menetapkan urutan
**index navigation → decision docket → working ledger → context rail** sebagai
bukti bahwa “Buku Besar Kolaborasi” dapat menjadi alat kerja, bukan tema
dekoratif.

### Docket Anatomy

Docket dipakai ketika satu object memiliki action penting, state, provenance,
dan akibat yang perlu dipahami bersama. Anatomy-nya terdiri dari reference line,
status margin, decisive headline, ruled fact rows, provenance, dan action
footer. Docket bukan nama baru untuk generic card dan tidak boleh dipakai untuk
setiap section.

### Surrounding Grammar

- Active navigation memakai squared index marker yang terhubung ke edge atau
  rule line; bukan pill mengambang.
- Project, task, dan queue diringkas sebagai ledger rows dengan alignment yang
  stabil; bukan kumpulan mini-card.
- Context rail menampung supporting deadline, review, atau explanation dan
  selalu lebih tenang daripada working column.
- Signature moment lahir saat status mark, source/reviewer, deadline, dan action
  dapat dibaca sebagai satu evidence chain.

### Responsive Consequence

Saat tiga-region layout tidak lagi muat, context rail berpindah setelah working
ledger; ia tidak menjadi overlay permanen. Pada mobile, docket tetap lebih awal
daripada active work dan supporting history, sementara ledger berubah menjadi
stacked labeled rows tanpa horizontal overflow.

**The Reference Is Not an Asset Rule.** Approved comp adalah north star untuk
hierarchy dan grammar. Jangan merasterisasi UI, menyalin generated logo/icon,
menganggap illustrative copy sebagai product data, atau mengubah dimensi gambar
menjadi design token.

## Colors

Strategi warna adalah **Restrained**: neutral field mendominasi, satu institutional action color mengarahkan tindakan, dan semantic colors hanya muncul untuk status nyata.

### Primary

- **Institutional Action** (`#1746B0` light / `#8AABFF` dark): aksi utama dan selected navigation.
- **Focus Ring** (`#1E5BD7` light / `#8AABFF` dark): indicator keyboard focus yang selalu memiliki offset.

### Secondary

- **Verified Mark** (`#16734A` light / `#4FC58C` dark): status contribution atau membership yang benar-benar tervalidasi.
- **Pending Review** (`#8A5100` light / `#E2A23C` dark): item yang menunggu tindakan, bukan dekorasi perhatian.
- **Correction Required** (`#B42318` light / `#FF8A82` dark): error, rejection, atau revision state.
- Setiap status memiliki pasangan foreground serta subtle surface tersendiri di `resources/css/app.css`; jangan membuat tint secara ad hoc.

### Neutral

- **Ledger Paper** (`#F7F9FC` light / `#0D1422` dark): canvas utama yang tetap nyaman untuk sesi kerja panjang.
- **Working Surface** (`#FFFFFF` light / `#111B2D` dark): surface utama tanpa resting shadow.
- **Archive Field** (`#EEF2F7` light / `#17243A` dark): secondary surface, table header, dan grouped region.
- **Graphite Ink** (`#111827` light / `#EDF2FB` dark): primary text dan high-emphasis icon.
- **Pencil Note** (`#526077` light / `#A9B7CC` dark): metadata dan supporting copy.
- **Rule Line** (`#C7D0DF` light / `#34445D` dark): separator struktural.
- **Input Boundary** (`#718097` light / `#798AA3` dark): batas kontrol form yang mencapai minimum non-text contrast terhadap canvas.

**The Status Has Meaning Rule.** Semantic color hanya muncul ketika state domain berubah. Jangan menggunakan verified, pending, atau destructive color sebagai aksen dekoratif.

**The Color Is Never Alone Rule.** Setiap status menyertakan text, icon, atau shape yang tetap dapat dibaca tanpa persepsi warna.

## Typography

**Display Font:** `Familjen Grotesk` 600–700
**Body Font:** `Familjen Grotesk` 400–600
**Label/Mono Font:** `Azeret Mono` 400–600

**Character:** Tipografi utama harus terasa seperti sistem informasi kampus kontemporer: sangat terbaca, tenang pada body, tegas pada title, dan memiliki angka tabular untuk score, date, serta ledger reference. Hubungan tipografi mengutamakan workhorse sans dengan label teknis yang ringkas; tidak menggunakan display serif untuk membuat aplikasi terasa “premium”.

Kedua keluarga font dibundel melalui Laravel Vite font integration. Familjen Grotesk memakai fallback `system-ui, sans-serif`; Azeret Mono memakai `ui-monospace, monospace`. Azeret Mono hanya untuk reference, timestamp, status code, angka ledger, dan label teknis: bukan kostum monospace untuk seluruh UI.

### Hierarchy

- **Display (`text-display`):** 48px / 1.05, tracking -0.03em; hanya untuk first-run atau marketing statement.
- **Headline (`text-headline`):** 32px / 1.15, tracking -0.025em; menamai keputusan atau next action paling penting.
- **Title (`text-title`):** 20px / 1.3, tracking -0.012em; menamai region, project, dan object yang sedang dikerjakan.
- **Body (`text-body`):** 16px / 1.6; membaca instruction, discussion, evidence, dan explanation dalam durasi panjang.
- **Label (`font-label text-label`):** 12px / 1.35, tracking 0.02em; status, timestamp, reference, dan field heading yang harus mudah dipindai.

**The Evidence Reads Clearly Rule.** Metadata provenance, reviewer, dan timestamp boleh lebih kecil tetapi tidak boleh jatuh di bawah keterbacaan minimum atau bergantung pada tooltip.

## Layout

Layout memakai ledger grid: satu working column utama, satu context rail yang
dapat dipindai, dan ruled alignment yang menghubungkan label dengan nilai.
Reference dashboard menempatkan dominant docket di atas active ledger; first
viewport memberi ruang terbesar kepada primary task, sedangkan metric dan
secondary queue mengikuti prioritas operasional.

Desktop dapat memakai split workspace untuk task dan context. Tablet mengubah rail menjadi panel yang dapat dibuka. Mobile menyusun urutan: identity/status, next action, active work, supporting history. Horizontal table hanya digunakan bila semantic relationship tidak dapat dipertahankan sebagai list.

Density memiliki tiga tingkat konseptual:

- **Focused (`gap-density-focused`, 16px):** onboarding, recommendation decision, dan destructive confirmation.
- **Working (`gap-density-working`, 12px):** dashboard, project detail, portfolio management.
- **Dense (`gap-density-dense`, 8px):** admin queue, audit history, dan report table.

Control height tersedia sebagai `h-control-sm` (36px), `h-control-md` (40px),
dan `h-control-lg` (44px). Ukuran kecil hanya untuk surface padat; primary action
dan form penting memakai medium atau large.

**The One Working Surface Rule.** Jangan membungkus section dalam card lalu membungkus setiap barisnya dalam card lain. Gunakan region, rule line, dan spacing untuk membentuk hierarchy.

## Elevation & Depth

Sistem datar secara default. Depth berasal dari tonal field, sticky layer, border weight, dan overlap yang memiliki fungsi. `shadow-xs` sengaja bernilai none. `shadow-sm` hanya untuk pemisahan ringan; `shadow-md` dan `shadow-lg` hanya untuk overlay, floating action yang benar-benar mengambang, atau feedback drag.

Motion memperjelas perubahan state: insertion pada ledger, perubahan status, pembukaan context panel, dan reconnect. Durasi resmi adalah fast 120ms, standard 180ms, dan deliberate 260ms dengan `ease-ledger` (`cubic-bezier(0.2, 0.8, 0.2, 1)`). Semua motion menghormati `prefers-reduced-motion`; mode reduce meminimalkan animation dan transition serta menonaktifkan smooth scroll.

**The Resting Surface Is Flat Rule.** Surface kerja yang diam tidak menggunakan ambient shadow.

## Shapes

Corner cenderung kecil dan terkontrol: 2px (`radius-xs`), 4px (`radius-sm`), 6px (`radius-md`), dan 8px (`radius-lg`). Tab, docket, receipt edge, ruled box, dan validation mark memberi karakter tanpa membuat semua elemen menjadi pill. Circle dipakai untuk avatar, presence, atau completion yang memang bersifat unitary.

Status chip boleh berbentuk compact label, tetapi action button dan input tidak otomatis menjadi kapsul. Border thickness menandakan structure atau focus, bukan ornament.

**The Shape Explains the Object Rule.** Receipt, tab, dan stamp hanya digunakan ketika objek memiliki provenance, grouping, atau validation behavior yang sesuai.

## Focus and Theme

Keyboard focus memakai outline 2px dengan offset 2px. Jangan menghapusnya kecuali
diganti treatment yang setara atau lebih terlihat. Invalid state boleh mengubah
warna outline menjadi destructive, tetapi label dan pesan pemulihan tetap wajib.

Light, Dark, dan System adalah pilihan resmi. Theme mengubah semantic tokens,
bukan menukar class warna per komponen. Bootstrap Blade dan runtime appearance
hook harus tetap memakai pasangan canvas yang sama agar tidak terjadi theme
flash.

## Do's and Don'ts

### Do:

- **Do** tampilkan match explanation sebagai alasan konkret yang dapat diperbaiki pengguna.
- **Do** tampilkan source, owner, status, reviewer, dan timestamp pada evidence penting.
- **Do** berikan satu primary action yang jelas per state.
- **Do** gunakan docket hanya ketika status, provenance, dan action memang
  membentuk satu decision object.
- **Do** gunakan realistic minimum, typical, dan maximum content ketika menguji layout.
- **Do** perlakukan reconnect, stale state, pending review, dan permission loss sebagai normal product states.
- **Do** buat admin surface lebih padat tanpa mengurangi keyboard dan screen-reader usability.

### Don't:

- **Don't** menampilkan label “rentan”, “terisolasi”, atau mental-health inference kepada student atau recruiter.
- **Don't** menjadikan leaderboard sebagai pusat motivasi, nilai diri, atau elemen dominan pada dashboard. Peringkat hanya menjadi supporting ledger dengan opt-in, cohort protection, explanation, dan reduced-motion behavior.
- **Don't** menggunakan generic grid tiga kartu sebagai jawaban default untuk dashboard.
- **Don't** meniru approved comp secara piksel atau menjadikan generated asset
  sebagai pengganti semantic UI.
- **Don't** membuat identity visual baru untuk setiap role atau route.
- **Don't** menggunakan neon gamification, decorative glass, atau gradient sebagai pengganti content hierarchy.
- **Don't** menampilkan synthetic metric seolah data pilot nyata.
