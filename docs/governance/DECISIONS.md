# Decision Log SATU

## Aturan

Accepted decision adalah product atau architecture contract. Open gate hanya dapat ditutup oleh owner yang berwenang melalui GitHub issue dan pull request yang memperbarui owning document. Implementer tidak boleh menutup gate melalui asumsi.

## Accepted Decisions

| ID      | Keputusan                                                                          | Dampak                                                                                                                                                                       |
| ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-001 | Produk perlombaan adalah SATU, bukan competition-management system                 | Seluruh backlog membangun platform SATU                                                                                                                                      |
| DEC-002 | Rilis mencakup proposal kecuali Bab 4.2                                            | Talent, gamification, academic sandbox, inclusion, dan landing masuk release                                                                                                 |
| DEC-003 | Satu kampus pilot lebih dahulu                                                     | Model tetap institution-aware, rollout lintas kampus ditunda                                                                                                                 |
| DEC-004 | Tidak ada email pada target flow                                                   | Identity memakai private username, password, dan verified WhatsApp phone                                                                                                     |
| DEC-005 | Roster exact match memakai NIM dan verified phone                                  | Mismatch atau ambiguity masuk manual review                                                                                                                                  |
| DEC-006 | Platform admin menyetujui institution dan mengundang campus admin via WhatsApp     | Privileged role tidak tersedia lewat open registration                                                                                                                       |
| DEC-007 | Fonnte adalah initial WhatsApp provider melalui backend adapter dan queue          | SATU membuat OTP; tidak memakai unofficial Fonnte package                                                                                                                    |
| DEC-008 | In-app notification center adalah canonical                                        | WhatsApp hanya untuk approved important purpose                                                                                                                              |
| DEC-009 | Campus reviewer memvalidasi contribution langsung                                  | Team confirmation tidak diperlukan                                                                                                                                           |
| DEC-010 | Hybrid leaderboard memakai group default dan individual opt-in                     | Average verified XP, semester, cohort minimal 5, shared rank                                                                                                                 |
| DEC-011 | Inclusion tidak menjadi leaderboard input                                          | Mencegah stigma dan feedback loop yang tidak adil                                                                                                                            |
| DEC-012 | Inclusion engine/UI production-ready di balik feature flag                         | Synthetic demo diperbolehkan, real activation menunggu governance                                                                                                            |
| DEC-013 | Talent Portal memakai verified organization dan internal entitlement               | Billing provider serta pricing di luar release                                                                                                                               |
| DEC-014 | Academic integration baseline adalah contract plus sandbox                         | Real campus API adalah external gate                                                                                                                                         |
| DEC-015 | Native Laravel Policies/Gates adalah authorization baseline                        | Role berasal dari membership dan tenant context                                                                                                                              |
| DEC-016 | Gunakan mature library ketika fit dan kompatibel                                   | Issue wajib menyebut package atau framework-native decision                                                                                                                  |
| DEC-017 | GitHub issues/milestones adalah execution truth                                    | Phase files dan progress file dipensiunkan setelah migration audit                                                                                                           |
| DEC-018 | Main memakai protected pull-request workflow dengan owner admin bypass             | Required CI, resolved conversations, no force/delete, dan **Squash and merge**; contributor non-owner memerlukan 1 approval, owner boleh self-review dan merge sebagai admin |
| DEC-019 | Owner ditandai label role, bukan assignee sementara                                | Assignee ditambahkan setelah komposisi tim final                                                                                                                             |
| DEC-020 | Consumer boleh development dengan stacked branch setelah contract checkpoint       | Parent diberi label `contract-ready`; consumer memakai `Stacked on: #<issue>` dan base branch parent; merge tetap menunggu seluruh hard dependency closed                    |
| DEC-021 | Satu institution pilot untuk rilis perlombaan                                      | Model tenant tetap institution-aware tanpa hardcoded single-tenant; ekspansi lintas institusi tidak memerlukan perubahan model keamanan                                      |
| DEC-022 | Roster adalah milik institution dan disediakan dalam CSV/spreadsheet               | Institution bertanggung jawab atas kebenaran data; SATU hanya mengimpor, memvalidasi, dan tidak memodifikasi roster yang sudah committed                                     |
| DEC-023 | Exact match NIM dan verified phone pada roster aktif adalah jalur verifikasi utama | Normalized NIM dan nomor WhatsApp E.164 dibandingkan terhadap roster; mismatch, ambiguity, atau record tidak aktif masuk manual review                                       |
| DEC-024 | Active member didefinisikan per semester per institution                           | Student dengan verified affiliation, terdaftar pada roster semester aktif, serta memiliki minimal satu approved contribution pada semester tersebut                          |
| DEC-025 | Manual review affiliation memiliki SLA 3 hari kerja                                | Campus reviewer menindaklanjuti affiliation queue dalam 3 hari kerja; eskalasi ke platform admin setelah 5 hari kerja tanpa tindakan                                         |
| DEC-026 | Roster import bersifat immutable setelah committed                                 | Setiap import menyimpan checksum, source filename, timestamp, dan batch identity; correction atau penambahan masuk sebagai batch baru, bukan modifikasi in-place             |
| DEC-027 | Tenant isolation mencakup seluruh layer                                            | Institution-scoped queries, Policies, jobs, cache keys, storage paths, exports, dan Reverb channels; platform admin memakai explicit audited cross-tenant scope              |

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

