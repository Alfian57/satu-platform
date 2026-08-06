# AI Execution Guide SATU

## Tujuan

Dokumen ini adalah operating guide untuk AI agent yang mengerjakan SATU. Dokumen ini mengatur urutan pemeriksaan dan delivery evidence. Product truth tetap berada pada `PRODUCT.md`, PRD, DESIGN, UX, engineering, security, governance, dan selected GitHub issue sesuai source precedence.

`AGENTS.md` dan `START_HERE.md` tetap menjadi entry instruction. Guide ini tidak boleh dipakai untuk mengubah product boundary atau menutup governance gate melalui asumsi.
Panduan dependency paralel dan ownership gate ada pada [DEPENDENCY_WORKFLOW.md](./DEPENDENCY_WORKFLOW.md).

## Boot Sequence

1. Baca `AGENTS.md` secara lengkap.
2. Baca `START_HERE.md`.
3. Jalankan `gh auth status --hostname github.com`.
4. Baca login aktif dengan `gh api user --jq .login` tanpa menyalin token ke output, issue, Pull Request, atau log.
5. Baca assignee issue yang dipilih. Issue tanpa assignee boleh diambil. Issue dengan assignee yang sama dengan login aktif boleh dikerjakan. Issue dengan assignee berbeda atau lebih dari satu harus dihentikan dan dilaporkan.
6. Baca issue yang dipilih secara lengkap, termasuk labels, milestone, `Blocked by`, gate, Library/Package, References, Acceptance Criteria, dan Handoff.
7. Baca hanya dokumen yang ditautkan oleh selected issue, selain dokumen entry yang diwajibkan di atas.
8. Periksa runtime dan test yang benar-benar tersedia sebelum menyebut capability sebagai implemented.
9. Catat ambiguity atau konflik pada issue comment dan berhenti jika keputusan product, human, external, atau ownership diperlukan.

## Memilih Issue

Gunakan GitHub CLI untuk menemukan kandidat:

```sh
gh issue list --state open --label ready --limit 50
gh issue view <issue-number> --json title,body,labels,milestone,state,assignees,url
```

Issue hanya boleh dipilih jika:

- berstatus open dan memiliki label `ready`, atau memiliki status `stacked` yang mengikuti [DEPENDENCY_WORKFLOW.md](./DEPENDENCY_WORKFLOW.md);
- jika berstatus `ready`, tidak memiliki `Blocked by` yang masih open;
- jika berstatus `stacked`, parent pada `Stacked on` memiliki label `contract-ready` dan Pull Request menargetkan branch parent;
- References, surface brief, acceptance criteria, package decision, dan verification tersedia;
- milestone serta owner role dapat diidentifikasi.

Label status bersifat mutually exclusive:

| Label          | Arti                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------- |
| `ready`        | Issue open tanpa hard dependency open dan siap diambil.                                       |
| `blocked`      | Issue memiliki minimal satu hard dependency open.                                             |
| `stacked`      | Issue memiliki hard dependency open tetapi dikerjakan pada branch parent yang contract-ready. |
| `in-progress`  | Ada active draft Pull Request atau status manual pekerjaan sedang berjalan.                   |
| `needs-review` | Ada open Pull Request yang sudah siap direview atau menunggu gate/review.                     |

`gate:human`, `gate:external`, dan `gate:conditional` menjelaskan approval atau kondisi hasil issue. Gate tidak otomatis membuat issue `blocked` jika issue tersebut sendiri tidak memiliki hard dependency open.

## Automatic Status Sync

Workflow [sync-issue-status.yml](../../.github/workflows/sync-issue-status.yml) melakukan reconciliation pada event issue `opened`, `edited`, `closed`, `reopened`, `labeled`, dan `unlabeled`, serta Pull Request `opened`, `reopened`, `edited`, `synchronize`, `ready_for_review`, `converted_to_draft`, dan `closed`. Workflow juga dapat dijalankan manual dengan `workflow_dispatch`.

