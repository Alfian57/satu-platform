import { Head, Link, useHttp } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    CircleDot,
    Clock3,
    FileCheck2,
    FileWarning,
    History,
    LockKeyhole,
    MessageSquareText,
    PencilLine,
    ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { AppPage } from '@/components/app-page';
import { ContributionComposer } from '@/components/contributions/contribution-composer';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as contributionsIndex } from '@/routes/contributions';
import type {
    ContributionApiResponse,
    ContributionComposerValues,
    ContributionDetail,
    ContributionPayload,
    ContributionProjectOption,
    ContributionReview,
    ContributionStatus,
} from '@/types/contribution';

type ContributionsShowProps = {
    contribution: ContributionDetail;
    projects: ContributionProjectOption[];
    permissions: {
        can_update: boolean;
        can_submit: boolean;
    };
};

type ErrorMap = Record<string, unknown>;

const statusMeta: Record<
    ContributionStatus,
    { label: string; description: string; className: string }
> = {
    draft: {
        label: 'Draft',
        description: 'Draft ini belum dikirim untuk validasi.',
        className: 'border-border bg-muted text-muted-foreground',
    },
    pending: {
        label: 'Menunggu validasi',
        description: 'Reviewer kampus sedang memeriksa versi ini.',
        className:
            'border-pending/40 bg-pending-subtle text-pending-subtle-foreground',
    },
    revision: {
        label: 'Perlu diperbaiki',
        description: 'Tanggapi catatan reviewer dengan membuat versi baru.',
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
        description: 'Contribution ini tidak menerima perubahan baru.',
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

function verificationLabel(status: ContributionStatus): string {
    return status === 'approved' ? 'Institution-verified' : 'Self-reported';
}

function reviewMeta(decision: ContributionReview['decision']): {
    label: string;
    className: string;
} {
    if (decision === 'approved') {
        return {
            label: 'Tervalidasi',
            className:
                'border-verified/40 bg-verified-subtle text-verified-subtle-foreground',
        };
    }

    if (decision === 'revision') {
        return {
            label: 'Perlu diperbaiki',
            className:
                'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
        };
    }

    return {
        label: 'Ditolak',
        className:
            'border-correction/40 bg-correction-subtle text-correction-subtle-foreground',
    };
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
        return <AlertCircle aria-hidden="true" className="size-4" />;
    }

    return <CircleDot aria-hidden="true" className="size-4" />;
}

function ReviewFeedback({ reviews }: { reviews: ContributionReview[] }) {
    if (reviews.length === 0) {
        return (
            <div
                data-test="contribution-review-empty"
                className="flex items-start gap-3 border-y border-border px-1 py-5 text-sm leading-6 text-muted-foreground md:px-3"
            >
                <MessageSquareText
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                />
                <p>Belum ada keputusan reviewer pada contribution ini.</p>
            </div>
        );
    }

    return (
        <ol
            className="grid border-y border-border"
            data-test="contribution-review-timeline"
        >
            {reviews
                .slice()
                .reverse()
                .map((review) => {
                    const meta = reviewMeta(review.decision);

                    return (
                        <li
                            key={review.id}
                            className="grid gap-3 border-b border-border px-1 py-5 last:border-b-0 md:grid-cols-[10rem_minmax(0,1fr)] md:px-3"
                        >
                            <div className="grid content-start gap-1">
                                <span
                                    className={cn(
                                        'inline-flex w-fit items-center gap-2 border px-2 py-1 text-xs font-semibold',
                                        meta.className,
                                    )}
                                >
                                    {meta.label}
                                </span>
                                <time
                                    dateTime={review.reviewed_at}
                                    className="text-xs text-muted-foreground"
                                >
                                    {formatDate(review.reviewed_at)}
                                </time>
                            </div>
                            <div className="grid min-w-0 gap-2">
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
                            </div>
                        </li>
                    );
                })}
        </ol>
    );
}

export default function ContributionsShow({
    contribution: initialContribution,
    projects,
    permissions,
}: ContributionsShowProps) {
    const [contribution, setContribution] = useState(initialContribution);
    const [isEditing, setIsEditing] = useState(
        initialContribution.status === 'revision',
    );
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const submitForm = useHttp<Record<string, never>, ContributionApiResponse>(
        {},
    );
    const revisionForm = useHttp<ContributionPayload, ContributionApiResponse>({
        task_id: '',
        claim: '',
        summary: '',
        declaration: '',
        evidence: [],
    });

    const status = contribution.status;
    const meta = statusMeta[status];
    const currentVersion = contribution.current_version;
    const latestReview = useMemo(
        () =>
            currentVersion === null
                ? null
                : (contribution.reviews
                      .slice()
                      .reverse()
                      .find(
                          (review) =>
                              review.contribution_version_id ===
                              currentVersion.id,
                      ) ?? null),
        [contribution.reviews, currentVersion],
    );
    const revisionProject = projects.find(
        (project) => project.id === contribution.project.id,
    );
    const revisionInitialValues = currentVersion
        ? {
              project_id: contribution.project.id,
              task_id: currentVersion.task.id,
              claim: currentVersion.claim,
              summary: currentVersion.summary,
              declaration: currentVersion.declaration,
              evidence: currentVersion.evidence
                  .filter((item) => item.available)
                  .map((item) => item.attachment_id),
          }
        : undefined;

    function commandOptions(fallback: string) {
        return {
            onHttpException: (response: { status: number }) => {
                setActionError(
                    response.status === 403
                        ? 'Akses perubahan contribution sudah tidak tersedia. Data yang ada tetap aman.'
                        : fallback,
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(`${fallback} Periksa koneksi lalu coba lagi.`);

                return false;
            },
        };
    }

    function submitContribution(): void {
        if (submitForm.processing || !permissions.can_submit) {
            return;
        }

        setActionError(null);
        setActionMessage(null);
        submitForm
            .post(ContributionController.submit(contribution.id).url, {
                ...commandOptions(
                    'Contribution belum dapat dikirim. Periksa evidence dan coba lagi.',
                ),
            })
            .then((response) => {
                setContribution(response.data);
                setActionMessage(
                    'Contribution sudah dikirim untuk validasi kampus.',
                );
            })
            .catch(() => undefined);
    }

    function saveRevision(values: ContributionComposerValues): void {
        if (revisionForm.processing || !permissions.can_update) {
            return;
        }

        setActionError(null);
        setActionMessage(null);
        const payload: ContributionPayload = {
            task_id: values.task_id,
            claim: values.claim,
            summary: values.summary,
            declaration: values.declaration,
            evidence: values.evidence,
        };

        revisionForm.transform(() => payload);
        revisionForm
            .post(ContributionController.revise(contribution.id).url, {
                ...commandOptions(
                    'Versi revisi belum tersimpan. Periksa field yang ditandai lalu coba lagi.',
                ),
            })
            .then((response) => {
                setContribution(response.data);
                setIsEditing(false);
                setActionMessage('Versi baru tersimpan sebagai draft.');
            })
            .catch(() => undefined);
    }

    const submitEvidenceError = firstError(
        submitForm.errors as ErrorMap,
        'evidence',
    );
    const submitStatusError = firstError(
        submitForm.errors as ErrorMap,
        'status',
    );
    const revisionError = firstError(
        revisionForm.errors as ErrorMap,
        'revision',
    );

    const contextRail = (
        <div className="grid gap-6">
            <section className="grid gap-3 border-b border-border pb-6">
                <p className="font-label text-label text-muted-foreground">
                    NEXT ACTION
                </p>
                <div
                    className={cn(
                        'flex w-fit items-center gap-2 border px-2 py-1 text-xs font-semibold',
                        meta.className,
                    )}
                    data-test="contribution-status"
                >
                    <StatusMark status={status} />
                    {meta.label}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                    {meta.description}
                </p>
                {permissions.can_submit && status === 'draft' && (
                    <Button
                        type="button"
                        className="w-full cursor-pointer"
                        onClick={submitContribution}
                        disabled={submitForm.processing}
                        data-test="contribution-submit"
                    >
                        {submitForm.processing && (
                            <Spinner aria-label="Mengirim contribution" />
                        )}
                        Kirim untuk validasi
                    </Button>
                )}
                {permissions.can_update &&
                    (status === 'draft' || status === 'revision') &&
                    !isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full cursor-pointer"
                            onClick={() => {
                                setActionError(null);
                                setIsEditing(true);
                            }}
                            data-test="contribution-edit"
                        >
                            <PencilLine aria-hidden="true" />
                            {status === 'revision'
                                ? 'Tanggapi revisi'
                                : 'Edit draft'}
                        </Button>
                    )}
                {status === 'pending' && (
                    <div className="flex items-start gap-2 border border-border bg-muted/50 px-3 py-3 text-sm leading-6 text-muted-foreground">
                        <LockKeyhole
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <p>Mode baca. Perubahan menunggu keputusan reviewer.</p>
                    </div>
                )}
            </section>
            <section className="grid gap-3 border-b border-border pb-6">
                <p className="font-label text-label text-muted-foreground">
                    PROVENANCE
                </p>
                <dl className="grid gap-3 text-sm">
                    <div className="grid gap-1">
                        <dt className="text-muted-foreground">
                            Level validasi
                        </dt>
                        <dd className="font-semibold">
                            {verificationLabel(status)}
                        </dd>
                    </div>
                    <div className="grid gap-1">
                        <dt className="text-muted-foreground">Versi aktif</dt>
                        <dd className="font-semibold">
                            {currentVersion === null
                                ? 'Belum ada versi'
                                : `Versi ${currentVersion.version_number}`}
                        </dd>
                    </div>
                    <div className="grid gap-1">
                        <dt className="text-muted-foreground">Diperbarui</dt>
                        <dd className="font-semibold">
                            {formatDate(contribution.updated_at)}
                        </dd>
                    </div>
                </dl>
                <p className="text-xs leading-5 text-muted-foreground">
                    Status validasi tidak otomatis menjanjikan credit akademik
                    atau akses recruiter.
                </p>
            </section>
            <div className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-verified"
                />
                <p>Evidence private mengikuti policy dan tenant project.</p>
            </div>
        </div>
    );

    return (
        <>
            <Head title={`Contribution ${contribution.id}`} />
            <AppPage
                contextRail={contextRail}
                contextRailLabel="Konteks contribution"
            >
                <div className="mx-auto grid max-w-5xl min-w-0 gap-8">
                    <header className="grid gap-4 border-b border-border pb-6">
                        <Link
                            href={contributionsIndex()}
                            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                            data-test="back-to-contributions"
                        >
                            <ArrowLeft aria-hidden="true" className="size-4" />
                            Kembali ke buku besar
                        </Link>
                        <div className="grid gap-3">
                            <p className="font-label text-label text-primary">
                                CONTRIBUTION / RECEIPT-{contribution.id}
                            </p>
                            <h1 className="max-w-[26ch] text-headline font-bold text-balance break-words">
                                {contribution.project.title}
                            </h1>
                            <p className="max-w-[68ch] text-body text-muted-foreground">
                                Milik {contribution.owner.name}. Catatan ini
                                adalah provenance pekerjaan, bukan janji
                                approval atau credit.
                            </p>
                        </div>
                    </header>

                    <div
                        role="status"
                        aria-live="polite"
                        className="min-h-0 text-sm"
                        data-test="contribution-action-status"
                    >
                        {actionMessage && (
                            <div className="flex items-start gap-3 border border-verified/30 bg-verified-subtle px-4 py-3 text-verified-subtle-foreground">
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0"
                                />
                                <p>{actionMessage}</p>
                            </div>
                        )}
                        {actionError && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground"
                                data-test="contribution-action-error"
                            >
                                <AlertCircle
                                    aria-hidden="true"
                                    className="mt-1 size-4 shrink-0"
                                />
                                <p>{actionError}</p>
                            </div>
                        )}
                        {submitEvidenceError && (
                            <p className="mt-2 border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground">
                                {submitEvidenceError}
                            </p>
                        )}
                        {submitStatusError && (
                            <p className="mt-2 border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground">
                                {submitStatusError}
                            </p>
                        )}
                        {revisionError && (
                            <p className="mt-2 border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground">
                                {revisionError}
                            </p>
                        )}
                    </div>

                    {latestReview?.decision === 'revision' && (
                        <section
                            data-test="contribution-revision-feedback"
                            className="grid gap-3 border border-correction/30 bg-correction-subtle px-4 py-4 md:px-6"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-correction-subtle-foreground">
                                <MessageSquareText
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Catatan reviewer untuk versi aktif
                            </div>
                            <p className="text-sm leading-6 text-correction-subtle-foreground">
                                {latestReview.reason ??
                                    latestReview.note ??
                                    'Reviewer meminta penjelasan atau evidence tambahan.'}
                            </p>
                        </section>
                    )}

                    {isEditing &&
                    permissions.can_update &&
                    revisionProject &&
                    currentVersion ? (
                        <section
                            aria-labelledby="contribution-revision-title"
                            className="grid gap-6 border-y border-border bg-card/30 px-4 py-6 md:px-8 md:py-8"
                        >
                            <div className="grid gap-2">
                                <p className="font-label text-label text-muted-foreground">
                                    {status === 'revision'
                                        ? 'REVISION RESPONSE'
                                        : 'DRAFT EDITOR'}
                                </p>
                                <h2
                                    id="contribution-revision-title"
                                    className="text-title font-semibold"
                                >
                                    {status === 'revision'
                                        ? 'Tanggapi feedback tanpa menghapus history.'
                                        : 'Perbarui draft sebelum dikirim.'}
                                </h2>
                            </div>
                            <ContributionComposer
                                mode="revision"
                                projects={[revisionProject]}
                                initialValues={revisionInitialValues}
                                processing={revisionForm.processing}
                                errors={revisionForm.errors as ErrorMap}
                                onSubmit={saveRevision}
                                onCancel={() => setIsEditing(false)}
                            />
                        </section>
                    ) : (
                        <>
                            <section
                                aria-labelledby="contribution-current-title"
                                className="grid gap-5 border-y border-border"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-5 md:px-3">
                                    <div>
                                        <p className="font-label text-label text-muted-foreground">
                                            VERSI AKTIF
                                        </p>
                                        <h2
                                            id="contribution-current-title"
                                            className="mt-1 text-title font-semibold"
                                        >
                                            {currentVersion === null
                                                ? 'Belum ada detail versi'
                                                : `Versi ${currentVersion.version_number}`}
                                        </h2>
                                    </div>
                                    {currentVersion && (
                                        <time
                                            dateTime={currentVersion.created_at}
                                            className="text-sm text-muted-foreground"
                                        >
                                            {formatDate(
                                                currentVersion.created_at,
                                            )}
                                        </time>
                                    )}
                                </div>
                                {currentVersion === null ? (
                                    <div className="flex items-start gap-3 border-t border-border px-1 py-5 text-sm leading-6 text-muted-foreground md:px-3">
                                        <FileWarning
                                            aria-hidden="true"
                                            className="mt-1 size-4 shrink-0"
                                        />
                                        <p>
                                            Draft belum memiliki versi yang
                                            dapat ditampilkan.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 border-t border-border px-1 py-5 md:px-3">
                                        <div className="grid gap-2">
                                            <p className="font-label text-label text-muted-foreground">
                                                TASK
                                            </p>
                                            <p className="text-base font-semibold break-words">
                                                {currentVersion.task.title}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <p className="font-label text-label text-muted-foreground">
                                                KLAIM
                                            </p>
                                            <p className="text-base leading-7 break-words">
                                                {currentVersion.claim}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <p className="font-label text-label text-muted-foreground">
                                                RINGKASAN PEKERJAAN
                                            </p>
                                            <p className="text-base leading-7 break-words whitespace-pre-wrap">
                                                {currentVersion.summary}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <p className="font-label text-label text-muted-foreground">
                                                PERNYATAAN
                                            </p>
                                            <p className="border-l-2 border-border pl-3 text-sm leading-6 break-words text-muted-foreground">
                                                {currentVersion.declaration}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {currentVersion && (
                                <section
                                    aria-labelledby="contribution-evidence-title"
                                    className="grid gap-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-label text-label text-muted-foreground">
                                                EVIDENCE PRIVATE
                                            </p>
                                            <h2
                                                id="contribution-evidence-title"
                                                className="mt-1 text-title font-semibold"
                                            >
                                                Bukti yang ditautkan
                                            </h2>
                                        </div>
                                        <span className="font-label text-label text-muted-foreground">
                                            {currentVersion.evidence.length}/20
                                            FILE
                                        </span>
                                    </div>
                                    {currentVersion.evidence.length === 0 ? (
                                        <div
                                            data-test="contribution-missing-evidence"
                                            className="flex items-start gap-3 border-y border-pending/30 bg-pending-subtle px-1 py-5 text-sm leading-6 text-pending-subtle-foreground md:px-3"
                                        >
                                            <FileWarning
                                                aria-hidden="true"
                                                className="mt-1 size-4 shrink-0"
                                            />
                                            <p>
                                                Belum ada evidence. Contribution
                                                dapat disimpan sebagai draft,
                                                tetapi pengiriman untuk validasi
                                                membutuhkan minimal satu file.
                                            </p>
                                        </div>
                                    ) : (
                                        <ul
                                            className="grid border-y border-border"
                                            data-test="contribution-evidence-list"
                                        >
                                            {currentVersion.evidence.map(
                                                (item) => (
                                                    <li
                                                        key={item.id}
                                                        className="flex min-w-0 items-start gap-3 border-b border-border px-1 py-4 last:border-b-0 md:px-3"
                                                    >
                                                        {item.available ? (
                                                            <FileCheck2
                                                                aria-hidden="true"
                                                                className="mt-1 size-4 shrink-0 text-verified"
                                                            />
                                                        ) : (
                                                            <FileWarning
                                                                aria-hidden="true"
                                                                className="mt-1 size-4 shrink-0 text-correction"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold break-words">
                                                                {item.attachment
                                                                    ?.original_name ??
                                                                    item.source_label}
                                                            </p>
                                                            <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
                                                                {item.available
                                                                    ? `${item.attachment?.mime_type ?? 'File'} · ${formatFileSize(item.attachment?.size_bytes ?? 0)}`
                                                                    : 'File tidak lagi tersedia. Pilih evidence baru saat revisi.'}
                                                            </p>
                                                        </div>
                                                        <span className="font-label text-label text-muted-foreground">
                                                            {item.available
                                                                ? 'TERSEDIA'
                                                                : 'HILANG'}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </section>
                            )}

                            <section
                                aria-labelledby="contribution-review-title"
                                className="grid gap-4"
                            >
                                <div>
                                    <p className="font-label text-label text-muted-foreground">
                                        VALIDATION TRACE
                                    </p>
                                    <h2
                                        id="contribution-review-title"
                                        className="mt-1 text-title font-semibold"
                                    >
                                        Feedback reviewer
                                    </h2>
                                </div>
                                <ReviewFeedback
                                    reviews={contribution.reviews}
                                />
                            </section>

                            <section
                                aria-labelledby="contribution-history-title"
                                className="grid gap-4"
                            >
                                <div>
                                    <p className="font-label text-label text-muted-foreground">
                                        APPEND-ONLY HISTORY
                                    </p>
                                    <h2
                                        id="contribution-history-title"
                                        className="mt-1 text-title font-semibold"
                                    >
                                        Versi dan provenance
                                    </h2>
                                </div>
                                <ol
                                    className="grid border-y border-border"
                                    data-test="contribution-version-history"
                                >
                                    {contribution.versions
                                        .slice()
                                        .reverse()
                                        .map((version) => (
                                            <li
                                                key={version.id}
                                                className="grid gap-2 border-b border-border px-1 py-4 last:border-b-0 md:grid-cols-[8rem_minmax(0,1fr)_10rem] md:items-start md:px-3"
                                            >
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <History
                                                        aria-hidden="true"
                                                        className="size-4 text-primary"
                                                    />
                                                    Versi{' '}
                                                    {version.version_number}
                                                </div>
                                                <p className="min-w-0 text-sm leading-6 break-words">
                                                    {version.claim}
                                                </p>
                                                <time
                                                    dateTime={
                                                        version.created_at
                                                    }
                                                    className="text-xs text-muted-foreground md:text-right"
                                                >
                                                    {formatDate(
                                                        version.created_at,
                                                    )}
                                                </time>
                                            </li>
                                        ))}
                                </ol>
                            </section>
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}
