# Content dan Accessibility SATU

## Voice

Gunakan bahasa Indonesia yang jelas, tenang, spesifik, dan berorientasi pemulihan. Kata teknis English boleh dipakai jika menjadi istilah engineering atau product yang lebih tepat.

Gunakan: `Perlu ditinjau`, `Belum cocok dengan roster`, `Peluang kolaborasi`, `Kontribusi terverifikasi`, `Data synthetic`.

Hindari pada student dan recruiter UI: `rentan`, `terisolasi`, `bermasalah`, diagnosis, hidden score, atau janji dampak yang belum terbukti.

Jangan gunakan Unicode em dash pada UI atau dokumentasi first-party.

Jangan gunakan emoji pada UI, label, pesan status, atau dokumentasi produk.
Gunakan icon dari library yang sudah dipasang, disertai teks bila icon menyatakan
status atau aksi.

## Canonical Terminology

| Konsep                   | Istilah UI                                                 |
| ------------------------ | ---------------------------------------------------------- |
| Institution membership   | Afiliasi kampus                                            |
| Institution roster       | Roster mahasiswa                                           |
| Verified phone           | Nomor WhatsApp terverifikasi                               |
| Contribution review      | Validasi kontribusi                                        |
| Inclusion signal         | Sinyal peluang kolaborasi, hanya pada restricted campus UI |
| Recruiter entitlement    | Hak akses Talent Portal                                    |
| Synthetic data           | Data synthetic                                             |
| Contact request          | Permintaan kontak                                          |
| Leaderboard              | Peringkat                                                  |
| Core student role        | Mahasiswa                                                  |
| Core administrative role | Admin Universitas                                          |
| Admission year           | Angkatan masuk (tahun empat digit, contoh 2023)            |

Kontrak target 14 Oktober 2026 memakai dua label role inti tersebut.
Operator atau peninjau kampus merupakan pekerjaan dalam role Admin
Universitas, dan pemilik proyek adalah kewenangan mahasiswa pada proyek.
Admin platform serta admin kampus hanya disebut sebagai runtime lama atau
riwayat transisi, bukan label role runtime inti U05. Nama universitas ditampilkan sebagai
informasi dari server; alur target tidak memakai pilihan kampus atau janji
akses administrator melalui registrasi publik.

## Bahasa Universitas Tunggal

SATU melayani Universitas Teknologi Yogyakarta, bukan layanan banyak kampus.
Gunakan nama universitas dari server saat nama diperlukan. Label cukup
Universitas, bukan Universitas tujuan, kampus terpilih atau institusi aktif.
Kolaborasi lintas program studi tetap boleh disebut, bukan lintas kampus.
Petunjuk pengguna mengutamakan verifikasi mahasiswa dan tugas berikutnya,
bukan penjelasan tenant, pemilihan server atau perpindahan universitas.
Jangan menawarkan pemilihan atau pendaftaran kampus. Pada filter perekrut,
jelaskan izin berbagi portofolio, bukan penelusuran lintas institusi.
Tautan dengan filter historis tetap diberi konteks tanpa menawarkan pilihan
kampus baru. Batas izin, keadaan konfigurasi gagal, serta pemberitahuan data
lama tetap jujur; perapian bahasa tidak menghapus data atau memperluas akses.
Dokumen teknis dan riwayat transisi boleh menyebut batas antar-institusi,
tetapi tidak disajikan sebagai fitur yang ditawarkan kepada pengguna.

## Status Copy

Pop-up pengajuan afiliasi awal menjelaskan bahwa NIM, fakultas, program studi
dan angkatan masuk wajib diisi. Hanya form afiliasi yang ditampilkan sebelum
verifikasi. Tidak ada tombol tutup pada form wajib; Escape dan klik di luar
tidak menutupnya. Keluar akun menyediakan jalan keluar yang jelas. Sesudah
pengajuan pending tersimpan, gunakan `Pengajuan afiliasi berhasil dikirim. Menunggu verifikasi Admin Universitas.`
dan tampilkan status Beranda. Bekal kemampuan serta cara berkolaborasi baru
ditampilkan sesudah afiliasi verified. Kelengkapan isian tidak menjamin identitas
sah; verifikasi roster atau keputusan admin tetap diperlukan.

Status selalu berisi keadaan, akibat, dan tindakan berikutnya bila tersedia. Warna tidak boleh menjadi satu-satunya pembeda.

