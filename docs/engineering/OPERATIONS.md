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
| `SATU_UNIVERSITY_SLUG`                                            | `universitas-teknologi-yogyakarta`       | Referensi universitas UTY yang aktif di database         |
| `SATU_RECRUITER_ADMINISTRATION_ENABLED`                           | `false` default                          | Administrasi Talent Portal hanya setelah izin modul      |
| `SATU_GAMIFICATION_ADMINISTRATION_ENABLED`                        | `false` default                          | Administrasi aturan gamifikasi hanya setelah izin modul  |
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

Catatan: `laravel/reverb` sudah dideklarasikan di `composer.json`. Scheduler menjalankan perintah berikut:

- `message:dispatch-due` setiap menit.
- `integration:alert-sync-anomalies` setiap 15 menit (`withoutOverlapping`, `onOneServer`).
- `gamification:rebuild-leaderboards` setiap jam (`withoutOverlapping`, `onOneServer`).
- `gamification:reconcile-xp` setiap jam (`withoutOverlapping`, `onOneServer`).

## 4. Channel Authorization dan Realtime

- Channel `institutions.{institution}.projects.{project}.workspace` dan `.presence` memverifikasi institution scope serta Policy `viewAny` pada Task.
- Klien hanya menerima delta setelah commit; reconciliation selalu membaca snapshot database.
- Jangan menambah channel baru tanpa authorization Policy dan verifikasi denial lintas tenant.

## Pembaruan Kolom Profil Akademik

Perubahan 17 Oktober 2026 memperbarui migration asal tabel profil. Database
baru mendapatkan `faculty` (varchar 255 nullable) dan `admission_year`
(unsigned small integer nullable). Pada database yang migration-nya sudah
dijalankan, periksa schema dan tambahkan hanya kolom yang belum ada melalui
operasi schema terkontrol. Jangan menjalankan migrate:fresh, rollback tabel,
atau mengubah `study_year` lama menjadi tahun masuk. Kolom lama dipertahankan.
Jika kedua kolom belum ada, bentuk perubahan MySQL adalah:

```sql
ALTER TABLE student_profiles
    ADD COLUMN faculty VARCHAR(255) NULL,
    ADD COLUMN admission_year SMALLINT UNSIGNED NULL;
```

Perubahan sudah diterapkan pada MySQL lokal tanggal 17 Oktober 2026 dengan
pemeriksaan keberadaan kolom. Fingerprint seluruh atribut lama pada tujuh
profil tetap sama. Tidak mengubah akun, afiliasi, roster atau pilihan berbagi.
Tidak menerapkan perubahan schema produksi. Katalog fakultas/program berasal
dari `config/university.php`, sesuai daftar pemilik produk, bukan dari provider
eksternal atau bukti persetujuan universitas. Data lama yang belum sesuai
tetap ditampilkan dengan petunjuk pembaruan eksplisit.

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

### 7.1 Pemulihan XP Kontribusi

Approval kontribusi dan pembentukan portofolio tidak bergantung pada tersedianya
semester XP. Jika belum ada roster yang berlaku pada waktu approval, consumer
mencatat `gamification.xp_waiting_for_semester` tanpa mengarang semester atau
mengulangi keputusan admin. Halaman Peringkat memberi tahu pemilik bahwa XP
belum tercatat. Job `ReconcileApprovedContributionXp` memeriksa ulang sumber
approved yang belum mempunyai award. Scheduler mengantrekannya setiap jam.

Untuk menjalankan pemeriksaan lebih awal setelah data sumber diperbaiki:

```sh
php artisan gamification:reconcile-xp
```

Perintah ini mengantrekan job untuk universitas terkonfigurasi. Worker harus
aktif. Semester dipilih dari roster yang sudah berlaku pada waktu approval,
bukan semester saat worker berjalan. Roster baru yang aktif setelah approval
tidak otomatis menjadi sumber historis. Admin/operator harus memeriksa data
historis yang sah jika sumber tersebut belum ada. Jangan memundurkan waktu
aktivasi, mengubah semester ledger, membuat roster fiktif atau meminta mahasiswa
mengirim ulang kontribusi untuk memaksa award.

Rekonsiliasi dapat diulang tanpa menggandakan XP, portofolio atau review.
Reversal tidak dianggap sebagai XP yang hilang dan tidak diberikan kembali.
Callback gagal listener menerima event dan exception sesuai kontrak antrean
Laravel. Log kegagalan hanya berisi ID sumber/institusi dan kelas exception,
bukan isi bukti atau identitas privat. Kegagalan worker umum tetap memakai
retry/backoff. Pantau `gamification.xp_award_failed`,
`gamification.xp_reconciliation_failed`, serta failed jobs. Tidak ada perubahan
schema atau penghapusan ledger historis pada perbaikan ini.

## 8. Health Checks

### Cache Hasil Peringkat

Cache proyeksi memakai payload array/scalar dengan key format attributes-v1.
Key objek dari versi sebelumnya tidak dipakai lagi dan kedaluwarsa sesuai TTL;
tidak perlu cache:clear, flush global, reset data atau membangun ulang ledger.
Pertahankan cache.serializable_classes=false. Bila hasil deferred gagal, server
melaporkan exception dan UI menyediakan Muat ulang hasil. Pemulihan hanya GET,
bukan menjalankan award atau rebuild. Verifikasi regresi wajib memakai database
cache pada pembacaan pertama dan berikutnya agar serialisasi benar-benar diuji.

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

