# Product Requirements Document: SATU

## 1. Ringkasan

SATU adalah platform kolaborasi dan talenta universitas. Rilis perlombaan membuktikan satu alur utuh pada satu kampus: aktivasi student, pembentukan dan operasi tim, validasi kontribusi, portfolio dan gamification, campus operations, gated inclusion review, Talent Portal, academic sandbox, serta public landing dengan synthetic demo.

Semua kapabilitas pada dokumen ini adalah target sampai issue implementasinya selesai. Status pekerjaan hanya tercatat pada GitHub issues dan milestones.

## 2. Problem

- Peluang proyek sering beredar pada lingkaran sosial yang sudah terbentuk.
- Kontribusi non-akademik sulit diverifikasi dan diproyeksikan menjadi portfolio yang dipercaya.
- Kampus memerlukan operasi yang efisien tanpa menjadikan analitik sebagai diagnosis.
- Recruiter memerlukan evidence yang relevan tanpa memperoleh data privat atau inclusion signal.

## 3. Actor dan Jobs to Be Done

### Student

Mendaftar dengan nomor WhatsApp, memverifikasi afiliasi, menjelaskan skill dan availability, menemukan proyek atau teammate, bekerja, mengajukan kontribusi, mengelola portfolio, memilih leaderboard individual, dan mengatur visibility Talent Portal.

### Campus admin dan reviewer

Mengelola roster dan affiliation review, memvalidasi kontribusi, memonitor partisipasi, meninjau inclusion signal yang telah diizinkan governance, mengelola mapping kredit, dan menangani sync akademik.

### Recruiter

Bergabung pada recruiter organization yang diverifikasi, menggunakan entitlement aktif, mencari kandidat dari recruiter-safe projection, menyimpan kandidat, dan mengirim contact request.

### Platform admin

Menyetujui institution, mengundang campus admin melalui WhatsApp, memverifikasi recruiter organization, mengatur entitlement, dan mengawasi provider serta audit lintas tenant.

## 4. Release Goals

- Menyediakan end-to-end demo yang interaktif, accessible, responsive, dan konsisten dengan visual world Buku Besar Kolaborasi.
- Memisahkan account, campus affiliation, portfolio visibility, recruiter access, dan inclusion authorization.
- Menyimpan source of truth pada database dan menggunakan realtime hanya untuk authorized deltas setelah commit.
- Menyediakan sandbox yang dapat didemonstrasikan tanpa menyatakan integrasi kampus nyata telah aktif.

## 5. Functional Requirements

### FR-01 Identity dan affiliation

- Registrasi terbuka hanya membuat normal student account.
- Login memakai private username dan password. Username tidak boleh diproyeksikan ke UI selain login/account security.
- Nomor WhatsApp disimpan dalam format E.164, diverifikasi dengan OTP yang dibuat SATU, memiliki expiry, rate limit, attempt limit, replay protection, dan audit aman.
- Password recovery menggunakan verified WhatsApp.
- Institution affiliation terverifikasi lewat exact match NIM dan verified phone pada roster aktif. Mismatch masuk manual review.
- Platform admin menyetujui institution dan mengundang campus admin melalui WhatsApp.

### FR-02 Profile dan notification

- Student mengelola display name, program studi, bio, skill, proficiency, interest, availability, dan preference.
- Notification center adalah sumber canonical. Unread state, deep link, mark-read, dan preference harus tersedia.
- WhatsApp dibatasi untuk auth, invitation, deadline atau revision penting, contact, dan security event.

### FR-03 Project, matching, dan team

- Project memiliki lifecycle, kebutuhan role dan skill, capacity, visibility, serta institution scope.
- Discovery memiliki filter yang URL-addressable dan state lengkap.
- Matching versioned memakai `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`, disertai explanation dan feedback.
- Team transition atomik dan diautorisasi Policy.

### FR-04 Realtime workspace

- Workspace menyediakan task, assignment, discussion, private attachment/evidence, deadline, dan presence.
- Laravel Reverb dan Echo mengirim authorized delta setelah database commit.
- Reconnect harus melakukan reconciliation terhadap database source of truth.

### FR-05 Contribution dan portfolio

