# Kontrak Implementasi SATU

Dokumen ini merangkum struktur issue, label, dan sinkronisasi status GitHub. GitHub issue menyimpan task dan acceptance criteria; milestone menyimpan urutan outcome. Dokumen ini menjelaskan kontrak repository dan automation, bukan langkah kerja agent.

## Issue Contract

Issue implementasi berisi:

1. Background
2. Expected Outcome
3. Acceptance Criteria
4. Verification
5. Out of Scope
6. Dependencies and Handoff
7. Library/Package
8. References
9. Metadata

Issue frontend/fullstack juga memuat `Frontend Loading Contract` atau `N/A` jika tidak relevan. Issue UI merujuk dokumen UX pemilik dan backend contract yang relevan. Issue yang membutuhkan library menyebut package, alasan, compatibility, dan license.

## Labels dan Status

- Type: `type:feature`, `type:ux`, `type:quality`, `type:documentation`, `type:governance`, `type:infrastructure`.
- Area: `area:identity`, `area:tenancy`, `area:profile`, `area:project`, `area:matching`, `area:workspace`, `area:contribution`, `area:portfolio`, `area:gamification`, `area:campus`, `area:inclusion`, `area:talent`, `area:integration`, `area:notification`, `area:platform`.
- Owner: `owner:backend`, `owner:frontend`, `owner:fullstack`, `owner:qa`, `owner:devops`, `owner:product-design`, `owner:security-privacy`.
- Priority: `priority:p0` sampai `priority:p3`.
- Gate: `gate:human`, `gate:external`, `gate:conditional`.
- Contract marker: `contract-ready`.
- Status: `historical`, `superseded`, `blocked`, `stacked`, `ready`, `in-progress`, `needs-review`.

Owner label menunjukkan accountable role. Assignee pada GitHub menunjukkan ownership. Status labels saling eksklusif; `contract-ready` adalah marker kontrak dan gate label bukan status.

Workflow [`sync-issue-status.yml`](../../.github/workflows/sync-issue-status.yml) menyinkronkan label status dari issue dan pull request. `ready` berarti tidak ada hard dependency terbuka; `blocked` berarti ada blocker terbuka tanpa kondisi stack yang valid; `stacked` berarti metadata dan parent contract memenuhi aturan automation; `in-progress` dan `needs-review` mengikuti status pull request terkait.

Workflow [`sync-satu-project.yml`](../../.github/workflows/sync-satu-project.yml) memetakan status itu ke field `Delivery Status` pada Project. Workflow mendukung `workflow_dispatch` dengan `dry_run` dan schedule sebagai safety net. Permission, konfigurasi, recovery, dan backfill dijelaskan di [GITHUB_PROJECT.md](./GITHUB_PROJECT.md).

## Handoff dan Dependencies

`Blocked by` hanya mencatat hard dependency yang belum selesai. Dependencies yang sudah selesai dapat dicatat sebagai `Prerequisite completed: #<issue>`. Handoff menjelaskan konteks atau artifact yang perlu diteruskan ke pekerjaan berikutnya.

## Commit Format

Gunakan format Conventional Commits yang dijelaskan di [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md). Hook `commit-msg` menjalankan commitlint dan hook `pre-commit` menjalankan pemeriksaan lokal.

## Historical Mapping

Legacy P01 sampai P69 dipertahankan sebagai metadata pada migrated issue. P01 sampai P15 ditutup sebagai historical completed. P16 ditutup sebagai superseded. P17 sampai P69 tetap open dan mengikuti kontrak saat ini. Phase file tidak dibuat kembali.
