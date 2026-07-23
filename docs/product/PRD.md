# Product Requirements Document: SATU

## 1. Ringkasan

SATU adalah platform kolaborasi non-akademik untuk mahasiswa. Produk membantu mahasiswa menemukan project dan rekan tim, bekerja dalam workspace bersama, membuktikan kontribusi, memperoleh validasi institusi, dan membangun portofolio. Kampus memperoleh alat operasional untuk memverifikasi aktivitas dan meninjau risiko eksklusi kolaboratif tanpa melakukan diagnosis kesehatan mental.

Target jangka panjang adalah product production untuk banyak institusi. Increment pertama selama 4–8 minggu dibatasi pada core loop mahasiswa dan kampus.

## 2. Problem

1. Peluang project sering beredar di lingkaran sosial yang sudah terbentuk.
2. Mahasiswa di luar lingkaran tersebut kesulitan menunjukkan kesiapan dan menemukan tim.
3. Kampus mencatat output akhir, tetapi tidak memiliki jejak kontribusi individual yang konsisten.
4. Portofolio mahasiswa sering berisi klaim tanpa provenance institusional.
5. Recruiter sulit membedakan partisipasi nominal dan kontribusi yang dapat diverifikasi.

SATU tidak bertujuan mendiagnosis kesepian, depresi, atau kondisi psikologis lain.

## 3. Pengguna dan Jobs to Be Done

### Student

- Menemukan project yang cocok dengan skill, availability, dan tujuan.
- Memahami mengapa sebuah project atau tim direkomendasikan.
- Berkoordinasi dan menyelesaikan task tanpa berpindah alat.
- Membuktikan kontribusi individual.
- Mengendalikan visibilitas portofolio.

### Campus admin

- Memverifikasi afiliasi mahasiswa.
- Mengawasi project dan aktivitas yang membutuhkan perhatian operasional.
- Meninjau contribution evidence dan memberi keputusan yang dapat diaudit.
- Meninjau inclusion signal dengan human judgment dan batas privasi yang ketat.
- Mengekspor atau menyinkronkan kredit kegiatan pada fase integrasi.

### Recruiter

- Menemukan kandidat melalui skill dan verified contribution.
- Melihat hanya informasi portofolio yang diizinkan.
- Menyimpan kandidat dan mengirim contact request.

Recruiter termasuk target production, bukan increment pertama.

### Platform admin

- Mengelola institution, domain verification, abuse response, dan operasional lintas tenant.
- Tidak boleh menggunakan hak operasional untuk mengekspos data terbatas tanpa alasan dan audit.

## 4. Product Goals

### Outcome pengguna

- Lebih banyak mahasiswa menerima dan mengambil peluang project yang relevan.
- Waktu dari pencarian project hingga tim terbentuk berkurang.
- Contribution dapat dilacak dari task hingga validasi dan portofolio.
- Kampus dapat menyelesaikan review tanpa spreadsheet terpisah.

### Outcome bisnis

- Satu kampus dapat menjalankan pilot selama satu semester.
- Talent Portal menghasilkan alasan yang cukup kuat bagi perusahaan untuk menguji subscription.
- Product menghasilkan evidence operasional yang dapat dipakai untuk memperluas institusi.

### Non-goals increment pertama

- Diagnosis atau prediksi kesehatan mental.
- SSO kampus wajib.
- Sinkronisasi production dengan seluruh sistem akademik.
- Cross-institution project.
- Recruiter billing dan subscription production.
- Model machine learning yang belajar otomatis.
- Mobile native application.

## 5. Prinsip Scope

| Tingkat           | Definisi                                                                         |
| ----------------- | -------------------------------------------------------------------------------- |
| Production vision | Seluruh lifecycle mahasiswa, kampus, recruiter, multi-institution, dan integrasi |
| Increment 1       | Student + campus core loop pada satu institution, tetap tenant-aware             |
| Demo              | Data synthetic yang diberi label dan tidak dipresentasikan sebagai hasil pilot   |

## 6. Functional Requirements

### FR-01: Identity dan institution membership