- Student mengirim contribution version beserta evidence.
- Campus reviewer dapat approve, request revision, atau reject langsung. Team confirmation tidak diperlukan.
- History review append-only dan seluruh perubahan sensitif diaudit.
- Hanya approved contribution yang dapat menjadi verified portfolio entry dan XP.
- Student mengontrol visibility per portfolio entry dan recruiter discoverability.

### FR-06 Gamification

- Verified XP disimpan dalam append-only ledger dengan source yang idempotent.
- Badge memakai taxonomy dan versioned issuance rule.
- Leaderboard program studi dan tim aktif secara default. Leaderboard individual memerlukan opt-in.
- Periode leaderboard adalah semester. Score kelompok adalah average verified XP per active member, minimum cohort lima, dan tie memakai shared rank.
- Inclusion signal dan connectivity opportunity tidak boleh memengaruhi ranking.

### FR-07 Campus operations dan inclusion

- Campus surface memuat roster import, affiliation queue, contribution queue, participation overview, dan academic sync operations.
- Collaboration graph dan inclusion engine production-ready berada di balik Laravel Pennant.
- Data synthetic dapat dipakai untuk demo. Data nyata memerlukan DPIA, lawful basis, retention, notice, dan human governance.
- Inclusion signal hanya tersedia bagi role yang berwenang dan tidak menghasilkan adverse action otomatis.

### FR-08 Talent Portal

- Recruiter organization dan membership diverifikasi platform.
- Access membutuhkan internal entitlement. Billing provider dan harga tidak termasuk rilis.
- Search memakai recruiter-safe projection dan hanya mencakup student serta entry yang visible.
- Recruiter dapat menyimpan kandidat dan membuat contact request.
- Student dapat accept, decline, atau mencabut visibility. Contact penting dapat memicu WhatsApp tanpa membocorkan data privat.

### FR-09 Academic integration

- Provider berada di balik contract dengan sandbox adapter sebagai baseline.
- Campus admin mengelola mapping aktivitas atau badge ke kredit kegiatan.
- Sync job idempotent, retryable, observable, dan memiliki failure review queue.
- Koneksi API kampus nyata adalah external gate.

### FR-10 Public landing

- Landing menjelaskan nilai SATU secara jujur untuk student, campus, dan recruiter.
- Interactive graph demo memakai synthetic data dan label yang jelas.
- Tidak boleh ada klaim pelanggan, harga, testimoni, hasil pilot, atau impact yang belum terbukti.

## 6. Quality Requirements

- WCAG 2.2 AA, keyboard complete, visible focus, reduced motion, status selain warna, dan responsive dari mobile sampai desktop.
- Tenant isolation mencakup query, Policy, job, cache, storage, export, dan broadcast.
- Sensitive projection dites dengan explicit allowlist dan negative serialization test.
- MySQL adalah target production. SQLite hanya untuk test ringan yang kompatibel.
- Queue operation harus idempotent, retryable, dan dapat direkonsiliasi.
- Fonnte token dan secret lain hanya berada pada server-side configuration.

## 7. Acceptance Rilis Perlombaan

- Seluruh milestone M0 sampai M9 selesai atau memiliki external gate yang didokumentasikan tanpa klaim palsu.
- Critical browser flows lulus pada mobile dan desktop.
- Security, privacy, cross-tenant, accessibility, performance, dan recovery gate lulus.
- Synthetic demo dapat direset dan dibedakan jelas dari real data.
- Human approval tersedia untuk visual reference, governance activation, dan final UAT.

## 8. Non-goals

- Kapabilitas Bab 4.2 proposal.
- Multi-campus production rollout pada rilis pertama.
- Billing provider, production pricing, atau payment collection.
- Analisis isi pesan, sentiment, kondisi psikologis, atau diagnosis.
- Academic grading atau penggunaan IPK sebagai input matching.
- Auto-escalation menuju layanan kesehatan atau adverse decision otomatis.

## 9. Gates

- Pilot institution, roster format, dan active-member definition.
- DPIA, lawful basis, retention, WhatsApp notice, dan data-right procedure.
- Academic credit mapping dan pilot API contract.
- Talent entitlement serta recruiter verification policy.
- Final UAT dan approval visual.

Gate diselesaikan melalui issue berlabel `gate:human`, `gate:external`, atau `gate:conditional`. Keputusan tidak boleh ditutup melalui asumsi implementer.
