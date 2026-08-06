---
version: 2
slug: 'route-platform'
primary_target: 'route:/platform'
related_targets:
  [
    'route:/platform/institutions',
    'route:/platform/recruiters',
    'route:/campus',
  ]
---

# Platform Provisioning, Institution, Invitation, and Entitlement Operations

## Job and Audience

Platform admin memverifikasi institution baru, mengundang privileged user melalui WhatsApp, mengelola recruiter organization, mengelola entitlement schedule, dan menangani provider failure. Setiap action memiliki consequence lintas tenant dan meninggalkan append-only audit trail. Mode: **Operate**.

## Outcome and Proof

Setiap privileged transition memiliki input, reason, actor, timestamp, outcome, dan recovery yang dapat diaudit. Decision tidak dapat dimodifikasi setelah diaudit; reversal memerlukan decision baru dengan reference ke decision sebelumnya. Queue memudahkan admin menemukan item paling kritis terlebih dahulu: blocked, nearing deadline, dan expiring.

## Selected Direction

Dense decision docket dan operations ledger mewarisi **Buku Besar Kolaborasi**. Institution, recruiter, dan invitation membentuk queue tab terpisah dengan filter dan priority sort yang sama. Decision docket membuka sebagai panel samping; queue tetap terlihat. Provider failure ditampilkan sebagai reason spesifik, bukan error generik. Blocked dan expiring item muncul paling atas tanpa warna sebagai satu-satunya prioritas.

## Scope and Boundaries

Mencakup institution provisioning (pending/approved/rejected/suspended), campus operator invitation (queued/sent/failed/expired/accepted/revoked), recruiter organization verification, entitlement management (scheduled/active/expired/revoked), dan provider health indicator. Tidak mencakup billing provider, package pricing, atau campus-level operations.

## States and Ranges

### Queue Volume

- Institution queue: minimum 0 (tidak ada institution baru), typical 3-15, maximum 200 (all-time, difilter).
- Invitation queue: minimum 0 (semua undangan selesai), typical 5-30, maximum 500 (dengan status sent/failed/expired, dipaginasi 50 per halaman).
- Recruiter queue: minimum 0, typical 2-10, maximum 100 (all-time, difilter).
- Entitlement queue: minimum 0, typical 3-20, maximum 300 (scheduled dan active, difilter per periode).

### Entity States

- Institution: pending review, approved, rejected (dengan reason wajib), suspended (dengan reason wajib), reactivation pending.
- Campus operator invitation: queued for delivery, sent, delivery failed (provider error/timed out dengan retry count), expired (72 jam tanpa respons), accepted, revoked (dengan reason wajib).
- Recruiter organization: pending verification, verified, rejected (dengan reason wajib), suspended.
- Entitlement: scheduled (tanggal mulai di masa depan), active, expired (tanggal akhir tercapai), revoked (dengan reason wajib).

### Operational States

- Concurrent decision: item dikunci (lock) saat seorang platform admin membuka decision docket. Admin kedua melihat notifikasi item sedang ditinjau, dengan identitas admin dan waktu mulai. Lock dilepas setelah decision atau timeout 30 menit. Concurrent rejection tidak dimungkinkan; system menolak decision kedua.
- Provider failure: undangan WhatsApp melalui Fonnte gagal. Queue menampilkan "Gagal terkirim" dengan reason (timeout, connection refused, rate limited, invalid number), retry count, dan last attempt timestamp. Action: "Kirim ulang" dengan konfirmasi. Retry otomatis maksimal 3 kali dengan exponential backoff (1m, 5m, 15m).
- Expired invitation: undangan melewati 72 jam. Status "Kedaluwarsa" dengan timestamp kedaluwarsa. Action: "Kirim ulang undangan" yang membuat invitation record baru dengan reference ke invitation sebelumnya.
- Bulk safety: bulk action hanya untuk safe operations (filter export, status inquiry, batch resend failed invitation). Setiap bulk operation mencatat actor, operation, affected count, dan timestamp ke audit log. Institution approval/rejection, entitlement grant/revoke, dan recruiter verification tidak memiliki bulk action.
- Audit consequence: setiap decision mencatat append-only record: actor identity, reason, timestamp, policy version, entity type, entity ID, previous state, new state, dan affected tenant ID. Audit record tidak dapat dihapus atau dimodifikasi. Reversal membuat record baru dengan reference ke decision sebelumnya dan mandatory reason.
- Provider degraded: Fonnte health indicator pada platform header menampilkan status provider (operational, degraded, down) berdasarkan recent failure rate. Admin dapat melihat detail: success rate 1 jam terakhir, pending retry count, dan last successful delivery.

