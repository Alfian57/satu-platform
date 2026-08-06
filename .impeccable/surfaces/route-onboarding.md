---
version: 3
slug: 'route-onboarding'
primary_target: 'route:/onboarding'
related_targets: ['route:/register', 'route:/notifications']
---

# Student Onboarding, Affiliation, Profile, and Skills

## Job and Audience

Student baru ingin mengaktifkan account, membuktikan afiliasi kampus, dan memberi cukup informasi untuk recommendation tanpa merasa dinilai secara psikologis. Mode: **Operate**.

## Outcome and Proof

Student memahami perbedaan phone verified, account active, dan affiliation verified. Mereka menyelesaikan institution, NIM, profile minimum, skills, availability, consent, notification preference, dan portfolio visibility.

## Selected Direction

Enrollment ledger progresif dalam visual world **Buku Besar Kolaborasi**. Setiap section memiliki status, akibat, dan next action. Bukan decorative wizard dan tidak memakai progress palsu. Section index menampilkan ruled fields dan status mark sesuai grammar ledger.

## Scope and Boundaries

**Job:** Affiliation proof, roster matching, profile completion, skill registration, availability declaration, consent capture, notification preference, dan portfolio visibility.
**Boundaries:** Mencakup handoff setelah phone verification, roster match, manual review recovery, profile, skills, availability, consent, notification preference, dan visibility. Tidak meminta email, mental-health questionnaire, popularity, atau recruiter data yang belum diperlukan.
**Provider boundary:** Roster data berasal dari institution upload. SATU tidak menyimpan raw roster sebagai public data. Manual review adalah recovery path, bukan first-class flow.

## States and Ranges

### Affiliation States
- **Roster exact match:** NIM dan verified phone cocok dengan roster. Affiliation langsung verified.
- **Roster ambiguous:** NIM cocok tetapi phone berbeda. Masuk peninjauan kampus.
- **Roster unavailable:** institution belum mengunggah roster. Pilihan: profil dulu atau tunggu.
- **Roster revision:** data roster diperbarui kampus, re-evaluasi otomatis.
- **Manual review pending:** menunggu campus admin. Status non-stigmatisasi. Tidak ada polling noise.
- **Manual review rejected:** tidak cocok dengan catatan kampus. Recovery: hubungi operator kampus.
- **Affiliation verified:** status final, muncul sebagai Verified Mark di profil.
- **Permission loss:** affiliation dicabut. Halaman menampilkan recovery state yang dapat difokuskan.

### Profile States
- **Empty:** belum ada data profil. Next action: isi profil.
- **Partial:** beberapa field terisi. Section index menunjukkan progress.
- **Valid:** semua field minimum terpenuhi.
- **Duplicate skill:** skill sudah terdaftar. Suggestion: hapus duplikat.
- **Custom skill proposal:** skill baru diajukan untuk review admin.

### Save and Network States
- **Idle:** form siap diedit.
- **Processing:** inline Spinner pada button, form tetap terlihat.
- **Saved:** confirmation inline, bukan toast yang menutupi content.
- **Network error:** offline atau timeout. Recovery: retry, current input tidak hilang.
- **Stale session:** token session kedaluwarsa sebelum save. Recovery: login ulang.
- **Forbidden:** permission afiliasi berubah saat form terbuka. Recovery state menjelaskan alasan.
- **Rate limited/cooldown:** terlalu banyak percobaan dalam waktu singkat. Recovery: tunggu timer.

### Data Ranges
- 0 sampai 30 skills.
- 0 sampai 5 evidence items per skill.
- Institution list: 1 sampai 200+ institution.

### Privacy
- NIM dimasking pada context rail setelah verifikasi.
- Nomor WhatsApp dimasking setelah phone verification.
- Consent dijelaskan sebelum diminta; tidak ada pre-checked toggle.
- Portfolio visibility default: tidak dibagikan ke recruiter.
- Data portofolio belum dibagikan sampai student menyetujui secara eksplisit.

## Interaction and Layout

Section index dapat diklik untuk item yang tersedia dan menunjukkan blocker. Data tersimpan per section. Privacy explanation berada dekat toggle. Mobile single column, desktop boleh menampilkan summary rail (context rail "Progres dan privasi onboarding"). Primary action selalu menyebut akibat berikutnya.

### Keyboard
Tab order mengikuti urutan section. Setiap section memiliki heading yang dapat dijangkau keyboard. Error summary menerima focus setelah submit gagal. Skip link tersedia menuju section pertama yang belum selesai. Tooltip dan dropdown dapat dioperasikan dengan keyboard (Enter/Space untuk buka, Escape untuk tutup). Skill suggestion dapat dipilih dengan Arrow keys.

### Screen Reader
Landmark: main, navigation, complementary (context rail). Progress indikator memakai `role="progressbar"` dengan `aria-valuenow`. Status roster tidak bergantung pada warna; setiap status memiliki label text. Live region mengumumkan hasil save per section: "Profil tersimpan" atau "Gagal menyimpan. Periksa koneksi Anda." Pending review memakai status semantics tanpa polling noise. Phone dan NIM dimumkan sebagai "diverifikasi", bukan dibacakan nilainya.

### Reduced Motion
`prefers-reduced-motion` menonaktifkan: section transition, progress bar animation, skeleton shimmer, dan success indicator animation. Status perubahan tetap tersedia melalui text announcement. Scroll behavior smooth dinonaktifkan.

### Mobile Consequence
Single column pada 320px. Context rail ("Progres dan privasi onboarding") tampil sebagai section statis atau dapat dibuka. Touch target minimum 44px. Skill tag dapat dihapus dengan tap. Dropdown institution memiliki search dan virtual scroll untuk daftar panjang. Tidak ada horizontal overflow. Keyboard virtual tidak menutupi primary action.

## Recovery and Accessibility

Status roster tidak bergantung pada warna. Focus dipindah ke section error setelah submit, termasuk ketika validation gagal berulang kali. Jika permission afiliasi berubah, halaman menampilkan recovery state yang dapat difokuskan dan menjelaskan bahwa request tidak diproses. Pending result memakai status semantics tanpa polling noise. Semua informasi phone dimasking setelah verification.

## Constraints and Gates

Roster format, active-member definition, dan manual-review SLA ditentukan melalui governance issue. Campus admin/recruiter role tidak tersedia melalui registrasi publik.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).

- Initial page load: app shell stabil. Region affiliation, profile, dan skills memakai skeleton masing-masing. Section index dan next action tetap terlihat bila sudah tersedia.
- Deferred region: institution list atau skill suggestion memakai skeleton tanpa menghapus form yang sudah terisi.
- Save dan affiliation submit: form tetap terlihat, button menampilkan inline Spinner dengan disabled state. Jangan mengganti seluruh content dengan skeleton setelah user menekan action.
- Section-level skeleton: mempertahankan geometry section sebenarnya, jumlah field, dan spacing. Tidak menghapus progress atau next action yang sudah tersedia.
- Empty: setiap section empty memiliki next action (misalnya "Tambahkan skill pertama").
- Error/network error/timeout: pesan pemulihan dengan retry. Current input tidak hilang.
- Keyboard dan screen reader: region loading memiliki `aria-busy="true"` dan satu polite announcement per region yang dimuat. Decorative skeleton block disembunyikan.
