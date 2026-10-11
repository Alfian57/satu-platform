import { Head, Link, useHttp } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    FileCheck2,
    FileWarning,
    ExternalLink,
    History,
    LockKeyhole,
    MessageSquareText,
    PencilLine,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { AppPage } from '@/components/app-page';
import { ContributionComposer } from '@/components/contributions/contribution-composer';
import {
    ContributionStatusBadge,
    contributionStatusMeta,
} from '@/components/contributions/contribution-status';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    index as contributionsIndex,
    show as contributionShow,
} from '@/routes/contributions';
import { show as portfolioShow } from '@/routes/portfolio';
import { download as downloadAttachment } from '@/routes/projects/workspace/attachments';
import type {
    ContributionApiResponse,
    ContributionComposerValues,
    ContributionDetail,
    ContributionPayload,
    ContributionProjectOption,
    ContributionProvenanceEvent,
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

function verificationLabel(status: ContributionStatus): string {
    return status === 'approved'
        ? 'Terverifikasi kampus'
        : 'Dilaporkan sendiri';
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

function ReviewFeedback({
    reviews,
    versions,
}: {
    reviews: ContributionReview[];
    versions: ContributionDetail['versions'];
}) {
    if (reviews.length === 0) {
        return (
            <div
                data-test="contribution-review-empty"
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground"
            >
                <MessageSquareText
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                />
                <p>
                    Belum ada keputusan validasi. Catatan kampus akan muncul di
                    sini setelah pemeriksaan.
                </p>
            </div>
        );
    }

    return (
        <ol
            className="grid min-w-0 gap-3"
            data-test="contribution-review-timeline"
        >
            {reviews
                .slice()
                .reverse()
                .map((review) => {
                    const meta = reviewMeta(review.decision);
                    const versionNumber = versions.find(
                        (version) =>
                            version.id === review.contribution_version_id,
                    )?.version_number;

                    return (
                        <li
                            key={review.id}
                            className="grid min-w-0 gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:grid-cols-[10rem_minmax(0,1fr)]"
                        >
                            <div className="grid content-start gap-1">
                                <span
                                    className={cn(
                                        'inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                                        meta.className,
                                    )}
                                >
                                    {meta.label}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    {versionNumber === undefined
                                        ? 'Versi sumber tidak tersedia'
                                        : `Keputusan versi ${versionNumber}`}
                                </p>
                                <time
                                    dateTime={review.reviewed_at}
                                    className="text-xs text-muted-foreground"
                                >
                                    {formatDate(review.reviewed_at)}
                                </time>
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <p className="text-sm font-semibold [overflow-wrap:anywhere]">
                                    {review.reviewer.name}
                                </p>
                                {review.reason && (
                                    <p className="text-sm leading-6 [overflow-wrap:anywhere]">
                                        {review.reason}
                                    </p>
                                )}
                                {review.note && (
                                    <p className="rounded-xl bg-accent/40 p-4 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
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

function provenanceDecisionLabel(
    decision: ContributionProvenanceEvent['decision'],
): string {
    return {
        approved: 'Disetujui',
        revision: 'Perlu revisi',
        rejected: 'Belum disetujui',
    }[decision ?? 'rejected'];
}

function portfolioOutcomeLabel(
    status: NonNullable<
        ContributionDetail['provenance']['portfolio']
    >['status'],
): string {
    return {
        private: 'Tersimpan privat',
        published: 'Terbit sesuai pengaturan visibilitas',
        withdrawn: 'Ditarik sementara',
        source_unavailable: 'Sumber perlu diperiksa',
    }[status];
}

function ProvenanceTrace({
    provenance,
}: Pick<ContributionDetail, 'provenance'>) {
    return (
        <section
            aria-labelledby="contribution-provenance-title"
            className="grid min-w-0 gap-5 border-t border-border/70 px-1 pt-6"
            data-test="contribution-provenance-chain"
        >
            <div>
                <p className="text-xs font-semibold text-primary">
                    Jejak pekerjaan
                </p>
                <h2
                    id="contribution-provenance-title"
                    className="mt-1 text-title font-semibold"
                >
                    Dari pekerjaan ke portofolio
                </h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-6 text-muted-foreground">
                    Lihat hubungan antara tugas, versi catatan, keputusan
                    kampus, dan portofolio. Bukti privat tetap terlindungi.
                </p>
            </div>

            {provenance.timeline.length === 0 ? (
                <p className="text-sm leading-6 [overflow-wrap:anywhere] text-muted-foreground">
                    Belum ada jejak pekerjaan yang dapat ditampilkan.
                </p>
            ) : (
                <ol className="grid min-w-0 border-l-2 border-primary/20 pl-5">
                    {provenance.timeline.map((event) => (
                        <li
                            key={event.id}
                            className="relative grid min-w-0 gap-2 border-b border-border/70 py-5 first:pt-1 last:border-b-0"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute top-6 -left-[1.6rem] size-2 rounded-full bg-primary ring-4 ring-background"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                    {event.label}
                                </p>
                                <time
                                    dateTime={event.occurred_at}
                                    className="text-xs text-muted-foreground"
                                >
                                    {formatDate(event.occurred_at)}
                                </time>
                            </div>
                            {event.task && (
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Tugas: {event.task.title}
                                    {event.version_number !== null
                                        ? `, versi ${event.version_number}`
                                        : ''}
                                </p>
                            )}
                            {event.decision && (
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {provenanceDecisionLabel(event.decision)}{' '}
                                    oleh{' '}
                                    {event.reviewer?.name ?? 'reviewer kampus'}
                                </p>
                            )}
                            {event.portfolio && (
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className="font-semibold [overflow-wrap:anywhere]">
                                        {event.portfolio.title}
                                    </span>
                                    <span className="max-w-full rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                        {portfolioOutcomeLabel(
                                            event.portfolio.status,
                                        )}
                                    </span>
                                    <Link
                                        href={portfolioShow(event.portfolio.id)}
                                        className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        data-test="contribution-portfolio-link"
                                    >
                                        Buka portofolio
                                        <ExternalLink
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Link>
                                </div>
                            )}
                        </li>
                    ))}
                </ol>
            )}

            {provenance.portfolio === null && (
                <p className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                    Catatan portofolio dibuat setelah kontribusi divalidasi oleh
                    kampus. Kamu tetap mengatur visibilitasnya secara terpisah.
                </p>
            )}
        </section>
    );
}

export default function ContributionsShow({
    contribution: initialContribution,
    projects,
    permissions: initialPermissions,
}: ContributionsShowProps) {
    const [contribution, setContribution] = useState(initialContribution);
    const [isEditing, setIsEditing] = useState(
        initialContribution.status === 'revision',
    );
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [permissions, setPermissions] = useState(initialPermissions);
    const commandLock = useRef(false);
    const [lastInitialRevision, setLastInitialRevision] = useState(
        initialContribution.revision,
    );
    const [needsCheck, setNeedsCheck] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [draftDirty, setDraftDirty] = useState(false);
    const [checkedContribution, setCheckedContribution] =
        useState<ContributionDetail | null>(null);
    const readForm = useHttp<Record<string, never>, ContributionApiResponse>(
        {},
    );

    const submitForm = useHttp<
        { expected_revision: string },
        ContributionApiResponse
    >({ expected_revision: initialContribution.revision });
    const revisionForm = useHttp<
        ContributionPayload & { expected_revision: string },
        ContributionApiResponse
    >({
        expected_revision: initialContribution.revision,
        task_id: '',
        claim: '',
        summary: '',
        declaration: '',
        evidence: [],
    });

    if (initialContribution.revision !== lastInitialRevision) {
        setLastInitialRevision(initialContribution.revision);

        if (isEditing) {
            setCheckedContribution(initialContribution);
            setNeedsCheck(true);
        } else {
            setContribution(initialContribution);
            setPermissions(initialPermissions);
        }
    }

    const status = contribution.status;
    const meta = contributionStatusMeta[status];
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
    const isComposerOpen =
        isEditing &&
        permissions.can_update &&
        !!revisionProject &&
        !!currentVersion;
    const revisionHeading = useRef<HTMLHeadingElement>(null);
    const editButton = useRef<HTMLButtonElement>(null);
    const previousComposerOpen = useRef(isComposerOpen);

    useEffect(() => {
        if (isComposerOpen !== previousComposerOpen.current) {
            if (isComposerOpen) {
                revisionHeading.current?.focus();
            } else {
                editButton.current?.focus();
            }
        }

        previousComposerOpen.current = isComposerOpen;
    }, [isComposerOpen]);
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

    function commandOptions() {
        return {
            onHttpException: (response: { status: number }) => {
                if (response.status === 403 || response.status === 404) {
                    setAccessDenied(true);
                } else {
                    setNeedsCheck(true);
                }

                setActionError(
                    response.status === 409
                        ? 'Sumber kontribusi berubah. Isian tetap ada. Periksa data terbaru.'
                        : response.status === 403 || response.status === 404
                          ? 'Akses kontribusi tidak tersedia. Konten privat disembunyikan.'
                          : 'Hasil pengiriman belum dapat dipastikan. Periksa data terbaru sebelum mengirim lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setNeedsCheck(true);
                setActionError(
                    'Hasil pengiriman belum pasti. Isian tetap ada. Periksa data terbaru, jangan langsung mengirim ulang.',
                );

                return false;
            },
        };
    }

    function checkLatest(): void {
        if (commandLock.current || readForm.processing || accessDenied) {
            return;
        }

        setCheckedContribution(null);
        readForm
            .get(contributionShow(contribution.id).url, {
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessDenied(true);
                    }

                    setActionError(
                        'Data terbaru belum dapat dibaca. Pengiriman tetap ditahan.',
                    );
                    setNeedsCheck(true);

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Koneksi belum tersedia. Isian tetap ada dan pengiriman tetap ditahan.',
                    );
                    setNeedsCheck(true);

                    return false;
                },
            })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                if (response.permissions) {
                    setPermissions(response.permissions);
                }

                if (
                    isEditing &&
                    response.data.revision !== contribution.revision
                ) {
                    setCheckedContribution(response.data);
                    setNeedsCheck(true);
                    setActionError(
                        'Ada versi atau bukti baru. Periksa sumber, lalu pilih Gunakan data terbaru untuk memulai dari versi tersebut.',
                    );
                } else {
                    setContribution(response.data);
                    setNeedsCheck(false);
                    setActionError(null);
                    submitForm.clearErrors();
                    revisionForm.clearErrors();
                }
            })
            .catch(() => undefined);
    }

    function useLatest(): void {
        if (!checkedContribution || commandLock.current) {
            return;
        }

        if (
            draftDirty &&
            !window.confirm(
                'Gunakan versi terbaru dan buang perubahan lokal yang belum disimpan?',
            )
        ) {
            return;
        }

        setContribution(checkedContribution);
        setIsEditing(
            checkedContribution.status === 'draft' ||
                checkedContribution.status === 'revision',
        );
        setCheckedContribution(null);
        setDraftDirty(false);
        setNeedsCheck(false);
        setActionError(null);
        submitForm.clearErrors();
        revisionForm.clearErrors();
    }

    function submitContribution(): void {
        if (
            commandLock.current ||
            needsCheck ||
            readForm.processing ||
            isComposerOpen ||
            !permissions.can_submit
        ) {
            return;
        }

        commandLock.current = true;
        setActionError(null);
        setActionMessage(null);
        submitForm.transform(() => ({
            expected_revision: contribution.revision,
        }));
        submitForm
            .post(
                ContributionController.submit(contribution.id).url,
                commandOptions(),
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                setContribution(response.data);

                if (response.permissions) {
                    setPermissions(response.permissions);
                }

                setActionMessage(
                    'Kontribusi sudah dikirim untuk validasi kampus.',
                );
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    function saveRevision(values: ContributionComposerValues): void {
        if (
            commandLock.current ||
            needsCheck ||
            readForm.processing ||
            !permissions.can_update
        ) {
            return;
        }

        commandLock.current = true;
        setActionError(null);
        setActionMessage(null);
        revisionForm.transform(() => ({
            task_id: values.task_id,
            claim: values.claim,
            summary: values.summary,
            declaration: values.declaration,
            evidence: values.evidence,
            expected_revision: contribution.revision,
        }));
        revisionForm
            .post(
                ContributionController.revise(contribution.id).url,
                commandOptions(),
            )
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                setContribution(response.data);

                if (response.permissions) {
                    setPermissions(response.permissions);
                }

                setIsEditing(false);
                setDraftDirty(false);
                setActionMessage(
                    'Versi baru tersimpan sebagai draft. Periksa lalu kirim untuk validasi.',
                );
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    const submitErrors = Object.keys(submitForm.errors)
        .map((field) => firstError(submitForm.errors as ErrorMap, field))
        .filter((message): message is string => Boolean(message));
    const submitErrorSummary = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (
            Object.keys(submitForm.errors).length > 0 &&
            !submitForm.processing
        ) {
            submitErrorSummary.current?.focus();
        }
    }, [submitForm.errors, submitForm.processing]);
    const revisionError = firstError(
        revisionForm.errors as ErrorMap,
        'revision',
    );

    const contextRail = (
        <div className="grid gap-6">
            <section className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/50 p-5 shadow-md sm:p-6">
                <p className="text-xs font-semibold text-primary">
                    Langkah berikutnya
                </p>
                <div data-test="contribution-status">
                    <ContributionStatusBadge status={status} />
                </div>
                <p className="text-lg leading-snug font-bold tracking-tight">
                    {meta.nextStep}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                    {meta.description}
                </p>
                {permissions.can_submit &&
                    status === 'draft' &&
                    !isComposerOpen && (
                        <Button
                            type="button"
                            className="min-h-11 w-full cursor-pointer rounded-xl whitespace-normal disabled:cursor-not-allowed"
                            onClick={submitContribution}
                            disabled={
                                submitForm.processing ||
                                revisionForm.processing ||
                                needsCheck ||
                                readForm.processing
                            }
                            data-test="contribution-submit"
                        >
                            {submitForm.processing && (
                                <Spinner aria-hidden="true" />
                            )}
                            Kirim untuk validasi
                        </Button>
                    )}
                {permissions.can_update &&
                    (status === 'draft' || status === 'revision') &&
                    !isComposerOpen &&
                    revisionProject &&
                    currentVersion && (
                        <Button
                            type="button"
                            variant="outline"
                            ref={editButton}
                            className="min-h-11 w-full cursor-pointer rounded-xl whitespace-normal disabled:cursor-not-allowed"
                            onClick={() => {
                                setActionError(null);
                                setIsEditing(true);
                            }}
                            disabled={
                                submitForm.processing || revisionForm.processing
                            }
                            data-test="contribution-edit"
                        >
                            <PencilLine aria-hidden="true" />
                            {status === 'revision'
                                ? 'Tanggapi revisi'
                                : 'Edit draft'}
                        </Button>
                    )}
                {isComposerOpen && (
                    <p className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                        Simpan perubahan atau tutup editor untuk kembali ke
                        detail. Pengiriman untuk validasi dilakukan setelah
                        draft tersimpan.
                    </p>
                )}
                {status === 'pending' && (
                    <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                        <LockKeyhole
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <p>Mode baca. Perubahan menunggu keputusan reviewer.</p>
                    </div>
                )}
                <p
                    className="min-h-5 text-xs leading-5 font-medium text-primary"
                    role="status"
                    aria-live="polite"
                    data-test="contribution-submit-status"
                >
                    {submitForm.processing
                        ? 'Mengirim untuk validasi kampus...'
                        : null}
                </p>
            </section>
            <section
                className="grid min-w-0 gap-3 rounded-2xl border border-border bg-card p-4"
                data-test="contribution-recovery"
            >
                <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 whitespace-normal"
                    onClick={checkLatest}
                    disabled={
                        submitForm.processing ||
                        revisionForm.processing ||
                        readForm.processing
                    }
                >
                    {readForm.processing
                        ? 'Memeriksa sumber...'
                        : 'Periksa data terbaru'}
                </Button>
                {needsCheck && (
                    <p role="status" className="text-sm leading-6">
                        Pengiriman ditahan sampai sumber terbaru diperiksa.
                        Draft lokal tidak ditimpa.
                    </p>
                )}
                {checkedContribution && (
                    <div className="grid gap-3 text-sm leading-6">
                        <p>
                            Versi terbaru:{' '}
                            {checkedContribution.current_version
                                ?.version_number ?? 'tidak tersedia'}
                            . Status:{' '}
                            {
                                contributionStatusMeta[
                                    checkedContribution.status
                                ].label
                            }
                            .
                        </p>
                        <p className="wrap-anywhere">
                            {checkedContribution.current_version?.claim}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-auto min-h-11 whitespace-normal"
                            onClick={useLatest}
                            data-test="contribution-use-latest"
                        >
                            Gunakan data terbaru
                        </Button>
                    </div>
                )}
            </section>
            <section className="grid min-w-0 gap-4 border-t border-border/70 px-1 pt-5">
                <p className="text-xs font-semibold text-primary">
                    Informasi catatan
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
                    Validasi mengacu pada kontribusi dan versi yang ditinjau,
                    bukan seluruh keahlian atau jaminan kualitas mutlak. Tidak
                    ada janji waktu pemeriksaan, kredit akademik, atau akses
                    perekrut.
                </p>
            </section>
            <div className="flex items-start gap-3 border-t border-border/70 px-1 pt-5 text-sm leading-6 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-verified"
                />
                <p>
                    Bukti pekerjaan bersifat privat. Aksesnya mengikuti izin
                    pada proyek, bukan otomatis terbuka untuk perekrut.
                </p>
            </div>
        </div>
    );

    return (
        <>
            <Head title={`Kontribusi ${contribution.id}`} />
            <AppPage>
                {accessDenied ? (
                    <section
                        role="alert"
                        className="grid gap-4 rounded-3xl border border-border bg-card p-6"
                        data-test="contribution-access-denied"
                    >
                        <h1 className="text-2xl font-bold">
                            Akses kontribusi tidak tersedia
                        </h1>
                        <p>
                            Konten privat disembunyikan. Periksa afiliasi dan
                            izin proyek sebelum membuka kembali.
                        </p>
                        <Button asChild variant="outline">
                            <Link href={contributionsIndex()}>
                                Kembali ke kontribusi
                            </Link>
                        </Button>
                    </section>
                ) : (
                    <>
                        <div
                            className="grid w-full min-w-0 gap-6"
                            data-test="contribution-detail-root"
                        >
                            <header
                                className="relative isolate grid min-w-0 gap-4 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-sky-100 p-5 shadow-md sm:p-7 lg:pr-48"
                                data-test="contribution-detail-header"
                            >
                                <ArchiveArt className="absolute top-5 right-7 -z-10 hidden w-36 opacity-55 lg:block" />
                                <Link
                                    href={contributionsIndex()}
                                    className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    data-test="back-to-contributions"
                                >
                                    <ArrowLeft
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Kembali ke kontribusi
                                </Link>
                                <div className="grid gap-3">
                                    <p className="font-label text-label text-primary">
                                        CATATAN KONTRIBUSI / {contribution.id}
                                    </p>
                                    <h1 className="max-w-[36ch] text-2xl leading-tight font-bold text-balance [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
                                        {currentVersion?.claim ??
                                            contribution.project.title}
                                    </h1>
                                    <p className="max-w-[72ch] text-sm leading-7 [overflow-wrap:anywhere] text-muted-foreground sm:text-base">
                                        Proyek {contribution.project.title}.
                                        Dicatat oleh {contribution.owner.name}.
                                    </p>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Detail pekerjaan, bukti, dan keputusan
                                        validasi tersimpan dalam satu catatan.
                                    </p>
                                </div>
                            </header>
                            <div
                                className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                                data-test="contribution-detail-grid"
                            >
                                <aside
                                    className="min-w-0 xl:order-2"
                                    aria-label="Aksi dan konteks kontribusi"
                                >
                                    {contextRail}
                                </aside>
                                <div className="grid min-w-0 content-start gap-6 xl:order-1">
                                    <div
                                        className="min-h-0 text-sm"
                                        data-test="contribution-action-status"
                                    >
                                        {actionMessage && (
                                            <div
                                                role="status"
                                                className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified-subtle px-4 py-3 text-verified-subtle-foreground"
                                            >
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
                                                className="flex items-start gap-3 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 [overflow-wrap:anywhere] text-correction-subtle-foreground"
                                                data-test="contribution-action-error"
                                            >
                                                <AlertCircle
                                                    aria-hidden="true"
                                                    className="mt-1 size-4 shrink-0"
                                                />
                                                <p>{actionError}</p>
                                            </div>
                                        )}
                                        {submitErrors.length > 0 && (
                                            <div
                                                ref={submitErrorSummary}
                                                role="alert"
                                                tabIndex={-1}
                                                data-test="contribution-submit-errors"
                                                className="mt-2 grid gap-2 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <p className="font-semibold">
                                                    Kontribusi belum terkirim.
                                                    Periksa catatan berikut.
                                                </p>
                                                <ul className="list-inside list-disc space-y-1 [overflow-wrap:anywhere]">
                                                    {submitErrors.map(
                                                        (message, index) => (
                                                            <li key={index}>
                                                                {message}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                                <p>
                                                    Draft tetap tersimpan.
                                                    Perbaiki catatan sebelum
                                                    mengirim kembali.
                                                </p>
                                            </div>
                                        )}
                                        {revisionError && (
                                            <p className="mt-2 rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-correction-subtle-foreground">
                                                {revisionError}
                                            </p>
                                        )}
                                    </div>

                                    {latestReview?.decision === 'revision' && (
                                        <section
                                            data-test="contribution-revision-feedback"
                                            className="grid min-w-0 gap-3 rounded-3xl border border-correction/30 bg-correction-subtle p-5 shadow-md sm:p-6"
                                        >
                                            <div className="flex items-center gap-2 text-base font-bold text-correction-subtle-foreground">
                                                <MessageSquareText
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                                Catatan kampus untuk versi aktif
                                            </div>
                                            <p className="text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-correction-subtle-foreground">
                                                {latestReview.reason ||
                                                    latestReview.note ||
                                                    'Kampus meminta penjelasan atau bukti tambahan.'}
                                            </p>
                                            {latestReview.reason &&
                                                latestReview.note && (
                                                    <p className="rounded-2xl bg-white/50 p-4 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-correction-subtle-foreground">
                                                        {latestReview.note}
                                                    </p>
                                                )}
                                        </section>
                                    )}

                                    {isEditing &&
                                        permissions.can_update &&
                                        (!revisionProject ||
                                            !currentVersion) && (
                                            <p
                                                role="status"
                                                className="rounded-2xl border border-pending/30 bg-pending-subtle p-5 text-sm leading-6 text-pending-subtle-foreground"
                                            >
                                                Sumber pekerjaan untuk revisi
                                                belum tersedia. Kamu tetap dapat
                                                membaca catatan ini, tetapi
                                                belum dapat menyimpan perubahan.
                                            </p>
                                        )}
                                    {isComposerOpen &&
                                    revisionProject &&
                                    currentVersion ? (
                                        <section
                                            aria-labelledby="contribution-revision-title"
                                            className="grid min-w-0 gap-5"
                                        >
                                            <div className="grid gap-2">
                                                <p className="text-xs font-semibold text-primary">
                                                    {status === 'revision'
                                                        ? 'Respons revisi'
                                                        : 'Editor draft'}
                                                </p>
                                                <h2
                                                    id="contribution-revision-title"
                                                    ref={revisionHeading}
                                                    tabIndex={-1}
                                                    className="scroll-mt-24 rounded-lg text-title font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                >
                                                    {status === 'revision'
                                                        ? 'Perbaiki catatan, tetap simpan riwayat.'
                                                        : 'Perbarui draft sebelum dikirim.'}
                                                </h2>
                                            </div>
                                            <ContributionComposer
                                                key={contribution.revision}
                                                mode="revision"
                                                projects={[revisionProject]}
                                                initialValues={
                                                    revisionInitialValues
                                                }
                                                processing={
                                                    revisionForm.processing
                                                }
                                                blocked={
                                                    needsCheck ||
                                                    readForm.processing
                                                }
                                                onDirtyChange={setDraftDirty}
                                                errors={
                                                    revisionForm.errors as ErrorMap
                                                }
                                                onSubmit={saveRevision}
                                                onCancel={() => {
                                                    if (
                                                        !draftDirty ||
                                                        window.confirm(
                                                            'Tutup editor dan buang perubahan yang belum disimpan?',
                                                        )
                                                    ) {
                                                        setIsEditing(false);
                                                        setDraftDirty(false);
                                                    }
                                                }}
                                            />
                                        </section>
                                    ) : (
                                        <>
                                            <section
                                                aria-labelledby="contribution-current-title"
                                                className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7"
                                            >
                                                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary">
                                                            Versi aktif
                                                        </p>
                                                        <h2
                                                            id="contribution-current-title"
                                                            className="mt-2 text-2xl leading-snug font-bold tracking-tight"
                                                        >
                                                            {currentVersion ===
                                                            null
                                                                ? 'Belum ada detail versi'
                                                                : `Versi ${currentVersion.version_number}`}
                                                        </h2>
                                                    </div>
                                                    {currentVersion && (
                                                        <time
                                                            dateTime={
                                                                currentVersion.created_at
                                                            }
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
                                                            Draft belum memiliki
                                                            versi yang dapat
                                                            ditampilkan.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid min-w-0 gap-6 border-t border-border pt-5">
                                                        <div className="grid gap-2">
                                                            <p className="text-xs font-semibold text-muted-foreground">
                                                                Tugas
                                                            </p>
                                                            <p className="text-base font-semibold [overflow-wrap:anywhere]">
                                                                {
                                                                    currentVersion
                                                                        .task
                                                                        .title
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <p className="text-xs font-semibold text-muted-foreground">
                                                                Judul kontribusi
                                                            </p>
                                                            <p className="text-base leading-7 [overflow-wrap:anywhere]">
                                                                {
                                                                    currentVersion.claim
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <p className="text-xs font-semibold text-muted-foreground">
                                                                Ringkasan karya
                                                                yang dapat
                                                                dibagikan
                                                            </p>
                                                            <p className="text-base leading-7 [overflow-wrap:anywhere] whitespace-pre-wrap">
                                                                {
                                                                    currentVersion.summary
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <p className="text-xs font-semibold text-muted-foreground">
                                                                Pernyataan
                                                                pemilik (privat)
                                                            </p>
                                                            <p className="rounded-2xl bg-muted/40 p-4 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                                                                {
                                                                    currentVersion.declaration
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </section>

                                            {currentVersion && (
                                                <section
                                                    aria-labelledby="contribution-evidence-title"
                                                    className="grid min-w-0 gap-5 rounded-3xl border border-primary/10 bg-linear-to-br from-accent/70 to-background p-5 sm:p-6"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-semibold text-primary">
                                                                Bukti privat
                                                            </p>
                                                            <h2
                                                                id="contribution-evidence-title"
                                                                className="mt-1 text-title font-semibold"
                                                            >
                                                                Bukti yang
                                                                ditautkan
                                                            </h2>
                                                        </div>
                                                        <span className="font-label text-label text-muted-foreground">
                                                            {
                                                                currentVersion
                                                                    .evidence
                                                                    .length
                                                            }
                                                            /20 BERKAS
                                                        </span>
                                                    </div>
                                                    {currentVersion.evidence
                                                        .length === 0 ? (
                                                        <div
                                                            data-test="contribution-missing-evidence"
                                                            className="flex min-w-0 items-start gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground"
                                                        >
                                                            <FileWarning
                                                                aria-hidden="true"
                                                                className="mt-1 size-4 shrink-0"
                                                            />
                                                            <p>
                                                                Belum ada bukti.
                                                                Kontribusi dapat
                                                                disimpan sebagai
                                                                draft, tetapi
                                                                pengiriman untuk
                                                                validasi
                                                                membutuhkan
                                                                minimal satu
                                                                berkas.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <ul
                                                            className="grid min-w-0 gap-3"
                                                            data-test="contribution-evidence-list"
                                                        >
                                                            {currentVersion.evidence.map(
                                                                (item) => (
                                                                    <li
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
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
                                                                            <p className="text-sm font-semibold [overflow-wrap:anywhere]">
                                                                                {item
                                                                                    .attachment
                                                                                    ?.original_name ??
                                                                                    item.source_label}
                                                                            </p>
                                                                            <p className="mt-1 text-xs leading-5 [overflow-wrap:anywhere] text-muted-foreground">
                                                                                {item.available
                                                                                    ? `${item.attachment?.mime_type ?? 'File'} · ${formatFileSize(item.attachment?.size_bytes ?? 0)}`
                                                                                    : 'Berkas tidak lagi tersedia. Pilih bukti baru saat revisi.'}
                                                                            </p>
                                                                        </div>
                                                                        <span className="col-start-2 text-xs font-semibold text-muted-foreground">
                                                                            {item.available &&
                                                                            item.attachment ? (
                                                                                <a
                                                                                    href={
                                                                                        downloadAttachment(
                                                                                            {
                                                                                                project:
                                                                                                    contribution
                                                                                                        .project
                                                                                                        .id,
                                                                                                attachment:
                                                                                                    item
                                                                                                        .attachment
                                                                                                        .id,
                                                                                            },
                                                                                        )
                                                                                            .url
                                                                                    }
                                                                                    className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
                                                                                >
                                                                                    Unduh
                                                                                    bukti
                                                                                    privat
                                                                                </a>
                                                                            ) : (
                                                                                'TIDAK TERSEDIA'
                                                                            )}
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
                                                className="grid min-w-0 gap-5 border-t border-border/70 px-1 pt-6"
                                            >
                                                <div>
                                                    <p className="text-xs font-semibold text-primary">
                                                        Jejak validasi
                                                    </p>
                                                    <h2
                                                        id="contribution-review-title"
                                                        className="mt-1 text-title font-semibold"
                                                    >
                                                        Umpan balik kampus
                                                    </h2>{' '}
                                                </div>
                                                <ReviewFeedback
                                                    versions={
                                                        contribution.versions
                                                    }
                                                    reviews={
                                                        contribution.reviews
                                                    }
                                                />
                                            </section>

                                            <ProvenanceTrace
                                                provenance={
                                                    contribution.provenance
                                                }
                                            />

                                            <section
                                                aria-labelledby="contribution-history-title"
                                                className="grid min-w-0 gap-5 border-t border-border/70 px-1 pt-6"
                                            >
                                                <div>
                                                    <p className="text-xs font-semibold text-primary">
                                                        Riwayat catatan
                                                    </p>
                                                    <h2
                                                        id="contribution-history-title"
                                                        className="mt-1 text-title font-semibold"
                                                    >
                                                        Versi tersimpan
                                                    </h2>
                                                </div>
                                                {contribution.versions
                                                    .length === 0 && (
                                                    <p className="rounded-2xl bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                                                        Belum ada versi catatan
                                                        yang tersimpan.
                                                    </p>
                                                )}
                                                <ol
                                                    className="grid min-w-0 gap-3"
                                                    data-test="contribution-version-history"
                                                >
                                                    {contribution.versions
                                                        .slice()
                                                        .reverse()
                                                        .map((version) => (
                                                            <li
                                                                key={version.id}
                                                                className="grid min-w-0 gap-3 border-b border-border/70 py-4 last:border-b-0 lg:grid-cols-[6rem_minmax(0,1fr)]"
                                                            >
                                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                                    <History
                                                                        aria-hidden="true"
                                                                        className="size-4 text-primary"
                                                                    />
                                                                    Versi{' '}
                                                                    {
                                                                        version.version_number
                                                                    }
                                                                </div>
                                                                <p className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">
                                                                    {
                                                                        version.claim
                                                                    }
                                                                </p>
                                                                <time
                                                                    dateTime={
                                                                        version.created_at
                                                                    }
                                                                    className="text-xs text-muted-foreground lg:col-start-2"
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
                            </div>
                        </div>
                    </>
                )}
            </AppPage>
        </>
    );
}

ContributionsShow.layout = {
    breadcrumbs: [
        { title: 'Kontribusi', href: contributionsIndex() },
        { title: 'Detail kontribusi' },
    ],
};
