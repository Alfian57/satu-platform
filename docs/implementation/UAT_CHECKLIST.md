# UAT Checklist dan Release Rehearsal SATU

Dokumen ini adalah checklist final UAT untuk Increment 1 (Milestone M9 Production Readiness dan UAT). Checklist mencatat acceptance criteria issue #70 [P69] dan evidence verifikasi. Item yang memerlukan environment production/operator diisi oleh human operator dan ditandatangani.

## 1. Acceptance Criteria Coverage

| AC  | Deskripsi                                                                                                                                                                                                                                      | Status             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| AC1 | Fresh deploy rehearsal, migrations, seed, full automated suite, production build, critical browser flows, Reverb two-client flow, backup/restore evidence, accessibility/security checklist, documentation review, user acceptance walkthrough | Lihat bagian 2     |
| AC2 | Semua Increment 1 acceptance dan production release gates lulus; known residual risks diterima eksplisit; release dapat diulang dari runbook                                                                                                   | Lihat bagian 3     |
| AC3 | Implementasi dilindungi Policy/tenant boundary dan programmatic tests sesuai current contract                                                                                                                                                  | Lulus (full suite) |

## 2. Evidence Verifikasi

### 2.1 Full automated suite

| Check                    | Command                                          | Result                                  |
| ------------------------ | ------------------------------------------------ | --------------------------------------- |
| Pest feature + browser   | `composer test` / `php artisan test`             | Lulus: 1048 passed, 5 skipped, 0 failed |
| Static analysis          | `vendor/bin/phpstan analyse --memory-limit=1G`   | 0 errors                                |
| Formatting PHP           | `vendor/bin/pint --test`                         | Pass                                    |
| Frontend lint            | `npm run lint:check`                             | Pass                                    |
| Frontend format          | `npm run format:check`                           | Pass                                    |
| Typecheck                | `php artisan wayfinder:generate && tsc --noEmit` | Pass                                    |
| Node test (issue-status) | `npm run test:issue-status`                      | Pass                                    |
| Node test (satu-project) | `npm run test:satu-project`                      | Pass                                    |

### 2.2 Production build

| Check                 | Command         | Result                                        |
| --------------------- | --------------- | --------------------------------------------- |
| Vite production build | `npm run build` | Lulus (built in 2m27s, manifest + 129 assets) |

### 2.3 Migrations dan seed smoke

| Check           | Command                                    | Result                                                  |
| --------------- | ------------------------------------------ | ------------------------------------------------------- |
| Migration smoke | `php artisan migrate:fresh --seed --force` | Lulus, semua migration applied, seed berhasil           |
| App boots       | `php artisan about`                        | DB/session/queue/cache pada driver database, 113 routes |

Catatan: `DatabaseSeeder` scaffold menggunakan username tetap `testuser` sehingga `db:seed` tidak idempotent. Gunakan `migrate:fresh --seed` untuk clean smoke, bukan `db:seed` saja pada DB yang sudah ter-seed.

### 2.4 Reverb two-client flow

| Check                  | Test                                                                                                              | Result      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| Channel authorization  | `tests/Feature/Workspace/WorkspaceRealtimeTest.php`                                                               | Lulus (5/5) |
| Two-client convergence | `tests/Browser/ProjectWorkspaceBrowserTest.php` (two browser clients converge on the database workspace snapshot) | Lulus di CI |

### 2.5 Backup/restore drill

| Check                                 | Result                                             |
| ------------------------------------- | -------------------------------------------------- |
| Database backup (SQLite-native drill) | Backup 1.0M dibuat, SHA-256 checksum verified      |
| Restore ke fresh DB                   | Integrity check OK, data sama (1 user, 76 tables)  |
| Storage backup                        | `storage/app/private` di-tar.gz, checksum verified |

Catatan: Production menggunakan MySQL dan `scripts/backup.sh` (mysqldump). Drill di atas memakai SQLite karena environment local. Untuk production, jalankan `./scripts/backup.sh production` dengan env MySQL.

### 2.6 Accessibility dan security checklist

| Check                                               | Result                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| Browser a11y checks (`assertNoAccessibilityIssues`) | Lulus di seluruh browser tests                                              |
| Fix kontras dialog (WCAG AA)                        | `DialogTitle` kini `text-foreground` (memperbaiki `LeaderboardBrowserTest`) |
| Cross-tenant denial matrix                          | Lulus (TalentPrivacyTenancyQualityGateTest)                                 |
| Forbidden-field serialization                       | Lulus (RecruiterSafeCandidateSerializer)                                    |

## 3. Known Residual Risks

| Risk                                                                                                                                               | Owner  | Keputusan                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `docker-build` job gagal karena pinned action SHA tidak valid (`build-push-action@5176d81`, `login-action@5e57cd1`, `setup-buildx-action@e468171`) | devops | Diperbaiki: pin ke SHA valid (v6/v3). Perlu verifikasi CI setelah merge. |

## 4. Signed UAT Sign-off

Checklist final UAT memerlukan sign-off human operator untuk environment production:

- [ ] Fresh deploy rehearsal di environment staging/production (MySQL)
- [ ] Backup/restore drill production (`scripts/backup.sh production`)
- [ ] Reverb two-client flow production
- [ ] User acceptance walkthrough dengan data produksi
- [ ] Approval final visual reference (GATE-005)

| Peran            | Nama | Tanda tangan | Tanggal |
| ---------------- | ---- | ------------ | ------- |
| Product owner    |      |              |         |
| QA               |      |              |         |
| Security/privacy |      |              |         |