Automation membaca seluruh issue open dan seluruh open Pull Request, lalu mempertahankan label non-status dan mengganti tepat satu status label. `blocked` tetap dipakai jika hard dependency open tanpa stacked PR valid. `stacked` dipakai jika Pull Request memiliki `Stacked on`, parent contract-ready, dan base branch bukan `main`. Setelah seluruh blocker closed, status diturunkan dari Pull Request terkait: ready PR menjadi `needs-review`, draft PR menjadi `in-progress`, dan tanpa open PR menjadi `ready`.

Gunakan dry run sebelum menulis label ketika melakukan reconciliation manual:

```sh
gh workflow run sync-issue-status.yml --ref main -f dry_run=true
gh workflow run sync-issue-status.yml --ref main -f dry_run=false
```

Workflow memakai `issues: write`, `pull-requests: read`, dan `contents: read`. Jika workflow gagal, periksa job summary, perbaiki body dependency yang malformed, lalu jalankan ulang manual. Workflow tidak membuat komentar untuk setiap perubahan label.

## GitHub Project Delivery View

Operational triage tersedia pada [GITHUB_PROJECT.md](./GITHUB_PROJECT.md) melalui Project privat `SATU Delivery`. GitHub Project hanya projection delivery. AI tetap membaca issue body, label status, milestone, acceptance criteria, gate, dan Pull Request sebagai execution source of truth. Field `Delivery Status` direkonsiliasi oleh [`sync-satu-project.yml`](../../.github/workflows/sync-satu-project.yml) dan tidak boleh dipakai untuk mengabaikan `Blocked by`.
Status issue `stacked` diproyeksikan sebagai `In progress` pada `Delivery Status`; status Project tidak menggantikan pemeriksaan assignee, contract-ready, atau dependency.

Automation Project memakai dedicated repository secret `PROJECT_TOKEN` dengan `Projects: Read and write`, `Metadata: Read-only`, `Issues: Read-only`, dan `Pull requests: Read-only` pada repository SATU. Jangan menyalin token CLI. Gunakan `dry_run=true` sebelum mutation, dan gunakan schedule safety net karena perubahan label oleh workflow tidak selalu menghasilkan event baru.

## Dependency dan Scope

- Baca hanya satu issue per branch dan Pull Request.
- Interpretasikan `Blocked by` berdasarkan state target di GitHub, bukan teks saja.
- Dependency yang sudah selesai ditulis sebagai `Prerequisite completed: #<issue>`, bukan `Blocked by`.
- Jangan mengerjakan issue consumer sebelum semua hard dependency open selesai, kecuali issue memiliki stacked PR valid sesuai [DEPENDENCY_WORKFLOW.md](./DEPENDENCY_WORKFLOW.md).
- Pekerjaan yang dapat paralel harus dicatat pada `Dapat paralel dengan`, bukan dimasukkan ke blocker.
- Jangan memberi label `contract-ready` berdasarkan asumsi. Parent harus memiliki checkpoint contract yang dapat diperiksa.
- Jangan mengubah assignee untuk mengatasi ownership conflict atau blocker.
- Jangan melakukan cleanup pada issue lain kecuali issue yang dipilih secara eksplisit memintanya.

## Source Precedence

Jika ada konflik, gunakan urutan berikut:

1. `PRODUCT.md`
2. `docs/product/PRD.md`
3. `DESIGN.md`
4. `docs/ux/` dan matching surface brief
5. `docs/engineering/`
6. Selected issue, roadmap, dan test strategy
7. `docs/governance/DECISIONS.md`
8. `docs/reference/proposal_lomba.md` sebagai historical input

Perbarui owning source melalui Pull Request. Jangan menyelesaikan konflik dengan menambal behavior secara diam-diam.

## Implementasi

