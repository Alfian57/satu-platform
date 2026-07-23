# Content dan Accessibility SATU

## 1. Voice

SATU berbicara profesional, jelas, dan mendukung tindakan. Copy tidak hiperbolis, tidak menilai karakter pengguna, dan tidak menyembunyikan akibat privacy.

### Gunakan

- “Peluang ini cocok dengan 3 skill di profilmu.”
- “Afiliasi kampusmu sedang ditinjau.”
- “Bukti perlu diperbaiki sebelum dapat divalidasi.”
- “Kamu mengendalikan apakah item ini terlihat oleh recruiter.”
- “Kami belum memiliki cukup data untuk memberikan rekomendasi.”

### Hindari

- “Kami mendeteksi kamu kesepian.”
- “Mahasiswa rentan.”
- “AI memilih tim terbaik.”
- “Profilmu buruk/tidak menarik.”
- “Kesalahan tidak diketahui.”
- “Berhasil!” tanpa menyebut apa yang berubah.

## 2. Canonical Terminology

| Concept                | Label Indonesia        | Identifier               |
| ---------------------- | ---------------------- | ------------------------ |
| Project                | Project                | `project`                |
| Team                   | Tim                    | `team`                   |
| Skill                  | Skill                  | `skill`                  |
| Task                   | Tugas                  | `task`                   |
| Contribution           | Kontribusi             | `contribution`           |
| Evidence               | Bukti                  | `evidence`               |
| Validation             | Validasi               | `validation`             |
| Institution membership | Afiliasi kampus        | `institution_membership` |
| Match explanation      | Alasan kecocokan       | `match_explanation`      |
| Inclusion signal       | Sinyal partisipasi     | `inclusion_signal`       |
| Portfolio visibility   | Visibilitas portofolio | `portfolio_visibility`   |

Jangan berganti-ganti antara “proyek” dan “project” di dalam satu surface. Product memilih “Project” sebagai label UI; narasi umum boleh menggunakan “proyek” jika bukan label objek.

### Aturan Penulisan

- Gunakan “Direview oleh” sebagai label pihak yang melakukan review.
- Jangan gunakan karakter Unicode em dash pada copy produk atau dokumentasi first-party. Gunakan titik, koma, titik dua, atau tanda kurung sesuai hubungan antarkalimat.
- Hindari mencampur istilah teknis bahasa Inggris ke dalam kalimat pengguna jika padanan Indonesia yang jelas tersedia.

## 3. Status Copy

| Identifier         | UI label              | Guidance                                                  |
| ------------------ | --------------------- | --------------------------------------------------------- |
| `unverified`       | Belum terverifikasi   | Jelaskan feature yang tetap tersedia                      |
| `pending`          | Menunggu tinjauan     | Tampilkan siapa/apa yang meninjau dan estimasi bila nyata |
| `verified`         | Terverifikasi         | Tampilkan provenance                                      |
| `suspended`        | Akses ditangguhkan    | Tampilkan recovery atau contact path                      |
| `request_revision` | Perlu diperbaiki      | Sertakan actionable reason                                |
| `rejected`         | Tidak disetujui       | Bedakan final dan appealable                              |
| `reconnecting`     | Menghubungkan kembali | Jangan menyatakan data hilang                             |
| `stale`            | Ada perubahan terbaru | Tawarkan refresh/reconcile                                |

## 4. Error Message Formula

Error menjawab:

1. Apa yang tidak berhasil?
2. Data apa yang tetap aman/tersimpan?
3. Apa yang dapat dilakukan sekarang?
4. Apakah dukungan dibutuhkan?

Contoh:

> Bukti belum terkirim karena koneksi terputus. File dan deskripsimu masih ada di halaman ini. Hubungkan kembali lalu pilih “Coba kirim lagi”.

## 5. Accessibility Target

Target product adalah WCAG 2.2 Level AA.

### Perceivable

- Contrast memenuhi target untuk text, icon penting, focus, dan component state.
- Color tidak menjadi satu-satunya indikator.
- Chart memiliki summary dan data table.
- Image evidence memiliki description atau filename yang bermakna.
- Zoom 200% dan text spacing tidak menghilangkan fungsi.

### Operable

- Semua task dapat diselesaikan dengan keyboard.
- Focus order mengikuti reading/task order.
- Sticky header, dialog, dan toast tidak menutup focus.
- Target interaktif memenuhi minimum yang layak untuk touch.
- Target klik atau tap yang aktif menggunakan pointer cursor. Target nonaktif menggunakan not-allowed cursor.
- Drag-and-drop task memiliki button/menu alternative.
- Motion dapat dikurangi.

### Understandable

- Navigation dan labels konsisten.
- Form memiliki visible label, instruction, dan error association.
- Redundant data entry dihindari.
- Destructive action menjelaskan akibat.
- Authentication tidak mengandalkan puzzle kognitif.

### Robust

- Semantic HTML menjadi default.
- Heading hierarchy dan landmark benar.
- Icon-only control memiliki accessible name.
- Live region hanya digunakan untuk update penting.
- Realtime list update tidak mencuri focus.

## 6. Screen Reader dan Realtime

- New message tidak dibacakan seluruhnya secara otomatis saat pengguna bekerja di area lain.
- Status reconnect boleh memakai polite live region.
- Validation outcome yang dipicu pengguna diumumkan.
- Presence changes tidak membanjiri announcements.
- Ledger insertion mempertahankan focus dan menyediakan “Ada pembaruan” bila update besar.

## 7. Localization Readiness

- Jangan menyusun sentence dari potongan string.
- Gunakan named placeholders.
- Date/time memakai locale dan timezone institution/user.
- Identifier tidak ditampilkan sebagai label mentah.
- Layout mengakomodasi copy setidaknya 30% lebih panjang.
- Copy sensitif ditinjau manusia sebelum diterjemahkan.

## 8. Privacy Copy

Sebelum mengubah visibility, jelaskan:

- Data yang akan terlihat.
- Audience.
- Kapan perubahan berlaku.
- Cara membatalkan.

Consent tidak digabung dengan Terms yang tidak terkait. Withdrawal tidak boleh dibuat lebih sulit daripada pemberian consent.

## 9. Review Checklist

- Apakah copy memberi label pada orang, bukan menjelaskan state?
- Apakah “AI” digunakan untuk menutupi mekanisme?
- Apakah error memberi recovery?
- Apakah status memiliki text selain color?
- Apakah pengguna tahu audience data?
- Apakah synthetic evidence ditandai?
- Apakah focus dan announcements tetap terkendali saat realtime update?