### 11.1 Gate CI/CD GitHub

Workflow `Build and Deploy` memanggil ulang workflow `tests.yml` pada commit
yang sama melalui `workflow_call`. Job `ci` menjalankan setup aplikasi serta
`composer ci:check`, termasuk static checks dan seluruh suite inti. Build dan
publikasi image memerlukan job tersebut berhasil; job deploy memerlukan CI
serta build berhasil. Kegagalan atau pembatalan CI tidak boleh dilewati dengan
`always()`, `continue-on-error`, atau menjalankan deploy secara terpisah.

Push ke `main` maupun pemanggilan manual pada `main` mengikuti gate yang sama.
Pemanggilan manual pada branch lain dapat memeriksa CI, tetapi tidak
memublikasikan image atau menjalankan SSH deploy. Token publikasi package
hanya diberikan pada job build; CI tidak menerima secret VPS. Target SSH,
secret existing, serta pemanggilan `update.sh` pada server tidak diubah.

Penguncian fakultas, program studi dan angkatan yang sudah tersimpan tetap
berlaku pada Form Request serta Action. Pengujian profil menjalankan callback
validasi `after()` dan memeriksa penolakan perubahan, bukan melonggarkan
runtime agar fixture lama dapat mengubah identitas akademik. Profil lama yang
belum memiliki nilai masih dapat melengkapi isian kosong satu kali.

Perubahan workflow baru berlaku setelah masuk ke branch yang dipakai
deployment. Lulusnya CI atau workflow deploy bukan bukti kesehatan server,
ketepatan isi `update.sh` di VPS, UAT, atau keberhasilan recovery production.

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
U06 menambahkan concurrency dan restore logical MySQL lokal sintetis pada
bagian di bawah. Restore storage/deployment lengkap, beban multiworker,
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

## Fondasi Universitas UTY dan Provisioning Awal

U02 memakai `config/university.php` dengan `SATU_UNIVERSITY_SLUG=universitas-teknologi-yogyakarta`. Nama universitas adalah Universitas Teknologi Yogyakarta. Resolver membaca slug serta status aktif dari database, bukan ID numerik tetap, parameter browser atau institusi pertama. Jika konfigurasi kosong, salah, record tidak tersedia atau suspended, command gagal dengan penjelasan dan tidak memilih kampus lain. Perubahan konfigurasi deployment yang memakai cache mengikuti prosedur `config:cache` serta restart worker existing.

Inventaris transisi bersifat baca-saja:

```sh
php artisan university:inspect --no-interaction
php artisan university:inspect --json --no-interaction
```

Laporan memuat target konfigurasi, jumlah membership/admin/undangan/roster/profil/proyek/kontribusi/portofolio tiap institusi, ID akun admin platform lama dan admin dengan membership lintas institusi. Tidak mengeluarkan username, password atau nomor WhatsApp. Institusi serta akun lama tidak dihapus, digabung atau diberi hak baru. Konfigurasi belum siap tetap mengeluarkan inventaris dengan exit code gagal.

Provisioning admin pertama memerlukan akun yang telah memiliki username/password dan nomor WhatsApp terverifikasi melalui alur identitas nyata. Tentukan ID akun setelah pemeriksaan identitas berwenang; dataset demo bukan pengganti verifikasi tersebut. Default command hanya dry run:

```sh
php artisan university:provision-admin --user=<ID_AKUN> --reason="Provisioning admin pertama UTY setelah pemeriksaan identitas" --no-interaction
php artisan university:provision-admin --user=<ID_AKUN> --reason="Provisioning admin pertama UTY setelah pemeriksaan identitas" --apply --no-interaction
```

Ganti `<ID_AKUN>` dengan ID positif aktual. Command tidak mempunyai route publik. `--apply` mengunci institusi, akun, nomor dan membership, lalu membuat membership beserta audit pada satu transaksi. Audit memakai actor sistem/deployment, ID sasaran, alasan dan sumber `deployment_cli`. Kegagalan audit membatalkan perubahan. Retry admin yang sama tidak menggandakan membership atau audit.

Bootstrap menolak flag admin platform lama, membership institusi lain, membership mahasiswa, status suspended, WhatsApp belum verified dan universitas yang sudah mempunyai riwayat admin. Tidak mengubah password, mengambil alih akun atau mengaktifkan ulang hak yang dicabut. Admin berikutnya memakai undangan/pemulihan berotorisasi, bukan bootstrap ulang. Alias teknis `campus_admin` tetap dipertahankan; U03 di bawah menerapkan pemetaan akun, sumber izin admin, proteksi admin terakhir dan penghentian jalur platform lama. Aktivasi tanpa pilihan kampus diterapkan pada U04; navigasi admin terpadu tetap U05.

Uji fondasi: `php .github/scripts/check-university-foundation.php`. Seluruh fixture memakai SQLite di memori, tidak menyentuh database lokal. Pemeriksaan mencakup konfigurasi hilang/salah/stale, kepemilikan resource, dry run, konflik akun lama, penolakan HTTP, transaksi/audit, retry dan tidak adanya HTTP eksternal.

