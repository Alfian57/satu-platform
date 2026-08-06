---
version: 3
slug: "route-talent"
primary_target: "route:/talent"
related_targets:
  [
    "route:/talent/candidates/{candidate}",
    "route:/talent/saved",
    "route:/talent/contacts",
    "route:/talent/contacts/{contact}",
  ]
---

# Talent Portal dan Student Contact Response

## Job and Audience

Verified recruiter mencari kandidat melalui verified folio index dengan batas
visibility yang jelas; menyimpan kandidat dan meminta kontak yang datanya
dibatasi oleh consent student. Student mengelola discoverability dan setiap
contact handoff tanpa membocorkan data privat atau inclusion signal. Kedua
perspective dalam mode **Operate**.

## Outcome and Proof

Recruiter dapat memindai candidate index dengan filter yang dapat dibagikan
bersama entitled member, memahami organization/entitlement state, provenance
setiap data, dan contact status per kandidat. Student dapat menerima, menolak,
atau mencabut visibility portfolio serta contact consent tanpa private evidence,
inclusion signal, atau hidden score muncul ke recruiter.

## Selected Direction

Verified folio index yang mewarisi **Buku Besar Kolaborasi**. Candidate result
menggunakan ruled ledger rows dengan alignment stabil -- bukan kumpulan
mini-card. Candidate detail menempatkan artifact/portfolio sebagai ruang utama
dengan provenance ledger yang compact. Contact flow menggunakan docket structured
decision: siapa meminta, data apa yang dibagikan, konsekuensi acceptance,
expiration, dan withdrawal.

Recruiter workspace: index search/filter, result list, candidate detail docket,
saved ledger, contact panel, dan status tracker. Student workspace: contact
request docket dengan accept/decline decision, visibility toggle, dan contact
history.

## Scope and Boundaries

Mencakup organization verification, internal entitlement management, candidate
search/filter, candidate detail, saved list, contact request, student response,
visibility control, expiration, dan revocation.

### Forbidden Fields (Recruiter Never Sees)

- Inclusion signal atau Sinyal Peluang Kolaborasi.
- Private discussion, raw evidence privat, atau isi pesan antar student.
- Audit trail internal, reviewer notes, atau decision reason.
- Nomor WhatsApp atau telepon langsung sebelum student menerima contact request.
- Hidden score, connectivity_opportunity mentah, atau SNA metric.
- Student yang telah withdraw visibility.

### Visibility Withdrawal Consequence

- Withdrawn student segera tidak muncul pada search baru dan index result.
- Candidate yang tersimpan tetap tampil pada saved list tetapi status berubah
  menjadi "Tidak tersedia" dengan penjelasan bahwa student telah menarik
  visibility.
- Contact request yang sudah dikirim tetap dapat direspons oleh student, tetapi
  recruiter tidak dapat mengirim permintaan baru ke student yang withdrawn.
- Contact yang sudah accepted tetap aktif sampai student mencabut consent atau
  contact expired.

### Anti-Goals

Tidak mencakup billing, raw evidence privat, inclusion signal, private message
evaluation, phone langsung sebelum acceptance, hidden score, atau synthetic
leaderboard untuk recruiter.

## States and Ranges

### Organization

- **Pending:** recruiter organization menunggu verifikasi platform admin. Talent
  Portal tidak dapat diakses.
- **Rejected:** verifikasi ditolak. Pesan menjelaskan alasan dan recovery action.
- **Verified:** organization aktif. Recruiter dapat masuk ke Talent Portal.
- **Suspended:** organization dinonaktifkan sementara. Search dan contact aktif
  dihentikan.

### Entitlement

- **Inactive:** recruiter telah terverifikasi tetapi entitlement belum
  diaktifkan oleh platform admin.
- **Scheduled:** entitlement memiliki tanggal mulai di masa depan.
- **Active:** recruiter dapat melakukan search, menyimpan kandidat, dan mengirim
  contact request dalam kuota yang diberikan.
- **Expired:** entitlement melewati tanggal akhir. Riwayat pencarian tersimpan
  tetapi search dan contact baru tidak tersedia.
- **Revoked:** entitlement dicabut secara manual oleh platform admin. Semua akses
  Talent Portal berhenti seketika.

### Candidate Search

- **Empty index:** belum ada student yang mengaktifkan discoverability. Empty
  state menjelaskan kondisi ini dan menyarankan untuk kembali nanti.
- **No filter result:** filter menghasilkan nol kandidat. Penjelasan menyebutkan
  filter aktif dan CTA untuk menyesuaikan atau menghapus filter.
- **Filtered result (typical: 10-50, max: paginated):** result dalam ruled
  ledger rows. Filter URL-addressable dan dapat dibagikan hanya kepada entitled
  member dalam organization yang sama.
- **Large paginated result:** navigasi pagination mempertahankan filter aktif
  dan scroll position.
- **Unavailable candidate:** student telah withdraw visibility. Candidate yang
  tersimpan tetap muncul dengan status "Tidak tersedia".

