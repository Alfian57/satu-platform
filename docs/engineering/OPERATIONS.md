# Operations, Deployment, dan Runbook SATU

## 1. Tujuan

Dokumen ini menetapkan kontrak runtime production SATU: environment contract, topologi proses, storage privat, mail, scheduler, secrets, health checks, startup ordering, graceful restart, serta runbook deploy dan recovery. Operator dapat memulai, memverifikasi, dan merestart seluruh service tanpa implicit knowledge. Dokumen ini hanya memuat kontrak yang sudah didukung oleh implementasi saat ini. Capability yang masih planned tidak dideskripsikan sebagai available.

### 1.1 Referensi Dokumen Lain

- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) - Procedures backup, restore, monitoring, dan incident response
- [SECURITY_PRIVACY.md](./SECURITY_PRIVACY.md) - Security, privacy, dan release gates
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture dan data flow

## 2. Environment Contract

### 2.1 Required Variables

Sebelum start, pastikan variabel berikut terdefinisi. Laravel gagal cepat (fail fast) ketika `APP_KEY` kosong pada production.

| Variabel                                                          | Nilai production                         | Keterangan                                               |
| ----------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `APP_ENV`                                                         | `production`                             | Mode runtime; menonaktifkan debug                        |
| `APP_KEY`                                                         | random 32-byte base64                    | `php artisan key:generate`; wajib konsisten antar proses |
| `APP_URL`                                                         | `https://<domain>`                       | Basis URL absolut, termasuk scheme                       |
| `APP_DEBUG`                                                       | `false`                                  | Jangan ekspos stack trace                                |
| `DB_CONNECTION`                                                   | `mysql`                                  | Target production adalah MySQL                           |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | valid                                    | Koneksi MySQL                                            |
| `QUEUE_CONNECTION`                                                | `database` atau `redis`                  | Driver antrean production                                |
| `CACHE_STORE`                                                     | `database` atau `redis`                  | Cache terdistribusi                                      |
| `SESSION_DRIVER`                                                  | `database` atau `redis`                  | Session terbagi antar instance                           |
| `BROADCAST_CONNECTION`                                            | `reverb`                                 | Realtime delivery                                        |
| `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`            | random unique                            | Kredensial aplikasi Reverb                               |
| `REVERB_HOST`, `REVERB_PORT`, `REVERB_SCHEME`                     | valid                                    | Alamat publik yang dihubungi klien                       |
| `REVERB_ALLOWED_ORIGINS`                                          | `app.example.com`                        | Daftar host origin Reverb, dipisahkan koma               |
| `FILESYSTEM_DISK`                                                 | `local` atau `s3`                        | Disk default untuk storage privat                        |
| `MAIL_MAILER`                                                     | `log` default; `smtp` bila dikonfigurasi | Driver mail                                              |

### 2.2 Secrets

- `APP_KEY`, `REVERB_APP_SECRET`, `DB_PASSWORD`, `MAIL_PASSWORD`, dan kredensial provider disimpan sebagai server secret, bukan di repository, `.env`, atau log.
- Dilarang me-log OTP, password, token, full phone, full NIM, message body, private evidence URL, inclusion detail, atau provider raw payload.
- Gunakan kredensial terpisah antara environment (local, staging, production).
- `REVERB_ALLOWED_ORIGINS` hanya berisi host origin yang sah, tanpa scheme atau port. Jika tidak diisi, konfigurasi memakai host dari `APP_URL`.

### 2.3 Fail Fast pada Missing Environment

- `config:cache` memvalidasi struktur config; missing env menghasilkan config kosong atau exception saat akses.
- Verifikasi menguji bahwa aplikasi production menolak berjalan tanpa `APP_KEY`.
- Operator wajib menjalankan `php artisan about` sebelum traffic untuk memastikan driver aktif sesuai kontrak.

## 3. Proses Topology

SATU dijalankan sebagai beberapa proses yang berbagi satu MySQL dan (jika dipakai) satu cache/session store.

