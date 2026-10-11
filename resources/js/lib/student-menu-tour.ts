export const studentMenuTourId = 'student-menu-tour-v1';
export const studentJourneySummaryId = 'student-dashboard-journey-v1';

export type StudentTourMenu =
    'dashboard' | 'projects' | 'contributions' | 'portfolio';

export type StudentTourStep = {
    id: string;
    menu: StudentTourMenu;
    menuLabel: string;
    target: string;
    title: string;
    description: string;
};

const dashboardStep: StudentTourStep = {
    id: 'dashboard-next-action',
    menu: 'dashboard',
    menuLabel: 'Beranda',
    target: '[data-test="dashboard-docket"]',
    title: 'Mulai dari langkah utama',
    description:
        'Beranda merangkum pekerjaan dan statusmu. Langkah utama menunjukkan tindakan yang paling perlu diperhatikan berdasarkan data sistem, misalnya melengkapi profil atau menemukan proyek.',
};

const affiliationStep: StudentTourStep = {
    id: 'dashboard-affiliation',
    menu: 'dashboard',
    menuLabel: 'Beranda',
    target: '#dashboard-affiliation-heading',
    title: 'Pahami akses kampusmu',
    description:
        'Menu kolaborasi tersedia setelah afiliasi kampus terverifikasi dan aksesnya aktif. Periksa penjelasan statusmu. Tur menu lain dapat dimulai kembali melalui Panduan menu setelah akses tersedia.',
};

const verifiedSteps: StudentTourStep[] = [
    dashboardStep,
    {
        id: 'dashboard-projects',
        menu: 'dashboard',
        menuLabel: 'Beranda',
        target: '#active-projects-heading',
        title: 'Lanjutkan proyek aktif',
        description:
            'Bagian ini merangkum proyek yang sedang kamu ikuti dan pekerjaan berikutnya. Jika belum ada proyek, gunakan tindakan yang tersedia untuk menemukan peluang kolaborasi.',
    },
    {
        id: 'dashboard-recommendations',
        menu: 'dashboard',
        menuLabel: 'Beranda',
        target: '#recommendation-heading',
        title: 'Baca alasan rekomendasi',
        description:
            'Rekomendasi membantu menemukan proyek yang cocok. Baca alasan kecocokannya sebelum membuka proyek. Rekomendasi kosong atau belum termuat tidak berarti kamu tidak memiliki peluang.',
    },
    {
        id: 'projects-introduction',
        menu: 'projects',
        menuLabel: 'Proyek',
        target: '[data-test="project-discovery-header"]',
        title: 'Temukan ruang untuk berkarya',
        description:
            'Pilih Peluang untuk mencari peran baru, atau Proyek saya untuk pekerjaan yang kamu kelola dan tim yang kamu ikuti. Buka detail untuk memahami tujuan, kebutuhan, dan kapasitas. Tur tidak mengubah pilihanmu.',
    },
    {
        id: 'projects-search',
        menu: 'projects',
        menuLabel: 'Proyek',
        target: '#project-search',
        title: 'Persempit pencarian proyek',
        description:
            'Belum memiliki karya? Cari peran yang menerima pemula dan masih tersedia lewat Filter tambahan. Penelusuran tetap tersedia saat rekomendasi kosong. Tur tidak menerapkan filter atau mengirim pengajuan.',
    },
    {
        id: 'projects-results',
        menu: 'projects',
        menuLabel: 'Proyek',
        target: '#project-results-title',
        title: 'Baca hasil dan buka detail',
        description:
            'Buka detail untuk membaca tugas peran, kriteria dan kapasitas. Ajukan minat, kemampuan atau kebutuhan belajar, serta ketersediaan. Pemilik memberi keputusan beralasan; pengajuan menunggu belum membuka ruang kerja.',
    },
    {
        id: 'contributions-introduction',
        menu: 'contributions',
        menuLabel: 'Kontribusi',
        target: '[data-test="contributions-header"]',
        title: 'Ajukan hasil pekerjaanmu',
        description:
            'Dari ruang kerja, susun klaim pekerjaan individual dan pilih bukti privat untuk ditinjau kampus. Kamu dapat mengunggah bukti tanpa pesan di diskusi. Tugas selesai belum otomatis terverifikasi; pekerjaan anggota lain bukan klaimmu.',
    },
    {
        id: 'contributions-status',
        menu: 'contributions',
        menuLabel: 'Kontribusi',
        target: '#contributions-ledger-title, [data-test="contributions-empty"] h2',
        title: 'Ikuti status dan catatan tinjauan',
        description:
            'Buka kontribusi untuk melihat versi, bukti, status, dan alasan keputusan. Jika diminta revisi, perbaiki pengajuan sesuai catatan kampus. Daftar kosong berarti belum ada catatan untuk ditampilkan.',
    },
    {
        id: 'portfolio-introduction',
        menu: 'portfolio',
        menuLabel: 'Portofolio',
        target: '[data-test="portfolio-header"]',
        title: 'Bangun rekam jejak terverifikasi',
        description:
            'Keputusan disetujui menghasilkan karya privat dari versi kontribusi yang sama. Pengakuan tidak memerlukan XP, badge atau peringkat. Ini bukan jaminan seluruh kemampuan telah diuji dan bukan publikasi otomatis.',
    },
    {
        id: 'portfolio-entries',
        menu: 'portfolio',
        menuLabel: 'Portofolio',
        target: '#portfolio-ledger-title, [data-test="portfolio-empty"] h2, [data-test="portfolio-profile-missing"] h2, [data-test="portfolio-error"] h2, [data-test="portfolio-loading"]',
        title: 'Kenali karya dan sumbernya',
        description:
            'Setiap entri memiliki sumber kontribusi, status verifikasi, dan visibilitas. Buka detail untuk memeriksa konteks karya. Jika belum ada entri, mulai dari kontribusi yang ditinjau kampus.',
    },
    {
        id: 'portfolio-privacy',
        menu: 'portfolio',
        menuLabel: 'Portofolio',
        target: '[data-test="portfolio-profile-settings"]',
        title: 'Kamu mengendalikan visibilitas',
        description:
            'Pilih jangkauan profil dan tiap karya; kamu dapat mencabut berbagi. Bukti privat dan catatan peninjau tidak menjadi isi karya publik. Perekrut adalah pengembangan lanjutan dengan izin terpisah. Tur tidak mengubah pilihanmu.',
    },
];

export function getStudentTourSteps(
    hasVerifiedAccess: boolean,
): StudentTourStep[] {
    return hasVerifiedAccess ? verifiedSteps : [dashboardStep, affiliationStep];
}
