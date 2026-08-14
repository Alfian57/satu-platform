import { Deferred, Head, Link, router, useHttp } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownToLine,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDot,
    ClipboardCheck,
    Clock3,
    Eye,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    FileWarning,
    History,
    Lock,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    UserRoundCheck,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { AppPage } from '@/components/app-page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
import { show as campusRoster } from '@/routes/campus/roster';
import {
    download as downloadAttachment,
    preview as previewAttachment,
} from '@/routes/projects/workspace/attachments';
import type {
    ContributionApiResponse,
    ContributionReview,
    ContributionReviewQueueItem,
    ContributionStatus,
} from '@/types/contribution';

type ReviewDecision = 'approved' | 'revision' | 'rejected';

type ReviewFilters = {
    status: ContributionStatus | 'all';
    sort: 'oldest' | 'newest';
};

type ReviewQueue = {
    items: ContributionReviewQueueItem[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    summary: {
        total: number;
        pending: number;
        approved: number;
        revision: number;
        rejected: number;
    };
};

type Props = {
    institution: {
        id: number;
        name: string;
    };
    filters: ReviewFilters;
    reviewQueue?: ReviewQueue;
};

type ReviewPayload = {
    decision: ReviewDecision;
    expected_version: number;
    reason: string | null;
    note: string | null;
};

type ErrorMap = Record<string, unknown>;

const statusMeta: Record<
    ContributionStatus,
    { label: string; description: string; className: string }
> = {
    draft: {
        label: 'Draft',
        description: 'Belum dikirim untuk validasi.',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Menunggu keputusan reviewer kampus.',
        className: 'border-amber-200/80 bg-amber-50 text-amber-800',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Pemilik menerima catatan untuk membuat versi baru.',
        className: 'border-rose-200/80 bg-rose-50 text-rose-800',
    },
    approved: {
        label: 'Tervalidasi',
        description: 'Keputusan validasi tersimpan di ledger.',
        className: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
    },
    rejected: {
        label: 'Ditolak',
        description: 'Keputusan penolakan tersimpan di riwayat.',
        className: 'border-rose-200/80 bg-rose-50 text-rose-800',
    },
    archived: {
        label: 'Diarsipkan',
        description: 'Kontribusi tidak menerima keputusan baru.',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
    },
};

const decisionMeta: Record<
    ReviewDecision,
    { label: string; description: string; className: string }
> = {
    approved: {
        label: 'Setujui Kontribusi',
        description: 'Kontribusi valid dan dapat menjadi capaian portfolio.',
        className:
            'border-emerald-200 bg-emerald-50/40 text-emerald-950 hover:bg-emerald-50',
    },
    revision: {
        label: 'Minta Perbaikan',
        description:
            'Mahasiswa perlu membuat versi baru berdasarkan catatan reviewer.',
        className:
            'border-amber-200 bg-amber-50/40 text-amber-950 hover:bg-amber-50',
    },
    rejected: {
        label: 'Tolak Kontribusi',
        description: 'Tolak kontribusi dengan alasan tertulis faktual.',
        className:
            'border-rose-200 bg-rose-50/40 text-rose-950 hover:bg-rose-50',
    },
};

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }).format(date);
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function firstError(errors: ErrorMap, field: string): string | undefined {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

function StatusMark({ status }: { status: ContributionStatus }) {
    if (status === 'approved') {
        return <CheckCircle2 aria-hidden="true" className="size-3.5" />;
    }

    if (status === 'pending') {
        return <Clock3 aria-hidden="true" className="size-3.5" />;
    }

    if (status === 'revision' || status === 'rejected') {
        return <AlertTriangle aria-hidden="true" className="size-3.5" />;
    }

    return <CircleDot aria-hidden="true" className="size-3.5" />;
}

function StatusChip({ status }: { status: ContributionStatus }) {
    const meta = statusMeta[status];

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                meta.className,
            )}
        >
            <StatusMark status={status} />
            {meta.label}
        </span>
    );
}

function QueueSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Antrean validasi contribution sedang dimuat"
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
            data-test="campus-contribution-queue-loading"
        >
            <p className="sr-only" role="status">
                Memuat antrean validasi contribution.
            </p>
            {Array.from({ length: 5 }, (_, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="grid min-h-24 gap-4 border-b border-slate-100 p-6 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem] sm:items-center"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-xl bg-slate-100" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-slate-100" />
                            <Skeleton className="h-3 w-48 bg-slate-100" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 bg-slate-100" />
                        <Skeleton className="h-3 w-36 bg-slate-100" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
                </div>
            ))}
        </div>
    );
}

