import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock3,
    FileCheck2,
    FileSpreadsheet,
    Filter,
    FolderKanban,
    GraduationCap,
    Info,
    Network,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    Users,
    XCircle,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
import { index as campusInclusionIndex } from '@/routes/campus/inclusion';
import { show as campusOverview } from '@/routes/campus/overview';
import { show as campusRoster } from '@/routes/campus/roster';
import { index as opportunitySupport } from '@/routes/opportunity-support';

interface OverviewMetrics {
    memberships: {
        total: number;
        verified: number;
        pending: number;
        unverified: number;
    };
    projects: {
        total: number;
        active: number;
        completed: number;
        draft: number;
    };
    contributions: {
        total: number;
        pending: number;
        validated: number;
        revision_required: number;
    };
    review_turnaround: {
        average_hours: number;
        total_reviewed: number;
        approved_count: number;
        rejected_count: number;
        revision_count: number;
    };
}

interface MemberItem {
    id: number;
    role: string;
    status: string;
    program: string | null;
    createdAt: string | null;
}

interface CampusOverviewProps {
    institution: { id: number; name: string };
    metrics: OverviewMetrics;
    programDistribution: { program: string; count: number }[];
    members: {
        items: MemberItem[];
        pagination: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    filters: {
        date_from: string | null;
        date_to: string | null;
        program: string | null;
    };
}

type OverviewQuery = {
    date_from?: string;
    date_to?: string;
    program?: string;
    page: number;
    per_page: number;
};
const numberFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
});

function formatDate(value: string | null): string {
    const date = value ? new Date(value) : null;

    return date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
        : 'Belum tersedia';
}

function roleLabel(role: string): string {
    if (role === 'campus_admin') {
        return 'Operator kampus';
    }

    if (role === 'student') {
        return 'Mahasiswa';
    }

    return 'Peran lainnya';
}

function MembershipStatus({ status }: { status: string }) {
    const meta =
        status === 'verified'
            ? {
                  label: 'Terverifikasi',
                  Icon: CheckCircle2,
                  className:
                      'border-verified/20 bg-verified-subtle text-verified-subtle-foreground',
              }
            : status === 'pending'
              ? {
                    label: 'Menunggu tinjauan',
                    Icon: Clock3,
                    className:
                        'border-pending/20 bg-pending-subtle text-pending-subtle-foreground',
                }
              : status === 'suspended'
                ? {
                      label: 'Ditangguhkan',
                      Icon: XCircle,
                      className:
                          'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
                  }
                : {
                      label:
                          status === 'unverified'
                              ? 'Belum terverifikasi'
                              : 'Status belum tersedia',
                      Icon: Info,
                      className:
                          'border-border bg-background text-muted-foreground',
                  };

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs leading-5 font-semibold',
                meta.className,
            )}
        >
            <meta.Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {meta.label}
        </span>
    );
}

