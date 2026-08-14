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
import { useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
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
    username: string;
    maskedNim: string;
    maskedPhone: string | null;
    matchResult: MatchResult;
    status: 'pending_review';
    version: number;
    submittedAt: string;
    isStale: boolean;
    rosterSemester: string | null;
    lock: {
        ownedByCurrentUser: boolean;
        owner: string | null;
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
    exact: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
    no_match: 'border-rose-200/80 bg-rose-50 text-rose-800',
    ambiguous: 'border-amber-200/80 bg-amber-50 text-amber-800',
    inactive: 'border-rose-200/80 bg-rose-50 text-rose-800',
    roster_unavailable: 'border-slate-200 bg-slate-50 text-slate-700',
    stale_roster: 'border-rose-200/80 bg-rose-50 text-rose-800',
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
    if (value === null) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function QueueSkeleton() {
    return (
        <div
            aria-busy="true"
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
            data-test="affiliation-queue-skeleton"
        >
            <p className="sr-only" role="status">
                Memuat antrean afiliasi.
            </p>
            {Array.from({ length: 10 }, (_, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="grid min-h-24 gap-4 border-b border-slate-100 p-6 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] sm:items-center"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-xl bg-slate-100" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-slate-100" />
                            <Skeleton className="h-3 w-44 bg-slate-100" />
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

function SummaryRail({ reviewQueue }: { reviewQueue: ReviewQueue }) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Ringkasan Antrean */}
            <section
                aria-labelledby="queue-summary-title"
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <ClipboardCheck
                            className="size-3.5"
                            aria-hidden="true"
                        />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        RINGKASAN ANTREAN
                    </p>
                </div>

                <h2
                    id="queue-summary-title"
                    className="mt-3 text-base font-bold tracking-tight text-slate-950"
                >
                    {reviewQueue.summary.total} Berkas Menunggu
                </h2>

                <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-xs text-slate-600">
                            Perlu pemeriksaan
                        </dt>
                        <dd className="font-mono text-xs font-bold text-amber-700">
                            {reviewQueue.summary.mismatch}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-xs text-slate-600">
                            Roster berubah
                        </dt>
                        <dd className="font-mono text-xs font-bold text-rose-700">
                            {reviewQueue.summary.stale}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <dt className="text-xs text-slate-600">Cocok persis</dt>
                        <dd className="font-mono text-xs font-bold text-emerald-700">
                            {reviewQueue.summary.exact}
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Card 2: Roster Aktif */}
            <section
                aria-labelledby="roster-context-title"
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FileSpreadsheet
                            aria-hidden="true"
                            className="size-3.5"
                        />
                    </span>
                    <h2
                        id="roster-context-title"
                        className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase"
                    >
                        ROSTER AKTIF
                    </h2>
                </div>

                {reviewQueue.activeRoster ? (
                    <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between py-3">
                            <dt className="text-slate-600">Semester</dt>
                            <dd className="font-semibold text-slate-900">
                                {reviewQueue.activeRoster.semester}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <dt className="text-slate-600">Diaktifkan</dt>
                            <dd className="text-slate-700">
                                {formatDate(
                                    reviewQueue.activeRoster.activatedAt,
                                )}
                            </dd>
                        </div>
                    </dl>
                ) : (
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        Belum ada roster aktif. Permintaan tetap tercatat untuk
                        pemeriksaan manual.
                    </p>
                )}
            </section>

            {/* Card 3: Kendali Review */}
            <section
                aria-labelledby="lock-guidance-title"
                className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4.5"
            >
                <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 size-4.5 shrink-0 text-blue-600" />
                    <div>
                        <h2
                            id="lock-guidance-title"
                            className="text-xs font-bold text-blue-900"
                        >
                            Kendali Kunci Berkas
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                            Ambil kunci sebelum menyimpan keputusan. Kunci
                            berlaku 30 menit untuk mencegah benturan keputusan
                            antar operator.
                        </p>
                    </div>
                </div>
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
}: {
    institution: Props['institution'];
    filters: Filters;
    reviewQueue: ReviewQueue;
    isQueueLoading: boolean;
    onQueueLoadingChange: (isLoading: boolean) => void;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [decision, setDecision] = useState<Decision>('approve');
    const [reasonCode, setReasonCode] =
        useState<ReasonCode>('records_confirmed');
    const [note, setNote] = useState('');
    const selected = useMemo(() => {
        if (isQueueLoading) {
            return null;
        }

        return (
            reviewQueue.items.find(
                (item) =>
                    item.id === selectedId &&
                    item.lock?.ownedByCurrentUser === true,
            ) ?? null
        );
    }, [isQueueLoading, reviewQueue.items, selectedId]);

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
                onFinish: () => onQueueLoadingChange(false),
            },
        );
    }

    function refreshQueue() {
        onQueueLoadingChange(true);
        router.reload({
            only: ['reviewQueue'],
            onFinish: () => onQueueLoadingChange(false),
        });
    }

    function beginReview(item: ReviewItem) {
        if (item.isStale || (item.lock && !item.lock.ownedByCurrentUser)) {
            return;
        }

        if (item.lock?.ownedByCurrentUser) {
            setSelectedId(item.id);

            return;
        }

        setProcessingId(item.id);
        router.post(
            acquireLock({
                institution: institution.id,
                affiliationRequest: item.id,
            }),
            {},
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                onSuccess: () => setSelectedId(item.id),
                onFinish: () => setProcessingId(null),
            },
        );
    }

    function abandonReview() {
        if (selected === null) {
            return;
        }

        setProcessingId(selected.id);
        router.delete(
            releaseLock({
                institution: institution.id,
                affiliationRequest: selected.id,
            }),
            {
                only: ['reviewQueue', 'reviewOutcome', 'reviewIssue'],
                preserveScroll: true,
                onSuccess: () => setSelectedId(null),
                onFinish: () => setProcessingId(null),
            },
        );
    }

    function changeDecision(nextDecision: Decision) {
        setDecision(nextDecision);
        setReasonCode(reasonsByDecision[nextDecision][0].value);
    }

    function submitDecision(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (selected === null || !selected.lock?.ownedByCurrentUser) {
            return;
        }

        setProcessingId(selected.id);
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
                onSuccess: () => {
                    setSelectedId(null);
                    setNote('');
                    changeDecision('approve');
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section aria-labelledby="queue-title" className="min-w-0">
                {/* Queue Header Meta */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="size-4.5 text-blue-600" />
                            <h2
                                id="queue-title"
                                className="text-base font-bold text-slate-900"
                            >
                                Antrean Pemeriksaan
                            </h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            {reviewQueue.pagination.total} berkas terdaftar
                            sesuai filter
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 cursor-pointer rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
                        disabled={isQueueLoading}
                        onClick={refreshQueue}
                    >
                        {isQueueLoading ? (
                            <Spinner className="mr-1.5 size-3.5" />
                        ) : (
                            <RefreshCw className="mr-1.5 size-3.5 text-slate-500" />
                        )}
                        Muat ulang
                    </Button>
                </div>

                {/* Queue Body */}
                <div className="mt-4">
                    {isQueueLoading ? (
                        <QueueSkeleton />
                    ) : reviewQueue.items.length === 0 ? (
                        <div className="grid justify-items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="size-7"
                                />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                Tidak ada berkas pada filter ini
                            </h3>
                            <p className="mx-auto max-w-[50ch] text-xs leading-relaxed text-slate-500">
                                Ubah filter untuk melihat antrean lain atau muat
                                ulang jika ada permohonan yang baru masuk.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {reviewQueue.items.map((item) => {
                                const lockedByOther =
                                    item.lock !== null &&
                                    !item.lock.ownedByCurrentUser;

                                return (
                                    <article
                                        key={item.id}
                                        className={cn(
                                            'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-6',
                                            selectedId === item.id &&
                                                'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20',
                                        )}
                                        data-test="affiliation-queue-row"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-4">
                                                {/* Monogram Avatar */}
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-xs">
                                                    <UserRound className="size-5" />
                                                </div>

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-slate-400">
                                                            AF-{item.id}
                                                        </span>
                                                        <h3 className="text-base font-bold text-slate-900">
                                                            @{item.username}
                                                        </h3>
                                                        {item.isStale && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-rose-800">
                                                                <RotateCcw className="size-3 text-rose-600" />
                                                                Perlu diajukan
                                                                ulang
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                        <span>
                                                            NIM:{' '}
                                                            <strong className="font-semibold text-slate-700">
                                                                {item.maskedNim}
                                                            </strong>
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            WhatsApp:{' '}
                                                            <strong className="font-semibold text-slate-700">
                                                                {item.maskedPhone ??
                                                                    'belum tersedia'}
                                                            </strong>
                                                        </span>
                                                    </p>

                                                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold ${matchClassName[item.matchResult]}`}
                                                        >
                                                            {
                                                                matchCopy[
                                                                    item
                                                                        .matchResult
                                                                ]
                                                            }
                                                        </span>
                                                        <span className="text-[0.6875rem] text-slate-400">
                                                            {item.rosterSemester
                                                                ? `Roster ${item.rosterSemester}`
                                                                : 'Tanpa roster aktif'}{' '}
                                                            •{' '}
                                                            {formatDate(
                                                                item.submittedAt,
                                                            )}
                                                        </span>
                                                    </div>

                                                    {item.lock && (
                                                        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                                            <LockKeyhole className="size-3.5" />
                                                            <span>
                                                                {item.lock
                                                                    .ownedByCurrentUser
                                                                    ? 'Sedang kamu tinjau (Kunci aktif)'
                                                                    : `Sedang ditinjau @${item.lock.owner ?? 'operator lain'}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div className="shrink-0 sm:self-center">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        selectedId === item.id
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    className={`h-10 w-full cursor-pointer rounded-xl px-5 text-xs font-semibold sm:w-auto ${
                                                        selectedId === item.id
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                            : 'text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900'
                                                    }`}
                                                    disabled={
                                                        item.isStale ||
                                                        lockedByOther ||
                                                        processingId === item.id
                                                    }
                                                    onClick={() =>
                                                        beginReview(item)
                                                    }
                                                >
                                                    {processingId ===
                                                    item.id ? (
                                                        <Spinner className="mr-1.5 size-3.5" />
                                                    ) : item.lock
                                                          ?.ownedByCurrentUser ? (
                                                        <UnlockKeyhole className="mr-1.5 size-3.5 text-blue-600" />
                                                    ) : (
                                                        <ClipboardCheck className="mr-1.5 size-3.5" />
                                                    )}
                                                    {item.isStale
                                                        ? 'Data berubah'
                                                        : item.lock
                                                                ?.ownedByCurrentUser
                                                          ? 'Lanjutkan Review'
                                                          : lockedByOther
                                                            ? 'Sedang ditinjau'
                                                            : 'Tinjau Berkas'}
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!isQueueLoading && reviewQueue.pagination.lastPage > 1 && (
                    <nav
                        aria-label="Paginasi antrean afiliasi"
                        className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                            disabled={reviewQueue.pagination.currentPage === 1}
                            onClick={() =>
                                updateFilters({
                                    page:
                                        reviewQueue.pagination.currentPage - 1,
                                })
                            }
                        >
                            <ChevronLeft className="mr-1 size-3.5" />
                            Sebelumnya
                        </Button>
                        <p className="font-mono text-xs font-semibold text-slate-600">
                            Halaman {reviewQueue.pagination.currentPage} dari{' '}
                            {reviewQueue.pagination.lastPage}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer rounded-xl text-xs font-semibold disabled:cursor-not-allowed"
                            disabled={
                                reviewQueue.pagination.currentPage ===
                                reviewQueue.pagination.lastPage
                            }
                            onClick={() =>
                                updateFilters({
                                    page:
                                        reviewQueue.pagination.currentPage + 1,
                                })
                            }
                        >
                            Berikutnya
                            <ChevronRight className="ml-1 size-3.5" />
                        </Button>
                    </nav>
                )}
            </section>

            {/* Sticky Review Drawer / Aside */}
            <aside aria-labelledby="decision-title" className="min-w-0">
                {selected === null ? (
                    <div className="sticky top-6 grid justify-items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <UserRoundCheck
                                aria-hidden="true"
                                className="size-6"
                            />
                        </div>
                        <h2
                            id="decision-title"
                            className="text-base font-bold text-slate-900"
                        >
                            Pilih Berkas untuk Ditinjau
                        </h2>
                        <p className="text-xs leading-relaxed text-slate-500">
                            Klik tombol <strong>Tinjau Berkas</strong> pada
                            salah satu permohonan. Sistem akan mengunci berkas
                            selama 30 menit agar keputusan tidak saling
                            bertabrakan.
                        </p>
                    </div>
                ) : (
                    <form
                        className="sticky top-6 grid gap-5 rounded-2xl border border-blue-200 bg-white p-6 shadow-md"
                        onSubmit={submitDecision}
                    >
                        <div className="border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-600">
                                    Berkas AF-{selected.id}
                                </span>
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[0.6875rem] font-bold text-blue-700">
                                    Kunci Aktif
                                </span>
                            </div>
                            <h2
                                id="decision-title"
                                className="mt-2 text-lg font-bold text-slate-950"
                            >
                                @{selected.username}
                            </h2>

                            <dl className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <dt className="text-slate-500">NIM</dt>
                                    <dd className="font-semibold text-slate-900">
                                        {selected.maskedNim}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-slate-500">WhatsApp</dt>
                                    <dd className="font-semibold text-slate-900">
                                        {selected.maskedPhone ??
                                            'Belum tersedia'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-slate-500">
                                        Hasil Roster
                                    </dt>
                                    <dd className="font-semibold text-slate-900">
                                        {matchCopy[selected.matchResult]}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Keputusan Radio */}
                        <fieldset className="grid gap-2">
                            <legend className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                                Keputusan Review
                            </legend>
                            {(Object.keys(decisionCopy) as Decision[]).map(
                                (value) => (
                                    <label
                                        key={value}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold transition-all hover:bg-slate-50',
                                            decision === value &&
                                                (value === 'approve'
                                                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                                                    : value ===
                                                        'request_revision'
                                                      ? 'border-amber-500 bg-amber-50/40 text-amber-950'
                                                      : 'border-rose-500 bg-rose-50/40 text-rose-950'),
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
                                            className="size-4 cursor-pointer accent-blue-600"
                                        />
                                        {decisionCopy[value]}
                                    </label>
                                ),
                            )}
                        </fieldset>

                        {/* Alasan */}
                        <div className="grid gap-1.5">
                            <label
                                htmlFor="reason_code"
                                className="text-xs font-bold text-slate-700"
                            >
                                Alasan Keputusan
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
                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                            >
                                {reasonsByDecision[decision].map((reason) => (
                                    <option
                                        key={reason.value}
                                        value={reason.value}
                                    >
                                        {reason.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Catatan */}
                        <div className="grid gap-1.5">
                            <label
                                htmlFor="review_note"
                                className="text-xs font-bold text-slate-700"
                            >
                                Catatan Tambahan (Opsional)
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
                                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                placeholder="Tambahkan konteks penjelasan..."
                            />
                            <p className="text-right font-mono text-[0.6875rem] text-slate-400">
                                {note.length}/1.000
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid gap-2 border-t border-slate-100 pt-4">
                            <Button
                                type="submit"
                                data-test="affiliation-decision-submit"
                                variant={
                                    decision === 'reject'
                                        ? 'destructive'
                                        : 'default'
                                }
                                className={`h-10 cursor-pointer rounded-xl text-xs font-semibold text-white shadow-xs ${
                                    decision === 'approve'
                                        ? 'bg-emerald-700 hover:bg-emerald-800'
                                        : decision === 'request_revision'
                                          ? 'bg-amber-700 hover:bg-amber-800'
                                          : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                                disabled={processingId === selected.id}
                            >
                                {processingId === selected.id ? (
                                    <Spinner className="mr-1.5 size-3.5" />
                                ) : decision === 'approve' ? (
                                    <ShieldCheck className="mr-1.5 size-3.5" />
                                ) : decision === 'request_revision' ? (
                                    <FileWarning className="mr-1.5 size-3.5" />
                                ) : (
                                    <XCircle className="mr-1.5 size-3.5" />
                                )}
                                Simpan {decisionCopy[decision]}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="h-9 cursor-pointer rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                disabled={processingId === selected.id}
                                onClick={abandonReview}
                            >
                                Lepas kunci dan tutup
                            </Button>
                        </div>
                    </form>
                )}
            </aside>
        </div>
    );
}

export default function CampusAffiliations({
    institution,
    filters,
    reviewQueue,
    reviewOutcome,
    reviewIssue,
}: Props) {
    const [isQueueLoading, setQueueLoading] = useState(false);

    function changeFilter(key: keyof Filters, value: string) {
        const next: Filters = {
            ...filters,
            [key]:
                key === 'stale'
                    ? value === 'all'
                        ? null
                        : value === 'true'
                    : value === 'all'
                      ? null
                      : value,
        } as Filters;

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
                onFinish: () => setQueueLoading(false),
            },
        );
    }

    return (
        <>
            <Head
                title={`Review Afiliasi Kampus - ${institution.name} | SATU`}
            />

            <AppPage
                contextRail={
                    <Deferred
                        data="reviewQueue"
                        fallback={
                            <div aria-busy="true" className="grid gap-4">
                                <Skeleton className="h-4 w-28 bg-slate-100" />
                                <Skeleton className="h-8 w-48 bg-slate-100" />
                                <Skeleton className="h-36 w-full rounded-2xl bg-slate-100" />
                                <Skeleton className="h-28 w-full rounded-2xl bg-slate-100" />
                            </div>
                        }
                    >
                        <SummaryRail reviewQueue={reviewQueue!} />
                    </Deferred>
                }
                contextRailLabel="Ringkasan dan kendali antrean"
            >
                <div className="space-y-6" data-test="affiliation-review-root">
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
                                    <ClipboardCheck className="size-3 text-blue-600" />
                                    Verifikasi Kampus
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Review Afiliasi {institution.name}
                                </h1>

                                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
                                    Periksa ketidaksesuaian data mahasiswa
                                    secara terarah dan aman. Setiap keputusan
                                    pemeriksaan tercatat permanen pada riwayat
                                    audit ledger institusi.
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-800">
                                <ShieldCheck className="size-4 text-blue-600" />
                                <span>Akses Admin Kampus</span>
                            </div>
                        </div>
                    </header>

                    {/* Alerts (Outcome & Issue) */}
                    {reviewOutcome && (
                        <Alert className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-950 shadow-xs">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <AlertTitle className="font-bold">
                                Perubahan tersimpan
                            </AlertTitle>
                            <AlertDescription className="text-xs text-emerald-800">
                                {outcomeCopy[reviewOutcome]}
                            </AlertDescription>
                        </Alert>
                    )}

                    {reviewIssue && (
                        <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-950 shadow-xs">
                            <AlertTriangle className="size-4 text-amber-600" />
                            <AlertTitle className="font-bold">
                                {reviewIssue === 'stale_decision'
                                    ? 'Berkas sudah berubah'
                                    : 'Berkas sedang ditinjau'}
                            </AlertTitle>
                            <AlertDescription className="text-xs text-amber-800">
                                {reviewIssue === 'stale_decision'
                                    ? 'Keputusan tidak disimpan. Muat ulang antrean dan periksa versi terbaru.'
                                    : 'Reviewer lain sedang memegang kunci aktif. Pilih berkas lain atau coba lagi setelah kunci dilepas.'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Filter Card */}
                    <section
                        aria-label="Filter antrean"
                        className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:grid-cols-3"
                    >
                        <div className="space-y-1.5">
                            <label
                                htmlFor="filter-match"
                                className="text-xs font-bold text-slate-700"
                            >
                                Hasil Awal Roster
                            </label>
                            <select
                                id="filter-match"
                                value={filters.match ?? 'all'}
                                disabled={isQueueLoading}
                                onChange={(event) =>
                                    changeFilter('match', event.target.value)
                                }
                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">Semua hasil</option>
                                {(Object.keys(matchCopy) as MatchResult[]).map(
                                    (result) => (
                                        <option key={result} value={result}>
                                            {matchCopy[result]}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="filter-stale"
                                className="text-xs font-bold text-slate-700"
                            >
                                Kesegaran Data
                            </label>
                            <select
                                id="filter-stale"
                                value={
                                    filters.stale === null
                                        ? 'all'
                                        : String(filters.stale)
                                }
                                disabled={isQueueLoading}
                                onChange={(event) =>
                                    changeFilter('stale', event.target.value)
                                }
                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">Semua berkas</option>
                                <option value="false">Data terkini</option>
                                <option value="true">
                                    Perlu diajukan ulang
                                </option>
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
                                disabled={isQueueLoading}
                                onChange={(event) =>
                                    changeFilter('sort', event.target.value)
                                }
                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="oldest">Paling lama</option>
                                <option value="newest">Paling baru</option>
                            </select>
                        </div>
                    </section>

                    {/* Main Queue and Decision Drawer */}
                    <Deferred data="reviewQueue" fallback={<QueueSkeleton />}>
                        <ReviewQueueRegion
                            institution={institution}
                            filters={filters}
                            reviewQueue={reviewQueue!}
                            isQueueLoading={isQueueLoading}
                            onQueueLoadingChange={setQueueLoading}
                        />
                    </Deferred>
                </div>
            </AppPage>
        </>
    );
}

CampusAffiliations.layout = {
    breadcrumbs: [
        {
            title: 'Operasi Kampus',
            href: '#',
        },
        {
            title: 'Afiliasi & Verifikasi',
            href: '#',
        },
    ],
};
