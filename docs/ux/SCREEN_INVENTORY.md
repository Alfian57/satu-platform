# Screen Inventory SATU

## Inventory

| Surface                   | Audience                                     | Mode       | Status target                     |
| ------------------------- | -------------------------------------------- | ---------- | --------------------------------- |
| Landing                   | Public                                       | Persuade   | Release                           |
| Register, login, recovery | Student                                      | Operate    | Release                           |
| Onboarding                | Student                                      | Operate    | Release                           |
| Notification center       | Authenticated                                | Operate    | Release                           |
| Dashboard                 | Student                                      | Operate    | Release, actual state-driven data |
| Project discovery/detail  | Student                                      | Operate    | Release                           |
| Workspace                 | Team                                         | Operate    | Release                           |
| Contribution/portfolio    | Student                                      | Operate    | Release                           |
| Public portfolio          | Public                                       | Experience | Release                           |
| Leaderboard               | Student/campus                               | Operate    | Release                           |
| Campus operations         | Campus                                       | Operate    | Release                           |
| Inclusion review          | Authorized campus                            | Operate    | Gated                             |
| Academic operations       | Campus                                       | Operate    | Sandbox release                   |
| Platform operations       | Platform admin                               | Operate    | Release                           |
| Undangan admin kampus     | Admin platform dan operator kampus terundang | Operate    | Release                           |
| Talent Portal             | Recruiter/student                            | Operate    | Release                           |

## Shared State Matrix

Setiap surface harus memilih state yang relevan dari: empty, loading, processing, success, validation error, network error, unauthorized, forbidden, stale, reconnecting, offline, partial data, overflow, destructive confirmation, expired, withdrawn, dan synthetic.

Untuk state loading, surface memakai skeleton per region sesuai
[LOADING_STATES.md](./LOADING_STATES.md). Full-page skeleton hanya boleh
digunakan bila struktur page belum diketahui dan tidak ada primary action yang
siap digunakan.

## Surface Acceptance

- Auth: OTP tidak membocorkan account existence; timer, resend, lockout, dan recovery accessible.
- Undangan admin kampus: pengiriman WhatsApp, token sekali pakai, kecocokan nomor terverifikasi, autentikasi terbaru, persetujuan eksplisit, serta pemulihan untuk kedaluwarsa, penggunaan ulang, dan nomor yang tidak cocok.
- Onboarding: affiliation outcome dan manual-review recovery dipahami. Profil hanya disimpan setelah membership verified; draft tetap tersedia saat menunggu review.
- Project: filter, explanation, capacity, dan permission state jelas.
- Workspace: keyboard-equivalent commands dan reconnect reconciliation tersedia.
- Contribution: version, evidence, reviewer reason, dan provenance terbaca.
- Leaderboard: period, denominator, cohort rule, opt-in, tie, dan calculation explanation terlihat.
- Campus/platform: queue dapat dipindai dan action memiliki reason serta audit consequence.
- Inclusion: restricted, non-diagnostic, human review, feature disabled, dan synthetic state terlihat.
- Talent: entitlement dan visibility boundary terlihat sebelum search/contact.
- Landing: synthetic demo berlabel, motion dapat dikurangi, dan tidak ada invented evidence.

## Arah Redesign Landing, Auth, dan Dashboard Mahasiswa

- Landing memakai maskot burung SATU sebagai focal point pada hero. Maskot boleh melampaui card di ruang yang disediakan, sementara copy dan CTA tetap terlihat. Journey, role selector, dan synthetic graph tetap bisa dipakai dengan keyboard serta memiliki text equivalent.
- Auth menampilkan form sebagai fokus utama dan maskot sebagai pendamping visual. Alur username/password, WhatsApp OTP, cooldown, anti-enumeration, expired, validation, dan processing tetap sama.
- Onboarding mempertahankan tiga langkah kampus, skill, dan availability/visibility. Saat afiliasi menunggu review kampus, pertahankan draft, jelaskan bahwa profil belum tersimpan, dan sediakan tindakan untuk memeriksa status.
- Dashboard menempatkan next action dan active projects berbasis data runtime sebagai konten utama. Recommendation explanation dan semua status deferred tetap mempertahankan state loading, empty, error, forbidden, stale, dan processing.
- Semua surface mewarisi token global pada DESIGN.md. Maskot tidak menutupi focus ring, copy, input, atau aksi. Layout harus reflow mulai 320px dan tetap dapat dioperasikan pada reduced motion.

## Build Priority

Urutan delivery ditentukan milestone GitHub M0 sampai M9. UI issue tidak boleh dimulai sebelum behavior surface, acceptance criteria, dan backend contract yang menjadi dependency tersedia pada owning docs dan issue.
