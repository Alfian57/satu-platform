import { Deferred, Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    FileSpreadsheet,
    FileWarning,
    Lock,
    LockKeyhole,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    UnlockKeyhole,
    UserRound,
    UserRoundCheck,
    XCircle,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { CampusOperationHeader } from '@/components/campus-operation-layout';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { store as storeDecision } from '@/routes/campus/affiliations/decisions';
import {
    destroy as releaseLock,
    store as acquireLock,
} from '@/routes/campus/affiliations/locks';

type MatchResult =
    | 'exact'
    | 'no_match'
    | 'ambiguous'
    | 'inactive'
    | 'roster_unavailable'
    | 'stale_roster';

type Decision = 'approve' | 'request_revision' | 'reject';

type ReasonCode =
    | 'records_confirmed'
    | 'nim_correction_required'
    | 'phone_correction_required'
    | 'supporting_evidence_required'
    | 'not_affiliated';

type ReviewItem = {
    id: number;
    nim: string;
    phone: string | null;
    matchResult: MatchResult;
    status: 'pending_review';
    version: number;
    submittedAt: string;
    isStale: boolean;
    rosterSemester: string | null;
    lock: {
        ownedByCurrentUser: boolean;
        expiresAt: string | null;
    } | null;
};

type ReviewQueue = {
    items: ReviewItem[];
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    summary: {
        total: number;
        stale: number;
        exact: number;
        mismatch: number;
    };
    activeRoster: {
        semester: string;
        activatedAt: string | null;
    } | null;
};

type Filters = {
    match: MatchResult | null;
    stale: boolean | null;
    sort: 'oldest' | 'newest';
};

type Props = {
    institution: {
        id: number;
        name: string;
    };
    filters: Filters;
    reviewQueue?: ReviewQueue;
    reviewOutcome: 'lock_acquired' | 'lock_released' | 'decision_saved' | null;
    reviewIssue: 'lock_conflict' | 'stale_decision' | null;
};

const matchCopy: Record<MatchResult, string> = {
    exact: 'Cocok persis',
    no_match: 'Tidak ditemukan',
    ambiguous: 'Perlu konfirmasi',
    inactive: 'Status tidak aktif',
    roster_unavailable: 'Roster belum tersedia',
    stale_roster: 'Roster berubah',
};

const matchClassName: Record<MatchResult, string> = {
    exact: 'border-verified/20 bg-verified-subtle text-verified-subtle-foreground',
    no_match:
        'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
    ambiguous:
        'border-pending/20 bg-pending-subtle text-pending-subtle-foreground',
    inactive:
        'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
    roster_unavailable: 'border-border bg-background text-muted-foreground',
    stale_roster:
        'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
};

const decisionCopy: Record<Decision, string> = {
    approve: 'Setujui afiliasi',
    request_revision: 'Minta perbaikan',
    reject: 'Tolak afiliasi',
};

const reasonsByDecision: Record<
    Decision,
    Array<{ value: ReasonCode; label: string }>
> = {
    approve: [{ value: 'records_confirmed', label: 'Data sudah dikonfirmasi' }],
    request_revision: [
        { value: 'nim_correction_required', label: 'NIM perlu diperbaiki' },
        {
            value: 'phone_correction_required',
            label: 'Nomor WhatsApp perlu diperbaiki',
        },
        {
            value: 'supporting_evidence_required',
            label: 'Bukti pendukung diperlukan',
        },
    ],
    reject: [{ value: 'not_affiliated', label: 'Tidak terafiliasi' }],
};

const outcomeCopy: Record<NonNullable<Props['reviewOutcome']>, string> = {
    lock_acquired: 'Berkas review sudah dikunci untukmu selama 30 menit.',
    lock_released: 'Kunci review sudah dilepas.',
    decision_saved: 'Keputusan tersimpan dan riwayat audit sudah diperbarui.',
};

function formatDate(value: string | null): string {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

const controlClassName =
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-white px-3 text-base text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

function MatchBadge({ result }: { result: MatchResult }) {
    const Icon =
        result === 'exact'
            ? CheckCircle2
            : result === 'roster_unavailable'
              ? FileSpreadsheet
              : result === 'ambiguous'
                ? AlertTriangle
                : FileWarning;

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs leading-5 font-semibold',
                matchClassName[result],
            )}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {matchCopy[result]}
        </span>
    );
}

