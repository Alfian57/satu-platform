import { Deferred, Head, router, useHttp } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownToLine,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDot,
    Clock3,
    Eye,
    FileCheck2,
    FileWarning,
    History,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    UserRoundCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AppPage } from '@/components/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
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
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';

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
        className: 'border-border bg-muted text-muted-foreground',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Menunggu keputusan reviewer kampus.',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Pemilik menerima catatan untuk membuat versi baru.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    },
    approved: {
        label: 'Tervalidasi',
        description: 'Keputusan validasi tersimpan.',
        className:
            'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
    },
    rejected: {
        label: 'Ditolak',
        description: 'Keputusan penolakan tersimpan di riwayat.',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    },
    archived: {
        label: 'Diarsipkan',
        description: 'Contribution tidak menerima keputusan baru.',
        className: 'border-border bg-muted text-muted-foreground',
    },
};

const decisionMeta: Record<
    ReviewDecision,
    { label: string; description: string; className: string }
> = {
    approved: {
        label: 'Setujui',
        description: 'Contribution dapat menjadi sumber validasi kampus.',
        className: 'border-verified/40 bg-verified-subtle',
    },
    revision: {
        label: 'Minta perbaikan',
        description: 'Pemilik perlu membuat versi baru dengan alasan tertulis.',
        className: 'border-pending/40 bg-pending-subtle',
    },
    rejected: {
        label: 'Tolak',
        description: 'Simpan keputusan penolakan dengan alasan tertulis.',
        className: 'border-correction/40 bg-correction-subtle',
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
        return <CheckCircle2 aria-hidden="true" className="size-4" />;
    }

    if (status === 'pending') {
        return <Clock3 aria-hidden="true" className="size-4" />;
    }

    if (status === 'revision' || status === 'rejected') {
        return <AlertTriangle aria-hidden="true" className="size-4" />;
    }

    return <CircleDot aria-hidden="true" className="size-4" />;
}

function StatusChip({ status }: { status: ContributionStatus }) {
    const meta = statusMeta[status];

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-2 border px-2 py-1 text-xs font-semibold',
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
            className="border-y border-border"
            data-test="campus-contribution-queue-loading"
        >
            <p className="sr-only" role="status">
                Memuat antrean validasi contribution.
            </p>
            {Array.from({ length: 10 }, (_, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="grid min-h-28 gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem] sm:items-center"
                >
                    <div className="grid gap-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-3 w-2/5" />
                    </div>
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="h-control-md w-full" />
                </div>
            ))}
        </div>
    );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 py-3">
            <dt className="font-label text-label text-muted-foreground">
                {label}
            </dt>
            <dd className="font-medium [overflow-wrap:anywhere]">{value}</dd>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-label text-lg font-semibold">{value}</dd>
        </div>
    );
}

function SummaryRail({ reviewQueue }: { reviewQueue: ReviewQueue }) {
    return (
        <div className="grid gap-8">
            <section aria-labelledby="contribution-review-summary-title">
                <p className="font-label text-label text-muted-foreground">
                    Ringkasan antrean
                </p>
                <h2
                    id="contribution-review-summary-title"
                    className="mt-2 text-title font-bold"
                >
                    {reviewQueue.summary.pending} menunggu keputusan
                </h2>
                <dl className="mt-5 divide-y divide-border border-y border-border">
                    <SummaryRow
                        label="Menunggu validasi"
                        value={reviewQueue.summary.pending}
                    />
                    <SummaryRow
                        label="Sudah tervalidasi"
                        value={reviewQueue.summary.approved}
                    />
                    <SummaryRow
                        label="Perlu diperbaiki"
                        value={reviewQueue.summary.revision}
                    />
                    <SummaryRow
                        label="Ditolak"
                        value={reviewQueue.summary.rejected}
                    />
                </dl>
            </section>

            <section aria-labelledby="review-boundary-title">
                <div className="flex items-center gap-2">
                    <LockKeyhole
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    <h2 id="review-boundary-title" className="font-semibold">
                        Batas keputusan
                    </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Evidence yang dibuka tetap private. Setiap keputusan
                    menyimpan reviewer, alasan, waktu, dan policy version dalam
                    riwayat yang tidak dapat ditimpa.
                </p>
            </section>

            <section aria-labelledby="review-guidance-title">
                <div className="flex items-center gap-2">
                    <ShieldCheck
                        aria-hidden="true"
                        className="size-4 text-verified"
                    />
                    <h2 id="review-guidance-title" className="font-semibold">
                        Cara kerja reviewer
                    </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Pilih satu berkas, periksa task dan evidence, lalu simpan
                    satu keputusan. Keputusan lama tetap terlihat sebagai
                    provenance.
                </p>
            </section>
        </div>
    );
}

