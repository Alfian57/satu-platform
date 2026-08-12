import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    FolderKanban,
    GraduationCap,
    Shield,
    Users,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';

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
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="size-3.5" /> Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="size-3.5" /> Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <GraduationCap className="size-3.5" /> Program Studi
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Teknik Informatika"
                                value={program}
                                onChange={(e) => setProgram(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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
                        <div className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground flex justify-between">
                            <span>Pending: {metrics.memberships.pending}</span>
                            <span>Unverified: {metrics.memberships.unverified}</span>
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
                        <div className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground flex justify-between">
                            <span>Selesai: {metrics.projects.completed}</span>
                            <span>Draft: {metrics.projects.draft}</span>
                        </div>
                    </div>

                    {/* Contribution Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Kontribusi
                            </span>
                            <Award className="size-5 text-emerald-500" />
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-bold tracking-tight">
                                {metrics.contributions.total}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                                {metrics.contributions.validated} Divalidasi
                            </span>
                        </div>
                        <div className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground flex justify-between">
                            <span>Pending: {metrics.contributions.pending}</span>
                            <span>Revisi: {metrics.contributions.revision_required}</span>
                        </div>
                    </div>

                    {/* Review Turnaround Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Rata-rata Review SLA
                            </span>
                            <Clock className="size-5 text-amber-500" />
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-bold tracking-tight">
                                {metrics.review_turnaround.average_hours}h
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                                {metrics.review_turnaround.total_reviewed} Ditinjau
                            </span>
                        </div>
                        <div className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground flex justify-between">
                            <span>Disetujui: {metrics.review_turnaround.approved_count}</span>
                            <span>Ditolak: {metrics.review_turnaround.rejected_count}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid: Program Distribution & Member Drilldown */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Program Distribution Table */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-1">
                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Activity className="size-4 text-primary" />
                            Distribusi Program Studi
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Jumlah mahasiswa per prodi
                        </p>

                        <div className="mt-4 divide-y divide-border">
                            {programDistribution.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground">
                                    Belum ada data program studi
                                </div>
                            ) : (
                                programDistribution.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between py-3 text-sm"
                                    >
                                        <span className="font-medium text-foreground truncate max-w-[180px]">
                                            {item.program}
                                        </span>
                                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                            {item.count}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Member Drill-down Table */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Daftar Keanggotaan Mahasiswa
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Detail {members.pagination.total} mahasiswa terdaftar
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Username</th>
                                        <th className="px-4 py-3">Program Studi</th>
                                        <th className="px-4 py-3">Peran</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {members.items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-8 text-center text-xs text-muted-foreground"
                                            >
                                                Tidak ada data mahasiswa ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        members.items.map((m) => (
                                            <tr key={m.id} className="hover:bg-muted/30">
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
                                                            m.status === 'verified'
                                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                                : m.status === 'pending'
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
                                    Halaman {members.pagination.current_page} dari{' '}
                                    {members.pagination.last_page}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={members.pagination.current_page === 1 || isPending}
                                        onClick={() =>
                                            handlePageChange(members.pagination.current_page - 1)
                                        }
                                        className="rounded-md border border-input px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            members.pagination.current_page === members.pagination.last_page ||
                                            isPending
                                        }
                                        onClick={() =>
                                            handlePageChange(members.pagination.current_page + 1)
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
