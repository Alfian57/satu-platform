---
version: 2
slug: "route-campus-integrations"
primary_target: "route:/campus/integrations"
related_targets:
  [
    "route:/campus/integrations/mappings",
    "route:/campus/integrations/syncs",
    "route:/campus",
  ]
---

# Academic Integration Operations

## Job and Audience

Campus operator mengelola koneksi akademik: memetakan verified activity menjadi kredit, mengawasi sync sandbox atau provider, mendiagnosis failure, dan merekonsiliasi hasil tanpa mengubah data production secara tidak sengaja. Mereka berada dalam konteks operational queue dengan tuntutan audit. Mode: **Operate**.

## Outcome and Proof

Operator memahami connection type (sandbox atau production), mapping version dan scope, sync status, failure reason, retry consequence, idempotency guarantee, dan reconciliation result. Setiap action meninggalkan audit trail.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai operations ledger. Surface terdiri dari tiga region: connection overview, mapping register dengan ruled table, dan sync receipt ledger. Sandbox connection diberi treatment visual terpisah tetapi tidak direndahkan. Mapping lifecycle mengikuti docket anatomy ringkas: reference line, status margin, decisive headline, ruled fact rows, dan action footer. Sync receipt berfungsi sebagai bukti operasional: setiap baris menunjukkan status, timestamp, dan recovery action bila diperlukan.

### Visual Grammar

- Label koneksi sandbox memakai background Archive Field dengan teks Pencil Note dan border Rule Line; bukan warna peringatan atau dekorasi playful.
- Label koneksi production memakai Verified Mark green surface ketika connected, dan Pending Review amber ketika degraded.
- Status mapping: Draft (Pencil Note, tanpa mark), Active (Verified Mark, dengan scope badge), Retired (Archive Field dengan timestamp penghentian).
- Status sync: Queued (Pencil Note dengan spinner kecil), Sending (Institutional Action dengan progress), Succeeded (Verified Mark dengan receipt timestamp), Failed (Correction Required dengan reason), Retrying (Pending Review dengan attempt count), Dead (Correction Required dengan terminal explanation).
- Conflict dan duplicate ditampilkan sebagai receipt baris dengan Pending Review mark dan deskripsi perbedaan.
- Reconciled ditampilkan dengan Verified Mark dan reference ke resolution timestamp.

## Scope and Boundaries

Mencakup connection overview, mapping CRUD dengan versioning, sync trigger dan monitoring, failure docket, retry dengan confirmation, idempotency explanation, reconciliation, dan sandbox lifecycle.

Tidak mencakup implementasi backend provider real, secret management, billing, atau OAuth dance ke sistem akademik eksternal. Semua koneksi production memerlukan external gate.

## States and Ranges

### Connection States

- Disconnected: belum ada koneksi. Empty state dengan CTA untuk membuat koneksi sandbox.
- Sandbox connected: koneksi synthetic aktif. Label "Sandbox" jelas, data synthetic ditandai.
- Production connected: koneksi API kampus nyata. Label "Production", memerlukan gate approval.
- Degraded: koneksi production mengalami partial failure. Status bar dengan reason dan retry CTA.

### Mapping Lifecycle

- Empty: belum ada mapping. CTA "Buat mapping pertama" dengan quick-start sandbox atau template.
- Draft: mapping belum aktif. Dapat diedit, dihapus, atau diaktifkan.
- Active: mapping sedang berjalan. Hanya dapat dipensiunkan (retire), bukan dihapus.
- Retired: mapping dihentikan. Tetap terlihat sebagai history dengan timestamp penghentian.
- Duplicate prevention: sistem menolak mapping dengan kombinasi source, target, dan version yang sama persis. Conflict row dengan Pending Review mark.

### Sync States per Receipt