## Talent Entitlement and Recruiter Verification

### Accepted Decisions

| ID      | Keputusan                                                                | Dampak                                                                                                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-021 | Recruiter organization diverifikasi oleh platform admin                 | Recruiter tidak dapat dibuat melalui open registration. Invitation atau application ke recruiter organization memerlukan evidence organisasi dan disetujui oleh platform admin. Recruiter organization adalah tenant-scoped yang terpisah dari institution.          |
| DEC-022 | Talent Portal access hanya dengan active entitlement                   | Entitlement diterbitkan platform admin per recruiter organization. Tidak ada bayaran, price, atau billing pada rilis kompetisi. Tanpa entitlement active, seluruh search, saved-candidate mutation, dan contact request ditolak.                                     |
| DEC-023 | Recruiter-safe projection adalah hard boundary                          | Recruiter hanya menerima field yang di-allowlist: display name, program studi, skill, proficiency, portfolio entry yang visible, dan badge. Username, NIM, phone, private evidence, discussion, raw audit, matching input, inclusion signal, dan leaderboard dilarang. |
| DEC-024 | Contact request memerlukan student consent untuk handoff nomor WhatsApp | Recruiter mengirim contact request tanpa melihat nomor WhatsApp. Student accept menjadi explicit consented handoff; student decline atau cabut visibility menghentikan proyeksi. Visibility withdrawal tidak menghapus data yang sudah di-share sesuai retention.     |
| DEC-025 | Recruiter membership memiliki lifecycle audit                           | Setiap perubahan status membership (active, suspended, revoked), entitlement issuance, entitlement expiration, contact handoff, dan visibility withdrawal harus diaudit. Audit log mengacu pada SECURITY_PRIVACY.md section 11.                                       |
| DEC-026 | Cross-organization membership dilarang                                  | Satu user tidak boleh memiliki membership di lebih dari satu recruiter organization secara bersamaan. Skenario pindah organisasi memerlukan proses revoke dan re-verification yang diaudit.                                                                          |
| DEC-027 | Student mengontrol visibility per portfolio entry                      | Student dapat mengaktifkan, menonaktifkan, atau mencabut visibility per entry. Recruiter discoverability diatur melalui consent eksplisit. Default visibility adalah off (tidak dibagikan ke recruiter).                                                              |
| DEC-028 | Entitlement expiration menolak aksi baru tanpa menghapus data historis  | Saat entitlement expired, search, saved-candidate mutation, dan contact request baru ditolak. Data historis yang sudah ada (saved candidate, contact request yang sudah dikirim) dipertahankan sesuai retention matrix.                                               |

### Open

| ID          | Keputusan yang dibutuhkan                                                                                         | Owner                   | Batas                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| GATE-004    | Recruiter verification, entitlement issuance, contact, dan retention policy                                       | Product + legal/privacy | Sebelum recruiter pilot                                            |
| GATE-004-A  | Dokumen atau evidence apa yang wajib diserahkan recruiter organization untuk verifikasi (NPWP/SIUP/Akta/profil)?  | Product + legal/privacy | Sebelum verifikasi recruiter organization production               |
| GATE-004-B  | Siapa yang berwenang menyetujui atau menolak recruiter organization (platform admin tunggal atau multi-reviewer)? | Product                 | Sebelum verifikasi recruiter organization production               |
| GATE-004-C  | Apakah entitlement memiliki tier (misal basic/pro) atau satu tier universal untuk rilis kompetisi?                | Product                 | Sebelum implementasi entitlement                                   |
| GATE-004-D  | Berapa durasi default entitlement dan apakah ada renewal process?                                                | Product                 | Sebelum implementasi entitlement                                   |
| GATE-004-E  | Kondisi apa yang memicu revoke otomatis vs manual review untuk membership recruiter?                              | Product + legal/privacy | Sebelum implementasi recruiter membership lifecycle                |
| GATE-004-F  | Berapa retention period untuk data contact dan saved candidate setelah visibility withdrawal atau membership revoke? | Legal/privacy           | Sebelum recruiter pilot                                            |
| GATE-004-G  | Apakah recruiter organization bisa di-suspend atau di-revoke oleh platform admin, dan apa dampaknya?              | Product + legal/privacy | Sebelum recruiter pilot                                            |
| GATE-004-H  | Bagaimana proses pindah recruiter organization (revoke + re-verify), dan apakah ada cooldown period?              | Product                 | Sebelum implementasi recruiter membership cross-organization flow  |