Contoh: `Belum cocok dengan roster. Afiliasi Anda masuk peninjauan kampus. Fakultas, program studi, dan angkatan masuk tersimpan sebagai draft pribadi dan akan mengisi Profil kemampuan setelah afiliasi disetujui. Profil baru disimpan setelah afiliasi terverifikasi.`

Setelah penyimpanan pada editor Profil kemampuan atau pop-up pelengkapan
dikonfirmasi server, notifikasi sukses berbunyi
`Data profil berhasil tersimpan.` lalu mahasiswa diarahkan ke Beranda. Jangan
batasi konfirmasi pada profil baru; pembaruan profil yang sudah ada sejak
onboarding memakai perilaku yang sama. Jangan menampilkan notifikasi sukses
atau mengalihkan halaman untuk validasi gagal atau hasil
penyimpanan yang belum dapat dipastikan; pertahankan draft dan minta mahasiswa
memuat data tersimpan sebelum mencoba kembali.

Pada bagian `Tentang dirimu` di Profil kemampuan, label akademik serta kolom
Cerita singkat tidak memakai akhiran `(opsional)`, tetapi kolom tetap boleh
kosong. Data yang sudah tercatat ditampilkan sebagai nilai hanya-baca dengan
penjelasan singkat bahwa data tidak dapat diubah dari menu mahasiswa. Nilai yang
belum tercatat dapat dilengkapi satu kali. Status tidak dibedakan melalui warna
saja.

## Error Formula

`Apa yang gagal + apa yang tetap aman + tindakan pemulihan`.

Jangan mengekspos token, stack trace, provider payload, keberadaan account lain, atau detail authorization.

## Accessibility Target

Pada registrasi, bintang jingga gelap setelah label menandai isian wajib,
termasuk persetujuan dan kode OTP. Petunjuk menjelaskan arti bintang dan atribut
required tetap dipertahankan untuk pembaca layar serta validasi native.
Bintang dekoratif memakai aria-hidden agar tidak dibaca sebagai bagian nama
field. Login tidak memakai penanda ini. Warna bukan satu-satunya petunjuk.

Pop-up pengajuan afiliasi memakai penanda yang sama untuk NIM, angkatan masuk,
fakultas dan program studi yang wajib serta masih dapat diisi. Pengantar
menjelaskan arti bintang. Nama universitas dan data akademik yang sudah
terkunci tidak memerlukan penanda isian wajib.

- WCAG 2.2 AA.
- Landmark, heading, label, description, status, dan error semantics yang benar.
- Semua flow dapat diselesaikan dengan keyboard tanpa time trap.
- Visible focus, logical focus order, skip link, dan focus restoration.
- Touch target memadai serta pointer cursor untuk enabled interactive target.
- Disabled target memakai not-allowed cursor dan alasan yang dapat ditemukan.
- Contrast, zoom 200%, reflow, screen reader, dan high-content-length diuji.
- `prefers-reduced-motion` dihormati. Tidak ada essential information yang bergantung pada animation.
- Live region dipakai hemat untuk OTP status, save result, queue result, dan realtime delta penting.
- Loading region memakai `aria-busy="true"` dan satu polite announcement. Decorative skeleton block tidak dibaca satu per satu.
- Skeleton mempertahankan geometry dan focus order. Empty, error, forbidden, dan stale tidak disamarkan sebagai loading.

## Palet dan Kontras

Palet brand memakai biru, putih dan oranye sekunder sesuai DESIGN. Oranye
terang untuk bidang/aksen, jingga gelap untuk teks serta ikon yang perlu
terbaca pada putih atau ivory. Jangan memakai oranye terang untuk teks kecil
di atas putih atau teks putih di atas oranye terang. Makna status tetap
memakai label dan token semantic, bukan berubah mengikuti aksen brand.

## Data Visualization

Graph, chart, dan leaderboard menyediakan text/table equivalent, description, selected state, keyboard navigation yang masuk akal, dan tidak mengandalkan warna. Cohort suppression, denominator, time window, synthetic status, dan update time harus terlihat.

## Review Checklist

- Bahasa tidak memberi stigma dan tidak mengklaim hasil yang belum terbukti.
- Primary action serta recovery dapat ditemukan.
- Empty, loading, error, offline, stale, forbidden, dan destructive state tersedia bila relevan.
- Screen reader mengumumkan perubahan penting tanpa noise.
- Screenshot atau browser evidence mencakup skeleton dan transition ke success/error pada setiap frontend surface.
- Phone dan NIM tidak muncul pada copy, screenshot, log, atau projection yang tidak perlu.