function MetricCard({
    title,
    value,
    icon,
    children,
    description,
}: {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    children: ReactNode;
    description: string;
}) {
    return (
        <article className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-base leading-6 font-semibold">{title}</h3>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    {icon}
                </span>
            </div>
            <p className="mt-2 text-3xl leading-tight font-bold tracking-tight break-words">
                {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
            </p>
            <div className="mt-3 border-t border-border pt-3">{children}</div>
        </article>
    );
}

type ChartSegment = { label: string; value: number; color: string };

function StatusChart({
    segments,
    variant,
    label,
}: {
    segments: ChartSegment[];
    variant: 'ring' | 'bar';
    label: string;
}) {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    if (total <= 0) {
        return (
            <p className="rounded-xl bg-accent/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                Belum ada data untuk grafik ini.
            </p>
        );
    }

    return (
        <figure
            aria-label={label}
            className={cn(
                'min-w-0',
                variant === 'ring' && 'flex items-center gap-3',
            )}
        >
            {variant === 'ring' ? (
                <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    className="size-22 shrink-0 -rotate-90"
                >
                    {segments.map((segment, index) => {
                        const percent = (segment.value / total) * 100;
                        const start =
                            (segments
                                .slice(0, index)
                                .reduce(
                                    (sum, previous) => sum + previous.value,
                                    0,
                                ) /
                                total) *
                            100;

                        return (
                            <circle
                                key={segment.label}
                                cx="50"
                                cy="50"
                                r="38"
                                pathLength="100"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeDasharray={`${percent} ${100 - percent}`}
                                strokeDashoffset={-start}
                                className={segment.color}
                            />
                        );
                    })}
                </svg>
            ) : (
                <div
                    aria-hidden="true"
                    className="mb-3 flex h-3 overflow-hidden rounded-full bg-accent"
                >
                    {segments
                        .filter((segment) => segment.value > 0)
                        .map((segment) => (
                            <span
                                key={segment.label}
                                className={cn(
                                    'h-full border-r-2 border-white bg-current last:border-r-0',
                                    segment.color,
                                )}
                                style={{
                                    width: `${(segment.value / total) * 100}%`,
                                }}
                            />
                        ))}
                </div>
            )}
            <figcaption className="min-w-0 flex-1">
                <dl className="space-y-1.5 text-xs leading-5">
                    {segments.map((segment) => (
                        <div
                            key={segment.label}
                            className="flex items-baseline justify-between gap-3"
                        >
                            <dt className="flex min-w-0 items-baseline gap-2 text-muted-foreground">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'size-2 shrink-0 self-center rounded-full bg-current',
                                        segment.color,
                                    )}
                                />
                                {segment.label}
                            </dt>
                            <dd className="shrink-0 font-label font-semibold">
                                {numberFormatter.format(segment.value)}
                            </dd>
                        </div>
                    ))}
                </dl>
            </figcaption>
        </figure>
    );
}

function MetricFact({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold">
                {numberFormatter.format(value)}
            </dd>
        </div>
    );
}

