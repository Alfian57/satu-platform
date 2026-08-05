---
version: 1
slug: 'resources-js-pages-dashboard-tsx'
primary_target: 'resources/js/pages/dashboard.tsx'
related_targets: ['route:/dashboard']
---

# Student Dashboard

## Job and Audience

Student tiba setelah login untuk mengetahui tindakan paling bernilai sekarang:
melengkapi kesiapan, merespons peluang tim, melanjutkan task, atau memperbaiki
contribution. Mode: **Operate**.

## Outcome and Proof

Dalam beberapa detik student memahami satu primary next action, alasan tindakan
tersebut relevan atau blocking, deadline, provenance keputusan, dan status active
work. Dashboard membuktikan mekanisme SATU melalui recommendation explanation
dan contribution provenance, bukan klaim “AI”.

## Selected Direction Contract

**THESIS:** Dashboard adalah active docket untuk satu server-authoritative next
action; pola kumpulan metric card setara ditolak.

**OWN-WORLD:** Cool mineral field, graphite ink, institutional action accent,
ruled alignment, squared index marker, compact semantic mark, dan flat resting
surfaces.

**STORY:** Student melihat apa yang harus dilakukan, alasan dan sumbernya,
deadline, lalu bertindak; project ledger dan recommendation menjaga konteks
kerja yang lebih luas.

**FIRST VIEWPORT:** Persistent index navigation; main region berisi greeting,
dominant docket, lalu active project ledger; narrow context rail memuat review
queue dan recommendation reasons. Primary CTA berada di kaki docket.

**FORM:** Comp **A: Docket-first**, dipilih langsung dari tiga comp P01.
Staging: index + docket + ledger + rail. Concept seed tidak digunakan karena
arah dipilih langsung oleh pengguna.

## Signature Moment

Status margin pada docket menghubungkan state “perlu revisi” dengan reference,
project, reviewer, deadline, catatan, dan primary action dalam satu scan path.
Karakter ini berasal dari hubungan evidence dan action, bukan dari tekstur buku,
logo generatif, atau ornament administrasi.

## Scope and Boundaries

Mencakup next action, profile atau verification readiness, recommendation,
active projects, deadline, contribution status, dan notification summary. Tidak
mencakup full project management, admin metrics, leaderboard, atau inclusion
label. Existing Laravel placeholder tidak dipertahankan sebagai identity.

Approved comp adalah north star, bukan pixel specification atau runtime asset.
Sample person, project, date, icon, logo treatment, dan copy di dalam gambar
bersifat ilustratif. Jangan merasterisasi UI, menyalin ukuran gambar sebagai
token, atau menganggap seluruh secondary region harus menjadi bordered card.

## States and Ranges

- First run: belum ada profile atau project; docket mengarahkan satu setup action.
- Pending affiliation: jelaskan batas capability tanpa dead end.
- No recommendation: jelaskan data yang kurang dan cara memperbaikinya.
- Invitation atau request pending, active team, dan revision required.
- Realtime reconnect dan stale summary.
- 0–12 active projects; first viewport hanya menampilkan item terpenting dan
  menyediakan jalan ke daftar lengkap.
- 0–20 pending items; count tidak menggantikan penjelasan item prioritas.
- Tampilkan 2–3 recommendation reasons terkuat; jangan menambah alasan palsu
  ketika hanya satu alasan tersedia.

## Interaction and Layout

Server menentukan next action; frontend tidak mengarang priority. Docket
mempertahankan anatomy reference/status margin, headline, ruled facts,
provenance, dan action footer saat content berubah. Primary action tegas;
secondary detail tidak boleh bersaing secara visual.

Pada small laptop, first viewport harus tetap memperlihatkan primary action,
deadline, minimum dua active-project rows, dan recommendation explanation.
Desktop memakai index navigation, working column dominan, dan context rail yang
dipisahkan rule line. Tablet meruntuhkan rail menjadi supporting section setelah
project ledger. Mobile memakai top app bar dan urutan: identity/status, docket,
primary action, active work, recommendation, lalu pending history. Ledger row
berubah menjadi stacked labeled row tanpa horizontal overflow.

Skeleton mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md), hanya
untuk deferred region, dan mempertahankan geometry. Status selalu
memakai text dan shape/icon selain warna. Focus order mengikuti reading order
dan tidak melompat dari docket ke rail.

## P07 Approval Feedback Contract

