# Business Flow SATU

## 1. Prinsip Alur

- Account, institution affiliation, portfolio visibility, dan recruiter entitlement adalah state yang terpisah.
- Open registration hanya menghasilkan student account.
- In-app notification adalah canonical. WhatsApp adalah delivery channel terpilih, bukan source of truth.
- Seluruh operasi tenant-owned memerlukan active institution context.
- Recovery path dirancang sebagai bagian utama, bukan pengecualian tersembunyi.

## 2. Provisioning Institution dan Campus Admin

1. Platform admin membuat atau meninjau institution.
2. Platform admin menyetujui institution dan mencatat keputusan audit.
3. Platform admin memasukkan nomor WhatsApp calon campus admin.
4. Sistem membuat invitation sekali pakai, mengantrekannya melalui Fonnte adapter, dan mencatat status delivery.
5. Penerima memverifikasi nomor, menetapkan private username dan password, lalu menerima role terkontrol.
6. Invitation expired, replayed, atau salah nomor masuk recovery tanpa memberikan privileged role.

## 3. Registrasi Student dan Affiliation

1. Student memasukkan nomor WhatsApp, meminta OTP, dan menyelesaikan challenge.
2. Student menetapkan private username, password, display name, dan consent yang diperlukan.
3. Sistem membuat normal student account tanpa privileged role.
4. Student memilih institution dan mengisi NIM.
5. Sistem membandingkan normalized NIM dan verified phone terhadap roster aktif.
6. Exact match mengaktifkan verified affiliation. Tidak cocok, ambigu, atau record tidak aktif masuk manual review.
7. Student dapat memakai fitur umum yang diizinkan sambil menunggu, tetapi verified credit dan campus validation membutuhkan affiliation verified.

## 4. Project sampai Team

1. Student melengkapi profile skill dan availability.
2. Student mencari project atau melihat recommendation yang menjelaskan alasan utama.
3. Student membuat join request atau project owner mengundang kandidat.
4. Policy memeriksa institution, lifecycle, capacity, dan actor authority.
5. Atomic transition membentuk team membership dan mengirim in-app notification.

## 5. Workspace sampai Verified Contribution

1. Team membuat task, assignment, discussion, evidence, dan deadline.
2. Database commit menjadi source of truth, lalu Reverb mengirim authorized delta.
3. Student mengajukan contribution version beserta evidence.
4. Campus reviewer meninjau langsung tanpa team confirmation.
5. Reviewer approve, request revision, atau reject dengan reason.
6. Approval membuat verified portfolio projection, XP ledger entry, dan evaluasi badge secara idempotent.
7. Notification center diperbarui. Revision atau deadline penting dapat dikirim melalui WhatsApp sesuai purpose dan preference.

## 6. Gamification

1. Verified XP dihitung dari ledger dalam semester aktif.
2. Program studi dan team projection dipublikasikan hanya jika cohort minimal lima active member.
3. Score kelompok memakai average verified XP per active member.
4. Student hanya muncul pada individual leaderboard setelah explicit opt-in.
5. Tie berbagi rank. Inclusion dan connectivity data tidak pernah menjadi input.

## 7. Inclusion Review

1. Authorized collaboration events membentuk graph projection tanpa membaca isi pesan.
2. Versioned engine menghasilkan signal di balik feature flag.
3. Pada synthetic demo, record ditandai synthetic.
4. Pada real data, engine tetap nonaktif sampai governance gate selesai.
5. Authorized reviewer melihat evidence summary, mencatat human review, dan memilih tindakan dukungan yang tidak memberi label atau adverse action otomatis.

## 8. Talent Portal

1. Platform admin memverifikasi recruiter organization dan membership.
2. Internal entitlement mengaktifkan portal untuk periode dan scope tertentu.
3. Search hanya membaca recruiter-safe projection dari student yang discoverable.
4. Recruiter menyimpan kandidat atau membuat contact request.
5. Student menerima in-app notification dan WhatsApp untuk request penting, lalu accept atau decline.
6. Recruiter hanya memperoleh contact detail yang diizinkan setelah acceptance. Revocation menghentikan exposure berikutnya.

## 9. Academic Integration

1. Campus admin memilih sandbox connection atau provider connection yang telah disetujui.
2. Campus admin memetakan activity atau badge ke credit code.
3. Approved contribution membuat sync candidate.
4. Idempotent job mengirim payload, menyimpan external reference dan status, serta retry dengan batas.
5. Failure masuk review queue. Reconciliation membandingkan database SATU dan provider.
6. Sandbox mensimulasikan success, validation error, timeout, duplicate, dan recovery.

## 10. Data Rights dan Security Recovery

Request access, correction, consent withdrawal, portfolio revocation, dan deletion mengikuti retention serta append-only audit boundary. Security event seperti recovery, phone change, atau privileged invitation dicatat tanpa menyimpan OTP atau secret dalam log.
