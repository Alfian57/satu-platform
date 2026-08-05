# Panduan Pull Request Template SATU

## Tujuan

Dokumen ini menjelaskan cara membuat atau mengubah Pull Request template SATU secara konsisten. Template harus membantu reviewer memeriksa outcome, evidence, risiko, recovery, dan handoff tanpa menganggap planned capability sebagai fitur yang sudah tersedia.

Source of truth untuk form Pull Request adalah [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md). Dokumen ini menjadi kontrak authoring dan review, sedangkan template menjadi form yang diisi developer.

## Kontrak Section

Jangan menghapus atau mengganti urutan section berikut tanpa memperbarui dokumen ini dan meminta review owner workflow.

| Section                        | Isi minimum                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `Ringkasan`                    | Outcome, alasan perubahan, dan batasan yang terlihat reviewer.                                                    |
| `Issue`                        | `Closes #<issue>` untuk satu issue yang dikerjakan.                                                               |
| `Perubahan`                    | Daftar perubahan nyata pada code, konfigurasi, data, atau dokumentasi.                                            |
| `Verifikasi`                   | Test dan check yang dijalankan beserta hasilnya.                                                                  |
| `UI Evidence`                  | Screenshot atau rekaman mobile/desktop dan state penting. Tulis `N/A` bila non-UI.                                |
| `Data, Security, dan Recovery` | Migration, tenant/Policy, sensitive projection, provider, rollback, dan recovery. Tulis `N/A` bila tidak relevan. |
| `Handoff`                      | Dependency yang terbuka, gate, follow-up issue, dan consumer berikutnya.                                          |
| `Merge Readiness`              | Required CI, conversation resolution, approval, dan metode merge.                                                 |

Product context ditulis dalam bahasa Indonesia. Technical term tetap menggunakan nama canonical seperti `Pest`, `Policy`, `Wayfinder`, `required CI`, dan **Squash and merge**.

## Aturan Pengisian

- Satu issue, satu branch, satu Pull Request.
- Gunakan branch `<type>/<issue-number>-<slug>` dari `main` terbaru.
- Gunakan Conventional Commit dan isi `Closes #<issue>`.
- Buka Pull Request sebagai draft sampai acceptance criteria dan verification lengkap.
- Nyatakan perubahan yang belum dilakukan sebagai handoff atau out of scope, bukan sebagai implemented capability.
- Sertakan evidence yang dapat diperiksa. Jangan menulis klaim seperti "sudah diuji" tanpa nama command, suite, atau link CI.
- Jangan memasukkan password, token, phone, NIM, private evidence, atau provider payload ke body atau screenshot.
- Jangan gunakan Unicode em dash pada template atau dokumentasi first-party.

## Verification Matrix

Pilih check sesuai scope Pull Request.

| Scope                       | Evidence minimum                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Laravel/PHP                 | Affected Pest test, `vendor/bin/pint --dirty --format agent`, dan static check yang relevan.                                |
| React/Inertia               | Affected browser or component flow, `npm run lint:check`, dan `npm run types:check`. Gunakan Wayfinder untuk route backend. |
| UI/UX                       | Keyboard/focus, responsive state, reduced motion, accessibility, dan screenshot atau recording.                             |
| Documentation/configuration | Prettier pada changed Markdown/YAML, internal-link review, surface-brief resolution, dan `git diff --check`.                |
| Security/data/provider      | Authorization atau tenant test, sensitive projection review, migration impact, rollback, dan recovery note.                 |

Jalankan narrowest affected test terlebih dahulu. Production build dijalankan oleh CI, atau lokal hanya jika diperlukan untuk diagnosis Vite atau diminta pengguna.

## Merge Readiness

`main` hanya menerima **Squash and merge** setelah:

1. Required check `ci` lulus.
2. Seluruh conversation selesai.
3. Contributor non-owner memiliki minimal satu approval.
4. Repository owner mencatat self-review. Owner dapat memakai admin bypass tanpa approval reviewer tambahan, tetapi required CI dan conversation resolution tetap wajib.

Force-push dan branch deletion pada `main` dilarang oleh branch protection. Jangan menggunakan merge commit, rebase merge, atau bypass untuk mengabaikan required CI.

## Prosedur Mengubah Template

1. Perbarui [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md) dan section terkait pada dokumen ini secara bersamaan.
2. Perbarui [workflow implementation](./README.md) atau [START_HERE.md](../../START_HERE.md) jika aturan delivery berubah.
3. Jalankan verification matrix yang terdampak dan `git diff --check`.
4. Buat Pull Request draft yang menautkan issue governance terkait dan jelaskan migration kontrak template.
5. Setelah review, gunakan **Squash and merge** ke `main` dan verifikasi ulang branch protection.

## Handoff untuk AI Agent

AI agent harus membaca dokumen ini sebelum membuat atau mengubah PR template. Jika template, branch protection, required check, atau metode merge tidak sesuai dokumen ini, agent harus memperbarui owning document dalam Pull Request yang sama dan tidak menganggap pekerjaan selesai sebelum CI serta conversation resolution lulus.