### Candidate Detail

- Artifact/portfolio dengan provenance ledger (kontribusi, skill, verification
  source, availability context).
- Status availability, last active timestamp, dan verification source.
- Hanya data yang diproyeksikan student melalui portfolio visibility.
- Recruiter tidak melihat data di luar projection portfolio.

### Contact Request

- **Pending:** recruiter telah mengirim permintaan. Status dan timestamp tampil
  pada contact tracker.
- **Accepted:** student menerima permintaan. Recruiter memperoleh akses kontak
  yang disetujui (nama, kontak yang dipilih student).
- **Declined:** student menolak permintaan. Recruiter menerima status declined
  tanpa reason.
- **Expired:** permintaan melebihi batas waktu respons tanpa jawaban student.
  Recruiter dapat mengirim ulang jika kuota tersedia.
- **Canceled:** recruiter membatalkan permintaan sebelum direspons student.

### Student Visibility

- **Opted in:** portfolio dapat ditemukan recruiter melalui search.
- **Opted out:** portfolio tidak muncul pada search. Status default student baru.
- **Withdrawn:** student mencabut visibility. Lihat Visibility Withdrawal
  Consequence.

### Ranges

- 0-50 candidate per search page.
- Filter: skill, verification source, availability, institution (tenant-scoped).
- 0-200 saved candidates.
- Contact quota per entitlement.
- Contact response window sesuai konfigurasi.

## Interaction and Layout

### Topology

Desktop: filter rail kiri (sticky), result list tengah (working column), context
rail kanan (saved/contact tracker). Tablet: filter sebagai panel yang dapat
dibuka, result list utama. Mobile: filter sebagai sheet, result list stacked,
detail sebagai screen terpisah.

### URL Filter

Filter hidup di URL query parameter. URL dapat dibagikan hanya kepada member
entitled dalam organization yang sama. Saat entitlement expired, URL filter
menampilkan forbidden state, bukan data kosong. Recruiter di luar organization
menerima forbidden, bukan empty.

### Result List

Candidate index memakai ruled ledger rows dengan: reference line, nama, skill
ringkasan, availability badge, verification source icon, dan action save/contact.
Baris dipisahkan oleh rule line, bukan card boundary. Setiap baris dapat diklik
untuk membuka candidate detail.

### Candidate Detail

Artifact/portfolio menempati area utama. Metadatanya (skill, contribution,
verification source, last active) tampil sebagai ruled fact rows pada provenance
ledger. Contact action menempati footer docket. Saved state memberikan optimistic
feedback dengan rollback.

### Contact Panel

Contact panel menjelaskan: data yang akan dibagikan ke recruiter bila student
menerima, masa berlaku permintaan, dan bahwa student yang memilih respons.
Contact request yang sudah dikirim menampilkan status live
(pending/accepted/declined/expired).

### Save dan Contact

Save memberikan optimistic toggle dengan rollback. Contact request memerlukan
confirmation yang menjelaskan data yang akan dikirim dan bahwa respons
ditentukan oleh student.

### Responsive Behavior

- Desktop: split workspace (filter rail, working ledger, context rail).
- Tablet: filter sebagai panel togglable. Saved/contact tracker di bawah result
  atau sebagai sheet.
- Mobile (320px): stacked labeled rows tanpa horizontal overflow. Filter sebagai
  bottom sheet. Detail dibuka sebagai screen baru. Contact action tetap di
  footer sticky.

## Accessibility

### Keyboard

- Filter dapat dioperasikan dengan keyboard (Tab/Shift+Tab untuk navigasi,
  Enter/Space untuk toggle).
- Active filter chip dapat dihapus dengan keyboard (Enter/Space pada remove
  icon).
- Result list memiliki focus order: filter, result rows, pagination.
- Candidate detail dapat dijangkau dengan keyboard dan Escape kembali ke list.
- Contact confirmation dialog tidak memerangkap focus.
- Saved toggle dapat dioperasikan dengan Enter/Space.
- Contact status diumumkan tanpa modal trap.

### Screen Reader

- Result list memiliki table/list semantics (`role="list"`, `role="listitem"`)
  dengan label yang membedakan setiap kandidat.
- Active filters diumumkan sebagai "Filter aktif:" diikuti oleh nama filter dan
  nilai.
- Contact status diumumkan melalui `aria-live="polite"` ketika berubah.
- Candidate detail menggunakan landmark yang jelas: artifact region, provenance
  region, action region.
- Status organization/entitlement diumumkan pada entry point Talent Portal.
- Entitlement expiry diumumkan sebagai warning ketika mendekati batas.
- Empty state membacakan penjelasan dan CTA.

### Reduced Motion

- Semua animation menghormati `prefers-reduced-motion`.
- Row insertion dan status change menggunakan `ease-ledger` hanya ketika motion
  diizinkan.
- Saved toggle animation dinonaktifkan pada reduced motion; status tetap
  terlihat melalui icon dan label.