## Transisi Admin Universitas U03

Sumber izin runtime adalah membership `campus_admin` verified dengan `verified_at` pada UTY aktif. Identifier itu alias teknis storage/workspace, bukan admin kampus terpisah dari Admin Universitas. `users.is_platform_admin` tetap tersimpan untuk inventaris/pemetaan, tetapi tidak membuka workspace, route, Policy atau bypass Talent Portal. Nilai shared prop kompatibilitas `is_platform_admin` selalu false. Tidak mereset akun atau menyalin data institusi lain.

Kedua akun dataset `uty_admin` serta `uty_admin_kedua` sudah sesuai sumber ini, sehingga tidak memerlukan grant/pemetaan ulang. Akun lama tidak dipromosikan massal. Tinjau inventaris sebelum memilih akun dan lakukan backup deployment sesuai [Backup dan Recovery](./BACKUP_RECOVERY.md). Pemetaan hanya menerima sumber admin lama yang sah, username/password lengkap, WhatsApp verified serta membership universitas yang sesuai. Membership asing, mahasiswa tanpa sumber admin, status pending/suspended dan konfigurasi salah ditolak.

```sh
php artisan university:transition-admin --user=<ID_AKUN_LAMA> --reason="Pemetaan UTY setelah peninjauan identitas dan sumber izin" --no-interaction
php artisan university:transition-admin --user=<ID_AKUN_LAMA> --reason="Pemetaan UTY setelah peninjauan identitas dan sumber izin" --apply --no-interaction
```

Ganti ID dengan akun yang telah dipilih eksplisit. Default hanya dry run dan tidak menulis cadangan/audit/grant. Apply mengunci universitas, akun, nomor serta membership; menyimpan receipt terenkripsi pada disk private dengan path `university-transitions/<UUID>.enc` sebelum perubahan; lalu menambahkan membership yang diperlukan, menonaktifkan flag legacy dan mencatat `university.admin.mapped` dalam satu transaksi. Receipt berisi snapshot minimum ID serta flag/membership sebelum perubahan, bukan password, nomor atau token. Kegagalan cadangan menolak perubahan; kegagalan audit membatalkan transaksi. Cadangan dari percobaan gagal dapat tetap ada sebagai bukti, tetapi tidak dapat dipakai rollback tanpa audit penerapan. Retry yang sudah sesuai tidak menggandakan hak/audit.

Pemulihan memakai path receipt hasil command, bukan path file bebas:

```sh
php artisan university:transition-admin --rollback=university-transitions/<UUID>.enc --reason="Pemulihan pemetaan yang telah ditinjau" --no-interaction
php artisan university:transition-admin --rollback=university-transitions/<UUID>.enc --reason="Pemulihan pemetaan yang telah ditinjau" --apply --no-interaction
```

Default rollback hanya pemeriksaan. Receipt diautentikasi enkripsi memakai APP_KEY existing dan harus cocok dengan universitas serta audit aktual. Sumber yang berubah menolak pemulihan. Grant baru ditangguhkan dan undangan menunggu dicabut; membership serta audit tidak dihapus. Admin aktif terakhir terlindungi. Flag historis yang dipulihkan tetap tidak memberi akses. Rollback yang telah selesai idempotent dan mencatat audit tambahan. Ini pemulihan operasi pemetaan, bukan pengganti backup database/deployment atau cara menghidupkan hak yang telah dicabut. Simpan receipt di storage privat sesuai retensi backup berizin, jangan menyalinnya ke public/Git atau mengganti APP_KEY saat masih diperlukan untuk pemulihan.

Pengelolaan status admin memakai backend `university.admins.index` (JSON baca-saja) serta `university.admins.status` (PATCH). Status hanya verified/suspended, dengan `expected_revision` dan alasan. Konfirmasi password, Policy, sumber aktual, penguncian universitas serta audit mencegah pencabutan admin terakhir dan keputusan stale, termasuk ABA pada detik yang sama. Penghapusan akun mandiri melalui Settings/Data Rights memakai proteksi yang sama. Transisi afiliasi mahasiswa tidak boleh mengubah status admin. UI pengaturan admin terpadu belum tersedia pada U03 dan tetap U05.

Route penerbitan/pencabutan undangan existing juga mewajibkan konfirmasi password. Hanya admin UTY aktif boleh mengundang; token harus berasal dari UTY, belum digunakan/kedaluwarsa/dicabut, dan penerima mempunyai WhatsApp yang cocok. Pengundang yang kehilangan akses tidak memberi grant melalui token lama. Worker menahan pesan undangan yang kehilangan izin sebelum menghubungi provider. Undangan institusi lain tidak dipindahkan, dan issuer/provenance historis tidak ditulis ulang.

GET `/platform` serta `/platform/affiliations` hanya pengalihan berotorisasi ke UTY. Route/Action approval serta suspension institusi baru ditutup. Katalog keahlian existing dan command versi pencocokan memakai Admin Universitas. Administrasi perekrut/gamifikasi membutuhkan persetujuan tujuan akses serta flag konfigurasi modul tersendiri yang default false; bukan otomatis aktif karena penggabungan role. Izin organisasi/entitlement perekrut, pencabutan visibility/consent, consumer portofolio, notifikasi dan scheduler existing tidak dihapus.

