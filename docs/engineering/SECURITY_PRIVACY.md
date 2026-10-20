# Security, Privacy, dan Responsible Matching SATU

## 1. Security Objectives

- Mencegah account takeover, OTP abuse, dan privileged self-registration.
- Menjamin tenant isolation dan least privilege.
- Mencegah exposure phone, NIM, evidence, inclusion, audit, dan provider secret.
- Menjaga integrity validation, XP, badge, leaderboard, entitlement, dan sync.
- Menyediakan recovery, traceability, dan data-right operations.

## 2. Authentication

- Private username dan password melalui customized Laravel Fortify.
- Registration dan recovery memerlukan verified WhatsApp phone.
- OTP dibuat SATU, di-hash, single-use, purpose-bound, memiliki short expiry, resend cooldown, attempt cap, per-target/IP/device throttling, dan invalidation.
- Fonnte hanya delivery provider. Callback tidak menjadi bukti authentication.
- Error tidak mengungkap apakah username atau phone terdaftar.
- Phone change, recovery, invitation acceptance, dan privileged action memerlukan recent authentication atau step-up yang sesuai.

## 3. Authorization

Keputusan 17 Oktober 2026 membatasi role runtime tepat pada Student dan
CampusAdmin (Mahasiswa dan Admin Universitas). Role workspace Recruiter serta
PlatformAdmin dihapus; flag dan membership historis tidak menjadi sumber izin.
Rute Talent Portal, administrasi perekrut dan kontak perekrut dihapus. Policy
organisasi dan entitlement perekrut ditutup tanpa opsi konfigurasi pengaktifan.
Undangan baru tetap hanya admin UTY. Nilai consent/visibility dan audit lama
dipertahankan sebagai riwayat, tidak dimigrasikan menjadi persetujuan publik.
Status suspended dan pengujian institusi lain tetap diperlukan untuk membuktikan
batas akses, bukan penambahan role atau kampus yang dilayani.

U04 mengikat aktivasi serta konteks mahasiswa pada universitas yang
dikonfigurasi server. Nama kampus read-only bukan bukti afiliasi. Form Request
menolak ID lain; Controller memilih universitas server dan Policy/Action
memeriksa ulang sumber, verified phone serta suspension. Tidak ada grant dari
input role atau afiliasi otomatis karena satu kampus tersedia. NIM exact
memerlukan nomor verified pada roster yang sama, selain jalur keputusan admin.
Roster kosong/mismatch tetap pending; pengajuan ulang tidak mengaktifkan
suspended atau mengubah NIM afiliasi verified.

Endpoint pengajuan afiliasi mewajibkan NIM, fakultas, program studi dan angkatan
masuk yang valid. Pop-up wajib bukan bukti verifikasi atau batas otorisasi:
Policy dan membership verified tetap melindungi setiap resource. Ringkasan
server membuka tahap afiliasi sebelum pengajuan valid, tahap profil hanya
sesudah verified dan hanya jika profil belum ada. URL editor profil tidak
melewati kewajiban afiliasi. Form wajib menolak penutupan manual; logout tetap
tersedia. Pending yang sudah tercatat dapat dibaca tanpa menahan mahasiswa
di dialog sampai admin mengambil keputusan.

Membership kampus lain tidak menjadi fallback shell/profil/proyek/kontribusi/
portofolio. Akun lama mengajukan afiliasi UTY dengan bukti baru, tanpa pemindahan
riwayat, profil atau consent. Isian yang belum dikirim tetap berada dalam memori
sesi, bukan persistent browser storage. Saat pengajuan afiliasi manual dikirim,
hanya fakultas, program studi, dan angkatan masuk disimpan sebagai array
terenkripsi pada `affiliation_profile_drafts`, terikat ke pengguna, universitas,
dan pengajuan. Draft hanya diproyeksikan ke pemilik melalui ringkasan aktivasi,
tidak masuk antrean admin, audit, log, atau broadcast, dan dihapus dalam
transaksi saat profil kemampuan dibuat. Nilai nonkosong pada draft tidak dapat
diubah saat permohonan dikirim ulang; nilai tersebut menjadi sumber otoritatif
saat profil dibuat. Nilai akademik nonkosong pada profil juga ditolak bila
request mahasiswa mencoba mengganti atau mengosongkannya. Nilai kosong tetap
dapat dilengkapi satu kali. Nilai draft belum menjadi profil sebelum afiliasi
verified. Snapshot tenant lama tidak dibuka saat konteks hilang; public
portfolio tidak mendapat shared onboarding.
Konfigurasi tidak tersedia menolak mutasi dan menyediakan pemeriksaan GET.
Hasil POST belum pasti tidak diulang otomatis. Hak data serta withdrawal
existing tetap dipertahankan; U04 tidak menutup gate privacy atau UAT data nyata.