- Optimistic feedback rollback menggunakan transition instan pada reduced motion.
- Filter panel dan sheet membuka tanpa animasi pada reduced motion.

### Non-Color Status

Setiap status memiliki text, icon, atau shape yang tetap dapat dibaca tanpa
persepsi warna:

- Organization status: label teks dengan icon (Verified Mark untuk verified,
  Pending Review untuk pending, Correction Required untuk
  rejected/suspended/revoked).
- Entitlement status: label teks dengan icon dan tanggal berlaku.
- Contact status: label chip dengan icon dan teks eksplisit (Menunggu respons,
  Diterima, Ditolak, Kedaluwarsa, Dibatalkan).
- Withdrawn/unavailable: icon dan teks "Tidak tersedia" dengan penjelasan
  singkat.

### Mobile Consequence

- Mobile (320px) memakai stacked labeled rows tanpa horizontal overflow.
- Filter sebagai bottom sheet yang tidak menutup list saat aktif.
- Candidate detail sebagai screen baru dengan tombol kembali.
- Contact decision (student) adalah primary screen dengan docket layout.
- Sticky footer untuk primary action tetap di atas keyboard virtual.

## Constraints and Gates

- Organization verification, entitlement issuance, retention, dan contact quota
  policy memerlukan governance approval.
- Semua query recruiter institution-scoped. Recruiter hanya melihat student dari
  institusi yang diizinkan oleh entitlement.
- Recruiter identity diverifikasi oleh platform admin sebelum entitlement
  diterbitkan.
- Contact data yang dibagikan terbatas pada yang dipilih student saat menerima
  permintaan.
- Tidak ada price, billing, atau customer claim.
- Entitlement provisioning dan revocation diaudit dalam append-only log.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md). Kontrak
per region:

- **Initial page load:** app shell, Talent Portal heading, dan entry-point
  organization/entitlement status stabil dari server. Search filter dan saved
  count tetap tampil. Candidate result region menggunakan skeleton yang
  mempertahankan geometry ruled ledger rows (10 baris realistic). Skeleton row
  mempertahankan reference line width, skill tag width, availability badge
  width, dan spacing antar baris. Region memiliki `aria-busy="true"` dan satu
  `role="status"` announcement "Memuat daftar kandidat."

- **Deferred region:** hanya candidate result region yang menunggu data. Filter
  rail, heading, dan saved count tetap dapat digunakan. Skeleton region tidak
  menghilangkan primary action yang sudah siap.

- **Pagination dan refresh:** baris result yang sudah ada dipertahankan.
  Skeleton row muncul di posisi data halaman berikutnya. Refresh tidak
  menghapus filter aktif, URL query, atau selected candidate.

- **Candidate detail loading:** artifact area dan provenance ledger memakai
  skeleton terpisah. Artifact skeleton mempertahankan geometry konten utama.
  Provenance ledger skeleton mempertahankan ruled fact row geometry (skill,
  contribution, verification source, last active). Heading candidate tetap
  tampil. Contact action disabled sampai data lengkap.

- **Saved list loading:** saved candidate list memakai skeleton per row.
  Heading, count, dan filter tetap tampil. Contact tracker pada context rail
  tetap terlihat dengan status sebelumnya.

- **Contact tracker loading:** contact history dan status memakai skeleton per
  item. Count dan heading tetap tampil.

- **Processing command:** save toggle, contact request, accept/decline, dan
  visibility toggle memakai inline progress atau Spinner pada tombol yang
  ditekan. Content sebelumnya tetap terlihat. Optimistic save feedback dengan
  rollback. Tidak ada full-page skeleton untuk processing.

- **Empty state:** ketika query sukses tetapi tidak ada data, render empty state
  dengan:
  - "Belum ada kandidat yang mengaktifkan discoverability." untuk empty index
    dengan CTA kembali nanti.
  - "Tidak ada hasil untuk filter [nama filter]." untuk no filter result dengan
    CTA menyesuaikan atau menghapus filter.

- **Error dan forbidden:** error menggantikan skeleton dengan pesan pemulihan
  dan retry. Forbidden menjelaskan batas permission tanpa membocorkan resource:
  - Organization pending/rejected menampilkan status dan recovery action.
  - Entitlement inactive/expired/revoked menampilkan status dan masa berlaku.
  - Cross-tenant access atau unauthorized role menampilkan forbidden dengan
    penjelasan bahwa resource ini terbatas untuk recruiter terverifikasi.

- **Expired dan unavailable:** expired contact menampilkan status "Kedaluwarsa"
  dengan timestamp dan resend CTA bila kuota tersedia. Unavailable candidate
  menampilkan status "Tidak tersedia" dengan penjelasan bahwa student telah
  menarik visibility.

- **Stale:** data lebih dari 5 menit sejak fresh query menampilkan timestamp
  "Terakhir diperbarui" dan reload action.

- **Reduced motion:** skeleton animation dinonaktifkan. Informasi loading tetap
  tersedia melalui text/status semantics. Semua status diumumkan tanpa
  bergantung pada animasi.
