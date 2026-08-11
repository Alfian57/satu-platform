import { Deferred, Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    FileWarning,
    LockKeyhole,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    UnlockKeyhole,
    UserRoundCheck,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppPage } from '@/components/app-page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
            className="border-y border-border"
            data-test="affiliation-queue-skeleton"
        >
            <p className="sr-only" role="status">
                Memuat antrean afiliasi.
            </p>
            {Array.from({ length: 10 }, (_, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="grid min-h-24 gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] sm:items-center"
                >
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                    </div>
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-control-md w-full" />
                </div>
            ))}
        </div>
    );
}

function SummaryRail({ reviewQueue }: { reviewQueue: ReviewQueue }) {
    return (
        <div className="grid gap-8">
            <section aria-labelledby="queue-summary-title">
                <p className="font-label text-label text-muted-foreground">
                    Ringkasan antrean
                </p>
                <h2
                    id="queue-summary-title"
                    className="mt-2 text-title font-bold"
                >
                    {reviewQueue.summary.total} berkas menunggu
                </h2>
                <dl className="mt-5 divide-y divide-border border-y border-border">
                    <SummaryRow
                        label="Perlu pemeriksaan"
                        value={reviewQueue.summary.mismatch}
                    />
                    <SummaryRow
                        label="Roster berubah"
                        value={reviewQueue.summary.stale}
                    />
                    <SummaryRow
                        label="Cocok persis"
                        value={reviewQueue.summary.exact}
                    />
                </dl>
            </section>

            <section aria-labelledby="roster-context-title">
                <div className="flex items-center gap-2">
                    <ClipboardCheck
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    <h2 id="roster-context-title" className="font-semibold">
                        Roster aktif
                    </h2>
                </div>
                {reviewQueue.activeRoster ? (
                    <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
                        <SummaryFact
                            label="Semester"
                            value={reviewQueue.activeRoster.semester}
                        />
                        <SummaryFact
                            label="Diaktifkan"
                            value={formatDate(
                                reviewQueue.activeRoster.activatedAt,
                            )}
                        />
                    </dl>
                ) : (
                    <p className="mt-4 border-y border-border py-4 text-sm leading-relaxed text-muted-foreground">
                        Belum ada roster aktif. Permintaan tetap tercatat untuk
                        pemeriksaan manual.
                    </p>
                )}
            </section>

            <section aria-labelledby="lock-guidance-title">
                <div className="flex items-center gap-2">
                    <LockKeyhole
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    <h2 id="lock-guidance-title" className="font-semibold">
                        Kendali review
                    </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Ambil kunci sebelum menyimpan keputusan. Kunci berlaku 30
                    menit dan keputusan lama ditolak jika roster atau versi
                    berkas berubah.
                </p>
            </section>
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
        <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section aria-labelledby="queue-title" className="min-w-0">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="queue-title" className="text-title font-bold">
                            Antrean pemeriksaan
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {reviewQueue.pagination.total} berkas sesuai filter
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer disabled:cursor-not-allowed"
                        disabled={isQueueLoading}
                        onClick={refreshQueue}
                    >
                        {isQueueLoading ? <Spinner /> : <RefreshCw />}
                        Muat ulang
                    </Button>
                </div>

                {isQueueLoading ? (
                    <QueueSkeleton />
                ) : reviewQueue.items.length === 0 ? (
                    <div className="border-y border-border px-4 py-14 text-center">
                        <CheckCircle2
                            aria-hidden="true"
                            className="mx-auto size-9 text-verified"
                        />
                        <h3 className="mt-4 text-lg font-bold">
                            Tidak ada berkas pada filter ini
                        </h3>
                        <p className="mx-auto mt-2 max-w-[55ch] text-sm leading-relaxed text-muted-foreground">
                            Ubah filter untuk melihat antrean lain atau muat
                            ulang jika ada permintaan yang baru masuk.
                        </p>
                    </div>
                ) : (
                    <div className="border-y border-border">
                        {reviewQueue.items.map((item) => {
                            const lockedByOther =
                                item.lock !== null &&
                                !item.lock.ownedByCurrentUser;

                            return (
                                <article
                                    key={item.id}
                                    className={cn(
                                        'grid gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_9rem] sm:items-center',
                                        selectedId === item.id &&
                                            'bg-primary/5',
                                    )}
                                    data-test="affiliation-queue-row"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold break-all">
                                                @{item.username}
                                            </h3>
                                            {item.isStale && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-correction/40 bg-correction-subtle text-correction-subtle-foreground"
                                                >
                                                    <RotateCcw />
                                                    Perlu diajukan ulang
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 font-label text-xs text-muted-foreground">
                                            NIM {item.maskedNim} · WhatsApp{' '}
                                            {item.maskedPhone ??
                                                'belum tersedia'}
                                        </p>
                                    </div>

                                    <div className="min-w-0 text-sm">
                                        <p className="font-medium">
                                            {matchCopy[item.matchResult]}
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {item.rosterSemester
                                                ? `Roster ${item.rosterSemester}`
                                                : 'Tanpa roster aktif'}
                                            {' · '}
                                            {formatDate(item.submittedAt)}
                                        </p>
                                        {item.lock && (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-pending-subtle-foreground">
                                                <LockKeyhole className="size-3.5" />
                                                {item.lock.ownedByCurrentUser
                                                    ? 'Dikunci olehmu'
                                                    : `Sedang ditinjau @${item.lock.owner ?? 'reviewer lain'}`}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        variant={
                                            selectedId === item.id
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        className="w-full cursor-pointer disabled:cursor-not-allowed"
                                        disabled={
                                            item.isStale ||
                                            lockedByOther ||
                                            processingId === item.id
                                        }
                                        onClick={() => beginReview(item)}
                                    >
                                        {processingId === item.id ? (
                                            <Spinner />
                                        ) : item.lock?.ownedByCurrentUser ? (
                                            <UnlockKeyhole />
                                        ) : (
                                            <ClipboardCheck />
                                        )}
                                        {item.isStale
                                            ? 'Data berubah'
                                            : item.lock?.ownedByCurrentUser
                                              ? 'Lanjutkan'
                                              : lockedByOther
                                                ? 'Sedang ditinjau'
                                                : 'Tinjau'}
                                    </Button>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!isQueueLoading && reviewQueue.pagination.lastPage > 1 && (
                    <nav
                        aria-label="Paginasi antrean afiliasi"
                        className="mt-4 flex items-center justify-between gap-4"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer disabled:cursor-not-allowed"
                            disabled={reviewQueue.pagination.currentPage === 1}
                            onClick={() =>
                                updateFilters({
                                    page:
                                        reviewQueue.pagination.currentPage - 1,
                                })
                            }
                        >
                            <ChevronLeft />
                            Sebelumnya
                        </Button>
                        <p className="font-label text-xs text-muted-foreground">
                            Halaman {reviewQueue.pagination.currentPage} dari{' '}
                            {reviewQueue.pagination.lastPage}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer disabled:cursor-not-allowed"
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
                            <ChevronRight />
                        </Button>
                    </nav>
                )}
            </section>

            <aside
                aria-labelledby="decision-title"
                className="min-w-0 border-t border-border pt-6 2xl:border-t-0 2xl:border-l 2xl:pt-0 2xl:pl-6"
            >
                {selected === null ? (
                    <div className="sticky top-6 border-y border-border py-8 text-center">
                        <UserRoundCheck
                            aria-hidden="true"
                            className="mx-auto size-8 text-muted-foreground"
                        />
                        <h2 id="decision-title" className="mt-3 font-bold">
                            Pilih berkas untuk ditinjau
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            SATU akan mengunci satu berkas selama 30 menit agar
                            keputusan tidak saling menimpa.
                        </p>
                    </div>
                ) : (
                    <form
                        className="sticky top-6 grid gap-5"
                        onSubmit={submitDecision}
                    >
                        <div className="border-y border-border py-4">
                            <p className="font-label text-label text-primary">
                                Berkas AF-{selected.id}
                            </p>
                            <h2
                                id="decision-title"
                                className="mt-2 text-title font-bold break-all"
                            >
                                @{selected.username}
                            </h2>
                            <dl className="mt-4 divide-y divide-border text-sm">
                                <SummaryFact
                                    label="NIM"
                                    value={selected.maskedNim}
                                />
                                <SummaryFact
                                    label="WhatsApp"
                                    value={
                                        selected.maskedPhone ?? 'Belum tersedia'
                                    }
                                />
                                <SummaryFact
                                    label="Hasil awal"
                                    value={matchCopy[selected.matchResult]}
                                />
                            </dl>
                        </div>

                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-semibold">
                                Keputusan
                            </legend>
                            {(Object.keys(decisionCopy) as Decision[]).map(
                                (value) => (
                                    <label
                                        key={value}
                                        className={cn(
                                            'flex min-h-control-lg cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm font-medium transition-colors duration-fast ease-ledger hover:bg-accent motion-reduce:transition-none',
                                            decision === value &&
                                                'border-primary bg-primary/5',
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
                                            className="size-4 cursor-pointer accent-primary"
                                        />
                                        {decisionCopy[value]}
                                    </label>
                                ),
                            )}
                        </fieldset>

                        <div className="grid gap-2">
                            <label
                                htmlFor="reason_code"
                                className="text-sm font-semibold"
                            >
                                Alasan
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
                                className="h-control-lg w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

                        <div className="grid gap-2">
                            <label
                                htmlFor="review_note"
                                className="text-sm font-semibold"
                            >
                                Catatan (opsional)
                            </label>
                            <textarea
                                id="review_note"
                                name="note"
                                value={note}
                                maxLength={1000}
                                rows={4}
                                onChange={(event) =>
                                    setNote(event.target.value)
                                }
                                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                placeholder="Tambahkan konteks yang membantu tindak lanjut."
                            />
                            <p className="text-right font-label text-xs text-muted-foreground">
                                {note.length}/1.000
                            </p>
                        </div>

                        <div className="grid gap-2 border-t border-border pt-4">
                            <Button
                                type="submit"
                                data-test="affiliation-decision-submit"
                                variant={
                                    decision === 'reject'
                                        ? 'destructive'
                                        : 'default'
                                }
                                className="cursor-pointer disabled:cursor-not-allowed"
                                disabled={processingId === selected.id}
                            >
                                {processingId === selected.id ? (
                                    <Spinner />
                                ) : decision === 'approve' ? (
                                    <ShieldCheck />
                                ) : decision === 'request_revision' ? (
                                    <FileWarning />
                                ) : (
                                    <XCircle />
                                )}
                                {decisionCopy[decision]}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="cursor-pointer disabled:cursor-not-allowed"
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
            <Head title="Review afiliasi kampus" />
            <AppPage
                contextRail={
                    <Deferred
                        data="reviewQueue"
                        fallback={
                            <div aria-busy="true" className="grid gap-4">
                                <span className="sr-only" role="status">
                                    Memuat ringkasan antrean.
                                </span>
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-36 w-full" />
                                <Skeleton className="h-28 w-full" />
                            </div>
                        }
                    >
                        <SummaryRail reviewQueue={reviewQueue!} />
                    </Deferred>
                }
                contextRailLabel="Ringkasan dan kendali antrean"
            >
                <div
                    className="mx-auto w-full max-w-6xl"
                    data-test="affiliation-review-root"
                >
                    <header className="mb-7">
                        <p className="font-label text-label text-primary">
                            Meja verifikasi kampus
                        </p>
                        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="max-w-[24ch] text-headline font-bold text-balance">
                                    Review afiliasi {institution.name}
                                </h1>
                                <p className="mt-3 max-w-[68ch] text-body text-muted-foreground">
                                    Periksa ketidaksesuaian secara terarah.
                                    Detail mahasiswa lain tidak ditampilkan dan
                                    setiap keputusan dicatat sebagai riwayat
                                    audit.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/5 px-3 py-1 text-primary"
                            >
                                <ShieldCheck />
                                Akses admin kampus
                            </Badge>
                        </div>
                    </header>

                    {reviewOutcome && (
                        <Alert className="mb-5 border-verified/40 bg-verified-subtle text-verified-subtle-foreground">
                            <CheckCircle2 />
                            <AlertTitle>Perubahan tersimpan</AlertTitle>
                            <AlertDescription className="text-current">
                                {outcomeCopy[reviewOutcome]}
                            </AlertDescription>
                        </Alert>
                    )}

                    {reviewIssue && (
                        <Alert className="mb-5 border-correction/40 bg-correction-subtle text-correction-subtle-foreground">
                            <AlertTriangle />
                            <AlertTitle>
                                {reviewIssue === 'stale_decision'
                                    ? 'Berkas sudah berubah'
                                    : 'Berkas sedang ditinjau'}
                            </AlertTitle>
                            <AlertDescription className="text-current">
                                {reviewIssue === 'stale_decision'
                                    ? 'Keputusan tidak disimpan. Muat ulang antrean dan periksa versi terbaru.'
                                    : 'Reviewer lain sedang memegang kunci aktif. Pilih berkas lain atau coba lagi setelah kunci dilepas.'}
                            </AlertDescription>
                        </Alert>
                    )}

                    <section
                        aria-label="Filter antrean"
                        className="mb-7 grid gap-4 border-y border-border py-4 sm:grid-cols-3"
                    >
                        <label className="grid gap-2 text-sm font-semibold">
                            Hasil awal
                            <select
                                value={filters.match ?? 'all'}
                                disabled={isQueueLoading}
                                onChange={(event) =>
                                    changeFilter('match', event.target.value)
                                }
                                className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                            Kesegaran data
                            <select
                                value={
                                    filters.stale === null
                                        ? 'all'
                                        : String(filters.stale)
                                }
                                disabled={isQueueLoading}
                                onChange={(event) =>
                                    changeFilter('stale', event.target.value)
                                }
                                className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">Semua berkas</option>
                                <option value="false">Data terkini</option>
                                <option value="true">
                                    Perlu diajukan ulang
                                </option>
                            </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                            Urutan
                            <select
                                value={filters.sort}
                                disabled={isQueueLoading}
                                onChange={(event) =>
                                    changeFilter('sort', event.target.value)
                                }
                                className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="oldest">Paling lama</option>
                                <option value="newest">Paling baru</option>
                            </select>
                        </label>
                    </section>

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
