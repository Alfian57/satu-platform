---
version: 3
slug: 'route-campus'
primary_target: 'route:/campus'
related_targets:
  [
    'route:/campus/affiliations',
    'route:/campus/contributions',
    'route:/campus/integrations',
  ]
---

# Campus Operations, Roster, Affiliation, and Validation

## Job and Audience

Campus admin dan reviewer menangani roster import, affiliation review, contribution validation, dan campus operator invitation. Volume tinggi, audit ketat, dan decision consequence langsung pada status mahasiswa. Mode: **Operate**.

## Outcome and Proof

Admin mengetahui workload, priority reason, SLA risk, dan next review. Setiap decision meninggalkan append-only audit trail: reviewer identity, reason, timestamp, policy version, dan affected entity. Decision yang sudah diaudit tidak dapat dimodifikasi; reversal memerlukan decision baru dengan link ke decision sebelumnya.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai registrar docket modern. Queue utama menggunakan ruled ledger rows dengan indexed filter dan sticky context rail. Decision docket muncul tanpa kehilangan queue position. Metric hanya mendukung workload decision: jumlah pending, nearing SLA, dan blocked item. Provider failure dan expired state ditampilkan sebagai reason, bukan error misterius.

## Scope and Boundaries

Mencakup overview, roster import history, exact-match outcome, affiliation review, project oversight, contribution validation, filter, review detail, reason, audit, dan integration entry point. Tidak mencakup platform-wide tenant management atau recruiter analytics.

## States and Ranges

### Queue Volume

- Minimum: kosong (0 item). Render empty state dengan penjelasan pekerjaan selesai atau sumber data kosong.
- Typical: 20-100 item dalam antrean aktif, dapat dipindai dengan filter.
- Maximum: 10.000 item, dipaginasi 50 per halaman. Filter dan search tetap responsif pada skala maximum dengan backend pagination dan query index.

### Entity States

- Affiliation: pending exact match, exact match sukses, exact match gagal (NIM tidak ditemukan/phone tidak cocok), pending manual review, manual review approved, manual review rejected (dengan reason wajib), duplicate NIM, duplicate phone.
- Roster: imported, import in progress, import failed (invalid row ditampilkan dengan line number dan reason), partial success, duplicate detected.
- Contribution: pending validation, validated, revision required (dengan reason wajib), withdrawn by student.
- Campus operator invitation: queued for delivery, sent, delivery failed (provider error/timed out), expired (72 jam tanpa respons), accepted, revoked.

### Operational States

- Concurrent decision: item dikunci (lock) saat seorang reviewer membuka decision docket. Reviewer kedua menerima notifikasi bahwa item sedang ditinjau oleh reviewer pertama, dengan identitas reviewer dan waktu mulai. Lock dilepas setelah decision disimpan atau reviewer menutup docket tanpa decision. Lock memiliki timeout 30 menit.
- Provider failure: undangan WhatsApp gagal terkirim karena provider Fonnte error atau timeout. Queue menampilkan status "Gagal terkirim" dengan reason, retry count, dan action "Kirim ulang". Retry otomatis maksimal 3 kali dengan exponential backoff.
- Expired invitation: undangan campus operator yang melewati 72 jam tanpa respons ditampilkan dengan status "Kedaluwarsa" dan action "Kirim ulang undangan".
- Reviewer permission loss: reviewer yang kehilangan akses di tengah review. Decision yang belum disimpan dibatalkan; lock dilepas. Item kembali ke queue.
- Stale item: item yang tidak berubah dalam 7 hari diberi indikator waktu. Filter "Paling lama menunggu" mendahulukan item tertua.
- Bulk selection: hanya untuk safe reversible operations (assign reviewer, change priority, export). Setiap bulk operation mencatat actor, operation, affected count, dan timestamp ke audit log. Destructive atau irreversible decision tidak memiliki bulk action.
- Audit consequence: setiap decision menyimpan append-only record yang mencakup reviewer identity, reason, timestamp, policy version, entity type, entity ID, previous state, dan new state. Audit tidak dapat dihapus. Reversal membuat record baru dengan reference ke decision sebelumnya.

## Interaction and Layout

### Desktop Dense Queue

Dense ledger table (`gap-density-dense`, `h-control-sm`) dengan ruled rows, sticky header, dan column alignment stabil. Kolom: reference (mono), entity, status chip (dengan icon dan teks), timestamp, priority reason, dan action. Filter membentuk saved URL query string. Queue mempertahankan selection dan scroll position selama refresh. Decision docket membuka sebagai panel samping; queue tetap terlihat dan dapat dinavigasi.

### Mobile Single Review

Satu item per viewport. Queue berubah menjadi stacked labeled rows dengan swipe gesture untuk quick action (assign, skip). Decision docket mengambil seluruh viewport. Setelah decision, pengguna kembali ke queue dengan item berikutnya otomatis difokuskan. Bulk operation disembunyikan pada mobile.

### Tablet

Queue table dengan horizontal scroll pada kolom non-esensial. Decision docket sebagai bottom sheet atau panel samping tergantung orientasi.

### Common

Queue dapat dioperasikan dengan keyboard: tab navigasi antar item, Enter membuka docket, Escape menutup docket, dan shortcut untuk decision action. Decision memerlukan explicit confirmation bila irreversible. Saved URL filter mempertahankan state saat dibagikan.

## Constraints and Open Decisions

Semua query institution-scoped dan policy-authorized. Reviewer identity, reason, timestamp, dan policy version disimpan sebagai append-only audit. Contribution validation authority adalah campus reviewer; mahasiswa tidak dapat memvalidasi kontribusinya sendiri. Roster format dan review SLA tetap governance gate. Fonnte provider failure state adalah production requirement; fallback manual notification path belum diputuskan. Lock timeout 30 menit dapat disesuaikan berdasarkan feedback operasional.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).

### Initial page load

Queue dan aggregate memakai dense table skeleton: 10 ruled rows dengan geometry yang sesuai (reference kolom mono 8ch, entity kolom 20ch, status chip 12ch, action 8ch). Heading, filter bar, dan tab navigasi tetap terlihat. Region memiliki `aria-busy="true"` dan satu `role="status"` dengan pesan "Memuat antrean operasi kampus."

### Deferred region

Decision docket yang dibuka menampilkan skeleton docket dengan reference line, status margin, ruled fact rows (4 baris), provenance, dan action footer.

### Pagination dan refresh

Row baru ditambahkan sebagai skeleton row di posisi yang sesuai; row yang sudah ada tetap terlihat. Filter, selection, scroll position, dan saved URL dipertahankan.

### Processing command

Decision action menampilkan Spinner pada button dan disabled state. Inline progress menggantikan button text: "Menyimpan keputusan..." atau "Mengirim ulang undangan..." Queue content tetap terlihat.

### Empty state

"Antrean kosong. Semua item telah ditinjau." dengan summary metric periode berjalan.

### Error dan forbidden

Error menampilkan reason dan retry action. Forbidden menampilkan batas permission tanpa membocorkan resource. Provider failure menampilkan status spesifik: "Fonnte tidak merespons. Undangan gagal terkirim." dengan retry count dan action.

### Stale

Item yang tidak berubah dalam 7 hari menampilkan timestamp dan indikator visual.

### Reduced motion

Animation skeleton dinonaktifkan sepenuhnya. Status announcement tetap tersedia melalui live region.
