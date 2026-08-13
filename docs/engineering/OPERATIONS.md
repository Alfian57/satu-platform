# Operations, Deployment, dan Runbook SATU

## 1. Tujuan

Dokumen ini menetapkan kontrak runtime production SATU: environment contract, topologi proses, storage privat, mail, scheduler, secrets, health checks, startup ordering, graceful restart, serta runbook deploy dan recovery. Operator dapat memulai, memverifikasi, dan merestart seluruh service tanpa implicit knowledge. Dokumen ini hanya memuat kontrak yang sudah didukung oleh implementasi saat ini. Capability yang masih planned tidak dideskripsikan sebagai available.

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
| `FILESYSTEM_DISK`                                                 | `local` atau `s3`                        | Disk default untuk storage privat                        |
| `MAIL_MAILER`                                                     | `log` default; `smtp` bila dikonfigurasi | Driver mail                                              |

### 2.2 Secrets

- `APP_KEY`, `REVERB_APP_SECRET`, `DB_PASSWORD`, `MAIL_PASSWORD`, dan kredensial provider disimpan sebagai server secret, bukan di repository, `.env`, atau log.
- Dilarang me-log OTP, password, token, full phone, full NIM, message body, private evidence URL, inclusion detail, atau provider raw payload.
- Gunakan kredensial terpisah antara environment (local, staging, production).

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
- Jangan menambah channel baru tanpa authorization Policy dan test denial lintas tenant.

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
- Verifikasi tambahan dilakukan dengan `php artisan about` dan test `tests/Feature/Platform/RuntimeContractTest.php`.

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
3. Verifikasi `php artisan about`, endpoint `/up`, dan test smoke.
4. Konfirmasi worker, scheduler, dan Reverb aktif.
5. Pantau log aplikasi (tanpa sensitive payload) dan queue length.

## 12. Verification Checklist

- [ ] `php artisan config:cache` sukses.
- [ ] `npm run build` sukses (production build).
- [ ] `php artisan migrate --force` sukses.
- [ ] `GET /up` mengembalikan `200`.
- [ ] `php artisan queue:work --once` memproses job tanpa error.
- [ ] `php artisan reverb:start` dapat di-bootstrap.
- [ ] `tests/Feature/Platform/RuntimeContractTest.php` lulus.
- [ ] Walkthrough runbook deploy tereksekusi tanpa langkah implisit.
