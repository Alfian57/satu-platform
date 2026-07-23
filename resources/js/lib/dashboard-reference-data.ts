import type {
    DashboardReferenceScenario,
    DashboardReferenceState,
} from '@/types';
import { dashboardReferenceStates } from '@/types/dashboard';

const syntheticLabel = 'Data demo sintetis. Ini bukan aktivitas akun Anda.';

const revisionAction = {
    reference: 'REV-024',
    category: 'Kontribusi',
    recordedAt: '23 Juli 2026',
    recordedAtIso: '2026-07-23',
    statusLabel: 'Perlu revisi',
    statusTone: 'correction',
    title: 'Lengkapi bukti kontribusi',
    facts: [
        {
            label: 'Project',
            value: 'Riset kebutuhan pengguna · Peta Akses Kampus',
            icon: 'file',
        },
        {
            label: 'Batas waktu',
            value: 'Besok, 17.00 WIB',
            dateTime: '2026-07-24T17:00:00+07:00',
            icon: 'calendar',
            tone: 'correction',
        },
        {
            label: 'Direview oleh',
            value: 'Nadia Putri',
            supportingValue: 'Koordinator project',
            icon: 'user',
        },
        {
            label: 'Catatan',
            value: 'Tambahkan tautan rekaman wawancara dan ringkasan temuan.',
        },
    ],
    primaryActionLabel: 'Perbaiki kontribusi',
    secondaryActionLabel: 'Lihat detail',
} satisfies DashboardReferenceScenario['nextAction'];

const activeProjects = [
    {
        index: '01',
        name: 'Peta Akses Kampus',
        nextTask: 'Ringkas temuan wawancara',
        deadline: 'Besok',
        deadlineIso: '2026-07-24',
        deadlineTone: 'correction',
    },
    {
        index: '02',
        name: 'Festival Inovasi Mahasiswa',
        nextTask: 'Susun alur presentasi',
        deadline: '26 Juli',
        deadlineIso: '2026-07-26',
        deadlineTone: 'neutral',
    },
] satisfies Extract<
    DashboardReferenceScenario['projectsRegion'],
    { state: 'ready' }
>['projects'];

const reviewQueue = {
    count: 1,
    itemLabel: 'kontribusi',
    statusLabel: 'Menunggu tinjauan',
} satisfies DashboardReferenceScenario['reviewQueue'];

const recommendation = {
    state: 'ready',
    recommendation: {
        title: 'Desain sistem informasi relawan',
        role: 'Product Researcher',
        reasons: [
            'Riset pengguna dibutuhkan',
            'Ketersediaan enam jam per minggu sesuai kebutuhan.',
            'Tim mencari Product Researcher.',
        ],
        actionLabel: 'Tinjau rekomendasi',
    },
} satisfies DashboardReferenceScenario['recommendationRegion'];

export const dashboardReferenceScenarios: Record<
    DashboardReferenceState,
    DashboardReferenceScenario