function QueueRefreshState() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs font-semibold text-blue-800"
            data-test="campus-contribution-queue-refreshing"
        >
            <RefreshCw
                aria-hidden="true"
                className="size-4 animate-spin text-blue-600 motion-reduce:animate-none"
            />
            <span>
                Menyegarkan antrean tanpa menghapus contribution yang sedang
                terlihat.
            </span>
        </div>
    );
}

function SummaryRail({
    reviewQueue,
    institution,
}: {
    reviewQueue: ReviewQueue;
    institution: Props['institution'];
}) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Ringkasan Antrean */}
            <section
                aria-labelledby="contribution-review-summary-title"
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileCheck2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        RINGKASAN VALIDASI
                    </p>
                </div>

                <h2
                    id="contribution-review-summary-title"
                    className="mt-3 text-base font-bold tracking-tight text-slate-950"
                >
                    {reviewQueue.summary.pending} Menunggu Keputusan
                </h2>

                <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-slate-600">Menunggu validasi</dt>
                        <dd className="font-mono font-bold text-amber-700">
                            {reviewQueue.summary.pending}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-slate-600">Sudah tervalidasi</dt>
                        <dd className="font-mono font-bold text-emerald-700">
                            {reviewQueue.summary.approved}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-slate-600">Perlu diperbaiki</dt>
                        <dd className="font-mono font-bold text-rose-700">
                            {reviewQueue.summary.revision}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-slate-600">Ditolak</dt>
                        <dd className="font-mono font-bold text-slate-700">
                            {reviewQueue.summary.rejected}
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Card 2: Batas Privasi & Keputusan */}
            <section
                aria-labelledby="review-boundary-title"
                className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5"
            >
                <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 size-4.5 shrink-0 text-blue-600" />
                    <div>
                        <h2
                            id="review-boundary-title"
                            className="text-xs font-bold text-blue-900"
                        >
                            Batas Keputusan & Audit
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                            Evidence yang dibuka tetap private. Setiap keputusan
                            menyimpan reviewer, alasan, waktu, dan policy
                            version dalam riwayat ledger yang tidak dapat
                            ditimpa.
                        </p>
                    </div>
                </div>
            </section>

            {/* Card 3: Akses Cepat */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
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
                            <span>Review Afiliasi</span>
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
                </div>
            </section>
        </div>
    );
}

function ReviewHistory({ reviews }: { reviews: ContributionReview[] }) {
    if (reviews.length === 0) {
        return (
            <p className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
                Belum ada keputusan reviewer pada contribution ini.
            </p>
        );
    }

    return (
        <ol className="space-y-3">
            {reviews
                .slice()
                .reverse()
                .map((review) => (
                    <li
                        key={review.id}
                        className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <StatusChip
                                status={
                                    review.decision === 'approved'
                                        ? 'approved'
                                        : review.decision
                                }
                            />
                            <time
                                dateTime={review.reviewed_at}
                                className="font-mono text-[0.6875rem] text-slate-400"
                            >
                                {formatDate(review.reviewed_at)}
                            </time>
                        </div>
                        <p className="font-semibold text-slate-900">
                            {review.reviewer.name}
                        </p>
                        {review.reason && (
                            <p className="leading-relaxed text-slate-700">
                                {review.reason}
                            </p>
                        )}
                        {review.note && (
                            <p className="border-l-2 border-slate-200 pl-2.5 text-slate-500 italic">
                                {review.note}
                            </p>
                        )}
                        <p className="font-mono text-[0.6875rem] text-slate-400">
                            {review.policy_version}
                        </p>
                    </li>
                ))}
        </ol>
    );
}

