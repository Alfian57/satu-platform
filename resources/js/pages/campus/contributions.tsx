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
    FileText,
    FileWarning,
    History,
    LockKeyhole,
    RefreshCw,
    Search,
    ShieldCheck,
    UserRoundCheck,
    XCircle,
} from 'lucide-react';
import type { FormEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    CampusTechnicalDetails,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
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
    q?: string;
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
    expected_revision: string;
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
        className: 'border-border bg-accent/35 text-muted-foreground',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Menunggu keputusan peninjau kampus.',
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Pemilik menerima catatan untuk membuat versi baru.',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
    approved: {
        label: 'Tervalidasi',
        description: 'Disetujui untuk versi kontribusi yang ditinjau.',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground',
    },
    rejected: {
        label: 'Ditolak',
        description: 'Keputusan penolakan tersimpan di riwayat.',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground',
    },
    archived: {
        label: 'Diarsipkan',
        description: 'Kontribusi tidak menerima keputusan baru.',
        className: 'border-border bg-accent/35 text-muted-foreground',
    },
};

const decisionMeta: Record<
    ReviewDecision,
    { label: string; description: string; className: string }
> = {
    approved: {
        label: 'Setujui Kontribusi',
        description: 'Kontribusi valid dan dapat menjadi capaian portofolio.',
        className:
            'border-verified/30 bg-verified-subtle text-verified-subtle-foreground hover:bg-verified-subtle',
    },
    revision: {
        label: 'Minta Perbaikan',
        description:
            'Mahasiswa perlu membuat versi baru berdasarkan catatan peninjau.',
        className:
            'border-pending/30 bg-pending-subtle text-pending-subtle-foreground hover:bg-pending-subtle',
    },
    rejected: {
        label: 'Tolak Kontribusi',
        description: 'Tolak kontribusi dengan alasan tertulis faktual.',
        className:
            'border-correction/30 bg-correction-subtle text-correction-subtle-foreground hover:bg-correction-subtle',
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
            aria-label="Antrean validasi kontribusi sedang dimuat"
            className="overflow-hidden rounded-3xl border border-border bg-white"
            data-test="campus-contribution-queue-loading"
        >
            <p className="sr-only" role="status">
                Memuat antrean validasi kontribusi.
            </p>
            {Array.from({ length: 5 }, (_, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="grid min-h-24 gap-4 border-b border-border p-6 last:border-b-0 @min-[46rem]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] @min-[46rem]:items-center"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-xl bg-accent" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-accent" />
                            <Skeleton className="h-3 w-48 bg-accent" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 bg-accent" />
                        <Skeleton className="h-3 w-36 bg-accent" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl bg-accent" />
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
            className="flex items-center gap-2.5 rounded-3xl border border-primary/15 bg-accent/70 p-4 text-xs font-semibold text-primary"
            data-test="campus-contribution-queue-refreshing"
        >
            <RefreshCw
                aria-hidden="true"
                className="size-4 animate-spin text-primary motion-reduce:animate-none"
            />
            <span>
                Menyegarkan antrean tanpa menghapus kontribusi yang sedang
                terlihat.
            </span>
        </div>
    );
}

function SummaryRail({ reviewQueue }: { reviewQueue: ReviewQueue }) {
    const stats = [
        {
            label: 'Menunggu validasi',
            value: reviewQueue.summary.pending,
            icon: Clock3,
            tone: 'text-pending-subtle-foreground',
        },
        {
            label: 'Tervalidasi',
            value: reviewQueue.summary.approved,
            icon: CheckCircle2,
            tone: 'text-verified-subtle-foreground',
        },
        {
            label: 'Perlu diperbaiki',
            value: reviewQueue.summary.revision,
            icon: FileWarning,
            tone: 'text-correction-subtle-foreground',
        },
        {
            label: 'Ditolak',
            value: reviewQueue.summary.rejected,
            icon: XCircle,
            tone: 'text-muted-foreground',
        },
    ];

    return (
        <section
            aria-label="Ringkasan validasi kampus"
            className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border px-1 py-5 lg:grid-cols-4"
        >
            {stats.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="flex min-w-0 items-start gap-3">
                    <span
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/70',
                            tone,
                        )}
                    >
                        <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs leading-5 text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums">
                            {value}
                        </p>
                    </div>
                </div>
            ))}
        </section>
    );
}