function ReviewHistory({ reviews }: { reviews: ContributionReview[] }) {
    if (reviews.length === 0) {
        return (
            <p className="border-y border-border py-4 text-sm leading-6 text-muted-foreground">
                Belum ada keputusan reviewer pada contribution ini.
            </p>
        );
    }

    return (
        <ol className="grid divide-y divide-border border-y border-border">
            {reviews
                .slice()
                .reverse()
                .map((review) => (
                    <li key={review.id} className="grid gap-2 py-4">
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
                                className="font-label text-label text-muted-foreground"
                            >
                                {formatDate(review.reviewed_at)}
                            </time>
                        </div>
                        <p className="text-sm font-semibold">
                            {review.reviewer.name}
                        </p>
                        {review.reason && (
                            <p className="text-sm leading-6 break-words">
                                {review.reason}
                            </p>
                        )}
                        {review.note && (
                            <p className="border-l-2 border-border pl-3 text-sm leading-6 break-words text-muted-foreground">
                                {review.note}
                            </p>
                        )}
                        <p className="font-label text-label text-muted-foreground">
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
}: {
    institution: Props['institution'];
    filters: ReviewFilters;
    reviewQueue: ReviewQueue;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isQueueLoading, setQueueLoading] = useState(false);
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
                onFinish: () => setQueueLoading(false),
            },
        );
    }

    function refreshQueue(): void {
        setQueueLoading(true);
        router.reload({
            only: ['reviewQueue'],
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
        <div className="grid gap-5">
            {actionMessage && (
                <p
                    role="status"
                    className="border border-verified/40 bg-verified-subtle px-3 py-3 text-sm leading-6 text-verified-subtle-foreground"
                    data-test="campus-contribution-action-success"
                >
                    {actionMessage}
                </p>
            )}

            {actionError && (
                <div
                    role="alert"
                    className="grid gap-1 border border-correction/40 bg-correction-subtle px-3 py-3 text-sm leading-6 text-correction-subtle-foreground"
                    data-test="campus-contribution-action-error"
                >
                    <span className="font-semibold">
                        Keputusan belum tersimpan
                    </span>
                    <span>{actionError}</span>
                </div>
            )}

            <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_27rem]">
                <section
                    aria-labelledby="contribution-review-queue-title"
                    className="min-w-0"
                >
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2
                                id="contribution-review-queue-title"
                                className="text-title font-bold"
                            >
                                Antrean validasi
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {reviewQueue.pagination.total} contribution
                                sesuai filter
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer disabled:cursor-not-allowed"
                            disabled={isQueueLoading}
                            onClick={refreshQueue}
                            data-test="campus-contribution-refresh"
                        >
                            {isQueueLoading ? <Spinner /> : <RefreshCw />}
                            Muat ulang
                        </Button>
                    </div>

                    {isQueueLoading ? (
                        <QueueSkeleton />
                    ) : reviewQueue.items.length === 0 ? (
                        <div
                            className="border-y border-border px-4 py-14 text-center"
                            data-test="campus-contribution-queue-empty"
                        >
                            <CheckCircle2
                                aria-hidden="true"
                                className="mx-auto size-9 text-verified"
                            />
                            <h3 className="mt-4 text-lg font-bold">
                                Antrean kosong
                            </h3>
                            <p className="mx-auto mt-2 max-w-[55ch] text-sm leading-relaxed text-muted-foreground">
                                Semua contribution pada filter ini sudah
                                memiliki status yang tercatat. Ubah filter untuk
                                melihat riwayat lain.
                            </p>
                        </div>
                    ) : (
                        <div className="border-y border-border">
                            {reviewQueue.items.map((item) => {
                                const itemStatus = statusMeta[item.status];

                                return (
                                    <article
                                        key={item.id}
                                        className={cn(
                                            'border-b border-border last:border-b-0',
                                            selectedId === item.id &&
                                                'bg-primary/5',
                                        )}
                                        data-test={`campus-contribution-row-${item.id}`}
                                    >
                                        <button
                                            type="button"
                                            className="grid w-full cursor-pointer gap-4 px-4 py-4 text-left transition-colors duration-fast hover:bg-muted/50 focus-visible:bg-muted/50 motion-reduce:transition-none sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem] sm:items-center"
                                            aria-pressed={
                                                selectedId === item.id
                                            }
                                            onClick={() => selectItem(item)}
                                            data-test={`campus-contribution-select-${item.id}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-label text-label text-primary">
                                                    {item.reference}
                                                </span>
                                                <span className="mt-1 block text-base font-semibold break-words">
                                                    {item.project.title}
                                                </span>
                                                <span className="mt-1 block text-sm break-words text-muted-foreground">
                                                    {item.contributor.name}
                                                </span>
                                            </span>
                                            <span className="min-w-0 text-sm">
                                                <span className="block font-medium break-words">
                                                    {item.current_version?.task
                                                        ?.title ??
                                                        'Task belum tersedia'}
                                                </span>
                                                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                                    {item.current_version
                                                        ? `Versi ${item.current_version.version_number}`
                                                        : 'Versi belum tersedia'}{' '}
                                                    ·{' '}
                                                    {formatDate(
                                                        item.updated_at,
                                                    )}
                                                </span>
                                                <span className="mt-2 block text-xs text-muted-foreground">
                                                    {itemStatus.description}
                                                </span>
                                            </span>
                                            <span className="flex items-center justify-between gap-3 sm:grid sm:justify-items-start">
                                                <StatusChip
                                                    status={item.status}
                                                />
                                                <span className="font-label text-label text-primary underline-offset-4 group-hover:underline">
                                                    {selectedId === item.id
                                                        ? 'Dibuka'
                                                        : 'Tinjau'}
                                                </span>
                                            </span>
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {!isQueueLoading &&
                        reviewQueue.pagination.last_page > 1 && (
                            <nav
                                aria-label="Paginasi antrean validasi contribution"
                                className="mt-4 flex items-center justify-between gap-4"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                    disabled={
                                        reviewQueue.pagination.current_page ===
                                        1
                                    }
                                    onClick={() =>
                                        updateFilters({
                                            page:
                                                reviewQueue.pagination
                                                    .current_page - 1,
                                        })
                                    }
                                >
                                    <ChevronLeft />
                                    Sebelumnya
                                </Button>
                                <p className="font-label text-label text-muted-foreground">
                                    Halaman{' '}
                                    {reviewQueue.pagination.current_page} dari{' '}
                                    {reviewQueue.pagination.last_page}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                    disabled={
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
                                    <ChevronRight />
                                </Button>
                            </nav>
                        )}
                </section>

                <aside
                    aria-labelledby="campus-review-decision-title"
                    className="min-w-0 border-t border-border pt-6 2xl:border-t-0 2xl:border-l 2xl:pt-0 2xl:pl-6"
                >
                    {selected === null ? (
                        <div className="sticky top-6 border-y border-border py-8 text-center">
                            <UserRoundCheck
                                aria-hidden="true"
                                className="mx-auto size-8 text-muted-foreground"
                            />
                            <h2 className="mt-3 font-bold">
                                Pilih contribution untuk ditinjau
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                Gunakan Tab dan Enter untuk membuka docket.
                                Tekan Escape untuk menutupnya.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="sticky top-6 grid min-w-0 gap-6"
                            data-test="campus-contribution-docket"
                        >
                            <header className="grid gap-3 border-y border-border py-4">
                                <p className="font-label text-label text-primary">
                                    {selected.reference}
                                </p>
                                <h2
                                    id="campus-review-decision-title"
                                    tabIndex={-1}
                                    className="text-title font-bold break-words focus-visible:outline-none"
                                >
                                    {selected.project.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusChip status={selected.status} />
                                    <span className="text-sm text-muted-foreground">
                                        {selected.contributor.name}
                                    </span>
                                </div>
                            </header>

                            {statusError && (
                                <p
                                    role="alert"
                                    className="border border-correction/40 bg-correction-subtle px-3 py-3 text-sm leading-6 text-correction-subtle-foreground"
                                >
                                    {statusError}
                                </p>
                            )}

                            <section aria-labelledby="contribution-provenance-title">
                                <div className="flex items-center gap-2">
                                    <History
                                        aria-hidden="true"
                                        className="size-4 text-primary"
                                    />
                                    <h3
                                        id="contribution-provenance-title"
                                        className="font-semibold"
                                    >
                                        Provenance review
                                    </h3>
                                </div>
                                <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
                                    <SummaryFact
                                        label="Pemilik contribution"
                                        value={selected.contributor.name}
                                    />
                                    <SummaryFact
                                        label="Task"
                                        value={
                                            version?.task?.title ??
                                            'Task belum tersedia'
                                        }
                                    />
                                    <SummaryFact
                                        label="Versi aktif"
                                        value={
                                            version === null
                                                ? 'Belum tersedia'
                                                : `Versi ${version.version_number}`
                                        }
                                    />
                                    <SummaryFact
                                        label="Diperbarui"
                                        value={formatDate(selected.updated_at)}
                                    />
                                </dl>
                            </section>

                            {version && (
                                <>
                                    <section
                                        aria-labelledby="contribution-claim-title"
                                        className="grid gap-3"
                                    >
                                        <h3
                                            id="contribution-claim-title"
                                            className="font-semibold"
                                        >
                                            Klaim dan ringkasan
                                        </h3>
                                        <p className="text-base leading-7 break-words">
                                            {version.claim}
                                        </p>
                                        <p className="text-sm leading-6 break-words text-muted-foreground">
                                            {version.summary}
                                        </p>
                                        <p className="border-l-2 border-border pl-3 text-sm leading-6 break-words text-muted-foreground">
                                            {version.declaration}
                                        </p>
                                    </section>

                                    <section
                                        aria-labelledby="contribution-evidence-title"
                                        className="grid gap-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <h3
                                                id="contribution-evidence-title"
                                                className="font-semibold"
                                            >
                                                Evidence private
                                            </h3>
                                            <span className="font-label text-label text-muted-foreground">
                                                {version.evidence.length} file
                                            </span>
                                        </div>
                                        {version.evidence.length === 0 ? (
                                            <p className="border-y border-border py-4 text-sm leading-6 text-muted-foreground">
                                                Tidak ada evidence yang
                                                ditautkan ke versi ini.
                                            </p>
                                        ) : (
                                            <ul className="grid divide-y divide-border border-y border-border">
                                                {version.evidence.map(
                                                    (evidence) => {
                                                        const attachment =
                                                            evidence.attachment;

                                                        return (
                                                            <li
                                                                key={
                                                                    evidence.id
                                                                }
                                                                className="grid gap-2 py-4"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <FileCheck2
                                                                        aria-hidden="true"
                                                                        className="mt-1 size-4 shrink-0 text-verified"
                                                                    />
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium break-words">
                                                                            {attachment?.original_name ??
                                                                                evidence.source_label}
                                                                        </p>
                                                                        {attachment && (
                                                                            <p className="mt-1 font-label text-label text-muted-foreground">
                                                                                {
                                                                                    attachment.mime_type
                                                                                }{' '}
                                                                                ·{' '}
                                                                                {formatFileSize(
                                                                                    attachment.size_bytes,
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {evidence.notes && (
                                                                    <p className="pl-7 text-sm leading-6 text-muted-foreground">
                                                                        {
                                                                            evidence.notes
                                                                        }
                                                                    </p>
                                                                )}
                                                                {evidence.available &&
                                                                    attachment && (
                                                                        <div className="flex flex-wrap gap-3 pl-7 text-sm font-semibold">
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
                                                                                className="inline-flex cursor-pointer items-center gap-2 text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                                                            >
                                                                                <Eye aria-hidden="true" />
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
                                                                                className="inline-flex cursor-pointer items-center gap-2 text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                                                            >
                                                                                <ArrowDownToLine aria-hidden="true" />
                                                                                Unduh
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                {!evidence.available && (
                                                                    <p className="pl-7 text-sm leading-6 text-correction-subtle-foreground">
                                                                        File
                                                                        tidak
                                                                        tersedia.
                                                                        Referensi
                                                                        tetap
                                                                        disimpan
                                                                        agar
                                                                        provenance
                                                                        tidak
                                                                        hilang.
                                                                    </p>
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

                            <section aria-labelledby="contribution-history-title">
                                <div className="flex items-center gap-2">
                                    <History
                                        aria-hidden="true"
                                        className="size-4 text-primary"
                                    />
                                    <h3
                                        id="contribution-history-title"
                                        className="font-semibold"
                                    >
                                        Riwayat keputusan
                                    </h3>
                                </div>
                                <div className="mt-3">
                                    <ReviewHistory reviews={selected.reviews} />
                                </div>
                            </section>

                            {selected.status === 'pending' && version ? (
                                <form
                                    className="grid gap-5 border-t border-border pt-5"
                                    onSubmit={submitReview}
                                    data-test="campus-contribution-review-form"
                                >
                                    <div className="grid gap-1">
                                        <h3
                                            id="contribution-decision-form-title"
                                            className="font-semibold"
                                        >
                                            Keputusan reviewer
                                        </h3>
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            Pilih satu keputusan. Alasan wajib
                                            untuk minta perbaikan atau menolak.
                                        </p>
                                    </div>

                                    <fieldset className="grid gap-2">
                                        <legend className="text-sm font-semibold">
                                            Tindakan
                                        </legend>
                                        {(
                                            Object.keys(
                                                decisionMeta,
                                            ) as ReviewDecision[]
                                        ).map((decision) => (
                                            <label
                                                key={decision}
                                                className={cn(
                                                    'flex min-h-control-lg cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition-colors duration-fast hover:bg-accent motion-reduce:transition-none',
                                                    decisionMeta[decision]
                                                        .className,
                                                    selectedDecision ===
                                                        decision &&
                                                        'border-primary ring-1 ring-primary',
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
                                                    className="mt-1 size-4 cursor-pointer accent-primary"
                                                    aria-describedby={`decision-help-${decision}`}
                                                />
                                                <span className="grid gap-1">
                                                    <span className="font-semibold">
                                                        {
                                                            decisionMeta[
                                                                decision
                                                            ].label
                                                        }
                                                    </span>
                                                    <span
                                                        id={`decision-help-${decision}`}
                                                        className="text-xs leading-5 text-muted-foreground"
                                                    >
                                                        {
                                                            decisionMeta[
                                                                decision
                                                            ].description
                                                        }
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </fieldset>

                                    {decisionError && (
                                        <p
                                            role="alert"
                                            className="text-sm text-correction-subtle-foreground"
                                        >
                                            {decisionError}
                                        </p>
                                    )}

                                    <div className="grid gap-2">
                                        <label
                                            htmlFor="campus-contribution-review-reason"
                                            className="text-sm font-semibold"
                                        >
                                            Alasan keputusan
                                            {selectedDecision !==
                                                'approved' && (
                                                <span aria-hidden="true">
                                                    {' '}
                                                    *
                                                </span>
                                            )}
                                        </label>
                                        <textarea
                                            id="campus-contribution-review-reason"
                                            value={reviewForm.data.reason ?? ''}
                                            maxLength={1000}
                                            rows={4}
                                            required={
                                                selectedDecision !== 'approved'
                                            }
                                            aria-invalid={Boolean(reasonError)}
                                            aria-describedby="campus-contribution-review-reason-help"
                                            onChange={(event) =>
                                                reviewForm.setData(
                                                    'reason',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                            placeholder="Tulis alasan faktual yang membantu pemilik menindaklanjuti keputusan."
                                        />
                                        <p
                                            id="campus-contribution-review-reason-help"
                                            className="flex justify-between gap-3 text-xs text-muted-foreground"
                                        >
                                            <span>
                                                Jangan salin data pribadi yang
                                                tidak diperlukan.
                                            </span>
                                            <span className="shrink-0">
                                                {
                                                    (
                                                        reviewForm.data
                                                            .reason ?? ''
                                                    ).length
                                                }{' '}
                                                / 1.000
                                            </span>
                                        </p>
                                        {reasonError && (
                                            <p
                                                role="alert"
                                                className="text-sm text-correction-subtle-foreground"
                                            >
                                                {reasonError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <label
                                            htmlFor="campus-contribution-review-note"
                                            className="text-sm font-semibold"
                                        >
                                            Catatan internal (opsional)
                                        </label>
                                        <textarea
                                            id="campus-contribution-review-note"
                                            value={reviewForm.data.note ?? ''}
                                            maxLength={1000}
                                            rows={3}
                                            aria-invalid={Boolean(noteError)}
                                            onChange={(event) =>
                                                reviewForm.setData(
                                                    'note',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                            placeholder="Konteks tambahan untuk reviewer kampus."
                                        />
                                        {noteError && (
                                            <p
                                                role="alert"
                                                className="text-sm text-correction-subtle-foreground"
                                            >
                                                {noteError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2 border-t border-border pt-4">
                                        <Button
                                            type="submit"
                                            variant={
                                                selectedDecision === 'rejected'
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className="cursor-pointer disabled:cursor-not-allowed"
                                            disabled={reviewForm.processing}
                                            data-test="campus-contribution-decision-submit"
                                        >
                                            {reviewForm.processing ? (
                                                <Spinner aria-label="Menyimpan keputusan" />
                                            ) : selectedDecision ===
                                              'approved' ? (
                                                <ShieldCheck />
                                            ) : selectedDecision ===
                                              'revision' ? (
                                                <FileWarning />
                                            ) : (
                                                <XCircle />
                                            )}
                                            {reviewForm.processing
                                                ? 'Menyimpan keputusan...'
                                                : decisionMeta[selectedDecision]
                                                      .label}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="cursor-pointer disabled:cursor-not-allowed"
                                            disabled={reviewForm.processing}
                                            onClick={() => setSelectedId(null)}
                                        >
                                            Tutup docket
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-start gap-3 border border-border bg-muted/50 px-3 py-3 text-sm leading-6 text-muted-foreground">
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="mt-1 size-4 shrink-0"
                                    />
                                    <p>
                                        Mode baca. Status ini sudah memiliki
                                        keputusan dan tidak menerima perubahan
                                        baru.
                                    </p>
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

    function updateFilters(next: Partial<ReviewFilters>): void {
        const merged = { ...filters, ...next };

        setFilterLoading(true);
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
                onFinish: () => setFilterLoading(false),
            },
        );
    }

    return (
        <>
            <Head title={`Validasi contribution, ${institution.name}`} />
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
                                <span className="sr-only" role="status">
                                    Memuat ringkasan antrean contribution.
                                </span>
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-8 w-52" />
                                <Skeleton className="h-44 w-full" />
                                <Skeleton className="h-28 w-full" />
                            </div>
                        }
                    >
                        <SummaryRail reviewQueue={reviewQueue!} />
                    </Deferred>
                }
                contextRailLabel="Ringkasan dan batas validasi contribution"
            >
                <div
                    className="mx-auto w-full max-w-7xl"
                    data-test="campus-contribution-review-root"
                >
                    <header className="mb-7 grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.35fr)] lg:items-end lg:gap-10">
                        <div className="min-w-0 space-y-3">
                            <p className="font-label text-label text-primary">
                                MEJA VALIDASI / CAMPUS REVIEWER
                            </p>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h1 className="max-w-[24ch] text-headline font-bold text-balance">
                                        Validasi contribution {institution.name}
                                    </h1>
                                    <p className="mt-3 max-w-[68ch] text-body text-muted-foreground">
                                        Periksa pekerjaan, task, evidence, dan
                                        provenance sebelum menyimpan keputusan
                                        kampus.
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-primary/30 bg-primary/5 px-3 py-1 text-primary"
                                >
                                    <ShieldCheck />
                                    Akses reviewer kampus
                                </Badge>
                            </div>
                        </div>
                        <div className="grid gap-2 border border-border bg-card/60 px-4 py-4 text-sm leading-6">
                            <p className="font-label text-label text-muted-foreground">
                                SUMBER KEPUTUSAN
                            </p>
                            <p>
                                Data berasal dari contribution yang dikirim
                                mahasiswa pada institution ini. Tidak ada bulk
                                decision.
                            </p>
                        </div>
                    </header>

                    <section
                        aria-label="Filter antrean validasi contribution"
                        aria-busy={isFilterLoading}
                        className="mb-7 grid gap-4 border-y border-border py-4 sm:grid-cols-2"
                    >
                        <label className="grid gap-2 text-sm font-semibold">
                            Status
                            <select
                                value={filters.status}
                                disabled={isFilterLoading}
                                onChange={(event) =>
                                    updateFilters({
                                        status: event.target.value as
                                            ContributionStatus | 'all',
                                    })
                                }
                                className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                            Urutan
                            <select
                                value={filters.sort}
                                disabled={isFilterLoading}
                                onChange={(event) =>
                                    updateFilters({
                                        sort: event.target.value as
                                            'oldest' | 'newest',
                                    })
                                }
                                className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                data-test="campus-contribution-sort-filter"
                            >
                                <option value="oldest">Paling lama</option>
                                <option value="newest">Paling baru</option>
                            </select>
                        </label>
                    </section>

                    <Deferred data="reviewQueue" fallback={<QueueSkeleton />}>
                        <ReviewWorkspace
                            institution={institution}
                            filters={filters}
                            reviewQueue={reviewQueue!}
                        />
                    </Deferred>
                </div>
            </AppPage>
        </>
    );
}
