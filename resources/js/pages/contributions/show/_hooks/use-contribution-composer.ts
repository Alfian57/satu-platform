import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    defaultDeclaration,
    firstError,
} from '@/pages/contributions/_utils/contribution-helpers';
import type { ErrorMap } from '@/pages/contributions/_utils/contribution-helpers';
import type {
    ContributionComposerValues,
    ContributionProjectOption,
} from '@/types/contribution';

export interface UseContributionComposerProps {
    mode: 'create' | 'revision';
    projects: ContributionProjectOption[];
    initialValues?: Partial<ContributionComposerValues>;
    processing: boolean;
    blocked?: boolean;
    canLeave?: () => boolean;
    errors: ErrorMap;
    onSubmit: (values: ContributionComposerValues) => void;
    onDirtyChange?: (dirty: boolean) => void;
}

export interface UseContributionComposerReturn {
    state: {
        projectId: number;
        taskId: number | '';
        claim: string;
        summary: string;
        declaration: string;
        evidence: number[];
        selectedProject: ContributionProjectOption | null;
        taskError: string | undefined;
        claimError: string | undefined;
        summaryError: string | undefined;
        declarationError: string | undefined;
        evidenceError: string | undefined;
        hasErrors: boolean;
        dirty: boolean;
    };
    actions: {
        setProjectId: (id: number) => void;
        setTaskId: (id: number | '') => void;
        setClaim: (claim: string) => void;
        setSummary: (summary: string) => void;
        setDeclaration: (declaration: string) => void;
        toggleEvidence: (attachmentId: number) => void;
        submit: (event: React.FormEvent<HTMLFormElement>) => void;
    };
    refs: {
        errorSummary: React.RefObject<HTMLDivElement | null>;
    };
}

export function useContributionComposer({
    projects,
    initialValues,
    processing,
    canLeave,
    errors,
    onSubmit,
    onDirtyChange,
}: UseContributionComposerProps): UseContributionComposerReturn {
    const initialProject =
        projects.find((project) => project.id === initialValues?.project_id) ??
        projects[0] ??
        null;
    const initialProjectId = initialProject?.id ?? 0;
    const [projectId, setProjectId] = useState<number>(initialProjectId);
    const [taskId, setTaskId] = useState<number | ''>(
        initialValues?.task_id ?? '',
    );
    const [claim, setClaim] = useState(initialValues?.claim ?? '');
    const [summary, setSummary] = useState(initialValues?.summary ?? '');
    const [declaration, setDeclaration] = useState(
        initialValues?.declaration ?? defaultDeclaration(),
    );
    const [evidence, setEvidence] = useState<number[]>(
        initialValues?.evidence ?? [],
    );

    const [initialDraft] = useState(
        JSON.stringify({
            project_id: initialProjectId,
            task_id: initialValues?.task_id ?? '',
            claim: initialValues?.claim ?? '',
            summary: initialValues?.summary ?? '',
            declaration: initialValues?.declaration ?? defaultDeclaration(),
            evidence: initialValues?.evidence ?? [],
        }),
    );
    const dirty =
        JSON.stringify({
            project_id: projectId,
            task_id: taskId,
            claim,
            summary,
            declaration,
            evidence,
        }) !== initialDraft;

    useEffect(() => {
        onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);

    useEffect(() => {
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (dirty && !canLeave?.()) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', beforeUnload);
        const remove = router.on('before', (event) => {
            if (canLeave?.()) {
                return;
            }

            if (
                event.detail.visit.async ||
                event.detail.visit.url.pathname === window.location.pathname
            ) {
                return;
            }

            if (processing) {
                return false;
            }

            if (
                dirty &&
                !window.confirm(
                    'Ada perubahan belum disimpan. Tinggalkan halaman dan buang perubahan?',
                )
            ) {
                return false;
            }
        });

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            remove();
        };
    }, [dirty, processing, canLeave]);

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === projectId) ?? null,
        [projectId, projects],
    );

    function handleProjectChange(id: number): void {
        setProjectId(id);
        setTaskId('');
        setEvidence([]);
    }

    function toggleEvidence(attachmentId: number): void {
        setEvidence((current) =>
            current.includes(attachmentId)
                ? current.filter((id) => id !== attachmentId)
                : current.length >= 20
                  ? current
                  : [...current, attachmentId],
        );
    }

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        onSubmit({
            project_id: projectId,
            task_id: taskId,
            claim,
            summary,
            declaration,
            evidence,
        });
    }

    const taskError = firstError(errors, 'task_id');
    const claimError = firstError(errors, 'claim');
    const summaryError = firstError(errors, 'summary');
    const declarationError = firstError(errors, 'declaration');
    const evidenceError = Object.keys(errors)
        .filter((key) => key === 'evidence' || key.startsWith('evidence.'))
        .map((key) => firstError(errors, key))
        .find(Boolean);
    const errorSummary = useRef<HTMLDivElement | null>(null);
    const hasErrors = Object.keys(errors).length > 0;

    useEffect(() => {
        if (hasErrors && !processing) {
            errorSummary.current?.focus();
        }
    }, [errors, hasErrors, processing]);

    return {
        state: {
            projectId,
            taskId,
            claim,
            summary,
            declaration,
            evidence,
            selectedProject,
            taskError,
            claimError,
            summaryError,
            declarationError,
            evidenceError,
            hasErrors,
            dirty,
        },
        actions: {
            setProjectId: handleProjectChange,
            setTaskId,
            setClaim,
            setSummary,
            setDeclaration,
            toggleEvidence,
            submit,
        },
        refs: {
            errorSummary,
        },
    };
}
