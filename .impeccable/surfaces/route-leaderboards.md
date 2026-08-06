---
version: 2
slug: 'route-leaderboards'
primary_target: 'route:/leaderboards'
related_targets: ['route:/dashboard', 'route:/campus']
---

# Hybrid Leaderboard

## Job and Audience

Student dan campus operator ingin melihat perkembangan verified activity tanpa mengubah ranking menjadi penilaian diri atau membuka cohort kecil. Student yang belum memiliki opt-in tetap dapat melihat leaderboard program studi dan tim. Mode: **Operate**.

## Outcome and Proof

Pengguna memahami periode, scope, denominator, minimum cohort, tie, data freshness, dan sumber XP. Campus operator dapat memantau program studi dan tim default. Student mengendalikan individual opt-in dengan preview data dan consequence yang jelas sebelum confirmation.

## Selected Direction

Supporting ledger dengan ranked rows, verified stamps, period tabs, dan explanation drawer. Peringkat ditampilkan sebagai supporting evidence, bukan pusat identitas visual. Celebration lembut hanya pada perubahan milik pengguna, tanpa podium neon atau confetti. Direction mewarisi **Buku Besar Kolaborasi** dengan ruled rows, tabular numeral alignment, dan explanation sebagai receipt.

## Opt-in Behavior

Program studi dan tim tampil secara default jika cohort memenuhi minimum lima active member dengan verified XP dalam semester berjalan.

Individual leaderboard hanya aktif setelah student melakukan opt-in eksplisit. Sebelum opt-in, student melihat placeholder yang menjelaskan data apa yang akan tampil, siapa yang dapat melihatnya, dan bahwa ranking dapat dicabut kapan saja. Opt-in tidak dapat diaktifkan oleh admin atau operator atas nama student.

Withdrawal individual segera menghapus baris personal dari leaderboard. Score program studi atau tim yang terpengaruh withdrawal dihitung ulang pada periode refresh berikutnya. Student yang telah withdraw dapat opt-in kembali; baris baru dimulai tanpa membawa history ranking sebelumnya.

## States and Ranges

### Content States

- **Default (program studi/team):** baris tampil jika cohort >= 5 active member dengan verified XP pada semester berjalan.
- **Suppressed cohort:** baris disembunyikan jika cohort < 5. Placeholder menampilkan penyebab dan jumlah anggota saat ini.
- **No verified XP:** empty state menjelaskan bahwa belum ada kontribusi tervalidasi pada periode ini, dengan CTA menuju kontribusi.
- **Tied rank:** dua atau lebih entitas berbagi nomor ranking yang sama. Urutan berikutnya melompat sesuai jumlah tie (standard competition ranking).
- **Stale projection:** data lebih dari 24 jam sejak refresh. Timestamp dan freshness cue tampil bersama reload/reconcile action.
- **Individual opt-out:** baris pribadi tidak dirender. Placeholder menampilkan opt-in prompt dengan preview.
- **Withdrawn:** baris hilang dari leaderboard. Opt-in kembali tersedia sebagai CTA.
- **Explanation drawer:** setiap baris memiliki action untuk melihat denominator, rumus, sumber XP, cohort count, dan refresh time.

### Ranges

- Top 10 default view dengan paginated long list untuk semua entitas.
- Minimum 1 semester, maximum seluruh semester yang memiliki data verified XP.
- Denominator: average verified XP per active member per semester.

## Interaction and Accessibility

### Keyboard dan Navigation

- Period tab dapat dioperasikan dengan keyboard (Left/Right arrow, Home/End).
- Filter tersimpan pada URL query parameter agar dapat dibagikan dan di-bookmark.
- Explanation drawer dapat dibuka/tutup dengan Enter/Space dan Escape.
- Focus order mengikuti alur visual: period tabs, filter, ranked list, pagination.

### Table Semantics

