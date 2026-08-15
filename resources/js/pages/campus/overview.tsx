import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock,
    FileCheck2,
    FileSpreadsheet,
    Filter,
    FolderKanban,
    GraduationCap,
    Network,
    RotateCcw,
    Shield,
    ShieldCheck,
    UserRound,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
import { index as campusInclusionIndex } from '@/routes/campus/inclusion';
import { show as campusOverview } from '@/routes/campus/overview';
import { show as campusRoster } from '@/routes/campus/roster';

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

interface ProgramDistributionItem {
    program: string;
    count: number;
}

interface MemberItem {
    id: number;
    username: string;
    role: string;
    status: string;
    program: string | null;
    createdAt: string | null;
}

interface PaginatedMembers {
    items: MemberItem[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface CampusOverviewProps {
    institution: {
        id: number;
        name: string;
    };
    metrics: OverviewMetrics;
    programDistribution: ProgramDistributionItem[];
    members: PaginatedMembers;
    filters: {
        date_from: string | null;
        date_to: string | null;
        program: string | null;
    };
}

function roleLabel(role: string): string {
    switch (role) {
        case 'campus_admin':
            return 'Operator Kampus';
        case 'student':
            return 'Mahasiswa';
        default:
            return role.replaceAll('_', ' ');
    }
}

function statusBadge(status: string) {
    switch (status) {
        case 'verified':
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Terverifikasi
                </span>
            );
        case 'pending':
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    <Clock className="size-3 text-amber-600" />
                    Menunggu tinjauan
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    Belum terverifikasi
                </span>
            );
    }
}

