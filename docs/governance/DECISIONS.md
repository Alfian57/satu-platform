# Decision Log SATU

## Format

| Field       | Makna                                                  |
| ----------- | ------------------------------------------------------ |
| Status      | `accepted`, `provisional`, `superseded`, atau `open`   |
| Gate        | Milestone paling lambat keputusan harus ditutup        |
| Consequence | Dampak yang harus diikuti implementasi dan dokumentasi |

## Accepted Decisions

| ID      | Decision                                                              | Status   | Consequence                                                                                       |
| ------- | --------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| DEC-001 | Product dirancang untuk production penuh dengan delivery bertahap     | accepted | Recruiter dan integration contract didokumentasikan, tetapi tidak dipaksakan ke increment pertama |
| DEC-002 | Increment pertama mencakup student dan campus                         | accepted | Roadmap memprioritaskan complete core loop sebelum Talent Portal                                  |
| DEC-003 | Satu MySQL database dengan tenant-aware institution scope             | accepted | Semua tenant-owned entity, query, policy, job, dan event membawa institution context              |
| DEC-004 | Registrasi student terbuka                                            | accepted | Role sensitif tidak dapat dipilih saat registrasi umum                                            |
| DEC-005 | Afiliasi diverifikasi melalui approved email domain atau campus admin | accepted | Verified credit memerlukan membership `verified`                                                  |
| DEC-006 | SNA mengukur risiko eksklusi kolaboratif, bukan kesehatan mental      | accepted | Tidak ada diagnosis, sentiment analysis chat, atau automatic adverse decision                     |
| DEC-007 | Matchmaking memakai explainable versioned score                       | accepted | Setiap recommendation menyimpan score version dan human-readable reasons                          |
| DEC-008 | Perusahaan adalah payer utama melalui Talent Portal subscription      | accepted | Student tetap gratis untuk core collaboration; pricing adalah hypothesis                          |
| DEC-009 | Visual world bernama “Buku Besar Kolaborasi”                          | accepted | `DESIGN.md` dan semua app surface mewarisi ledger/provenance grammar                              |
| DEC-010 | MySQL menjadi target production                                       | accepted | SQLite boleh tetap dipakai untuk local/test ringan bila behavior kompatibel                       |
| DEC-011 | Workspace realtime menggunakan Laravel Reverb                         | accepted | Event memakai authorized private/presence channels; database tetap source of truth                |
| DEC-012 | Dokumentasi berbahasa Indonesia dengan identifier teknis Inggris      | accepted | UX copy dan narasi Indonesia; entity/event/enum mengikuti codebase                                |

## Provisional Decisions

| ID      | Decision                                          | Status      | Gate                          | Validation                                |
| ------- | ------------------------------------------------- | ----------- | ----------------------------- | ----------------------------------------- |
| DEC-101 | Bobot awal matching                               | provisional | Sebelum matching pilot        | Offline evaluation dan stakeholder review |
| DEC-102 | Minimum data untuk inclusion signal               | provisional | Sebelum inclusion queue aktif | DPIA, fairness test, dan pilot simulation |
| DEC-103 | Project type awal: competition dan research       | provisional | Sebelum seed data final       | Konfirmasi institution pilot              |
| DEC-104 | Recruiter subscription packaging                  | provisional | Sebelum recruiter pilot       | Buyer interview dan concierge test        |
| DEC-105 | Academic integration memakai asynchronous adapter | provisional | Sebelum integration build     | Spesifikasi sistem kampus                 |

## Open Gates

| ID       | Question                                                | Gate                             | Owner                  |
| -------- | ------------------------------------------------------- | -------------------------------- | ---------------------- |
| OPEN-001 | Kampus pilot dan approved email domains                 | Sebelum increment 1 acceptance   | Product/institution    |
| OPEN-002 | Siapa yang berwenang memvalidasi contribution           | Sebelum campus review build      | Institution            |
| OPEN-003 | Retention period per data class                         | Sebelum pilot data nyata         | Privacy/legal          |
| OPEN-004 | Lawful basis, consent text, dan data-subject process    | Sebelum pilot data nyata         | Privacy/legal          |
| OPEN-005 | DPIA untuk scoring, matching, dan systematic monitoring | Sebelum inclusion signal aktif   | Privacy/legal/product  |
| OPEN-006 | Mapping verified contribution ke activity credit        | Sebelum academic integration     | Institution            |
| OPEN-007 | Reverb production topology dan process manager          | Sebelum production deployment    | Engineering/operations |
| OPEN-008 | Recruiter price dan entitlement                         | Sebelum paid pilot               | Business               |
| OPEN-009 | Exact design tokens dan typefaces                       | Setelah surface pertama dibangun | Design/frontend        |

## Change Rules

- Mengubah accepted decision membutuhkan entry baru yang menyebut ID sebelumnya sebagai `superseded`.
- Perubahan matching atau inclusion policy harus memperbarui PRD, security, data model, UX copy, dan test strategy.
- Open gate tidak boleh diam-diam diselesaikan oleh implementer.
- Proposal atau demo tidak boleh menyatakan open gate sebagai capability yang sudah final.