Top app bar menyediakan shortcut biner untuk berpindah antara tema terang dan
gelap. Shortcut selalu mencerminkan tindakan berikutnya; pilihan Sistem tetap
tersedia pada halaman Pengaturan tampilan. Target ini, sidebar trigger, menu
akun, dan seluruh kontrol aktif lain memiliki pointer cursor serta target sentuh
minimum 44px pada mobile.

Root grid dashboard menjadi flex item yang sekurang-kurangnya memenuhi sisa
tinggi semantic `main` setelah app bar. Long content tetap memperpanjang halaman
secara alami dan tidak dipaksa masuk ke viewport.

Copy dashboard menggunakan label “Direview oleh”, tanggal Indonesia lengkap,
dan kalimat Indonesia tanpa karakter Unicode em dash. Kontrak yang sama berlaku
untuk shell, autentikasi, dan pengaturan; istilah objek `Project` dan `Skill`
tetap mengikuti canonical terminology.

## P06 State and Responsive Contract

Reference dashboard menyediakan preview client-only melalui
`?state=<scenario>` untuk `revision`, `first-run`, `empty`, `loading`,
`long-content`, `partial-permission`, `error`, dan `stale`. Switcher tidak
ditampilkan di UI; nilai kosong atau tidak dikenal kembali ke `revision`.
Fixture tetap berlabel sintetis, tidak menambah backend prop, dan dipertahankan
sampai P28 menggantinya dengan application data yang server-authoritative.

`loading` hanya mengganti ledger dan recommendation dengan skeleton serta polite
announcement; next action tetap tersedia. `error` mempertahankan next action dan
memberi recovery per region. `partial-permission` menjelaskan fitur yang
tetap tersedia tanpa menampilkan protected action. `long-content` memperlihatkan
tiga dari maksimal dua belas project dan menyediakan jalan ke sisanya. State
stale menampilkan timestamp dan reload action tanpa mengarang sinkronisasi.

Acceptance reflow yang dikunci:

- 320–639px: satu kolom, status margin menjadi top strip, fact dan ledger menjadi
  labeled stacked rows, CTA selebar container, lalu context rail setelah ledger;
- 640–1279px: status kembali menjadi side margin, ledger memakai kolom saat
  ruang cukup, dan supporting region dapat menjadi dua kolom sebelum rail
  kembali ke bentuk desktop;
- mulai 1280px: working column dan context rail berdampingan; pada 1366×768
  primary CTA, dua row project, dan satu alasan rekomendasi berada di viewport
  pertama;
- seluruh range memakai wrapping tanpa silent truncation atau document-level
  horizontal overflow, target interaktif minimum 44px, visible focus, status
  text + icon, dark mode, serta reduced-motion fallback.

Chromium browser regression menjalankan seluruh state, overflow pada
320×800/768×1024/1366×768/1672×941, urutan visual mobile, keyboard activation,
dark mode, serious accessibility issues, dan recovery copy. P07 tetap memiliki
human gate untuk kritik, polish, screenshot approval, dan pembaruan design
authority.

## P04 App Shell Contract

Shell terautentikasi memakai typographic SATU wordmark, opaque top app bar,
desktop index navigation, dan mobile drawer. Karena Dashboard masih menjadi
satu-satunya primary destination yang tersedia, shell hanya menampilkan route
tersebut melalui Wayfinder; route phase berikutnya tidak ditampilkan sebagai
placeholder.

Page context tampil sebagai breadcrumb pada desktop dan current-page label pada
mobile. User control tetap tersedia di top app bar. Institution membership
dibaca dari shared Inertia prop yang nullable; sebelum domain membership
dibangun, shell menampilkan “Belum terhubung” tanpa mengarang institusi atau
status. Context rail memakai semantic `aside`, berada di sisi kanan mulai
breakpoint `xl`, dan turun setelah main content pada viewport yang lebih sempit.

## Constraints and Open Decisions

WCAG 2.2 AA, keyboard-first, no sensitive inference, Wayfinder routes, dan
server state tetap authority. P03 menetapkan Familjen Grotesk untuk display/body,
Azeret Mono untuk technical label, semantic light/dark tokens, 2px offset focus,
small controlled radii, flat resting surfaces, dan dukungan Light/Dark/System.
Keputusan tersebut tidak mengubah topology comp A. App shell memakai icon
Lucide yang sudah tersedia. Dashboard query tetap terbuka sampai phase teknis
yang memilikinya dan harus tetap server-authoritative.