Native Laravel Policies dan Gates memakai institution membership, recruiter organization membership, entitlement, resource ownership, dan active tenant context. Frontend visibility tidak pernah menjadi authorization control.

Registrasi publik hanya mahasiswa. Target inti 14 Oktober 2026 mempunyai satu
role Admin Universitas pada universitas yang dikonfigurasi. Admin pertama
diprovisikan melalui operasi deployment terkontrol; admin berikutnya melalui
undangan WhatsApp oleh admin berwenang. Autentikasi ulang yang sesuai dan
audit diperlukan untuk pengelolaan admin. Admin aktif terakhir tidak dapat
dinonaktifkan atau dicabut; pemeriksaan harus tahan terhadap command bersamaan.

Kewenangan mengikuti [matriks PRD](../product/PRD.md#matriks-kewenangan-inti).
Role admin tidak membuka semua resource: draft dan bukti awal profil tetap
privat, bukti kontribusi hanya pada versi yang diajukan untuk peninjauan,
validasi kontribusi sendiri ditolak, dan keputusan tim mengikuti pemilik.
Izin berbagi mahasiswa tidak berubah melalui approval. Bantuan kesempatan
memerlukan peninjau yang ditunjuk, consent, masa akses dan gate; sinyal inklusi
tetap restricted serta tidak tersedia bagi mahasiswa atau perekrut.

U03 memakai satu sumber admin melalui membership verified UTY aktif. Flag
platform lama hanya metadata transisi dan tidak memberi bypass; alias teknis
`campus_admin` bukan role inti lain. Inventaris consumer, job, command, policy
serta jalur pencabutan diperlukan untuk pemetaan eksplisit. Penggabungan
role tidak mempromosikan semua akun lama, menulis ulang audit, atau mengubah
otorisasi modul lanjutan melalui dokumentasi. Perekrut tetap di balik gate
serta provisioning existing, di luar dua role inti.

U02 menyediakan bootstrap `university:provision-admin` hanya melalui CLI
deployment. Default dry run tidak menulis akun, membership atau audit;
`--apply` memerlukan ID eksplisit, alasan, username/password yang sudah
tersimpan serta tepat satu WhatsApp berstatus verified dengan `verified_at`.
Transaksi mengunci institusi, akun, nomor dan membership. Flag platform lama,
membership institusi lain/mahasiswa/suspended serta riwayat admin yang sudah
ada menolak bootstrap baru. Admin yang sama dapat diperiksa ulang tanpa audit
ganda; admin berikutnya memakai undangan atau pemulihan berotorisasi.
Kegagalan audit membatalkan grant. Tidak ada route publik provisioning.

Seeder `UtyJourneySeeder` mengganti sumber seeder akun lama dan hanya menerima
MySQL lokal atau SQLite uji di memori serta storage lokal privat. Verifikasi
nomor pada dataset itu simulasi sintetis, tidak menggantikan OTP identitas
nyata. Tidak mengirim OTP/WhatsApp atau provider lain. Data pengguna existing
dipertahankan; U02 tidak mempromosikan akun lama. U03 menambahkan proteksi
pengelolaan admin terakhir, tanpa menjadikan dataset bukti identitas nyata.

Pengelolaan status admin serta penerbitan/pencabutan undangan memakai
`password.confirm`. Policy dan Action membaca hak aktual, mengunci universitas
sebagai mutex, dan menolak keputusan stale melalui revision atribut plus
audit. Admin terakhir tidak ditangguhkan atau dihapus melalui akun mandiri.
Pengaktifan ulang memerlukan keputusan baru dan WhatsApp verified. Afiliasi
mahasiswa bukan jalur mengubah admin. Undangan menunggu dari issuer yang
ditangguhkan dicabut; worker membatalkan kirim ketika izin tidak lagi ada.

`university:transition-admin` hanya CLI deployment, dengan ID akun eksplisit,
alasan dan dry run default. Apply menyimpan cadangan terenkripsi privat sebelum
grant, lalu mencatat audit dalam transaksi. Akun mahasiswa, membership asing
serta hak suspended tidak dipromosikan otomatis. Rollback memakai receipt
yang diautentikasi enkripsi, menolak konteks/sumber berubah, menjaga admin
terakhir dan menambahkan audit baru. Pemulihan flag historis tidak memulihkan
kewenangan global. Tidak ada endpoint publik pemetaan atau pembacaan cadangan.

Administrasi perekrut/gamifikasi default false melalui konfigurasi terpisah;
pengaktifan memerlukan persetujuan tujuan akses modul, bukan sekadar role admin.
Operasi Talent tetap memerlukan membership organisasi serta entitlement
aktual, tanpa bypass platform. Pencabutan consent, visibility dan akses
recruiter existing tetap berlaku. Hak atas rekomendasi privat tetap kandidat
atau pemilik yang diizinkan, bukan semua admin.

## 4. Tenant Isolation

Peninjauan afiliasi memiliki proyeksi restricted untuk mencocokkan identitas:
`nim` dari pengajuan dan `phone` dari nomor akun dapat dibaca lengkap hanya
setelah Form Request serta query antrean mengizinkan Admin Universitas UTY.
Antrean hanya memuat pengajuan pending universitas yang berwenang, termasuk
ketika dipanggil sebagai deferred/partial Inertia. Nomor yang tidak tersedia
tetap null. Enkripsi kolom dan atribut Hidden pada model tidak dihapus;
serializer mengeluarkan allowlist eksplisit tanpa username, hash atau model
nomor utuh. Data lengkap tidak ditambahkan ke shared props, undangan, direktori,
audit, log, ekspor, broadcast atau proyeksi perekrut. UI menyembunyikan antrean
dan panel sebelumnya ketika akses ditolak. Akses ini untuk verifikasi afiliasi,
bukan izin menyebarkan atau menghubungi mahasiswa di luar tujuan tersebut.

U05 memakai allowlist pada daftar mahasiswa, pengaturan serta akun admin.
Program studi adalah metadata operasional; username, NIM, kontak, bukti awal
dan diskusi tidak dibaca untuk direktori. Undangan memakai nomor masked tanpa
token atau payload provider. Policy pembacaan undangan hanya admin UTY aktual.
Endpoint admin mempertahankan JSON untuk pembacaan dan Inertia untuk browser.
Konfirmasi sandi Fortify terpisah dari command berikutnya; password tidak
disimpan ke storage browser. Validasi membuka isian, stale menjaga revision
asal, dan hasil belum pasti menahan mutasi sampai GET berhasil. HTTP kehilangan
izin menyembunyikan snapshot. Perubahan U05 tidak membuka gate bantuan,
provider atau analitik dan tidak mengubah konfigurasi deployment dari UI.

Setiap protected feature harus diverifikasi untuk same tenant, other tenant,
missing tenant, suspended membership, stale context, queued job, cached
result, storage path, export, dan Reverb channel. Target universitas tunggal
ditentukan dari konfigurasi server dengan status aktif. Konfigurasi kosong,
salah atau tidak aktif menolak akses dan menyediakan pemulihan; ID klien,
institusi pertama atau membership terbaru tidak menjadi fallback.

Admin Universitas hanya memperoleh akses universitas sasaran. Resource,
membership dan payload job tetap harus cocok dengan konteks tersebut;
pencabutan akses diperiksa ulang pada operasi berikutnya. Data lama institusi
lain tetap terlindungi. U03 menutup operasi institusi lintas tenant dan
mengalihkan GET platform lama hanya untuk admin UTY yang berizin.
Route lama, cache, storage/download dan broadcast diuji secara langsung,
bukan hanya melalui visibilitas sidebar. Pemulihan transisi tidak mengembalikan
hak yang sudah dicabut tanpa provisioning berotorisasi.

Resolver U02 membaca ulang slug/status dari database dan menolak resource
tersimpan yang tidak cocok atau identitas model yang diubah di memori.
`university:inspect` hanya membaca inventaris, tanpa password, username atau
nomor WhatsApp. Kedua operasi memeriksa universitas UTY yang dikonfigurasi,
bukan institusi pertama. U03 menghubungkan sumber admin, Policy serta route
administrasi. Integrasi ke seluruh konteks dan aktivasi mahasiswa tetap U04;
keberadaan resolver tidak berarti seluruh transisi UI/migrasi sudah selesai.

## 5. Privacy by Purpose

Portofolio hanya menyediakan private (Hanya saya) dan public (Publik). Command
profil/karya menolak jangkauan institution/recruiter. Nilai historis tidak dihapus
atau dipromosikan menjadi public; proyeksi runtime memperlakukannya privat.
Admin tidak mendapat bypass portofolio privat. Akses peninjauan kontribusi tetap
memakai tujuan dan Policy kontribusi. Semua pembacaan non-pemilik memerlukan
profil serta karya public, sumber approved konsisten, dan tidak withdrawn.
Revisi privasi wajib mencakup state dan audit terakhir, dibandingkan dalam lock;
hasil belum pasti diperiksa GET tanpa retry mutasi otomatis. Publikasi/pencabutan
tetap diaudit append-only. Bukti, kontak dan catatan internal tidak ikut terbuka.

- Phone: auth, invitation, approved important notification, dan consented contact handoff.
- NIM: roster matching dan campus operation.
- Collaboration metadata: matching dan governed inclusion calculation.
- Portfolio: student-controlled public atau recruiter projection.
- Recruiter data: organization verification, entitlement, saved candidate, dan contact.

Data tidak boleh digunakan ulang untuk purpose baru tanpa owning document, notice, lawful basis, dan consent/governance update.

### Bukti Profil T03

T06 membatasi ringkasan pengajuan dan riwayat keputusan kepada pemohon atau
pemilik dengan afiliasi mahasiswa verified dalam institusi aktif proyek.
Anggota lain dan operator tidak mendapat antrean, jawaban atau alasan pelamar.
Serializer memeriksa Policy sebelum membaca. Tidak mengambil metadata bukti
profil, portofolio privat, kontak, NIM, sinyal inklusi atau catatan internal.
Alasan keputusan memang dibagikan kepada pemohon; UI menjelaskan tujuan ini.
Notifikasi mengarahkan ke sumber berizin tanpa membawa jawaban atau alasan
sensitif ke kanal lain. Retensi dan pilot data nyata tetap mengikuti gate pemilik.

Ringkasan karya T06 memakai allowlist entry portofolio (ID, judul, ringkasan,
label pengakuan) dengan profil dan karya public, belum ditarik dan sumber
approved versi aktual. Query memeriksa konsistensi pemilik, institusi, kontribusi
dan versi; akses detail tetap memakai PortfolioEntryPolicy. Tidak mengambil
metadata bukti profil, isi bukti kontribusi atau catatan reviewer. Query karya
berbagi hanya berjalan untuk pemilik proyek, bukan seluruh pembaca proyek.

Preview proyek privat T06 hanya bagi pemilik, anggota aktif, atau penerima
undangan pending belum kedaluwarsa dengan afiliasi mahasiswa verified di
institusi proyek. Preview tidak membuka task, attachment, diskusi atau
workspace. Policy endpoint command tetap memeriksa penerima dan kondisi
terbaru. Pemohon pending tanpa undangan tidak otomatis memperoleh izin privat.

Bukti awal pada metadata keahlian hanya dapat dibaca pemilik dengan afiliasi
mahasiswa terverifikasi dalam institusi aktif. Tidak menambah izin campus,
teammate, perekrut atau publik; reviewer tetap memakai bukti pengajuan
Kontribusi yang sudah diotorisasi. Jangkauan portofolio tidak mengubah batas
ini. Metadata baru memakai allowlist judul dan URL HTTPS, tanpa verifikasi
kiriman klien, ID sumber persetujuan, token, kredensial URL, IP atau private
host. URL tidak di-fetch, di-preview atau di-embed; tautan eksternal memakai
noopener/noreferrer serta pemberitahuan kendali akses pada penyedia tujuan.
Metadata legacy tetap tersimpan jika tidak diubah, tetapi tidak dijadikan
tautan tanpa memenuhi kontrak. Tidak ada unggah berkas profil baru.

Audit profil mencatat jenis perubahan dan jumlah, bukan URL bukti atau isi
metadata. Proyeksi Talent dan portofolio publik tetap allowlisted tanpa
metadata bukti awal. Peninjauan dan persetujuan kontribusi dibaca dari sumber
database; tidak mempercayai label verified kiriman mahasiswa. Kontrak lokal
ini tidak menutup gate retensi, lawful basis, DPIA atau pilot data nyata.

### Batas Pengakuan Individual T08

Detail kontribusi, pernyataan dan catatan keputusan terbatas pada pemilik
dengan akses proyek/kampus serta operator berwenang untuk versi bukan draft.
Rekan tim tetap dapat membaca bukti asli ruang kerja sesuai izin existing,
tetapi tidak otomatis mendapat catatan individual atau keputusan mahasiswa
lain. Operator tidak membaca unggahan tanpa rujukan pengajuan, dan tidak dapat
meninjau kontribusi sendiri. Draft revisi belum diajukan tidak masuk antrean.

Bukti harus berasal dari proyek yang sama, purpose evidence, path managed
pada disk privat, masih aktif serta tersedia saat submit/approval. Reviewer
dapat meminta revisi/menolak ketika bukti hilang; alasan perlu ditulis.
Download tetap melewati Policy, tidak memakai URL storage publik. Key path,
hash berkas, pernyataan, catatan dan audit tidak masuk portofolio publik atau
perekrut. Ringkasan diberi pemberitahuan bahwa dapat dibagikan; approval hanya
membuat karya privat. Pencabutan menghilangkan exposure pada pembacaan berikutnya,
bukan menghapus history atau menarik salinan yang sudah diunduh pembaca.

Standar bukti final, reviewer pilot, waktu/SLA, dasar pemrosesan dan retensi
belum disepakati oleh implementasi. Panduan teknis dan uji sintetis tidak
menutup gate atau mengotorisasi pilot data nyata.

## 6. Responsible Matching dan Inclusion

Matching versioned, explainable, and auditable. Connectivity opportunity boleh membantu membuka peluang, tetapi tidak boleh mengungkapkan inclusion status.

Implementasi T05 memakai kebijakan uji `opportunity-v2-neutral`: konektivitas
konstan netral dan tidak membaca CollaborationEvent atau inclusion graph.
Snapshot hanya menyimpan keahlian/minat/jadwal matching serta kebutuhan peran;
bukti awal profil, kontak, NIM dan pesan tidak menjadi input. Job dan refresh
memeriksa kandidat dengan afiliasi mahasiswa terverifikasi dalam institusi
aktif. Peluang privat, penuh, lewat tenggat, milik kandidat atau tim yang sudah
diikuti tidak menjadi rekomendasi baru. Serialisasi mengizinkan hanya alasan
aman, versi, peran dan keterbatasan; snapshot/digest/konektivitas tidak masuk
browser. Default produksi terkunci; membuka konfigurasi bukan pengganti
keputusan bobot, lawful basis, notice, retensi, UAT atau tinjauan fairness.

Forbidden:

- menganalisis message content untuk sentiment, mental state, atau diagnosis;
- menampilkan inclusion signal kepada student, teammate, atau recruiter;
- memakai inclusion atau connectivity sebagai leaderboard input;
- membuat adverse decision atau counseling escalation otomatis;
- menyatakan correlation sebagai diagnosis.

Real-data inclusion activation membutuhkan DPIA, lawful basis, retention, notice, access control review, fairness review, feature flag approval, dan human review procedure. Synthetic demo tidak melewati gate menjadi real processing.

## 7. Gamification Integrity

Persetujuan memerlukan expected_version (nol sebelum record pertama) dan halaman
lama harus GET sebelum command baru. Nomor individual disesuaikan sesudah izin
aktual disaring. Guard pekerjaan identik terbatas owner/proyek/tugas, tanpa
membuka bukti anggota lain. Rekonsiliasi XP hanya universitas terkonfigurasi dan
approved tanpa award. Roster baru bukan fallback untuk semester historis yang
belum valid. Log listener memuat ID sumber/kelas exception, bukan klaim/bukti.

XP hanya dari approved contribution dengan idempotent source. Reversal tidak menghapus ledger history. Badge rule version disimpan dan perubahan rule tidak menulis ulang award history. Badge evaluation hanya memakai approved contribution dan approved review, tidak membaca message, private evidence, inclusion signal, atau connectivity opportunity. Award memiliki idempotency key per user, institution, definition, dan rule version. Source explanation hanya memuat reference contribution, version, dan safe label.

Badge taxonomy dikelola melalui definition immutable dan rule version yang hanya dapat dibuat oleh platform admin. Automatic issuance memakai active rule, sedangkan manual issuance dan revocation memerlukan campus reviewer pada institution yang sama dengan reason yang diaudit. Revocation memiliki history append-only dan tidak menghapus award.

Cohort di bawah lima disuppress. Individual ranking default off. Anti-abuse review mencakup duplicate evidence, repeated submission, collusion, inactive member manipulation, dan unauthorized reviewer.

XP award memverifikasi status contribution, approved review, dan konsistensi
institution dengan project sebelum menulis ledger. Unique idempotency key
mencegah retry atau concurrent event menggandakan award. Consumer approval
berjalan setelah commit dan retryable melalui queue. Ledger update/delete
ditolak pada model serta database layer, sementara reversal memakai row baru
dan audit reason code.

Leaderboard projection hanya mengagregasi verified XP dari approved contribution
source dalam institution dan semester yang sama. Active member harus memiliki
verified membership, active roster row, dan verified contribution. Program dan
team projection disuppress saat cohort kurang dari lima. Individual projection
default off dan hanya membaca preference opt-in student pada tenant yang sama.
Skor dan total XP kelompok yang dilindungi tidak dikirim ke browser, termasuk
melalui deferred props. Jumlah anggota dan alasan perlindungan tetap dapat
dibaca. Ringkasan XP pribadi hanya dikirim kepada pemilik, tidak kepada admin.
Snapshot digest, unique job key, dan append-only projection rows menjaga rebuild
tetap deterministic dan idempotent. Evaluasi tidak membaca message, evidence
privat, inclusion signal, atau connectivity opportunity.

## 8. Talent Boundary

Recruiter membutuhkan verified organization, membership, dan active entitlement. Search membaca allowlisted projection. Username, NIM, phone, private evidence, discussion, raw audit, matching input, dan inclusion data dilarang.

Contact request tidak langsung membuka phone. Student accept menjadi explicit consented handoff. Visibility withdrawal menghentikan projection baru. Entitlement expiration menolak search/action baru.

## 9. Provider dan File Security

Fonnte dan academic provider token disimpan sebagai server secret. HTTP request memakai timeout, safe retry, TLS, redacted log, idempotency, dan validated callback. No unofficial package mendapat token tanpa review.

Private attachment memakai non-public storage, randomized path, authorized download, MIME/size validation, malware strategy sebelum production, dan retention. Filename tidak dipercaya sebagai content type.

## 10. Realtime Security

Channel authorization memeriksa active membership dan resource relationship. Event payload allowlisted. Broadcast dilakukan after commit. Permission revocation, reconnect, duplicate, and stale subscription harus diuji.

T07 menambahkan delta bukti tanpa pesan pada channel workspace existing, bukan
channel publik. Endpoint daftar memakai izin ruang kerja mahasiswa dan proyek
aktual, tidak memperluas akses perekrut atau operator. Download/preview tetap
memakai AttachmentPolicy serta path privat terkelola. Pencabutan izin dari
respons 403/404 menyembunyikan data privat klien dan melepas subscription.
Kegagalan jaringan tidak dianggap rollback; command ulang ditahan sampai
pembacaan baru berhasil. Pemeriksaan daftar dan penolakan checksum duplikat
mendukung pemulihan unggah tanpa retry mutasi otomatis. Strategi malware dan
retensi tetap merupakan gate produksi, bukan diselesaikan oleh T07.

## 11. Audit dan Observability

Catat privileged invitation, affiliation decision, contribution review, XP/badge mutation, leaderboard publication, inclusion review, entitlement, contact handoff, mapping, sync retry, consent, export, dan data-right outcome.

Jangan log OTP, password, token, full phone, full NIM, message content, private evidence URL, inclusion detail, atau provider raw payload. Gunakan correlation ID dan sanitized reason code.

## 12. Data Rights dan Retention

Access, correction, consent withdrawal, visibility withdrawal, restriction, dan deletion memiliki verified request flow. Append-only records dipertahankan hanya sesuai approved lawful purpose dan period. Retention matrix, WhatsApp privacy notice, DPIA, serta escalation owner adalah human governance gate.

## 13. Release Gates

### Synthetic demo

Tenant isolation, fake provider, no real phone dataset, synthetic label, secret scan, accessibility, dan truth review.

### Pilot

DPIA/lawful basis, roster agreement, retention, incident owner, Fonnte notice, backup/restore, reviewer training, dan support process.

### Production

Threat model review, penetration test plan, provider SLA/recovery, MySQL/load verification, data-right drill, cross-tenant regression review, and final human approval.

## T09: Izin Bantuan dan Ringkasan Operasional

Bantuan kesempatan terpisah dari InclusionSignal. Peninjau harus tercantum pada konfigurasi institusi serta masih memiliki afiliasi CampusAdmin terverifikasi. Pemilik harus mahasiswa terverifikasi untuk mengajukan. Setiap pembacaan/keputusan kampus memeriksa izin per berkas, notice/governance/manifest aktual, expiry, afiliasi pemilik, dan tenant. Pencabutan tidak membutuhkan gate aktif atau afiliasi yang masih terverifikasi, agar mahasiswa tidak kehilangan kendali datanya.

Konfigurasi default tidak aktif dan tidak menganggap lingkungan lokal berarti data synthetic. Synthetic dibatasi pada database pengujian terisolasi; pemrosesan nyata memerlukan referensi persetujuan dan approval nyata eksplisit. Ringkasan agregat membutuhkan persetujuan evaluasi terpisah serta minimum kelompok khusus tanpa default rekaan. Batas akses tidak menggantikan kebijakan retensi penyimpanan, DPIA, reviewer pilot atau UAT.

Tidak ada notifikasi eksternal, auto-contact, analisis pesan, perluasan bukti profil atau proyeksi perekrut. Mutasi memakai lock, pemeriksaan ulang Policy, command key atau revisi, audit minimal serta consent/event append-only dalam satu transaksi. Tidak mengaktifkan engine/graf inklusi atau pencocokan.

Agregat T09 menekan nilai ketika populasi, numerator atau komplemen nonnol
lebih kecil daripada minimum yang disetujui. Nilai suppressed berbeda dari
sumber unavailable. Tidak menyediakan segmentasi, persentase, tooltip, ekspor
atau identitas yang dapat memulihkan sel kecil dari proyeksi ini.

## T10: Isolasi Demo dan Batas Kelulusan

Demo publik hanya menggunakan contoh lokal dan tidak menyimpan progres akun.
Seeder perjalanan menolak database pengguna, production, manifest tidak
sesuai, SQLite file serta database berisi data. Reset hanya mengganti database
memori milik proses uji. Berkas dibuat pada direktori sementara khusus.
Provider HTTP fake dan broadcasting null mencegah pengiriman nyata;
pengujian browser mencegat mutasi dan menggunakan aktor synthetic.

Tes positif dan negatif tenant, projection, snapshot stale, append-only,
rollback dan withdrawal tetap wajib di runner. Hasil SQLite tidak merupakan
bukti concurrency atau load MySQL. Studi peserta nyata, final UAT, DPIA,
retensi, malware strategy, standar bukti, pemilik insiden, provider serta
backup/restore produksi tetap gate manusia/deployment. Tidak ada gate yang
ditutup, akun privileged nyata yang dibuat, atau fitur data nyata diaktifkan.

## U06: Batas Pengujian MySQL

Runner MySQL transisi hanya menerima local/testing, host loopback dan schema
acak baru yang dimiliki eksekusi uji. Schema aplikasi tidak menjadi target
migration atau restore. Worker dan cleanup memeriksa nonce serta penanda
kepemilikan; nama/path bebas dari CLI tidak diterima. Guard penolakan diuji
tanpa koneksi MySQL. Receipt dan bukti synthetic memakai storage sementara
terpisah, provider dilarang, cache array serta broadcast null.

Pengujian dua worker membuktikan row-lock contention pada penangguhan admin
dan approval versi sama. Restore logical menyertakan trigger append-only serta
pemeriksaan foreign key, bukan hanya kecocokan jumlah baris. Hasil ini tidak
membuktikan beban production, transport Reverb, Redis/provider nyata, UAT atau
persetujuan pemrosesan data UTY. Gate yang masih terbuka tetap tidak berubah.
