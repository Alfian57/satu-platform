# P01: Shape Dashboard Mahasiswa

Status: **approved: A / Docket-first**

Approved on: **2026-07-23**

## Selected Composition

[A: Docket-first](comp-a-docket-first.png) dipilih sebagai north star dashboard
mahasiswa. Komposisi yang dibawa ke P02 adalah docket revisi sebagai focal
action, project ledger sebagai working region, dan compact context rail untuk
tinjauan serta rekomendasi.

Pilihan ini menyetujui arah komposisi, bukan menjadikan gambar sebagai
spesifikasi piksel. Detail yang masih harus dikontrakkan pada P02 meliputi first
viewport, visual grammar, responsive consequence, signature moment, dan bagian
comp yang tidak boleh diliteral-kan.

## Confirmed Brief

- **Mode:** Operate.
- **Audience:** Mahasiswa yang kembali ke dashboard dengan kontribusi yang perlu
  direvisi.
- **Primary outcome:** Mahasiswa segera memahami apa yang harus diperbaiki,
  alasan revisi, provenance reviewer, dan tenggatnya.
- **Supporting context:** Dua proyek aktif, satu kontribusi menunggu tinjauan,
  dan satu rekomendasi dengan alasan yang aman.
- **Visual world:** Buku Besar Kolaborasi dengan mineral-paper field, graphite
  ink, institutional blue, ruled ledger, index marker, dan semantic status.
- **Hardest filter:** Tidak boleh terasa seperti generic SaaS, grid kartu
  metrik, atau starter dashboard.

Seluruh nama, proyek, pekerjaan, tanggal, dan status pada comp merupakan data
ilustratif untuk pengujian desain, bukan data pengguna atau klaim produk.

## Visual Compositions

### A: Docket-first

[Open comp A](comp-a-docket-first.png)

Revisi kontribusi menjadi docket dominan. Project ledger berada di bawah dan
context rail merangkum tinjauan serta rekomendasi. Arah ini paling cepat
mengomunikasikan satu tindakan utama.

### B: Ledger-first

[Open comp B](comp-b-ledger-first.png)

Antrean kerja menjadi working surface utama. Baris prioritas membuka detail
revisi tanpa menghilangkan konteks pekerjaan lain. Arah ini paling kuat untuk
penggunaan berulang dengan banyak item aktif.

### C: Validation-flow

[Open comp C](comp-c-validation-flow.png)

Jejak validasi menjadi struktur utama. Tahap revisi terbuka di dalam chronology
ledger dan working queue tetap terlihat di samping. Arah ini paling kuat dalam
menjelaskan provenance kontribusi.

## Shared Content Contract

- Primary action: `Perbaiki kontribusi`.
- Contribution: `Riset kebutuhan pengguna · Peta Akses Kampus`.
- Revision note: tambahkan tautan rekaman wawancara dan ringkasan temuan.
- Deadline: `Besok, 17.00 WIB`.
- Reviewer: `Nadia Putri · Koordinator proyek`.
- Recommendation reasons: kebutuhan riset pengguna, kecocokan ketersediaan
  enam jam per minggu, dan kebutuhan Product Researcher.
- Navigation covers Dashboard, Temukan Proyek, Proyek Saya, Kontribusi, dan
  Portofolio.

## Generation Record

Ketiga comp dibuat dengan built-in image generation menggunakan prompt set
`ui-mockup`. Prompt bersama mengunci product world, content contract, restrained
color strategy, workhorse sans typography, small-laptop composition, flat
surfaces, semantic status, dan larangan generic card dashboard. Variabel
antar-prompt hanya topology: docket-first, ledger-first, atau validation-flow.

Comp adalah north star, bukan screenshot specification. Core UI text, controls,
accessibility semantics, responsive behavior, exact typography, dan exact color
tokens tetap harus diwujudkan sebagai runtime code pada phase berikutnya.

## Approval Record

- **Selection:** A: Docket-first.
- **User feedback:** “saya suka yang A”.
- **P01 result:** Approved.
- **Next phase:** P02: Record visual selection.