function ReviewHistory({ reviews }: { reviews: ContributionReview[] }) {
    if (reviews.length === 0) {
        return (
            <p className="rounded-xl border border-border bg-accent/35 p-4 text-center text-xs text-muted-foreground">
                Belum ada keputusan peninjau pada kontribusi ini.
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
                        className="space-y-2 rounded-xl border border-border bg-accent/35 p-3 text-sm leading-6"
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
                                className="font-mono text-xs text-muted-foreground"
                            >
                                {formatDate(review.reviewed_at)}
                            </time>
                        </div>
                        <p className="font-semibold wrap-anywhere text-foreground">
                            {review.reviewer.name}
                        </p>
                        {review.reason && (
                            <p className="leading-relaxed text-foreground">
                                {review.reason}
                            </p>
                        )}
                        {review.note && (
                            <p className="border-l-2 border-border pl-2.5 text-muted-foreground italic">
                                {review.note}
                            </p>
                        )}
                        <p className="font-mono text-xs text-muted-foreground">
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
    onAccessUnavailable,
    filterChangeGuardRef,
}: {
    institution: Props['institution'];
    filters: ReviewFilters;
    reviewQueue: ReviewQueue;
    isFilterLoading: boolean;
    onAccessUnavailable: () => void;
    filterChangeGuardRef: RefObject<(() => boolean) | null>;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isQueueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);
    const commandLock = useRef(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [commandBlocked, setCommandBlocked] = useState(false);
    const validationFocus = useRef(false);
    const reviewForm = useHttp<ReviewPayload, ContributionApiResponse>({
        decision: 'approved',
        expected_version: 0,
        expected_revision: '',
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
        const guard = (): boolean => {
            if (
                commandLock.current ||
                isLoading ||
                needsCheck ||
                accessUnavailable
            ) {
                return false;
            }

            return (
                !(reviewForm.data.reason || reviewForm.data.note) ||
                window.confirm(
                    'Ganti antrean dan buang catatan keputusan belum disimpan?',
                )
            );
        };
        filterChangeGuardRef.current = guard;

        return () => {
            if (filterChangeGuardRef.current === guard) {
                filterChangeGuardRef.current = null;
            }
        };
    }, [
        filterChangeGuardRef,
        isLoading,
        needsCheck,
        accessUnavailable,
        reviewForm.data.reason,
        reviewForm.data.note,
    ]);
    const stale =
        selected !== null &&
        selected.revision !== reviewForm.data.expected_revision;
    const blocked =
        reviewForm.processing ||
        commandBlocked ||
        needsCheck ||
        stale ||
        isLoading ||
        queueError !== null;
    useEffect(() => {
        if (validationFocus.current && !reviewForm.processing) {
            validationFocus.current = false;
            document
                .querySelector<HTMLElement>(
                    '[data-test="campus-contribution-review-form"] [aria-invalid="true"]',
                )
                ?.focus();
        }
    }, [reviewForm.errors, reviewForm.processing]);

    useEffect(() => {
        function closeDocket(event: KeyboardEvent): void {
            if (
                event.key === 'Escape' &&
                selectedId !== null &&
                !reviewForm.processing
            ) {
                if (
                    (reviewForm.data.reason || reviewForm.data.note) &&
                    !window.confirm(
                        'Tutup berkas dan buang catatan keputusan yang belum disimpan?',
                    )
                ) {
                    return;
                }

                setSelectedId(null);
                window.setTimeout(
                    () =>
                        document
                            .querySelector<HTMLButtonElement>(
                                `[data-test="campus-contribution-select-${selectedId}"]`,
                            )
                            ?.focus(),
                    0,
                );
            }
        }

        document.addEventListener('keydown', closeDocket);

        return () => document.removeEventListener('keydown', closeDocket);
    }, [
        selectedId,
        reviewForm.processing,
        reviewForm.data.reason,
        reviewForm.data.note,
    ]);

    function selectItem(item: ContributionReviewQueueItem): void {
        if (commandLock.current || isLoading || needsCheck) {
            return;
        }

        if (
            (selectedId !== item.id || stale) &&
            (reviewForm.data.reason || reviewForm.data.note) &&
            !window.confirm(
                'Pindah berkas dan buang catatan keputusan yang belum disimpan?',
            )
        ) {
            return;
        }

        setSelectedId(item.id);
        reviewForm.clearErrors();
        setCommandBlocked(false);
        setActionMessage(null);
        setActionError(null);
        reviewForm.setData({
            decision: 'approved',
            expected_version: item.current_version?.version_number ?? 0,
            expected_revision: item.revision,
            reason: null,
            note: null,
        });
        window.setTimeout(() => {
            document.getElementById('campus-review-decision-title')?.focus();
        }, 0);
    }

    function updateFilters(next: Partial<ReviewFilters> & { page?: number }) {
        if (commandLock.current || isLoading || needsCheck) {
            return;
        }

        if (
            (reviewForm.data.reason || reviewForm.data.note) &&
            !window.confirm(
                'Ganti antrean dan buang catatan keputusan belum disimpan?',
            )
        ) {
            return;
        }

        const merged = { ...filters, ...next };

        setQueueLoading(true);
        setQueueError(null);
        setSelectedId(null);
        router.get(
            campusContributionsIndex({ institution: institution.id }),
            {
                status: merged.status,
                q: merged.q?.trim() || undefined,
                sort: merged.sort,
                page: next.page ?? 1,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setQueueError(null);
                    setAccessUnavailable(false);
                },
                onError: () => {
                    setQueueError(
                        'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                    );
                },
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                        onAccessUnavailable();
                    }

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
        if (commandLock.current || isLoading) {
            return;
        }

        setQueueLoading(true);
        setQueueError(null);
        router.reload({
            only: ['reviewQueue'],
            onSuccess: () => {
                setQueueError(null);
                setNeedsCheck(false);
            },
            onError: () => {
                setQueueError(
                    'Antrean belum diperbarui. Data yang sedang terlihat tetap aman. Coba lagi.',
                );
            },
            onHttpException: (response) => {
                if (response.status === 403 || response.status === 404) {
                    setAccessUnavailable(true);
                    onAccessUnavailable();
                }

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
            blocked ||
            commandLock.current
        ) {
            return;
        }

        commandLock.current = true;
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
                    setSelectedId(null);
                    setCommandBlocked(false);
                    reviewForm.setData({
                        decision: 'approved',
                        expected_version: 0,
                        expected_revision: '',
                        reason: null,
                        note: null,
                    });
                    setActionMessage(
                        'Keputusan tersimpan. Persetujuan menghasilkan karya privat, bukan publikasi bukti.',
                    );
                    setActionError(null);
                    setNeedsCheck(true);
                    setQueueLoading(true);
                    router.reload({
                        only: ['reviewQueue'],
                        onSuccess: () => {
                            setQueueError(null);
                            setNeedsCheck(false);
                        },
                        onHttpException: (response) => {
                            if (
                                response.status === 403 ||
                                response.status === 404
                            ) {
                                setAccessUnavailable(true);
                                onAccessUnavailable();
                            }

                            setQueueError(
                                'Keputusan tersimpan, tetapi antrean terbaru belum terbaca. Periksa antrean sebelum keputusan lain.',
                            );

                            return false;
                        },
                        onNetworkError: () => {
                            setQueueError(
                                'Keputusan tersimpan, tetapi antrean terbaru belum terbaca. Periksa koneksi.',
                            );

                            return false;
                        },
                        onFinish: () => setQueueLoading(false),
                    });
                },
                onError: (errors) => {
                    validationFocus.current = true;

                    if (
                        'status' in errors ||
                        'evidence' in errors ||
                        'expected_revision' in errors ||
                        'expected_version' in errors
                    ) {
                        setCommandBlocked(true);
                        setActionError(
                            'Berkas atau bukti perlu diperiksa. Perbaikan dan penolakan tetap memerlukan sumber terbaru.',
                        );
                    }
                },
                onHttpException: (response: { status: number }) => {
                    setNeedsCheck(true);
                    setCommandBlocked(true);

                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                        onAccessUnavailable();
                    }

                    setActionError(
                        response.status === 403
                            ? 'Akses review sudah tidak tersedia. Data yang terlihat tetap aman.'
                            : response.status === 422
                              ? 'Keputusan belum disimpan. Berkas mungkin berubah, atau field perlu diperbaiki.'
                              : response.status === 409
                                ? 'Berkas berubah. Periksa antrean dan gunakan berkas terbaru sebelum memutuskan.'
                                : 'Hasil keputusan belum dapat dipastikan. Periksa antrean sebelum mengirim lagi.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setNeedsCheck(true);
                    setCommandBlocked(true);
                    setActionError(
                        'Hasil keputusan belum pasti. Catatan tetap ada. Periksa antrean, jangan langsung mengirim ulang.',
                    );

                    return false;
                },
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    return (
        <div className="space-y-6 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none">
            <details
                className="rounded-3xl border border-border bg-card p-5"
                data-test="campus-contribution-guidance"
            >
                <summary className="min-h-11 cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-ring">
                    Batas dan panduan validasi individual
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Periksa bagian pekerjaan mahasiswa, hubungan klaim dengan
                    bukti, dan pernyataannya. Berkas bersama tidak membuktikan
                    semua anggota mengerjakan bagian yang sama. Persetujuan
                    hanya menilai kontribusi pada versi ini, bukan semua
                    keahlian atau kualitas mutlak. Ringkasan menjadi karya
                    privat; bukti dan catatan keputusan tidak ikut
                    dipublikasikan. Panduan teknis ini bukan standar final atau
                    SLA kampus. Nyatakan bagian yang perlu diperbaiki pada
                    alasan; catatan dapat dibaca pemilik.
                </p>
            </details>
            {/* Status alerts */}
            {actionMessage && (
                <Alert className="rounded-3xl border-verified/30 bg-verified-subtle text-verified-subtle-foreground shadow-sm">
                    <CheckCircle2 className="size-4 text-verified-subtle-foreground" />
                    <AlertTitle className="font-bold">
                        Perubahan Tersimpan
                    </AlertTitle>
                    <AlertDescription
                        className="text-xs text-verified-subtle-foreground"
                        data-test="campus-contribution-action-success"
                    >
                        {actionMessage}
                    </AlertDescription>
                </Alert>
            )}

            {actionError && (
                <Alert
                    variant="destructive"
                    className="rounded-3xl border-correction/30 bg-correction-subtle text-correction-subtle-foreground shadow-sm"
                    data-test="campus-contribution-action-error"
                >
                    <AlertTriangle className="size-4 text-correction-subtle-foreground" />
                    <AlertTitle className="font-bold">
                        Keputusan belum tersimpan
                    </AlertTitle>
                    <AlertDescription className="text-xs text-correction-subtle-foreground">
                        {actionError}
                    </AlertDescription>
                </Alert>
            )}

            {queueError && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-correction/30 bg-correction-subtle p-4 text-xs font-semibold text-correction-subtle-foreground shadow-sm"
                    data-test="campus-contribution-queue-error"
                >
                    <span>{queueError}</span>
                    <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 cursor-pointer rounded-xl bg-white text-xs disabled:cursor-not-allowed"
                        disabled={isLoading}
                        onClick={refreshQueue}
                        data-test="campus-contribution-queue-error-retry"
                    >
                        {isLoading ? (
                            <Spinner className="mr-1 size-3" />
                        ) : (
                            <RefreshCw className="mr-1 size-3 text-muted-foreground" />
                        )}
                        Coba lagi
                    </Button>
                </div>
            )}

            {accessUnavailable ? (
                <section className="rounded-3xl border border-border bg-white p-5">
                    <h2 className="text-lg font-bold">
                        Akses validasi tidak tersedia
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Berkas sebelumnya disembunyikan. Periksa izin kampus
                        sebelum memuat ulang.
                    </p>
                    <Button
                        variant="outline"
                        disabled={isLoading}
                        onClick={refreshQueue}
                        className="mt-4"
                    >
                        Muat ulang antrean
                    </Button>
                </section>
            ) : (
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
                    <section
                        aria-labelledby="contribution-review-queue-title"
                        aria-busy={isLoading}
                        className="@container min-w-0"
                    >
                        {/* Header bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white px-6 py-5 shadow-sm">
                            <div>
                                <div className="flex items-center gap-2">
                                    <FileCheck2 className="size-4.5 text-primary" />
                                    <h2
                                        id="contribution-review-queue-title"
                                        tabIndex={-1}
                                        className="text-base font-bold text-foreground"
                                    >
                                        {filters.status === 'approved'
                                            ? 'Hasil disetujui'
                                            : 'Antrean validasi'}
                                    </h2>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {reviewQueue.pagination.total} kontribusi
                                    sesuai filter
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 cursor-pointer rounded-xl text-xs font-semibold text-foreground hover:bg-accent/35 disabled:cursor-not-allowed"
                                disabled={isLoading}
                                onClick={refreshQueue}
                                data-test="campus-contribution-refresh"
                            >
                                {isLoading ? (
                                    <Spinner className="mr-1.5 size-3.5" />
                                ) : (
                                    <RefreshCw className="mr-1.5 size-3.5 text-muted-foreground" />
                                )}
                                Muat ulang
                            </Button>
                        </div>

                        <div className="mt-4">
                            {reviewQueue.items.length === 0 ? (
                                <div
                                    className="grid justify-items-center gap-3 rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-sm"
                                    data-test="campus-contribution-queue-empty"
                                >
                                    <div className="flex size-14 items-center justify-center rounded-3xl bg-verified-subtle text-verified-subtle-foreground ring-8 ring-verified-subtle">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-7"
                                        />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        {filters.q
                                            ? 'Belum ada hasil yang cocok'
                                            : filters.status === 'approved'
                                              ? 'Belum ada hasil disetujui'
                                              : 'Antrean kosong'}
                                    </h3>
                                    <p className="mx-auto max-w-[50ch] text-xs leading-relaxed text-muted-foreground">
                                        Tidak ada kontribusi pada filter ini.
                                        Coba kata kunci lain atau ubah status
                                        untuk menelusuri berkas.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {isLoading && <QueueRefreshState />}
                                    {reviewQueue.items.map((item) => {
                                        const itemStatus =
                                            statusMeta[item.status];

                                        return (
                                            <article
                                                key={item.id}
                                                className={cn(
                                                    'group relative overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5',
                                                    selectedId === item.id &&
                                                        'border-primary bg-accent/70 shadow-md ring-2 ring-primary/20',
                                                )}
                                                data-test={`campus-contribution-row-${item.id}`}
                                            >
                                                <button
                                                    type="button"
                                                    disabled={
                                                        reviewForm.processing
                                                    }
                                                    className="grid w-full cursor-pointer gap-4 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 @min-[46rem]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] @min-[46rem]:items-center"
                                                    aria-pressed={
                                                        selectedId === item.id
                                                    }
                                                    onClick={() =>
                                                        selectItem(item)
                                                    }
                                                    data-test={`campus-contribution-select-${item.id}`}
                                                >
                                                    <div className="flex items-start gap-3.5">
                                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/70 text-primary">
                                                            <FileText className="size-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-mono text-xs font-bold text-muted-foreground">
                                                                {item.reference}
                                                            </span>
                                                            <h3 className="mt-0.5 text-lg font-bold wrap-anywhere text-foreground">
                                                                {(item.status ===
                                                                'approved'
                                                                    ? item
                                                                          .current_version
                                                                          ?.claim
                                                                    : null) ||
                                                                    item.project
                                                                        .title}
                                                            </h3>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Oleh:{' '}
                                                                <strong className="font-semibold text-foreground">
                                                                    {
                                                                        item
                                                                            .contributor
                                                                            .name
                                                                    }
                                                                </strong>
                                                            </p>
                                                            {item.status ===
                                                                'approved' && (
                                                                <div
                                                                    className="mt-2 space-y-1"
                                                                    data-test={`campus-contribution-result-${item.id}`}
                                                                >
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {
                                                                            item
                                                                                .project
                                                                                .title
                                                                        }
                                                                    </p>
                                                                    <p className="line-clamp-3 text-sm leading-6 wrap-anywhere text-foreground">
                                                                        {item
                                                                            .current_version
                                                                            ?.summary ||
                                                                            'Ringkasan versi belum tersedia.'}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0 text-xs">
                                                        <p className="font-semibold break-words text-foreground">
                                                            {item
                                                                .current_version
                                                                ?.task?.title ??
                                                                'Tugas belum tersedia'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {item.current_version
                                                                ? `Versi ${item.current_version.version_number}`
                                                                : 'Versi belum tersedia'}{' '}
                                                            •{' '}
                                                            {item.submitted_at
                                                                ? `Dikirim ${formatDate(item.submitted_at)}`
                                                                : 'Waktu kirim belum tercatat'}
                                                        </p>
                                                        <p className="mt-1.5 text-muted-foreground">
                                                            {
                                                                itemStatus.description
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 @min-[46rem]:flex-col @min-[46rem]:items-end">
                                                        <StatusChip
                                                            status={item.status}
                                                        />
                                                        <span
                                                            className={`text-xs font-semibold ${
                                                                selectedId ===
                                                                item.id
                                                                    ? 'text-primary'
                                                                    : 'text-muted-foreground group-hover:text-primary'
                                                            }`}
                                                        >
                                                            {selectedId ===
                                                            item.id
                                                                ? 'Berkas dipilih'
                                                                : 'Buka berkas'}
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
                                aria-label="Paginasi antrean validasi kontribusi"
                                className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                                    disabled={
                                        isLoading ||
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
                                    <ChevronLeft className="mr-1 size-3.5" />
                                    Sebelumnya
                                </Button>
                                <p className="font-mono text-xs font-semibold text-muted-foreground">
                                    Halaman{' '}
                                    {reviewQueue.pagination.current_page} dari{' '}
                                    {reviewQueue.pagination.last_page}
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
                        className={cn(
                            'min-w-0 xl:order-last',
                            selected !== null ? 'order-first' : 'order-last',
                        )}
                    >
                        {selected === null ? (
                            <div className="grid justify-items-center gap-3 rounded-3xl border border-border bg-white p-8 text-center shadow-sm xl:sticky xl:top-6">
                                <div className="flex size-12 items-center justify-center rounded-3xl bg-accent/70 text-primary">
                                    <UserRoundCheck
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                </div>
                                <h2 className="text-base font-bold text-foreground">
                                    Pilih kontribusi untuk ditinjau
                                </h2>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Klik salah satu baris kontribusi untuk
                                    memeriksa deskripsi tugas, klaim hasil, dan
                                    tautan bukti privat.
                                </p>
                            </div>
                        ) : (
                            <div
                                className="grid min-w-0 gap-5 rounded-3xl border border-primary/15 bg-white p-4 shadow-md sm:p-5 xl:sticky xl:top-6"
                                data-test="campus-contribution-docket"
                            >
                                {(stale || commandBlocked || needsCheck) && (
                                    <div
                                        role="alert"
                                        className="grid gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6"
                                        data-test="campus-contribution-recovery"
                                    >
                                        <p>
                                            Keputusan ditahan. Catatan tetap
                                            ada. Periksa antrean lalu gunakan
                                            berkas terbaru secara eksplisit.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-auto min-h-11 whitespace-normal"
                                            onClick={refreshQueue}
                                            disabled={
                                                isLoading ||
                                                reviewForm.processing
                                            }
                                        >
                                            Periksa antrean terbaru
                                        </Button>
                                        {!needsCheck && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-auto min-h-11 whitespace-normal"
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            'Gunakan berkas terbaru dan kosongkan catatan keputusan yang belum disimpan?',
                                                        )
                                                    ) {
                                                        reviewForm.clearErrors();
                                                        reviewForm.setData({
                                                            decision:
                                                                'approved',
                                                            expected_version:
                                                                selected
                                                                    .current_version
                                                                    ?.version_number ??
                                                                0,
                                                            expected_revision:
                                                                selected.revision,
                                                            reason: null,
                                                            note: null,
                                                        });
                                                        setCommandBlocked(
                                                            false,
                                                        );
                                                        setActionError(null);
                                                    }
                                                }}
                                                data-test="campus-contribution-use-latest"
                                            >
                                                Gunakan berkas terbaru
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {/* Docket Header */}
                                <header className="border-b border-border pb-4">
                                    <span className="font-mono text-xs font-bold text-primary">
                                        {selected.reference}
                                    </span>
                                    <h2
                                        id="campus-review-decision-title"
                                        tabIndex={-1}
                                        className="mt-1 text-lg font-bold wrap-anywhere text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        {version?.claim ??
                                            selected.project.title}
                                    </h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <StatusChip status={selected.status} />
                                        <span className="text-xs text-muted-foreground">
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
                                            className="size-4 text-primary"
                                        />
                                        <h3
                                            id="contribution-provenance-title"
                                            className="text-sm font-semibold text-foreground"
                                        >
                                            Konteks versi
                                        </h3>
                                    </div>
                                    <dl className="space-y-1.5 rounded-xl border border-border bg-accent/35 p-3 text-xs">
                                        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                                            <dt className="text-muted-foreground">
                                                Tugas
                                            </dt>
                                            <dd className="font-semibold wrap-anywhere text-foreground">
                                                {version?.task?.title ??
                                                    'Belum ada tugas'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <dt className="text-muted-foreground">
                                                Versi Aktif
                                            </dt>
                                            <dd className="font-semibold wrap-anywhere text-foreground">
                                                {version === null
                                                    ? 'Belum tersedia'
                                                    : `Versi ${version.version_number}`}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <dt className="text-muted-foreground">
                                                Diperbarui
                                            </dt>
                                            <dd className="text-foreground">
                                                {formatDate(
                                                    selected.updated_at,
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </section>

                                {/* Version Claim & Summary */}
                                {version && (
                                    <>
                                        <section
                                            aria-labelledby="contribution-claim-title"
                                            className="space-y-2 rounded-xl border border-border bg-accent/35 p-3 text-sm leading-6"
                                        >
                                            <h3
                                                id="contribution-claim-title"
                                                className="font-bold text-foreground"
                                            >
                                                Klaim & Ringkasan Kontribusi
                                            </h3>
                                            <p className="leading-relaxed font-semibold text-foreground">
                                                {version.claim}
                                            </p>
                                            <p className="leading-relaxed text-muted-foreground">
                                                {version.summary}
                                            </p>
                                            <p className="border-l-2 border-blue-400 pl-2 text-muted-foreground italic">
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
                                                    className="text-sm font-semibold text-foreground"
                                                >
                                                    Bukti privat
                                                </h3>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {version.evidence.length}{' '}
                                                    berkas
                                                </span>
                                            </div>
                                            {version.evidence.length === 0 ? (
                                                <p className="rounded-xl border border-border bg-accent/35 p-3 text-center text-xs text-muted-foreground">
                                                    Tidak ada bukti yang
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
                                                                    className="rounded-xl border border-border bg-accent/35 p-3 text-xs"
                                                                >
                                                                    <div className="flex items-start gap-2.5">
                                                                        <FileCheck2
                                                                            aria-hidden="true"
                                                                            className="mt-0.5 size-4 shrink-0 text-verified-subtle-foreground"
                                                                        />
                                                                        <div className="min-w-0">
                                                                            <p className="font-bold break-words text-foreground">
                                                                                {attachment?.original_name ??
                                                                                    evidence.source_label}
                                                                            </p>
                                                                            {attachment && (
                                                                                <p className="font-mono text-xs text-muted-foreground">
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
                                                                        <p className="mt-1.5 pl-6 text-muted-foreground">
                                                                            {
                                                                                evidence.notes
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    {!evidence.available && (
                                                                        <p className="mt-2 pl-6 text-xs leading-5 text-muted-foreground">
                                                                            Bukti
                                                                            tidak
                                                                            tersedia
                                                                            untuk
                                                                            dibuka.
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
                                                                                    className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-primary hover:underline"
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
                                                                                    className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-primary hover:underline"
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
                                            className="size-4 text-primary"
                                        />
                                        <h3
                                            id="contribution-history-title"
                                            className="text-sm font-semibold text-foreground"
                                        >
                                            Riwayat Keputusan
                                        </h3>
                                    </div>
                                    <ReviewHistory reviews={selected.reviews} />
                                </section>

                                {/* Decision Form */}
                                {selected.status === 'pending' && version ? (
                                    <form
                                        className="grid gap-4 border-t border-border pt-4"
                                        onSubmit={submitReview}
                                        data-test="campus-contribution-review-form"
                                    >
                                        <fieldset
                                            disabled={blocked}
                                            className="grid gap-2"
                                        >
                                            <legend className="text-xs font-bold tracking-wide text-foreground">
                                                Keputusan peninjau
                                            </legend>
                                            {(
                                                Object.keys(
                                                    decisionMeta,
                                                ) as ReviewDecision[]
                                            ).map((decision) => (
                                                <label
                                                    key={decision}
                                                    className={cn(
                                                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 motion-reduce:transition-none',
                                                        decisionMeta[decision]
                                                            .className,
                                                        selectedDecision ===
                                                            decision &&
                                                            'ring-2 ring-primary/20',
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
                                                        className="mt-0.5 size-4 cursor-pointer accent-primary"
                                                    />
                                                    <div>
                                                        <span className="font-bold text-foreground">
                                                            {
                                                                decisionMeta[
                                                                    decision
                                                                ].label
                                                            }
                                                        </span>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
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
                                                className="text-xs font-semibold text-correction-subtle-foreground"
                                            >
                                                {decisionError}
                                            </p>
                                        )}

                                        {/* Alasan */}
                                        <div className="grid gap-1.5">
                                            <label
                                                htmlFor="campus-contribution-review-reason"
                                                className="text-sm font-semibold text-foreground"
                                            >
                                                Alasan Keputusan
                                                {selectedDecision !==
                                                    'approved' && (
                                                    <span className="text-correction-subtle-foreground">
                                                        {' '}
                                                        *
                                                    </span>
                                                )}
                                            </label>
                                            <textarea
                                                id="campus-contribution-review-reason"
                                                disabled={blocked}
                                                value={
                                                    reviewForm.data.reason ?? ''
                                                }
                                                maxLength={1000}
                                                rows={3}
                                                required={
                                                    selectedDecision !==
                                                    'approved'
                                                }
                                                aria-invalid={Boolean(
                                                    reasonError,
                                                )}
                                                onChange={(event) =>
                                                    reviewForm.setData(
                                                        'reason',
                                                        event.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    campusControlClass,
                                                    'resize-y',
                                                )}
                                                placeholder="Tulis alasan faktual yang membantu mahasiswa..."
                                            />
                                            <p className="text-right font-mono text-xs text-muted-foreground">
                                                {
                                                    (
                                                        reviewForm.data
                                                            .reason ?? ''
                                                    ).length
                                                }{' '}
                                                / 1.000
                                            </p>
                                            {reasonError && (
                                                <p
                                                    id="campus-review-reason-error"
                                                    role="alert"
                                                    className="text-xs font-semibold text-correction-subtle-foreground"
                                                >
                                                    {reasonError}
                                                </p>
                                            )}
                                        </div>

                                        {/* Catatan internal */}
                                        <div className="grid gap-1.5">
                                            <label
                                                htmlFor="campus-contribution-review-note"
                                                className="text-sm font-semibold text-foreground"
                                            >
                                                Catatan untuk pemilik (opsional)
                                            </label>
                                            <textarea
                                                id="campus-contribution-review-note"
                                                disabled={blocked}
                                                value={
                                                    reviewForm.data.note ?? ''
                                                }
                                                maxLength={1000}
                                                rows={2}
                                                aria-invalid={Boolean(
                                                    noteError,
                                                )}
                                                onChange={(event) =>
                                                    reviewForm.setData(
                                                        'note',
                                                        event.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    campusControlClass,
                                                    'resize-y',
                                                )}
                                                placeholder="Catatan ini dapat dibaca mahasiswa pemilik..."
                                            />
                                            {noteError && (
                                                <p
                                                    id="campus-review-note-error"
                                                    role="alert"
                                                    className="text-xs font-semibold text-correction-subtle-foreground"
                                                >
                                                    {noteError}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid gap-2 border-t border-border pt-3">
                                            <Button
                                                type="submit"
                                                variant={
                                                    selectedDecision ===
                                                    'rejected'
                                                        ? 'destructive'
                                                        : 'default'
                                                }
                                                className={`min-h-11 cursor-pointer rounded-xl text-sm font-semibold text-white shadow-sm ${
                                                    selectedDecision ===
                                                    'approved'
                                                        ? 'bg-emerald-700 hover:bg-emerald-800'
                                                        : selectedDecision ===
                                                            'revision'
                                                          ? 'bg-amber-700 hover:bg-amber-800'
                                                          : 'bg-rose-600 hover:bg-rose-700'
                                                }`}
                                                disabled={blocked}
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
                                                    : decisionMeta[
                                                          selectedDecision
                                                      ].label}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="min-h-11 cursor-pointer rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent"
                                                disabled={blocked}
                                                onClick={() => {
                                                    if (
                                                        (reviewForm.data
                                                            .reason ||
                                                            reviewForm.data
                                                                .note) &&
                                                        !window.confirm(
                                                            'Tutup berkas dan buang catatan keputusan yang belum disimpan?',
                                                        )
                                                    ) {
                                                        return;
                                                    }

                                                    setSelectedId(null);
                                                    window.setTimeout(() => {
                                                        document
                                                            .querySelector<HTMLButtonElement>(
                                                                `[data-test="campus-contribution-select-${selectedId}"]`,
                                                            )
                                                            ?.focus();
                                                    }, 0);
                                                }}
                                            >
                                                Tutup berkas
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-accent/35 p-3.5 text-xs text-muted-foreground">
                                        <LockKeyhole className="size-4 shrink-0 text-muted-foreground" />
                                        <span>
                                            Mode baca. Kontribusi ini sudah
                                            memiliki keputusan dan tidak
                                            menerima perubahan baru.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            )}
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
    const [accessUnavailable, setAccessUnavailable] = useState(false);
    const [searchDraft, setSearchDraft] = useState(filters.q ?? '');
    const filterChangeGuardRef = useRef<(() => boolean) | null>(null);
    const lastFilterQuery = useRef<ReviewFilters>(filters);

    useEffect(() => {
        const frame = requestAnimationFrame(() =>
            setSearchDraft(filters.q ?? ''),
        );

        return () => cancelAnimationFrame(frame);
    }, [filters.q]);

    function updateFilters(next: Partial<ReviewFilters>): void {
        if (isFilterLoading || filterChangeGuardRef.current?.() === false) {
            return;
        }

        const merged = { ...filters, ...next };
        lastFilterQuery.current = merged;

        setFilterLoading(true);
        setFilterError(null);
        router.get(
            campusContributionsIndex({ institution: institution.id }),
            {
                status: merged.status,
                q: merged.q?.trim() || undefined,
                sort: merged.sort,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setFilterError(null);
                    setAccessUnavailable(false);
                },
                onError: () => {
                    setFilterError(
                        'Filter belum diterapkan. Data antrean yang terlihat tetap aman. Coba lagi.',
                    );
                },
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                    }

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

            <AppPage>
                <div
                    className="space-y-6"
                    data-test="campus-contribution-review-root"
                >
                    <CampusOperationHeader
                        theme="validation"
                        title="Validasi kontribusi"
                        description="Periksa versi pekerjaan dan bukti privat, lalu berikan keputusan yang membantu mahasiswa memahami langkah berikutnya."
                        institution={institution.name}
                        icon={FileCheck2}
                        eyebrow="Meja peninjauan"
                    />
                    <Deferred
                        data="reviewQueue"
                        fallback={
                            <div
                                aria-busy="true"
                                className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                            >
                                <p role="status" className="sr-only">
                                    Memuat ringkasan validasi.
                                </p>
                                {[0, 1, 2, 3].map((item) => (
                                    <Skeleton
                                        key={item}
                                        className="h-16 w-full rounded-3xl"
                                    />
                                ))}
                            </div>
                        }
                    >
                        {!accessUnavailable && (
                            <SummaryRail reviewQueue={reviewQueue!} />
                        )}
                    </Deferred>
                    {/* Filter error */}
                    {filterError && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-correction/30 bg-correction-subtle p-4 text-xs font-semibold text-correction-subtle-foreground shadow-sm"
                            data-test="campus-contribution-filter-error"
                        >
                            <span>{filterError}</span>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 cursor-pointer rounded-xl bg-white text-xs disabled:cursor-not-allowed"
                                disabled={isFilterLoading}
                                onClick={() =>
                                    updateFilters(lastFilterQuery.current)
                                }
                                data-test="campus-contribution-filter-error-retry"
                            >
                                {isFilterLoading ? (
                                    <Spinner className="mr-1 size-3" />
                                ) : (
                                    <RefreshCw className="mr-1 size-3 text-muted-foreground" />
                                )}
                                Coba lagi
                            </Button>
                        </div>
                    )}

                    <nav
                        aria-label="Pilihan validasi kontribusi"
                        className="flex flex-wrap gap-2"
                        data-test="campus-contribution-views"
                    >
                        <Button
                            type="button"
                            variant={
                                filters.status === 'pending'
                                    ? 'default'
                                    : 'outline'
                            }
                            className="min-h-11"
                            disabled={isFilterLoading}
                            aria-pressed={filters.status === 'pending'}
                            onClick={() =>
                                updateFilters({
                                    status: 'pending',
                                    sort: 'oldest',
                                })
                            }
                        >
                            Pengajuan menunggu
                        </Button>
                        <Button
                            type="button"
                            variant={
                                filters.status === 'approved'
                                    ? 'default'
                                    : 'outline'
                            }
                            className="min-h-11"
                            disabled={isFilterLoading}
                            aria-pressed={filters.status === 'approved'}
                            onClick={() =>
                                updateFilters({
                                    status: 'approved',
                                    sort: 'newest',
                                })
                            }
                        >
                            Hasil disetujui
                        </Button>
                        <p className="basis-full text-sm leading-6 text-muted-foreground">
                            {filters.status === 'approved'
                                ? 'Temukan pekerjaan individual yang telah disetujui pada versi yang ditinjau. Ringkasan di atas mencakup seluruh berkas yang dapat ditinjau; hasil di bawah mengikuti pencarian.'
                                : 'Mulai dari pengajuan terlama. Ringkasan di atas mencakup seluruh berkas yang dapat ditinjau; hasil di bawah mengikuti filter.'}
                        </p>
                    </nav>

                    {/* Filter Card */}
                    <section
                        aria-label="Filter antrean validasi kontribusi"
                        aria-busy={isFilterLoading}
                        className="grid gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5"
                    >
                        <form
                            className="grid gap-2 sm:col-span-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateFilters({ q: searchDraft.trim() });
                            }}
                            data-test="campus-contribution-search-form"
                        >
                            <label
                                htmlFor="contribution-review-search"
                                className="text-sm font-semibold"
                            >
                                Cari pengaju atau pekerjaan
                            </label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    id="contribution-review-search"
                                    value={searchDraft}
                                    onChange={(event) =>
                                        setSearchDraft(event.target.value)
                                    }
                                    maxLength={100}
                                    disabled={isFilterLoading}
                                    className="min-h-11 min-w-0 flex-1 text-base"
                                    aria-describedby="contribution-review-search-help"
                                    placeholder="Nama tampilan, proyek, judul atau ringkasan karya"
                                    data-test="campus-contribution-search"
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="min-h-11"
                                    disabled={isFilterLoading}
                                >
                                    <Search aria-hidden="true" />
                                    Cari kontribusi
                                </Button>
                            </div>
                            <p
                                id="contribution-review-search-help"
                                className="text-xs leading-5 text-muted-foreground"
                            >
                                Mencari versi yang sudah diajukan dalam
                                universitas ini. Kosongkan pencarian untuk
                                melihat semua hasil sesuai status.
                            </p>
                        </form>
                        <div className="space-y-1.5">
                            <label
                                htmlFor="filter-status"
                                className="text-sm font-semibold text-foreground"
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
                                className={cn(
                                    campusControlClass,
                                    'cursor-pointer',
                                )}
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
                                className="text-sm font-semibold text-foreground"
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
                                className={cn(
                                    campusControlClass,
                                    'cursor-pointer',
                                )}
                                data-test="campus-contribution-sort-filter"
                            >
                                <option value="oldest">
                                    Pengajuan terlama
                                </option>
                                <option value="newest">
                                    Pengajuan terbaru
                                </option>
                            </select>
                        </div>
                    </section>

                    <CampusTechnicalDetails title="Panduan keputusan dan privasi">
                        <p>
                            Periksa versi aktif dan bukti yang tersedia sebelum
                            memutuskan. Perbaikan atau penolakan memerlukan
                            alasan faktual. Bukti tetap privat dan keputusan
                            tersimpan bersama versi serta riwayat peninjauan.
                        </p>
                        <p className="mt-3">
                            Sepakati peninjau utama, cadangan dan jadwal
                            pemeriksaan bersama tim kampus. Gunakan notifikasi
                            aplikasi untuk pengajuan baru. Waktu kirim berasal
                            dari pengajuan versi ini; riwayat yang belum
                            tercatat tidak diberi tanggal perkiraan. Halaman ini
                            tidak menetapkan SLA atau jadwal kampus.
                        </p>
                    </CampusTechnicalDetails>
                    {/* Review Workspace with Deferred queue */}
                    <Deferred data="reviewQueue" fallback={<QueueSkeleton />}>
                        {!accessUnavailable ? (
                            <ReviewWorkspace
                                institution={institution}
                                filters={filters}
                                reviewQueue={reviewQueue!}
                                isFilterLoading={isFilterLoading}
                                onAccessUnavailable={() =>
                                    setAccessUnavailable(true)
                                }
                                filterChangeGuardRef={filterChangeGuardRef}
                            />
                        ) : (
                            <section className="rounded-3xl border border-border bg-white p-5">
                                <h2 className="text-lg font-bold">
                                    Akses validasi tidak tersedia
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Data sebelumnya disembunyikan. Periksa izin
                                    institusi lalu muat ulang filter.
                                </p>
                                <Button
                                    variant="outline"
                                    disabled={isFilterLoading}
                                    onClick={() => updateFilters({})}
                                    className="mt-4"
                                >
                                    Muat ulang antrean
                                </Button>
                            </section>
                        )}
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