> = {
    revision: {
        source: 'synthetic',
        state: 'revision',
        syntheticLabel,
        nextAction: revisionAction,
        projectsRegion: {
            state: 'ready',
            projects: activeProjects,
            totalCount: 2,
        },
        reviewQueue,
        recommendationRegion: recommendation,
    },
    'first-run': {
        source: 'synthetic',
        state: 'first-run',
        syntheticLabel,
        nextAction: {
            reference: 'MULAI-001',
            category: 'Orientasi',
            recordedAt: 'Hari ini',
            recordedAtIso: '2026-07-23',
            statusLabel: 'Langkah pertama',
            statusTone: 'neutral',
            title: 'Lengkapi profil untuk memulai',
            facts: [
                {
                    label: 'Kesiapan profil',
                    value: 'Belum lengkap',
                    supportingValue:
                        'Tambahkan skill, minat, dan ketersediaanmu.',
                    icon: 'profile',
                },
                {
                    label: 'Setelah selesai',
                    value: 'Kamu dapat melihat kecocokan project yang relevan.',
                    icon: 'file',
                },
                {
                    label: 'Perkiraan waktu',
                    value: 'Sekitar 5 menit',
                    icon: 'calendar',
                },
            ],
            primaryActionLabel: 'Lengkapi profil',
            secondaryActionLabel: 'Pelajari cara kerja SATU',
        },
        projectsRegion: {
            state: 'empty',
            title: 'Belum ada project aktif',
            description:
                'Project yang kamu ikuti akan tersusun di sini setelah profilmu siap.',
        },
        reviewQueue: {
            count: 0,
            itemLabel: 'item',
            statusLabel: 'Belum ada yang menunggu tinjauan',
        },
        recommendationRegion: {
            state: 'empty',
            title: 'Rekomendasi belum tersedia',
            description:
                'Lengkapi skill dan ketersediaan agar alasan kecocokan dapat dijelaskan.',
            actionLabel: 'Lengkapi profil',
        },
    },
    empty: {
        source: 'synthetic',
        state: 'empty',
        syntheticLabel,
        nextAction: {
            reference: 'READY-008',
            category: 'Project',
            recordedAt: 'Hari ini',
            recordedAtIso: '2026-07-23',
            statusLabel: 'Profil siap',
            statusTone: 'verified',
            title: 'Temukan project pertamamu',
            facts: [
                {
                    label: 'Profil',
                    value: 'Siap digunakan untuk pencocokan',
                    icon: 'profile',
                    tone: 'verified',
                },
                {
                    label: 'Skill utama',
                    value: 'Riset pengguna · Penulisan · Presentasi',
                    icon: 'file',
                },
                {
                    label: 'Ketersediaan',
                    value: '6 jam per minggu',
                    icon: 'calendar',
                },
            ],
            primaryActionLabel: 'Jelajahi project',
            secondaryActionLabel: 'Periksa profil',
        },
        projectsRegion: {
            state: 'empty',
            title: 'Belum ada project aktif',
            description:
                'Mulai dari project yang sesuai dengan skill dan waktu yang kamu miliki.',
            actionLabel: 'Jelajahi project',
        },
        reviewQueue: {
            count: 0,
            itemLabel: 'item',
            statusLabel: 'Tidak ada tinjauan tertunda',
        },
        recommendationRegion: {
            state: 'empty',
            title: 'Belum ada rekomendasi yang cukup kuat',
            description:
                'Kami belum memiliki project dengan kecocokan yang dapat dijelaskan saat ini.',
            actionLabel: 'Perbarui ketersediaan',
        },
    },
    loading: {
        source: 'synthetic',
        state: 'loading',
        syntheticLabel,
        nextAction: revisionAction,
        projectsRegion: {
            state: 'loading',
            announcement: 'Memuat daftar project aktif.',
        },
        reviewQueue,
        recommendationRegion: {
            state: 'loading',
            announcement: 'Memuat rekomendasi project.',
        },
    },
    'long-content': {
        source: 'synthetic',
        state: 'long-content',
        syntheticLabel,
        nextAction: {
            reference: 'REV-024-CONTENT-RANGE',
            category: 'Kontribusi lapangan dan dokumentasi riset',
            recordedAt: '23 Juli 2026',
            recordedAtIso: '2026-07-23',
            statusLabel: 'Perlu revisi',
            statusTone: 'correction',
            title: 'Lengkapi bukti kontribusi agar hasil observasi lintas kampus dapat divalidasi',
            facts: [
                {
                    label: 'Project',
                    value: 'Pemetaan aksesibilitas layanan akademik dan ruang belajar bersama untuk mahasiswa lintas kampus wilayah Jabodetabek',
                    icon: 'file',
                },
                {
                    label: 'Batas waktu',
                    value: 'Besok, 17.00 WIB',
                    dateTime: '2026-07-24T17:00:00+07:00',
                    icon: 'calendar',
                    tone: 'correction',
                },
                {
                    label: 'Direview oleh',
                    value: 'Nadia Putri Rahmawati',
                    supportingValue:
                        'Koordinator riset kebutuhan pengguna dan validasi bukti kontribusi',
                    icon: 'user',
                },
                {
                    label: 'Catatan',
                    value: 'Tambahkan tautan rekaman wawancara, ringkasan temuan utama, konteks setiap kutipan, serta penjelasan singkat mengenai perubahan keputusan desain yang berasal dari observasi tersebut.',
                },
            ],
            primaryActionLabel: 'Perbaiki kontribusi',
            secondaryActionLabel: 'Lihat seluruh detail kontribusi',
        },
        projectsRegion: {
            state: 'ready',
            totalCount: 12,
            remainingActionLabel: 'Lihat 9 project lainnya',
            projects: [
                {
                    index: '01',
                    name: 'Peta Akses Kampus dan Layanan Akademik Inklusif',
                    nextTask:
                        'Rangkum temuan wawancara mahasiswa dan petugas layanan akademik',
                    deadline: 'Besok',
                    deadlineIso: '2026-07-24',
                    deadlineTone: 'correction',
                },
                {
                    index: '02',
                    name: 'Festival Inovasi Mahasiswa Nusantara',
                    nextTask:
                        'Susun alur presentasi hasil eksperimen untuk panel lintas disiplin',
                    deadline: '26 Juli',
                    deadlineIso: '2026-07-26',
                    deadlineTone: 'neutral',
                },
                {
                    index: '03',
                    name: 'Direktori Ruang Belajar Bersama Antarkampus',
                    nextTask:
                        'Validasi informasi jam operasional dan akses transportasi publik',
                    deadline: '30 Juli',
                    deadlineIso: '2026-07-30',
                    deadlineTone: 'neutral',
                },
            ],
        },
        reviewQueue: {
            count: 20,
            itemLabel: 'kontribusi',
            statusLabel: 'Antrean tersusun berdasarkan waktu pengiriman',
        },
        recommendationRegion: {
            state: 'ready',
            recommendation: {
                title: 'Perancangan layanan relawan untuk pusat kegiatan mahasiswa lintas kampus',
                role: 'Product Researcher dan fasilitator wawancara',
                reasons: [
                    'Pengalaman riset pengguna dan sintesis wawancara dibutuhkan oleh tim',
                    'Ketersediaan enam jam per minggu sesuai dengan rentang kontribusi',
                    'Tim sedang mencari peran yang mampu menghubungkan temuan lapangan dengan keputusan produk',
                ],
                actionLabel: 'Tinjau alasan kecocokan lengkap',
            },
        },
    },
    'partial-permission': {
        source: 'synthetic',
        state: 'partial-permission',
        syntheticLabel,
        notice: {
            tone: 'pending',
            title: 'Afiliasi kampus sedang ditinjau',
            description:
                'Kamu tetap dapat memperbarui profil dan menjelajahi project. Bergabung ke tim dan mengirim kontribusi tersedia setelah afiliasi terverifikasi.',
            actionLabel: 'Tinjau profil',
        },
        nextAction: {
            reference: 'AFF-017',
            category: 'Afiliasi kampus',
            recordedAt: '23 Juli 2026',
            recordedAtIso: '2026-07-23',
            statusLabel: 'Menunggu tinjauan',
            statusTone: 'pending',
            title: 'Pastikan data profilmu tetap lengkap',
            facts: [
                {
                    label: 'Afiliasi',
                    value: 'Universitas contoh',
                    supportingValue: 'Sedang ditinjau oleh pengelola kampus.',
                    icon: 'building',
                    tone: 'pending',
                },
                {
                    label: 'Tetap tersedia',
                    value: 'Perbarui profil dan jelajahi project',
                    icon: 'profile',
                },
                {
                    label: 'Menunggu verifikasi',
                    value: 'Bergabung ke tim dan kirim kontribusi',
                    icon: 'file',
                    tone: 'muted',
                },
            ],
            primaryActionLabel: 'Tinjau profil',
        },
        projectsRegion: {
            state: 'ready',
            projects: activeProjects.slice(0, 1),
            totalCount: 1,
        },
        reviewQueue: {
            count: 1,
            itemLabel: 'afiliasi',
            statusLabel: 'Sedang diperiksa pengelola kampus',
        },
        recommendationRegion: {
            state: 'empty',
            title: 'Rekomendasi dapat dijelajahi setelah verifikasi',
            description:
                'Profilmu tersimpan. Kami tidak akan mengarang kecocokan sebelum fitur rekomendasi tersedia.',
            actionLabel: 'Periksa data profil',
        },
    },
    error: {
        source: 'synthetic',
        state: 'error',
        syntheticLabel,
        nextAction: revisionAction,
        projectsRegion: {
            state: 'error',
            title: 'Daftar project belum berhasil dimuat',
            description:
                'Tindakan utama di atas tetap dapat digunakan. Coba muat kembali daftar project.',
            actionLabel: 'Coba muat project',
        },
        reviewQueue,
        recommendationRegion: {
            state: 'error',
            title: 'Rekomendasi belum berhasil dimuat',
            description:
                'Data profilmu tetap aman. Coba muat kembali alasan kecocokan.',
            actionLabel: 'Coba muat rekomendasi',
        },
    },
    stale: {
        source: 'synthetic',
        state: 'stale',
        syntheticLabel,
        notice: {
            tone: 'stale',
            title: 'Ada perubahan terbaru',
            description:
                'Ringkasan ini terakhir diperbarui beberapa menit lalu. Muat ulang untuk menyelaraskan status tanpa kehilangan pekerjaan.',
            timestamp: 'Terakhir diperbarui 16.42 WIB',
            timestampIso: '2026-07-23T16:42:00+07:00',
            actionLabel: 'Muat ulang ringkasan',
        },
        nextAction: revisionAction,
        projectsRegion: {
            state: 'ready',
            projects: activeProjects,
            totalCount: 2,
        },
        reviewQueue,
        recommendationRegion: recommendation,
    },
};

const dashboardReferenceStateSet = new Set<string>(dashboardReferenceStates);

export function resolveDashboardReferenceState(
    url: string,
): DashboardReferenceState {
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
    const requestedState = new URLSearchParams(query).get('state');

    if (requestedState && dashboardReferenceStateSet.has(requestedState)) {
        return requestedState as DashboardReferenceState;
    }

    return 'revision';
}
