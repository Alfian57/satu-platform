import { router, useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ContributionController from '@/actions/App/Http/Controllers/ContributionController';
import { show as contributionShow } from '@/routes/contributions';
import type {
    ContributionApiResponse,
    ContributionComposerValues,
    ContributionPayload,
} from '@/types/contribution';

export interface UseContributionCreateReturn {
    state: {
        actionError: string | null;
        needsCheck: boolean;
        accessDenied: boolean;
        processing: boolean;
        errors: Record<string, unknown>;
    };
    actions: {
        saveDraft: (values: ContributionComposerValues) => void;
        canLeave: () => boolean;
        resetRecovery: () => void;
    };
}

export function useContributionCreate(): UseContributionCreateReturn {
    const [actionError, setActionError] = useState<string | null>(null);
    const commandLock = useRef(false);
    const saved = useRef(false);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    const form = useHttp<ContributionPayload, ContributionApiResponse>({
        task_id: '',
        claim: '',
        summary: '',
        declaration:
            'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.',
        evidence: [],
    });

    function saveDraft(values: ContributionComposerValues): void {
        if (
            values.project_id === 0 ||
            form.processing ||
            commandLock.current ||
            needsCheck ||
            accessDenied
        ) {
            return;
        }

        commandLock.current = true;
        setActionError(null);
        const payload: ContributionPayload = {
            task_id: values.task_id,
            claim: values.claim,
            summary: values.summary,
            declaration: values.declaration,
            evidence: values.evidence,
        };

        form.transform(() => payload);
        form.post(ContributionController.store(values.project_id).url, {
            onHttpException: (response: { status: number }) => {
                if (response.status === 403 || response.status === 404) {
                    setAccessDenied(true);
                } else {
                    setNeedsCheck(true);
                }

                setActionError(
                    response.status === 403
                        ? 'Draft belum dapat dibuat karena akses proyek sudah berubah.'
                        : 'Hasil penyimpanan belum dapat dipastikan. Periksa daftar kontribusi sebelum membuat draft lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setNeedsCheck(true);
                setActionError(
                    'Hasil penyimpanan belum pasti. Isian tetap ada. Periksa daftar kontribusi untuk menghindari draft ganda.',
                );

                return false;
            },
        })
            .then((response) => {
                if (!response?.data) {
                    return;
                }

                saved.current = true;
                router.visit(contributionShow(response.data.id), {
                    replace: true,
                });
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    function canLeave(): boolean {
        return saved.current;
    }

    function resetRecovery(): void {
        setNeedsCheck(false);
        setActionError(null);
    }

    return {
        state: {
            actionError,
            needsCheck,
            accessDenied,
            processing: form.processing,
            errors: form.errors as Record<string, unknown>,
        },
        actions: {
            saveDraft,
            canLeave,
            resetRecovery,
        },
    };
}