## Interaction and Layout

### Desktop Dense Queue

Tiga tab queue: Institution, Invitation, Recruiter. Masing-masing berupa dense ledger table (`gap-density-dense`, `h-control-sm`) dengan ruled rows, sticky header, dan column alignment stabil. Kolom: reference (mono), entity name, status chip (dengan icon dan teks), priority reason, timestamp, dan action. Blocked dan nearing-deadline item muncul di atas. Filter dan tab selection tersimpan sebagai URL query string. Decision docket membuka sebagai panel samping kanan; queue tetap terlihat.

### Mobile Single Review

Satu tab queue dengan stacked labeled rows. Setiap item membuka decision docket full-viewport. Setelah decision, kembali ke queue dengan item berikutnya difokuskan. Provider health indicator tetap terlihat sebagai compact badge. Bulk operation disembunyikan pada mobile.

### Tablet

Queue table dengan horizontal scroll pada kolom non-esensial. Decision docket sebagai bottom sheet pada portrait, panel samping pada landscape.

### Common

Queue dapat dinavigasi keyboard: Tab antar item, Enter membuka docket, Escape menutup, shortcut untuk approve/reject/review. Destructive dan granting action memerlukan reason field wajib dan explicit confirmation. Saved filter URL mempertahankan state.

## Constraints and Open Decisions

Platform admin tidak dapat diperoleh melalui open registration. Semua privileged action policy-authorized dengan append-only audit. Institution-scoped data hanya diakses melalui query lintas tenant yang diaudit. WhatsApp provider (Fonnte) adalah dependency eksternal; degradation state, retry policy, dan fallback notification path adalah production requirement. Invitation expiry 72 jam adalah default; dapat dikonfigurasi per institution. Entitlement schedule ditentukan saat institution approval atau sebagai action terpisah. Format reason untuk rejection/suspension/revocation wajib diisi, tidak boleh kosong.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).

### Initial page load

Queue tab dan aggregate memakai dense table skeleton: 8 ruled rows per tab dengan geometry realistis (reference mono 8ch, entity 24ch, status chip 12ch, action 8ch). Heading, tab bar, filter, dan provider health indicator tetap terlihat. Setiap tab region memiliki `aria-busy="true"` dan satu `role="status"` dengan pesan "Memuat antrean operasi platform."

### Deferred region

Decision docket yang dibuka menampilkan skeleton docket dengan reference line, status margin, ruled fact rows (5 baris: institution/recruiter detail, contact, reason, history), provenance, dan action footer.

### Pagination dan refresh

Row baru ditambahkan sebagai skeleton row; row existing tetap terlihat. Filter, tab selection, scroll position, dan URL query string dipertahankan.

### Processing command

Grant, revoke, invitation, dan approval command memakai Spinner pada button dan inline progress ("Mengirim undangan...", "Menyetujui institution...", "Mencabut hak akses..."). Queue content dan decision context tetap terlihat.

### Empty state

Per tab: "Belum ada institution baru." / "Semua undangan telah selesai." / "Belum ada recruiter untuk diverifikasi." dengan summary metric periode berjalan.

### Error dan forbidden

Error menampilkan reason dan retry. Provider failure spesifik: "Fonnte tidak merespons (timeout). Undangan gagal terkirim. Percobaan ke-2 dari 3." Forbidden menampilkan batas permission.

### Stale

Institution yang pending lebih dari 14 hari ditandai. Invitation expired ditampilkan dengan action "Kirim ulang."

### Reduced motion

Animation skeleton dinonaktifkan sepenuhnya. Status announcement tetap tersedia melalui live region.
