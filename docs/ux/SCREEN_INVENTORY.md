# Screen Inventory SATU

## 1. Inventory

| Surface                   | Target                             | Role         | Mode     | Stage             | Shape command                                                | Brief                                                                                                   |
| ------------------------- | ---------------------------------- | ------------ | -------- | ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Student dashboard         | `resources/js/pages/dashboard.tsx` | Student      | Operate  | Increment 1       | `$impeccable shape dashboard mahasiswa`                      | [`resources-js-pages-dashboard-tsx.md`](../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md) |
| Onboarding                | `/onboarding`                      | Student      | Operate  | Increment 1       | `$impeccable shape onboarding profil keterampilan mahasiswa` | [`route-onboarding.md`](../../.impeccable/surfaces/route-onboarding.md)                                 |
| Project discovery         | `/projects`                        | Student      | Operate  | Increment 1       | `$impeccable shape eksplorasi proyek dan matchmaking`        | [`route-projects.md`](../../.impeccable/surfaces/route-projects.md)                                     |
| Project workspace         | `/projects/{project}/workspace`    | Team         | Operate  | Increment 1       | `$impeccable shape workspace kolaborasi realtime`            | [`route-projects-workspace.md`](../../.impeccable/surfaces/route-projects-workspace.md)                 |
| Contributions & portfolio | `/contributions`                   | Student      | Operate  | Increment 1       | `$impeccable shape kontribusi validasi dan portofolio`       | [`route-contributions.md`](../../.impeccable/surfaces/route-contributions.md)                           |
| Campus operations         | `/campus`                          | Campus admin | Operate  | Increment 1       | `$impeccable shape dashboard dan verifikasi admin kampus`    | [`route-campus.md`](../../.impeccable/surfaces/route-campus.md)                                         |
| Inclusion review          | `/campus/inclusion`                | Campus admin | Operate  | Gated increment 1 | `$impeccable shape inclusion queue dan laporan kampus`       | [`route-campus-inclusion.md`](../../.impeccable/surfaces/route-campus-inclusion.md)                     |
| Talent Portal             | `/talent`                          | Recruiter    | Operate  | Later             | `$impeccable shape talent portal recruiter`                  | [`route-talent.md`](../../.impeccable/surfaces/route-talent.md)                                         |
| Product landing           | `/`                                | Public       | Persuade | Later             | `$impeccable shape landing page SATU`                        | [`route.md`](../../.impeccable/surfaces/route.md)                                                       |

## 2. Shared State Matrix

Setiap surface hanya mengimplementasikan state yang relevan, tetapi tidak boleh menganggap happy path sebagai satu-satunya kondisi.

| State              | Required treatment                                                     |
| ------------------ | ---------------------------------------------------------------------- |
| First run          | Orientation singkat dan satu next action                               |
| Empty              | Bedakan belum ada data, belum berhak, dan filter tidak menemukan hasil |
| Loading            | Pertahankan layout; gunakan skeleton untuk deferred content            |
| Processing         | Disable duplicate action dan jelaskan progress                         |
| Success            | Nyatakan object dan akibat yang berubah                                |
| Validation error   | Dekat field, summary bila panjang, input tetap ada                     |
| Network error      | Retry dan status koneksi; jangan menghapus local input                 |
| Realtime reconnect | Tampilkan reconnecting dan reconcile dari server                       |
| Stale/conflict     | Tunjukkan perubahan terbaru dan recovery choice                        |
| Forbidden          | Jangan membocorkan object; berikan safe destination                    |
| Partial permission | Sembunyikan action terlarang, jelaskan read-only state                 |
| Overflow           | Truncate hanya bila full value tetap dapat diakses                     |
| Destructive        | Jelaskan akibat, scope, dan apakah reversibel                          |

## 3. Surface Acceptance Summaries

### Student dashboard

- Pengguna mengetahui next action dalam beberapa detik.
- Recommendation menjelaskan relevance tanpa sensitive inference.
- Deadline dan blocking review terlihat.
- Dashboard tidak berubah menjadi grid metric tanpa priority.

### Onboarding

- Pengguna memahami perbedaan account dan verified campus membership.
- Progress dapat dilanjutkan.
- Consent dan visibility bukan checkbox tersembunyi.
- Pending verification tidak menjadi dead end.

### Project discovery

- Filter dapat dibagikan melalui URL.
- Match reasons dapat dipahami dan dikoreksi melalui profile.
- Closed/capacity-full state jelas.
- Recommendation tidak menampilkan popularitas sebagai quality proxy.

### Workspace

- Initial state tetap benar tanpa Reverb.
- Presence dan event tidak muncul lintas team.
- Upload, offline/reconnect, conflict, dan permission loss dapat dipulihkan.
- Mobile mendukung task dan discussion tanpa horizontal board wajib.

### Contributions

- Provenance dan verification level selalu terlihat.
- Revision feedback actionable.
- Student mengendalikan portfolio visibility.
- Approval history tidak ditimpa.

### Campus operations

- Queue priority memiliki alasan.
- Review dapat diselesaikan dengan keyboard.
- Tenant boundary dan audit context terlihat.
- Bulk action tidak digunakan untuk keputusan sensitif.

### Inclusion review

- Language hanya membahas pola partisipasi.
- Data sufficiency dan score version terlihat.
- Semua outcome memerlukan human action dan reason.
- Recruiter tidak memiliki route atau shared prop menuju data ini.

### Talent Portal

- Search hanya memakai recruiter-visible fields.
- Verification provenance terlihat tanpa raw evidence sensitif.
- Contact membutuhkan student choice.
- Subscription state tidak mengubah privacy boundary.

### Landing

- Menjelaskan mekanisme SATU dan siapa yang mendapat manfaat.
- CTA dan evidence jujur.
- Tidak menggunakan statistik proposal yang belum diverifikasi.
- Synthetic product demonstration diberi label.

## 4. Build Priority

1. Onboarding dan identity state.
2. Dashboard shell dan next action.
3. Project discovery/detail/matching.
4. Workspace dan Reverb.
5. Contribution dan portfolio.
6. Campus verification/validation.
7. Inclusion review setelah governance gate.
8. Talent Portal.
9. Marketing landing.
