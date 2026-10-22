import { BadgeCheck, FileText, FolderOpen, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LandingPreviewKind =
    'project' | 'team' | 'contribution' | 'validation' | 'portfolio' | 'campus';

const previews: Record<
    LandingPreviewKind,
    {
        label: string;
        title: string;
        description: string;
        icon: typeof FileText;
        facts: [string, string][];
    }
> = {
    project: {
        label: 'Peluang proyek',
        title: 'Ruang Baca Kampus',
        description:
            'Contoh proyek untuk merancang pengalaman membaca bersama.',
        icon: FolderOpen,
        facts: [
            ['Peran yang dibutuhkan', 'Desainer antarmuka'],
            ['Keahlian', 'Riset pengguna, desain UI'],
            ['Konteks', 'Kebutuhan dan peran dijelaskan sebelum bergabung'],
        ],
    },
    team: {
        label: 'Ruang tim',
        title: 'Satu tujuan, peran yang jelas.',
        description:
            'Contoh pembagian pekerjaan pada proyek Ruang Baca Kampus.',
        icon: UsersRound,
        facts: [
            ['Riset pengguna', 'Anggota tim A'],
            ['Desain antarmuka', 'Anggota tim B'],
            ['Implementasi', 'Anggota tim C'],
        ],
    },
    contribution: {
        label: 'Catatan kontribusi',
        title: 'Merancang alur peminjaman',
        description:
            'Contoh catatan pekerjaan yang disiapkan untuk tinjauan kampus.',
        icon: FileText,
        facts: [
            ['Proyek', 'Ruang Baca Kampus'],
            ['Versi contoh', '01. Catatan awal'],
            ['Bukti contoh', 'Dokumentasi rancangan dan ringkasan pekerjaan'],
        ],
    },
    validation: {
        label: 'Tinjauan kampus',
        title: 'Keputusan punya konteks.',
        description:
            'Contoh tampilan riwayat, bukan hasil validasi pengguna nyata.',
        icon: BadgeCheck,
        facts: [
            ['Status contoh', 'Perlu revisi'],
            ['Alasan contoh', 'Lengkapi penjelasan peran dalam pekerjaan'],
            [
                'Langkah berikutnya',
                'Perbarui catatan dan kirim versi berikutnya',
            ],
        ],
    },
    portfolio: {
        label: 'Koleksi karya',
        title: 'Ruang Baca Kampus',
        description:
            'Contoh karya dari kontribusi yang disetujui, dengan konteks peran dan validasinya.',
        icon: FolderOpen,
        facts: [
            ['Peran dalam karya', 'Desainer antarmuka'],
            ['Sumber', 'Kontribusi yang disetujui kampus'],
            ['Jangkauan contoh', 'Privat. Belum dibagikan'],
        ],
    },
    campus: {
        label: 'Operasi kampus',
        title: 'Tinjau dengan konteks.',
        description:
            'Contoh susunan pekerjaan operator, tanpa menampilkan data privat.',
        icon: BadgeCheck,
        facts: [
            ['Afiliasi kampus', 'Pemeriksaan roster dan peninjauan'],
            ['Kontribusi', 'Versi, bukti, dan alasan keputusan'],
            ['Akses', 'Operator yang mendapat kewenangan'],
        ],
    },
};

export default function LandingPreview({
    kind,
    className,
}: {
    kind: LandingPreviewKind;
    className?: string;
}) {
    const preview = previews[kind];
    const Icon = preview.icon;

    return (
        <figure
            className={cn(
                'landing-preview min-w-0 overflow-hidden rounded-3xl border border-satu-border-soft bg-white shadow-md',
                className,
            )}
        >
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-satu-border-soft px-5 py-4 sm:px-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-satu-ink">
                    <Icon
                        aria-hidden="true"
                        className="size-4 text-satu-blue"
                    />
                    {preview.label}
                </span>
                <span className="rounded-full bg-satu-blue-soft px-3 py-1 text-xs font-semibold text-satu-blue-hover">
                    Data synthetic
                </span>
            </figcaption>
            <div className="p-5 sm:p-6">
                <div
                    aria-hidden="true"
                    className="mb-5 flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-satu-border-soft bg-gradient-to-br from-satu-blue-soft to-satu-canvas"
                >
                    <div className="relative flex h-20 w-32 rotate-[-6deg] items-center justify-center rounded-t-xl border border-satu-border-contrast bg-white shadow-sm">
                        <Icon className="size-9 text-satu-blue" />
                        <span className="absolute top-0 right-4 h-7 w-3 rounded-b-sm bg-satu-orange" />
                    </div>
                </div>
                <h3 className="text-2xl leading-tight font-bold tracking-[-0.025em] text-satu-ink">
                    {preview.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-satu-muted">
                    {preview.description}
                </p>
                <dl className="mt-5 divide-y divide-satu-border-soft border-t border-satu-border-soft">
                    {preview.facts.map(([label, value]) => (
                        <div key={label} className="py-3">
                            <dt className="text-xs text-satu-muted">{label}</dt>
                            <dd className="mt-1 text-sm leading-6 font-semibold text-satu-ink">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </figure>
    );
}
