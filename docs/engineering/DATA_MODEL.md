# Data Model SATU

## Batas Role Runtime (17 Oktober 2026)

Workspace hanya `student` dan `campus_admin`. Nilai `is_platform_admin` serta
tabel organisasi/membership perekrut lama dipertahankan untuk pembacaan riwayat,
bukan role aktif atau sumber hak akses. Tidak ada penghapusan akun, audit,
institusi atau data pengguna massal. Tidak mengubah nilai visibility lama menjadi
publik; penyimpanan historis bukan pilihan role atau berbagi yang tersedia di UI.

## 1. Principles

- MySQL adalah target production.
- Primary key internal tidak boleh menjadi authorization proof.
- Tenant-owned record membawa `institution_id` atau memiliki jalur relasi tenant yang tidak ambigu.
- Sensitive history untuk consent, validation, entitlement, inclusion review, dan sync bersifat append-only.
- Planned schema pada dokumen ini belum dianggap implemented sampai migration issue selesai.

## 2. Identity dan Institution

### `users`

Private `username`, password, display name, status, last authenticated timestamp, dan security metadata. Target schema tidak memakai email. Username dinormalisasi, unique, login-only, dan tidak masuk public/recruiter projection.

### `phone_numbers`

User, normalized E.164 number, masked display, verified-at, status, dan change history. Raw phone classified restricted.

### `otp_challenges`

Purpose, target hash/reference, OTP hash, expires-at, attempts, resend count, consumed-at, invalidated-at, request context, dan audit timestamps. OTP plaintext tidak disimpan.

### `institutions`, `institution_memberships`

Institution identity/status dan membership role/status/history. Role berasal dari membership relationship, bukan global user role.

Kontrak U01 pada 14 Oktober 2026 menetapkan satu universitas per deployment
dan role inti Mahasiswa serta Admin Universitas. `institutions` serta
`institution_id` tetap menjadi referensi kepemilikan. Konfigurasi server
menunjuk satu institusi yang valid dan aktif, tanpa ID tetap atau pemilihan
record pertama. Data institusi lain yang masih ada tidak otomatis dipindahkan,
digabung atau dihapus.

Target role Admin Universitas bersumber dari membership universitas sasaran.
U03 masih menyimpan flag `users.is_platform_admin` sebagai metadata transisi,
tetapi flag itu tidak memberi akses, tidak menerima mass assignment dan tidak
masuk serialisasi akun. Membership serta workspace memakai alias teknis
`campus_admin` sebagai satu sumber role admin UTY. Pemetaan akun, role,
undangan dan consumer harus eksplisit, idempotent, diaudit dan dapat
dipulihkan; tidak mempromosikan akun dari institusi lain secara otomatis.
ID pelaku dan sumber versi keputusan lama tetap utuh. Alias role transisi
tidak menjadi sumber hak akses independen atau role inti ketiga.

U01 tidak menambah atau mengubah kolom, migration maupun isi database. U02
memakai schema existing tanpa migration baru. Slug UTY dikonfigurasi sebagai
referensi stabil; numeric ID tetap berasal dari database. Seeder lokal
menambah dataset UTY tersendiri dan tidak mereset data institusi lama.

Provisioning pertama U02 membuat membership `campus_admin` berstatus verified
sebagai alias transisi. Tidak mengubah password/identitas akun atau flag
`is_platform_admin`; `verification_method` tidak diisi dengan roster match
atau undangan fiktif. Audit `university.admin.provisioned` mencatat sumber
`deployment_cli`, alasan, universitas serta akun sasaran. Actor audit null
menandakan operasi sistem/deployment, bukan mahasiswa yang memberi hak pada
dirinya. Penambahan membership dan audit satu transaksi; retry tidak menambah
riwayat palsu. Akun/membership existing yang konflik ditolak, bukan ditimpa.

Kebutuhan schema lanjutan diputuskan setelah inventaris aktual. Perubahan kolom
tabel existing mengikuti migration asal sesuai aturan repository; perubahan
schema tidak menggantikan prosedur pemetaan data dan backup/pemulihan.

