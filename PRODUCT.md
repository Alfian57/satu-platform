# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pengguna utama adalah mahasiswa aktif yang mencari rekan satu tim dan peluang untuk berpartisipasi dalam proyek kolaboratif non-akademik, terutama mahasiswa dengan jaringan sosial terbatas yang berisiko terus terlewat dari kesempatan tersebut.

Pengguna institusional adalah staf kemahasiswaan dan manajemen perguruan tinggi yang mengawasi partisipasi, memvalidasi aktivitas, serta menindaklanjuti indikator kerentanan sosial. Pengguna eksternal adalah perekrut perusahaan yang mencari kandidat berdasarkan rekam jejak keterampilan dan proyek yang telah divalidasi.

Registrasi terbuka untuk mahasiswa, tetapi afiliasi kampus memiliki status terpisah. Afiliasi baru dianggap terverifikasi setelah alamat email cocok dengan domain institusi yang disetujui atau setelah mendapat persetujuan admin kampus.

## Product Purpose

SATU (Sistem Aktivitas Talenta Universitas) adalah ekosistem kolaborasi digital yang membantu mahasiswa menemukan tim, mengerjakan proyek bersama, membangun portofolio keterampilan tervalidasi, dan memperoleh pengakuan atas aktivitas non-akademik.

Produk ini bertujuan memperluas akses terhadap kolaborasi di luar lingkaran pertemanan yang sudah terbentuk, memberi kampus visibilitas lebih dini terhadap pola keterasingan sosial, mengurangi administrasi pencatatan kegiatan, dan menghubungkan rekam jejak mahasiswa dengan peluang karier.

Keberhasilan sosial diukur melalui peningkatan partisipasi lintas program studi dan penurunan jumlah mahasiswa yang terpinggirkan dari proyek kolaboratif. Proposal menetapkan target penurunan tingkat isolasi pengguna sebesar 30% pada akhir kuartal keempat; target ini belum merupakan hasil yang telah tervalidasi.

## Positioning

SATU memadukan ruang kerja proyek dengan Social Network Analysis dan pencocokan tim berbasis keterampilan. Rekomendasi dirancang untuk memberi prioritas secara senyap kepada mahasiswa dengan konektivitas rendah tanpa mengekspos atau memberi stigma pada status kerentanannya.

Rekam jejak tugas dan kontribusi proyek direncanakan dapat divalidasi oleh institusi serta disinkronkan menjadi kredit kegiatan non-akademik. Portal talenta kemudian memberi perusahaan akses hanya ke portofolio profesional yang diizinkan mahasiswa, bukan ke data analitik sosial atau psikologis.

Social Network Analysis pada SATU mengukur peluang keterlibatan dan risiko eksklusi kolaboratif. Hasilnya bukan diagnosis kesehatan mental, tidak boleh digunakan untuk memberi label psikologis, dan tidak boleh menghasilkan keputusan merugikan secara otomatis.

## Operating Context

Alur mahasiswa dimulai dari autentikasi, penyusunan profil keterampilan, eksplorasi proyek, dan rekomendasi rekan satu tim. Tim bekerja melalui ruang kerja bersama yang mencakup pengelolaan tugas, dokumen bukti kerja, percakapan tekstual, tenggat, dan apresiasi antarrekan. Penyelesaian tanggung jawab menghasilkan poin pengalaman, lencana keterampilan, dan rekam jejak portofolio.

Staf kampus memantau partisipasi, memvalidasi pencapaian non-akademik, dan menjadi satu-satunya pihak yang berwenang menindaklanjuti indikator kerentanan sosial. Perekrut mencari kandidat melalui filter keterampilan dan riwayat penyelesaian proyek, lalu dapat mengirimkan peluang magang kepada kandidat.

Peluncuran awal direncanakan sebagai pilot selama satu semester di satu institusi mitra sebelum ekspansi lintas kampus. Model bisnis yang diusulkan adalah B2B2C: mahasiswa tidak dikenai biaya, sementara perusahaan membayar akses berjenjang ke Talent Portal.

## Capabilities and Constraints

