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

### 3.6 Form Input Labels, Penanda Keterisian (Required & Optional), dan Placeholders
Untuk menjaga konsistensi antarmuka pengguna di seluruh platform SATU:
- **Penanda Wajib (Required)**:
  - Setiap input field yang wajib diisi wajib memiliki tanda bintang warna merah di akhir teks label (`*`).
  - Gunakan prop `required` pada komponen `<Label required>` (`resources/js/components/ui/label.tsx`) atau helper `<RequiredMark />` (`resources/js/components/common/form-label-helpers.tsx`) untuk native label.
  - Tanda bintang wajib berbobot tebal dengan warna merah (`text-destructive font-bold ml-1`) dan memiliki atribut aksesibilitas `aria-hidden="true"`.
- **Penanda Opsional (Optional)**:
  - Setiap input field yang tidak wajib (opsional) wajib memiliki keterangan `(opsional)` di akhir teks label.
  - Gunakan prop `optional` pada komponen `<Label optional>` atau helper `<OptionalMark />` untuk native label.
  - Keterangan opsional dirender dengan bobot normal dan warna redup (`text-xs font-normal text-muted-foreground ml-1`).
  - Dilarang membiarkan field input tanpa kejelasan status keterisian.
- **Atribut Placeholder**:
  - Seluruh elemen input yang mendukung placeholder (`input[type="text"]`, `type="number"`, `type="password"`, `type="tel"`, `type="time"`, `type="datetime-local"`, dan `textarea`) wajib menyertakan atribut `placeholder` yang jelas, informatif, dan kontekstual bagi pengguna (misalnya contoh format pengisian yang valid).
- **Spasi Input Field dan Deskripsi**:
  - Gunakan `grid min-w-0 gap-1.5` pada kontainer field untuk menjaga jarak vertikal konsisten dan rapat (6px) antara `<Label>`, elemen input (`<Input>`, `<textarea>`, `<select>`), dan teks bantuan/error.
  - Teks deskripsi (help text) dan pesan kesalahan (`<InputError>`) wajib dikelompokkan ke dalam sub-kontainer `<div className="grid min-w-0 gap-0.5">` dengan tipografi `text-xs leading-normal text-muted-foreground` agar jarak antara input dan deskripsinya tidak terlalu renggang serta hierarki pesan kesalahan tetap terhubung langsung.

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

## 5. Standarisasi Pola Co-location Direktori Fitur

### 5.1 Prinsip Utama
Letakkan aset dan dependensi sedekat mungkin dengan fitur yang menggunakannya (*Co-location Architecture*). Sub-komponen, custom hook, tipe data, dan helper yang hanya digunakan secara eksklusif oleh satu rute/halaman tidak boleh disebar ke direktori global, melainkan wajib dikelompokkan langsung di dalam direktori fitur rute tersebut.

### 5.2 Standar Struktur Direktori Per Rute
Setiap rute antarmuka di `resources/js/pages/` diorganisir dalam sebuah folder fitur mandiri dengan konvensi penamaan folder privat berawalan underscore (`_`):

```text
resources/js/pages/{domain}/{feature}/
├── page.tsx                     # Entry point Inertia: penerima props & penyusun layout antarmuka
├── _components/                 # Sub-komponen UI khusus fitur ini (1 komponen per file)
│   ├── feature-table.tsx
│   ├── feature-form.tsx
│   └── feature-action-bar.tsx
├── _hooks/                      # Custom hooks logika/state/mutasi khusus fitur ini
│   └── use-feature-logic.ts
├── _types/                      # Tipe TypeScript / formatting khusus fitur ini
│   └── feature-types.ts
└── _utils/                      # Helper kalkulasi murni / utilitas spesifik fitur ini
    └── feature-calc.ts
```

### 5.3 Konvensi Prefix Underscore (`_`) dan Globbing Inertia
- Direktori berawalan `_` (`_components/`, `_hooks/`, `_types/`, `_utils/`) menandakan modul privat internal fitur.
- Konfigurasi resolver Inertia di `resources/js/app.tsx` secara otomatis mengecualikan pola `!./pages/**/_*/**` dari rute dinamis, sehingga file sub-komponen internal tidak akan keliru didaftarkan sebagai rute Inertia atau memecah chunk secara tidak perlu.
- Entry point halaman menggunakan penamaan baku `page.tsx` di dalam folder fitur, yang secara otomatis dipetakan oleh resolver dari pemanggilan backend Laravel `Inertia::render('{domain}/{feature}')`.

### 5.4 Konvensi Import
1. **Dependensi Lokal Privat**: Gunakan import relatif (misal `./_components/feature-table` atau `./_hooks/use-feature-logic`) dari file `page.tsx` atau antar-komponen di dalam fitur yang sama.
2. **Dependensi Bersama Lintas-Fitur (Shared/Global)**:
   - Komponen UI atomik/dasar: `@/components/ui/{component}`
   - Komponen domain bersama (tabel, badge status, pagination, filter strip): `@/components/common/{component}`
   - Hook global/lintas fitur (`use-mobile`, `use-flash-toast`, `use-initials`): `@/hooks/{hook}`
   - Token & utilitas global: `@/lib/tokens` dan `@/lib/utils`
   - Layout global: `@/layouts/{layout}`

### 5.5 Aturan Ekstraksi: Lokal vs Shared
- Suatu komponen/hook/utilitas **wajib** tetap berada di `_components/`, `_hooks/`, atau `_utils/` lokal selama hanya dipakai oleh satu rute fitur tersebut.
- Komponen atau hook baru **boleh dipindahkan** ke `resources/js/components/common/` atau `resources/js/hooks/` hanya jika telah digunakan oleh setidaknya dua fitur yang berbeda secara independen.
- Jika komponen hanya digunakan bersama oleh beberapa sub-rute dalam satu domain (misalnya `campus/affiliations` dan `campus/overview`), letakkan di folder shared domain (misalnya `resources/js/pages/campus/_components/`).

### 5.6 Co-location Fitur Non-Halaman (Cross-Page Features)
Fitur interaktif global yang tidak terikat pada satu rute tertentu namun memiliki kompleksitas internal (seperti Onboarding Modal dan Student Menu Tour) diorganisir sebagai fitur mandiri di dalam `resources/js/components/{feature}/`:
- `resources/js/components/onboarding/`: modal, context provider, sub-komponen form di `_components/`, dan hook di `_hooks/use-onboarding-flow.ts`.
- `resources/js/components/student-tour/`: tour provider, card, trigger, dialog, steps, summary di `_components/`, dan hook di `_hooks/use-student-journey-guide.ts`.
- Dilarang membiarkan sub-komponen atau hook fitur-fitur tersebut berceceran di root `resources/js/components/` atau `resources/js/hooks/`.

### 5.7 Co-location Layout & Shell
Komponen pembangun layout shell aplikasi (`app-sidebar`, `app-header`, `app-shell`, `app-content`, `breadcrumbs`, `nav-main`, `nav-user`, dsb.) diko-lokasikan bersama layout di `resources/js/layouts/_components/` dan hook navigasi terkait di `resources/js/layouts/_hooks/` (`use-app-sidebar.ts`, `use-mobile-navigation.ts`). Direktori root `resources/js/hooks/` secara ketat hanya diperuntukkan bagi utilitas umum sistem (`use-mobile`, `use-initials`, `use-current-url`, `use-flash-toast`).
