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

## Change Rules

- Product boundary berubah: update `PRODUCT.md` dan PRD.
- Entity, event, Policy, provider, atau retention berubah: update engineering/security docs.
- Route behavior berubah: update matching surface brief.
- Task status berubah: update GitHub issue/milestone saja.
