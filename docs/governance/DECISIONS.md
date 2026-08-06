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

| ID       | Keputusan yang dibutuhkan                                                       | Owner                             | Batas                            |
| -------- | ------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- |
| GATE-001 | Institution pilot, roster file format, active-member definition, dan review SLA | Product + institution             | Sebelum roster production flow   |
| GATE-002 | DPIA, lawful basis, retention matrix, WhatsApp notice, dan data-right procedure | Security/privacy + institution    | Sebelum real-data pilot          |
| GATE-003 | Academic credit mapping dan real pilot API contract                             | Product + institution engineering | Sebelum real provider connection |
| GATE-004 | Recruiter verification, entitlement issuance, contact, dan retention policy     | Product + legal/privacy           | Sebelum recruiter pilot          |
| GATE-005 | Final visual reference dan competition UAT                                      | Product owner                     | Sebelum release                  |

## Change Rules

- Product boundary berubah: update `PRODUCT.md` dan PRD.
- Entity, event, Policy, provider, atau retention berubah: update engineering/security docs.
- Route behavior berubah: update matching surface brief.
- Task status berubah: update GitHub issue/milestone saja.
