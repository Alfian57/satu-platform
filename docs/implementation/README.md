# Implementation Workflow: SATU

## Source of Truth

GitHub issues menyimpan atomic task, status, dependencies, owner role, gate, acceptance criteria, dan handoff. GitHub milestones menyimpan release sequence. Pull request menyimpan implementation evidence. Dokumen ini mendefinisikan workflow, bukan progress.

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

Issue UI juga menunjuk surface brief. Issue yang membutuhkan library menyebut exact package, install command, reason, compatibility, license review, dan fake/test strategy. Jika framework-native cukup, jelaskan alasannya.

## Labels

- Type: `type:feature`, `type:ux`, `type:quality`, `type:documentation`, `type:governance`, `type:infrastructure`.
- Area: `area:identity`, `area:tenancy`, `area:profile`, `area:project`, `area:matching`, `area:workspace`, `area:contribution`, `area:portfolio`, `area:gamification`, `area:campus`, `area:inclusion`, `area:talent`, `area:integration`, `area:notification`, `area:platform`.
- Owner: `owner:backend`, `owner:frontend`, `owner:fullstack`, `owner:qa`, `owner:devops`, `owner:product-design`, `owner:security-privacy`.
- Priority: `priority:p0` sampai `priority:p3`.
- Gate: `gate:human`, `gate:external`, `gate:conditional`.
- State helpers: `historical`, `superseded`, `blocked`, `ready`.

Owner label menunjukkan accountable role. GitHub assignee belum dipakai sampai komposisi developer final.

## Branch dan Pull Request

Panduan authoring template ada di [PR_TEMPLATE_GUIDE.md](./PR_TEMPLATE_GUIDE.md). Perbarui guide tersebut bersama `.github/PULL_REQUEST_TEMPLATE.md` jika kontrak evidence atau merge berubah.

- Branch: `<type>/<issue-number>-<slug>`.
- Satu issue, satu branch, satu pull request.
- Conventional Commit.
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

## Definition of Ready

- Tidak ada hard dependency terbuka.
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

## Historical Mapping

Legacy P01 sampai P69 dipertahankan sebagai metadata pada migrated issue. P01 sampai P15 ditutup sebagai historical completed. P16 ditutup sebagai superseded. P17 sampai P69 tetap open dan disesuaikan dengan current contracts. Phase file tidak dibuat kembali.
