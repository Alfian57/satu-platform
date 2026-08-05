# Product

<!-- impeccable:product-schema 1 -->

## Identitas Produk

SATU adalah Sistem Aktivitas Talenta Universitas. Produk yang diajukan pada perlombaan adalah platform SATU, bukan sistem untuk mengelola perlombaan.

SATU membantu mahasiswa menemukan peluang kolaborasi, membentuk tim, bekerja bersama, memperoleh validasi kampus atas kontribusi, membangun portofolio, dan memilih apakah profil profesionalnya dapat ditemukan recruiter. Kampus memperoleh alat operasi untuk memverifikasi afiliasi, meninjau kontribusi, memahami peluang keterlibatan, dan menyinkronkan kredit kegiatan. Recruiter memperoleh Talent Portal yang hanya menampilkan proyeksi data yang diizinkan mahasiswa.

## Batas Rilis

Rilis perlombaan mencakup seluruh kapabilitas proposal kecuali bagian Bab 4.2 yang dinyatakan sebagai pengembangan lanjutan. Implementasi awal beroperasi pada satu kampus pilot, tetapi seluruh data tenant-owned tetap institution-scoped agar ekspansi lintas institusi tidak memerlukan perubahan model keamanan.

Target rilis meliputi:

- identity berbasis private username, password, dan verifikasi nomor WhatsApp;
- afiliasi kampus melalui exact match NIM dan verified phone pada roster, dengan manual review sebagai recovery;
- profil, skill, availability, proyek, explainable matching, pembentukan tim, dan realtime workspace;
- kontribusi yang divalidasi langsung oleh campus reviewer, portfolio, XP, badge, dan hybrid leaderboard;
- campus operations dan Social Network Analysis yang production-ready di balik feature flag;
- Talent Portal dengan internal entitlement, tanpa billing provider atau harga produksi;
- academic integration melalui adapter, sandbox, mapping, dan operasi sync;
- public landing dan interactive synthetic demo yang tidak membuat klaim hasil pilot.

## Pengguna dan Kewenangan

- Student: registrasi terbuka, mengelola identitas, afiliasi, profil, proyek, tim, kontribusi, portfolio, dan consent.
- Campus admin/reviewer: diprovisikan melalui workflow terkontrol dan undangan WhatsApp. Tidak dapat diperoleh melalui registrasi terbuka.
- Recruiter: berada dalam recruiter organization yang diverifikasi platform dan memerlukan internal entitlement aktif.
- Platform admin: menyetujui institution, mengundang campus admin, memverifikasi recruiter organization, dan menjalankan operasi lintas tenant yang diaudit.

Username hanya dipakai untuk login dan tidak tampil pada profil, portfolio, log aktivitas publik, atau Talent Portal. SATU tidak memakai email pada target product flow.

## Prinsip Produk

1. Perluas peluang tanpa stigma.
2. Kontribusi terverifikasi lebih penting daripada popularitas.
3. Privacy boundary terlihat dan dapat dikendalikan pengguna.
4. Matching transparan, versioned, dan dapat dijelaskan.
5. Analitik memberi bahan review manusia, bukan keputusan atau diagnosis otomatis.
6. Planned, synthetic, sandbox, dan production data harus dibedakan dengan jelas.

## Matching dan Inclusion

Matching mendukung tepat empat dimensi: `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`. Score version, input, bobot, dan alasan utama harus dapat diaudit.

Social Network Analysis mengukur opportunity untuk kolaborasi dan risiko eksklusi dari metadata aktivitas yang sah. SATU tidak menganalisis isi pesan untuk sentiment, kondisi psikologis, atau diagnosis. Inclusion signal hanya dapat dilihat reviewer yang berwenang. Signal tidak pernah tampil kepada student, teammate, atau recruiter dan tidak digunakan dalam leaderboard.

Engine dan UI inclusion dapat diselesaikan secara production-ready di balik Laravel Pennant. Demonstrasi menggunakan data synthetic. Aktivasi terhadap data nyata memerlukan DPIA, lawful basis, retention, notice, dan human governance yang disetujui.

## Gamification

XP hanya berasal dari kontribusi yang telah divalidasi campus reviewer dan disimpan dalam append-only ledger. Badge memiliki taxonomy dan versioned rule.

Hybrid leaderboard terdiri dari:

- program studi dan tim, aktif secara default;
- individual, hanya untuk student yang melakukan opt-in;
- periode per semester;
- score program studi atau tim berupa rata-rata verified XP per active member;
- minimum cohort lima anggota untuk publikasi;
- tie menghasilkan shared rank;
- inclusion signal dan `connectivity_opportunity` tidak menjadi input score.

Leaderboard adalah surface pendukung, bukan pusat identitas visual atau nilai manusia.

## Notification dan Integrasi

Notification center di dalam aplikasi adalah sumber notifikasi canonical. WhatsApp digunakan untuk OTP, invitation, deadline atau revision penting, contact request, dan security event sesuai preference serta purpose. Fonnte adalah provider awal melalui backend adapter, queue, outbox, status callback, retry, dan audit. Token tidak boleh masuk browser atau log.

Academic integration memakai contract dan sandbox adapter. Koneksi API kampus nyata adalah external gate. Talent Portal memakai internal entitlement. Billing provider, package pricing, dan pembayaran bukan scope rilis.

## Truth dan Evidence

Repository saat ini baru mengimplementasikan sebagian visual authority dan identity/tenancy berbasis email. Rebaseline username, WhatsApp, roster, gamification, Talent Portal, academic integration, dan landing masih planned sampai issue terkait selesai.

Tidak ada pelanggan, harga, testimoni, hasil pilot, benchmark dampak, atau penurunan eksklusi yang telah terbukti. Semua demonstration dataset harus diberi label synthetic. Proposal pada `docs/reference/proposal_lomba.md` adalah input historis, bukan runtime specification.

## Accessibility

Semua surface menargetkan WCAG 2.2 AA, keyboard operation, visible focus, reduced motion, semantic status, responsive behavior, dan copy Indonesia yang tidak memberi stigma. Istilah seperti rentan, terisolasi, atau diagnosis mental tidak boleh muncul pada UI student atau recruiter.
