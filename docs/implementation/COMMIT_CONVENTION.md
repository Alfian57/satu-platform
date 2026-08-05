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

## Mengubah Policy

Jika type, format, hook, atau check berubah, perbarui file berikut dalam Pull Request yang sama:

1. `commitlint.config.mjs`.
2. `.husky/commit-msg` atau `.husky/pre-commit`.
3. `package.json` dan `package-lock.json` bila dependency berubah.
4. Dokumen ini dan [PR template guide](./PR_TEMPLATE_GUIDE.md).

Jalankan check dokumentasi, test yang relevan, dan `git diff --check` sebelum merge.
