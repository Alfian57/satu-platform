# Implementation Workflow: SATU

## Source of Truth

GitHub issues menyimpan atomic task, status, dependencies, owner role, gate, acceptance criteria, dan handoff. GitHub milestones menyimpan release sequence. Pull request menyimpan implementation evidence. Dokumen ini mendefinisikan workflow, bukan progress.

Operational delivery view tersedia pada [GITHUB_PROJECT.md](./GITHUB_PROJECT.md). Project `SATU Delivery` membantu triage issue dan Pull Request, tetapi tidak menggantikan issue body atau milestone sebagai source of truth.

## Issue Contract

Setiap implementation issue wajib memiliki:

1. Background
2. Expected Outcome
3. Acceptance Criteria
4. Verification
5. Out of Scope
6. Dependencies and Handoff
7. Library/Package
8. References
9. Pull Request
10. Metadata

Issue yang menyentuh frontend juga wajib memiliki `Frontend Loading Contract` atau menulis `N/A` bila tidak relevan. Quality gate frontend memakai section `Frontend Loading Verification`.

Issue UI juga menunjuk surface brief. Issue yang membutuhkan library menyebut exact package, install command, reason, compatibility, license review, dan fake/test strategy. Jika framework-native cukup, jelaskan alasannya.

## Labels

- Type: `type:feature`, `type:ux`, `type:quality`, `type:documentation`, `type:governance`, `type:infrastructure`.
- Area: `area:identity`, `area:tenancy`, `area:profile`, `area:project`, `area:matching`, `area:workspace`, `area:contribution`, `area:portfolio`, `area:gamification`, `area:campus`, `area:inclusion`, `area:talent`, `area:integration`, `area:notification`, `area:platform`.
- Owner: `owner:backend`, `owner:frontend`, `owner:fullstack`, `owner:qa`, `owner:devops`, `owner:product-design`, `owner:security-privacy`.
- Priority: `priority:p0` sampai `priority:p3`.
- Gate: `gate:human`, `gate:external`, `gate:conditional`.
- State helpers: `historical`, `superseded`, `blocked`, `ready`, `in-progress`, `needs-review`.

Owner label menunjukkan accountable role. GitHub assignee belum dipakai sampai komposisi developer final.

### Status workflow

- `ready`: issue open dan tidak memiliki hard dependency open.
- `blocked`: issue memiliki hard dependency open.
- `in-progress`: pekerjaan branch-only atau open draft Pull Request sedang berjalan.
- `needs-review`: open Pull Request sudah siap direview atau menunggu gate/review.

Status labels harus mutually exclusive. Gate label tidak otomatis berarti `blocked`.

Workflow [`sync-issue-status.yml`](../../.github/workflows/sync-issue-status.yml) melakukan reconciliation otomatis pada event issue dan Pull Request, serta menyediakan `workflow_dispatch` dengan `dry_run`. Hard blocker selalu menghasilkan `blocked`; setelah blocker selesai, status diturunkan dari open Pull Request atau menjadi `ready` jika tidak ada Pull Request.

Workflow [`sync-satu-project.yml`](../../.github/workflows/sync-satu-project.yml) merefleksikan status yang sama ke field `Delivery Status` pada Project. Workflow memakai dedicated `PROJECT_TOKEN`, schedule safety net, dan `dry_run`. Lihat [GITHUB_PROJECT.md](./GITHUB_PROJECT.md) untuk permission, recovery, dan backfill.

## Branch dan Pull Request

Panduan authoring template ada di [PR_TEMPLATE_GUIDE.md](./PR_TEMPLATE_GUIDE.md), sedangkan format commit ada di [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md). Perbarui guide tersebut bersama `.github/PULL_REQUEST_TEMPLATE.md` jika kontrak evidence atau merge berubah.

- Branch: `<type>/<issue-number>-<slug>`.
- Satu issue, satu branch, satu pull request.
- Conventional Commit.
- Hook `commit-msg` memakai commitlint dan hook `pre-commit` memakai Husky. Detail format ada di [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md).
- Draft PR sampai acceptance criteria dan verifikasi lengkap.
- Body mencantumkan `Closes #<issue>`.
- Gunakan **Squash and merge** saja setelah required CI lulus dan seluruh conversation selesai.
- Contributor non-owner memerlukan minimal satu approval. Repository owner boleh melakukan self-review dan merge sebagai admin tanpa approval reviewer tambahan, dengan required CI dan conversation resolution tetap wajib.
- UI: screenshot mobile/desktop serta state penting.
- Data/security: migration impact, threat/authorization note, rollback/recovery.
- Verification: affected Pest tests, lint, typecheck, accessibility/browser checks yang relevan.
- Jangan menjalankan local production build kecuali diperlukan untuk diagnosis atau diminta pengguna. CI tetap menjalankan required build/check.

## Dependency dan Handoff

`Blocked by` hanya memuat hard dependency. Pekerjaan yang bisa paralel dicatat terpisah. Handoff menyebut consumer berikutnya dan artifact yang diberikan. Issue berlabel gate berhenti pada evidence dan menunggu keputusan eksplisit.

Dependency yang sudah selesai ditulis sebagai `Prerequisite completed: #<issue>`, agar AI tidak menganggap issue masih blocked.

## Definition of Ready

- Tidak ada hard dependency terbuka.
- Issue memiliki label `ready` dan tidak memiliki status label aktif lain.
- Owning docs dan surface brief tersedia.
- Acceptance criteria dapat diuji.
- Package decision dan approval diketahui.
- Risk serta gate teridentifikasi.

## Definition of Done

- Acceptance criteria dan verification lulus.
- Test dan docs sesuai perubahan.
- Review conversation selesai.
- Required check lulus dan review requirement terpenuhi. Contributor non-owner memerlukan minimal satu approval; repository owner dapat memakai self-review admin bypass.
- Squash merge ke protected `main` menutup issue.

## AI Execution

Prosedur operasional untuk AI agent ada pada [AI_EXECUTION_GUIDE.md](./AI_EXECUTION_GUIDE.md). Guide tersebut menjelaskan source precedence, dependency audit, gate stop, loading contract, verification, handoff, dan merge policy.

## Historical Mapping

Legacy P01 sampai P69 dipertahankan sebagai metadata pada migrated issue. P01 sampai P15 ditutup sebagai historical completed. P16 ditutup sebagai superseded. P17 sampai P69 tetap open dan disesuaikan dengan current contracts. Phase file tidak dibuat kembali.
