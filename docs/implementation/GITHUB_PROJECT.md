# SATU Delivery GitHub Project

## Tujuan

`SATU Delivery` adalah operational view untuk delivery repository. GitHub Issues, milestones, labels, dan Pull Request tetap menjadi source of truth execution. Project tidak menggantikan dependency, acceptance criteria, gate, atau status issue.

## Identitas Project

- **Owner:** `Alfian57`
- **Repository:** `Alfian57/satu-platform`
- **Project number:** `3`
- **Project ID:** `PVT_kwHOBos0bc4Bff_0`
- **Visibility:** `Private`
- **URL:** [SATU Delivery](https://github.com/users/Alfian57/projects/3)
- **Linked repository:** `Alfian57/satu-platform`
- **Initial backfill:** 95 open issue, 0 open Pull Request
- **Existing Project:** `belajar` (#2) tidak disentuh

## Views

Project memakai view berikut. Layout dan filter boleh disesuaikan secara manual selama field dan source of truth tidak berubah.

| View             | Layout  | Kegunaan                                                        |
| ---------------- | ------- | --------------------------------------------------------------- |
| `Backlog`        | Table   | Daftar lengkap issue dan Pull Request dengan metadata delivery. |
| `Priority board` | Board   | Melihat item berdasarkan field `Status` dan prioritas.          |
| `Team items`     | Table   | Meninjau owner, assignee, reviewer, milestone, dan label.       |
| `Roadmap`        | Roadmap | Melihat urutan milestone dan target waktu jika tersedia.        |
| `My items`       | Table   | Fokus pada item yang ditugaskan kepada pengguna aktif.          |

## Fields

Project mempertahankan built-in field GitHub Projects seperti `Title`, `Assignees`, `Status`, `Labels`, `Linked pull requests`, `Milestone`, `Repository`, `Reviewers`, `Parent issue`, `Sub-issues progress`, `Created`, `Updated`, dan `Closed`.

Field custom yang menjadi contract automation:

| Field             | Type            | Options                                                |
| ----------------- | --------------- | ------------------------------------------------------ |
| `Delivery Status` | `SINGLE_SELECT` | `Ready`, `Blocked`, `In progress`, `In review`, `Done` |

`Status` built-in Project boleh dipakai untuk personal planning. `Delivery Status` adalah projection otomatis dari status issue dan Pull Request. Jangan mengedit `Delivery Status` secara manual sebagai pengganti label atau dependency issue.

## Source Mapping

Workflow `.github/workflows/sync-satu-project.yml` menjalankan `.github/scripts/sync-satu-project.cjs`.

| Source state                                    | `Delivery Status` |
| ----------------------------------------------- | ----------------- |
| Issue closed atau item closed                   | `Done`            |
| Issue memiliki `Blocked by` yang masih open     | `Blocked`         |
| Issue memiliki related draft Pull Request       | `In progress`     |
| Issue memiliki related ready Pull Request       | `In review`       |
| Issue open tanpa blocker dan tanpa Pull Request | `Ready`           |
| Open draft Pull Request                         | `In progress`     |
| Open ready Pull Request                         | `In review`       |

`Blocked` selalu mengalahkan status Pull Request untuk issue consumer. Parsing dependency mengikuti `sync-issue-status.cjs`, sehingga reference `Blocked by` yang malformed akan membuat run gagal dengan pesan yang dapat ditindaklanjuti. Workflow tidak menghapus atau archive item Project.

## Automation Events

Workflow berjalan pada:

- Issue `opened`, `edited`, `reopened`, `closed`, `labeled`, dan `unlabeled`.
- Pull Request `opened`, `reopened`, `ready_for_review`, `converted_to_draft`, dan `closed` melalui `pull_request_target`.
- `workflow_dispatch` dengan input `dry_run`.
- Schedule setiap jam sebagai safety net untuk event yang terlewat.

`pull_request_target` dipakai karena automation menulis ke user-owned Project. Workflow hanya checkout base repository untuk membaca helper script dan tidak menjalankan kode dari branch atau fork Pull Request.

Status label issue workflow menggunakan `GITHUB_TOKEN` dan perubahan label tidak selalu memicu event `labeled` baru. Schedule dan manual reconciliation karena itu tetap diperlukan.

## Credential dan Variables

### Repository variables

Setelah Project dibuat, variables berikut harus tetap tersedia:

```sh
gh variable set SATU_PROJECT_OWNER --repo Alfian57/satu-platform --body Alfian57
gh variable set SATU_PROJECT_NUMBER --repo Alfian57/satu-platform --body 3
```

### Repository secret

`PROJECT_TOKEN` adalah dedicated fine-grained PAT milik maintainer. Token harus dibatasi pada repository `Alfian57/satu-platform` dengan permission `Projects: Read and write`, `Metadata: Read-only`, `Issues: Read-only`, dan `Pull requests: Read-only`. Script memakai token ini untuk membaca source issue/PR dan menulis user-owned Project. Simpan melalui GitHub Settings atau:

```sh
gh secret set PROJECT_TOKEN --repo Alfian57/satu-platform
```

Perintah tersebut membaca nilai secara interaktif. Jangan menaruh token pada file, command history, issue, Pull Request, fixture, atau log. Jangan menyalin token GitHub CLI ke secret ini.

Full event reconciliation dan dry-run membutuhkan secret tersebut. Tanpa secret, workflow gagal lebih awal dengan pesan konfigurasi dan tidak melakukan mutation.

## Setup dan Backfill

Project dibuat dan open item sudah di-backfill saat issue ini dikerjakan. Untuk memeriksa keadaan saat ini:

```sh
gh project view 3 --owner Alfian57 --format json
gh project item-list 3 --owner Alfian57 --limit 200 --format json
gh project field-list 3 --owner Alfian57 --format json
```

Preview reconciliation tanpa mutation:

```sh
gh workflow run sync-satu-project.yml --repo Alfian57/satu-platform --ref main -f dry_run=true
gh run watch --repo Alfian57/satu-platform
```

Reconciliation nyata setelah secret tersedia:

```sh
gh workflow run sync-satu-project.yml --repo Alfian57/satu-platform --ref main -f dry_run=false
gh run watch --repo Alfian57/satu-platform
```

Script harus idempotent. Menjalankan workflow berkali-kali tidak boleh membuat duplicate item. Backfill tidak menambahkan closed issue yang belum pernah masuk Project, tetapi closed item yang sudah ada dipertahankan dan diberi `Done`.

## Recovery

1. Jalankan `dry_run=true` dan baca job summary.
2. Periksa `SATU_PROJECT_OWNER`, `SATU_PROJECT_NUMBER`, nama field, dan opsi field.
3. Periksa expiry dan repository restriction dedicated PAT tanpa menyalin nilainya ke log.
4. Periksa malformed `Blocked by` pada issue yang disebut di error.
5. Jalankan workflow nyata setelah root cause diperbaiki.
6. Jangan menghapus item atau membuat item manual berulang untuk mengatasi error duplicate.

Jika GitHub API mengalami rate limit, tunggu window reset lalu jalankan reconciliation schedule atau manual sekali. `concurrency` workflow mencegah dua reconciliation berjalan bersamaan.

## Development Contract

- Helper ditulis sebagai CommonJS agar dapat diuji dengan Node.js bawaan runner.
- Test berada di `.github/scripts/sync-satu-project.test.cjs` dan mencakup mapping, idempotency, dry-run, konfigurasi, dan API error.
- Action `actions/github-script@v9.0.0` dan `actions/checkout@v7.0.1` dipin ke immutable commit SHA.
- Tidak ada runtime dependency baru.
- Perubahan permission harus direview sebagai security-sensitive change.
- Pull Request wajib draft dahulu dan hanya di-merge dengan `Squash and merge` setelah required CI lulus dan conversation selesai.

## Handoff

Consumer berikutnya memakai GitHub Project untuk triage dan workload view, tetapi tetap membaca issue body untuk `Blocked by`, gate, acceptance criteria, dan handoff. Developer yang mengubah status mapping wajib memperbarui script, test, issue contract, dan bagian mapping dokumen ini dalam Pull Request yang sama.
