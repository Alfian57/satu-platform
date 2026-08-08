# Parallel Dependency Workflow SATU

## Tujuan

Dokumen ini menjelaskan cara developer dan AI agent mengerjakan issue yang memiliki dependency tanpa menggabungkan beberapa issue ke satu branch. GitHub issue, assignee, Pull Request, dan label tetap menjadi source of truth execution.

Workflow ini tidak mengubah aturan approval atau merge. Pull Request consumer tetap tidak boleh masuk ke `main` sebelum seluruh hard dependency selesai.

## Ownership Gate

Sebelum memilih issue atau membuat branch, AI agent wajib memeriksa identitas GitHub CLI dan assignee issue.

```sh
gh auth status --hostname github.com
gh api user --jq .login
gh issue view <issue-number> \
  --json state,assignees \
  --jq '{state: .state, assignees: [.assignees[].login]}'
```

Aturan ownership:

- Issue open tanpa assignee boleh diambil setelah readiness dan dependency diperiksa.
- Issue dengan satu assignee yang sama dengan login aktif boleh dikerjakan.
- Issue dengan assignee berbeda tidak boleh dikerjakan, diubah assignee-nya, atau diambil branch-nya.
- Issue dengan lebih dari satu assignee dianggap malformed dan harus dilaporkan.
- Jika `gh auth status` gagal, login aktif tidak dapat dibaca, atau repository tidak dapat diakses, agent berhenti sebelum membuat branch atau mengubah issue.

Assignee tidak boleh ditebak dari nama lokal, nama branch, atau akun default. `gh api user --jq .login` adalah identitas aktif.

## Status dan Contract Checkpoint

`Blocked by` hanya memuat hard dependency. Status issue tetap mutually exclusive.

| Status         | Makna                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `ready`        | Tidak ada hard dependency open dan belum ada Pull Request.                                                    |
| `blocked`      | Ada hard dependency open dan belum ada stacked Pull Request yang valid.                                       |
| `stacked`      | Ada hard dependency open, parent sudah `contract-ready`, dan Pull Request consumer menargetkan branch parent. |
| `in-progress`  | Tidak ada hard dependency open dan ada draft Pull Request.                                                    |
| `needs-review` | Tidak ada hard dependency open dan ada ready Pull Request.                                                    |

Label `contract-ready` bukan status dan tidak menutup issue. Parent boleh diberi label tersebut setelah checkpoint contract tersedia pada branch atau Pull Request, misalnya schema, interface, typed props, event, migration boundary, atau fixture contract yang sudah diuji. Label ini tidak boleh diberikan hanya karena pekerjaan sudah dimulai.

Label `stacked` diberikan otomatis oleh issue status sync jika seluruh metadata berikut valid:

1. Pull Request body memiliki `Closes #<consumer>`.
2. Pull Request body memiliki tepat satu `Stacked on: #<parent>`.
3. Parent tercantum pada `Blocked by` consumer.
4. Parent masih open dan memiliki label `contract-ready`.
5. Pull Request menargetkan branch selain `main`.

Jika salah satu hard dependency lain belum contract-ready, consumer tetap tidak dapat di-merge. Sisa dependency dan batas integrasi harus ditulis pada section `Handoff` Pull Request.

## Stacked Branch dan Pull Request

Branch tetap mengikuti format issue:

```text
<type>/<issue-number>-<slug>
```

Contoh alur:

```text
main
└── feature/99-recruiter-foundation
    └── feature/101-talent-entitlement
```

Langkah parent:

1. Buat branch issue parent dari `main` terbaru.
2. Buka draft Pull Request ke `main`.
3. Implementasikan dan uji contract checkpoint.
4. Dokumentasikan checkpoint pada Pull Request handoff.
5. Tambahkan label `contract-ready` pada issue parent.

Langkah consumer:

1. Jalankan ownership gate dan pastikan assignee sesuai.
2. Pastikan parent memiliki label `contract-ready`.
3. Buat branch consumer dari branch parent.
4. Buka draft Pull Request dengan base branch parent.
5. Isi metadata berikut pada Pull Request:

```text
- Closes #101
- **Stacked on:** #99
```

6. Kerjakan dan review consumer secara paralel.
7. Jangan mengubah base ke `main` atau merge sebelum semua issue pada `Blocked by` closed.
8. Jangan mengkonversi ke **Ready for review** atau meminta review sebelum parent merge dan seluruh AC terpenuhi.

Stack dibatasi maksimal tiga branch aktif termasuk root. Jika dependency lebih dalam, buat contract slice yang lebih kecil atau tunggu parent merge agar review dan rebase tetap dapat diperiksa.

## Setelah Parent Merge

SATU menggunakan **Squash and merge**. Setelah parent merge:

1. Ambil `main` terbaru.
2. Rebase commit consumer di atas `main`, sehingga perubahan parent tidak muncul sebagai perubahan consumer.
3. Push dengan `--force-with-lease` ke branch consumer.
4. Ubah base Pull Request consumer ke `main`.
5. Ubah `Stacked on` menjadi `N/A`.
6. Jalankan ulang CI dan periksa kembali seluruh review conversation.

Perubahan base atau rebase dapat membuat komentar dan approval sebelumnya stale. Re-review final tetap wajib mengikuti branch protection.

## Contoh Dependency SATU

`#100` dan `#101` adalah sibling yang sama-sama bergantung pada `#99`. Rantai serial yang benar adalah:

```text
#99 → #101 → #102 → #103 → #104
```

Setelah contract `#99` siap, developer `#101` dapat membuat stacked PR di atas branch `#99`. Issue `#100` juga dapat mulai ketika contract parent yang dipakainya siap, tetapi dependency `#86` tetap menjadi merge gate jika belum selesai.

## Status Automation

`.github/scripts/sync-issue-status.cjs` membaca seluruh open Pull Request, bukan hanya Pull Request dengan base `main`. Perubahan contract label, base branch, dan commit Pull Request memicu reconciliation.

`.github/scripts/sync-satu-project.cjs` memetakan status issue `stacked` ke `Delivery Status: In progress`. Tidak ada option Project baru.

Jalankan dry run sebelum reconciliation manual:

```sh
gh workflow run sync-issue-status.yml --repo Alfian57/satu-platform --ref main -f dry_run=true
gh workflow run sync-satu-project.yml --repo Alfian57/satu-platform --ref main -f dry_run=true
```

## Assignment dan Handoff

GitHub Assignees adalah source of truth assignment. Project `Team items` dan `My items` digunakan untuk melihat workload, tetapi tidak menggantikan assignee pada issue.

Setiap handoff harus menyebut:

- artifact contract yang tersedia;
- parent atau consumer berikutnya;
- dependency yang masih open;
- gate yang masih menunggu keputusan;
- test dan CI evidence yang sudah lulus.

AI agent tidak boleh memindahkan assignment untuk mengatasi blocker. Ownership conflict harus dilaporkan kepada project owner.
