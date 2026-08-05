# Decision Log SATU

## Aturan

Accepted decision adalah product atau architecture contract. Open gate hanya dapat ditutup oleh owner yang berwenang melalui GitHub issue dan pull request yang memperbarui owning document. Implementer tidak boleh menutup gate melalui asumsi.

## Accepted Decisions

| ID      | Keputusan                                                                      | Dampak                                                                       |
| ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| DEC-001 | Produk perlombaan adalah SATU, bukan competition-management system             | Seluruh backlog membangun platform SATU                                      |
| DEC-002 | Rilis mencakup proposal kecuali Bab 4.2                                        | Talent, gamification, academic sandbox, inclusion, dan landing masuk release |
| DEC-003 | Satu kampus pilot lebih dahulu                                                 | Model tetap institution-aware, rollout lintas kampus ditunda                 |
| DEC-004 | Tidak ada email pada target flow                                               | Identity memakai private username, password, dan verified WhatsApp phone     |
| DEC-005 | Roster exact match memakai NIM dan verified phone                              | Mismatch atau ambiguity masuk manual review                                  |
| DEC-006 | Platform admin menyetujui institution dan mengundang campus admin via WhatsApp | Privileged role tidak tersedia lewat open registration                       |
| DEC-007 | Fonnte adalah initial WhatsApp provider melalui backend adapter dan queue      | SATU membuat OTP; tidak memakai unofficial Fonnte package                    |
| DEC-008 | In-app notification center adalah canonical                                    | WhatsApp hanya untuk approved important purpose                              |
| DEC-009 | Campus reviewer memvalidasi contribution langsung                              | Team confirmation tidak diperlukan                                           |
| DEC-010 | Hybrid leaderboard memakai group default dan individual opt-in                 | Average verified XP, semester, cohort minimal 5, shared rank                 |
| DEC-011 | Inclusion tidak menjadi leaderboard input                                      | Mencegah stigma dan feedback loop yang tidak adil                            |
| DEC-012 | Inclusion engine/UI production-ready di balik feature flag                     | Synthetic demo diperbolehkan, real activation menunggu governance            |
| DEC-013 | Talent Portal memakai verified organization dan internal entitlement           | Billing provider serta pricing di luar release                               |
| DEC-014 | Academic integration baseline adalah contract plus sandbox                     | Real campus API adalah external gate                                         |
| DEC-015 | Native Laravel Policies/Gates adalah authorization baseline                    | Role berasal dari membership dan tenant context                              |
| DEC-016 | Gunakan mature library ketika fit dan kompatibel                               | Issue wajib menyebut package atau framework-native decision                  |
| DEC-017 | GitHub issues/milestones adalah execution truth                                | Phase files dan progress file dipensiunkan setelah migration audit           |
| DEC-018 | Main memakai protected pull-request workflow                                   | 1 approval, resolved conversations, required CI, no force/delete, squash     |
| DEC-019 | Owner ditandai label role, bukan assignee sementara                            | Assignee ditambahkan setelah komposisi tim final                             |

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

## Change Rules

- Product boundary berubah: update `PRODUCT.md` dan PRD.
- Entity, event, Policy, provider, atau retention berubah: update engineering/security docs.
- Route behavior berubah: update matching surface brief.
- Task status berubah: update GitHub issue/milestone saja.