Uji U03: `php .github/scripts/check-university-authorization.php` (68 pemeriksaan SQLite di memori) dan `node .github/scripts/check-core-release.cjs`. Browser lokal `check-core-flow-ui-local.cjs` memeriksa pengalihan, katalog, daftar admin, penolakan mahasiswa dan, jika `SATU_QA_OTHER_INSTITUTION_ID` diisi eksplisit, URL kampus lain. Verifikasi lokal lulus 176 pemeriksaan pada 320px/1280px/1920px. Seluruh mutasi bisnis browser diblokir; hanya login dataset diizinkan. Hasil bukan UAT atau pengujian concurrency MySQL. Aktivasi/konteks mahasiswa dijelaskan pada U04 di bawah; UI admin terpadu tetap U05, data nyata serta pembuktian lengkap tetap gate U06.

## Aktivasi Mahasiswa UTY U04

Nama universitas mahasiswa, afiliasi dan konteks aktif membaca konfigurasi
`SATU_UNIVERSITY_SLUG`. Tidak memakai kampus pertama atau membership terbaru.
Form NIM tidak menawarkan pilihan kampus. ID klien, bila dikirim, harus cocok
dengan server; pengajuan memakai Action/Policy existing dan status suspension.
WhatsApp OTP tetap alur existing. Roster kosong/mismatch masuk antrean manual;
roster berubah memerlukan pencocokan ulang eksplisit. GET tidak membuat data.

Konfigurasi hilang/salah/tidak aktif menampilkan pemulihan locked. Pulihkan
konfigurasi/data institusi melalui operasi deployment, lalu periksa status.
Jangan mengaktifkan ulang suspended dengan pengajuan NIM, menambah grant manual
tanpa bukti, mereset database atau memindahkan profil tenant lain. Akun lama
mengajukan afiliasi UTY terpisah; data historis tetap disimpan.

Draft onboarding berada di memori sesi akun selama navigasi Inertia, penutupan
modal dan pending/network error. Bukan penyimpanan browser persisten atau
autosave. Reload penuh hanya memulihkan data yang telah dikonfirmasi server.
Setelah respons POST belum pasti, gunakan Periksa status afiliasi sebelum
mengirim command lagi. Profil existing dibuka melalui editor tanpa ditimpa.

Verifikasi U04: `php .github/scripts/check-university-activation.php` (71
pemeriksaan pada SQLite di memori) dan `node .github/scripts/check-core-release.cjs`.
`node .github/scripts/check-university-activation-browser.cjs` memeriksa 55
skenario/keadaan dengan payload Data synthetic dan request command dicegat.
Gunakan `SATU_PLAYWRIGHT_MODULE`, `SATU_BROWSER_EXECUTABLE` serta
`SATU_QA_ORIGIN` lokal bila diperlukan, mengikuti konfigurasi browser existing.
Lebar 320px sampai 3440px, zoom, keyboard/fokus, pemulihan serta perubahan
konteks diperiksa. Artefak screenshot ditulis hanya ke direktori temporer.
Suite akun UTY lokal lulus 176 pemeriksaan lintas mahasiswa/dua admin tanpa
mutasi bisnis. Tidak mengirim OTP/provider atau mengubah data pengguna.
UI admin terpadu tetap U05; UAT, concurrency MySQL dan gate nyata tetap U06.

## Ruang Admin Universitas U05

Gunakan satu sidebar Admin Universitas. Mahasiswa menyediakan daftar afiliasi
dengan filter nama/status dan pintasan peninjauan. Pengaturan memisahkan profil
universitas server, semester bersumber roster, katalog keahlian dan akun admin.
Profil/config/provider tetap dikelola melalui deployment; semester baru melalui
impor roster, bukan pengubahan riwayat. Katalog tidak mengesahkan kemampuan
mahasiswa dan istilah yang terpakai tidak dapat dihapus.

`university.admins.index` memberikan Inertia untuk browser dan JSON bagi request
`Accept: application/json`, dengan allowlist admin dan undangan masked berpagination.
Token, nomor lengkap dan provider payload tidak dikirim. Gunakan Undang admin,
Cabut undangan atau Tangguhkan/Pulihkan akses. Konfirmasi sandi sendiri tidak
mengirim tindakan: periksa lalu pilih Konfirmasi tindakan. Setelah sukses atau
respons belum pasti, gunakan Periksa daftar terbaru sebelum command berikutnya.
Konflik revision memerlukan tutup dialog dan pilih ulang sumber terbaru, bukan
retry otomatis. Izin hilang menyembunyikan daftar. Admin terakhir tetap dilindungi
Action existing. Tidak menjalankan pemetaan/provisioning melalui UI ini.

