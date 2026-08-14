import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleAlert,
    CircleDot,
    Clock3,
    FileCheck2,
    Plus,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    create as contributionsCreate,
    index as contributionsIndex,
    show as contributionShow,
} from '@/routes/contributions';
import type {
    ContributionStatus,
    ContributionSummary,
} from '@/types/contribution';

type ContributionsIndexProps = {
    contributions: ContributionSummary[];
    can_create: boolean;
};

const statusMeta: Record<
    ContributionStatus,
    { label: string; description: string; className: string }
> = {
    draft: {
        label: 'Draft',
        description: 'Belum dikirim untuk validasi.',
        className: 'border-border bg-muted text-muted-foreground',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Sedang menunggu tinjauan kampus.',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Ada catatan reviewer yang perlu ditanggapi.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    },
    approved: {
        label: 'Tervalidasi',
        description: 'Versi ini sudah divalidasi oleh kampus.',
        className:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    },
    rejected: {
        label: 'Ditolak',
        description: 'Keputusan validasi tersimpan di riwayat.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    },
    archived: {
        label: 'Diarsipkan',
        description: 'Tidak menerima perubahan baru.',
        className: 'border-border bg-muted text-muted-foreground',
    },
};

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeZone: 'UTC',
    }).format(date);
}

function verificationLabel(status: ContributionStatus): string {
    return status === 'approved'
        ? 'Terverifikasi kampus'
        : 'Dilaporkan sendiri';
}

function ContributionsRefreshState() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            data-test="contributions-loading"
            className="grid gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 md:px-6"
        >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                />
                <span>
                    Menyegarkan daftar tanpa menghapus data yang terlihat.
                </span>
            </div>
            <div
                aria-hidden="true"
                className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_9rem] md:items-center"
            >
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}

function EmptyContributions({ canCreate }: { canCreate: boolean }) {
    return (
        <section
            data-test="contributions-empty"
            className="grid justify-items-center gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-[0_14px_32px_-30px_rgba(30,64,175,0.34)] md:px-8"
        >
            <span className="grid size-12 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <FileCheck2 aria-hidden="true" className="size-6" />
            </span>
            <div className="grid gap-2">
                <h2 className="text-title font-semibold">
                    Belum ada contribution
                </h2>
                <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                    Catat pekerjaan nyata dari project dan tautkan evidence
                    private agar provenance-nya dapat ditinjau.
                </p>
            </div>
            {canCreate ? (
                <Button asChild className="mx-auto w-fit cursor-pointer">
                    <Link
                        href={contributionsCreate()}
                        data-test="create-contribution-link"
                    >
                        <Plus aria-hidden="true" />
                        Susun contribution pertama
                    </Link>
                </Button>
            ) : (
                <p className="mx-auto max-w-[56ch] border border-pending/30 bg-pending-subtle px-4 py-3 text-sm leading-6 text-pending-subtle-foreground">
                    Kamu belum memiliki project aktif yang dapat menerima
                    contribution. Gabung ke project terlebih dahulu.
                </p>
            )}
        </section>
    );
}