U03 tidak menambah kolom atau migration. Status admin berubah verified atau
suspended melalui Action dan Policy tersendiri, bukan transisi afiliasi
mahasiswa. `verified_at` dan provenance existing dipertahankan. Revision
mencakup atribut serta ID audit terakhir. Audit `university.admin.status.changed`
mencatat actor, alasan dan perubahan status; penghapusan akun mandiri mencabut
membership sebelum anonimisasi, tanpa menghapus riwayat.

Pemetaan eksplisit mencatat `university.admin.mapped` dengan actor deployment
null. Cadangan terenkripsi berisi ID universitas/akun, flag sebelum perubahan
dan ID membership sebelum grant, tanpa password atau nomor. Rollback mencatat
`university.admin.mapping.rolled_back`; grant baru menjadi suspended, bukan
menghapus record. Flag yang dipulihkan tetap inert. Membership existing tidak
ditulis ulang; sumber yang berubah ditolak. Data institusi lain tetap utuh.

`PrivilegedInvitationPolicy` mengotorisasi penerbitan/pencabutan dari membership
UTY. Undangan historis mempertahankan issuer, nomor terikat dan audit. Hanya
undangan UTY dari issuer yang masih aktif dapat diterima; undangan institusi
lain tidak dipindahkan atau diaktifkan. `InclusionSignal` menerapkan kontrak
`InstitutionOwned` untuk pemeriksaan kepemilikan, tanpa menambah field atau
membuka gate analitik restricted.

### `institution_rosters`, `institution_roster_rows`

U05 tidak mengubah schema atau memindahkan data. Semester pada Pengaturan
membaca sumber roster dan riwayat, tanpa menulis kalender baru. Direktori
Mahasiswa hanya memproyeksikan nama/status/program, bukan bukti privat profil.
Halaman admin memakai sumber membership/revision existing dan daftar undangan
masked. Katalog tetap global sebagai istilah, tetapi penggunaan profil/peran
dibaca hanya dalam UTY; istilah yang masih dirujuk tidak dihapus.

U04 sendiri tidak mengubah schema. Context aktif mahasiswa menunjuk UTY dari
server, bukan menulis ulang `institution_id` pada profil atau membership lama.
Tidak membuat afiliasi/profil pada GET atau registrasi. Pengajuan NIM tetap
menyimpan request/membership mahasiswa dengan exact match atau status pending,
versi roster dan audit existing. Pengajuan ulang tidak mengubah NIM yang sudah
verified. Profil kampus lain tidak disalin, dan keputusan/manual review tetap
append-only. Nama universitas serta keadaan locked merupakan proyeksi
baca-saja, bukan row default baru.

Import batch, effective semester, source filename metadata, checksum, normalized NIM, normalized phone hash/encrypted value, student display data minimum, active flag, validation outcome, dan row error. Import history immutable setelah committed.

### `affiliation_requests`, `affiliation_reviews`

Student, institution, NIM, roster match result, status, reviewer, reason code, note, timestamps, dan append-only transition history.

Proyeksi peninjauan afiliasi mengeluarkan `nim` lengkap serta `phone` nullable
dari relasi nomor akun, hanya bagi Admin Universitas UTY berwenang. Ini bukan
perubahan schema atau atribut Hidden model. Nilai tetap terenkripsi pada
penyimpanan; hash dan username tidak diserialisasi ke antrean. Direktori
mahasiswa serta proyeksi lain tidak ikut diperluas.

`affiliation_profile_drafts` menyimpan hanya fakultas, program studi, dan
angkatan masuk yang dikirim bersama pengajuan afiliasi. Satu draft terikat ke
satu pengajuan, pengguna, dan universitas; nilai akademik memakai encrypted
array cast. Draft bukan `student_profiles`, tidak masuk serializer antrean
admin, dan hanya diproyeksikan kepada mahasiswa pemilik setelah afiliasi
verified. Nilai nonkosong pada draft immutable saat pengajuan ulang. Pembuatan
profil memakai nilai draft nonkosong sebagai sumber otoritatif, menolak input
yang berbeda, lalu menghapus draft di transaksi yang sama.