- Pengguna dapat mendaftar secara terbuka melalui email dan password.
- Email pengguna harus diverifikasi sebelum mengakses collaboration features.
- Pengguna dapat meminta afiliasi ke sebuah institution.
- Membership menjadi `verified` melalui domain email yang disetujui atau keputusan campus admin.
- Pengguna tanpa membership `verified` dapat melengkapi profil dan mengeksplorasi informasi yang diizinkan, tetapi tidak memperoleh verified credit.
- Campus admin dan recruiter tidak diperoleh melalui pilihan role saat registrasi umum.

### FR-02: Profile, skill, dan availability

- Student dapat mengelola bio singkat, program studi, cohort, skill, proficiency evidence, interest, dan availability.
- Setiap skill memakai taxonomy yang dikelola; free text boleh diusulkan tetapi tidak langsung menjadi taxonomy resmi.
- Student dapat mengendalikan visibility portofolio dan recruiter discoverability secara terpisah.
- Profile completeness menjelaskan data yang kurang tanpa memblokir semua penggunaan.

### FR-03: Project lifecycle

- Student yang memenuhi policy dapat membuat draft project.
- Project memiliki institution, owner, type, title, summary, outcome, deadline, capacity, required skills, dan status.
- Lifecycle minimum: `draft`, `open`, `forming`, `active`, `completed`, `cancelled`, `archived`.
- Owner dapat membuka role, meninjau kandidat, mengundang, menerima, atau menolak dengan alasan yang aman.
- Project tidak boleh menjanjikan kredit kampus sebelum memenuhi validation policy.

### FR-04: Explainable matchmaking

- Recommendation memakai versi scoring yang tersimpan.
- Dimensi minimum: `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`.
- UI menampilkan dua atau tiga alasan terkuat, bukan skor psikologis atau ranking popularitas.
- Student dapat menyembunyikan recommendation, menyatakan tidak relevan, atau memperbaiki profil.
- Campus admin dapat melihat agregat kualitas matching, bukan detail komersial recruiter.
- Perubahan bobot harus melalui decision log, fairness evaluation, dan versioning.

### FR-05: Team formation

- Student dapat menerima atau menolak invitation.
- Capacity dan membership transition harus atomic untuk mencegah anggota melebihi slot.
- Team membership minimum: `invited`, `requested`, `active`, `left`, `removed`, `completed`.
- Keputusan removal membutuhkan authorization dan audit reason.

### FR-06: Realtime workspace

- Workspace menyediakan task, assignee, status, priority, due date, discussion, evidence attachment, dan member presence.
- Initial state berasal dari server. Laravel Reverb mengirim delta setelah perubahan tersimpan.
- Event hanya dikirim ke private/presence channel yang diotorisasi.
- UI menangani reconnect, duplicate event, stale state, upload progress, dan delivery failure.
- Refresh penuh tetap dapat memulihkan state yang benar.

### FR-07: Contribution dan validation

- Student mengajukan contribution dari task dan evidence yang terkait.
- Reviewer dapat `approve`, `request_revision`, atau `reject` dengan alasan.
- Keputusan menyimpan reviewer, timestamp, policy version, dan audit entry.
- Approved contribution dapat menghasilkan portfolio entry dan activity credit.
- Perubahan setelah approval menghasilkan versi baru; history tidak ditimpa.

### FR-08: Portfolio

- Student memilih item yang ditampilkan kepada publik atau recruiter.
- Portfolio membedakan `self_reported`, `team_confirmed`, dan `institution_verified`.
- Recruiter tidak dapat melihat inclusion signal, raw collaboration graph, private discussion, atau alasan admin.
- Student dapat menonaktifkan recruiter discoverability tanpa menghapus data project.

### FR-09: Campus operations

- Campus admin memiliki queue untuk membership verification dan contribution review.
- Dashboard menampilkan workload dan outcome operasional, bukan leaderboard individu.
- Admin dapat memfilter berdasarkan program, project, status, dan tanggal sesuai scope institution.
- Semua tindakan sensitif membutuhkan authorization, reason bila relevan, dan audit log.

### FR-10: Inclusion review

- Sistem dapat membuat inclusion signal dari metadata graf kolaborasi yang cukup.
- Signal tidak dibuat saat data minimum belum terpenuhi.
- Signal menjelaskan faktor operasional seperti rendahnya invitation atau partisipasi, bukan kondisi mental.
- Campus admin dapat `acknowledge`, `dismiss`, atau mencatat outreach.
- Tidak ada pesan otomatis yang memberi tahu student bahwa mereka “rentan” atau “terisolasi”.

