# Content dan Accessibility SATU

## Voice

Gunakan bahasa Indonesia yang jelas, tenang, spesifik, dan berorientasi pemulihan. Kata teknis English boleh dipakai jika menjadi istilah engineering atau product yang lebih tepat.

Gunakan: `Perlu ditinjau`, `Belum cocok dengan roster`, `Peluang kolaborasi`, `Kontribusi terverifikasi`, `Data synthetic`.

Hindari pada student dan recruiter UI: `rentan`, `terisolasi`, `bermasalah`, diagnosis, hidden score, atau janji dampak yang belum terbukti.

Jangan gunakan Unicode em dash pada UI atau dokumentasi first-party.

## Canonical Terminology

| Konsep                 | Istilah UI                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Institution membership | Afiliasi kampus                                            |
| Institution roster     | Roster mahasiswa                                           |
| Verified phone         | Nomor WhatsApp terverifikasi                               |
| Contribution review    | Validasi kontribusi                                        |
| Inclusion signal       | Sinyal peluang kolaborasi, hanya pada restricted campus UI |
| Recruiter entitlement  | Hak akses Talent Portal                                    |
| Synthetic data         | Data synthetic                                             |
| Contact request        | Permintaan kontak                                          |
| Leaderboard            | Peringkat                                                  |

## Status Copy

Status selalu berisi keadaan, akibat, dan tindakan berikutnya bila tersedia. Warna tidak boleh menjadi satu-satunya pembeda.

Contoh: `Belum cocok dengan roster. Afiliasi Anda masuk peninjauan kampus. Anda tetap dapat melengkapi profil.`

## Error Formula

`Apa yang gagal + apa yang tetap aman + tindakan pemulihan`.

Jangan mengekspos token, stack trace, provider payload, keberadaan account lain, atau detail authorization.

## Accessibility Target

- WCAG 2.2 AA.
- Landmark, heading, label, description, status, dan error semantics yang benar.
- Semua flow dapat diselesaikan dengan keyboard tanpa time trap.
- Visible focus, logical focus order, skip link, dan focus restoration.
- Touch target memadai serta pointer cursor untuk enabled interactive target.
- Disabled target memakai not-allowed cursor dan alasan yang dapat ditemukan.
- Contrast, zoom 200%, reflow, screen reader, dan high-content-length diuji.
- `prefers-reduced-motion` dihormati. Tidak ada essential information yang bergantung pada animation.
- Live region dipakai hemat untuk OTP status, save result, queue result, dan realtime delta penting.

## Data Visualization

Graph, chart, dan leaderboard menyediakan text/table equivalent, description, selected state, keyboard navigation yang masuk akal, dan tidak mengandalkan warna. Cohort suppression, denominator, time window, synthetic status, dan update time harus terlihat.

## Review Checklist

- Bahasa tidak memberi stigma dan tidak mengklaim hasil yang belum terbukti.
- Primary action serta recovery dapat ditemukan.
- Empty, loading, error, offline, stale, forbidden, dan destructive state tersedia bila relevan.
- Screen reader mengumumkan perubahan penting tanpa noise.
- Phone dan NIM tidak muncul pada copy, screenshot, log, atau projection yang tidak perlu.
