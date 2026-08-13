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
import { useEffect, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    create as contributionsCreate,
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
    return status === 'approved' ? 'Institution-verified' : 'Self-reported';
}

function ContributionsSkeleton() {
    return (
        <div
            role="region"
            aria-busy="true"
            aria-label="Daftar contribution sedang dimuat"
            data-test="contributions-loading"
            className="grid gap-0 border-y border-border"
        >
            <p role="status" className="sr-only">
                Memuat daftar contribution.
            </p>
            <div aria-hidden="true" className="grid gap-4 px-4 py-5 md:px-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-3/5 max-w-xl" />
                <Skeleton className="h-4 w-4/5 max-w-2xl" />
            </div>
            {[1, 2, 3].map((row) => (
                <div
                    key={row}
                    aria-hidden="true"
                    className="grid gap-3 border-t border-border px-4 py-5 md:grid-cols-[minmax(0,1fr)_10rem_8rem] md:items-center md:px-6"
                >
                    <div className="grid gap-2">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-4 w-2/5" />
                    </div>
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    );
}

function EmptyContributions({ canCreate }: { canCreate: boolean }) {
    return (
        <section
            data-test="contributions-empty"
            className="grid gap-5 border-y border-border px-4 py-12 text-center md:px-8"
        >
            <FileCheck2
                aria-hidden="true"
                className="mx-auto size-9 text-primary"
            />
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

    useEffect(() => {
        const removeStart = router.on('start', () => setIsRefreshing(true));
        const removeFinish = router.on('finish', () => setIsRefreshing(false));

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    function refresh(): void {
        setRefreshError(null);
        router.reload({
            only: ['contributions', 'can_create'],
            onError: () => {
                setRefreshError(
                    'Daftar belum diperbarui. Data yang sedang terlihat tetap aman. Coba muat ulang lagi.',
                );
            },
        });
    }

    return (
        <>
            <Head title="Contribution" />
            <AppPage className="min-w-0">
                <div className="mx-auto grid max-w-7xl min-w-0 gap-8">
                    <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.35fr)] lg:items-end lg:gap-10">
                        <div className="min-w-0 space-y-3">
                            <p className="font-label text-label text-primary">
                                BUKU BESAR KONTRIBUSI / STUDENT
                            </p>
                            <h1 className="max-w-[22ch] text-headline font-bold text-balance">
                                Ubah pekerjaan nyata menjadi catatan yang dapat
                                ditinjau.
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Setiap contribution menyimpan task, evidence,
                                pernyataan, versi, dan keputusan validasi dalam
                                satu jejak yang tetap terbaca.
                            </p>
                        </div>

                        <div className="grid gap-3 border border-border bg-card/60 px-4 py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-verified"
                                />
                                <span className="font-label text-label">
                                    BATAS DATA
                                </span>
                            </div>
                            <p className="text-sm leading-6">
                                Evidence tetap private dan hanya ditampilkan
                                sesuai akses project serta validasi kampus.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                                {canCreate && (
                                    <Button asChild className="cursor-pointer">
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
                                    className="cursor-pointer"
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
                    </header>

                    {refreshError && (
                        <div
                            role="alert"
                            data-test="contributions-refresh-error"
                            className="flex items-start gap-3 border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{refreshError}</p>
                        </div>
                    )}

                    {isRefreshing ? (
                        <ContributionsSkeleton />
                    ) : contributions.length === 0 ? (
                        <EmptyContributions canCreate={canCreate} />
                    ) : (
                        <section
                            aria-labelledby="contributions-ledger-title"
                            data-test="contributions-ledger"
                            className="grid gap-0 border-y border-border"
                        >
                            <div className="grid gap-2 px-4 py-5 md:px-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-label text-label text-muted-foreground">
                                            REGISTER / {contributions.length}{' '}
                                            ITEM
                                        </p>
                                        <h2
                                            id="contributions-ledger-title"
                                            className="mt-1 text-title font-semibold"
                                        >
                                            Contribution milikmu
                                        </h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Urut dari perubahan terakhir
                                    </p>
                                </div>
                            </div>
                            <ol className="grid">
                                {contributions.map((contribution, index) => {
                                    const meta =
                                        statusMeta[contribution.status];
                                    const task =
                                        contribution.current_version?.task;

                                    return (
                                        <li
                                            key={contribution.id}
                                            className="border-t border-border"
                                        >
                                            <Link
                                                href={contributionShow(
                                                    contribution.id,
                                                )}
                                                className="grid gap-4 px-4 py-5 transition-colors duration-fast hover:bg-muted/50 md:grid-cols-[2rem_minmax(0,1fr)_12rem_9rem] md:items-center md:px-6"
                                                data-test={`contribution-row-${contribution.id}`}
                                            >
                                                <span className="font-label text-label text-muted-foreground">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-base font-semibold break-words">
                                                        {
                                                            contribution.project
                                                                .title
                                                        }
                                                    </span>
                                                    <span className="mt-1 block text-sm break-words text-muted-foreground">
                                                        {task?.title ??
                                                            'Task belum ditautkan'}
                                                    </span>
                                                </span>
                                                <span className="grid gap-1">
                                                    <span
                                                        className={cn(
                                                            'inline-flex w-fit items-center gap-2 border px-2 py-1 text-xs font-semibold',
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
                                                    <span className="text-xs text-muted-foreground">
                                                        {meta.description}
                                                    </span>
                                                </span>
                                                <span className="grid gap-1 text-sm md:text-right">
                                                    <span className="font-label text-label text-muted-foreground">
                                                        {verificationLabel(
                                                            contribution.status,
                                                        )}
                                                    </span>
                                                    <span className="text-muted-foreground">
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
