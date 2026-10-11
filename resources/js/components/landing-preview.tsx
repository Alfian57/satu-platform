import {
    BadgeCheck,
    FileText,
    FolderOpen,
    LockKeyhole,
    UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LandingPreviewKind =
    | 'project'
    | 'team'
    | 'contribution'
    | 'validation'
    | 'portfolio'
    | 'campus'
    | 'recruiter';

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
    recruiter: {
        label: 'Proyeksi portofolio',
        title: 'Karya yang diizinkan terlihat.',
        description:
            'Contoh batas proyeksi untuk perekrut, bukan profil kandidat nyata.',
        icon: LockKeyhole,
        facts: [
            ['Dapat ditampilkan', 'Portofolio yang diizinkan mahasiswa'],
            ['Tidak ditampilkan', 'Percakapan tim dan bukti privat'],
            ['Akses', 'Organisasi terverifikasi dan hak akses aktif'],
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
                'landing-preview min-w-0 overflow-hidden rounded-3xl border border-[#D9E8F5] bg-white shadow-md',
                className,
            )}
        >
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9E8F5] px-5 py-4 sm:px-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#17345A]">
                    <Icon
                        aria-hidden="true"
                        className="size-4 text-[#1764E8]"
                    />
                    {preview.label}
                </span>
                <span className="rounded-full bg-[#E7F2FF] px-3 py-1 text-xs font-semibold text-[#1454C4]">
                    Data synthetic
                </span>
            </figcaption>
            <div className="p-5 sm:p-6">
                <div
                    aria-hidden="true"
                    className="mb-5 flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-[#D9E8F5] bg-[linear-gradient(125deg,#E7F2FF,#F3F9FF)]"
                >
                    <div className="relative flex h-20 w-32 rotate-[-6deg] items-center justify-center rounded-t-xl border border-[#BFD7EC] bg-white shadow-sm">
                        <Icon className="size-9 text-[#1764E8]" />
                        <span className="absolute top-0 right-4 h-7 w-3 rounded-b-sm bg-[#FFB85C]" />
                    </div>
                </div>
                <h3 className="text-2xl leading-tight font-bold tracking-[-0.025em] text-[#17345A]">
                    {preview.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#526B85]">
                    {preview.description}
                </p>
                <dl className="mt-5 divide-y divide-[#D9E8F5] border-t border-[#D9E8F5]">
                    {preview.facts.map(([label, value]) => (
                        <div key={label} className="py-3">
                            <dt className="text-xs text-[#526B85]">{label}</dt>
                            <dd className="mt-1 text-sm leading-6 font-semibold text-[#17345A]">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </figure>
    );
}