- Queued: antrean untuk diproses. Waktu estimasi bila tersedia.
- Sending: transmisi ke provider sedang berlangsung.
- Succeeded: provider merespons sukses. Payload summary ringkas.
- Failed: provider merespons error. Reason dari provider, bukan stack trace.
- Retrying: sync gagal dan sedang dicoba ulang. Attempt `n` dari `max`.
- Dead: retry maksimum tercapai tanpa sukses. Terminal state dengan manual reconciliation CTA.
- Timeout: provider tidak merespons dalam batas waktu.
- Validation error: mapping payload tidak valid menurut contract.
- Conflict: versi data tidak cocok. Menampilkan local vs remote diff.
- Reconciled: conflict diselesaikan secara manual. Resolution timestamp dan operator identity.

### Shared States

- Empty connection list, empty mapping register, empty sync history.
- Loading (initial, deferred region, pagination, refresh).
- Processing (create mapping, trigger sync, retry, reconcile).
- Error: network, server 5xx, provider unreachable.
- Forbidden: campus operator tanpa permission integration. Menjelaskan batas akses tanpa membocorkan resource.
- Stale: receipt lebih lama dari threshold. Freshness cue dengan reload/reconcile action.
- Partial data: beberapa receipt gagal dimuat, sisanya terlihat. Retry per region.
- Overflow: dense table dengan banyak kolom, horizontal scroll pada tablet, stacked rows pada mobile.

### Content Ranges

- Minimum: 0 connection, 0 mapping, 0 sync receipt. Empty state with CTA.
- Typical: 1 atau 2 connection, 5 hingga 30 mapping, 50 hingga 500 sync receipt.
- Maximum: paginated dengan 50 item per halaman.

## Interaction and Layout

### Desktop

Connection overview di atas sebagai status bar horizontal: nama provider, mode (Sandbox/Production), status connection, dan action (connect/disconnect/test/retire). Mapping register di bawahnya sebagai dense ruled table: kolom source activity, target credit, version, status, created, updated, dan action. Sync receipt sebagai ruled table di bawah mapping: kolom timestamp, mapping reference, status, payload digest, dan action. Filter per status dan rentang waktu tersedia secara sticky.

### Tablet

Connection overview tetap horizontal. Mapping register dan sync receipt memperoleh horizontal scroll dengan kolom identitas yang sticky di kiri. Filter collapse menjadi drawer.

### Mobile (320px)

Connection overview menjadi stacked labeled rows. Mapping register dan sync receipt menjadi stacked labeled record: setiap mapping atau receipt adalah ruled row dengan label tebal di kiri dan nilai di kanan, tanpa horizontal overflow. Primary action tetap di atas sebagai tombol penuh.

### Keyboard

- Seluruh tabel dapat dinavigasi dengan Tab melalui row interaktif.
- Mapping dan receipt row dapat dipilih dengan Enter atau Space.
- Docket detail dibuka tanpa kehilangan posisi tabel.
- Retry dan reconcile memerlukan confirmation dialog yang trap fokus.
- Escape menutup dialog atau kembali ke tabel.

### Confirmation

- Retry sync: confirmation dengan idempotency explanation ("Sync ini tidak akan menduplikasi record yang sudah berhasil") dan konsekuensi ("Mengirim ulang payload versi terakhir").
- Retire mapping: confirmation dengan consequence ("Mapping tidak akan memproses activity baru") dan recovery path ("Dapat diaktifkan kembali sebagai versi baru").
- Connect production: confirmation bahwa koneksi memerlukan gate approval dan secret handling.

### Status Semantics

Status tidak hanya dibedakan oleh warna. Setiap status memiliki:

- Icon atau mark yang konsisten (Verified Mark, Pending Review, Correction Required) dari DESIGN.md.
- Label teks dalam bahasa Indonesia sesuai CONTENT_ACCESSIBILITY.md.
- Tooltip atau inline description untuk status teknis (Dead, Conflict, Timeout).
- Color Is Never Alone: setiap status tetap dapat dibaca dalam grayscale atau oleh screen reader.

## Constraints and Open Decisions

