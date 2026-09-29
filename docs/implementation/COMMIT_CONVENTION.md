# Conventional Commits SATU

SATU memakai Conventional Commits agar riwayat perubahan mudah dicari dan release note dapat dihasilkan.

## Library/Package

- [`husky`](https://typicode.github.io/husky/) `^9.1.7` mengelola lifecycle Git hooks.
- [`@commitlint/cli`](https://commitlint.js.org/) `^21.2.1` menjalankan validator commit message.
- [`@commitlint/config-conventional`](https://commitlint.js.org/) `^21.2.0` menyediakan ruleset Conventional Commits.

Package tersebut adalah `devDependencies` karena enforcement berjalan saat development dan CI repository, bukan pada runtime production.

## Format

```text
<type>[optional scope]: <imperative description>
```

Contoh:

```text
feat(identity): add verified phone challenge
fix(onboarding): preserve recovery focus after validation
docs(readme): clarify setup steps
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

Scope bersifat optional. Gunakan area yang jelas seperti `identity`, `onboarding`, atau `ci`.

## Enforcement

- `.husky/commit-msg` menjalankan `commitlint` dengan `@commitlint/config-conventional`.
- `.husky/pre-commit` menjalankan format check, ESLint, TypeScript check, dan `git diff --cached --check`.
- Required CI adalah verifikasi repository pada perubahan yang masuk ke `main`.
- Jika hook dilewati untuk diagnosis, jangan jadikan hasil tersebut sebagai bukti bahwa pemeriksaan lulus.

## Mengubah Policy

Jika type, format, hook, atau check berubah, perbarui file yang terkait:

1. `commitlint.config.mjs`.
2. `.husky/commit-msg` atau `.husky/pre-commit`.
3. `package.json` dan `package-lock.json` bila dependency berubah.
4. Dokumen ini.

Jalankan pemeriksaan dokumentasi dan `git diff --check` sebelum menyelesaikan perubahan policy.