function ReviewWorkspace({
    institution,
    filters,
    reviewQueue,
    isFilterLoading,
}: {
    institution: Props['institution'];
    filters: ReviewFilters;
    reviewQueue: ReviewQueue;
    isFilterLoading: boolean;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isQueueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const reviewForm = useHttp<ReviewPayload, ContributionApiResponse>({
        decision: 'approved',
        expected_version: 0,
        reason: null,
        note: null,
    });

    const selected =
        reviewQueue.items.find((item) => item.id === selectedId) ?? null;
    const version = selected?.current_version ?? null;
    const formErrors = reviewForm.errors as ErrorMap;
    const statusError = firstError(formErrors, 'status');
    const decisionError = firstError(formErrors, 'decision');
    const reasonError = firstError(formErrors, 'reason');
    const noteError = firstError(formErrors, 'note');
    const selectedDecision = reviewForm.data.decision;
    const isLoading = isQueueLoading || isFilterLoading;

    useEffect(() => {
        function closeDocket(event: KeyboardEvent): void {
            if (event.key === 'Escape' && selectedId !== null) {
                setSelectedId(null);
            }
        }

        document.addEventListener('keydown', closeDocket);

        return () => document.removeEventListener('keydown', closeDocket);
    }, [selectedId]);

    function selectItem(item: ContributionReviewQueueItem): void {
        setSelectedId(item.id);
        setActionMessage(null);
        setActionError(null);
        reviewForm.setData({
            decision: 'approved',
            expected_version: item.current_version?.version_number ?? 0,
            reason: null,
            note: null,
        });
        window.setTimeout(() => {
            document.getElementById('campus-review-decision-title')?.focus();
        }, 0);
    }

    function updateFilters(next: Partial<ReviewFilters> & { page?: number }) {
        const merged = { ...filters, ...next };

        setQueueLoading(true);
        setQueueError(null);
        setSelectedId(null);
        router.get(
            campusContributionsIndex({ institution: institution.id }),
            {
                status: merged.status === 'all' ? undefined : merged.status,
                sort: merged.sort,
                page: next.page ?? 1,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => setQueueError(null),
                onError: () => {
                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                    );
                },
                onHttpException: () => {
                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
                onFinish: () => setQueueLoading(false),
            },
        );
    }

    function refreshQueue(): void {
        setQueueLoading(true);
        setQueueError(null);
        router.reload({
            only: ['reviewQueue'],
            onSuccess: () => setQueueError(null),
            onError: () => {
                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );
            },
            onHttpException: () => {
                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
            onFinish: () => setQueueLoading(false),
        });
    }

    function submitReview(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            selected === null ||
            version === null ||
            selected.status !== 'pending' ||
            reviewForm.processing
        ) {
            return;
        }

        setActionMessage(null);
        setActionError(null);
        reviewForm.transform((data) => ({
            ...data,
            reason: data.reason?.trim() || null,
            note: data.note?.trim() || null,
        }));
        reviewForm
            .post(ContributionController.review(selected.id).url, {
                onSuccess: () => {
                    const nextItem = reviewQueue.items.find(
                        (item) =>
                            item.id !== selected.id &&
                            item.status === 'pending',
                    );

                    if (nextItem !== undefined) {
                        setSelectedId(nextItem.id);
                        reviewForm.setData({
                            decision: 'approved',
                            expected_version:
                                nextItem.current_version?.version_number ?? 0,
                            reason: null,
                            note: null,
                        });
                    } else {
                        setSelectedId(null);
                    }

                    setActionMessage(
                        'Keputusan tersimpan. Riwayat audit contribution sudah diperbarui.',
                    );
                    setActionError(null);
                    router.reload({
                        only: ['reviewQueue'],
                    });
                },
                onHttpException: (response: { status: number }) => {
                    setActionError(
                        response.status === 403
                            ? 'Akses review sudah tidak tersedia. Data yang terlihat tetap aman.'
                            : response.status === 422
                              ? 'Keputusan belum disimpan. Berkas mungkin berubah, atau field perlu diperbaiki.'
                              : 'Keputusan belum disimpan. Coba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Keputusan belum disimpan. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
            })
            .catch(() => undefined);
    }

    return (
        <div className="space-y-6">
            {/* Status alerts */}
            {actionMessage && (
                <Alert className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-950 shadow-xs">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <AlertTitle className="font-bold">
                        Perubahan Tersimpan
                    </AlertTitle>
                    <AlertDescription
                        className="text-xs text-emerald-800"
                        data-test="campus-contribution-action-success"
                    >
                        {actionMessage}
                    </AlertDescription>
                </Alert>
            )}

            {actionError && (
                <Alert
                    variant="destructive"
                    className="rounded-2xl border-rose-200 bg-rose-50 text-rose-950 shadow-xs"
                    data-test="campus-contribution-action-error"
                >
                    <AlertTriangle className="size-4 text-rose-600" />
                    <AlertTitle className="font-bold">
                        Keputusan Belum Tersimpan
                    </AlertTitle>
                    <AlertDescription className="text-xs text-rose-800">
                        {actionError}
                    </AlertDescription>
                </Alert>
            )}

            {queueError && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 shadow-xs"
                    data-test="campus-contribution-queue-error"
                >
                    <span>{queueError}</span>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 cursor-pointer rounded-xl bg-white text-xs disabled:cursor-not-allowed"
                        disabled={isLoading}
                        onClick={refreshQueue}
                        data-test="campus-contribution-queue-error-retry"
                    >
                        {isLoading ? (
                            <Spinner className="mr-1 size-3" />
                        ) : (
                            <RefreshCw className="mr-1 size-3 text-slate-500" />
                        )}
                        Coba lagi
                    </Button>
                </div>
            )}

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_26rem]">
                <section
                    aria-labelledby="contribution-review-queue-title"
                    aria-busy={isLoading}
                    className="min-w-0"
                >
                    {/* Header bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileCheck2 className="size-4.5 text-blue-600" />
                                <h2
                                    id="contribution-review-queue-title"
                                    className="text-base font-bold text-slate-900"
                                >
                                    Antrean Validasi
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {reviewQueue.pagination.total} contribution
                                sesuai filter
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 cursor-pointer rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                            onClick={refreshQueue}
                            data-test="campus-contribution-refresh"
                        >
                            {isLoading ? (
                                <Spinner className="mr-1.5 size-3.5" />
                            ) : (
                                <RefreshCw className="mr-1.5 size-3.5 text-slate-500" />
                            )}
                            Muat ulang
                        </Button>
                    </div>

                    <div className="mt-4">
                        {reviewQueue.items.length === 0 ? (
                            <div
                                className="grid justify-items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs"
                                data-test="campus-contribution-queue-empty"
                            >
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="size-7"
                                    />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Antrean validasi kosong
                                </h3>
                                <p className="mx-auto max-w-[50ch] text-xs leading-relaxed text-slate-500">
                                    Semua contribution pada filter ini sudah
                                    memiliki status yang tercatat. Ubah filter
                                    untuk melihat riwayat lain.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {isLoading && <QueueRefreshState />}
                                {reviewQueue.items.map((item) => {
                                    const itemStatus = statusMeta[item.status];

                                    return (
                                        <article
                                            key={item.id}
                                            className={cn(
                                                'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-6',
                                                selectedId === item.id &&
                                                    'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20',
                                            )}
                                            data-test={`campus-contribution-row-${item.id}`}
                                        >
                                            <button
                                                type="button"
                                                className="grid w-full cursor-pointer gap-4 text-left sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem] sm:items-center"
                                                aria-pressed={
                                                    selectedId === item.id
                                                }
                                                onClick={() => selectItem(item)}
                                                data-test={`campus-contribution-select-${item.id}`}
                                            >
                                                <div className="flex items-start gap-3.5">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-mono text-xs font-bold text-slate-400">
                                                            {item.reference}
                                                        </span>
                                                        <h3 className="mt-0.5 text-sm font-bold break-words text-slate-900">
                                                            {item.project.title}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Oleh:{' '}
                                                            <strong className="font-semibold text-slate-700">
                                                                {
                                                                    item
                                                                        .contributor
                                                                        .name
                                                                }
                                                            </strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="min-w-0 text-xs">
                                                    <p className="font-semibold break-words text-slate-800">
                                                        {item.current_version
                                                            ?.task?.title ??
                                                            'Task belum tersedia'}
                                                    </p>
                                                    <p className="mt-1 text-[0.6875rem] text-slate-400">
                                                        {item.current_version
                                                            ? `Versi ${item.current_version.version_number}`
                                                            : 'Versi belum tersedia'}{' '}
                                                        •{' '}
                                                        {formatDate(
                                                            item.updated_at,
                                                        )}
                                                    </p>
                                                    <p className="mt-1.5 text-slate-500">
                                                        {itemStatus.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                                                    <StatusChip
                                                        status={item.status}
                                                    />
                                                    <span
                                                        className={`text-xs font-semibold ${
                                                            selectedId ===
                                                            item.id
                                                                ? 'text-blue-600'
                                                                : 'text-slate-400 group-hover:text-blue-600'
                                                        }`}
                                                    >
                                                        {selectedId === item.id
                                                            ? 'Sedang Dibuka'
                                                            : 'Buka Docket →'}
                                                    </span>
                                                </div>
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {reviewQueue.pagination.last_page > 1 && (
                        <nav
                            aria-label="Paginasi antrean validasi contribution"
                            className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                                disabled={
                                    isLoading ||
                                    reviewQueue.pagination.current_page === 1
                                }
                                onClick={() =>
                                    updateFilters({
                                        page:
                                            reviewQueue.pagination
                                                .current_page - 1,
                                    })
                                }
                            >
                                <ChevronLeft className="mr-1 size-3.5" />
                                Sebelumnya
                            </Button>
                            <p className="font-mono text-xs font-semibold text-slate-600">
                                Halaman {reviewQueue.pagination.current_page}{' '}
                                dari {reviewQueue.pagination.last_page}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                                disabled={
                                    isLoading ||
                                    reviewQueue.pagination.current_page ===
                                        reviewQueue.pagination.last_page
                                }
                                onClick={() =>
                                    updateFilters({
                                        page:
                                            reviewQueue.pagination
                                                .current_page + 1,
                                    })
                                }
                            >
                                Berikutnya
                                <ChevronRight className="ml-1 size-3.5" />
                            </Button>
                        </nav>
                    )}
                </section>

                {/* Sticky Docket Aside */}
                <aside
                    aria-labelledby="campus-review-decision-title"
                    className="min-w-0"
                >
                    {selected === null ? (
                        <div className="sticky top-6 grid justify-items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <UserRoundCheck
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            </div>
                            <h2 className="text-base font-bold text-slate-900">
                                Pilih Contribution untuk Ditinjau
                            </h2>
                            <p className="text-xs leading-relaxed text-slate-500">
                                Klik salah satu baris kontribusi untuk memeriksa
                                deskripsi tugas, klaim hasil, dan tautan
                                evidence private.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="sticky top-6 grid min-w-0 gap-5 rounded-2xl border border-blue-200 bg-white p-6 shadow-md"
                            data-test="campus-contribution-docket"
                        >
                            {/* Docket Header */}
                            <header className="border-b border-slate-100 pb-4">
                                <span className="font-mono text-xs font-bold text-blue-600">
                                    {selected.reference}
                                </span>
                                <h2
                                    id="campus-review-decision-title"
                                    tabIndex={-1}
                                    className="mt-1 text-lg font-bold break-words text-slate-950 focus-visible:outline-none"
                                >
                                    {selected.project.title}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <StatusChip status={selected.status} />
                                    <span className="text-xs text-slate-500">
                                        Oleh {selected.contributor.name}
                                    </span>
                                </div>
                            </header>

                            {statusError && (
                                <Alert
                                    variant="destructive"
                                    className="rounded-xl"
                                >
                                    <AlertDescription className="text-xs">
                                        {statusError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Provenance Facts */}
                            <section
                                aria-labelledby="contribution-provenance-title"
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <History
                                        aria-hidden="true"
                                        className="size-4 text-blue-600"
                                    />
                                    <h3
                                        id="contribution-provenance-title"
                                        className="text-xs font-bold text-slate-800"
                                    >
                                        Provenance Review
                                    </h3>
                                </div>
                                <dl className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-slate-500">Task</dt>
                                        <dd className="font-semibold text-slate-900">
                                            {version?.task?.title ??
                                                'Belum ada task'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-slate-500">
                                            Versi Aktif
                                        </dt>
                                        <dd className="font-semibold text-slate-900">
                                            {version === null
                                                ? 'Belum tersedia'
                                                : `Versi ${version.version_number}`}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-slate-500">
                                            Diperbarui
                                        </dt>
                                        <dd className="text-slate-700">
                                            {formatDate(selected.updated_at)}
                                        </dd>
                                    </div>
                                </dl>
                            </section>

                            {/* Version Claim & Summary */}
                            {version && (
                                <>
                                    <section
                                        aria-labelledby="contribution-claim-title"
                                        className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                                    >
                                        <h3
                                            id="contribution-claim-title"
                                            className="font-bold text-slate-900"
                                        >
                                            Klaim & Ringkasan Kontribusi
                                        </h3>
                                        <p className="leading-relaxed font-semibold text-slate-800">
                                            {version.claim}
                                        </p>
                                        <p className="leading-relaxed text-slate-600">
                                            {version.summary}
                                        </p>
                                        <p className="border-l-2 border-blue-400 pl-2 text-slate-500 italic">
                                            {version.declaration}
                                        </p>
                                    </section>

                                    {/* Evidence List */}
                                    <section
                                        aria-labelledby="contribution-evidence-title"
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3
                                                id="contribution-evidence-title"
                                                className="text-xs font-bold text-slate-800"
                                            >
                                                Evidence Private
                                            </h3>
                                            <span className="font-mono text-[0.6875rem] text-slate-400">
                                                {version.evidence.length} file
                                            </span>
                                        </div>
                                        {version.evidence.length === 0 ? (
                                            <p className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center text-xs text-slate-500">
                                                Tidak ada evidence yang
                                                ditautkan ke versi ini.
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {version.evidence.map(
                                                    (evidence) => {
                                                        const attachment =
                                                            evidence.attachment;

                                                        return (
                                                            <li
                                                                key={
                                                                    evidence.id
                                                                }
                                                                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                                                            >
                                                                <div className="flex items-start gap-2.5">
                                                                    <FileCheck2
                                                                        aria-hidden="true"
                                                                        className="mt-0.5 size-4 shrink-0 text-emerald-600"
                                                                    />
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold break-words text-slate-900">
                                                                            {attachment?.original_name ??
                                                                                evidence.source_label}
                                                                        </p>
                                                                        {attachment && (
                                                                            <p className="font-mono text-[0.6875rem] text-slate-400">
                                                                                {
                                                                                    attachment.mime_type
                                                                                }{' '}
                                                                                •{' '}
                                                                                {formatFileSize(
                                                                                    attachment.size_bytes,
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {evidence.notes && (
                                                                    <p className="mt-1.5 pl-6 text-slate-600">
                                                                        {
                                                                            evidence.notes
                                                                        }
                                                                    </p>
                                                                )}
                                                                {evidence.available &&
                                                                    attachment && (
                                                                        <div className="mt-2 flex items-center gap-3 pl-6 font-semibold">
                                                                            <a
                                                                                href={
                                                                                    previewAttachment(
                                                                                        {
                                                                                            project:
                                                                                                selected
                                                                                                    .project
                                                                                                    .id,
                                                                                            attachment:
                                                                                                attachment.id,
                                                                                        },
                                                                                    )
                                                                                        .url
                                                                                }
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:underline"
                                                                            >
                                                                                <Eye className="size-3.5" />
                                                                                Pratinjau
                                                                            </a>
                                                                            <a
                                                                                href={
                                                                                    downloadAttachment(
                                                                                        {
                                                                                            project:
                                                                                                selected
                                                                                                    .project
                                                                                                    .id,
                                                                                            attachment:
                                                                                                attachment.id,
                                                                                        },
                                                                                    )
                                                                                        .url
                                                                                }
                                                                                className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:underline"
                                                                            >
                                                                                <ArrowDownToLine className="size-3.5" />
                                                                                Unduh
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                            </li>
                                                        );
                                                    },
                                                )}
                                            </ul>
                                        )}
                                    </section>
                                </>
                            )}

                            {/* Riwayat Keputusan */}
                            <section
                                aria-labelledby="contribution-history-title"
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <History
                                        aria-hidden="true"
                                        className="size-4 text-blue-600"
                                    />
                                    <h3
                                        id="contribution-history-title"
                                        className="text-xs font-bold text-slate-800"
                                    >
                                        Riwayat Keputusan
                                    </h3>
                                </div>
                                <ReviewHistory reviews={selected.reviews} />
                            </section>

                            {/* Decision Form */}
                            {selected.status === 'pending' && version ? (
                                <form
                                    className="grid gap-4 border-t border-slate-100 pt-4"
                                    onSubmit={submitReview}
                                    data-test="campus-contribution-review-form"
                                >
                                    <fieldset className="grid gap-2">
                                        <legend className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                                            Tindakan Reviewer
                                        </legend>
                                        {(
                                            Object.keys(
                                                decisionMeta,
                                            ) as ReviewDecision[]
                                        ).map((decision) => (
                                            <label
                                                key={decision}
                                                className={cn(
                                                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition-all',
                                                    decisionMeta[decision]
                                                        .className,
                                                    selectedDecision ===
                                                        decision &&
                                                        'ring-2 ring-blue-600/30',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="decision"
                                                    value={decision}
                                                    checked={
                                                        selectedDecision ===
                                                        decision
                                                    }
                                                    onChange={() =>
                                                        reviewForm.setData(
                                                            'decision',
                                                            decision,
                                                        )
                                                    }
                                                    className="mt-0.5 size-4 cursor-pointer accent-blue-600"
                                                />
                                                <div>
                                                    <span className="font-bold text-slate-900">
                                                        {
                                                            decisionMeta[
                                                                decision
                                                            ].label
                                                        }
                                                    </span>
                                                    <p className="mt-0.5 text-[0.6875rem] text-slate-500">
                                                        {
                                                            decisionMeta[
                                                                decision
                                                            ].description
                                                        }
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </fieldset>

                                    {decisionError && (
                                        <p
                                            role="alert"
                                            className="text-xs font-semibold text-rose-600"
                                        >
                                            {decisionError}
                                        </p>
                                    )}

                                    {/* Alasan */}
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="campus-contribution-review-reason"
                                            className="text-xs font-bold text-slate-700"
                                        >
                                            Alasan Keputusan
                                            {selectedDecision !==
                                                'approved' && (
                                                <span className="text-rose-600">
                                                    {' '}
                                                    *
                                                </span>
                                            )}
                                        </label>
                                        <textarea
                                            id="campus-contribution-review-reason"
                                            value={reviewForm.data.reason ?? ''}
                                            maxLength={1000}
                                            rows={3}
                                            required={
                                                selectedDecision !== 'approved'
                                            }
                                            aria-invalid={Boolean(reasonError)}
                                            onChange={(event) =>
                                                reviewForm.setData(
                                                    'reason',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                            placeholder="Tulis alasan faktual yang membantu mahasiswa..."
                                        />
                                        <p className="text-right font-mono text-[0.6875rem] text-slate-400">
                                            {
                                                (reviewForm.data.reason ?? '')
                                                    .length
                                            }{' '}
                                            / 1.000
                                        </p>
                                        {reasonError && (
                                            <p
                                                role="alert"
                                                className="text-xs font-semibold text-rose-600"
                                            >
                                                {reasonError}
                                            </p>
                                        )}
                                    </div>

                                    {/* Catatan internal */}
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="campus-contribution-review-note"
                                            className="text-xs font-bold text-slate-700"
                                        >
                                            Catatan Internal (Opsional)
                                        </label>
                                        <textarea
                                            id="campus-contribution-review-note"
                                            value={reviewForm.data.note ?? ''}
                                            maxLength={1000}
                                            rows={2}
                                            aria-invalid={Boolean(noteError)}
                                            onChange={(event) =>
                                                reviewForm.setData(
                                                    'note',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                            placeholder="Konteks tambahan untuk reviewer kampus..."
                                        />
                                        {noteError && (
                                            <p
                                                role="alert"
                                                className="text-xs font-semibold text-rose-600"
                                            >
                                                {noteError}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid gap-2 border-t border-slate-100 pt-3">
                                        <Button
                                            type="submit"
                                            variant={
                                                selectedDecision === 'rejected'
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className={`h-10 cursor-pointer rounded-xl text-xs font-semibold text-white shadow-xs ${
                                                selectedDecision === 'approved'
                                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                                    : selectedDecision ===
                                                        'revision'
                                                      ? 'bg-amber-600 hover:bg-amber-700'
                                                      : 'bg-rose-600 hover:bg-rose-700'
                                            }`}
                                            disabled={reviewForm.processing}
                                            data-test="campus-contribution-decision-submit"
                                        >
                                            {reviewForm.processing ? (
                                                <Spinner className="mr-1.5 size-3.5" />
                                            ) : selectedDecision ===
                                              'approved' ? (
                                                <ShieldCheck className="mr-1.5 size-3.5" />
                                            ) : selectedDecision ===
                                              'revision' ? (
                                                <FileWarning className="mr-1.5 size-3.5" />
                                            ) : (
                                                <XCircle className="mr-1.5 size-3.5" />
                                            )}
                                            {reviewForm.processing
                                                ? 'Menyimpan keputusan...'
                                                : decisionMeta[selectedDecision]
                                                      .label}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-9 cursor-pointer rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                            disabled={reviewForm.processing}
                                            onClick={() => setSelectedId(null)}
                                        >
                                            Tutup docket
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                                    <LockKeyhole className="size-4 shrink-0 text-slate-500" />
                                    <span>
                                        Mode baca. Kontribusi ini sudah memiliki
                                        keputusan dan tidak menerima perubahan
                                        baru.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default function CampusContributions({
    institution,
    filters,
    reviewQueue,
}: Props) {
    const [isFilterLoading, setFilterLoading] = useState(false);
    const [filterError, setFilterError] = useState<string | null>(null);

    function updateFilters(next: Partial<ReviewFilters>): void {
        const merged = { ...filters, ...next };

        setFilterLoading(true);
        setFilterError(null);
        router.get(
            campusContributionsIndex({ institution: institution.id }),
            {
                status: merged.status === 'all' ? undefined : merged.status,
                sort: merged.sort,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => setFilterError(null),
                onError: () => {
                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Coba lagi.',
                    );
                },
                onHttpException: () => {
                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Coba lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
                onFinish: () => setFilterLoading(false),
            },
        );
    }

    return (
        <>
            <Head
                title={`Validasi Kontribusi Mahasiswa - ${institution.name} | SATU`}
            />

            <AppPage
                contextRail={
                    <Deferred
                        data="reviewQueue"
                        fallback={
                            <div
                                aria-busy="true"
                                className="grid gap-4"
                                data-test="campus-contribution-summary-loading"
                            >
                                <Skeleton className="h-4 w-32 bg-slate-100" />
                                <Skeleton className="h-8 w-52 bg-slate-100" />
                                <Skeleton className="h-44 w-full rounded-2xl bg-slate-100" />
                                <Skeleton className="h-28 w-full rounded-2xl bg-slate-100" />
                            </div>
                        }
                    >
                        <SummaryRail
                            reviewQueue={reviewQueue!}
                            institution={institution}
                        />
                    </Deferred>
                }
                contextRailLabel="Ringkasan dan batas validasi contribution"
            >
                <div
                    className="space-y-6"
                    data-test="campus-contribution-review-root"
                >
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
                                    <FileCheck2 className="size-3 text-blue-600" />
                                    Meja Validasi Kampus
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Validasi Kontribusi Mahasiswa
                                </h1>

                                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
                                    Periksa pekerjaan, task, evidence private,
                                    dan provenance sebelum menetapkan keputusan
                                    validasi kampus di{' '}
                                    <span className="font-semibold text-slate-900">
                                        {institution.name}
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-800">
                                <ShieldCheck className="size-4 text-blue-600" />
                                <span>Akses Reviewer Kampus</span>
                            </div>
                        </div>
                    </header>

                    {/* Filter error */}
                    {filterError && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 shadow-xs"
                            data-test="campus-contribution-filter-error"
                        >
                            <span>{filterError}</span>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 cursor-pointer rounded-xl bg-white text-xs disabled:cursor-not-allowed"
                                disabled={isFilterLoading}
                                onClick={() => updateFilters({})}
                                data-test="campus-contribution-filter-error-retry"
                            >
                                {isFilterLoading ? (
                                    <Spinner className="mr-1 size-3" />
                                ) : (
                                    <RefreshCw className="mr-1 size-3 text-slate-500" />
                                )}
                                Coba lagi
                            </Button>
                        </div>
                    )}

                    {/* Filter Card */}
                    <section
                        aria-label="Filter antrean validasi contribution"
                        aria-busy={isFilterLoading}
                        className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:grid-cols-2"
                    >
                        <div className="space-y-1.5">
                            <label
                                htmlFor="filter-status"
                                className="text-xs font-bold text-slate-700"
                            >
                                Status Validasi
                            </label>
                            <select
                                id="filter-status"
                                value={filters.status}
                                disabled={isFilterLoading}
                                onChange={(event) =>
                                    updateFilters({
                                        status: event.target.value as
                                            ContributionStatus | 'all',
                                    })
                                }
                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                                data-test="campus-contribution-status-filter"
                            >
                                <option value="pending">
                                    Menunggu validasi
                                </option>
                                <option value="all">Semua status</option>
                                <option value="approved">Tervalidasi</option>
                                <option value="revision">
                                    Perlu diperbaiki
                                </option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="filter-sort"
                                className="text-xs font-bold text-slate-700"
                            >
                                Urutan Pengajuan
                            </label>
                            <select
                                id="filter-sort"
                                value={filters.sort}
                                disabled={isFilterLoading}
                                onChange={(event) =>
                                    updateFilters({
                                        sort: event.target.value as
                                            'oldest' | 'newest',
                                    })
                                }
                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                                data-test="campus-contribution-sort-filter"
                            >
                                <option value="oldest">Paling lama</option>
                                <option value="newest">Paling baru</option>
                            </select>
                        </div>
                    </section>

                    {/* Review Workspace with Deferred queue */}
                    <Deferred data="reviewQueue" fallback={<QueueSkeleton />}>
                        <ReviewWorkspace
                            institution={institution}
                            filters={filters}
                            reviewQueue={reviewQueue!}
                            isFilterLoading={isFilterLoading}
                        />
                    </Deferred>
                </div>
            </AppPage>
        </>
    );
}

CampusContributions.layout = {
    breadcrumbs: [
        {
            title: 'Operasi Kampus',
            href: '#',
        },
        {
            title: 'Validasi Kontribusi',
            href: '#',
        },
    ],
};
