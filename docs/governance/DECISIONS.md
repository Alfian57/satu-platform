# Decision Log SATU

## Aturan

Accepted decision adalah product atau architecture contract. Open gate hanya dapat ditutup oleh owner yang berwenang melalui GitHub issue dan pull request yang memperbarui owning document. Implementer tidak boleh menutup gate melalui asumsi.

## Accepted Decisions

| ID      | Keputusan                                                                      | Dampak                                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-001 | Produk perlombaan adalah SATU, bukan competition-management system             | Seluruh backlog membangun platform SATU                                                                                                                                      |
| DEC-002 | Rilis mencakup proposal kecuali Bab 4.2                                        | Talent, gamification, academic sandbox, inclusion, dan landing masuk release                                                                                                 |
| DEC-003 | Satu kampus pilot lebih dahulu                                                 | Model tetap institution-aware, rollout lintas kampus ditunda                                                                                                                 |
| DEC-004 | Tidak ada email pada target flow                                               | Identity memakai private username, password, dan verified WhatsApp phone                                                                                                     |
| DEC-005 | Roster exact match memakai NIM dan verified phone                              | Mismatch atau ambiguity masuk manual review                                                                                                                                  |
| DEC-006 | Platform admin menyetujui institution dan mengundang campus admin via WhatsApp | Privileged role tidak tersedia lewat open registration                                                                                                                       |
| DEC-007 | Fonnte adalah initial WhatsApp provider melalui backend adapter dan queue      | SATU membuat OTP; tidak memakai unofficial Fonnte package                                                                                                                    |
| DEC-008 | In-app notification center adalah canonical                                    | WhatsApp hanya untuk approved important purpose                                                                                                                              |
| DEC-009 | Campus reviewer memvalidasi contribution langsung                              | Team confirmation tidak diperlukan                                                                                                                                           |
| DEC-010 | Hybrid leaderboard memakai group default dan individual opt-in                 | Average verified XP, semester, cohort minimal 5, shared rank                                                                                                                 |
| DEC-011 | Inclusion tidak menjadi leaderboard input                                      | Mencegah stigma dan feedback loop yang tidak adil                                                                                                                            |
| DEC-012 | Inclusion engine/UI production-ready di balik feature flag                     | Synthetic demo diperbolehkan, real activation menunggu governance                                                                                                            |
| DEC-013 | Talent Portal memakai verified organization dan internal entitlement           | Billing provider serta pricing di luar release                                                                                                                               |
| DEC-014 | Academic integration baseline adalah contract plus sandbox                     | Real campus API adalah external gate                                                                                                                                         |
| DEC-015 | Native Laravel Policies/Gates adalah authorization baseline                    | Role berasal dari membership dan tenant context                                                                                                                              |
| DEC-016 | Gunakan mature library ketika fit dan kompatibel                               | Issue wajib menyebut package atau framework-native decision                                                                                                                  |
| DEC-017 | GitHub issues/milestones adalah execution truth                                | Phase files dan progress file dipensiunkan setelah migration audit                                                                                                           |
| DEC-018 | Main memakai protected pull-request workflow dengan owner admin bypass         | Required CI, resolved conversations, no force/delete, dan **Squash and merge**; contributor non-owner memerlukan 1 approval, owner boleh self-review dan merge sebagai admin |
| DEC-019 | Owner ditandai label role, bukan assignee sementara                            | Assignee ditambahkan setelah komposisi tim final                                                                                                                             |
| DEC-020 | Consumer boleh development dengan stacked branch setelah contract checkpoint   | Parent diberi label `contract-ready`; consumer memakai `Stacked on: #<issue>` dan base branch parent; merge tetap menunggu seluruh hard dependency closed                    |

## Approved Library Direction