- Ruang lingkup awal terbatas pada kegiatan kelompok kolaboratif non-akademik, seperti kompetisi bisnis dan penelitian mahasiswa.
- Sistem akademik formal dan nilai indeks prestasi tidak menjadi input atau keluaran penilaian produk.
- Analitik sosial menggunakan metadata graf dari aktivitas kolaborasi di dalam aplikasi. Isi percakapan tidak dianalisis untuk sentimen, kondisi psikologis, atau diagnosis.
- Pencocokan tim menggunakan `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`. Versi skor dan alasan utama harus dapat dijelaskan serta diaudit.
- Social Network Analysis yang diusulkan menggunakan metrik seperti _degree centrality_ untuk mendeteksi pengguna dengan konektivitas rendah.
- Gamifikasi mengubah penyelesaian tugas menjadi poin pengalaman, lencana keterampilan, portofolio, dan kredit kegiatan non-akademik: bukan nilai akademik.
- Akses diatur dengan Role-Based Access Control. Data portofolio harus dipisahkan dari data analitik sosial, dan perekrut tidak boleh mengakses indikator kerentanan atau data kesehatan mental.
- Mahasiswa mengendalikan visibilitas portofolionya di Talent Portal dan harus menerima penjelasan serta persetujuan tata kelola data ketika mendaftar.
- Produk production dirancang untuk banyak institusi, tetapi increment pertama menjalankan satu kampus di atas model data yang tetap institution-aware.
- Mahasiswa dapat menggunakan fitur umum sebelum afiliasinya terverifikasi, tetapi kredit kegiatan dan portofolio terverifikasi membutuhkan afiliasi `verified`.
- Integrasi sistem akademik, portal perusahaan berbayar, dan eskalasi ke layanan konseling masih merupakan kapabilitas yang direncanakan dan memerlukan validasi teknis, institusional, etis, dan legal.
- Institusi pilot, aturan validasi kontribusi, sumber kebenaran untuk kredit kegiatan, periode retensi, harga paket perusahaan, dan bentuk integrasi akademik masih menjadi keputusan terbuka.

## Brand Commitments

Nama produk yang ditetapkan dalam proposal adalah **SATU**, kependekan dari **Sistem Aktivitas Talenta Universitas**. Bahasa produk harus profesional, jelas, inklusif, dan menghindari pelabelan mahasiswa sebagai terisolasi, rentan, atau bermasalah di antarmuka yang mereka gunakan maupun di hadapan perekrut.

## Evidence on Hand

- [`docs/reference/proposal_lomba.md`](docs/reference/proposal_lomba.md) memuat latar belakang masalah, tujuan, ruang lingkup, target pengguna, alur produk, rancangan kapabilitas, model bisnis, risiko privasi, serta target dampak.
- Proposal menyebut data eksternal dari Active Minds (2024), Higher Education Policy Institute (2023), University of California (2024), dan National Center for Biotechnology Information (2024). Klaim dan angka tersebut perlu diverifikasi terhadap sumber primer sebelum digunakan sebagai bukti publik.
- Belum ada hasil pilot, data penggunaan, testimoni mahasiswa, pelanggan kampus atau perusahaan yang dikonfirmasi, studi kasus, maupun bukti pencapaian target dampak. Materi produk berikutnya tidak boleh mengarang bukti tersebut.

## Product Principles

1. Perluas kesempatan tanpa memberi stigma: intervensi harus membuka akses kolaborasi tanpa mengungkap status kerentanan mahasiswa.
2. Kontribusi nyata lebih penting daripada popularitas: pencocokan, pengakuan, dan portofolio bertumpu pada keterampilan serta pekerjaan yang dapat divalidasi.
3. Privasi menentukan batas produk: portofolio profesional dan analitik sosial harus dipisahkan secara teknis dan berdasarkan kewenangan.
4. Institusi memvalidasi, mahasiswa tetap memegang kendali: kampus mengesahkan rekam aktivitas, sementara mahasiswa menentukan visibilitas data kariernya.
5. Dampak harus terukur dan dapat diaudit: keberhasilan dinilai melalui partisipasi, inklusi lintas program studi, efisiensi administrasi, dan hasil karier yang benar-benar tercatat.

## Accessibility & Inclusion

Produk harus dapat digunakan mahasiswa dengan jaringan sosial terbatas tanpa membuat mereka terlihat atau merasa ditandai sebagai kelompok rentan. Rekomendasi dan pesan sistem harus menjaga martabat pengguna, menjelaskan penggunaan data secara mudah dipahami, dan menyediakan kendali privasi yang nyata.

Standar aksesibilitas formal, kebutuhan teknologi bantu, bahasa antarmuka, serta proses pengujian dengan pengguna disabilitas belum ditetapkan dan tetap menjadi keputusan terbuka.
