import {
    BadgeCheck,
    Compass,
    Globe2,
    LockKeyhole,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import type { LandingConcept } from '@/pages/welcome/_components/landing-concept-art';

export const LANDING_NAVIGATION = [
    { href: '#top', label: 'Beranda' },
    { href: '#cara-kerja', label: 'Cara kerja' },
    { href: '#demo', label: 'Coba demo' },
    { href: '#peran', label: 'Untuk siapa' },
    { href: '#pertanyaan', label: 'Tanya jawab' },
] as const;

export const AUDIENCE_TABS = [
    { key: 'student', label: 'Mahasiswa', icon: UsersRound },
    { key: 'campus', label: 'Admin Universitas', icon: ShieldCheck },
] as const;

export type AudienceKey = (typeof AUDIENCE_TABS)[number]['key'];

export const AUDIENCES: Record<
    AudienceKey,
    {
        title: string;
        description: string;
        boundaries: string[];
        steps: { title: string; description: string }[];
    }
> = {
    student: {
        title: 'Ruang untuk tumbuh lewat karya.',
        description:
            'Temukan proyek, bekerja bersama tim, dan susun portofolio dari kontribusi yang disetujui kampus.',
        boundaries: [
            'Registrasi terbuka hanya membuat akun mahasiswa.',
            'Afiliasi kampus diverifikasi terpisah dari pembuatan akun.',
            'Belum punya karya? Cari peran yang menerima pemula. Jangkauan karya tetap pilihanmu.',
        ],
        steps: [
            {
                title: 'Kenalkan kemampuanmu',
                description:
                    'Isi minat, kemampuan dan waktu yang tersedia. Karya terdahulu tidak wajib.',
            },
            {
                title: 'Ambil peran dalam tim',
                description:
                    'Temukan peluang, ajukan minat, lalu kerjakan tugas setelah diterima.',
            },
            {
                title: 'Tunjukkan hasil kerjamu',
                description:
                    'Ajukan kontribusi untuk ditinjau dan pilih jangkauan karya yang disetujui.',
            },
        ],
    },
    campus: {
        title: 'Satu ruang untuk mengelola.',
        description:
            'Roster, afiliasi, validasi dan pengaturan dalam satu ruang.',
        boundaries: [
            'Admin pertama melalui deployment. Admin berikutnya diundang lewat WhatsApp.',
            'Tinjauan kontribusi memiliki versi dan alasan keputusan.',
            'Bantuan memerlukan peninjau dan izin, bukan akses otomatis semua admin.',
        ],
        steps: [
            {
                title: 'Pastikan afiliasi mahasiswa',
                description:
                    'Gunakan roster mahasiswa atau tinjau permintaan yang belum cocok.',
            },
            {
                title: 'Baca bukti pekerjaan',
                description:
                    'Tinjau bagian yang dikerjakan mahasiswa pada versi yang diajukan.',
            },
            {
                title: 'Berikan keputusan beralasan',
                description:
                    'Setujui, minta perbaikan atau tolak berdasarkan kontribusi yang diperiksa.',
            },
        ],
    },
};

export interface OutcomeItem {
    icon: typeof Compass;
    title: string;
    description: string;
    label: string;
    number: string;
    art: LandingConcept;
}

export const OUTCOMES: OutcomeItem[] = [
    {
        icon: Compass,
        title: 'Temukan tempat untuk mulai.',
        description:
            'Cari proyek dengan peran dan kebutuhan yang jelas, termasuk yang menerima pemula.',
        label: 'Kesempatan',
        number: '01',
        art: 'opportunity',
    },
    {
        icon: UsersRound,
        title: 'Kenal rekan lewat karya.',
        description:
            'Bergabung dalam tim dan ambil bagian lewat pekerjaan yang menjadi tanggung jawabmu.',
        label: 'Kolaborasi',
        number: '02',
        art: 'team',
    },
    {
        icon: BadgeCheck,
        title: 'Pekerjaanmu punya pengakuan.',
        description:
            'Ajukan bukti kontribusi untuk ditinjau kampus, lalu pilih karya yang ingin kamu bagikan.',
        label: 'Pengakuan',
        number: '03',
        art: 'recognition',
    },
];

export const getQuestions = (universityName?: string | null) => [
    {
        question: 'Belum punya portofolio. Apakah saya bisa ikut?',
        answer: 'Bisa. Kamu dapat mulai dari minat dan kemampuan yang kamu miliki, lalu mencari peran yang secara jelas menerima pemula. Setelah afiliasi kampus terverifikasi, penelusuran proyek tidak mewajibkan karya terdahulu.',
    },
    {
        question: 'Apakah mengajukan peran berarti langsung diterima?',
        answer: 'Belum. Pemilik proyek meninjau pengajuan berdasarkan kebutuhan peran dan kapasitas tim, lalu memberikan keputusan beralasan. Pengajuan tidak memesan tempat dan rekomendasi bukan jaminan penerimaan.',
    },
    {
        question: 'Apa yang sebenarnya ditinjau oleh kampus?',
        answer: 'Peninjau memeriksa kontribusi individual beserta bukti pada versi yang kamu kirim. Hasilnya dapat berupa persetujuan, permintaan perbaikan atau penolakan beralasan. Persetujuan berlaku untuk kontribusi tersebut, bukan seluruh kemampuan pemiliknya.',
    },
    {
        question: 'Apakah bukti pekerjaan saya otomatis menjadi publik?',
        answer: 'Tidak. Karya dari kontribusi yang disetujui awalnya privat. Kamu memilih jangkauan ringkasan portofolio dan dapat mencabut berbagi. Berkas bukti privat dan percakapan tim tidak otomatis ikut dipublikasikan.',
    },
    {
        question: 'Bagaimana cara mulai menggunakan SATU?',
        answer: `${universityName ? `SATU digunakan oleh mahasiswa ${universityName}.` : 'Informasi universitas belum tersedia. Hubungi pengelola SATU sebelum mengajukan verifikasi mahasiswa.'} Buat akun dengan username dan password, lalu verifikasi nomor WhatsApp. Ajukan NIM untuk pencocokan dengan daftar mahasiswa atau tinjauan Admin Universitas. Setelah afiliasi terverifikasi, kenalkan kemampuanmu dan temukan rekan kolaborasi. Akses Admin Universitas diberikan melalui undangan, bukan pendaftaran umum.`,
    },
];

export interface VisibilityExampleItem {
    key: 'private' | 'public';
    label: string;
    title: string;
    description: string;
}

export const VISIBILITY_EXAMPLES: readonly VisibilityExampleItem[] = [
    {
        key: 'private',
        label: 'Hanya saya',
        title: 'Disimpan untuk diri sendiri.',
        description:
            'Orang lain tidak melihat ringkasan karya ini melalui portofoliomu.',
    },
    {
        key: 'public',
        label: 'Publik',
        title: 'Ringkasan karya dapat dilihat publik.',
        description:
            'Pengunjung dapat membaca ringkasan yang dibagikan. Bukti privat tetap tidak ikut ditampilkan.',
    },
] as const;

export const VISIBILITY_ICONS = {
    private: LockKeyhole,
    public: Globe2,
} as const;