function QueueSkeleton() {
    return (
        <div
            aria-busy="true"
            className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
            data-test="affiliation-queue-skeleton"
        >
            <p className="sr-only" role="status">
                Memuat antrean afiliasi.
            </p>
            <div aria-hidden="true" className="min-w-0 space-y-3">
                <Skeleton className="h-11 w-52 max-w-full motion-reduce:animate-none" />
                {[1, 2, 3].map((key) => (
                    <div
                        key={key}
                        className="rounded-3xl border border-border bg-white p-5"
                    >
                        <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
                        <Skeleton className="mt-3 h-5 w-3/4 motion-reduce:animate-none" />
                        <Skeleton className="mt-3 h-7 w-44 max-w-full rounded-full motion-reduce:animate-none" />
                        <Skeleton className="mt-4 h-11 w-36 motion-reduce:animate-none" />
                    </div>
                ))}
            </div>
            <div aria-hidden="true" className="min-w-0 space-y-4">
                <Skeleton className="h-44 w-full rounded-3xl motion-reduce:animate-none" />
                <Skeleton className="h-64 w-full rounded-3xl motion-reduce:animate-none" />
            </div>
        </div>
    );
}

function SummaryRail({ reviewQueue }: { reviewQueue: ReviewQueue }) {
    return (
        <div className="space-y-4">
            <section
                aria-labelledby="queue-summary-title"
                className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
            >
                <h2
                    id="queue-summary-title"
                    className="flex items-center gap-2 text-base font-semibold"
                >
                    <ClipboardCheck
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    Ringkasan antrean
                </h2>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                    {reviewQueue.summary.total}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                        berkas menunggu
                    </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Seluruh antrean kampus, bukan hanya hasil filter.
                </p>
                <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                    {[
                        {
                            label: 'Perlu pemeriksaan',
                            value: reviewQueue.summary.mismatch,
                        },
                        {
                            label: 'Roster berubah',
                            value: reviewQueue.summary.stale,
                        },
                        {
                            label: 'Cocok persis',
                            value: reviewQueue.summary.exact,
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="flex items-baseline justify-between gap-3"
                        >
                            <dt className="text-muted-foreground">
                                {item.label}
                            </dt>
                            <dd className="font-label font-semibold">
                                {item.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Roster berubah dapat termasuk dalam kategori hasil
                    pencocokan lainnya.
                </p>
            </section>
            <section
                aria-labelledby="roster-context-title"
                className="rounded-3xl border border-primary/10 bg-accent/45 p-4 sm:p-5"
            >
                <h2
                    id="roster-context-title"
                    className="flex items-center gap-2 text-base font-semibold"
                >
                    <FileSpreadsheet
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />{' '}
                    Roster aktif
                </h2>
                {reviewQueue.activeRoster ? (
                    <dl className="mt-3 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Semester
                            </dt>
                            <dd className="mt-1 font-semibold break-words">
                                {reviewQueue.activeRoster.semester}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Diaktifkan
                            </dt>
                            <dd className="mt-1">
                                {formatDate(
                                    reviewQueue.activeRoster.activatedAt,
                                )}
                            </dd>
                        </div>
                    </dl>
                ) : (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Belum ada roster aktif. Permintaan tetap tercatat untuk
                        pemeriksaan manual.
                    </p>
                )}
            </section>
            <section aria-labelledby="lock-guidance-title" className="px-1">
                <h2
                    id="lock-guidance-title"
                    className="flex items-center gap-2 text-sm font-semibold"
                >
                    <Lock aria-hidden="true" className="size-4 text-primary" />{' '}
                    Satu berkas, satu peninjau
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Ambil kunci sebelum menyimpan keputusan. Kunci berlaku 30
                    menit untuk mencegah benturan antaroperator.
                </p>
            </section>
        </div>
    );
}

function ReviewQueueRegion({
    institution,
    filters,
    reviewQueue,
    isQueueLoading,
    onQueueLoadingChange,
    onRequestError,
    onRequestSuccess,
    isForbidden,
}: {
    institution: Props['institution'];
    filters: Filters;
    reviewQueue: ReviewQueue;
    isQueueLoading: boolean;
    onQueueLoadingChange: (isLoading: boolean) => void;
    onRequestError: (forbidden: boolean) => void;
    onRequestSuccess: () => void;
    isForbidden: boolean;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [decision, setDecision] = useState<Decision>('approve');
    const [reasonCode, setReasonCode] =
        useState<ReasonCode>('records_confirmed');
    const [note, setNote] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const decisionHeadingRef = useRef<HTMLHeadingElement>(null);
    const queueHeadingRef = useRef<HTMLHeadingElement>(null);
    const selected = useMemo(() => {
        if (isForbidden) {
            return null;
        }

        return (
            reviewQueue.items.find(
                (item) =>
                    item.id === selectedId &&
                    item.lock?.ownedByCurrentUser === true,
            ) ?? null
        );
    }, [isForbidden, reviewQueue.items, selectedId]);

    const selectedReference = selected?.id;
    useEffect(() => {
        if (selectedReference !== undefined) {
            decisionHeadingRef.current?.focus();
        }
    }, [selectedReference]);

    const requestFeedback = {
        onSuccess: onRequestSuccess,
        onError: (errors: Record<string, string>) => {
            setFieldErrors(errors);
            onRequestError(false);
        },
        onNetworkError: () => {
            onRequestError(false);

            return false;
        },
        onHttpException: (response: { status: number }) => {
            onRequestError(response.status === 403 || response.status === 404);

            return false;
        },
    };

    function updateFilters(next: Partial<Filters> & { page?: number }) {
        const merged = { ...filters, ...next };

        onQueueLoadingChange(true);
        router.get(
            affiliationIndex({ institution: institution.id }),
            {
                match: merged.match ?? undefined,
                stale: merged.stale === null ? undefined : merged.stale ? 1 : 0,
                sort: merged.sort,
                page: next.page ?? 1,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                ...requestFeedback,
                onFinish: () => onQueueLoadingChange(false),
            },
        );
    }

    function refreshQueue() {
        onQueueLoadingChange(true);
        router.reload({
            only: ['reviewQueue'],
            ...requestFeedback,
            onFinish: () => onQueueLoadingChange(false),
        });
    }

    function beginReview(item: ReviewItem) {
        if (
            isQueueLoading ||
            isForbidden ||
            processingId !== null ||
            item.isStale ||
            (item.lock && !item.lock.ownedByCurrentUser)
        ) {
            return;
        }

        if (item.lock?.ownedByCurrentUser) {
            if (selectedId !== item.id) {
                setNote('');
                changeDecision('approve');
                setFieldErrors({});
            }

            setSelectedId(item.id);

            return;
        }

        setFieldErrors({});
        setProcessingId(item.id);
        onQueueLoadingChange(true);
        router.post(
            acquireLock({
                institution: institution.id,
                affiliationRequest: item.id,
            }),
            {},
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                ...requestFeedback,
                onSuccess: (page) => {
                    onRequestSuccess();

                    if (page.props.reviewOutcome === 'lock_acquired') {
                        if (selectedId !== item.id) {
                            setNote('');
                            changeDecision('approve');
                        }

                        setSelectedId(item.id);
                    }
                },
                onFinish: () => {
                    setProcessingId(null);
                    onQueueLoadingChange(false);
                },
            },
        );
    }

    function abandonReview() {
        if (selected === null || isQueueLoading || processingId !== null) {
            return;
        }

        setFieldErrors({});
        setProcessingId(selected.id);
        onQueueLoadingChange(true);
        router.delete(
            releaseLock({
                institution: institution.id,
                affiliationRequest: selected.id,
            }),
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                ...requestFeedback,
                onSuccess: (page) => {
                    onRequestSuccess();

                    if (page.props.reviewOutcome === 'lock_released') {
                        setSelectedId(null);
                        requestAnimationFrame(() =>
                            queueHeadingRef.current?.focus(),
                        );
                    }
                },
                onFinish: () => {
                    setProcessingId(null);
                    onQueueLoadingChange(false);
                },
            },
        );
    }

    function changeDecision(nextDecision: Decision) {
        setDecision(nextDecision);
        setReasonCode(reasonsByDecision[nextDecision][0].value);
    }

    function submitDecision(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            selected === null ||
            !selected.lock?.ownedByCurrentUser ||
            isQueueLoading ||
            processingId !== null
        ) {
            return;
        }

        setFieldErrors({});
        setProcessingId(selected.id);
        onQueueLoadingChange(true);
        router.post(
            storeDecision({
                institution: institution.id,
                affiliationRequest: selected.id,
            }),
            {
                decision,
                reason_code: reasonCode,
                expected_version: selected.version,
                note: note.trim() === '' ? null : note,
            },
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                ...requestFeedback,
                onSuccess: (page) => {
                    onRequestSuccess();

                    if (page.props.reviewOutcome === 'decision_saved') {
                        setSelectedId(null);
                        setNote('');
                        changeDecision('approve');
                        requestAnimationFrame(() =>
                            queueHeadingRef.current?.focus(),
                        );
                    }
                },
                onFinish: () => {
                    setProcessingId(null);
                    onQueueLoadingChange(false);
                },
            },
        );
    }

    if (isForbidden) {
        return (
            <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                <ShieldCheck
                    aria-hidden="true"
                    className="size-7 text-primary"
                />
                <h2 className="mt-3 text-lg font-semibold">
                    Akses antrean tidak tersedia
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Data sebelumnya disembunyikan. Periksa kembali akses pada
                    kampus ini dengan memuat ulang.
                </p>
            </section>
        );
    }

    const isProcessing = processingId !== null;
    const isDisabled = isQueueLoading || isProcessing;

    return (
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section
                aria-labelledby="queue-title"
                className="@container min-w-0 space-y-4"
                aria-busy={isQueueLoading}
            >
                <div className="flex flex-wrap items-start justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2
                            id="queue-title"
                            ref={queueHeadingRef}
                            tabIndex={-1}
                            className="rounded-lg text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                            Antrean pemeriksaan
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {reviewQueue.pagination.total} berkas sesuai filter.
                            Periksa konteks sebelum memutuskan.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        disabled={isDisabled}
                        onClick={refreshQueue}
                    >
                        {isQueueLoading ? (
                            <Spinner aria-hidden="true" />
                        ) : (
                            <RefreshCw aria-hidden="true" className="size-4" />
                        )}{' '}
                        Muat ulang
                    </Button>
                </div>
                {isQueueLoading && (
                    <p
                        role="status"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Memperbarui antrean. Berkas sebelumnya tetap
                        ditampilkan.
                    </p>
                )}
                {reviewQueue.items.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-white px-5 py-8 text-center shadow-sm">
                        <DashboardArchiveArt className="mx-auto size-24" />
                        <h3 className="mt-3 text-lg font-semibold">
                            Tidak ada berkas pada filter ini
                        </h3>
                        <p className="mx-auto mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                            Ubah filter atau muat ulang untuk memeriksa
                            permohonan yang baru masuk.
                        </p>
                    </div>
                ) : (
                    <div className="grid min-w-0 gap-3 @min-[64rem]:grid-cols-2">
                        {reviewQueue.items.map((item) => {
                            const lockedByOther =
                                item.lock !== null &&
                                !item.lock.ownedByCurrentUser;
                            const isSelected = selected?.id === item.id;

                            return (
                                <article
                                    key={item.id}
                                    aria-label={`Berkas AF-${item.id}`}
                                    className={cn(
                                        'min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5',
                                        isSelected &&
                                            'border-primary/40 bg-accent/25 ring-1 ring-primary/20',
                                    )}
                                    data-test="affiliation-queue-row"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-accent text-primary">
                                                <UserRound
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-label text-xs text-muted-foreground">
                                                    PERMOHONAN AFILIASI
                                                </p>
                                                <h3 className="mt-1 text-base font-semibold">
                                                    Berkas AF-{item.id}
                                                </h3>
                                            </div>
                                        </div>
                                        <MatchBadge result={item.matchResult} />
                                    </div>
                                    <dl className="mt-4 grid min-w-0 gap-3 border-y border-border py-3 sm:grid-cols-2">
                                        <div className="min-w-0">
                                            <dt className="text-xs text-muted-foreground">
                                                NIM
                                            </dt>
                                            <dd className="mt-1 font-label text-sm font-medium break-words">
                                                {item.nim}
                                            </dd>
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="text-xs text-muted-foreground">
                                                Nomor WhatsApp
                                            </dt>
                                            <dd className="mt-1 font-label text-sm font-medium break-words">
                                                {item.phone ?? 'Belum tersedia'}
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 basis-48">
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                Diajukan{' '}
                                                {formatDate(item.submittedAt)}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
                                                {item.rosterSemester
                                                    ? `Roster ${item.rosterSemester}`
                                                    : 'Tanpa roster aktif'}{' '}
                                                . Versi {item.version}
                                            </p>
                                            {item.isStale && (
                                                <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 font-semibold text-correction-subtle-foreground">
                                                    <RotateCcw
                                                        aria-hidden="true"
                                                        className="mt-0.5 size-3.5 shrink-0"
                                                    />
                                                    Roster berubah. Permohonan
                                                    perlu diajukan ulang.
                                                </p>
                                            )}
                                            {item.lock && (
                                                <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 font-semibold text-pending-subtle-foreground">
                                                    <LockKeyhole
                                                        aria-hidden="true"
                                                        className="mt-0.5 size-3.5 shrink-0"
                                                    />
                                                    {item.lock
                                                        .ownedByCurrentUser
                                                        ? 'Kunci tinjauanmu aktif.'
                                                        : 'Sedang ditinjau operator lain.'}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant={
                                                isSelected
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="h-11 shrink-0"
                                            disabled={
                                                isDisabled ||
                                                item.isStale ||
                                                lockedByOther
                                            }
                                            onClick={() => beginReview(item)}
                                        >
                                            {processingId === item.id ? (
                                                <Spinner aria-hidden="true" />
                                            ) : item.lock
                                                  ?.ownedByCurrentUser ? (
                                                <UnlockKeyhole
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            ) : (
                                                <ClipboardCheck
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            )}
                                            {item.isStale
                                                ? 'Perlu diajukan ulang'
                                                : lockedByOther
                                                  ? 'Sedang ditinjau'
                                                  : item.lock
                                                          ?.ownedByCurrentUser
                                                    ? 'Lanjutkan tinjauan'
                                                    : 'Tinjau berkas'}
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
                {(reviewQueue.pagination.lastPage > 1 ||
                    reviewQueue.pagination.currentPage > 1) && (
                    <nav
                        aria-label="Paginasi antrean afiliasi"
                        className="flex flex-wrap items-center justify-between gap-3 px-1"
                    >
                        <p className="text-xs leading-5 text-muted-foreground">
                            Halaman {reviewQueue.pagination.currentPage} dari{' '}
                            {reviewQueue.pagination.lastPage}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={
                                    isDisabled ||
                                    reviewQueue.pagination.currentPage <= 1
                                }
                                onClick={() =>
                                    updateFilters({
                                        page:
                                            reviewQueue.pagination.currentPage -
                                            1,
                                    })
                                }
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-4"
                                />{' '}
                                Sebelumnya
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                disabled={
                                    isDisabled ||
                                    reviewQueue.pagination.currentPage >=
                                        reviewQueue.pagination.lastPage
                                }
                                onClick={() =>
                                    updateFilters({
                                        page:
                                            reviewQueue.pagination.currentPage +
                                            1,
                                    })
                                }
                            >
                                Berikutnya{' '}
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Button>
                        </div>
                    </nav>
                )}
            </section>
            <aside
                aria-label="Tinjauan dan konteks antrean"
                className={cn(
                    'min-w-0 space-y-4',
                    selected && 'order-first xl:order-last',
                )}
            >
                {selected === null ? (
                    <section className="rounded-3xl border border-primary/15 bg-linear-to-br from-accent/60 to-white p-4 shadow-sm sm:p-5">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-white text-primary">
                            <UserRoundCheck
                                aria-hidden="true"
                                className="size-5"
                            />
                        </span>
                        <h2
                            id="decision-title"
                            className="mt-3 text-lg font-bold"
                        >
                            Mulai dari satu berkas
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Pilih Tinjau berkas untuk mengambil kunci. Setelah
                            itu, periksa data sebelum memilih keputusan.
                        </p>
                        <ol className="mt-3 space-y-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                            {[
                                'Ambil kunci berkas.',
                                'Cocokkan NIM dan nomor WhatsApp dengan data mahasiswa.',
                                'Simpan keputusan beserta alasan.',
                            ].map((step, index) => (
                                <li key={step} className="flex gap-2">
                                    <span className="font-label font-semibold text-primary">
                                        {index + 1}.
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </section>
                ) : (
                    <form
                        className="min-w-0 rounded-3xl border border-primary/30 bg-white p-4 shadow-md sm:p-5"
                        onSubmit={submitDecision}
                        aria-labelledby="decision-title"
                        aria-busy={isProcessing}
                    >
                        <div className="border-b border-border pb-4">
                            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="size-4"
                                />{' '}
                                Kunci tinjauanmu aktif
                            </p>
                            <h2
                                id="decision-title"
                                ref={decisionHeadingRef}
                                tabIndex={-1}
                                className="mt-2 rounded-lg text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                            >
                                Tinjau berkas AF-{selected.id}
                            </h2>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Versi {selected.version}. Kunci berakhir{' '}
                                {formatDate(selected.lock?.expiresAt ?? null)}.
                            </p>
                            <dl className="mt-3 space-y-2 rounded-2xl bg-accent/40 p-3 text-sm">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        NIM
                                    </dt>
                                    <dd className="mt-1 font-label break-words">
                                        {selected.nim}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Nomor WhatsApp
                                    </dt>
                                    <dd className="mt-1 font-label break-words">
                                        {selected.phone ?? 'Belum tersedia'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="mb-1 text-xs text-muted-foreground">
                                        Hasil roster
                                    </dt>
                                    <dd>
                                        <MatchBadge
                                            result={selected.matchResult}
                                        />
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <fieldset
                            disabled={isDisabled}
                            className="mt-4 min-w-0 space-y-4"
                        >
                            <legend className="sr-only">
                                Keputusan dan alasan tinjauan
                            </legend>
                            <fieldset className="min-w-0 space-y-2">
                                <legend className="mb-2 text-sm font-semibold">
                                    Keputusan tinjauan
                                </legend>
                                {(Object.keys(decisionCopy) as Decision[]).map(
                                    (value) => (
                                        <label
                                            key={value}
                                            className={cn(
                                                'flex min-h-11 items-center gap-3 rounded-xl border border-border p-3 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring motion-reduce:transition-none',
                                                isDisabled
                                                    ? 'cursor-not-allowed opacity-60'
                                                    : 'cursor-pointer hover:bg-accent/40',
                                                decision === value &&
                                                    (value === 'approve'
                                                        ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                                                        : value ===
                                                            'request_revision'
                                                          ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                                                          : 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground'),
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="decision"
                                                value={value}
                                                checked={decision === value}
                                                onChange={() =>
                                                    changeDecision(value)
                                                }
                                                className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                                            />
                                            {decisionCopy[value]}
                                        </label>
                                    ),
                                )}
                            </fieldset>
                            <div className="space-y-2">
                                <label
                                    htmlFor="reason_code"
                                    className="text-sm font-semibold"
                                >
                                    Alasan keputusan
                                </label>
                                <select
                                    id="reason_code"
                                    name="reason_code"
                                    value={reasonCode}
                                    onChange={(event) =>
                                        setReasonCode(
                                            event.target.value as ReasonCode,
                                        )
                                    }
                                    className={controlClassName}
                                    aria-invalid={Boolean(
                                        fieldErrors.reason_code,
                                    )}
                                    aria-describedby={
                                        fieldErrors.reason_code
                                            ? 'affiliation-reason-error'
                                            : undefined
                                    }
                                >
                                    {reasonsByDecision[decision].map(
                                        (reason) => (
                                            <option
                                                key={reason.value}
                                                value={reason.value}
                                            >
                                                {reason.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                                {fieldErrors.reason_code && (
                                    <p
                                        id="affiliation-reason-error"
                                        className="text-sm text-correction"
                                    >
                                        {fieldErrors.reason_code}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="review_note"
                                    className="text-sm font-semibold"
                                >
                                    Catatan tambahan{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </label>
                                <textarea
                                    id="review_note"
                                    name="note"
                                    value={note}
                                    maxLength={1000}
                                    rows={3}
                                    onChange={(event) =>
                                        setNote(event.target.value)
                                    }
                                    className="w-full min-w-0 resize-y rounded-xl border border-input bg-white p-3 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Tambahkan konteks keputusan."
                                    aria-invalid={Boolean(fieldErrors.note)}
                                    aria-describedby="affiliation-note-help affiliation-note-error"
                                />
                                <p
                                    id="affiliation-note-help"
                                    className="text-right font-label text-xs text-muted-foreground"
                                >
                                    {note.length}/1.000 karakter
                                </p>
                                <p
                                    id="affiliation-note-error"
                                    className="text-sm text-correction"
                                >
                                    {fieldErrors.note}
                                </p>
                            </div>
                            {(fieldErrors.decision ||
                                fieldErrors.expected_version) && (
                                <p
                                    role="alert"
                                    className="text-sm text-correction"
                                >
                                    {fieldErrors.decision ||
                                        fieldErrors.expected_version}
                                </p>
                            )}
                            <p className="rounded-xl bg-accent/40 p-3 text-xs leading-5 text-muted-foreground">
                                {decision === 'approve'
                                    ? 'Persetujuan memverifikasi afiliasi kampus, bukan kontribusi atau portofolio.'
                                    : decision === 'request_revision'
                                      ? 'Permohonan dikembalikan untuk diperbaiki sesuai alasan dan catatanmu.'
                                      : 'Penolakan menyatakan permohonan afiliasi tidak disetujui. Pastikan alasannya sesuai.'}{' '}
                                Keputusan masuk ke riwayat peninjauan.
                            </p>
                            <div className="grid gap-2 border-t border-border pt-4">
                                <Button
                                    type="submit"
                                    data-test="affiliation-decision-submit"
                                    variant={
                                        decision === 'reject'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                    className="h-auto min-h-11 whitespace-normal"
                                >
                                    {isProcessing ? (
                                        <Spinner aria-hidden="true" />
                                    ) : decision === 'approve' ? (
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    ) : decision === 'request_revision' ? (
                                        <FileWarning
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    ) : (
                                        <XCircle
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    )}
                                    {isProcessing
                                        ? 'Memproses berkas...'
                                        : decisionCopy[decision]}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-auto min-h-11 whitespace-normal"
                                    onClick={abandonReview}
                                >
                                    Lepas kunci dan tutup
                                </Button>
                            </div>
                        </fieldset>
                    </form>
                )}
                <SummaryRail reviewQueue={reviewQueue} />
            </aside>
        </div>
    );
}

function CampusAffiliationsContent({
    institution,
    filters,
    reviewQueue,
    reviewOutcome,
    reviewIssue,
}: Props) {
    const [isQueueLoading, setQueueLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isForbidden, setForbidden] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null);

    function reportError(forbidden: boolean) {
        if (forbidden) {
            setForbidden(true);
        }

        setRequestError(
            forbidden
                ? 'Akses antrean tidak tersedia. Periksa kembali hak akses kampus dengan memuat ulang.'
                : 'Hasil permintaan belum dapat dikonfirmasi. Isian tetap tersedia. Periksa pesan isian atau muat ulang antrean sebelum mencoba kembali.',
        );
        requestAnimationFrame(() => errorRef.current?.focus());
    }
    function confirmAccess() {
        setForbidden(false);
        setRequestError(null);
    }
    function visitQueue(next: Filters) {
        if (isQueueLoading) {
            return;
        }

        setRequestError(null);
        setQueueLoading(true);
        router.get(
            affiliationIndex({ institution: institution.id }),
            {
                match: next.match ?? undefined,
                stale: next.stale === null ? undefined : next.stale ? 1 : 0,
                sort: next.sort,
            },
            {
                only: ['filters', 'reviewQueue'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: confirmAccess,
                onError: () => reportError(false),
                onNetworkError: () => {
                    reportError(false);

                    return false;
                },
                onHttpException: (response) => {
                    reportError(
                        response.status === 403 || response.status === 404,
                    );

                    return false;
                },
                onFinish: () => setQueueLoading(false),
            },
        );
    }
    function changeFilter(key: keyof Filters, value: string) {
        visitQueue({
            ...filters,
            [key]:
                key === 'stale'
                    ? value === 'all'
                        ? null
                        : value === 'true'
                    : value === 'all'
                      ? null
                      : value,
        } as Filters);
    }

    return (
        <>
            <Head title={`Afiliasi kampus | ${institution.name}`} />
            <AppPage className="max-w-none min-w-0">
                <div
                    className="space-y-4 sm:space-y-5"
                    data-test="affiliation-review-root"
                >
                    <CampusOperationHeader
                        theme="affiliations"
                        icon={ClipboardCheck}
                        title="Afiliasi kampus"
                        description="Periksa permohonan, cocokkan dengan roster, dan catat keputusan beserta alasannya."
                        institution={institution.name}
                        eyebrow="Peninjauan kampus"
                        testId="affiliation-review-header"
                    />
                    {reviewOutcome && !requestError && !isForbidden && (
                        <Alert
                            role="status"
                            className="rounded-2xl border-verified/20 bg-verified-subtle text-verified-subtle-foreground"
                        >
                            <CheckCircle2
                                aria-hidden="true"
                                className="size-4"
                            />
                            <AlertTitle>Perubahan tersimpan</AlertTitle>
                            <AlertDescription>
                                {outcomeCopy[reviewOutcome]}
                            </AlertDescription>
                        </Alert>
                    )}
                    {reviewIssue && !isForbidden && (
                        <Alert className="rounded-2xl border-pending/20 bg-pending-subtle text-pending-subtle-foreground">
                            <AlertTriangle
                                aria-hidden="true"
                                className="size-4"
                            />
                            <AlertTitle>
                                {reviewIssue === 'stale_decision'
                                    ? 'Berkas sudah berubah'
                                    : 'Berkas sedang ditinjau'}
                            </AlertTitle>
                            <AlertDescription>
                                {reviewIssue === 'stale_decision'
                                    ? 'Keputusan tidak disimpan. Muat ulang antrean dan periksa versi terbaru.'
                                    : 'Operator lain memegang kunci aktif. Pilih berkas lain atau coba lagi setelah kunci dilepas.'}
                            </AlertDescription>
                        </Alert>
                    )}
                    {requestError && (
                        <div
                            ref={errorRef}
                            tabIndex={-1}
                            role="alert"
                            className="rounded-2xl border border-correction/20 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                            <p>{requestError}</p>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-3 h-11 bg-white"
                                disabled={isQueueLoading}
                                onClick={() => visitQueue(filters)}
                            >
                                Muat ulang antrean
                            </Button>
                        </div>
                    )}
                    <section
                        aria-label="Filter antrean"
                        className="@container rounded-3xl border border-border bg-white p-4 shadow-sm"
                    >
                        <div className="grid min-w-0 gap-3 @min-[34rem]:grid-cols-3">
                            <div className="min-w-0 space-y-2">
                                <label
                                    htmlFor="filter-match"
                                    className="text-sm font-semibold"
                                >
                                    Hasil awal roster
                                </label>
                                <select
                                    id="filter-match"
                                    value={filters.match ?? 'all'}
                                    disabled={
                                        isQueueLoading ||
                                        reviewQueue === undefined
                                    }
                                    onChange={(event) =>
                                        changeFilter(
                                            'match',
                                            event.target.value,
                                        )
                                    }
                                    className={controlClassName}
                                >
                                    <option value="all">Semua hasil</option>
                                    {(
                                        Object.keys(matchCopy) as MatchResult[]
                                    ).map((result) => (
                                        <option key={result} value={result}>
                                            {matchCopy[result]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-0 space-y-2">
                                <label
                                    htmlFor="filter-stale"
                                    className="text-sm font-semibold"
                                >
                                    Status data
                                </label>
                                <select
                                    id="filter-stale"
                                    value={
                                        filters.stale === null
                                            ? 'all'
                                            : String(filters.stale)
                                    }
                                    disabled={
                                        isQueueLoading ||
                                        reviewQueue === undefined
                                    }
                                    onChange={(event) =>
                                        changeFilter(
                                            'stale',
                                            event.target.value,
                                        )
                                    }
                                    className={controlClassName}
                                >
                                    <option value="all">Semua berkas</option>
                                    <option value="false">Data terkini</option>
                                    <option value="true">
                                        Perlu diajukan ulang
                                    </option>
                                </select>
                            </div>
                            <div className="min-w-0 space-y-2">
                                <label
                                    htmlFor="filter-sort"
                                    className="text-sm font-semibold"
                                >
                                    Urutan pengajuan
                                </label>
                                <select
                                    id="filter-sort"
                                    value={filters.sort}
                                    disabled={
                                        isQueueLoading ||
                                        reviewQueue === undefined
                                    }
                                    onChange={(event) =>
                                        changeFilter('sort', event.target.value)
                                    }
                                    className={controlClassName}
                                >
                                    <option value="oldest">Paling lama</option>
                                    <option value="newest">Paling baru</option>
                                </select>
                            </div>
                        </div>
                    </section>
                    <Deferred data="reviewQueue" fallback={<QueueSkeleton />}>
                        <ReviewQueueRegion
                            institution={institution}
                            filters={filters}
                            reviewQueue={reviewQueue!}
                            isQueueLoading={isQueueLoading}
                            onQueueLoadingChange={setQueueLoading}
                            onRequestError={reportError}
                            onRequestSuccess={confirmAccess}
                            isForbidden={isForbidden}
                        />
                    </Deferred>
                </div>
            </AppPage>
        </>
    );
}
export default function CampusAffiliations(props: Props) {
    return <CampusAffiliationsContent key={props.institution.id} {...props} />;
}
CampusAffiliations.layout = {
    breadcrumbs: [
        { title: 'Operasi kampus', href: '#' },
        { title: 'Afiliasi kampus', href: '#' },
    ],
};