Pengajuan HTTP baru mewajibkan NIM serta tiga nilai akademik tersebut.
Nullable pada penyimpanan profil tetap mengakomodasi data legacy, bukan
izin mengirim pengajuan baru yang tidak lengkap. Ringkasan aktivasi read-only
menentukan kewajiban afiliasi atau pelengkapan profil setelah verified.
Pengajuan pending tidak membuat profil, termasuk saat modal ditutup otomatis
sesudah respons sukses.

### `privileged_invitations`

Institution/recruiter organization, intended role, normalized phone, token hash, expiry, delivery status, accepted/revoked timestamps, issuer, dan audit reference.

## 3. Profile, Projects, dan Workspace

`student_profiles.faculty` menyimpan pilihan fakultas katalog UTY dan
`admission_year` menyimpan tahun masuk nullable berupa unsigned small integer.
`study_program` memakai nama dan jenjang dari fakultas yang sama pada katalog
server `university.faculties`. Nilai nonkosong fakultas, program studi, dan
angkatan masuk bersifat set-once bagi mahasiswa: update tidak boleh mengubah
atau mengosongkannya, sedangkan nilai kosong dapat diisi satu kali. Aturan ini
diperiksa pada Form Request dan Action. Pasangan dikontrol pada request
create/update; editor tidak menghapus program legacy saat menyimpan bagian lain
tanpa perubahan akademik. `study_year` dipertahankan sebagai data legacy, tidak
ditampilkan sebagai angkatan dan tidak diisi pada alur baru. Tidak menebak
tahun masuk dari tingkat studi, tidak mengubah roster atau izin proyeksi.
Migration asal profil diperbarui; database existing membutuhkan penambahan
dua kolom nullable secara terkontrol, bukan migrate:fresh atau reset dataset.

- `student_profiles`, `skills`, `profile_skills`, `availability_windows`
- `projects`, `project_roles`, `project_role_skills`, `team_memberships`, `team_invitations`, `team_join_requests`, `team_membership_events`
- `tasks`, `task_assignments`, `messages`, `attachments`

Project, team, task, message, dan attachment selalu memiliki institution ownership. Attachment memakai private storage path dan authorized download.

T07 tidak menambah schema. Revisi tugas dihitung dari ID/proyek, judul, catatan,
status, prioritas, tenggat, updated-at, serta pasangan assignment ID/user ID
berurutan. Ini mendeteksi perubahan metadata pada detik yang sama serta perubahan
penanggung jawab tanpa mengandalkan timestamp tugas. Revisi tidak disimpan atau
menjadi bukti otorisasi. `attachments.message_id=null` dan `purpose=evidence`
menjadi daftar bukti tanpa pesan, dengan pagination dan proyeksi metadata aman.
Relasi tugas dan klaim individual tetap ditentukan melalui Kontribusi existing.

T03 memakai `profile_interests` existing untuk minat dan
`profile_skills.evidence_metadata` untuk daftar bukti awal privat. Item baru
memuat `title` dan `url` HTTPS; status belum ditinjau berasal dari serializer,
bukan field kiriman mahasiswa. Tidak menyimpan berkas baru, menyisipkan klaim
approval atau mengubah schema. Ketiadaan key `evidence_metadata` pada update
mempertahankan metadata existing; daftar kosong berarti penghapusan eksplisit.
Sumber kontribusi disetujui berasal dari relasi kontribusi, versi dan review,
bukan metadata self-report. Revision hash profil mencakup field profil,
keahlian/minat/jadwal serta metadata untuk konflik, tanpa menyimpan hash baru
di database atau mengirimnya ke proyeksi publik/perekrut.

`team_memberships` menyimpan state peserta saat ini secara unik per project dan user. Invitation serta join request memakai state pending yang unik per pasangan project dan user, lalu transition history disimpan melalui audit append-only dan event membership. Perubahan yang memengaruhi capacity mengunci project row dalam transaction.