- Semua query institution-scoped dan policy-authorized. Operator hanya melihat integrasi tenant sendiri.
- Sandbox adalah baseline release. Sandbox adapter memakai Data synthetic yang diberi label jelas.
- Koneksi API kampus nyata memerlukan external gate dan approved secret handling. Tidak diimplementasikan dalam scope ini.
- Format payload mapping dan contract provider adalah governance gate.
- Reconciliation adalah manual process oleh campus operator, bukan automated merge.
- Retry maksimum dan backoff strategy adalah configuration decision.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md). Setiap
region (connection overview, mapping register, dan sync receipt ledger)
memakai skeleton yang mempertahankan geometry dan spacing asli, bukan
full-page spinner atau decorative card pengganti. Heading, filter, dan
primary action tetap terlihat ketika hanya sebagian region loading.

### Granularity

**Initial page load:** Skeleton per region. Connection overview, mapping
register header, dan sync receipt header muncul dengan skeleton baris.
`aria-busy="true"` pada tiap region, satu `role="status"` announcement
"Memuat data integrasi kampus." Decorative skeleton block disembunyikan
dari screen reader.

**Deferred region:** Mapping detail atau sync receipt detail dimuat
setelah baris diklik. Hanya region detail yang menampilkan skeleton.
Region tabel tetap dapat dipakai.

**Pagination dan refresh:** Baris yang sudah ada dipertahankan. Skeleton
baris muncul di posisi halaman baru dengan jumlah realistis (50 baris).
Refresh tidak menghapus filter atau scroll position. Filter status, waktu,
dan teks pencarian tetap aktif.

**Processing action:** Create mapping, trigger sync, retry, dan reconcile
menampilkan inline progress pada tombol atau baris receipt, bukan
mengganti seluruh konten dengan skeleton. Tombol menjadi disabled dengan
Spinner. Receipt baris baru muncul di posisi atas ledger setelah sukses.

### State Transitions

Setiap region memiliki transisi yang dapat diuji:
loading -> success, loading -> empty, loading -> error, loading -> forbidden,
dan loading -> stale.

- **Empty state:** Koneksi belum dibuat. Penjelasan "Belum ada koneksi
  akademik. Anda dapat membuat koneksi sandbox untuk mulai." CTA "Buat
  koneksi." Mapping register dan sync receipt menampilkan "Belum ada
  mapping" dan "Belum ada riwayat sync" tanpa CTA sampai koneksi tersedia.
- **Error state:** Pesan error menggantikan skeleton. "Gagal memuat
  [region]. [Penyebab singkat]. [Recovery CTA]." Tidak mengekspos token,
  stack trace, atau detail provider.
- **Forbidden:** "Anda tidak memiliki akses ke integrasi akademik. Hubungi
  platform admin untuk mendapatkan akses campus operator."
- **Stale:** Receipt lebih lama dari threshold menampilkan timestamp dengan
  Pencil Note dan tulisan "Data mungkin tidak terbaru." Reload atau manual
  reconcile CTA tersedia.
- **Partial data:** Beberapa receipt gagal dimuat. Baris yang gagal
  menampilkan pesan error inline dengan retry CTA per baris.

### Accessibility

- `aria-busy="true"` pada region yang sedang memuat.
- Satu `role="status"` atau `aria-live="polite"` announcement per region
  loading, tidak per skeleton block.
- Warna bukan satu-satunya indikator status. Setiap status memiliki
  icon/mark dan label teks.
- Keyboard order dan visible focus dipertahankan selama loading.
- Skeleton tidak menyebabkan layout shift atau horizontal overflow.
- `prefers-reduced-motion` menonaktifkan animation skeleton tanpa
  menghilangkan informasi status atau recovery.
- Zoom 200%, reflow, dark mode, dan konten terpanjang diuji.
- Pointer cursor untuk setiap enabled target; not-allowed untuk disabled.
- Tidak menggunakan Unicode em dash pada UI atau brief ini.
- Istilah stigmatisasi (rentan, terisolasi, diagnosis mental) tidak muncul.