| Proses        | Perintah                                             | Catatan                                                                   |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Web / PHP-FPM | PHP-FPM + Nginx atau Laravel Octane                  | Melayani HTTP dan Inertia pages                                           |
| Queue worker  | `php artisan queue:work`                             | Memproses jobs (Fonnte outbox, sync, dsb.)                                |
| Scheduler     | `php artisan schedule:work` atau cron `schedule:run` | Menjalankan `message:dispatch-due` dan `integration:alert-sync-anomalies` |
| Reverb server | `php artisan reverb:start`                           | WebSocket realtime                                                        |

Catatan: `laravel/reverb` sudah dideklarasikan di `composer.json`. Scheduler saat ini menjalankan dua perintah:

- `message:dispatch-due` setiap menit.
- `integration:alert-sync-anomalies` setiap 15 menit (`withoutOverlapping`, `onOneServer`).

## 4. Channel Authorization dan Realtime

- Channel `institutions.{institution}.projects.{project}.workspace` dan `.presence` memverifikasi institution scope serta Policy `viewAny` pada Task.
- Klien hanya menerima delta setelah commit; reconciliation selalu membaca snapshot database.
- Jangan menambah channel baru tanpa authorization Policy dan verifikasi denial lintas tenant.

## 5. Storage Privat

- Disk `private` memakai `storage_path('app/private/attachments')`, visibility `private`, `serve => false`.
- Lampiran memakai path acak dan download/upload diotorisasi lewat `AttachmentPolicy`.
- Jangan mengekspos file privat melalui `storage:link` atau URL publik.

## 6. Mail

