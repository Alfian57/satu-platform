# Standar Kualitas Kode dan Arsitektur Komponen

Dokumen ini mendefinisikan standar kualitas kode, arsitektur antarmuka, kebersihan repositori, serta sinkronisasi infrastruktur untuk platform SATU.

## 1. Pembaruan Dokumentasi (Documentation Sync & Present State)

- Setiap perubahan kode yang memengaruhi fitur, alur bisnis, hak akses, atau kontrak arsitektur wajib menyinkronkan dokumen pemilik terkait di direktori `docs/` atau file panduan proyek.
- Dokumentasi wajib selalu merefleksikan kondisi aktif sistem saat ini (present state), bukan riwayat lampau, log perubahan historis, atau spekulasi kemampuan masa depan yang belum diimplementasikan.
- Jangan membiarkan dokumentasi usang atau bertentangan dengan runtime yang sedang berjalan.

## 2. Pembersihan File dan Kode Usang (Dead Code & Artifact Cleanup)

- Komponen, fungsi, hook, tipe, rute, endpoint, file konfigurasi, atau skrip yang sudah tidak digunakan lagi (dead code atau orphaned files) akibat perubahan pada task yang sedang dikerjakan wajib dihapus.
- Dilarang meninggalkan kode yang dimatikan dalam bentuk komentar panjang (commented-out code).
- Dilarang meninggalkan file sementara (temporary scratch files), file tes coba-coba, atau artefak dump log di dalam repositori.
- Pastikan tree repository selalu bersih sebelum task diselesaikan.

## 3. Arsitektur Komponen Frontend dan Kualitas Kode

Untuk menjaga kode antarmuka React dan Inertia tetap modular, mudah dirawat, dan teruji:

### 3.1 Larangan Fat Files
- Hindari membuat file komponen yang monolitik dan menggabungkan banyak tanggung jawab (fat files).
- Pecah file yang membengkak menjadi sub-komponen terisolasi atau modul helper/utilitas terpisah.
- Tempatkan sub-komponen spesifik fitur di folder komponen lokal fitur atau di `resources/js/components/` jika bersifat lintas fitur.

### 3.2 Pemisahan Antarmuka dan Logika (Custom Hooks)
- Komponen antarmuka pengguna (`.tsx`) diposisikan sebagai komponen presentasional murni yang fokus pada rendering UI dan interaksi pengguna.
- Logika pengelolaan state kompleks, request dan mutasi data (Inertia visit, form helpers, fetch), validasi input, timer, dan efek samping wajib dipisahkan ke dalam custom hook.
- Tempatkan custom hook di direktori `resources/js/hooks/` dengan penamaan awalan `use-` (misal `use-project-filter.ts`, `use-workspace-realtime.ts`).

### 3.3 Reusabilitas
- Desain komponen UI, custom hook, dan helper agar reusable dan independen dari konteks yang terlalu spesifik jika fungsinya berulang.
- Manfaatkan komponen fondasi antarmuka yang sudah ada sebelum membuat elemen baru dari awal.

### 3.4 Batas Ukuran File (Soft Limit ~200-250 Baris)
- Patokan batas lunak untuk ukuran file komponen UI (`.tsx`) adalah sekitar 200 hingga 250 baris kode.
- Jika sebuah komponen mendekati atau melampaui batas ini, evaluasi pembagian rendering bagian halaman (misalnya header, filter bar, card list, modal dialog) ke sub-komponen terpisah, dan pindahkan fungsi logika ke custom hook.

### 3.5 Batasan Ruang Lingkup (Scope Guard)
- Standar kualitas kode dan batas ukuran file berlaku penuh untuk file baru serta file yang sedang dimodifikasi dalam lingkup task aktif.
- AI Agent dilarang melakukan refaktor massal secara sepihak pada file legacy yang tidak berkaitan dengan task aktif pengguna, guna mencegah terjadinya regresi di luar ruang lingkup pekerjaan.

## 4. Sinkronisasi Deployment dan Docker (Deployment & CI/CD Alignment)

Setiap perubahan aplikasi yang memengaruhi lingkungan operasional production, runtime server, dependensi sistem, atau background processing wajib menyinkronkan file infrastruktur terkait:

1. **Ekstensi PHP dan Dependensi Native**:
   - Jika aplikasi membutuhkan ekstensi PHP baru atau pustaka OS alpine baru, perbarui `Dockerfile` pada tahap `php-base` (`RUN apk add ...` dan `docker-php-ext-install ...`).
2. **Proses Latar Belakang (Daemons & Workers)**:
   - Jika terdapat worker antrean baru, scheduler, atau server websocket (Reverb), daftarkan dan kelola proses tersebut di `docker/supervisor/supervisord.conf`.
3. **Web Server dan Reverse Proxy**:
   - Jika terdapat perubahan header keamanan, aturan proxy websocket, batasan ukuran upload file, atau rute khusus web server, perbarui `docker/nginx/nginx.conf`.
4. **Skrip Inisialisasi Kontainer**:
   - Jika ada langkah startup baru (seperti storage symlink baru, optimasi cache tambahan, atau seeding data awal terkontrol), sesuaikan `docker/entrypoint.sh`.
5. **Variabel Lingkungan Production**:
   - Setiap variabel lingkungan baru yang esensial wajib dicatat di `.env.example` dan didokumentasikan pada `docs/engineering/OPERATIONS.md`.
6. **Integritas CI/CD**:
   - Pastikan setiap perubahan tetap lulus pada pipeline CI (`.github/workflows/tests.yml`) dan build image container (`.github/workflows/build-and-deploy.yml`).