| Capability            | Baseline                                                  |
| --------------------- | --------------------------------------------------------- |
| Authentication        | Existing Laravel Fortify, customized username/phone flow  |
| Phone normalization   | `propaganistas/laravel-phone`                             |
| Roster import         | `spatie/simple-excel`                                     |
| Feature flag          | Laravel Pennant                                           |
| Talent search         | Laravel Scout database engine                             |
| Data table            | `@tanstack/react-table`                                   |
| Chart                 | Recharts                                                  |
| Network graph         | Cytoscape.js                                              |
| Drag enhancement      | `@dnd-kit/react`, dengan keyboard/button fallback         |
| Browser accessibility | `@axe-core/playwright`                                    |
| WhatsApp              | Laravel HTTP Client, Notifications, Queue, Fonnte adapter |

Installasi dependency baru tetap mengikuti approval project dan compatibility/license review pada issue.

## Open Gates

| ID       | Keputusan yang dibutuhkan                                                       | Owner                             | Batas                            |
| -------- | ------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- |
| GATE-001 | Institution pilot, roster file format, active-member definition, dan review SLA | Product + institution             | Sebelum roster production flow   |
| GATE-002 | DPIA, lawful basis, retention matrix, WhatsApp notice, dan data-right procedure | Security/privacy + institution    | Sebelum real-data pilot          |
| GATE-003 | Academic credit mapping dan real pilot API contract                             | Product + institution engineering | Sebelum real provider connection |
| GATE-004 | Recruiter verification, entitlement issuance, contact, dan retention policy     | Product + legal/privacy           | Sebelum recruiter pilot          |
| GATE-005 | Final visual reference dan competition UAT                                      | Product owner                     | Sebelum release                  |

## Academic Credit Mapping and Pilot API

Keputusan berikut membentuk kontrak antara SATU dan kampus pilot untuk integrasi kredit akademik. Seluruh keputusan bersifat guideline sampai dikonfirmasi oleh pihak kampus dan engineering institusi. Koneksi API nyata adalah external gate; sandbox tetap release baseline.

### Accepted

| ID       | Keputusan                                                               | Dampak                                                                                                                         |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| DEC-021  | Mapping vocabulary distandardisasi dengan tiga entitas inti             | Activity, Badge, dan Credit menjadi vocab yang dapat dipetakan dan diaudit                                                     |
| DEC-022  | Mapping schema diberi version integer yang disimpan bersama mapping     | Setiap mapping memiliki `version` integer. Version baru tidak otomatis berlaku untuk data historis                             |
| DEC-023  | Campus admin adalah approver mapping kredit                             | Hanya campus admin dengan permission `manage_credit_mapping` yang dapat membuat, mengubah, dan mengaktifkan mapping            |
| DEC-024  | Satu activity dapat memiliki maksimal satu mapping aktif per version    | Unique constraint `(activity_id, version)` dengan `active = true`. Duplicate submission ditolak di database layer              |
| DEC-025  | Mapping history append-only                                             | Perubahan mapping menyimpan versi sebelumnya. Tidak ada hard delete. Soft archive dengan `active = false` dan `archived_at`   |
| DEC-026  | Sandbox adapter mengembalikan data synthetic yang diberi label          | Tidak menyatakan integrasi kampus nyata telah aktif. Data synthetic mencakup success, partial, dan failure scenarios          |
| DEC-027  | Sync job memiliki idempotency key unik per external reference           | Key: `{mapping_version}:{external_reference}:{period}`. Duplicate processing ditolak berdasarkan key                           |
| DEC-028  | Retry exponential backoff 1m, 5m, 15m, 60m, lalu dead-letter           | Max 5 attempt. `maxExceptions: 3` per job class. Timeout per attempt: 30 detik                                                 |
| DEC-029  | Failure review queue untuk campus admin                                 | Sync yang gagal masuk ke `academic_sync_failures` dengan status, attempt, last_error, dan retry action. Admin dapat retry manual |
| DEC-030  | Konfigurasi provider disimpan terenkripsi pada server-side env/config   | API key, base URL, dan institution secret disimpan sebagai Laravel encrypted config. Tidak masuk log, browser, atau API response |
| DEC-031  | External duplicate dikembalikan ke campus admin untuk rekonsiliasi      | Ketika provider eksternal melaporkan data yang sudah ada di SATU, entry akan di-flag `reconciliation_pending` dan masuk queue review |
| DEC-032  | Sandbox pilot mencakup seluruh kontrak koneksi kecuali auth production  | Sandbox menggunakan fake token, mock endpoint, dan synthetic dataset. Hanya auth production yang digantikan oleh kampus nyata  |

