import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Award,
    Calendar,
    Clock,
    Filter,
    FolderKanban,
    GraduationCap,
    Shield,
    Users,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

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
    const [isPending, startTransition] = useTransition();

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(() => {
            router.get(
                `/campus/${institution.id}/overview`,
                {
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    program: program || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        });
    };

    const handlePageChange = (newPage: number) => {
        startTransition(() => {
            router.get(
                `/campus/${institution.id}/overview`,
                {
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    program: program || undefined,
                    page: newPage,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        });
    };

    return (
        <AppLayout>
            <Head title={`Ringkasan Operasional - ${institution.name}`} />

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="border-b border-border pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                <Shield className="size-4" />
                                <span>Operasi Kampus</span>
                            </div>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                Ringkasan Operasional Kampus
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Laporan beban kerja verifikasi, proyek aktif,
                                dan distribusi partisipasi mahasiswa di{' '}
                                <span className="font-semibold">
                                    {institution.name}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Form */}
                <form
                    onSubmit={handleFilterSubmit}
                    className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-xs"
                >
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                        <div className="space-y-1">
                            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Calendar className="size-3.5" /> Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Calendar className="size-3.5" /> Tanggal
                                Selesai
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div className="min-w-[200px] space-y-1">
                            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <GraduationCap className="size-3.5" /> Program
                                Studi
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Teknik Informatika"
                                value={program}
                                onChange={(e) => setProgram(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                    >
                        <Filter className="size-4" />
                        <span>Filter</span>
                    </button>
                </form>

                {/* Metric Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Membership Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Keanggotaan Mahasiswa
                            </span>
                            <Users className="size-5 text-blue-500" />
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-bold tracking-tight">
                                {metrics.memberships.total}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                                {metrics.memberships.verified} Terverifikasi
                            </span>
                        </div>
                        <div className="mt-4 flex justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                            <span>Pending: {metrics.memberships.pending}</span>
                            <span>
                                Unverified: {metrics.memberships.unverified}
                            </span>
                        </div>
                    </div>

                    {/* Project Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Total Proyek
                            </span>
                            <FolderKanban className="size-5 text-indigo-500" />
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-bold tracking-tight">
                                {metrics.projects.total}
                            </span>
                            <span className="text-xs font-semibold text-indigo-600">
                                {metrics.projects.active} Aktif
                            </span>
                        </div>
                        <div className="mt-4 flex justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                            <span>Selesai: {metrics.projects.completed}</span>
                            <span>Draft: {metrics.projects.draft}</span>
                        </div>
                    </div>

                    {/* Turnaround Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Rata-rata Turnaround SLA
                            </span>
                            <Clock className="size-5 text-amber-500" />
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-bold tracking-tight">
                                {metrics.review_turnaround.average_hours}
                                <span className="text-sm font-normal text-muted-foreground">
                                    {' '}
                                    jam
                                </span>
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {metrics.review_turnaround.total_reviewed}{' '}
                                Ditinjau
                            </span>
                        </div>
                        <div className="mt-4 flex justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                            <span>
                                Setuju:{' '}
                                {metrics.review_turnaround.approved_count}
                            </span>
                            <span>
                                Tolak:{' '}
                                {metrics.review_turnaround.rejected_count}
                            </span>
                        </div>
                    </div>

                    {/* Contribution Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Validasi Kontribusi
                            </span>
                            <Award className="size-5 text-emerald-500" />
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-bold tracking-tight">
                                {metrics.contributions.total}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                                {metrics.contributions.validated} Valid
                            </span>
                        </div>
                        <div className="mt-4 flex justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                            <span>
                                Pending: {metrics.contributions.pending}
                            </span>
                            <span>
                                Revisi:{' '}
                                {metrics.contributions.revision_required}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Data Grid: Program Distribution & Member List */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Program Distribution */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <h2 className="text-lg font-bold tracking-tight text-foreground">
                            Distribusi Program Studi
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Jumlah mahasiswa terdaftar per program studi
                        </p>

                        <div className="mt-6" aria-busy={isPending}>
                            {isPending && (
                                <div className="sr-only" role="status">
                                    Memuat distribusi program studi...
                                </div>
                            )}
                            {programDistribution.length === 0 ? (
                                <p className="py-8 text-center text-xs text-muted-foreground">
                                    Belum ada data distribusi program studi
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {programDistribution.map((item) => (
                                        <div
                                            key={item.program}
                                            className="space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">
                                                    {item.program}
                                                </span>
                                                <span className="font-semibold text-muted-foreground">
                                                    {item.count} mahasiswa
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (item.count /
                                                                (metrics
                                                                    .memberships
                                                                    .total ||
                                                                    1)) *
                                                                100,
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Member Directory */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-foreground">
                                    Daftar Anggota Kampus
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Mahasiswa dan operator terdaftar di kampus
                                    ini
                                </p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                Total: {members.pagination.total}
                            </span>
                        </div>

                        <div
                            className="mt-6 overflow-x-auto"
                            aria-busy={isPending}
                        >
                            {isPending && (
                                <div className="sr-only" role="status">
                                    Memuat daftar anggota kampus...
                                </div>
                            )}
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold">
                                            Pengguna
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Prodi
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Peran
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {isPending ? (
                                        Array.from({ length: 5 }).map(
                                            (_, i) => (
                                                <tr key={`skeleton-${i}`}>
                                                    <td className="px-4 py-3">
                                                        <Skeleton className="h-4 w-24" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Skeleton className="h-4 w-32" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Skeleton className="h-4 w-16" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Skeleton className="h-4 w-20 rounded-full" />
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    ) : members.items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-8 text-center text-xs text-muted-foreground"
                                            >
                                                Tidak ada data mahasiswa
                                                ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        members.items.map((m) => (
                                            <tr
                                                key={m.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    @{m.username}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {m.program || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground capitalize">
                                                    {m.role}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            m.status ===
                                                            'verified'
                                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                                : m.status ===
                                                                    'pending'
                                                                  ? 'bg-amber-500/10 text-amber-600'
                                                                  : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        {members.pagination.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                                <span>
                                    Halaman {members.pagination.current_page}{' '}
                                    dari {members.pagination.last_page}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={
                                            members.pagination.current_page ===
                                                1 || isPending
                                        }
                                        onClick={() =>
                                            handlePageChange(
                                                members.pagination
                                                    .current_page - 1,
                                            )
                                        }
                                        className="rounded-md border border-input px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            members.pagination.current_page ===
                                                members.pagination.last_page ||
                                            isPending
                                        }
                                        onClick={() =>
                                            handlePageChange(
                                                members.pagination
                                                    .current_page + 1,
                                            )
                                        }
                                        className="rounded-md border border-input px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                                    >
                                        Berikutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
