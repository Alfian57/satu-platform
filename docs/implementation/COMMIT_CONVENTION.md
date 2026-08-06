# Conventional Commits SATU

## Tujuan

SATU memakai Conventional Commits agar history mudah dicari, release note dapat dihasilkan, dan perubahan dapat dikaitkan dengan issue secara konsisten. Format ini berlaku untuk commit lokal, Pull Request, dan squash commit ke `main`.

## Library/Package

- [`husky`](https://typicode.github.io/husky/) `^9.1.7` mengelola lifecycle Git hooks.
- [`@commitlint/cli`](https://commitlint.js.org/) `^21.2.1` menjalankan validator commit message.
- [`@commitlint/config-conventional`](https://commitlint.js.org/) `^21.2.0` menyediakan ruleset Conventional Commits.

Install command:

```sh
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
```

Package tersebut adalah `devDependencies` karena enforcement berjalan saat development dan CI repository, bukan pada runtime production.

## Format

```text
<type>[optional scope]: <imperative description>
```

Contoh:

```text
feat(identity): add verified phone challenge
fix(onboarding): preserve recovery focus after validation
docs(workflow): add PR template authoring guide
test(membership): cover suspended affiliation denial
```

Gunakan subject singkat, imperative, tanpa titik penutup, dan jangan menyertakan secret atau data pribadi.

## Type yang Diizinkan

- `build`: perubahan build system atau dependency tooling.
- `chore`: maintenance yang tidak mengubah product behavior.
- `ci`: perubahan GitHub Actions atau pipeline.
- `docs`: perubahan dokumentasi atau template.
- `feat`: capability baru.
- `fix`: perbaikan defect.
- `perf`: peningkatan performance.
- `refactor`: perubahan struktur tanpa perubahan behavior.
- `revert`: membatalkan commit sebelumnya.
- `style`: perubahan formatting atau style tanpa behavior.
- `test`: penambahan atau perubahan test.

Scope bersifat optional. Gunakan area yang jelas seperti `identity`, `onboarding`, `workflow`, atau `ci`.

## Issue dan Pull Request

- Satu issue, satu branch, satu Pull Request.
- Gunakan branch `<type>/<issue-number>-<slug>`.
- Body Pull Request mencantumkan `Closes #<issue>`.
- Satu Pull Request boleh memiliki beberapa commit selama setiap commit valid. Merge ke `main` selalu menggunakan **Squash and merge**.
- Deskripsi Pull Request mengikuti [PR template guide](./PR_TEMPLATE_GUIDE.md).

## Enforcement

- `.husky/commit-msg` menjalankan `commitlint` dengan `@commitlint/config-conventional`.
- `.husky/pre-commit` menjalankan format check, ESLint, TypeScript check, dan `git diff --cached --check`.
- Required CI tetap menjadi verifikasi final. Hook lokal tidak menggantikan test, review, atau branch protection.
- Jika hook sengaja dilewati untuk diagnosis, jangan gunakan hasil tersebut sebagai evidence dan jelaskan alasannya pada Pull Request.

## Squash Merge Message Convention

GitHub squash merge menghasilkan commit message otomatis dari PR title, body `Closes #<issue>`, dan nomor PR:

```text
<PR title> (#<issue-number>) (#<PR-number>)
```

Contoh hasil yang **salah**:

```text
feat(ux): shape WhatsApp auth, onboarding, and notifications (#78) (#128)
```

Format yang menghasilkan double parentheses `(#issue) (#pr)` tidak konsisten dengan commit convention SATU yang hanya menggunakan satu reference issue.

### Aturan

1. **PR title** wajib mengikuti format Conventional Commit TANPA menyertakan issue number di subject:

    ```text
    feat(ux): shape WhatsApp auth, onboarding, and notifications
    ```

2. **Body PR** wajib mencantumkan `Closes #<issue>`.

3. **Commit hasil squash merge di main** hanya memuat satu reference:

    ```text
    feat(ux): shape WhatsApp auth, onboarding, and notifications (#78)
    ```

4. Gunakan `gh pr merge <number> --squash --admin` atau API merge dengan merge method `squash`. Jangan menggunakan merge commit atau rebase merge pada main.

5. Jika double parenthetical `(#issue) (#pr)` terjadi di main:
    - Gunakan `git rebase -i HEAD~<n>` dengan perintah `reword` untuk memperbaiki commit message.
    - Jangan menggunakan cherry-pick berurutan karena akan memicu hook pre-commit pada setiap cherry-pick, menyebabkan timeout atau kegagalan.
    - Setelah rebase selesai, force push ke main setelah branch protection dibuka sementara.
    - Restore branch protection segera setelah push berhasil.

### Prosedur Force Push Main untuk Fix Commit Message

Force push ke main hanya diizinkan untuk memperbaiki commit message squash merge, bukan untuk perubahan kode atau revert. Ikuti prosedur berikut:

1. Baca branch protection: `gh api /repos/:owner/:repo/branches/main/protection`
2. Set `allow_force_pushes: true` menggunakan `PUT` endpoint yang sama dengan seluruh konfigurasi eksisting.
3. Perbaiki commit message, lalu `git push --force-with-lease origin main`.
4. Segera restore `allow_force_pushes: false` melalui `PUT` endpoint yang sama.

Jangan membiarkan `allow_force_pushes: true` lebih dari beberapa detik. Setiap force push ke main harus dicatat sebagai komentar issue dan dilaporkan di Pull Request terkait.

## Mengubah Policy

Jika type, format, hook, atau check berubah, perbarui file berikut dalam Pull Request yang sama:

1. `commitlint.config.mjs`.
2. `.husky/commit-msg` atau `.husky/pre-commit`.
3. `package.json` dan `package-lock.json` bila dependency berubah.
4. Dokumen ini dan [PR template guide](./PR_TEMPLATE_GUIDE.md).

Jalankan check dokumentasi, test yang relevan, dan `git diff --check` sebelum merge.