- Default `MAIL_MAILER=log` untuk non-production.
- Production dapat memakai `smtp` bila `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, dan `MAIL_FROM_*` dikonfigurasi.
- Jangan pernah mengirim payload sensitif lewat mail selain yang disetujui kontrak.

## 7. Scheduler

Jalankan satu scheduler daemon per environment (`schedule:work`) atau cron `* * * * * php artisan schedule:run`. Perintah bertanda `onOneServer` dijalankan oleh satu instance saja.

## 8. Health Checks

- Endpoint `GET /up` (Laravel default) mengembalikan `200 OK` ketika aplikasi dapat di-bootstrap. Diarahkan ke health probe load balancer.
- Verifikasi tambahan dilakukan dengan `php artisan about` dan `php artisan route:list`.

## 9. Startup Ordering

1. Provision MySQL, pastikan reachable.
2. `composer install --no-dev --optimize-autoloader`
3. `npm ci && npm run build`
4. `php artisan migrate --force`
5. `php artisan config:cache`
6. `php artisan route:cache`
7. `php artisan event:cache`
8. `php artisan storage:link` (hanya untuk asset publik)
9. Start queue worker, scheduler, dan Reverb.
10. Buka traffic web.

## 10. Graceful Restart dan Maintenance

- `php artisan down --render="errors::503"` untuk maintenance; `php artisan up` untuk keluar.
- Restart worker dengan `php artisan queue:restart` (memberi sinyal ke worker setelah job berjalan selesai).
- Pastikan tidak ada proses yang memulai job baru sebelum drain selesai.

## 11. Deployment Runbook

1. Checkout tag/commit release di branch deploy.
2. Jalankan startup ordering pada bagian 9.
3. Verifikasi `php artisan about` dan endpoint `/up`.
4. Konfirmasi worker, scheduler, dan Reverb aktif.
5. Pantau log aplikasi (tanpa sensitive payload) dan queue length.

## 12. Verification Checklist

- [ ] `php artisan config:cache` sukses.
- [ ] `npm run build` sukses (production build).
- [ ] `php artisan migrate --force` sukses.
- [ ] `GET /up` mengembalikan `200`.
- [ ] `php artisan queue:work --once` memproses job tanpa error.
- [ ] `php artisan reverb:start` dapat di-bootstrap.
- [ ] Walkthrough runbook deploy tereksekusi tanpa langkah implisit.

## 13. Backup dan Monitoring

Untuk procedures backup, restore, monitoring, alerting, dan incident response, lihat [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md).

### 13.1 Quick Reference

- **Backup script**: `scripts/backup.sh [staging|production]`
- **Health check**: `GET /up`
- **Queue monitoring**: `php artisan queue:work` (see BACKUP_RECOVERY.md for alert thresholds)
- **Reverb monitoring**: Process alive check via systemd/cron

### 13.2 Incident Response

Lihat [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) untuk:

- Incident classification (P1-P4)
- Escalation procedures
- Privacy incident response
- Recovery objectives (RTO/RPO)

## 14. Verifikasi dan Demo Inti T10

Jalankan `composer test:core` untuk suite backend terisolasi, unit frontend
serta tautan dan referensi dokumen. `composer ci:check` juga menjalankan
suite ini setelah static checks. Tidak memerlukan reset database aplikasi.

Untuk pemeriksaan browser, jalankan Laravel dan Vite lokal existing, kemudian
`node .github/scripts/check-core-release.cjs --browser`. Playwright perlu
tersedia pada lingkungan QA; `SATU_PLAYWRIGHT_MODULE` boleh menunjuk modul
existing dan `SATU_BROWSER_EXECUTABLE` executable Chromium existing.
`SATU_QA_ORIGIN` default localhost port 8000 dan wajib loopback. Tidak
menambah dependency atau menonaktifkan web security. Mutasi browser dicegat;
screenshot hanya memakai fixture synthetic pada direktori sementara.

Reset demo publik memakai Reset perjalanan; reset skenario backend adalah
menjalankan ulang `php .github/scripts/check-core-journey.php`. Seeder T10
tidak dipasang ke DatabaseSeeder atau dipakai pada database aplikasi. Jangan
menggunakan migrate:fresh, menghapus data pengguna, atau membuka gate produksi
untuk demonstrasi.

Verifikasi recovery T10 hanya snapshot logical SQLite dan berkas synthetic.
Drill MySQL, restore storage/deployment lengkap, concurrency multiworker,
Reverb websocket nyata, OTP/undangan serta provider nyata harus diuji pada
staging berizin sebelum rilis. Jalankan studi usability SC-01 pada
[Audit Alur](../product/COLLABORATION_AUDIT.md#6-rencana-validasi-masalah-dan-usability):
catat langkah, pemahaman, kegagalan dan bantuan yang diperlukan tanpa mengarang
hasil. Final UAT, institusi pilot, baseline, target, retensi dan persetujuan
kampus tetap belum ditutup oleh tes otomatis.

## Sinkronisasi Schema Backend Lokal

Penggabungan backend menambah `users.remember_token` dan `inclusion_signals.is_synthetic` pada migration asli. Database lama tidak menerima perubahan kolom hanya dengan `migrate`.

Periksa melalui `php artisan backend:sync-integration-schema --database=mysql`. Penerapan lokal memakai `--apply --dump-tool=<executable mysqldump> --backup=<path SQL baru pada direktori privat>`. Command hanya menerima MySQL loopback pada environment local, membuat cadangan lengkap terlebih dahulu, memeriksa kelengkapan dump dan jumlah baris seluruh tabel, lalu menambah kolom yang belum ada. Cadangan berisi data sensitif, tidak boleh masuk Git atau direktori publik. Command tidak menghapus data atau menjalankan migration ulang; nilai awal mengikuti migration sumber. Production dan klasifikasi dataset lama memerlukan prosedur serta persetujuan tersendiri.

Verifikasi tambahan hasil penggabungan: `php .github/scripts/check-backend-integration.php`. Seluruh fixture memakai SQLite di memori. Suite PHPUnit dari backend memerlukan runner yang belum tercantum pada dependensi repository; jangan menganggap suite tersebut sudah berjalan.