## Open Gates

| ID       | Keputusan yang dibutuhkan                                                                                                          | Owner                             | Batas                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- |
| GATE-001 | Institution pilot, roster file format, active-member definition, dan review SLA (lihat `## Pilot Institution and Roster Contract`) | Product + institution             | Sebelum roster production flow   |
| GATE-002 | DPIA, lawful basis, retention matrix, WhatsApp notice, dan data-right procedure                                                    | Security/privacy + institution    | Sebelum real-data pilot          |
| GATE-003 | Academic credit mapping dan real pilot API contract                                                                                | Product + institution engineering | Sebelum real provider connection |
| GATE-004 | Recruiter verification, entitlement issuance, contact, dan retention policy                                                        | Product + legal/privacy           | Sebelum recruiter pilot          |
| GATE-005 | Final visual reference dan competition UAT                                                                                         | Product owner                     | Sebelum release                  |

## Pilot Institution and Roster Contract

Bagian ini mendokumentasikan keputusan kebijakan untuk institution pilot dan roster contract (GATE-001). Keputusan di bawah bersifat draft dan memerlukan konfirmasi eksternal dari institution yang ditunjuk sebelum menjadi accepted decision final. Item `### Open` adalah sub-gate yang diserahkan ke institution untuk konfirmasi.

### Institution Selection Criteria

1. Institution bersedia menjadi pilot tunggal untuk rilis perlombaan SATU.
2. Institution menyediakan roster mahasiswa aktif minimal satu program studi dengan data NIM, nama, program studi, angkatan/semester, dan nomor WhatsApp.
3. Institution menunjuk minimal satu campus admin yang akan menerima undangan WhatsApp dan bertanggung jawab terhadap affiliation review serta contribution validation.
4. Institution memahami bahwa seluruh data impor bersifat tenant-owned dan tidak akan dibagikan ke institution lain atau pihak ketiga di luar platform tanpa persetujuan institution.
5. Institution menyetujui bahwa sample synthetic roster untuk demonstrasi tidak mengandung data personal nyata.

### Roster Contract Requirements

1. **Pemilik data**: Institution adalah data owner. SATU bertindak sebagai data processor untuk keperluan verifikasi afiliasi, gamification, dan campus operations.
2. **Tujuan penggunaan**: Verifikasi NIM dan phone, afiliasi mahasiswa, leaderboard program studi, dan overview partisipasi. Tidak untuk profiling, penilaian akademik, atau keputusan administratif kampus.
3. **Format pengiriman**: CSV atau spreadsheet (`.xlsx`) melalui antarmuka campus admin. Format mengacu pada `### Roster Format and Normalization`.
4. **Frekuensi**: Institution mengirimkan roster per semester. Roster sebelumnya tetap tersimpan sebagai batch immutable.
5. **Retensi**: Roster disimpan sesuai retention period yang disepakati dalam DPIA dan lawful basis (GATE-002). Mahasiswa dapat melihat status afiliasi tetapi tidak dapat melihat roster mentah.
6. **Sample synthetic**: Demonstrasi dan pengujian menggunakan sample roster synthetic yang tidak mengandung NIM, nama, atau nomor telepon asli.

### Roster Format and Normalization

Kolom minimal roster:

| Kolom            | Format                             | Keteratan                                              |
| ---------------- | ---------------------------------- | ------------------------------------------------------ |
| `nim`            | String, di-trim, di-lowercase      | Unique per institution per semester                    |
| `nama`           | String                             | Display name roster; tidak mengganti display name SATU |
| `program_studi`  | String                             | Nama program studi                                     |
| `angkatan`       | Integer                            | Tahun masuk                                            |
| `semester`       | String (contoh: `2025/2026 Genap`) | Semester efektif roster                                |
| `nomor_whatsapp` | String, E.164                      | Nomor WhatsApp terverifikasi institution               |
| `status_aktif`   | Boolean/enum                       | Aktif, Cuti, Lulus, Dropout, atau lainnya              |

Aturan normalisasi:

- **NIM**: Di-trim whitespace, di-lowercase, strip karakter non-alphanumeric opsional.
- **Nomor WhatsApp**: Dinormalisasi ke E.164 melalui `propaganistas/laravel-phone`. Nomor yang tidak valid E.164 ditolak dengan row error.
- **Duplikat NIM**: Baris pertama yang ditemukan dipakai; baris duplikat berikutnya ditandai sebagai skipped dengan alasan `duplicate_nim`.
- **Record tidak aktif**: Mahasiswa dengan `status_aktif` bukan `Aktif` tidak masuk pencocokan afiliasi otomatis. Record disimpan untuk keperluan audit dan referensi history.
- **Baris error**: Baris dengan NIM kosong, nomor WhatsApp tidak valid, atau program studi kosong ditandai sebagai error dan tidak diproses. Row error dilaporkan ke campus admin.