T06 tidak menambah schema. Ringkasan tiga jawaban memakai `message` existing
(maksimal 1000 karakter), disusun server dari minat (200), kemampuan (350), dan
ketersediaan (250). `response_reason` menyimpan alasan yang dibagikan, bukan
catatan internal. Riwayat memakai record pengajuan terpisah dan audit append-only;
record terminal tidak ditulis ulang lewat Actions. Revisi keputusan merupakan
SHA-256 snapshot pengajuan, kebutuhan/kriteria peran, lifecycle dan anggota aktif,
bukan token timestamp presisi detik. Revisi penarikan hanya snapshot pengajuan,
agar perubahan kapasitas tidak menghalangi penarikan. Audit keputusan menyimpan
snapshot kriteria dan ID sumber, tidak jawaban, kontak atau bukti profil.

Penerimaan menyelesaikan tawaran pending lain bagi mahasiswa/proyek yang sama:
status `expired` berarti Berakhir dengan alasan membership terbentuk melalui
jalur lain, bukan diagnosis atau keputusan penolakan. Transaksi menyimpan audit
superseded dan notifikasi. Metadata event membership memiliki `source_id` serta
`source_type` (`join_request` atau `invitation`) agar ID dua tabel tidak ambigu.

T04 menambah `project_roles.accepts_beginners` nullable boolean dan
`selection_criteria` nullable text (maksimal 2000 karakter) pada migration asal
tabel proyek. Null berarti belum dinyatakan, bukan false. Tujuan tetap memakai
`projects.description`; tidak menambah sumber tujuan kedua. `project_roles.id`
dipertahankan saat edit. Referensi tim, pengajuan, undangan dan riwayat tidak
diputus lewat penggantian peran. Agregat kapasitas berasal dari keanggotaan aktif
dengan project ID yang sama. Data agregat hanya dihitung pada pembacaan,
tanpa menyimpan count atau rekomendasi. Untuk database existing, pembaruan schema
bersifat aditif dan idempotent melalui command eksplisit, bukan GET atau reset
database. Tidak ada migration `add_*_column_*` tambahan.

## 4. Matching

- `match_score_versions`: immutable weights, dimensions, activation time, author, notes.
- `match_runs`: version, normalized input snapshot, institution, actor, computed-at.
- `recommendations`: component score, total, explanation projection, expiry.
- `recommendation_feedback`: user outcome tanpa mengubah historical score.

Supported dimension hanya `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`.

T05 menambah tabel `matching_refresh_requests` untuk status permintaan per
institusi dan kandidat, revision UUID, versi, waktu permintaan/selesai, serta
kode hasil aman. Unique institusi/kandidat dan lock row menyerialkan batch;
job lama dengan revision berbeda tidak menulis hasil. `match_runs` existing
tetap menyimpan snapshot immutable. Snapshot baru memuat kebijakan, peran yang
dibandingkan, revision batch dan digest sumber matching, tanpa bukti privat atau
metadata jaringan. `recommendations` memakai expiry terbatas, bukan record
default pada GET. Riwayat hasil/feedback tidak dihapus saat invalidasi.

## 5. Contribution dan Portfolio

- `contributions`: owner, project/team, lifecycle, current version pointer.
- `contribution_versions`: immutable claim and summary.
- `contribution_evidence`: private source metadata dan storage reference.
- `contribution_reviews`: campus reviewer decision, required reason for non-approval, note, immutable policy version, and reviewed-at.
- `portfolio_entries`: approved source, visible fields, visibility level, published/withdrawn-at. Command hanya private/public. Enum institution/recruiter dipertahankan untuk membaca riwayat, tetapi diproyeksikan privat dan tidak memberi akses. Tidak ada konversi data massal. Revisi privasi dihitung dari state berbagi serta ID audit perubahan privasi terakhir per resource/institusi; token wajib dibandingkan di bawah row lock untuk mencegah konflik serta ABA pada detik sama. Tidak menambah kolom. Profil privat menutup proyeksi karya pada daftar, detail dan ringkasan pengajuan; hanya pemilik mendapat akses penuh.

Team confirmation tidak menjadi state requirement. Approval campus reviewer adalah validation authority.

