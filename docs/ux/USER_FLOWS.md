# User Flows SATU

## 1. Student Activation

`Nomor WhatsApp -> OTP -> private username dan password -> consent -> institution dan NIM -> roster match -> profile minimum -> dashboard`

Recovery:

- OTP terlambat atau expired: resend dengan cooldown dan attempt feedback.
- Phone sudah dipakai: tampilkan account recovery tanpa mengungkap detail account.
- NIM atau phone mismatch: buat manual review dan jelaskan kemampuan yang masih tersedia.
- Roster belum tersedia: simpan request tanpa menyatakan student tidak sah.

## 2. Recommendation sampai Active Team

`Profile siap -> discovery/recommendation -> explanation -> project detail -> join/invite -> atomic decision -> active team -> workspace`

Capacity penuh, request ganda, permission hilang, dan stale recommendation harus memiliki recovery yang deterministic.

## 3. Realtime Task

`Buka workspace -> initial state dari database -> subscribe authorized channel -> command -> commit -> delta -> reconciliation`

Drag adalah enhancement. Keyboard dan button command tetap lengkap. Ketika reconnect, UI menunjukkan stale boundary sampai reconciliation selesai.

## 4. Contribution sampai Recognition

`Submit version dan evidence -> campus queue -> approve/revision/reject -> portfolio projection -> XP ledger -> badge evaluation -> notification`

Campus reviewer mengambil keputusan langsung. Team confirmation tidak diperlukan. Revision membuat version baru tanpa menimpa history.

## 5. Leaderboard

`Pilih semester dan scope -> baca rule dan cohort -> lihat ranking -> buka explanation`

Individual flow menambahkan `opt-in -> preview visibility -> confirm -> publish`, serta `withdraw -> hilang dari projection berikutnya`. Tie menggunakan shared rank.

## 6. Inclusion Review

`Feature aktif dan governance disetujui -> authorized reviewer -> signal queue -> evidence summary -> human review -> support action -> append-only record`

Feature disabled, synthetic-only, insufficient data, stale version, dan permission denied harus menjadi explicit state. Tidak ada auto-contact atau adverse action.

## 7. Recruiter Contact

`Organization verified -> entitlement active -> search safe projection -> candidate detail -> contact request -> student notification -> accept/decline -> limited contact handoff`

Jika visibility dicabut atau entitlement expired, kandidat hilang dari search dan action baru ditolak. History minimal dipertahankan sesuai retention.

## 8. Academic Sync

`Mapping valid -> approved activity -> sync candidate -> queued -> provider response -> success atau review queue -> retry/reconcile`

Sandbox harus dapat memicu success, validation error, timeout, duplicate, dan recovery secara repeatable.

## 9. Account dan Data Rights

`Request -> verify identity -> classify data -> fulfill/correct/restrict/delete -> record result -> notify`

Append-only review dan audit data mengikuti approved retention serta legal exception. UI menjelaskan bagian yang tidak dapat langsung dihapus dan alasannya.