function CampusOverviewContextRail({
    institution,
}: {
    institution: { id: number; name: string };
}) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Identitas Operasi Kampus */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Building2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        OPERASI KAMPUS
                    </p>
                </div>

                <h2 className="mt-3 text-base font-bold tracking-tight text-slate-950">
                    {institution.name}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Ruang kerja terpadu operator untuk mengelola verifikasi
                    afiliasi, validasi kontribusi, dan roster mahasiswa.
                </p>
            </div>

            {/* Card 2: Akses Cepat Modul */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    MODUL OPERASIONAL
                </p>

                <div className="mt-3.5 grid gap-2">
                    <Link
                        href={affiliationIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <ClipboardCheck className="size-4 text-blue-600" />
                            <span>Afiliasi & Verifikasi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>

                    <Link
                        href={campusRoster({ institution: institution.id })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <FileSpreadsheet className="size-4 text-emerald-600" />
                            <span>Roster Mahasiswa</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>

                    <Link
                        href={campusContributionsIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <FileCheck2 className="size-4 text-indigo-600" />
                            <span>Validasi Kontribusi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>

                    <Link
                        href={campusInclusionIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <Network className="size-4 text-violet-600" />
                            <span>Peninjauan Inklusi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>
                </div>
            </div>

            {/* Card 3: Integritas Ledger */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-blue-600" />
                    <div>
                        <p className="text-xs font-bold text-blue-900">
                            Buku Besar Terverifikasi
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                            Setiap persetujuan afiliasi dan validasi tugas
                            tercatat pada ledger institusi dengan audit trail
                            lengkap.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CampusOverview({
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

    const visitOverview = (page?: number) => {
        setIsPending(true);
        router.get(
            campusOverview({ institution: institution.id }),
            {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                program: program || undefined,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsPending(false),
            },
        );
    };

    const handleFilterSubmit = (event: FormEvent) => {
        event.preventDefault();
        visitOverview();
    };

    const handleResetFilter = () => {
        setDateFrom('');
        setDateTo('');
        setProgram('');
        setIsPending(true);
        router.get(
            campusOverview({ institution: institution.id }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsPending(false),
            },
        );
    };

    const handlePageChange = (newPage: number) => {
        visitOverview(newPage);
    };

    const hasActiveFilters = Boolean(dateFrom || dateTo || program);

    return (
        <>
            <Head title={`Ringkasan Operasional - ${institution.name}`} />

            <AppPage
                contextRail={
                    <CampusOverviewContextRail institution={institution} />
                }
                contextRailLabel="Konteks Operasi Kampus"
            >
                <div className="space-y-6" data-test="campus-overview-root">
                    {/* Header Banner */}
                    <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-[0_18px_50px_-36px_rgba(30,64,175,0.35)] sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-80 rounded-full bg-blue-100/75 blur-3xl sm:-right-12"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute right-14 bottom-0 hidden h-24 w-24 rounded-tl-[2.5rem] border-t border-l border-indigo-100 sm:block"
                        />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    <Shield className="size-3 text-blue-600" />
                                    Operasi Kampus
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Ringkasan Operasional Kampus
                                </h1>

                                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
                                    Pantau beban kerja verifikasi mahasiswa,
                                    proyek kolaborasi aktif, serta distribusi
                                    partisipasi akademik di{' '}
                                    <span className="font-semibold text-slate-900">
                                        {institution.name}
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-800">
                                <Building2 className="size-4 text-blue-600" />
                                <span>{institution.name}</span>
                            </div>
                        </div>
                    </header>

                    {/* Filter Card */}
                    <form
                        onSubmit={handleFilterSubmit}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                    >
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="grid flex-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="campus-overview-date-from"
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                                    >
                                        <Calendar className="size-3.5 text-slate-500" />
                                        Tanggal Mulai
                                    </label>
                                    <input
                                        id="campus-overview-date-from"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) =>
                                            setDateFrom(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="campus-overview-date-to"
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                                    >
                                        <Calendar className="size-3.5 text-slate-500" />
                                        Tanggal Selesai
                                    </label>
                                    <input
                                        id="campus-overview-date-to"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) =>
                                            setDateTo(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="campus-overview-program"
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                                    >
                                        <GraduationCap className="size-3.5 text-slate-500" />
                                        Program Studi
                                    </label>
                                    <input
                                        id="campus-overview-program"
                                        type="text"
                                        placeholder="Contoh: Teknik Informatika"
                                        value={program}
                                        onChange={(e) =>
                                            setProgram(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    disabled={isPending}
                                    type="submit"
                                    className="h-10 cursor-pointer rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                                >
                                    <Filter className="mr-1.5 size-3.5" />
                                    Terapkan Filter
                                </Button>

                                {hasActiveFilters && (
                                    <Button
                                        disabled={isPending}
                                        onClick={handleResetFilter}
                                        type="button"
                                        variant="outline"
                                        className="h-10 cursor-pointer rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        <RotateCcw className="mr-1.5 size-3.5" />
                                        Atur Ulang
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Metric Bento Cards (4 Cards Grid) */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Keanggotaan Mahasiswa */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-blue-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Keanggotaan Mahasiswa
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Users className="size-4" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-bold tracking-tight text-slate-950">
                                    {metrics.memberships.total}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-800">
                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                    {metrics.memberships.verified} Terverifikasi
                                </span>
                            </div>
                            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>
                                    Menunggu:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {metrics.memberships.pending}
                                    </strong>
                                </span>
                                <span>
                                    Belum aktif:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {metrics.memberships.unverified}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {/* 2. Total Proyek */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Proyek Kolaborasi
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <FolderKanban className="size-4" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-bold tracking-tight text-slate-950">
                                    {metrics.projects.total}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-indigo-800">
                                    {metrics.projects.active} Aktif
                                </span>
                            </div>
                            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>
                                    Selesai:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {metrics.projects.completed}
                                    </strong>
                                </span>
                                <span>
                                    Draft:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {metrics.projects.draft}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {/* 3. Validasi Kontribusi */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Validasi Kontribusi
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Award className="size-4" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-bold tracking-tight text-slate-950">
                                    {metrics.contributions.total}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-800">
                                    {metrics.contributions.validated} Valid
                                </span>
                            </div>
                            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>
                                    Menunggu:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {metrics.contributions.pending}
                                    </strong>
                                </span>
                                <span>
                                    Revisi:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {
                                            metrics.contributions
                                                .revision_required
                                        }
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {/* 4. Rata-rata Turnaround SLA */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-amber-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Turnaround SLA Tinjauan
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <Clock className="size-4" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-bold tracking-tight text-slate-950">
                                    {metrics.review_turnaround.average_hours}
                                    <span className="text-sm font-normal text-slate-500">
                                        {' '}
                                        jam
                                    </span>
                                </span>
                                <span className="text-xs font-semibold text-slate-600">
                                    {metrics.review_turnaround.total_reviewed}{' '}
                                    Ditinjau
                                </span>
                            </div>
                            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>
                                    Setuju:{' '}
                                    <strong className="font-semibold text-emerald-700">
                                        {
                                            metrics.review_turnaround
                                                .approved_count
                                        }
                                    </strong>
                                </span>
                                <span>
                                    Revisi/Tolak:{' '}
                                    <strong className="font-semibold text-slate-700">
                                        {metrics.review_turnaround
                                            .revision_count +
                                            metrics.review_turnaround
                                                .rejected_count}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Data Grid: Distribusi Prodi & Direktori Anggota */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Distribusi Program Studi */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="size-4.5 text-blue-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Distribusi Program Studi
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Jumlah mahasiswa terdaftar per program studi
                            </p>

                            <div className="mt-6" aria-busy={isPending}>
                                {programDistribution.length === 0 ? (
                                    <div className="grid justify-items-center gap-2 py-10 text-center">
                                        <GraduationCap className="size-8 text-slate-300" />
                                        <p className="text-xs text-slate-500">
                                            Belum ada data distribusi prodi
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {programDistribution.map((item) => {
                                            const total =
                                                metrics.memberships.total || 1;
                                            const pct = Math.min(
                                                100,
                                                Math.round(
                                                    (item.count / total) * 100,
                                                ),
                                            );

                                            return (
                                                <div
                                                    key={item.program}
                                                    className="space-y-1.5"
                                                >
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-slate-800">
                                                            {item.program}
                                                        </span>
                                                        <span className="font-mono text-slate-500">
                                                            {item.count}{' '}
                                                            mahasiswa ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                                            style={{
                                                                width: `${pct}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Direktori Anggota Kampus */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Users className="size-4.5 text-blue-600" />
                                        <h2 className="text-base font-bold text-slate-900">
                                            Daftar Anggota Kampus
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Mahasiswa dan operator terdaftar di{' '}
                                        {institution.name}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                    Total: {members.pagination.total}
                                </span>
                            </div>

                            <div
                                className="mt-5 overflow-x-auto"
                                aria-busy={isPending}
                                tabIndex={0}
                            >
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-600">
                                            <th className="px-4 py-3 font-semibold">
                                                Pengguna
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Program Studi
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Peran
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {isPending ? (
                                            Array.from({ length: 4 }).map(
                                                (_, i) => (
                                                    <tr key={`skeleton-${i}`}>
                                                        <td className="px-4 py-3.5">
                                                            <Skeleton className="h-4 w-28" />
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <Skeleton className="h-4 w-36" />
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <Skeleton className="h-4 w-20" />
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <Skeleton className="h-4 w-24 rounded-full" />
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : members.items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-10 text-center text-xs text-slate-500"
                                                >
                                                    Tidak ada data anggota
                                                    ditemukan
                                                </td>
                                            </tr>
                                        ) : (
                                            members.items.map((m) => (
                                                <tr
                                                    key={m.id}
                                                    className="transition-colors hover:bg-slate-50/60"
                                                >
                                                    <td className="px-4 py-3.5 font-bold text-slate-900">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                                <UserRound className="size-3.5" />
                                                            </div>
                                                            <span>
                                                                @{m.username}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-medium text-slate-600">
                                                        {m.program || '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {roleLabel(m.role)}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {statusBadge(m.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {members.pagination.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
                                    <span>
                                        Halaman{' '}
                                        {members.pagination.current_page} dari{' '}
                                        {members.pagination.last_page}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            disabled={
                                                members.pagination
                                                    .current_page <= 1 ||
                                                isPending
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    members.pagination
                                                        .current_page - 1,
                                                )
                                            }
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                            className="h-8 cursor-pointer rounded-lg text-xs"
                                        >
                                            <ChevronLeft className="mr-1 size-3" />
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            disabled={
                                                members.pagination
                                                    .current_page >=
                                                    members.pagination
                                                        .last_page || isPending
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    members.pagination
                                                        .current_page + 1,
                                                )
                                            }
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                            className="h-8 cursor-pointer rounded-lg text-xs"
                                        >
                                            Berikutnya
                                            <ChevronRight className="ml-1 size-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppPage>
        </>
    );
}

CampusOverview.layout = {
    breadcrumbs: [
        {
            title: 'Operasi Kampus',
            href: '#',
        },
        {
            title: 'Ringkasan',
            href: '#',
        },
    ],
};