### Pilot API Boundaries

Sandbox pilot mencakup:

- **Connection contract:** Adapter di balik `AcademicGateway` interface. Sandbox implementation disediakan SATU. Production implementation menunggu API key dan endpoint dari kampus.
- **Authentication:** Sandbox memakai static fake token. Production menggunakan institution-scoped API key yang disediakan kampus, dikirim sebagai `Authorization: Bearer <token>` header.
- **Endpoint contract:**
  - `POST /sync/activities` -- kirim aktivitas mahasiswa ke kampus.
  - `GET /sync/status/{batch_id}` -- cek status batch sync.
  - `POST /credits/verify` -- verifikasi kredit yang diterima dari kampus.
- **Sync scope:** Aktivitas dengan kontribusi approved. Data mahasiswa mencakup NIM, activity_id, badge_id, period, credit_claim, dan mapping_version. Data diproyeksikan dengan allowlist.
- **Failure handling:** Delivery failure masuk retry queue. Integration failure (4xx/5xx) dicatat dengan correlation ID dan dapat ditinjau campus admin. Timeout setelah 30 detik.
- **Rate limit:** Sandbox tidak membatasi. Production mengikuti rate limit yang ditentukan kampus, dengan backpressure pada queue dispatcher.
- **Idempotency:** Setiap sync request membawa header `Idempotency-Key` dengan format `{mapping_version}:{external_reference}:{period}`.
- **Scope eksplisit selama pilot:** CSV roster tepat dan approved contribution saja. Tidak ada sinkronisasi data kontak, message, private evidence, inclusion signal, atau Talent data.

### Sandbox Scenarios

Sandbox adapter harus mendemonstrasikan:

1. **Success path:** Aktivitas dikirim, kampus menerima, kredit returned, SATU mencatat.
2. **Partial success:** Sebagian batch diterima, sebagian ditolak dengan reason code.
3. **Duplicate detection:** Idempotency key mencegah processing ganda.
4. **Network timeout:** Simulasi timeout setelah 30 detik.
5. **Server error (5xx):** Retry dengan backoff, lalu dead-letter.
6. **Auth failure (401/403):** Tidak di-retry, flag `auth_failure` pada provider status.
7. **Rate limit (429):** Backpressure pada queue dispatcher.
8. **Invalid payload (422):** Validasi gagal, tidak di-retry, campus admin mendapat notifikasi.

### Mapping Versioning

- Mapping disimpan pada `credit_mappings` dengan kolom `version` integer.
- Campus admin membuat draft mapping version baru. Hanya satu version yang `active = true` pada satu waktu.
- Version transition menghasilkan audit entry.
- Data historis tetap merujuk pada mapping version saat sync terjadi.

### Open

| ID       | Keputusan yang dibutuhkan                                     | Owner                             | Batas                                |
| -------- | ------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| GATE-006 | Format CSV rosters untuk initial data seeding campus pilot    | Institution engineering           | Sebelum sandbox data seeding         |
| GATE-007 | Credit type taxonomy dan bobot SKS per aktivitas              | Institution academic office       | Sebelum mapping go-live             |
| GATE-008 | API base URL, auth mechanism, dan rate limit kampus produksi  | Institution engineering           | Sebelum production provider build   |
| GATE-009 | Endpoint contract final (field mapping, error codes, format)  | Institution engineering + product | Sebelum production provider build   |
| GATE-010 | Approval workflow kredit kampus (auto-accept vs manual)       | Institution academic office       | Sebelum mapping go-live             |

## Change Rules

- Product boundary berubah: update `PRODUCT.md` dan PRD.
- Entity, event, Policy, provider, atau retention berubah: update engineering/security docs.
- Route behavior berubah: update matching surface brief.
- Task status berubah: update GitHub issue/milestone saja.