function MembersList({
    members,
    isPending,
    onPageChange,
}: {
    members: CampusOverviewProps['members'];
    isPending: boolean;
    onPageChange: (page: number) => void;
}) {
    const pagination = members.pagination;

    return (
        <section
            className="min-w-0 space-y-4"
            aria-labelledby="campus-members-heading"
        >
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
                <div>
                    <h2
                        id="campus-members-heading"
                        className="text-xl font-bold tracking-tight sm:text-2xl"
                    >
                        Anggota kampus
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Mahasiswa dan operator sesuai filter yang diterapkan.
                    </p>
                </div>
                <span className="rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs leading-5 font-semibold text-primary">
                    {numberFormatter.format(pagination.total)} anggota
                </span>
            </div>
            <div
                className="@container min-w-0 rounded-3xl border border-border bg-white shadow-sm"
                aria-busy={isPending}
            >
                {members.items.length === 0 ? (
                    isPending ? (
                        <div
                            aria-hidden="true"
                            className="space-y-4 p-5 sm:p-6"
                        >
                            {[1, 2, 3].map((key) => (
                                <div
                                    key={key}
                                    className="space-y-3 border-b border-border pb-4 last:border-0"
                                >
                                    <Skeleton className="h-5 w-32 motion-reduce:animate-none" />
                                    <Skeleton className="h-5 w-3/4 motion-reduce:animate-none" />
                                    <Skeleton className="h-6 w-36 rounded-full motion-reduce:animate-none" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-10 text-center">
                            <DashboardArchiveArt className="mx-auto size-24" />
                            <h3 className="mt-4 text-xl font-semibold">
                                Belum ada anggota pada hasil ini
                            </h3>
                            <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                                Periksa periode dan nama program studi, atau
                                atur ulang filter untuk melihat cakupan yang
                                lebih luas.
                            </p>
                        </div>
                    )
                ) : (
                    <>
                        <div className="hidden @min-[36rem]:block">
                            <table className="w-full table-fixed text-left text-sm">
                                <caption className="sr-only">
                                    Daftar keanggotaan kampus. Referensi
                                    keanggotaan, program studi, peran, dan
                                    status afiliasi.
                                </caption>
                                <thead className="border-b border-border bg-accent/35 text-xs text-muted-foreground">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="w-[24%] rounded-tl-3xl px-4 py-3 font-semibold"
                                        >
                                            Keanggotaan
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-[28%] px-4 py-3 font-semibold"
                                        >
                                            Program studi
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-[20%] px-4 py-3 font-semibold"
                                        >
                                            Peran
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-[28%] rounded-tr-3xl px-4 py-3 font-semibold"
                                        >
                                            Status afiliasi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {members.items.map((member) => (
                                        <tr key={member.id}>
                                            <th
                                                scope="row"
                                                className="px-4 py-3 align-top font-normal"
                                            >
                                                <span className="font-label text-xs font-semibold break-words">
                                                    ANGGOTA-{member.id}
                                                </span>
                                                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                                                    Tercatat{' '}
                                                    {formatDate(
                                                        member.createdAt,
                                                    )}
                                                </span>
                                            </th>
                                            <td className="px-4 py-3 align-top leading-6 break-words">
                                                {member.program ||
                                                    'Belum tersedia'}
                                            </td>
                                            <td className="px-4 py-3 align-top leading-6">
                                                {roleLabel(member.role)}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <MembershipStatus
                                                    status={member.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ul
                            aria-label="Anggota kampus"
                            className="divide-y divide-border @min-[36rem]:hidden"
                        >
                            {members.items.map((member) => (
                                <li key={member.id} className="p-4">
                                    <p className="font-label text-xs font-semibold">
                                        ANGGOTA-{member.id}
                                    </p>
                                    <dl className="mt-3 grid gap-x-4 gap-y-2 @min-[22rem]:grid-cols-2">
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Program studi
                                            </dt>
                                            <dd className="mt-1 text-sm leading-6 break-words">
                                                {member.program ||
                                                    'Belum tersedia'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Peran
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {roleLabel(member.role)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Status afiliasi
                                            </dt>
                                            <dd className="mt-2">
                                                <MembershipStatus
                                                    status={member.status}
                                                />
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Tercatat
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {formatDate(member.createdAt)}
                                            </dd>
                                        </div>
                                    </dl>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <div className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
                    Referensi mengidentifikasi catatan keanggotaan. Username
                    privat tidak ditampilkan di ringkasan.
                </div>
            </div>
            {(pagination.last_page > 1 || pagination.current_page > 1) && (
                <nav
                    aria-label="Halaman anggota kampus"
                    className="flex flex-wrap items-center justify-between gap-3 px-1"
                >
                    <p className="text-xs leading-5 text-muted-foreground">
                        Halaman {pagination.current_page} dari{' '}
                        {pagination.last_page}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={isPending || pagination.current_page <= 1}
                            onClick={() =>
                                onPageChange(pagination.current_page - 1)
                            }
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-4"
                            />
                            Sebelumnya
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={
                                isPending ||
                                pagination.current_page >= pagination.last_page
                            }
                            onClick={() =>
                                onPageChange(pagination.current_page + 1)
                            }
                        >
                            Berikutnya
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Button>
                    </div>
                </nav>
            )}
        </section>
    );
}

function OverviewContextRail({
    institution,
    programDistribution,
    isPending,
    isForbidden,
}: Pick<CampusOverviewProps, 'institution' | 'programDistribution'> & {
    isPending: boolean;
    isForbidden: boolean;
}) {
    const distributionTotal = programDistribution.reduce(
        (total, item) => total + item.count,
        0,
    );

    return (
        <aside
            aria-label="Konteks ringkasan kampus"
            className="min-w-0 space-y-4"
        >
            {!isForbidden && (
                <section
                    className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
                    aria-labelledby="campus-distribution-heading"
                    aria-busy={isPending}
                >
                    <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-primary">
                        <GraduationCap aria-hidden="true" className="size-5" />
                    </span>
                    <h2
                        id="campus-distribution-heading"
                        className="mt-3 text-lg font-bold tracking-tight"
                    >
                        Sebaran program studi
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Seluruh program pada periode terpilih, termasuk saat
                        daftar anggota difilter.
                    </p>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Dasar persentase:{' '}
                        {numberFormatter.format(distributionTotal)} profil
                        mahasiswa dengan program studi.
                    </p>
                    {programDistribution.length === 0 ? (
                        isPending ? (
                            <div aria-hidden="true" className="mt-5 space-y-4">
                                {[1, 2, 3].map((key) => (
                                    <div key={key} className="space-y-2">
                                        <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
                                        <Skeleton className="h-2 w-full motion-reduce:animate-none" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-5 rounded-2xl bg-accent/50 p-4 text-sm leading-6 text-muted-foreground">
                                Belum ada profil dengan program studi pada
                                periode ini.
                            </p>
                        )
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {programDistribution.map((item) => {
                                const percent =
                                    distributionTotal > 0
                                        ? (item.count / distributionTotal) * 100
                                        : 0;

                                return (
                                    <li key={item.program}>
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            <p className="min-w-0 text-sm leading-6 font-semibold break-words">
                                                {item.program}
                                            </p>
                                            <p className="font-label text-xs leading-5 text-muted-foreground">
                                                {numberFormatter.format(
                                                    item.count,
                                                )}{' '}
                                                profil (
                                                {numberFormatter.format(
                                                    percent,
                                                )}
                                                %)
                                            </p>
                                        </div>
                                        <div
                                            aria-hidden="true"
                                            className="mt-2 h-2 overflow-hidden rounded-full bg-accent"
                                        >
                                            <div
                                                className="h-full rounded-full bg-primary/75"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}
            <section className="rounded-3xl border border-border bg-accent/35 p-4 sm:p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <FileSpreadsheet
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    Data kampus
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Pintasan memakai kampus aktif yang sama. Keputusan dilakukan
                    pada antrean masing-masing.
                </p>
                <Button
                    asChild
                    variant="outline"
                    className="mt-3 h-auto min-h-11 w-full bg-white whitespace-normal"
                >
                    <Link href={campusRoster({ institution: institution.id })}>
                        Kelola roster mahasiswa
                    </Link>
                </Button>
            </section>
            <section className="border-t border-border px-1 pt-2">
                <details className="group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                        Tentang data ringkasan
                        <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                        />
                    </summary>
                    <p className="pb-3 text-xs leading-5 text-muted-foreground">
                        Angka mengikuti hasil server dan periode yang
                        diterapkan, bukan aktivitas hari ini atau penilaian
                        mahasiswa. Program studi tidak menyaring proyek maupun
                        waktu tinjauan. Filter tanggal membaca waktu pencatatan,
                        bukan waktu aktivitas terakhir. Gunakan nama program
                        yang sama dengan profil mahasiswa; kosongkan untuk semua
                        program. Grafik menunjukkan komposisi, bukan tren.
                    </p>
                </details>
                <details className="mt-2 border-t border-border pt-2">
                    <summary className="flex min-h-11 cursor-pointer items-center rounded-xl text-xs font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        Fitur lanjutan
                    </summary>
                    <Link
                        href={campusInclusionIndex({
                            institution: institution.id,
                        })}
                        className="mt-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <Network
                            aria-hidden="true"
                            className="size-5 shrink-0 text-primary"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                                Peninjauan inklusi
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                Modul terpisah dengan akses dan aktivasi
                                terbatas.
                            </span>
                        </span>
                        <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                        />
                    </Link>
                </details>
            </section>
        </aside>
    );
}

function CampusOverviewContent({
    institution,
    metrics,
    programDistribution,
    members,
    filters,
}: CampusOverviewProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [program, setProgram] = useState(filters.program || '');
    const [isPending, setIsPending] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [hasError, setHasError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const errorRef = useRef<HTMLDivElement>(null);
    const appliedQuery: OverviewQuery = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        program: filters.program || undefined,
        page: members.pagination.current_page,
        per_page: members.pagination.per_page,
    };
    const lastRequestRef = useRef<{ query: OverviewQuery; syncDraft: boolean }>(
        { query: appliedQuery, syncDraft: false },
    );
    const hasAppliedFilters = Boolean(
        filters.date_from || filters.date_to || filters.program,
    );
    const hasDraftChanges =
        dateFrom !== (filters.date_from || '') ||
        dateTo !== (filters.date_to || '') ||
        program !== (filters.program || '');

    const failRequest = (forbidden = false): false => {
        if (forbidden) {
            setIsForbidden(true);
        }

        setHasError(true);
        setFeedback(
            'Ringkasan belum dapat diperbarui. Pilihan filter tetap tersedia. Coba lagi untuk mengambil hasil terbaru.',
        );
        requestAnimationFrame(() => errorRef.current?.focus());

        return false;
    };

    const visitOverview = (query: OverviewQuery, syncDraft = false) => {
        if (isPending) {
            return;
        }

        lastRequestRef.current = { query, syncDraft };
        setIsPending(true);
        setHasError(false);
        setFieldErrors({});
        setFeedback('Memuat ringkasan dan anggota kampus.');
        router.get(campusOverview({ institution: institution.id }), query, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsForbidden(false);
                setHasError(false);
                setFeedback('Ringkasan kampus telah diperbarui.');

                if (syncDraft) {
                    setDateFrom(query.date_from || '');
                    setDateTo(query.date_to || '');
                    setProgram(query.program || '');
                }
            },
            onError: (errors) => {
                setFieldErrors(errors);
                failRequest();
            },
            onHttpException: (response) =>
                failRequest(response.status === 403 || response.status === 404),
            onNetworkError: () => failRequest(),
            onFinish: () => setIsPending(false),
        });
    };

    const handleFilterSubmit = (event: FormEvent) => {
        event.preventDefault();
        visitOverview(
            {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                program: program.trim() || undefined,
                page: 1,
                per_page: members.pagination.per_page,
            },
            true,
        );
    };

    return (
        <>
            <Head title={`Ringkasan kampus | ${institution.name}`} />
            <AppPage className="max-w-none min-w-0">
                <div
                    className="space-y-4 sm:space-y-5"
                    data-test="campus-overview-root"
                >
                    <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-[#dff1ff] via-[#edf6ff] to-white p-6 shadow-md sm:p-8 lg:p-10">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                        >
                            <DashboardArchiveArt className="absolute top-4 right-24 hidden w-36 -rotate-6 opacity-50 sm:block lg:right-48 lg:w-44" />
                            <span className="absolute top-10 right-8 h-10 w-2 rotate-12 rounded-full bg-[#ffb85c]/75" />
                        </div>
                        <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_9rem] lg:grid-cols-[minmax(0,1fr)_13rem] 2xl:grid-cols-[minmax(0,1fr)_16rem]">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                                    Ruang operator kampus
                                </p>
                                <h1 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.035em] sm:text-4xl 2xl:text-5xl">
                                    Ringkasan kampus.
                                    <br />
                                    <span className="text-primary">
                                        Pahami data. Tentukan langkah.
                                    </span>
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                    Pantau keanggotaan dan proyek kampus, lalu
                                    lanjutkan ke antrean afiliasi atau validasi
                                    kontribusi yang perlu ditinjau.
                                </p>
                                <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-2 text-sm font-semibold">
                                    <Building2
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    <span className="min-w-0 break-words">
                                        {institution.name}
                                    </span>
                                </p>
                            </div>
                            <Mascot
                                pose="guide"
                                priority
                                className="mx-auto w-28 sm:w-full"
                            />
                        </div>
                    </header>
                    <Button variant="outline" asChild className="min-h-11">
                        <Link href={opportunitySupport(institution.id)}>
                            Tindak lanjut kesempatan
                        </Link>
                    </Button>
                    <form
                        onSubmit={handleFilterSubmit}
                        className="@container rounded-3xl border border-border bg-white p-4 shadow-sm"
                        aria-label="Filter ringkasan kampus"
                    >
                        {hasDraftChanges && (
                            <p className="mb-3 text-xs leading-5 font-semibold text-pending-subtle-foreground">
                                Pilihan belum diterapkan
                            </p>
                        )}
                        <fieldset
                            disabled={isPending}
                            aria-describedby="campus-filter-help"
                            className="grid min-w-0 items-start gap-3 @min-[28rem]:grid-cols-2 @min-[44rem]:grid-cols-3 @min-[56rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                        >
                            <legend className="sr-only">
                                Periode dan program studi
                            </legend>
                            <div className="min-w-0 space-y-2">
                                <label
                                    htmlFor="campus-overview-date-from"
                                    className="text-sm font-semibold"
                                >
                                    Tanggal mulai
                                </label>
                                <Input
                                    id="campus-overview-date-from"
                                    type="date"
                                    className="h-11 cursor-pointer text-base md:text-base"
                                    value={dateFrom}
                                    onChange={(event) =>
                                        setDateFrom(event.target.value)
                                    }
                                    aria-invalid={Boolean(
                                        fieldErrors.date_from,
                                    )}
                                    aria-describedby={
                                        fieldErrors.date_from
                                            ? 'date-from-error'
                                            : undefined
                                    }
                                />
                                {fieldErrors.date_from && (
                                    <p
                                        id="date-from-error"
                                        className="text-sm text-correction"
                                    >
                                        {fieldErrors.date_from}
                                    </p>
                                )}
                            </div>
                            <div className="min-w-0 space-y-2">
                                <label
                                    htmlFor="campus-overview-date-to"
                                    className="text-sm font-semibold"
                                >
                                    Tanggal selesai
                                </label>
                                <Input
                                    id="campus-overview-date-to"
                                    type="date"
                                    className="h-11 cursor-pointer text-base md:text-base"
                                    value={dateTo}
                                    onChange={(event) =>
                                        setDateTo(event.target.value)
                                    }
                                    aria-invalid={Boolean(fieldErrors.date_to)}
                                    aria-describedby={
                                        fieldErrors.date_to
                                            ? 'date-to-error'
                                            : undefined
                                    }
                                />
                                {fieldErrors.date_to && (
                                    <p
                                        id="date-to-error"
                                        className="text-sm text-correction"
                                    >
                                        {fieldErrors.date_to}
                                    </p>
                                )}
                            </div>
                            <div className="min-w-0 space-y-2 @min-[28rem]:col-span-2 @min-[44rem]:col-span-1">
                                <label
                                    htmlFor="campus-overview-program"
                                    className="text-sm font-semibold"
                                >
                                    Program studi
                                </label>
                                <Input
                                    id="campus-overview-program"
                                    type="text"
                                    className="h-11 text-base md:text-base"
                                    placeholder="Nama lengkap program studi"
                                    value={program}
                                    onChange={(event) =>
                                        setProgram(event.target.value)
                                    }
                                    aria-invalid={Boolean(fieldErrors.program)}
                                    aria-describedby={
                                        fieldErrors.program
                                            ? 'campus-program-help campus-program-error'
                                            : 'campus-program-help'
                                    }
                                />
                                <p id="campus-program-help" className="sr-only">
                                    Gunakan nama yang sama dengan profil
                                    mahasiswa. Kosongkan untuk semua program.
                                </p>
                                {fieldErrors.program && (
                                    <p
                                        id="campus-program-error"
                                        className="text-sm text-correction"
                                    >
                                        {fieldErrors.program}
                                    </p>
                                )}
                            </div>
                            <div className="flex min-w-0 flex-wrap gap-2 @min-[28rem]:col-span-2 @min-[44rem]:col-span-3 @min-[56rem]:col-span-1 @min-[56rem]:max-w-72 @min-[56rem]:pt-6">
                                <Button
                                    type="submit"
                                    className="h-11"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Spinner aria-hidden="true" />
                                    ) : (
                                        <Filter
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    )}
                                    Terapkan filter
                                </Button>
                                {(hasAppliedFilters || hasDraftChanges) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                        disabled={isPending}
                                        onClick={() =>
                                            visitOverview(
                                                {
                                                    page: 1,
                                                    per_page:
                                                        members.pagination
                                                            .per_page,
                                                },
                                                true,
                                            )
                                        }
                                    >
                                        <RotateCcw
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Atur ulang
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    disabled={isPending}
                                    onClick={() => visitOverview(appliedQuery)}
                                >
                                    <RefreshCw
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Muat ulang
                                </Button>
                            </div>
                        </fieldset>
                        <p id="campus-filter-help" className="sr-only">
                            Tanggal membatasi waktu pencatatan. Program studi
                            hanya menyaring keanggotaan dan daftar anggota.
                        </p>
                    </form>
                    <div
                        ref={errorRef}
                        tabIndex={-1}
                        role={hasError ? 'alert' : 'status'}
                        className={cn(
                            'rounded-xl text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                            hasError
                                ? 'border border-correction/20 bg-correction-subtle p-4 text-correction-subtle-foreground'
                                : feedback
                                  ? 'text-muted-foreground'
                                  : 'sr-only',
                        )}
                    >
                        {feedback}
                        {hasError && (
                            <div className="mt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 bg-white"
                                    disabled={isPending}
                                    onClick={() =>
                                        visitOverview(
                                            lastRequestRef.current.query,
                                            lastRequestRef.current.syncDraft,
                                        )
                                    }
                                >
                                    Coba lagi
                                </Button>
                            </div>
                        )}
                    </div>
                    {isForbidden ? (
                        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                            <ShieldCheck
                                aria-hidden="true"
                                className="size-8 text-primary"
                            />
                            <h2 className="mt-4 text-xl font-semibold">
                                Akses ringkasan tidak tersedia
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Data sebelumnya disembunyikan. Periksa kembali
                                akses operator pada kampus ini dengan memuat
                                ulang.
                            </p>
                        </section>
                    ) : (
                        <section
                            aria-labelledby="campus-metrics-heading"
                            aria-busy={isPending}
                            className="@container space-y-4"
                        >
                            <h2 id="campus-metrics-heading" className="sr-only">
                                Fakta dalam cakupan ringkasan
                            </h2>
                            <div className="grid min-w-0 gap-4 @min-[30rem]:grid-cols-2 @min-[46rem]:grid-cols-3">
                                <MetricCard
                                    title="Keanggotaan tercatat"
                                    value={numberFormatter.format(
                                        metrics.memberships.total,
                                    )}
                                    icon={
                                        <Users
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    }
                                    description="Mahasiswa dan operator, tidak termasuk afiliasi ditangguhkan."
                                >
                                    <StatusChart
                                        label="Komposisi keanggotaan tercatat"
                                        variant="ring"
                                        segments={[
                                            {
                                                label: 'Terverifikasi',
                                                value: metrics.memberships
                                                    .verified,
                                                color: 'text-verified',
                                            },
                                            {
                                                label: 'Menunggu',
                                                value: metrics.memberships
                                                    .pending,
                                                color: 'text-pending',
                                            },
                                            {
                                                label: 'Belum terverifikasi',
                                                value: metrics.memberships
                                                    .unverified,
                                                color: 'text-muted-foreground',
                                            },
                                        ]}
                                    />
                                </MetricCard>
                                <MetricCard
                                    title="Proyek kampus"
                                    value={numberFormatter.format(
                                        metrics.projects.total,
                                    )}
                                    icon={
                                        <FolderKanban
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    }
                                    description="Periode terpilih, tidak difilter program studi."
                                >
                                    <StatusChart
                                        label="Komposisi status proyek kampus"
                                        variant="bar"
                                        segments={[
                                            {
                                                label: 'Aktif',
                                                value: metrics.projects.active,
                                                color: 'text-primary',
                                            },
                                            {
                                                label: 'Ditutup/diarsipkan',
                                                value: metrics.projects
                                                    .completed,
                                                color: 'text-verified',
                                            },
                                            {
                                                label: 'Draft',
                                                value: metrics.projects.draft,
                                                color: 'text-muted-foreground',
                                            },
                                            ...(metrics.projects.total >
                                            metrics.projects.active +
                                                metrics.projects.completed +
                                                metrics.projects.draft
                                                ? [
                                                      {
                                                          label: 'Status lainnya',
                                                          value:
                                                              metrics.projects
                                                                  .total -
                                                              metrics.projects
                                                                  .active -
                                                              metrics.projects
                                                                  .completed -
                                                              metrics.projects
                                                                  .draft,
                                                          color: 'text-pending',
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                    />
                                </MetricCard>
                                <MetricCard
                                    title="Waktu tinjauan afiliasi"
                                    value={
                                        metrics.review_turnaround
                                            .total_reviewed > 0 ? (
                                            <>
                                                {numberFormatter.format(
                                                    metrics.review_turnaround
                                                        .average_hours,
                                                )}
                                                <span className="ml-2 text-base font-medium text-muted-foreground">
                                                    jam
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xl">
                                                Belum tersedia
                                            </span>
                                        )
                                    }
                                    icon={
                                        <Clock3
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    }
                                    description={
                                        metrics.review_turnaround
                                            .total_reviewed > 0
                                            ? `Rata-rata dari ${numberFormatter.format(metrics.review_turnaround.total_reviewed)} keputusan afiliasi, bukan target SLA.`
                                            : 'Belum ada keputusan afiliasi pada periode ini.'
                                    }
                                >
                                    <dl className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                        <MetricFact
                                            label="Disetujui"
                                            value={
                                                metrics.review_turnaround
                                                    .approved_count
                                            }
                                        />
                                        <MetricFact
                                            label="Perlu revisi"
                                            value={
                                                metrics.review_turnaround
                                                    .revision_count
                                            }
                                        />
                                        <MetricFact
                                            label="Ditolak"
                                            value={
                                                metrics.review_turnaround
                                                    .rejected_count
                                            }
                                        />
                                    </dl>
                                </MetricCard>
                            </div>
                            <p className="px-1 text-xs leading-5 text-muted-foreground">
                                Proyek aktif mencakup status terbuka,
                                pembentukan tim, dan tim penuh. Ditutup atau
                                diarsipkan tidak otomatis berarti karya selesai.
                            </p>
                        </section>
                    )}
                    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="min-w-0 space-y-4">
                            {!isForbidden && (
                                <>
                                    <section
                                        className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
                                        aria-labelledby="campus-actions-heading"
                                    >
                                        <h2
                                            id="campus-actions-heading"
                                            className="text-lg font-bold tracking-tight"
                                        >
                                            Lanjutkan pekerjaan
                                        </h2>
                                        <div className="mt-3 divide-y divide-border">
                                            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-accent/45 p-3">
                                                <ClipboardCheck
                                                    aria-hidden="true"
                                                    className="size-5 shrink-0 text-primary"
                                                />
                                                <div className="min-w-0 flex-1 basis-48">
                                                    <h3 className="text-sm font-semibold">
                                                        Tinjau afiliasi kampus
                                                    </h3>
                                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                        {numberFormatter.format(
                                                            metrics.memberships
                                                                .pending,
                                                        )}{' '}
                                                        keanggotaan menunggu.
                                                        Bukan total permintaan
                                                        pada antrean afiliasi.
                                                    </p>
                                                </div>
                                                <Button
                                                    asChild
                                                    className="h-11"
                                                >
                                                    <Link
                                                        href={affiliationIndex({
                                                            institution:
                                                                institution.id,
                                                        })}
                                                    >
                                                        Buka antrean afiliasi
                                                        <ChevronRight
                                                            aria-hidden="true"
                                                            className="size-4"
                                                        />
                                                    </Link>
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 px-3 pt-3">
                                                <FileCheck2
                                                    aria-hidden="true"
                                                    className="size-5 shrink-0 text-primary"
                                                />
                                                <div className="min-w-0 flex-1 basis-48">
                                                    <h3 className="text-sm font-semibold">
                                                        Validasi kontribusi
                                                        mahasiswa
                                                    </h3>
                                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                        Periksa pengajuan dan
                                                        bukti. Jumlah kontribusi
                                                        belum tersedia pada
                                                        ringkasan ini.
                                                    </p>
                                                </div>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="h-11"
                                                >
                                                    <Link
                                                        href={campusContributionsIndex(
                                                            {
                                                                institution:
                                                                    institution.id,
                                                            },
                                                        )}
                                                    >
                                                        Buka antrean validasi
                                                        <ChevronRight
                                                            aria-hidden="true"
                                                            className="size-4"
                                                        />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </section>
                                    <MembersList
                                        members={members}
                                        isPending={isPending}
                                        onPageChange={(page) =>
                                            visitOverview({
                                                ...appliedQuery,
                                                page,
                                            })
                                        }
                                    />
                                </>
                            )}
                        </div>
                        <OverviewContextRail
                            institution={institution}
                            programDistribution={programDistribution}
                            isPending={isPending}
                            isForbidden={isForbidden}
                        />
                    </div>
                </div>
            </AppPage>
        </>
    );
}

export default function CampusOverview(props: CampusOverviewProps) {
    return <CampusOverviewContent key={props.institution.id} {...props} />;
}

CampusOverview.layout = {
    breadcrumbs: [
        { title: 'Operasi kampus', href: '#' },
        { title: 'Ringkasan', href: '#' },
    ],
};
