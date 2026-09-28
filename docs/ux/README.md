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

Gunakan asset hanya bila memberi informasi atau atmosfer yang tidak efektif melalui semantic UI. AI agent boleh membuat gambar sendiri dengan image generation jika belum ada asset yang disetujui. Simpan source, alt purpose, license atau generation provenance, dan optimized output. Jangan mengganti chart, graph, status, atau interactive control dengan gambar statis.

Untuk generate gambar maskot, gunakan [`maskot-01-burung-arsip-turnaround.png`](../../resources/images/mascot/reference/maskot-01-burung-arsip-turnaround.png) sebagai acuan identitas dan sudut pandang. Gunakan [`maskot-01-burung-arsip.png`](../../resources/images/mascot/reference/maskot-01-burung-arsip.png) sebagai acuan material dan ekspresi. Pertahankan bentuk, warna, pola bulu, dan tas maskot kecuali pengguna memilih perubahan.

Artwork runtime saat ini memakai WebP transparan `public/images/mascot-welcome.webp`, `mascot-guide.webp`, dan `mascot-peek.webp`. Gambar welcome dan guide dibuat dengan image generation menggunakan dua acuan di atas; peek memakai gambar maskot terpilih. Simpan master dan turnaround di `resources/images/mascot/reference/`, terpisah dari WebP runtime. Komponen menyajikan dekorasi dengan alt kosong, atau tombol aksesibel bila reaksi maskot dapat dipicu.

## Ownership

Global visual change dimiliki `DESIGN.md`. Surface inventory dan behavior dimiliki `SCREEN_INVENTORY.md` beserta dokumen UX terkait. Canonical copy dan accessibility dimiliki `CONTENT_ACCESSIBILITY.md`. Task status dimiliki GitHub issue, bukan dokumen UX.