Verifikasi: `php .github/scripts/check-university-workspace.php` (44 pemeriksaan
SQLite memori), `node .github/scripts/check-university-workspace-browser.cjs`
(63 pemeriksaan browser synthetic dengan command dicegat), serta
`node .github/scripts/check-core-release.cjs`. Environment Playwright mengikuti
U04 di atas, screenshot hanya temporer. Suite lokal akun tetap memblokir semua
mutasi bisnis. U05 tidak memigrasikan database atau mengirim WhatsApp/OTP nyata.
Pemeriksaan landing `check-landing-ui.cjs` lulus 124 pemeriksaan dan regresi
onboarding U04 lulus 55 pemeriksaan browser. Verifikasi U05 dituntaskan pada
15 Oktober 2026, tanpa mengklaim pengujian pilot atau persetujuan institusi.
Regresi delapan akun UTY lokal lulus 218 pemeriksaan, mencakup halaman baru,
bantuan yang belum memberi akses reviewer otomatis dan tenant lama ditolak.
UAT, deployment production, concurrency MySQL dan gate data nyata tetap U06.

## Pembuktian Transisi U06

Per 15 Oktober 2026, alur lengkap `check-core-journey.php` lulus 77 pemeriksaan
dalam dua putaran SQLite memori. Fixture mempunyai dua admin UTY dan institusi
pembatas. Bantuan diuji dari gate tertutup sampai consent, tawaran pemula,
penerimaan tanpa auto-join dan withdrawal saat gate ditutup. Admin kedua
menyetujui versi revisi; pengakuan tetap privat sampai izin berbagi diberikan.

Pengujian MySQL lokal bersifat opt-in, bukan bagian yang diam-diam berjalan
pada database aplikasi:

```sh
php .github/scripts/check-university-transition-mysql.php --run
node .github/scripts/check-core-release.cjs --mysql
node .github/scripts/check-core-release.cjs --browser --mysql
```

Runner memerlukan environment local/testing tanpa config cache, koneksi
MySQL loopback tunggal, serta hak membuat schema uji dan membaca
`performance_schema.data_lock_waits`. Jangan menggunakan kredensial production
atau mengubah hak akun aplikasi agar tes berjalan. MySQL lokal 8.0.30 lulus
33 pemeriksaan. Dua proses PHP menunggu row lock yang sama sebelum dilepas;
satu penangguhan ditolak agar tersisa admin aktif, dan satu dari dua approval
ditolak agar review/karya tidak ganda. Ini bukti skenario konflik tersebut,
bukan uji beban atau seluruh kemungkinan concurrency.

Dua schema `satu_u06_<nonce>` dan `satu_u06_<nonce>_restore` harus belum ada.
Nama dibuat runner, bukan diterima dari CLI. Penanda kepemilikan diperiksa
sebelum worker dan cleanup; hanya schema yang dibuat pada eksekusi itu yang
dihapus setelah pemeriksaan. Tidak menjalankan migrate/reset pada database
aplikasi. Berkas bukti/receipt synthetic hanya berada pada direktori sementara
`satu-u06-<nonce>` milik sistem operasi, bukan storage aplikasi atau public.

Restore logical memulihkan tabel, indeks, seluruh baris dan trigger. Runner
memeriksa kesetaraan baris, CHECK TABLE, seluruh foreign key tanpa orphan,
checksum bukti, rollback receipt terenkripsi serta worker antrean yang
dipulihkan. Retry rollback/worker tidak menambah pengakuan/notifikasi.
Delta tugas diperiksa sebelum/sesudah commit dan rollback; channel menolak
institusi lain serta afiliasi yang dicabut. Cache memakai array terisolasi,
broadcast null, provider HTTP dilarang dan event approval dicegat. Ini bukan
uji Redis, koneksi websocket, OTP atau delivery WhatsApp nyata.

Migration asal pemetaan kredit memakai nama indeks gabungan eksplisit yang
pendek agar pemasangan schema baru lolos batas identifier MySQL. U06 tidak
menjalankan ulang migration pada database existing. Database existing yang
mempunyai schema lama harus diaudit sebelum mengaktifkan modul terkait;
keberhasilan schema uji baru bukan bukti schema aplikasi lama sudah tersinkron.

Regresi konfigurasi, undangan usang, larangan validasi sendiri, route legacy,
audit gagal dan batas tenant tetap dijalankan oleh suite U02 sampai U05.
Browser synthetic memakai command yang dicegat; pemeriksaan delapan akun
lokal hanya mengizinkan login dan memblokir seluruh mutasi bisnis. Selesaikan
format/generasi Wayfinder sebelum browser agar HMR tidak memutus navigasi.

Hasil akhir 15 Oktober 2026: 337 pemeriksaan browser synthetic dan 218
pemeriksaan halaman delapan akun lokal lulus tanpa exception JavaScript.
Pint, lint/format frontend, Wayfinder/TypeScript, PHPStan tanpa error,
tautan/referensi UX dan diff whitespace lulus. Jumlah record users,
membership, proyek, kontribusi, audit dan jobs pada database aplikasi sama
sebelum/sesudah pemeriksaan; tidak ada schema uji tersisa. Tidak menjalankan
build atau mengirim pesan provider nyata.