- Buat branch `<type>/<issue-number>-<slug>` dari `main` terbaru, atau dari branch parent untuk issue `stacked`.
- Gunakan mature library yang sudah disetujui pada bagian `Library/Package` issue. Jangan menambah dependency tanpa approval dan compatibility/license review.
- Gunakan named Laravel routes dan Wayfinder pada frontend. Jangan hardcode backend URL.
- Untuk UI, baca `PRODUCT.md`, PRD, `DESIGN.md`, `SCREEN_INVENTORY.md`, `CONTENT_ACCESSIBILITY.md`, dan surface brief sebelum mengubah code.
- Gunakan existing `Skeleton` component dan ikuti `docs/ux/LOADING_STATES.md` untuk setiap loading region frontend.
- Bedakan loading, empty, processing, error, forbidden, stale, reconnect, dan partial-data state.
- Planned capability, synthetic data, sandbox, dan production data harus disebut secara truthful.

## Verification

Jalankan verification paling sempit terlebih dahulu, lalu check yang diperlukan oleh scope:

- Pest feature test untuk route, Action, Policy, Job, Notification, dan integration boundary.
- Unit test untuk pure calculation, ranking, normalization, dan policy version.
- Browser test untuk critical flow, keyboard, accessibility, responsive, loading transition, dan reconnect.
- Frontend `npm run lint:check` serta `npm run types:check` bila frontend berubah.
- PHP formatting dan static checks bila PHP berubah.
- Documentation Prettier, internal-link review, surface-brief resolution, Unicode em dash check, dan `git diff --check` bila docs berubah.

Production build hanya dijalankan jika diminta pengguna atau diperlukan untuk diagnosis Vite. Required CI tetap menjadi verification final.

## Gate Stop

Berhenti dan tampilkan evidence ketika issue memiliki `gate:human`, `gate:external`, atau `gate:conditional` yang belum diputuskan. Jangan menandai gate selesai berdasarkan implementasi atau asumsi agent. Catat keputusan eksplisit pada issue dan owning document melalui Pull Request.

## Pull Request dan Merge

- Buka Pull Request sebagai draft sampai acceptance criteria dan verification lengkap.
- Body Pull Request wajib mencantumkan `Closes #<issue>`.
- Pull Request stacked wajib mencantumkan `Stacked on: #<parent>` dan base branch parent.
- Sertakan command, hasil test, screenshot/recording UI, migration/security/recovery note, dan handoff.
- Ubah status issue menjadi `in-progress` saat pekerjaan branch-only dimulai. Setelah Pull Request dibuat, automation menurunkan `in-progress` atau `needs-review` dari draft state dan review readiness.
- `main` hanya menerima **Squash and merge** setelah required CI `ci` lulus dan seluruh conversation selesai.
- Contributor non-owner memerlukan minimal satu approval. Repository owner dapat memakai self-review dan admin merge tanpa approval reviewer tambahan, tetapi tidak boleh melewati required CI atau conversation resolution.

## Handoff dan Completion

Sebelum menyatakan selesai, pastikan:

1. Semua Acceptance Criteria dan Verification issue terpenuhi.
2. Test evidence dapat diperiksa dan tidak mengandung secret atau data pribadi.
3. Owning docs, surface brief, dan issue body sudah konsisten.
4. Pull Request linked, conversation resolved, dan required CI lulus.
5. Handoff berikutnya menyebut consumer, artifact, dependency, dan gate yang masih terbuka.
6. Issue ditutup oleh merge Pull Request, bukan dengan asumsi atau komentar tanpa evidence.

## Larangan

- Jangan membuat progress file atau phase file baru.
- Jangan menyatakan planned capability sebagai runtime capability.
- Jangan menganalisis message content untuk sentiment atau diagnosis.
- Jangan mengekspos inclusion signal kepada student, teammate, atau recruiter.
- Jangan menulis secret, token, private phone, NIM, provider payload, atau private evidence pada issue, Pull Request, log, fixture, atau screenshot.
