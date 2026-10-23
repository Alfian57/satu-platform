import { useHttp } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { firstError } from '@/pages/contributions/_utils/contribution-helpers';
import type { ErrorMap } from '@/pages/contributions/_utils/contribution-helpers';
import { show as contributionShow } from '@/routes/contributions';
import type {
    ContributionApiResponse,
    ContributionComposerValues,
    ContributionDetail,
    ContributionPayload,
    ContributionProjectOption,
    ContributionReview,
    ContributionVersion,
} from '@/types/contribution';

export interface UseContributionDetailProps {
    initialContribution: ContributionDetail;
    initialPermissions: {
        can_update: boolean;
        can_submit: boolean;
    };
    projects: ContributionProjectOption[];
}

export interface UseContributionDetailReturn {
    state: {
        contribution: ContributionDetail;
        permissions: {
            can_update: boolean;
            can_submit: boolean;
        };
        isEditing: boolean;
        actionMessage: string | null;
        actionError: string | null;
        needsCheck: boolean;
        accessDenied: boolean;
        draftDirty: boolean;
        checkedContribution: ContributionDetail | null;
        isComposerOpen: boolean;
        currentVersion: ContributionVersion | null;
        latestReview: ContributionReview | null;
        revisionProject: ContributionProjectOption | undefined;
        revisionInitialValues: Partial<ContributionComposerValues> | undefined;
        submitErrors: string[];
        revisionError: string | undefined;
        revisionErrors: Record<string, unknown>;
        isSubmitting: boolean;
        isRevising: boolean;
        isCheckingLatest: boolean;
    };
    actions: {
        setIsEditing: (editing: boolean) => void;
        setDraftDirty: (dirty: boolean) => void;
        checkLatest: () => void;
        useLatest: () => void;
        submitContribution: () => void;
        saveRevision: (values: ContributionComposerValues) => void;
        cancelRevision: () => void;
        clearActionError: () => void;
    };
    refs: {
        revisionHeading: React.RefObject<HTMLHeadingElement | null>;
        editButton: React.RefObject<HTMLButtonElement | null>;
        submitErrorSummary: React.RefObject<HTMLDivElement | null>;
    };
}

export function useContributionDetail({
    initialContribution,
    initialPermissions,
    projects,
}: UseContributionDetailProps): UseContributionDetailReturn {
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
        Boolean(revisionProject) &&
        Boolean(currentVersion);

    const revisionHeading = useRef<HTMLHeadingElement | null>(null);
    const editButton = useRef<HTMLButtonElement | null>(null);
    const submitErrorSummary = useRef<HTMLDivElement | null>(null);
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

    function cancelRevision(): void {
        if (
            !draftDirty ||
            window.confirm(
                'Tutup editor dan buang perubahan yang belum disimpan?',
            )
        ) {
            setIsEditing(false);
            setDraftDirty(false);
        }
    }

    function clearActionError(): void {
        setActionError(null);
    }

    const submitErrors = Object.keys(submitForm.errors)
        .map((field) => firstError(submitForm.errors as ErrorMap, field))
        .filter((message): message is string => Boolean(message));

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

    return {
        state: {
            contribution,
            permissions,
            isEditing,
            actionMessage,
            actionError,
            needsCheck,
            accessDenied,
            draftDirty,
            checkedContribution,
            isComposerOpen,
            currentVersion,
            latestReview,
            revisionProject,
            revisionInitialValues,
            submitErrors,
            revisionError,
            revisionErrors: revisionForm.errors as Record<string, unknown>,
            isSubmitting: submitForm.processing,
            isRevising: revisionForm.processing,
            isCheckingLatest: readForm.processing,
        },
        actions: {
            setIsEditing,
            setDraftDirty,
            checkLatest,
            useLatest,
            submitContribution,
            saveRevision,
            cancelRevision,
            clearActionError,
        },
        refs: {
            revisionHeading,
            editButton,
            submitErrorSummary,
        },
    };
}