T08 memakai struktur existing tanpa kolom baru. `claim` menjadi judul karya
individual dan `summary` menjadi isi yang dapat dibagikan; `declaration`, bukti
dan catatan review tetap privat. Revisi mengganti rujukan versi baru dengan
pilihan lengkap, bukan menghapus rujukan lama. Label sumber dibatasi 160
karakter sesuai schema MySQL; nama lengkap tetap pada attachment.

Revisi sumber adalah SHA-256 dari identitas/status/pointer versi, tugas dan
referensi berkas aktual. Path/checksum ikut menentukan digest, tidak dikirim
sebagai field browser. Karya tersimpan atomik bersama approval dengan default
private. Replay tidak mereset visibility atau withdrawal. Pencabutan berbagi
memakai audit existing tanpa menghapus versi, keputusan, atau sumber karya.

Proyeksi antrean peninjauan menambahkan `submitted_at` turunan tanpa kolom baru. Nilainya memakai audit `contribution.submitted` untuk versi aktual dengan auditable type, universitas, actor pemilik, status pending dan nomor versi yang konsisten. Audit mentah tidak dikirim. Waktu yang tidak tersedia tetap null; updated_at tidak menggantikannya. Pencarian dibatasi nama tampilan pengaju, judul proyek serta klaim/ringkasan versi dalam berkas yang diizinkan Policy existing. Hasil approved tidak membuka izin portofolio baru.

## 6. Gamification

Cache pembacaan proyeksi menyimpan daftar atribut mentah berupa array/scalar,
bukan objek Eloquent, enum atau Carbon. Key menyertakan format attributes-v1,
institusi, semester, versi aturan dan digest snapshot. Cache objek lama tidak
dibaca dan dibiarkan kedaluwarsa; tidak perlu flush global. Hasil direhidrasi
sebagai proyeksi hanya-baca, dengan periode aktual dari database. Persetujuan
individual tetap diperiksa setiap request. Pengamanan serializable_classes=false
dipertahankan. Tes menguji cache database dingin dan hangat, bukan hanya array
store tanpa serialisasi. Kegagalan resolver deferred dilaporkan server dan
dikirim melalui rescuedProps agar UI menyediakan pemulihan.

Integritas 20 Oktober 2026 tidak menambah tabel/kolom. expected_version dibandingkan
di bawah lock institusi sebelum mengubah preference; audit tetap append-only.
Nomor individual dihitung pada salinan row berizin sebelum pagination, bukan
ditulis dari GET. Guard pekerjaan identik memakai owner/proyek/tugas, klaim dan
ringkasan ternormalisasi, di bawah lock proyek pada create/revise/submit/approval.
Mengganti bukti tidak membuat pekerjaan identik menjadi baru. Anggota lain dan
uraian berbeda tetap boleh; parafrasa/kolusi masih memerlukan peninjauan manusia.
Tidak menghapus duplikasi atau ledger historis otomatis.

ReconcileApprovedContributionXp memeriksa approved tanpa award asal dalam
universitas terkonfigurasi, memakai consumer approval yang sama secara retryable
dan idempotent. Reversal tidak dianggap award hilang. MissingXpSemester berarti
roster belum berlaku pada reviewed_at; semester tidak diperkirakan. Command
gamification:reconcile-xp dijadwalkan tiap jam, tidak membuat review atau karya.
Panel XP pemilik membaca jumlah approved tanpa award, bukan janji waktu selesai.

### `xp_ledger_entries`

User, institution, semester, amount, reason, source type/id, policy version, awarded-at, reversal reference, dan unique idempotency key.

Setiap approved contribution menghasilkan tepat satu award dengan key
`{contribution_id}:{version}`. Reversal menyimpan amount positif pada row baru
dan mereferensikan row award melalui `reversal_reference_id`, sehingga net XP
dapat dihitung tanpa mengubah atau menghapus history. Row ledger append-only
dilindungi oleh model dan database trigger/check, serta seluruh mutasi award
dan reversal dicatat pada audit log.

### `badge_definitions`, `badge_rule_versions`, `badge_awards`, `badge_revocations`

`badge_definitions` menyimpan key taxonomy yang immutable, category, level, public
name, dan public description. Perubahan taxonomy membuat definition baru agar
public copy yang pernah dipakai tidak berubah diam-diam.

