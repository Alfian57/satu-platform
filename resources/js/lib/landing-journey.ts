export type JourneyScenario = 'main' | 'full' | 'revision';
export type JourneyStage = {
    id: string;
    label: string;
    actor: string;
    title: string;
    status: string;
    description: string;
    facts: readonly [string, string][];
    boundary: string;
    next: string;
};

export const JOURNEY_SCENARIOS: readonly {
    id: JourneyScenario;
    label: string;
}[] = [
    { id: 'main', label: 'Jalan utama' },
    { id: 'full', label: 'Kapasitas penuh' },
    { id: 'revision', label: 'Perlu revisi' },
];

export const JOURNEY_STAGES: readonly JourneyStage[] = [
    {
        id: 'profile',
        label: 'Bekal awal',
        actor: 'Mahasiswa: Budi',
        title: 'Belum punya karya? Tetap bisa mulai.',
        status: 'Pernyataan sendiri',
        description:
            'Budi ingin belajar desain antarmuka. Ia mengisi kemampuan dasar dan waktu yang tersedia, tanpa portofolio atau riwayat kolaborasi.',
        facts: [
            ['Kemampuan', 'Dasar desain antarmuka'],
            ['Ketersediaan', 'Selasa sore'],
            ['Karya sebelumnya', 'Belum ada'],
        ],
        boundary:
            'Kemampuan yang diisi sendiri bukan hasil validasi kampus. Afiliasi kampus tetap diverifikasi terpisah.',
        next: 'Cari peluang dengan peran yang menerima pemula.',
    },
    {
        id: 'opportunity',
        label: 'Peluang pemula',
        actor: 'Pemilik proyek: Siti',
        title: 'Kebutuhan peran dijelaskan, bukan ditebak.',
        status: 'Menerima pemula',
        description:
            'Siti membuka peran desain untuk proyek Ruang Baca Kampus. Budi membaca tujuan, pekerjaan, kriteria dan tempat yang masih tersedia.',
        facts: [
            ['Peran', 'Desainer antarmuka'],
            [
                'Kriteria',
                'Dasar desain, bersedia belajar dan waktu untuk bekerja',
            ],
            ['Tempat peran', '1 dari 1 masih tersedia pada contoh ini'],
        ],
        boundary:
            'Rekomendasi bukan keputusan penerimaan. Penelusuran manual tetap tersedia jika rekomendasi belum ada.',
        next: 'Ajukan minat, kemampuan atau kebutuhan belajar, serta ketersediaan.',
    },
    {
        id: 'application',
        label: 'Pengajuan',
        actor: 'Mahasiswa: Budi',
        title: 'Tiga jawaban singkat sudah cukup.',
        status: 'Menunggu keputusan',
        description:
            'Budi sengaja membagikan minat belajar desain, kemampuan dasar, dan waktu Selasa sore kepada pemilik proyek. Ia tidak wajib menyertakan karya terdahulu.',
        facts: [
            ['Minat', 'Merancang alur peminjaman buku'],
            [
                'Kemampuan atau kebutuhan belajar',
                'Dasar desain. Ingin belajar uji alur',
            ],
            ['Ketersediaan', 'Selasa sore'],
        ],
        boundary:
            'Pengajuan belum menjadi keanggotaan, tidak memesan tempat dan belum membuka ruang kerja. Bukti awal profil tetap privat.',
        next: 'Periksa status. Pemilik menilai kebutuhan peran dan memberi alasan.',
    },
    {
        id: 'decision',
        label: 'Keputusan tim',
        actor: 'Pemilik proyek: Siti',
        title: 'Keputusan yang dapat dipahami.',
        status: 'Diterima pada contoh',
        description:
            'Siti menerima Budi karena kemampuan dasar dan waktu yang diajukan sesuai kebutuhan peran pemula. Keanggotaan tersimpan sebelum ruang kerja dibuka.',
        facts: [
            [
                'Alasan contoh',
                'Bekal dasar dan waktu sesuai kebutuhan peran pemula',
            ],
            ['Keanggotaan', 'Budi bergabung sebagai desainer'],
            ['Rekan kerja', 'Siti sebagai pengembang aplikasi'],
        ],
        boundary:
            'Pemilik mengambil keputusan manusia. SATU tidak menjamin diterima dan tidak memilih berdasarkan popularitas atau kepribadian.',
        next: 'Buka ruang kerja dan pahami tugas yang menjadi tanggung jawabmu.',
    },
    {
        id: 'task',
        label: 'Bekerja bersama',
        actor: 'Tim: Budi dan Siti',
        title: 'Relasi dibangun lewat pekerjaan bersama.',
        status: 'Tugas selesai pada contoh',
        description:
            'Budi merancang alur peminjaman; Siti mengerjakan aplikasi. Budi mengunggah bukti privat tanpa harus mengirim pesan di diskusi tim.',
        facts: [
            ['Tugas Budi', 'Rancangan alur peminjaman'],
            [
                'Hasil yang diharapkan',
                'Rancangan dan penjelasan keputusan desain',
            ],
            ['Bukti contoh', 'Berkas rancangan sintetis'],
        ],
        boundary:
            'Tugas selesai bukan kontribusi terverifikasi. Jumlah pesan atau teman tidak mengukur kemampuan.',
        next: 'Susun klaim individual, ringkasan yang dapat dibagikan dan bukti privat.',
    },
    {
        id: 'contribution',
        label: 'Kontribusi',
        actor: 'Mahasiswa: Budi',
        title: 'Jelaskan bagian yang benar-benar kamu kerjakan.',
        status: 'Dikirim untuk ditinjau',
        description:
            'Budi mengajukan rancangan alur peminjaman sebagai pekerjaan individual. Bukti hanya ditautkan pada versi pengajuan yang akan ditinjau kampus.',
        facts: [
            ['Klaim', 'Merancang alur peminjaman'],
            ['Pemilik kontribusi', 'Budi, bukan seluruh tim'],
            ['Sumber', 'Tugas dan bukti individual yang dipilih'],
        ],
        boundary:
            'Pernyataan, berkas bukti dan catatan keputusan privat tidak ikut dibagikan sebagai isi karya publik.',
        next: 'Periksa keputusan peninjau kampus dan tindak lanjuti bila perlu perbaikan.',
    },
    {
        id: 'recognition',
        label: 'Pengakuan',
        actor: 'Peninjau kampus',
        title: 'Pengakuan mengikuti bukti, bukan keramaian.',
        status: 'Disetujui pada contoh',
        description:
            'Peninjau menyetujui kontribusi pada versi yang buktinya tersedia. SATU menyimpan keputusan dan karya privat dengan sumber yang sama.',
        facts: [
            ['Sumber karya', 'Versi kontribusi Budi yang disetujui'],
            ['Jangkauan awal', 'Privat'],
            ['Batas validasi', 'Kontribusi ini, bukan seluruh kemampuan Budi'],
        ],
        boundary:
            'Peninjau juga dapat meminta revisi atau menolak beralasan. Tidak ada janji waktu tinjauan atau persetujuan otomatis.',
        next: 'Baca karya privat dan tentukan apakah ingin membagikannya.',
    },
    {
        id: 'sharing',
        label: 'Kendali berbagi',
        actor: 'Mahasiswa: Budi',
        title: 'Karya diakui. Kendali tetap di tanganmu.',
        status: 'Privat sampai dipilih',
        description:
            'Budi memperoleh karya dari kontribusi yang disetujui. Ia boleh menyimpannya privat, membagikan ringkasan yang diizinkan, atau mencabut berbagi kemudian.',
        facts: [
            ['Karya', 'Rancangan alur peminjaman Budi'],
            ['Keputusan berbagi', 'Pilihan pemilik, bukan peninjau'],
            ['Bukti privat', 'Tidak menjadi berkas publik'],
        ],
        boundary:
            'Ini demonstrasi mekanisme, bukan hasil pilot atau bukti peningkatan kesempatan. Perekrut dan analitik jaringan merupakan pengembangan lanjutan.',
        next: 'Mulai sebagai mahasiswa atau reset untuk mencoba keadaan lain.',
    },
];

