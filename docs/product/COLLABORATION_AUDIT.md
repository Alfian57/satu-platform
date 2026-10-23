# Audit Alur Kesempatan Kolaborasi SATU

## 1. Kesimpulan dan Batas Bukti

Audit pada 9 Oktober 2026 untuk keluaran T01 pada [Roadmap](../implementation/ROADMAP.md#t01-audit-gap-dan-definisi-pembuktian-masalah). Acuan target adalah [PRODUCT](../../PRODUCT.md), [PRD](./PRD.md), dan [Business Flow](./BUSINESS_FLOW.md). Dokumen ini adalah temuan dan rancangan evaluasi, bukan pelacak progres atau persetujuan pilot.

Fondasi akun, afiliasi, pengajuan tim, ruang kerja, kontribusi, validasi, dan portofolio sudah mempunyai sambungan di kode. Bagian kesempatan bagi mahasiswa baru belum memenuhi seluruh target: profil pemula, kriteria peran, pembaruan rekomendasi, alasan keputusan, arahan pekerjaan, serta tindak lanjut kampus perlu dilengkapi. Keberadaan halaman atau rekomendasi contoh belum membuktikan mahasiswa baru memperoleh kesempatan nyata.

Sumber audit: worktree pada branch `fix/active-institution-context`, HEAD `b7a261f`, termasuk perubahan lokal yang sudah ada. Audit harus diperbarui bila implementasi berubah. Pemeriksaan ini tidak mengubah kode, database, konfigurasi, feature flag, queue, atau GitHub.

Tingkat bukti yang dipakai:

- **Sambungan statis**: pemanggilan frontend, route, controller, Action, Policy, atau consumer ditemukan pada kode. Bukan bukti transaksi berhasil dalam perjalanan pengguna nyata.
- **Registrasi runtime**: `route:list`, `event:list`, dan `schedule:list` dijalankan tanpa mengeksekusi operasi bisnis. Schema beberapa tabel dibaca melalui Laravel Boost pada MySQL, tanpa mengambil data pribadi.
- **Komponen terpisah**: kelas tersedia tetapi pemicu dari alur aplikasi belum ditemukan pada pencarian `app`, `routes`, `bootstrap`, `config`, dan `database`.
- **Data contoh**: record yang dibuat seeder atau graf statis berlabel sintetis. Tidak dipakai sebagai bukti dampak.
- **Belum diuji**: transaksi end-to-end, concurrency MySQL, delivery WhatsApp, browser lintas ukuran, usability dengan peserta, dan manfaat pilot tidak dijalankan dalam audit ini.

Tidak ada wawancara, angka baseline, target manfaat yang disetujui, atau hasil pilot baru. Rancangan skenario dan pengukuran di bawah perlu dikonfirmasi pemilik produk serta kampus sebelum digunakan untuk evaluasi data nyata.

## 2. Peta Alur Aktual

Nama route di bawah berasal dari registrasi Laravel. Detail endpoint ada pada [web.php](../../routes/web.php); frontend menggunakan fungsi Wayfinder yang sudah tersedia.

| Langkah                 | Surface atau route                                                                                                                           | Operasi, data, dan batas akses                                                                                                                                                                                                                                                   | Bukti dan celah                                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akun mahasiswa          | `register.start`, `register.otp.verify`, `login.store`, `recover.*`                                                                          | OTP aplikasi, username privat, password, nomor terverifikasi; registrasi tidak memberi peran istimewa                                                                                                                                                                            | Sambungan statis pada [AuthFlowController](../../app/Http/Controllers/Auth/AuthFlowController.php), [CreateNewUser](../../app/Actions/Fortify/CreateNewUser.php), dan [FortifyServiceProvider](../../app/Providers/FortifyServiceProvider.php). Delivery provider belum diuji |
| Afiliasi                | `institution-memberships.store`; `campus.affiliations.*`; `campus.roster.*`                                                                  | [SubmitAffiliationRequest](../../app/Actions/Affiliations/SubmitAffiliationRequest.php) mencari exact match NIM dan nomor terverifikasi; mismatch masuk review; roster dan keputusan dibatasi institusi                                                                          | Sambungan statis. Status pending tidak mengizinkan penyimpanan profil kampus seperti verified; copy Beranda belum sepenuhnya sesuai, GAP-08                                                                                                                                   |
| Kemampuan dan jadwal    | `student-profiles.store/update`, `student-profiles.availability.update`                                                                      | [StudentProfileController](../../app/Http/Controllers/StudentProfileController.php), Actions profil, skills/interests/availability; [StudentProfilePolicy](../../app/Policies/StudentProfilePolicy.php) membatasi pemilik dengan konteks terverifikasi                           | Minat dan metadata bukti ada pada backend, tetapi alur onboarding belum mengisinya dengan pengalaman yang utuh, GAP-02                                                                                                                                                        |
| Peluang                 | `projects.index/show/create/store/update/open`                                                                                               | [ProjectDiscoveryQuery](../../app/Actions/Project/ProjectDiscoveryQuery.php) membatasi institusi, lifecycle dan visibility; filter URL; peran dan kebutuhan keahlian tersedia                                                                                                    | Penelusuran tidak memerlukan undangan personal. Penerimaan pemula, kriteria, kapasitas tersisa per peran, dan kestabilan identitas peran perlu dilengkapi, GAP-03 dan GAP-04                                                                                                  |
| Rekomendasi             | `dashboard`; `dashboard.recommendations.*` untuk feedback                                                                                    | [RecommendationQuery](../../app/Actions/Matching/RecommendationQuery.php) membaca record tersimpan; [GenerateRecommendation](../../app/Actions/Matching/GenerateRecommendation.php) dan scorer tersedia; versi dan alasan diserialisasi                                          | Generator belum ditemukan dipanggil alur aplikasi; contoh seeder membuat skor langsung, GAP-05 dan GAP-06                                                                                                                                                                     |
| Pengajuan dan keputusan | `projects.join-requests.store`; `team.join-requests.accept/reject`; `projects.invitations.store`; `team.invitations.*`                       | [RequestToJoinTeam](../../app/Actions/Team/RequestToJoinTeam.php), accept/reject, Policy; pesan dan peran; notifikasi pemilik dan pemohon                                                                                                                                        | Sambungan statis. Keputusan belum mempunyai alasan berbasis kriteria yang utuh sampai pemohon; withdrawal belum tersambung, GAP-07                                                                                                                                            |
| Tim dan kapasitas       | `team.memberships.leave/remove` dan operasi penerimaan                                                                                       | [TeamMembershipTransition](../../app/Actions/Team/TeamMembershipTransition.php) memakai transaksi, project lock, hitungan kapasitas proyek/peran, membership, riwayat, serta sinkronisasi status                                                                                 | Fondasi atomik tersedia; belum diuji dengan dua penerimaan bersamaan. Pemilik proyek tidak otomatis merupakan row anggota; pengukuran harus memperhitungkannya                                                                                                                |
| Pekerjaan bersama       | `projects.workspace`; `projects.workspace.tasks.*`, `discussions.*`, `attachments.*`                                                         | Tugas, assignment, diskusi dan berkas privat; [ProjectWorkspaceController](../../app/Http/Controllers/ProjectWorkspaceController.php); [TaskPolicy](../../app/Policies/TaskPolicy.php); channel institusi/proyek                                                                 | Event workspace after-commit serta reconciliation client tersedia statis. Perlu uji nyata dan arahan bagi anggota yang bukan pemilik, GAP-08 dan GAP-14                                                                                                                       |
| Kontribusi individual   | `projects.contributions.store`; `contributions.evidence.store/submit/revisions.store`                                                        | [SubmitContribution](../../app/Actions/Contribution/SubmitContribution.php) meminta versi dan minimal satu bukti aktif; [ReviseContribution](../../app/Actions/Contribution/ReviseContribution.php) membuat versi baru                                                           | Sambungan statis. Tugas dan bukti menjadi sumber kontribusi, bukan salinan karya seluruh anggota. Standar bukti kampus masih perlu persetujuan, GAP-09                                                                                                                        |
| Validasi kampus         | `campus.contributions.index`; `contributions.reviews.store`                                                                                  | [ReviewContribution](../../app/Actions/Contribution/ReviewContribution.php) memeriksa Policy, versi yang diharapkan, pending, keputusan terdahulu; alasan revisi/penolakan wajib                                                                                                 | Sambungan statis. Approval mengirim `ContributionApproved` setelah commit. Tidak ada kewajiban team confirmation                                                                                                                                                              |
| Pengakuan dan berbagi   | `portfolio.index/show/share`; `student-profiles.portfolio.visibility.update`; `student-profiles.visibility.update`                           | [SyncApprovedContributionPortfolio](../../app/Listeners/SyncApprovedContributionPortfolio.php) memanggil sinkronisasi entry; entry baru privat; [BuildPublicPortfolioProjection](../../app/Actions/Portfolio/BuildPublicPortfolioProjection.php) memilih proyeksi yang diizinkan | Listener terdaftar pada `event:list`. Bukan sekadar halaman contoh. Recovery kegagalan consumer dan batas verifikasi tetap perlu diuji, GAP-09                                                                                                                                |
| Operasi pendukung       | `platform.operations.index`; `platform.institutions.approve/suspend`; `platform.invitations.store/revoke`; `invitation.*`; `notifications.*` | Admin platform dibatasi kewenangan; [AcceptInvitation](../../app/Actions/Institution/AcceptInvitation.php) memeriksa token dan nomor terverifikasi; notification center menautkan pekerjaan                                                                                      | Sambungan statis untuk operator. Pilot membutuhkan institusi, roster, reviewer, provider, dan dukungan operasional yang ditetapkan manusia                                                                                                                                    |

Event dan delivery inti:

1. `WorkspaceTaskChanged` dan `WorkspaceDiscussionChanged` mewarisi [WorkspaceDelta](../../app/Events/WorkspaceDelta.php), broadcast berotorisasi setelah commit. [channels.php](../../routes/channels.php) memeriksa institusi dan akses workspace; [use-workspace-realtime](../../resources/js/pages/projects/workspace/_hooks/use-workspace-realtime.ts) menangani duplicate, urutan, offline, serta reconnect.
2. [ContributionApproved](../../app/Events/ContributionApproved.php) dikonsumsi portofolio dan dua listener gamifikasi. `event:list` mengonfirmasi ketiganya terdaftar. Jangan menonaktifkan event tersebut untuk menunda gamifikasi.
3. Pengajuan, keputusan tim, review, dan portofolio mempunyai Notification database yang dijadwalkan setelah commit. [TeamJoinRequestRespondedNotification](../../app/Notifications/TeamJoinRequestRespondedNotification.php) belum menyertakan alasan keputusan.
4. OTP dan undangan menggunakan outbox serta [SendWhatsAppMessage](../../app/Jobs/SendWhatsAppMessage.php). `message:dispatch-due` terjadwal setiap menit. Keberadaan fake gateway tidak berarti lingkungan audit memakai fake; binding saat ini pada [AppServiceProvider](../../app/Providers/AppServiceProvider.php) adalah Fonnte. Uji berikutnya wajib mengikat fake tanpa mengirim pesan nyata.

## 3. Register Gap dan Kriteria Perbaikan

Prioritas P1 di sini berarti perlu dipenuhi untuk membuktikan alur inti, bukan klaim insiden keamanan aktif. Jenis **target baru** dibedakan dari **ketidaksesuaian existing** dan **kebutuhan verifikasi**. Urutan implementasi tetap mengikuti dependensi T02 sampai T10, bukan urutan ID gap.

| ID     | Jenis dan prioritas                          | Temuan serta dampak                                                                                                                                                                                                                                                                                                                                      | Owner dan tahap                                       | Kriteria perbaikan                                                                                                                                                                                                                             |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-01 | Target baru, P1                              | Navigasi mahasiswa masih memuat Peringkat; kampus masih sejajar dengan inklusi, kredit, dan sinkronisasi. Menu, tur, pengaturan, landing, serta pekerjaan background belum dipisahkan dari rilis inti                                                                                                                                                    | Product-design + fullstack, T02                       | Pengguna menemukan pekerjaan inti; daftar dependensi dan keputusan transisi direview; tidak ada penghapusan data atau pemutusan consumer bersama                                                                                               |
| GAP-02 | Target baru, P1                              | Onboarding mengirim skill dan jadwal, `evidence_metadata: []`, tanpa isian minat. API mempunyai interests dan metadata, tetapi belum ada jalur bukti awal dengan akses/validasi/sumber yang lengkap. Beranda mensyaratkan skill dan jadwal untuk status ready                                                                                            | Fullstack + product-design, T03                       | Tanpa karya/riwayat tetap dapat masuk jalur pemula; minat dan kesiapan bisa dinyatakan; bukti opsional dengan izin dan batas verifikasi; taxonomy terverifikasi tidak dianggap skill pengguna teruji                                           |
| GAP-03 | Target baru, P1                              | Peran menyimpan judul, deskripsi, kapasitas, skill dan proficiency, belum penerimaan pemula atau kriteria pemilihan eksplisit. Discovery mengirim kapasitas total, bukan sisa tempat per peran; kebutuhan waktu proyek belum memiliki sumber persisted                                                                                                   | Fullstack, T04                                        | Peran pemula dapat ditemukan dan diajukan; kriteria dari pemilik terlihat; tempat tersisa akurat; informasi yang belum diisi tidak ditebak oleh UI                                                                                             |
| GAP-04 | Ketidaksesuaian existing, P1                 | Pembaruan `roles` menghapus semua row peran lalu membuat ulang. Foreign key membership, invitation, dan join request memakai `nullOnDelete`, sehingga kaitan peran dapat hilang saat proyek open diedit. Pengubahan kapasitas juga perlu diuji terhadap anggota aktual                                                                                   | Backend + QA, T04/T06                                 | Identitas dan riwayat peran bertahan; penghapusan peran terpakai ditangani eksplisit; kapasitas tidak lebih kecil dari keterisian; pengajuan lama tetap dapat dipahami dan keputusan aman                                                      |
| GAP-05 | Sambungan belum tersedia, P1                 | Generator rekomendasi tidak ditemukan dipanggil command/event/job aplikasi. Seeder memasukkan skor manual. GET hanya membaca; belum ada pembaruan/invalidation setelah profil, kapasitas atau lifecycle berubah. Stale existing hanya membandingkan versi scorer                                                                                         | Backend + QA, T05                                     | Perubahan pengguna aktual memicu hitung/invalidation idempotent; peluang tutup/privat/penuh tidak direkomendasikan secara salah; stale input dibedakan dari stale versi; GET tetap read-only                                                   |
| GAP-06 | Kontrak input belum utuh, P1                 | Scorer merata-ratakan kebutuhan seluruh peran memakai kapasitas total, tanpa keterisian. Availability default memakai menit tersedia, bukan overlap kebutuhan proyek. Connectivity membaca `collaboration_events`, sementara writer produksi belum ditemukan; seeder bukan riwayat nyata                                                                 | Backend + product-design/security-privacy, T05        | Sumber input aktual dan kebijakan peran/data kosong disetujui; spesialis satu peran tidak dinilai seolah harus mengisi semua peran; tanpa riwayat diberi keterbatasan yang jujur; empat dimensi tetap, tanpa sinyal inklusi publik             |
| GAP-07 | Ketidaksesuaian existing dan target baru, P1 | Penerimaan menyimpan alasan null; penolakan menerima alasan opsional. Serializer panel hanya memuat pengajuan pending dan tidak memuat `response_reason`; notifikasi hanya menyatakan diterima/ditolak. Policy dan enum withdrawal ada tetapi route/Action withdrawal belum ditemukan. Panel pemilik belum membawa kemampuan/jadwal/bukti yang diizinkan | Fullstack + QA, T06                                   | Keputusan berbasis kriteria mempunyai alasan sampai pemohon dan riwayat; pelamar lain/catatan internal tetap privat; pembatalan tersedia; pemilik dapat meninjau informasi relevan yang diizinkan; request ganda dan penuh mempunyai pemulihan |
| GAP-08 | Ketidaksesuaian existing, P1                 | Beranda memprioritaskan rekomendasi sebelum proyek aktif; query proyek aktif hanya milik owner. Tidak membaca tugas anggota, revisi kontribusi atau pengajuan menunggu untuk tindakan utama. Copy pending mengajak memperbarui profil meski penyimpanan menunggu verified                                                                                | Fullstack + product-design, T02/T03/T07/T08           | Status penyimpanan jujur; anggota yang diterima menemukan proyek dan tugasnya; revisi/pekerjaan aktual didahulukan; rekomendasi bukan selalu tindakan pertama                                                                                  |
| GAP-09 | Kebutuhan verifikasi dan gate manusia, P1    | Submit, revisi, review dan portofolio tersambung statis, tetapi standar bukti/SLA kampus belum disepakati. Consumer portofolio sinkron berjalan setelah commit; audit belum membuktikan recovery jika consumer gagal setelah keputusan tersimpan                                                                                                         | Fullstack + QA + kampus, T08/T10                      | Standar dan batas verifikasi disetujui; dua anggota mempunyai karya berbeda; replay/recovery tidak menggandakan entry atau keputusan; bukti privat tidak dibuka; tidak menjanjikan SLA yang belum disepakati                                   |
| GAP-10 | Ketidaksesuaian existing, P1                 | Backend ringkasan kampus mengembalikan statistik kontribusi nol tetap. Metrik turnaround membaca review afiliasi, bukan kontribusi; UI saat ini sudah menyebut afiliasi dan label itu harus dipertahankan. Payload daftar anggota masih menyertakan username, meski UI saat ini tidak merendernya                                                        | Fullstack + QA, T09; minimisasi payload sebelum pilot | Statistik berasal dari sumber/denominator yang tepat; belum tersedia bukan nol faktual; afiliasi dan kontribusi tidak tertukar; username privat dihapus dari proyeksi operasional yang tidak membutuhkannya                                    |
| GAP-11 | Target baru, P1                              | Belum ditemukan alur mahasiswa memilih kebutuhan kesempatan, memberi izin tindak lanjut, lalu peninjau menghubungkannya ke peluang. `support_action` existing berada pada review sinyal inklusi terbatas, bukan alur kebutuhan yang dipilih mahasiswa                                                                                                    | Product-design + fullstack + security-privacy, T09    | Ada permintaan pilihan, izin, akses, alasan, tindak lanjut dan outcome; mahasiswa bebas menolak; tidak mengaktifkan analitik real atau auto-contact untuk mengisi celah                                                                        |
| GAP-12 | Target baru, P1                              | Belum ada pengukuran funnel utuh, denominator pemula atau riwayat kerja bersama yang siap evaluasi. Tabel collaboration events tersedia tetapi writer ditemukan pada seeder, bukan operasi tim/tugas                                                                                                                                                     | Backend + product-design/QA, T06/T09                  | Definisi pada bagian 7 disetujui dan diinstrumentasi sesuai izin; newcomer tidak dikeluarkan karena tanpa kontribusi; duplikasi/rejoin/sintetis/history tidak lengkap ditangani                                                                |
| GAP-13 | Target baru, P1                              | Demo landing adalah graf statis berlabel Data synthetic. Seeder menyiapkan sejumlah hasil langsung, bukan bukti perjalanan akun baru hingga diterima dan bekerja. Minat awal, keputusan peran, dan hubungan kerja baru belum menjadi demonstrasi utuh                                                                                                    | Product-design + fullstack, T10                       | Satu cerita inti dapat diikuti melalui operasi aktual dengan fake provider dan dataset aman; graf tetap ilustrasi, bukan laporan dampak; reset hanya pada lingkungan demo khusus                                                               |
| GAP-14 | Kebutuhan verifikasi, P1                     | Tidak ditemukan folder `tests`, konfigurasi PHPUnit/Pest, atau suite transaksi inti pada worktree ini. Workflow CI menjalankan lint/format/types/PHPStan, bukan pengujian perjalanan pengguna                                                                                                                                                            | QA + fullstack, seluruh tahap/T10                     | Suite sesuai risiko menguji akses lintas tenant, transaksi, concurrency MySQL, provider fake, consumer, pemulihan dan browser; static check tidak dianggap pengganti tes bisnis                                                                |

### Sumber Temuan yang Perlu Dipertahankan

- GAP-01: [app-sidebar](../../resources/js/layouts/_components/app-sidebar.tsx) dan kontrak penundaan pada [PRODUCT](../../PRODUCT.md).
- GAP-02 dan GAP-08: [onboarding-modal](../../resources/js/components/onboarding/onboarding-modal.tsx), [StudentProfileValidationRules](../../app/Concerns/StudentProfileValidationRules.php), serta `profileIsReady`, `nextAction`, dan `activeProjectsQuery` pada [DashboardController](../../app/Http/Controllers/DashboardController.php).
- GAP-03 dan GAP-04: [ProjectDiscoverySerializer](../../app/Support/Project/ProjectDiscoverySerializer.php), [ProjectRequirements](../../app/Actions/Project/ProjectRequirements.php), [UpdateProject](../../app/Actions/Project/UpdateProject.php), [migration proyek](../../database/migrations/2026_08_11_151844_create_project_tables.php), dan [migration tim](../../database/migrations/2026_08_12_041305_create_team_transition_tables.php). Risiko penggantian peran disimpulkan dari delete/create dan `nullOnDelete`, belum direproduksi lewat mutasi database.
- GAP-05 dan GAP-06: [GenerateRecommendation](../../app/Actions/Matching/GenerateRecommendation.php), [MatchingScorer](../../app/Support/Matching/MatchingScorer.php), [Recommendation](../../app/Models/Recommendation.php), dan `ensureMatchRunAndRecommendation` pada `DemoSeeder` historis. Scorer mempunyai fallback connectivity netral ketika total event nol; adanya fallback ini belum membuktikan kebijakan tanpa riwayat atau kualitas data produksi telah disetujui.
- GAP-07: [AcceptTeamJoinRequest](../../app/Actions/Team/AcceptTeamJoinRequest.php), [RejectTeamJoinRequest](../../app/Actions/Team/RejectTeamJoinRequest.php), [TeamDecisionRequest](../../app/Http/Requests/Team/TeamDecisionRequest.php), [TeamFormationSerializer](../../app/Support/Team/TeamFormationSerializer.php), [TeamJoinRequestPolicy](../../app/Policies/TeamJoinRequestPolicy.php), dan [panel tim](../../resources/js/pages/projects/show/_components/team-formation-panel.tsx).
- GAP-09: [ReviewContribution](../../app/Actions/Contribution/ReviewContribution.php), [consumer portofolio](../../app/Listeners/SyncApprovedContributionPortfolio.php), serta [SyncApprovedPortfolioEntry](../../app/Actions/Portfolio/SyncApprovedPortfolioEntry.php). Approval bukan bukti bahwa seluruh skill pemilik telah diuji.
- GAP-10: `queryContributionStats`, `queryReviewTurnaround`, dan `paginateMembers` pada [FetchCampusOverviewMetrics](../../app/Actions/Campus/FetchCampusOverviewMetrics.php); minimisasi payload tetap diperlukan meski field tidak dirender [UI ringkasan](../../resources/js/pages/campus/overview/page.tsx).
- GAP-11 dan GAP-12: [RecordInclusionReview](../../app/Actions/Inclusion/RecordInclusionReview.php), [TeamMembershipTransition](../../app/Actions/Team/TeamMembershipTransition.php), dan hasil pencarian writer `CollaborationEvent` pada aplikasi dibandingkan `DemoSeeder` historis.
- GAP-13 dan GAP-14: [landing-demo](../../resources/js/pages/welcome/_utils/landing-demo.ts), `DemoSeeder` historis, serta [workflow tests](../../.github/workflows/tests.yml) dan `ci:check` pada [composer.json](../../composer.json).

`DemoSeeder` adalah sumber temuan audit lama, telah dihapus saat pembersihan
seeder pada 15 Oktober 2026. Pengujian lokal alur UTY sekarang memakai
[UtyJourneySeeder](../../database/seeders/UtyJourneySeeder.php); sumber uji
perjalanan terisolasi tetap [CoreJourneyDemoSeeder](../../database/seeders/CoreJourneyDemoSeeder.php).
Pergantian fixture tidak menghapus temuan historis atau membuktikan dampak pilot.

### Traceability Requirement

Pemetaan ini menghubungkan temuan dengan kontrak PRD. Tidak mengubah scope atau status issue existing.

| Requirement | Gap terkait                                            |
| ----------- | ------------------------------------------------------ |
| FR-01       | GAP-08, GAP-14                                         |
| FR-02       | GAP-02, GAP-08, GAP-14                                 |
| FR-03       | GAP-03, GAP-04, GAP-05, GAP-06, GAP-07, GAP-12, GAP-14 |
| FR-04       | GAP-08, GAP-12, GAP-14                                 |
| FR-05       | GAP-09, GAP-14                                         |
| FR-06       | GAP-01                                                 |
| FR-07       | GAP-10, GAP-11, GAP-12, GAP-14                         |
| FR-08       | GAP-01                                                 |
| FR-09       | GAP-01                                                 |
| FR-10       | GAP-13, GAP-14                                         |
| FR-11       | GAP-01, GAP-08                                         |
| FR-12       | GAP-10, GAP-12, GAP-13, GAP-14                         |

## 4. Inventaris Dependensi Modul Lanjutan

Inventaris ini menjadi masukan T02. Belum ada keputusan untuk menonaktifkan route, listener, job, atau flag. Penyembunyian menu tidak mengubah otorisasi server maupun penghentian pekerjaan background.

| Modul                     | Entry dan consumer existing                                                                                                                                                                                     | Dependensi ke inti serta batas transisi                                                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gamifikasi                | `leaderboards.*`; listener `AwardApprovedContributionXp` dan `AwardContributionBadges`; ledger/badge/preference/projection; command `gamification:rebuild-leaderboards` dan job `RebuildLeaderboardProjections` | `ContributionApproved` juga membangun portofolio. Perubahan consumer harus selektif dan berizin; ledger, consent opt-in, audit dan riwayat tetap. Task rebuild berjalan tiap jam pada [bootstrap/app.php](../../bootstrap/app.php), tidak hanya dari menu                                                                            |
| Talent Portal             | `recruiter.talent.*`, `student.contact-requests.*`; search/saved/contact; `TalentCandidateProjection`; organisasi/membership/entitlement; `CandidateContactRequestedNotification`                               | [RebuildTalentCandidateProjection](../../app/Actions/Portfolio/RebuildTalentCandidateProjection.php) dipanggil dari operasi profil, availability, visibility, review dan portofolio. Penundaan UI tidak boleh melemahkan withdrawal atau akses. Tombol kontak profil masih disabled; gate provisioning perekrut tetap terbuka        |
| Akademik                  | `campus.credit-mappings.*`, `campus.integrations.*`; mappings, connections, sync/event/metric; `DispatchAcademicSync`, `SyncAcademicActivity`, retry/reconcile; `integration:alert-sync-anomalies`              | Provider baseline masih sandbox. Pemicu sinkronisasi awal dari approval kontribusi belum ditemukan; caller dispatch yang ditemukan adalah retry. Alert terjadwal tiap 15 menit; jangan menghapus riwayat/idempotensi/pemetaan atau memanggil provider nyata                                                                          |
| Inklusi dan graf lanjutan | `campus.inclusion.*`; `CalculateInclusionSignal`, queue/detail/review dan restricted serializer; `BuildCollaborationGraph`; Pennant `inclusion-signal-engine`; versions/signals/reviews/collaboration events    | Jangan membuka sinyal bagi mahasiswa/perekrut. Writer event produksi dan pemicu kalkulasi belum ditemukan. Kalkulator menyimpan parameter `period` tetapi query hitungan tidak memfilter waktu; bukan alat evaluasi pilot siap pakai. Matching juga membaca collaboration events, sehingga mengubah tabel itu dapat memengaruhi inti |

Pemeriksaan registrasi jadwal menemukan tiga task: outbox tiap menit, alert integrasi tiap 15 menit, dan leaderboard tiap jam. Audit hanya membaca daftar tersebut, tidak menjalankan scheduler/worker. [routes/console.php](../../routes/console.php) dan [bootstrap/app.php](../../bootstrap/app.php) sama-sama perlu masuk review transisi.

Rencana transisi T02 harus menyebut surface yang dibatasi, consumer yang tetap, pekerjaan yang tetap atau berhenti, alasan, otorisasi, penanganan job tertunda, serta cara pemulihan. Provider WhatsApp, notification center, audit, consent, dan portofolio bukan modul yang ikut ditunda.

## 5. Skenario Penerimaan yang Diusulkan

Skenario ini adalah rancangan uji, belum hasil uji atau persetujuan pengguna. Gunakan fixture sintetis pada lingkungan uji terpisah; jangan menjalankan seeder/reset terhadap database pengguna. Dua institusi diperlukan untuk tes negatif meskipun rilis pilot satu kampus.

### SC-01: Mahasiswa Baru Tanpa Portofolio atau Riwayat

Skenario inti yang direkomendasikan untuk disepakati. Mahasiswa A tidak memiliki karya terpublikasi atau riwayat SATU; B adalah pemilik proyek; C adalah rekan kerja. A dan C mempunyai kontribusi individual berbeda.

1. Admin platform menyiapkan institusi aktif, operator berwenang, serta roster sintetis. Provider OTP/undangan terikat fake.
2. A membuat akun mahasiswa memakai username/password dan OTP. Tidak mendapatkan peran kampus/platform/perekrut.
3. Exact match NIM dan nomor mengaktifkan afiliasi. Variasi mismatch menunggu keputusan kampus; draft lokal tidak disebut telah disimpan server.
4. A menyatakan minat, kemampuan awal dan jadwal tanpa dipaksa mempunyai bukti terdahulu. Pernyataan sendiri tidak diberi label kompetensi tervalidasi.
5. A menemukan peluang yang menerima pemula, memahami peran, kriteria dan tempat tersisa tanpa undangan personal. Discovery tetap tersedia bila rekomendasi kosong/gagal.
6. Perubahan profil/peluang memicu rekomendasi aktual dengan versi, alasan, dan keterbatasan. GET tidak menciptakan record contoh.
7. A mengajukan peran dengan informasi singkat yang relevan. B membaca informasi yang diizinkan dan memutuskan berdasarkan kriteria, bukan popularitas.
8. Penerimaan beralasan membentuk satu membership, mengurangi kapasitas dan memberi akses workspace. A menemukan tugasnya dari Beranda/Proyek saya.
9. A dan C mengerjakan tugas yang dapat diatribusikan. Bukti kerja individual dan partisipasi bersama tercatat tanpa menganalisis pesan atau memaksa aktivitas bicara.
10. A membuat kontribusi dari tugas dan bukti, mengirim, menerima permintaan revisi, memperbaiki versi, lalu memperoleh approval kampus. Riwayat terdahulu tidak hilang.
11. Portofolio A terbentuk privat dari kontribusinya. Karya C tidak diklaim A. A memilih berbagi lalu mencabutnya; bukti privat tidak muncul pada proyeksi publik/perekrut.
12. Evaluasi memisahkan peluang, penerimaan, kerja bersama, dan pengakuan. Seluruh fixture tetap berlabel Data synthetic; tidak dilaporkan sebagai manfaat pilot.

Lulus teknis jika sumber, akses, status, capacity, riwayat, consumer dan pemulihan konsisten. Lulus usability memerlukan peserta memahami tujuan dan tindakan berikutnya tanpa wajib mengikuti tur. Lulus manfaat membutuhkan pilot berizin dan target yang disepakati; dua kelulusan pertama tidak menggantikan yang terakhir.

### Variasi Aktor dan Pemulihan

| ID    | Aktor dan pekerjaan                  | Kasus yang harus diuji                                                                                                                    | Outcome yang diharapkan                                                                                                               | Gap/tahap             |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| SC-02 | Mahasiswa dengan bukti awal          | Tautan/berkas yang diizinkan, bukti belum ditinjau, bukti privat, tanpa izin melihat, sumber invalid, pencabutan                          | Dapat menjelaskan kemampuan dengan batas verifikasi; bukti opsional, aman, tidak membuka data pribadi atau karya orang lain           | GAP-02; T03/T08       |
| SC-03 | Pemilik proyek memilih anggota       | Dua penerimaan untuk satu tempat, peran diedit setelah pengajuan, penuh/tutup, penolakan beralasan, pengajuan dibatalkan, keputusan ulang | Tidak ada kelebihan kapasitas atau hilangnya peran; alasan diterima pemohon; applicant lain dan catatan internal tidak bocor          | GAP-03/04/07; T04/T06 |
| SC-04 | Peninjau kampus                      | Dua reviewer pada versi sama, keputusan stale, bukti dihapus, kontribusi beda institusi, revisi, consumer portofolio gagal/replay         | Hanya peninjau sah melihat bukti; keputusan tunggal pada versi tepat; riwayat terpelihara; recovery portofolio tanpa duplikasi        | GAP-09/10; T08/T09    |
| SC-05 | Admin platform memastikan akses      | Undangan salah nomor/expired/revoked/replay, institusi nonaktif, akun mahasiswa memanggil route admin, delivery gagal                     | Tidak ada privileged self-registration; status delivery jujur; undangan dapat dipulihkan sesuai kewenangan; audit tidak memuat secret | FR-01; T03/T10        |
| SC-06 | Mahasiswa meminta bantuan kesempatan | Opt-in, menolak dukungan, mencabut izin, reviewer lintas tenant, tindak lanjut tanpa auto-contact                                         | Peninjau menawarkan peluang yang relevan tanpa label kepribadian; mahasiswa tetap memilih; riwayat akses/tindak lanjut sesuai izin    | GAP-11/12; T09        |

Matriks lintas skenario: empty/no-data, processing, validation, network/HTTP error, session expired, forbidden, stale, reconnect, duplicate/out-of-order, overflow, destructive action dan success sesuai surface. Uji keyboard/focus restoration, screen reader/status selain warna, reduced motion, zoom 200%, mobile 320px, tablet, desktop dan layar besar. Mock browser membuktikan state UI, bukan keberhasilan transaksi backend.

Acuan UX untuk tahap perubahan: [Screen Inventory](../ux/SCREEN_INVENTORY.md), [User Flows](../ux/USER_FLOWS.md), [Content dan Accessibility](../ux/CONTENT_ACCESSIBILITY.md), [Loading States](../ux/LOADING_STATES.md), serta [DESIGN](../../DESIGN.md). Kontrak route/surface diperbarui sebelum UI diimplementasikan.

## 6. Rencana Validasi Masalah dan Usability

Belum dilaksanakan. Pemilik produk menentukan kampus, merekrut peserta secara sukarela, dan memperoleh persetujuan yang diperlukan. Jumlah sampel, jadwal, penyimpanan, serta pihak yang boleh membaca hasil ditetapkan sebelum pengumpulan. Jangan merekrut atau mengelompokkan berdasarkan dugaan kepribadian dari aktivitas SATU.

Komposisi yang diusulkan: mahasiswa yang pernah kesulitan mencari tim, mahasiswa baru tanpa pengalaman proyek, mahasiswa yang sudah mendapatkan peluang, pemilik proyek, serta operator/reviewer. Cari juga pengalaman yang bertentangan dengan hipotesis, bukan hanya jawaban yang mendukung produk.

Pertanyaan berbasis kejadian nyata:

1. Mahasiswa: ceritakan terakhir kali mencari proyek atau peran. Di mana menemukan informasinya, syarat apa yang dipahami, langkah apa yang dilakukan, dan di mana berhenti?
2. Mahasiswa: bukti kemampuan apa yang sudah dimiliki atau belum dimiliki? Informasi apa yang nyaman dibagikan kepada tim dan kampus? Apa alternatif jika belum mempunyai karya?
3. Mahasiswa: bagaimana mengetahui keputusan pengajuan? Bantuan atau alasan apa yang diperlukan untuk mencoba lagi? Apakah kesempatan didapat dari teman, pengumuman, dosen, atau kanal lain?
4. Pemilik: bagaimana menetapkan kebutuhan, memilih pelamar, menerima pemula, mengelola kapasitas, membagi pekerjaan dan menjelaskan penolakan? Apa batas waktu dan beban review yang realistis?
5. Kampus: bagaimana melihat kontribusi individual saat ini, memeriksa bukti, menangani revisi/keberatan, menawarkan kesempatan sesuai izin, dan menetapkan reviewer?
6. Semua aktor: apakah mekanisme terbuka menyelesaikan hambatan atau justru menambah hambatan baru seperti OTP, afiliasi, bukti, jadwal, atau kapasitas peluang?

Observasi usability memakai SC-01 serta variasi yang relevan. Minta peserta menjelaskan tujuan halaman dan langkah berikutnya, lalu mengerjakan tugas tanpa tur wajib. Catat keberhasilan, titik berhenti, bantuan yang diminta, dan waktu tugas; jangan menilai kepribadian. Pisahkan masalah pemahaman dari masalah akses, stok peluang dan keputusan pemilik.

Keluaran penelitian: ringkasan anonim kejadian, bukti pendukung/penyangkal hipotesis, hambatan yang berulang, kebutuhan operasional, dan usulan perubahan. Kutipan hanya dengan izin. Tidak ada testimoni, persentase atau klaim ketidakadilan sampai bukti tersedia. Transkrip/nomor kontak tidak disimpan di repository.

## 7. Rancangan Pengukuran Manfaat

### Populasi, Periode, dan Baseline

Rancangan ini belum diaktifkan dan bukan izin pemrosesan. Mengikuti [Security dan Privacy](../engineering/SECURITY_PRIVACY.md) dan gate terkait pada [Decisions](../governance/DECISIONS.md).

- Tetapkan `institution_id`, awal `T0`, akhir `T1`, zona waktu laporan, lama observasi, dan waktu ekstraksi. Timestamp disimpan/dibandingkan konsisten. Tidak ada durasi atau target angka yang dianggap disetujui oleh audit ini.
- Populasi `E`: mahasiswa dalam scope pilot, afiliasi student terverifikasi dan tidak suspended pada awal observasi, serta memenuhi dasar pemrosesan/persetujuan evaluasi yang ditetapkan. Tidak mensyaratkan portofolio, XP, relasi atau kontribusi disetujui. Operator, perekrut dan admin platform dikeluarkan.
- Kelompok `E0`: anggota `E` tanpa riwayat kerja bersama **yang tercatat dan dapat diverifikasi dalam SATU** sebelum `T0`. Jika kelengkapan riwayat tidak dapat dibuktikan, kategorikan sebagai riwayat tidak diketahui, bukan otomatis nol. Jangan menamai kelompok sebagai pemalu atau terisolasi.
- Peserta yang mulai setelah `T0` dilaporkan sebagai cohort masuk bergulir dengan lama paparan sendiri, tidak dicampur sebagai cohort penuh. Denominator awal tidak diam-diam membuang peserta yang tidak berhasil; kehilangan akses, withdrawal dan kehilangan observasi dilaporkan sesuai kebijakan data rights.
- Pisahkan fixture/seeder/dataset demo melalui manifest dataset dan konteks lingkungan, bukan hanya mencari `is_synthetic` pada satu tabel. Tidak semua tabel mempunyai flag tersebut.
- Jangan memakai active-member gamifikasi yang mensyaratkan kontribusi terverifikasi sebagai populasi evaluasi. Itu mengeluarkan mahasiswa yang justru ingin dibantu.
- Baseline mencatat pengalaman memperoleh kesempatan sebelum pilot melalui sumber sah/penelitian yang diizinkan, stok peluang/peran dan kapasitas, distribusi pengalaman awal, hambatan, serta kelengkapan data. Belum ada nilai baseline atau target manfaat.

### Definisi Hubungan Kerja Baru

Usulan untuk dikonfirmasi kampus: pasangan dua mahasiswa berbeda dalam institusi sama, mempunyai partisipasi sah pada proyek yang sama dan overlap periode kerja, dengan aktivitas kerja yang dapat diatribusikan kepada keduanya. Bukti dapat berasal dari assignment dan keluaran tugas/bukti kontribusi; bergabung saja belum membuktikan pekerjaan bersama, dan approval tidak wajib untuk mencatat kerja yang belum selesai ditinjau.

Pemilik proyek dihitung sebagai peserta hanya jika keterlibatan kerjanya ada, bukan semata karena `owner_id`. Undangan pending, rekomendasi, chat, atau follower tidak cukup. Tidak menganalisis isi pesan.

Deduplicasi pasangan dengan `(institution_id, min(user_id), max(user_id))`. Satu pasangan bekerja di beberapa proyek tetap satu hubungan baru, sementara jumlah episode/proyek dapat dilaporkan terpisah. Rejoin bukan otomatis relasi baru. Gunakan riwayat membership/event, bukan `joined_at` mutable saja.

Pasangan disebut baru **tercatat dalam SATU** jika tidak ada kerja bersama yang sah pada riwayat lengkap sebelum episode tersebut. Hubungan sebelum/di luar SATU yang tidak diketahui menjadi keterbatasan. Jangan mengklaim dua orang sebelumnya tidak saling kenal atau peningkatan relasi sosial umum.

### Indikator dan Sumber

Hitung pengguna unik untuk funnel utama; hitung request/episode pada metrik proses secara terpisah. Outcome boleh dicapai lewat penelusuran manual atau undangan yang sah, tidak harus melewati rekomendasi. Bedakan jalur masuk untuk memahami ketergantungan undangan personal.

| Indikator                        | Numerator dan denominator                                                                                                           | Sumber atau kekurangan data                                                                                                               | Batas interpretasi                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Profil siap                      | Mahasiswa `E` yang memenuhi kontrak kesiapan yang disepakati / `E`                                                                  | Profil/skills/interests/availability; kesiapan target T03 belum final                                                                     | Tidak membuktikan kompetensi telah diuji                                                          |
| Peluang dipahami/dilihat         | Pengguna `E` dengan view detail sah / `E`; pemahaman melalui usability                                                              | Belum ada telemetry view siap pakai; perlu kontrak dan operasi pencatatan eksplisit sesuai izin, bukan mutasi domain tersembunyi pada GET | View bukan pengajuan atau kolaborasi; jangan menyimpulkan drop-off jika tracking tidak lengkap    |
| Pengajuan                        | Mahasiswa `E` dengan pengajuan sah dalam periode / `E`; konversi tambahan / pengguna view yang datanya lengkap                      | `team_join_requests`, requested_at, role, tenant; belum ada agregasi evaluasi                                                             | Pisahkan withdrawal, duplicate dan jalur undangan                                                 |
| Keputusan                        | Request dengan keputusan / request sah yang diajukan dalam periode; alasan dapat dibaca / keputusan                                 | Request/status/responded_at dan audit; alasan/histori pemohon perlu T06                                                                   | Pending bukan penolakan; usia antrean dan observasi belum lengkap dilaporkan                      |
| Mendapat tempat                  | Mahasiswa `E` dengan penerimaan dan membership sah pada periode / `E`; laporkan juga / `E0` yang datanya memadai                    | Request/invitation, membership dan events; cocokkan sumber penerimaan                                                                     | Bukti kesempatan bergabung, belum bukti hubungan kerja                                            |
| Hubungan kerja baru tercatat     | Mahasiswa `E` dengan minimal satu pasangan baru yang memenuhi definisi / `E`; laporkan juga / `E0`; jumlah pasangan unik terpisah   | Membership events, assignment, kerja/bukti; instrumentasi dan validitas historis belum lengkap                                            | Tidak menyatakan mereka sebelumnya tidak saling kenal; jangan mengganti sumber dengan graf seeder |
| Kontribusi dan pengakuan         | Mahasiswa `E` dengan kontribusi diajukan / `E`; dengan approval dan entry bersumber / `E`; konversi approval / mahasiswa pengirim   | Contribution/version/review/portfolio; timestamp submit per versi perlu dipastikan, bukan hanya updated_at                                | Request revision bukan kegagalan final; pengakuan hanya untuk kontribusi yang ditinjau            |
| Waktu perjalanan                 | Median dan sebaran waktu dari pengajuan ke keputusan, diterima ke kerja, submit versi ke keputusan                                  | Timestamp dan history yang konsisten; pisahkan afiliasi, tim, dan kontribusi                                                              | Laporkan sampel serta kasus belum selesai; bukan janji SLA                                        |
| Kualitas akses dan tindak lanjut | Keberhasilan tugas usability / percobaan; permintaan dukungan ditindaklanjuti / permintaan berizin; hasil diketahui / tindak lanjut | Observasi sukarela serta flow dukungan T09 yang belum ada                                                                                 | Tidak memakai label kepribadian; menawarkan dukungan bukan bukti penerimaan                       |

Untuk hasil pilot, laporkan jumlah numerator/denominator, periode, eligibility, sumber, missing data dan keterbatasan. Rasio tanpa denominator atau denominator nol tidak ditampilkan sebagai persentase nol. Lindungi kelompok kecil dengan kebijakan publikasi yang disetujui; jangan mengimpor angka threshold gamifikasi sebagai keputusan privacy evaluasi.

Penilaian manfaat memerlukan konteks kebutuhan peran, stok/kapasitas peluang, waktu, kualitas data, dan pengalaman peserta. Perbandingan sebelum/sesudah bersifat deskriptif kecuali rancangan mendukung atribusi; peningkatan angka tidak otomatis membuktikan SATU menghilangkan bias kampus. Target dan ambang kelulusan ditetapkan manusia setelah baseline, tidak direkayasa untuk presentasi lomba.

## 8. Handoff dan Keputusan Manusia

Keluaran audit T01 tersedia: peta alur, register gap, inventaris dependensi, skenario penerimaan, rencana penelitian dan definisi pengukuran awal. SC-01 merupakan skenario yang direkomendasikan, belum dinyatakan telah disepakati atau lulus. Wawancara/pilot dan gate terkait belum selesai.

Keputusan yang perlu pemilik produk/kampus:

1. Konfirmasi SC-01 sebagai cerita utama dan tentukan kampus, pemilik peluang, reviewer, serta standar bukti. Siapkan peluang nyata yang benar-benar menerima pemula, bukan hanya profil baru.
2. Setujui batas transisi T02: surface lanjutan yang dibatasi, consumer/background yang dipertahankan atau ditunda, serta pemulihan. Menyembunyikan menu tidak cukup.
3. Tetapkan kebijakan profil tanpa karya dan matching tanpa riwayat bersama product-design/security-privacy; selaraskan kontrak UX/data sebelum implementasi.
4. Setujui perekrutan penelitian, tujuan/izin, retensi, populasi, periode, definisi kerja baru dan perlindungan agregat. GATE-001/GATE-002 dan gate modul lanjutan tidak ditutup oleh audit.
5. Setelah baseline tersedia, sepakati target manfaat dan ambang penerimaan; kemudian lakukan UAT/pilot berizin. Tidak ada nilai yang diisi sebagai hasil saat ini.

Handoff paling dekat adalah T02: sederhanakan arah navigasi dan Beranda berdasarkan GAP-01/GAP-08, dengan inventaris bagian 4 sebagai pagar perubahan. Temuan backend di tahap berikutnya tidak boleh disembunyikan lewat copy seolah alurnya sudah utuh. Minimasi username pada GAP-10 menjadi syarat privacy sebelum pilot data nyata, walaupun ringkasan outcome dikerjakan di T09.

Pemeriksaan dokumentasi: format Prettier, internal link/anchor, referensi UX, pemetaan GAP ke requirement/tahap, dan `git diff --check`. Pemeriksaan tersebut tidak dinyatakan sebagai kelulusan suite runtime atau acceptance manfaat.

## Pembuktian Teknis T10 dan Handoff Rilis

Per 11 Oktober 2026, `check-core-journey.php` menjalankan dua perjalanan
dari SQLite memori kosong, bukan halaman dengan hasil seeded. Prasyarat
fixture menyediakan akun terverifikasi dan reviewer, bukan menguji OTP,
registrasi atau delivery undangan. Operasi institusi, exact match/manual
afiliasi, profil tanpa karya, discovery/pencocokan dari sumber baru, tim,
tugas tanpa pesan, kontribusi individual/revisi, approval privat,
berbagi/pencabutan, queue dan restore logical diuji. Demo UI tetap ilustrasi
lokal berlabel, bukan operasi akun nyata atau laporan manfaat.

Handoff berikutnya adalah gate rilis, bukan mengulang fokus modul lanjutan:

1. Siapkan staging MySQL terpisah dan berizin; uji concurrency multiworker,
   backup database/storage lengkap, reconnect websocket serta pemulihan.
2. Periksa OTP, undangan, rate limit, provider outbox/callback dan recovery
   pada lingkungan fake/staging yang tidak mengirim kepada orang nyata.
3. Jalankan studi usability SC-01 dan variasinya dengan peserta berizin.
   Catat pemahaman, langkah yang gagal, kebutuhan bantuan, serta hasil negatif.
4. Pemilik produk dan kampus meninjau temuan, menyepakati standar bukti,
   retensi, dukungan, notice dan final UAT. Tidak menganggap static checks
   atau screenshot sebagai sertifikasi WCAG atau persetujuan pengguna.
5. Setelah izin dan baseline tersedia, sepakati populasi, periode, target
   serta perlindungan kelompok kecil; baru evaluasi pilot nyata.
   Belum ada angka manfaat atau efektivitas yang dapat dinyatakan.

Runner `composer test:core` membuat GAP-14 mempunyai tes bisnis reproduktif,
tetapi tidak menutup seluruh release gate atau GAP-13 sebagai bukti dampak.
Temuan audit historis tetap dipertahankan; kemajuan teknis bukan penghapusan
keterbatasan sumber, fairness atau gate manusia.

## UAT Transisi Universitas U06

Status: belum dilaksanakan oleh peserta/pemilik yang berwenang. Pemeriksaan
otomatis U06 menyediakan perjalanan dua admin dan konflik MySQL lokal, bukan
hasil wawancara, sertifikasi aksesibilitas atau persetujuan visual. Gunakan
data synthetic sebelum gate data nyata disepakati, tanpa merekam kontak atau
bukti privat di repository.

Urutan tinjauan manusia yang disiapkan:

1. Mahasiswa baru menjelaskan UTY sebagai universitas sasaran, mengisi NIM,
   memahami mismatch/pending dan melanjutkan profil tanpa karya sebelumnya.
2. Mahasiswa menemukan peran menerima pemula, memahami syarat/kapasitas,
   mengajukan dan membaca alasan. Pemilik memutuskan lalu membagi tugas.
3. Mahasiswa mengerjakan tugas, melampirkan bukti individual, mengirim dan
   merevisi. Admin pertama meminta revisi; admin kedua membaca versi aktual
   dan menyetujui tanpa membuka draft atau memvalidasi kontribusi sendiri.
4. Mahasiswa menjelaskan mengapa karya baru tetap privat, memilih berbagi,
   lalu mencabut dan memeriksa bahwa proyeksi berikutnya tidak tersedia.
5. Pada fixture bantuan berizin, peninjau yang ditunjuk menawarkan peran.
   Mahasiswa memilih menerima/menolak/mencabut. Pastikan peserta memahami
   bahwa tawaran tidak otomatis memasukkan ke tim atau menjanjikan hasil.
6. Dua admin memeriksa status/undangan, membedakan konfirmasi sandi dari
   konfirmasi tindakan, menangani konflik serta izin hilang tanpa retry
   command otomatis. Jangan menguji penangguhan pada akun kerja nyata.
7. Ulangi alur berisiko pada mobile/desktop, keyboard, zoom dan reduced motion;
   sertakan jaringan gagal, hasil belum pasti, reconnect dan akses dicabut.

Catat per skenario: peninjau/tanggal, lingkungan dan manifest, hasil yang
diharapkan/diamati, lulus atau gagal, bantuan yang diperlukan, bukti nonpribadi,
temuan serta pemilik tindak lanjut. Semua hasil masih kosong sampai diuji.
Pemilik produk memberi persetujuan visual/UAT eksplisit setelah temuan
ditinjau; kampus memutuskan standar bukti, retensi, peninjau dan operasional.
Tidak ada gate DECISIONS yang ditutup oleh penambahan checklist ini.