`badge_rule_versions` menyimpan definition, version integer, rule type, criteria
tervalidasi, policy version, author, dan active state. Hanya satu versi aktif
untuk satu definition. Rule lama tetap tersimpan ketika versi baru diaktifkan.

`badge_awards` menyimpan user, institution, definition, rule version, source
contribution dan version, safe source label, reason, idempotency key,
awarded-at, serta revoked-at. Automatic evaluation hanya membaca contribution
yang approved dan review approved. Source provenance tidak menyimpan atau
memuat private evidence, message, inclusion, atau connectivity fields.

`badge_revocations` adalah history append-only yang menyimpan award, actor,
reason, dan revoked-at. Revoke mengubah hanya revoked-at pada award dan tidak
menghapus atau menulis ulang award maupun rule history.

### `leaderboard_periods`, `leaderboard_preferences`, `leaderboard_projections`

Semester, scope type/id, rank, shared-rank group, score, verified XP total, active-member denominator, cohort size, suppressed flag, rule version, computed-at. Individual preference default off. Inclusion fields dilarang.

Leaderboard rebuild memakai snapshot digest yang deterministic. \`leaderboard_periods\`
menyimpan digest dan waktu komputasi terbaru agar snapshot kosong setelah withdrawal
tetap dapat dibedakan dari snapshot sebelumnya. Row pada \`leaderboard_projections\`
append-only dan retry dengan input yang sama tidak menggandakan row.

Scope \`program\` memakai program studi dari active roster row, scope \`team\` memakai
project team dengan active membership dan approved contribution, sedangkan scope
\`individual\` hanya dibuat untuk student dengan preference opt-in aktif. Score group
adalah average verified XP per active-member denominator. Cohort di bawah lima
disimpan sebagai suppressed tanpa rank, dan tie memakai shared competition rank.
Projection dapat dikenali stale dari \`computed_at\` dan threshold 24 jam.

Rebuild dijalankan melalui queued job \`RebuildLeaderboardProjections\` dengan unique
key per institution dan semester. Command \`gamification:rebuild-leaderboards\`
mengambil active roster dan dijalankan scheduler secara berkala.

Integrasi Peringkat 16 Oktober 2026 meminta rebuild setelah commit award,
reversal dan perubahan preference, bukan melalui GET. Job melepaskan unique
lock saat mulai dan menserialisasi pemrosesan per institution/semester agar
perubahan yang datang saat komputasi tetap dapat diantrekan. Cache pembacaan
diikat pada digest snapshot. Retry award tanpa parameter kebijakan eksplisit
mempertahankan semester serta amount historis; semester awal ditentukan roster
yang telah diaktifkan ketika review dilakukan, bukan waktu worker memproses.
Ringkasan XP pribadi dibaca dari ledger tenant/semester yang sama tanpa
menyertakan source privat atau membuka daftar individual kepada admin.

## 7. Notifications dan WhatsApp

- Laravel database notifications atau equivalent canonical in-app records.
- `notification_preferences`: purpose dan channel preference.
- `message_outbox`: purpose, recipient reference, template/version, payload hash/encrypted data, status, attempts, next attempt.
- `message_deliveries`: provider, external ID, status history, callback timestamp, sanitized error.

Provider token, plaintext OTP, dan full message payload tidak disimpan pada log.

## 8. Inclusion

- `collaboration_events`: metadata aktivitas yang diizinkan, bukan message content.
- `inclusion_signal_versions`: metric/rule/version/governance status.
- `inclusion_signals`: institution, subject, period, restricted feature state, evidence summary.
- `inclusion_reviews`: reviewer, human conclusion, support action, reason, timestamps.

Real and synthetic records memiliki provenance flag yang eksplisit.

## 9. Talent

- `recruiter_organizations`, `recruiter_memberships`, `recruiter_verification_reviews`
- `talent_entitlements` dan append-only entitlement events
- `talent_profile_projections` sebagai recruiter-safe allowlisted view
- `saved_candidates`
- `contact_requests` dan status history

Projection tidak memuat username, phone sebelum consent handoff, NIM, inclusion, private evidence, messages, raw audit, atau hidden matching input.

## 10. Academic Integration

- `integration_connections`: institution, provider key, mode sandbox/real, encrypted config reference, status.
- `academic_credit_mappings` menyimpan mapping tenant-owned dengan integer `version` yang immutable setelah dibuat. Kombinasi `institution_id`, `activity_type`, dan `version` unik agar setiap draft atau riwayat memiliki identitas stabil.
- Status `draft`, `active`, dan `retired` merepresentasikan lifecycle mapping. Aktivasi menutup mapping aktif sebelumnya untuk activity type yang sama dengan `effective_to`, tanpa menghapus histori.
- Setiap pembuatan dan transisi versi dicatat pada audit append-only dengan konteks institusi. Sync historis membawa `mapping_version` dari mapping yang digunakan.
- `integration_syncs`: source, mapping version, idempotency key, payload digest, status, external reference, attempt timestamps.
- `integration_sync_events`: append-only status/retry/reconcile history.
- `integration_sync_metrics`: institution-scoped aggregate health per connection (total syncs, succeeded, reconciled, dead-letter, retry volume, queue age). Alert threshold dievaluasi lewat scheduled command `integration:alert-sync-anomalies`.

## 11. Consent dan Audit

`consent_records` menyimpan purpose, notice version, decision, source, dan timestamp. `audit_logs` menyimpan actor, tenant context, action, target, outcome, request correlation, serta safe metadata. Audit tidak menjadi tempat menyalin sensitive payload.

## 12. Classification dan Retention

| Class        | Contoh                                          | Default access                     |
| ------------ | ----------------------------------------------- | ---------------------------------- |
| Public       | visible portfolio projection                    | explicit public/recruiter audience |
| Internal     | project metadata, task title                    | authorized team/campus             |
| Confidential | NIM, phone, private evidence                    | subject dan authorized operator    |
| Restricted   | OTP data, inclusion, provider secret, raw audit | narrow service/reviewer role       |

Retention period adalah governance gate. Deletion tidak boleh merusak required append-only proof. Subject-facing projection dapat ditarik sambil mempertahankan minimal lawful audit record.

## 13. Migration Review

Saat mengubah tabel yang sudah memiliki migration asal, edit migration asal tabel tersebut secara langsung sesuai project rule. Jangan membuat migration tambahan dengan pola `add_*_column_*` untuk perubahan kolom. Perubahan wajib mempertimbangkan unique constraint, foreign key, tenant index, idempotency, cross-tenant denial, restricted serialization, dan MySQL compatibility.

## T09: Permintaan Bantuan Kesempatan

Dua tabel baru, tanpa perubahan tabel existing: `opportunity_support_requests` menyimpan institusi, pemilik, kebutuhan, penjelasan, notice/tujuan, referensi governance/manifest, dataset kind, masa akses, status dan revisi; `opportunity_support_events` menyimpan actor, action, alasan, peran tawaran, waktu dan revisi sebagai riwayat append-only. Kunci command unik per pemilik/institusi mencegah pengajuan ganda pada retry identik. Event tidak bisa diubah atau dihapus melalui model. Consent purpose per berkas menggunakan ConsentRecorder existing; audit hanya menyimpan referensi dan perubahan status, bukan teks kebutuhan.

Expiry membatasi exposure, bukan jadwal penghapusan yang dianggap telah disetujui. Retensi penyimpanan dan pemulihan/deletion masih mengikuti governance gate. Tidak ada field diagnosis, skor jaringan, kontak, atau salinan bukti privat.

Factory bantuan tidak membuat consent otomatis. OpportunitySupportSeeder hanya
berjalan pada testing dengan SQLite di memori, memakai institusi/pemilik yang
dipilih eksplisit melalui konfigurasi fixture. Seeder tidak membuka gate,
tidak didaftarkan untuk seeding database aplikasi, dan idempoten pada command
key tetap. Riwayat tawaran mempertahankan referensi peran; penghapusan peran
bersejarah ditolak dengan validasi, bukan error foreign key. Migration event
memakai nama constraint pendek yang kompatibel MySQL serta dapat melengkapi
struktur parsial tanpa menghapus record.