export default function ContributionsIndex({
    contributions,
    can_create: canCreate,
}: ContributionsIndexProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    function refresh(): void {
        setRefreshError(null);
        setIsRefreshing(true);

        router.reload({
            only: ['contributions', 'can_create'],
            onSuccess: () => setRefreshError(null),
            onError: () => {
                setRefreshError(
                    'Daftar belum diperbarui. Data yang sedang terlihat tetap aman. Coba muat ulang lagi.',
                );
            },
            onHttpException: () => {
                setRefreshError(
                    'Daftar belum diperbarui. Data yang sedang terlihat tetap aman. Coba muat ulang lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setRefreshError(
                    'Daftar belum diperbarui. Data yang sedang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setIsRefreshing(false),
        });
    }

    return (
        <>
            <Head title="Contribution" />
            <AppPage className="min-w-0">
                <div
                    className="mx-auto grid max-w-7xl min-w-0 gap-6"
                    data-test="contributions-root"
                >
                    <header
                        className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-5 py-6 shadow-[0_18px_50px_-40px_rgba(30,64,175,0.42)] sm:px-7 sm:py-7"
                        data-test="contributions-header"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute -top-24 -right-20 size-72 rounded-full bg-blue-100/70 blur-3xl"
                        />
                        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.48fr)] lg:items-stretch lg:gap-10">
                            <div className="min-w-0">
                                <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">
                                    <span className="size-1.5 rounded-full bg-blue-600" />
                                    Buku besar kontribusi
                                </p>
                                <h1 className="mt-4 max-w-[22ch] text-headline font-bold tracking-[-0.035em] text-balance text-slate-950">
                                    Ubah pekerjaan nyata menjadi catatan yang
                                    dapat ditinjau.
                                </h1>
                                <p className="mt-3 max-w-[66ch] text-sm leading-6 text-slate-600">
                                    Setiap contribution menyimpan task,
                                    evidence, pernyataan, versi, dan keputusan
                                    validasi dalam satu jejak yang terbaca.
                                </p>
                            </div>

                            <div className="flex flex-col justify-end border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-slate-500 uppercase">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-verified"
                                    />
                                    Ruang terlindungi
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Evidence tetap private dan hanya tampil
                                    sesuai akses project serta validasi kampus.
                                </p>
                                <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col">
                                    {canCreate && (
                                        <Button
                                            asChild
                                            className="w-full self-start lg:w-auto"
                                        >
                                            <Link
                                                href={contributionsCreate()}
                                                data-test="create-contribution-link"
                                            >
                                                <Plus aria-hidden="true" />
                                                Susun contribution
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full self-start border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 lg:w-auto"
                                        onClick={refresh}
                                        disabled={isRefreshing}
                                        data-test="contributions-refresh"
                                    >
                                        <RefreshCw
                                            aria-hidden="true"
                                            className={cn(
                                                isRefreshing &&
                                                    'animate-spin motion-reduce:animate-none',
                                            )}
                                        />
                                        Segarkan daftar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {refreshError && (
                        <div
                            role="alert"
                            data-test="contributions-refresh-error"
                            className="flex items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{refreshError}</p>
                        </div>
                    )}

                    {contributions.length === 0 ? (
                        <div
                            aria-busy={isRefreshing}
                            data-test="contributions-state"
                        >
                            {isRefreshing && <ContributionsRefreshState />}
                            <EmptyContributions canCreate={canCreate} />
                        </div>
                    ) : (
                        <section
                            aria-labelledby="contributions-ledger-title"
                            aria-busy={isRefreshing}
                            data-test="contributions-ledger"
                            className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_32px_-30px_rgba(30,64,175,0.34)]"
                        >
                            <div className="grid gap-2 px-5 py-5 sm:px-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
                                            Register kontribusi /{' '}
                                            {contributions.length} item
                                        </p>
                                        <h2
                                            id="contributions-ledger-title"
                                            className="mt-1 text-title font-bold tracking-[-0.02em] text-slate-950"
                                        >
                                            Contribution milikmu
                                        </h2>
                                    </div>
                                    <p className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800">
                                        Urut dari perubahan terakhir
                                    </p>
                                </div>
                            </div>
                            {isRefreshing && <ContributionsRefreshState />}
                            <ol className="grid">
                                {contributions.map((contribution) => {
                                    const meta =
                                        statusMeta[contribution.status];
                                    const task =
                                        contribution.current_version?.task;

                                    return (
                                        <li
                                            key={contribution.id}
                                            className="border-t border-slate-100"
                                        >
                                            <Link
                                                href={contributionShow(
                                                    contribution.id,
                                                )}
                                                className="grid cursor-pointer gap-4 px-5 py-5 transition-colors duration-fast hover:bg-slate-50/70 sm:px-6 md:grid-cols-[minmax(0,1fr)_12rem_10rem] md:items-center"
                                                data-test={`contribution-row-${contribution.id}`}
                                            >
                                                <span className="min-w-0">
                                                    <span className="block text-base font-bold tracking-[-0.015em] break-words text-slate-950">
                                                        {
                                                            contribution.project
                                                                .title
                                                        }
                                                    </span>
                                                    <span className="mt-1 block text-sm break-words text-slate-600">
                                                        {task?.title ??
                                                            'Task belum ditautkan'}
                                                    </span>
                                                </span>
                                                <span className="grid gap-1">
                                                    <span
                                                        className={cn(
                                                            'inline-flex w-fit items-center gap-2 rounded-lg border px-2 py-1 text-xs font-semibold',
                                                            meta.className,
                                                        )}
                                                    >
                                                        {contribution.status ===
                                                        'approved' ? (
                                                            <CheckCircle2
                                                                aria-hidden="true"
                                                                className="size-3"
                                                            />
                                                        ) : contribution.status ===
                                                          'pending' ? (
                                                            <Clock3
                                                                aria-hidden="true"
                                                                className="size-3"
                                                            />
                                                        ) : contribution.status ===
                                                          'revision' ? (
                                                            <CircleAlert
                                                                aria-hidden="true"
                                                                className="size-3"
                                                            />
                                                        ) : (
                                                            <CircleDot
                                                                aria-hidden="true"
                                                                className="size-3"
                                                            />
                                                        )}
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-xs leading-5 text-slate-500">
                                                        {meta.description}
                                                    </span>
                                                </span>
                                                <span className="grid gap-1 text-sm md:border-l md:border-slate-100 md:pl-5 md:text-right">
                                                    <span className="text-xs font-bold tracking-[0.11em] text-slate-500 uppercase">
                                                        {verificationLabel(
                                                            contribution.status,
                                                        )}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        {formatDate(
                                                            contribution.updated_at,
                                                        )}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    )}
                </div>
            </AppPage>
        </>
    );
}

ContributionsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Contribution',
            href: contributionsIndex(),
        },
    ],
};