- Peringkat menggunakan `<table>` dengan `<caption>`, `<thead>`, `<tbody>`, dan `scope` attributes.
- Setiap baris memiliki row header untuk nama entitas.
- Numerical column (rank, score, member count) memakai tabular numeral alignment via Azeret Mono.
- Sort indicator dapat diumumkan screen reader dan tidak bergantung pada warna.

### Non-Color Status

Setiap status memiliki text, icon, atau shape yang tetap dapat dibaca tanpa persepsi warna:

- Verified XP memakai Verified Mark icon dan label teks.
- Suppressed menampilkan teks penyebab dan jumlah anggota.
- Stale menampilkan timestamp dan icon refresh.
- Tie menampilkan teks "Peringkat sama" pada baris yang berbagi rank.
- Opt-in required menampilkan icon dan CTA teks.

### Reduced Motion

- Semua animation menghormati `prefers-reduced-motion`.
- Row insertion menggunakan `ease-ledger` hanya ketika motion diizinkan.
- Celebration (perubahan ranking individu) berupa subtle highlight dengan durasi deliberate 260ms, dinonaktifkan sepenuhnya pada reduced motion.
- Stale refresh tidak memicu reorder animation pada reduced motion.

### Responsive Behavior

- Desktop: table dengan ruled rows dan period tabs horizontal.
- Tablet: table dengan horizontal scroll atau stacked labeled rows bila semantic relationship tidak rusak.
- Mobile (320px): stacked labeled rows tanpa horizontal overflow. Setiap row menampilkan rank badge, nama, score, member count, dan explanation trigger dalam satu kolom.

## Boundaries

- Score program studi dan tim adalah rata-rata verified XP per active member per semester.
- Minimum cohort lima anggota untuk publikasi.
- Inclusion signal dan `connectivity_opportunity` bukan input score dan tidak memengaruhi ranking.
- Individual leaderboard default off; student mengendalikan opt-in dan withdrawal.
- Score computation versioned dan append-only; tidak dapat diubah retroaktif.
- Leaderboard tidak menjadi elemen dominan pada dashboard. Ia adalah surface pendukung yang dapat dijangkau melalui navigasi.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md). Kontrak
per region:

- **Initial page load:** period tabs dan filter stabil dari server. Ranked rows
  menggunakan skeleton yang mempertahankan jumlah row realistis (10 baris untuk
  top 10). Skeleton row mempertahankan geometry ruled rows, tabular numeral
  width, dan spacing. Region memiliki `aria-busy="true"` dan satu
  `role="status"` announcement "Memuat papan peringkat."

- **Deferred region:** hanya region ranked rows yang menunggu data. Period tabs
  dan filter tetap dapat digunakan. Skeleton row menggantikan area data tanpa
  menghilangkan heading atau primary action.

- **Pagination dan refresh:** baris yang sudah ada dipertahankan. Skeleton row
  muncul di posisi data baru. Refresh tidak menghapus period selection atau
  filter aktif.

- **Explanation drawer loading:** isi drawer memakai skeleton yang
  mempertahankan ruled fact rows (denominator, cohort, refresh time). Heading
  drawer tetap tampil.

- **Processing command:** opt-in, withdrawal, dan period switch memakai inline
  progress atau Spinner pada tombol yang ditekan. Content sebelumnya tetap
  terlihat. Tidak ada full-page skeleton untuk processing.

- **Empty state:** ketika query sukses tetapi tidak ada data, render empty state
  dengan penjelasan penyebab dan CTA. Program studi tanpa cohort cukup
  menampilkan "Kohort belum mencapai minimum lima anggota aktif dengan XP
  terverifikasi." Individual tanpa opt-in menampilkan opt-in prompt.

- **Error dan forbidden:** error menggantikan skeleton dengan pesan pemulihan
  dan retry. Forbidden menjelaskan batas permission tanpa membocorkan resource.

- **Stale:** timestamp "Terakhir diperbarui" dan reload/reconcile action tampil
  pada data lebih dari 24 jam.

- **Reduced motion:** skeleton animation dinonaktifkan. Informasi loading tetap
  tersedia melalui text/status semantics.