export function getJourneyStage(
    index: number,
    scenario: JourneyScenario,
): JourneyStage {
    const stage = JOURNEY_STAGES[index] ?? JOURNEY_STAGES[0];

    if (scenario === 'full' && stage.id === 'decision') {
        return {
            ...stage,
            title: 'Tempat penuh bukan penilaian kemampuan.',
            status: 'Keputusan belum bisa diterima',
            description:
                'Sebelum keputusan tersimpan, tempat terakhir telah diisi pengajuan lain. Penerimaan ditolak agar kapasitas tidak terlampaui; pengajuan Budi tetap menunggu keputusan.',
            facts: [
                ['Keanggotaan Budi', 'Belum terbentuk'],
                ['Pengajuan', 'Masih menunggu'],
                [
                    'Pemulihan',
                    'Periksa sumber terbaru; pemilik dapat memberi keputusan beralasan',
                ],
            ],
            boundary:
                'Pengajuan tidak memesan tempat. Contoh ini berhenti di keputusan, bukan berpura-pura membuka ruang kerja.',
            next: 'Cari peran tersedia lain atau tunggu keputusan pemilik. Reset untuk melihat jalan utama.',
        };
    }

    if (scenario === 'revision' && stage.id === 'recognition') {
        return {
            ...stage,
            title: 'Perbaikan mempunyai arah yang jelas.',
            status: 'Perlu revisi pada contoh',
            description:
                'Peninjau meminta Budi menjelaskan keputusan desain dan melengkapi bukti. Budi membuat versi baru dan mengirim ulang; versi serta keputusan sebelumnya tetap menjadi riwayat.',
            facts: [
                [
                    'Alasan contoh',
                    'Jelaskan keputusan desain dan lengkapi bukti',
                ],
                [
                    'Karya terverifikasi',
                    'Belum dihasilkan oleh keputusan revisi',
                ],
                ['Langkah mahasiswa', 'Perbaiki versi lalu kirim ulang'],
            ],
            boundary:
                'Memperbaiki bukti tidak otomatis disetujui. Keputusan berikutnya tetap diambil peninjau kampus.',
            next: 'Contoh tahap berikutnya hanya berlaku setelah versi perbaikan benar-benar disetujui.',
        };
    }

    if (scenario === 'revision' && stage.id === 'sharing') {
        return {
            ...stage,
            status: 'Versi perbaikan disetujui pada contoh',
            description:
                'Pada kelanjutan contoh ini, Budi mengirim versi perbaikan dan peninjau menyetujuinya. Karya privat berasal dari versi baru, bukan dari keputusan revisi. Budi tetap memilih sendiri jangkauan karya.',
        };
    }

    return stage;
}
