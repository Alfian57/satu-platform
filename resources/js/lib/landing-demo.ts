export type DemoKind =
    'opportunity' | 'team' | 'work' | 'validation' | 'portfolio' | 'student';
export type DemoNode = {
    id: string;
    kind: DemoKind;
    label: string;
    caption: string;
    description: string;
    next: string;
    facts: readonly [string, string][];
    initial?: string;
};
export type DemoEdge = {
    id: string;
    source: string;
    target: string;
    label: string;
};

export const DEMO_KIND_LABELS: Record<DemoKind, string> = {
    opportunity: 'Proyek',
    team: 'Tim',
    work: 'Kontribusi',
    validation: 'Validasi',
    portfolio: 'Portofolio',
    student: 'Mahasiswa',
};

export const DEMO_NODES: readonly DemoNode[] = [
    {
        id: 'project',
        kind: 'opportunity',
        label: 'Ruang Baca Kampus',
        caption: 'Peluang untuk berkarya bersama.',
        description:
            'Contoh proyek untuk merancang pengalaman peminjaman buku. Kebutuhan peran dijelaskan sebelum mahasiswa mengajukan diri.',
        next: 'Pahami kebutuhan proyek dan ajukan diri untuk peran yang sesuai.',
        facts: [
            ['Kebutuhan contoh', 'Desain antarmuka'],
            ['Penerimaan pemula', 'Ya, dinyatakan pemilik proyek'],
        ],
    },
    {
        id: 'team',
        kind: 'team',
        label: 'Tim Pustaka',
        caption: 'Budi dan Siti bekerja bersama.',
        description:
            'Tim pada contoh ini memiliki dua anggota dengan peran berbeda. Keanggotaan tim tidak berarti setiap pekerjaan dimiliki semua anggota.',
        next: 'Kenali pembagian pekerjaan dan catat kontribusi masing-masing.',
        facts: [
            ['Budi', 'Desainer antarmuka'],
            ['Siti', 'Pengembang aplikasi'],
        ],
    },
    {
        id: 'contribution',
        kind: 'work',
        label: 'Alur peminjaman',
        caption: 'Kontribusi desain milik Budi.',
        description:
            'Budi merancang alur peminjaman untuk Ruang Baca Kampus. Catatan ini adalah sumber validasi dan karya Budi.',
        next: 'Kirim kontribusi dan bukti untuk ditinjau kampus.',
        facts: [
            ['Pemilik kontribusi', 'Budi'],
            ['Pekerjaan', 'Desain alur peminjaman'],
        ],
    },
    {
        id: 'validation',
        kind: 'validation',
        label: 'Tinjauan kampus',
        caption: 'Contoh keputusan: disetujui.',
        description:
            'Reviewer kampus menyetujui kontribusi Budi pada contoh synthetic ini. Dalam alur nyata, reviewer juga dapat meminta revisi atau menolak dengan alasan.',
        next: 'Kontribusi yang disetujui dapat menjadi sumber karya portofolio.',
        facts: [
            ['Kontribusi yang ditinjau', 'Alur peminjaman milik Budi'],
            ['Status contoh', 'Disetujui oleh reviewer kampus'],
        ],
    },
    {
        id: 'portfolio',
        kind: 'portfolio',
        label: 'Karya Budi',
        caption: 'Jangkauan dipilih oleh Budi.',
        description:
            'Karya contoh berasal hanya dari kontribusi Budi yang disetujui. Persetujuan kontribusi tidak otomatis memublikasikan karya atau membuka akses perekrut.',
        next: 'Pilih jangkauan karya atau pertahankan privat. Perekrut merupakan pengembangan lanjutan.',
        facts: [
            ['Sumber karya', 'Kontribusi Budi yang disetujui'],
            ['Jangkauan contoh', 'Privat. Belum dibagikan'],
        ],
    },
    {
        id: 'siti',
        kind: 'student',
        label: 'Siti',
        caption: 'Pengembang aplikasi.',
        description:
            'Siti adalah anggota Tim Pustaka pada contoh ini. Pekerjaan Siti tidak dijadikan sumber kontribusi atau portofolio Budi.',
        next: 'Catat pekerjaan Siti secara terpisah ketika membuat kontribusi.',
        facts: [
            ['Peran contoh', 'Pengembang aplikasi'],
            ['Hubungan', 'Anggota Tim Pustaka'],
        ],
        initial: 'S',
    },
    {
        id: 'budi',
        kind: 'student',
        label: 'Budi',
        caption: 'Mulai tanpa karya terdahulu.',
        description:
            'Budi memulai tanpa karya terdahulu, mengajukan peran pemula dan diterima beralasan. Ia kemudian merancang alur peminjaman. Catatan kontribusi dan karya tetap milik Budi.',
        next: 'Ikuti catatan kontribusi Budi untuk melihat perjalanan validasinya.',
        facts: [
            ['Peran contoh', 'Desainer antarmuka'],
            ['Kontribusi', 'Alur peminjaman'],
        ],
        initial: 'B',
    },
];

