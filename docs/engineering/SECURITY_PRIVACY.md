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

Native Laravel Policies dan Gates memakai institution membership, recruiter organization membership, entitlement, resource ownership, dan active tenant context. Frontend visibility tidak pernah menjadi authorization control.

Open registration hanya student. Campus admin dan recruiter diprovisikan melalui invitation serta review. Platform admin tidak dapat dibuat dari public flow.

## 4. Tenant Isolation

Setiap protected feature harus diverifikasi untuk same tenant, other tenant, missing tenant, suspended membership, stale context, queued job, cached result, storage path, export, dan Reverb channel. Platform operations memakai explicit audited scope.

## 5. Privacy by Purpose

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
label pengakuan) dengan visibility institution/public, belum ditarik dan sumber
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