### FR-11: Talent Portal

- Recruiter organization dan membership diverifikasi sebelum pencarian kandidat.
- Search hanya memakai recruiter-visible fields.
- Contact request tidak membagikan alamat pribadi tanpa tindakan student.
- Subscription dan billing merupakan fase lanjutan dengan entitlement terpisah.

### FR-12: Institution integration

- Integrasi akademik memakai adapter contract dan idempotent sync record.
- Tidak ada integrasi yang boleh mengubah nilai akademik atau IPK.
- Kegagalan sinkronisasi dapat diulang tanpa menggandakan kredit.

## 7. Quality Requirements

### Security dan privacy

- Semua query tenant-owned harus memiliki institution context dan policy.
- Sensitive data tidak dicatat di log atau broadcast payload.
- Evidence file memakai private storage dan authorized download.
- Inclusion signal dan audit log memiliki access boundary terpisah.
- Consent, access, correction, export, deletion, dan retention harus terdokumentasi sebelum pilot.

### Reliability

- Database adalah source of truth.
- Broadcast terjadi setelah commit dan dapat gagal tanpa membatalkan data utama.
- Command yang berisiko duplicate memakai idempotency atau atomic constraint.
- Queue job mendefinisikan retry, timeout, dan failure handling.

### Performance

- Initial dashboard response memprioritaskan next action; data berat boleh deferred.
- List menggunakan pagination dan explicit ordering.
- Query utama memiliki index dan diuji terhadap data realistis.
- Reverb connection tidak mengirim event lintas tenant.

### Accessibility

- Target WCAG 2.2 Level AA.
- Seluruh fungsi utama dapat dipakai dengan keyboard.
- Status memakai text/icon selain warna.
- Authentication, form error, drag-and-drop, modal, focus, dan reconnect memiliki alternatif yang dapat diakses.

## 8. Success Metrics

### Activation

- Persentase student yang menyelesaikan profil minimum.
- Persentase student yang melihat match explanation dan mengambil tindakan.
- Median waktu dari registrasi verified hingga bergabung ke project.

### Collaboration

- Project fill rate.
- Invitation acceptance rate.
- Task completion dan contribution submission rate.
- Persentase project lintas program studi.

### Inclusion

- Persentase student dengan konektivitas rendah yang menerima peluang relevan.
- Perubahan distribusi invitation dan active membership.
- Outcome outreach yang dicatat manusia.

Metrik ini adalah proxy partisipasi, bukan diagnosis kesejahteraan.

### Institution dan business

- Median review turnaround time.
- Persentase contribution yang selesai tanpa revision kedua.
- Jumlah kampus yang menyelesaikan pilot.
- Recruiter search-to-contact dan contact-to-response rate pada fase Talent Portal.

Target penurunan isolasi 30% dari proposal dicatat sebagai hypothesis dan harus diredefinisi menjadi metrik partisipasi yang tervalidasi sebelum dipakai sebagai klaim.

## 9. Increment 1 Acceptance

Increment pertama dianggap selesai ketika:

1. Student dapat mendaftar, memverifikasi email, meminta afiliasi, dan memperoleh status verified.
2. Student dapat melengkapi skill profile, menemukan project, memahami recommendation, dan bergabung ke team.
3. Team dapat menggunakan realtime workspace untuk task, discussion, dan evidence.
4. Student dapat mengajukan contribution; campus admin dapat memvalidasi dengan audit history.
5. Approved contribution muncul di portfolio dengan provenance yang benar.
6. Campus admin dapat meninjau workload dan inclusion queue tanpa melihat data lintas institution.
7. Critical flows memiliki feature, policy, matching, Reverb, dan browser tests.
8. Tidak ada UI atau payload recruiter yang mengekspos inclusion signal.

## 10. Dependencies dan Gates

- Institution pilot dan domain email yang disetujui.
- Validation policy dan pihak yang berwenang menyetujui contribution.
- Data retention schedule.
- DPIA dan legal review sebelum pemrosesan inclusion signal pada pengguna nyata.
- Reverb deployment dan process supervision.
- MySQL production environment.
- Real content untuk demo; synthetic content harus diberi label.