export const DEMO_EDGES: readonly DemoEdge[] = [
    {
        id: 'project-team',
        source: 'project',
        target: 'team',
        label: 'dikerjakan oleh',
    },
    {
        id: 'team-contribution',
        source: 'team',
        target: 'contribution',
        label: 'menjadi konteks pekerjaan',
    },
    {
        id: 'contribution-validation',
        source: 'contribution',
        target: 'validation',
        label: 'ditinjau melalui',
    },
    {
        id: 'validation-portfolio',
        source: 'validation',
        target: 'portfolio',
        label: 'menjadi dasar karya',
    },
    {
        id: 'siti-team',
        source: 'siti',
        target: 'team',
        label: 'bergabung dalam',
    },
    {
        id: 'budi-team',
        source: 'budi',
        target: 'team',
        label: 'bergabung dalam',
    },
    {
        id: 'budi-contribution',
        source: 'budi',
        target: 'contribution',
        label: 'mengerjakan',
    },
];

export function getDemoNode(id: string): DemoNode | undefined {
    return DEMO_NODES.find((node) => node.id === id);
}

export function getDemoRelations(id: string): readonly DemoEdge[] {
    return DEMO_EDGES.filter(
        (edge) => edge.source === id || edge.target === id,
    );
}

export function getDemoRelatedIds(id: string | null): ReadonlySet<string> {
    if (!id) {
        return new Set();
    }

    return new Set([
        id,
        ...getDemoRelations(id).flatMap((edge) => [edge.source, edge.target]),
    ]);
}

export type DemoBox = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export function createDemoConnector(
    source: DemoBox,
    target: DemoBox,
    isMember: boolean,
): string {
    const centerX = (box: DemoBox) => box.left + box.width / 2;
    const centerY = (box: DemoBox) => box.top + box.height / 2;

    if (Math.abs(centerY(source) - centerY(target)) < 8 && !isMember) {
        const start = source.left + source.width;
        const end = target.left;
        const mid = (start + end) / 2;

        return `M ${start} ${centerY(source)} C ${mid} ${centerY(source)}, ${mid} ${centerY(target)}, ${end} ${centerY(target)}`;
    }

    const isDownward = target.top > source.top;
    const startY = isDownward ? source.top + source.height : source.top;
    const endY = isDownward ? target.top : target.top + target.height;
    const startX = centerX(source);
    const endX = centerX(target);

    if (!isMember && endY - startY > 160) {
        const side = Math.max(6, Math.min(source.left, target.left) - 12);

        return `M ${startX} ${startY} C ${startX} ${startY + 24}, ${side} ${startY + 24}, ${side} ${startY + 40} L ${side} ${endY - 40} C ${side} ${endY - 24}, ${endX} ${endY - 24}, ${endX} ${endY}`;
    }

    const midY = (startY + endY) / 2;

    return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
}