### Active-Member Definition

1. **Definisi**: Seorang student dianggap active member pada semester `S` dan institution `I` jika:
    - Memiliki verified affiliation pada institution `I`.
    - Terdaftar pada roster semester `S` dengan `status_aktif = Aktif`.
    - Memiliki minimal satu approved contribution pada semester `S`.
2. **Penggunaan**: Active-member count menjadi denominator leaderboard program studi dan tim.
3. **Cohort minimum**: Leaderboard hanya dipublikasikan jika program studi atau tim memiliki minimal lima active member.
4. **Periode**: Perhitungan active member di-reset setiap semester. Student yang tidak memiliki kontribusi pada semester berjalan tidak dihitung, meskipun memiliki kontribusi pada semester sebelumnya.
5. **Inclusion signal**: Active-member definition tidak dipengaruhi oleh inclusion signal atau connectivity opportunity.

### Manual-Review SLA

1. **Trigger**: Affiliation request yang tidak mendapatkan exact match pada roster (NIM tidak ditemukan, phone tidak cocok, atau roster entry tidak aktif) masuk ke manual review queue.
2. **First response**: Campus reviewer wajib menindaklanjuti dalam 3 hari kerja sejak request masuk.
3. **Escalation**: Request yang tidak ditindaklanjuti dalam 5 hari kerja dieskalasi ke platform admin.
4. **Outcome**: Campus reviewer dapat menyetujui (verified), menolak (rejected), atau meminta informasi tambahan (pending_info) dengan alasan tertulis.
5. **Audit**: Seluruh keputusan manual review disimpan dalam append-only history dengan reviewer identity, timestamp, reason code, dan catatan.
6. **Correction flow**: Jika student mengubah NIM atau nomor WhatsApp, sistem membuat affiliation request baru. Request sebelumnya tetap tercatat sebagai history.

### Tenancy Boundaries

1. **Institution-scoped queries**: Setiap query pada resource tenant-owned (projects, teams, contributions, leaderboard, roster, affiliation, inclusion) di-scope otomatis ke `institution_id` dari konteks user aktif.
2. **Institution-scoped Policies**: Laravel Policy dan Gate memeriksa institution membership dan active tenant context sebelum mengotorisasi akses. Resource ownership sekunder terhadap institution scope.
3. **Institution-scoped storage**: Private attachment dan evidence disimpan pada path dengan prefix institution (`private/{institution_id}/...`). Akses download diautorisasi melalui Policy, bukan URL guessing.
4. **Institution-scoped cache**: Cache key diawali institution ID. Cache invalidation per-tenant tanpa memengaruhi tenant lain.
5. **Institution-scoped exports**: Export roster, leaderboard, atau partisipasi hanya menyertakan data milik institution yang bersangkutan. Platform admin export diberi label audited.
6. **Institution-scoped broadcasts**: Reverb channel authorization memverifikasi user adalah active member dari institution yang sama dengan resource. Channel naming menyertakan institution scope.
7. **Cross-tenant platform operations**: Platform admin memiliki explicit audited scope untuk operasi lintas tenant. Setiap akses cross-tenant dicatat dalam audit log.

### Open

Item berikut memerlukan konfirmasi eksternal dari pilot institution:

- [ ] Nama institution pilot dikonfirmasi.
- [ ] Institution menyetujui roster contract dan data-ownership terms.
- [ ] Institution menyetujui format roster dan field contract.
- [ ] Institution mengonfirmasi aturan normalisasi NIM (apakah ada format spesifik institution).
- [ ] Institution mengonfirmasi rule duplicate records (first-match atau tolak seluruh batch).
- [ ] Institution mengonfirmasi daftar `status_aktif` yang digunakan dan definisi setiap status.
- [ ] Institution mengonfirmasi active-member definition dan cohort minimum.
- [ ] Institution mengonfirmasi manual-review SLA (3 hari kerja pertama, 5 hari kerja eskalasi).
- [ ] Institution mengonfirmasi correction flow untuk NIM dan phone yang berubah.
- [ ] Institution menyediakan sample synthetic roster untuk pengujian.
- [ ] Institution menunjuk campus admin dan nomor WhatsApp yang akan diundang.
- [ ] Institution mengonfirmasi tenancy boundaries dan isolation contract.

GATE-001 ditutup setelah seluruh item di atas dikonfirmasi oleh institution dan dicatat dalam pull request ini atau issue lanjutan.

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