Final UAT dan persetujuan visual oleh pemilik produk/kampus belum diberikan.
Checklist manusia berada pada [Audit Alur](../product/COLLABORATION_AUDIT.md#uat-transisi-universitas-u06).
Drill backup production, storage/deployment lengkap, websocket/provider nyata,
retensi, standar bukti dan izin data nyata tetap gate. Bukti teknis U06 tidak
menutup gate tersebut atau mempromosikan akun lama secara massal.

## Dataset UI Alur Inti UTY Lokal

### Persiapan Pelaksanaan Alur Inti

Sebelum uji bersama pengguna, tim kampus memilih peninjau utama dan cadangan dari Admin Universitas aktif, menyepakati jadwal pemeriksaan, serta menjelaskan jalur eskalasi ketika peninjau tidak tersedia. Catat nama penanggung jawab dan jadwal pada dokumen operasional kampus yang berwenang. Panduan ini tidak menetapkan orang, janji waktu, standar bukti atau SLA kampus secara sepihak; persetujuan institusi dan gate data nyata tetap diperlukan.

Pemilik proyek menyediakan peran pemula yang benar-benar dapat dikerjakan: hasil awal yang terukur, kriteria terkait pekerjaan, pendampingan serta ketersediaan yang dibutuhkan. Gunakan Peran pemula pada Peluang untuk memeriksa penemuan peran tersebut. Saat meninjau pengajuan, gunakan bekal dan kebutuhan peran yang sengaja diajukan; ketiadaan karya bukan penilaian otomatis kurang kemampuan.

Setelah tim terbentuk, bagi tugas yang saling mendukung. Contoh: satu anggota merancang satu halaman panduan, anggota lain memeriksa kejelasan informasi lalu memberikan masukan pada koordinasi tim. Masing-masing menjelaskan bagian individual saat mengajukan Kontribusi. Tugas, keanggotaan dan percakapan tidak otomatis membuktikan hubungan kerja baru atau keberhasilan dukungan.

Pada jadwal pemeriksaan yang disepakati, buka Pengajuan menunggu dengan urutan Pengajuan terlama. Waktu kirim memakai audit versi aktual; berkas tanpa sumber waktu ditandai belum tercatat untuk diperiksa tanpa mengarang tanggal. Gunakan notifikasi aplikasi existing dan baca data terbaru sebelum keputusan. Setelah memutuskan, gunakan Hasil disetujui serta pencarian untuk menemukan kembali kontribusi individual. Peninjau cadangan tetap tidak boleh meninjau kontribusinya sendiri. Persetujuan tidak mengubah izin berbagi mahasiswa.

### Menyiapkan Dataset

Verifikasi penguatan alur pada 16 Oktober 2026: `check-contribution-recognition.php` lulus 69 pemeriksaan terisolasi, termasuk pencarian, pembatasan tenant/kolom privat, urutan waktu kirim dan pagination. Browser synthetic `check-contribution-recognition.cjs` lulus 52 pemeriksaan dan `check-workspace-collaboration.cjs` lulus 53 pemeriksaan. `check-core-flow-ui-local.cjs` lulus 313 pemeriksaan pada dua belas akun lokal, termasuk pintasan pemula, contoh editor yang mempertahankan draft, serta pencarian hasil disetujui pada MySQL aktual. Pemeriksaan halaman lokal hanya mengizinkan login dan GET; mutasi bisnis dicegat. Reflow 320px sampai desktop besar, zoom, reduced motion dan pemulihan relevan diperiksa. Pint, PHPStan, lint, formatting, Wayfinder/TypeScript, referensi dokumen dan whitespace lulus. Tidak menjalankan build atau mengatur jadwal/peninjau kampus nyata; hasil ini bukan persetujuan UAT atau bukti manfaat pilot.

Jalankan `php artisan db:seed --class=UtyJourneySeeder --no-interaction` pada MySQL lokal. `DatabaseSeeder` sekarang memanggil seeder ini, sehingga `php artisan db:seed --no-interaction` mempunyai hasil yang sama. Seeder memerlukan slug konfigurasi UTY, tidak menjalankan migration/reset, dan menolak production, staging, koneksi remote serta disk eksternal. Jangan memakai seeder demo untuk deployment produksi atau memasukkan data universitas nyata.

Satu pintu masuk data aplikasi adalah `UtyJourneySeeder`. Seeder multi-institusi `DemoSeeder` dihapus, dan sumber `UtyDemoSeeder` diganti dengan seeder perjalanan ini. `RoleUserSeeder` serta `CoreFlowUiSeeder` sudah dipensiunkan sebelumnya. `SkillTaxonomySeeder` tetap katalog yang dipakai seeder utama. `CoreJourneyDemoSeeder` dan `OpportunitySupportSeeder` tetap fixture pengujian terisolasi yang dipakai suite regresi, bukan seeder akun aplikasi. Penghapusan file seeder tidak menghapus data yang pernah disimpan.

Dataset `uty-journey-synthetic-v3` memakai slug `universitas-teknologi-yogyakarta`. Dua belas akun khusus memakai password lokal `password`, terdiri dari sepuluh skenario mahasiswa serta dua Admin Universitas. Tidak membuat akun admin platform terpisah. Kredensial sederhana ini hanya untuk data synthetic pada environment lokal, bukan akun produksi:

| Username        | Skenario                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| uty_mahasiswa   | Profil/jadwal siap, belum punya tim atau karya. Mulai dari Proyek.                                                   |
| uty_pemula      | Minat tersedia, tanpa keahlian/jadwal/karya. Penelusuran pemula tetap tersedia.                                      |
| uty_pelamar     | Pengajuan menunggu serta keputusan ditolak beralasan.                                                                |
| uty_pemilik     | Delapan proyek, pengajuan anggota, kebutuhan peran serta papan tugas.                                                |
| uty_anggota     | Tim aktif, tugas, bukti privat, kontribusi draft/pending/revision/approved serta satu karya privat.                  |
| uty_admin       | Roster sintetis, afiliasi belum cocok dan antrean validasi kontribusi.                                               |
| uty_admin_kedua | Akun kedua dengan role Admin Universitas dan identitas pelaku terpisah.                                              |
| uty_afiliasi    | Pemulihan afiliasi yang belum cocok dengan roster.                                                                   |
| uty_aktivasi    | Akun dan WhatsApp sintetis siap, belum berafiliasi. Masukkan NIM `UI-DEMO-9` untuk mencoba exact match roster.       |
| uty_profil      | Afiliasi verified, belum mempunyai profil. Isi kemampuan dan jadwal sendiri melalui UI.                              |
| uty_ditolak     | Anggota proyek dengan kontribusi ditolak beralasan, tanpa karya yang diakui dari penolakan itu.                      |
| uty_portofolio  | Tiga karya: privat, kampus, publik. Karya publik berasal dari versi kedua setelah revisi dan persetujuan admin lain. |

Dataset baru mempunyai delapan proyek, sebelas tugas, delapan kontribusi dan empat karya. Enam proyek awal dipertahankan, ditambah Layanan Peminjaman Buku sebagai contoh kerja dan Panduan Kampus untuk Mahasiswa Baru sebagai peluang lintas program studi dengan dua peran pemula. Roster mencakup Informatika, Sistem Informasi dan Desain Komunikasi Visual. Bukti TXT benar-benar tersimpan pada disk privat dan dapat diunduh peninjau yang berwenang.

Urutan uji manual yang disarankan:

1. Masuk sebagai `uty_aktivasi`, gunakan NIM `UI-DEMO-9`, lalu isi bekal kemampuan. Untuk langsung menguji editor tanpa langkah NIM, gunakan `uty_profil`.
2. Masuk sebagai `uty_mahasiswa` atau `uty_pemula`, buka Proyek dan cari peran yang menerima pemula. Ajukan minat pada Ruang Baca Kampus atau Panduan Kampus untuk Mahasiswa Baru.
3. Masuk sebagai `uty_pemilik`, tinjau pengajuan dan beri keputusan beralasan. Pengajuan `uty_pelamar` sudah menunggu pada Ruang Baca Kampus; riwayat penolakannya tersedia pada proyek frontend.
4. Masuk sebagai `uty_anggota`, buka Arsip Karya Mahasiswa. Coba tugas, bukti privat, draft kontribusi dan perbaikan kontribusi berstatus revisi.
5. Masuk sebagai `uty_admin` atau `uty_admin_kedua`, buka Validasi kontribusi. Tinjau pengajuan yang sudah tersedia atau hasil kirim pada langkah sebelumnya. `uty_ditolak` memperlihatkan contoh keputusan penolakan.
6. Masuk sebagai `uty_portofolio`, periksa tiga jangkauan karya dan riwayat dua versi rancangan. Coba berbagi serta cabut berbagi, lalu periksa halaman publik. `uty_afiliasi` menyediakan contoh terpisah untuk peninjauan afiliasi manual.

Persiapan proyek, pengajuan, tugas, kontribusi serta berbagi memakai Actions dan Policy aktual. Akun admin pertama dibuat melalui Action provisioning dengan nomor sintetis yang disimulasikan verified; akun kedua merupakan fixture lokal. Approval selalu membuat karya privat. Hanya akun synthetic `uty_portofolio` kemudian menjalankan pilihan berbagi melalui Action pemilik: satu karya kampus dan satu karya publik, disertai pengaturan profil publik dan riwayat consent. Bukti asli serta catatan peninjau tetap privat; perekrut tidak diaktifkan. Semua nama/konten berlabel Data synthetic dan tidak membuktikan identitas, kemampuan atau hasil pilot nyata.

Seeder hanya memakai notifikasi database. Event pemicu matching, realtime dan consumer approval lanjutan ditahan dalam scope seeding; konfigurasi antrean/broadcast dipulihkan setelah selesai atau gagal. Tidak mengirim OTP/WhatsApp, mengaktifkan bantuan kesempatan, analitik inklusi, atau mengubah versi/bobot pencocokan global. Jika belum ada versi pencocokan aktif, gunakan penelusuran Proyek; keadaan belum dikonfigurasi tidak ditutupi dengan skor contoh.

Dataset v1 yang lengkap dapat diperbarui tanpa reset: identitas delapan akun lama diperiksa melalui username dan hash nomor milik fixture, empat akun baru serta skenario ditambahkan atomik, password dua belas akun synthetic diatur ke `password`, lalu marker berubah ke v3. Dataset v2 memeriksa identitas username dan hash nomor pada seluruh akun sebelum hanya memperbarui password serta marker. Perubahan akun lain, proyek, pilihan berbagi, riwayat dan pengaturan dipertahankan. Roster baru memuat kembali lima mahasiswa lama beserta empat mahasiswa baru; riwayat impor lama dipertahankan. Slug asing, marker tidak dikenal/tidak lengkap, akun fixture hilang/berganti identitas atau benturan akun baru ditolak.

Seed ulang v3 tidak menggandakan data atau mengatur ulang perubahan pengguna, termasuk password yang diubah setelah upgrade. Jumlah di atas berlaku untuk dataset baru, bukan janji mengembalikan database yang sudah dipakai uji ke keadaan awal. Tidak tersedia reset destruktif. Uji regresi `php .github/scripts/check-core-flow-ui-seeder.php` memakai SQLite di memori dan storage sementara, memeriksa perjalanan, upgrade v1/v2, idempotensi, rollback, batas akses serta tidak adanya HTTP eksternal.

Pembaruan Peringkat 16 Oktober 2026 menambahkan marker
`demo_leaderboard_complete` pada dataset v3. Pemanggilan seeder memperiksa
identitas fixture, memberi XP melalui Action hanya untuk kontribusi approved
akun contoh dalam proyek synthetic UTY, lalu menghitung snapshot semester.
Akun, password, keputusan, karya serta pilihan berbagi tidak direset. Seed
berikutnya tetap no-op. Dataset baru menghasilkan empat award: satu pada
`uty_anggota` dan tiga pada `uty_portofolio`, dengan baseline konfigurasi
gamifikasi yang berlaku. Tidak membuat aturan badge atau persetujuan
individual otomatis. Kelompok contoh di bawah lima tetap dilindungi.

Uji Peringkat melalui menu sesudah Portofolio: periksa XP pribadi dan semester,
buka penjelasan kelompok, lalu coba persetujuan individual dengan akun sendiri.
Persetujuan portofolio tidak mengaktifkan peringkat dan penarikannya tidak
menghapus karya atau XP. Admin membaca kelompok saja. Pada runtime biasa,
jalankan worker antrean default agar approval, XP dan rebuild diproses;
scheduler hourly tetap menjadi pemulihan berkala. Refresh UI hanya membaca
snapshot, bukan memproses antrean. GATE-011 dan persetujuan data nyata tetap
memerlukan keputusan manusia. Pemeriksaan terisolasi tersedia melalui
`php .github/scripts/check-leaderboard-integration.php`.

Verifikasi integrasi Peringkat pada 16 Oktober 2026: 31 pemeriksaan PHP,
70 pemeriksaan seeder dan 18 pemeriksaan browser synthetic lulus. Browser
mencakup 320px sampai 3440px, dialog, pemulihan fokus, deferred, penarikan,
403 dan hasil jaringan belum pasti; command dicegat tanpa mengubah database.
Halaman MySQL lokal diperiksa bertahap pada 12 akun, termasuk kedua admin.
Satu percobaan login akun ditolak mengalami timeout; dua akun terakhir lulus
ketika dijalankan ulang. Ini bukan hasil satu eksekusi penuh suite rilis.
Seeder lokal menghasilkan empat award, satu periode dan nol opt-in; seed
ulang tidak menambah data. Pint, PHPStan, lint, format, Wayfinder/TypeScript,
tautan internal dan referensi UX lulus, tanpa menjalankan build atau menutup
gate produksi/UAT.

Untuk pemeriksaan halaman aktual, jalankan `node .github/scripts/check-core-flow-ui-local.cjs` setelah seed pada server lokal. Script login hanya memakai akun `uty_*`; semua mutasi bisnis diblokir. Pemeriksaan mencakup halaman inti mahasiswa serta kedua Admin Universitas pada 320px, 1280px dan 1920px. Playwright memakai konfigurasi executable/module QA existing; artefak disimpan pada direktori sementara, bukan public.

Verifikasi lokal pada 14 Oktober 2026: seed pertama berhasil, seed ulang melalui `DatabaseSeeder` tidak menggandakan data, inventaris mengenali UTY sebagai universitas aktif sasaran, dan CLI mengonfirmasi akun admin yang sama tanpa grant/audit tambahan. Seluruh delapan akun berhasil login dan lulus 160 pemeriksaan halaman/responsif tanpa exception JavaScript. Suite fondasi serta seeder terisolasi, regresi teknis inti, Pint, PHPStan dan pemeriksaan frontend/dokumentasi lulus. Hasil ini bukan persetujuan pilot atau pembuktian seluruh transisi U03 sampai U06.

Verifikasi pembaruan 15 Oktober 2026: `UtyJourneySeeder` berhasil memperbarui
dataset v1 pada MySQL lokal menjadi 12 akun UTY, 8 proyek, 11 tugas,
8 kontribusi dan 4 karya. Fingerprint 24 akun lama, 15 proyek lama,
10 kontribusi lama dan 2 institusi lain tetap sama setelah seed. Pemanggilan
ulang melalui `DatabaseSeeder` tidak menambah data. Sebanyak 68 pemeriksaan
seeder terisolasi dan suite teknis inti lulus, termasuk upgrade, rollback,
exact match serta pembatasan proyeksi publik. Dua belas akun berhasil login
dan lulus 298 pemeriksaan halaman pada 320px, 1280px serta 1920px, tanpa
exception JavaScript atau mutasi bisnis selama QA. Pint, PHPStan, lint,
formatting, Wayfinder/TypeScript, referensi UX dan tautan internal lulus.
Build tidak dijalankan. Hasil ini merupakan pembuktian teknis lokal dengan
data synthetic, bukan hasil UAT manusia atau pilot kampus.
