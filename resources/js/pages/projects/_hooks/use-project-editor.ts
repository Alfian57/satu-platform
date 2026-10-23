import { router, useHttp } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import { initialFormData } from '@/pages/projects/_components/editor/editor-utils';
import type {
    EditorMode,
    FormErrorMap,
} from '@/pages/projects/_components/editor/editor-utils';
import { show as projectShow } from '@/routes/projects';
import type {
    ProjectApiResponse,
    ProjectDetail,
    ProjectFormData,
    ProjectFormRole,
    ProjectInstitution,
    ProjectSkill,
    ProjectTransitionData,
    ProjectVisibility,
} from '@/types/project';

export interface UseProjectEditorOptions {
    mode: EditorMode;
    institution: ProjectInstitution;
    project?: ProjectDetail;
}

export function useProjectEditor({
    mode,
    institution,
    project,
}: UseProjectEditorOptions) {
    const form = useHttp<ProjectFormData, ProjectApiResponse>(
        useMemo(
            () => initialFormData(mode, institution, project),
            [institution, mode, project],
        ),
    );
    const openingForm = useHttp<ProjectTransitionData, ProjectApiResponse>({
        reason: '',
        occupied_capacity: 0,
        expected_updated_at: project?.updated_at,
    });
    const [submitIntent, setSubmitIntent] = useState<'draft' | 'open'>('draft');
    const [actionError, setActionError] = useState<string | null>(null);
    const [uncertainSave, setUncertainSave] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [savedDraft, setSavedDraft] = useState<ProjectDetail | null>(null);
    const errorSummaryRef = useRef<HTMLDivElement>(null);
    const actionErrorRef = useRef<HTMLDivElement>(null);

    const errors = form.errors as FormErrorMap;
    const openingErrors = openingForm.errors as FormErrorMap;
    const roleCapacity = form.data.roles.reduce(
        (total, role) => total + Number(role.capacity || 0),
        0,
    );
    const isProcessing = form.processing || openingForm.processing;

    useEffect(() => {
        if (form.hasErrors) {
            errorSummaryRef.current?.focus();
        } else if (actionError) {
            actionErrorRef.current?.focus();
        }
    }, [form.hasErrors, actionError]);

    function focusErrors(): void {
        window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
    }

    function setTitle(title: string): void {
        form.setData('title', title);
    }

    function setDescription(description: string): void {
        form.setData('description', description);
    }

    function setCapacity(capacity: number): void {
        form.setData('capacity', capacity);
    }

    function setDeadline(deadline: string): void {
        form.setData('deadline', deadline);
    }

    function setVisibility(visibility: ProjectVisibility): void {
        form.setData('visibility', visibility);
    }

    function updateRole(index: number, patch: Partial<ProjectFormRole>): void {
        form.setData(
            'roles',
            form.data.roles.map((role, roleIndex) =>
                roleIndex === index ? { ...role, ...patch } : role,
            ),
        );
    }

    function updateRoleSkill(index: number, skill: ProjectSkill): void {
        const currentSkills = form.data.roles[index]?.skills ?? [];
        const skillExists = currentSkills.some(
            (currentSkill) => currentSkill.taxonomy_id === skill.taxonomy_id,
        );

        updateRole(index, {
            skills: skillExists
                ? currentSkills.map((currentSkill) =>
                      currentSkill.taxonomy_id === skill.taxonomy_id
                          ? skill
                          : currentSkill,
                  )
                : [...currentSkills, skill],
        });
    }

    function removeRoleSkill(index: number, taxonomyId: number): void {
        updateRole(index, {
            skills: (form.data.roles[index]?.skills ?? []).filter(
                (skill) => skill.taxonomy_id !== taxonomyId,
            ),
        });
    }

    function addRole(): void {
        form.setData('roles', [
            ...form.data.roles,
            {
                title: '',
                description: '',
                capacity: 1,
                skills: [],
                accepts_beginners: null,
                selection_criteria: '',
            },
        ]);
    }

    function removeRole(index: number): void {
        if (form.data.roles.length <= 1) {
            return;
        }

        form.setData(
            'roles',
            form.data.roles.filter((_, roleIndex) => roleIndex !== index),
        );
    }

    function navigateToDetail(nextProject: ProjectDetail): void {
        router.visit(projectShow(nextProject.id), {
            replace: true,
        });
    }

    function openSavedProject(savedProject: ProjectDetail): void {
        setSavedDraft(savedProject);
        setActionError(null);
        openingForm.setData({
            expected_updated_at: savedProject.updated_at,
            occupied_capacity: 0,
        });
        openingForm
            .post(ProjectController.open(savedProject.id).url, {
                onSuccess: (response) => navigateToDetail(response.data),
                onError: focusErrors,
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessDenied(true);
                    }

                    setActionError(
                        response.status === 409
                            ? 'Proyek berubah di sesi lain. Buka detail draft untuk memeriksa status terbaru.'
                            : 'Proyek belum dapat dibuka. Periksa status dan batas waktu proyek.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Draft sudah tersimpan, tetapi hasil pembukaan belum dapat dipastikan. Buka detail proyek untuk memeriksa statusnya.',
                    );

                    return false;
                },
            })
            .catch(() => undefined);
    }

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (isProcessing || uncertainSave || savedDraft) {
            return;
        }

        setActionError(null);
        const onSuccess = (response: ProjectApiResponse) => {
            if (mode === 'create' && submitIntent === 'open') {
                openSavedProject(response.data);

                return;
            }

            navigateToDetail(response.data);
        };
        const requestOptions = {
            onSuccess,
            onError: focusErrors,
            onHttpException: (response: { status: number }) => {
                if (response.status === 403 || response.status === 404) {
                    setAccessDenied(true);
                }

                setUncertainSave(true);
                setActionError(
                    response.status === 409
                        ? 'Proyek berubah di sesi lain. Muat ulang halaman, lalu simpan kembali.'
                        : 'Hasil penyimpanan belum dapat dipastikan. Periksa Proyek saya sebelum menyimpan kembali.',
                );

                return false;
            },
            onNetworkError: () => {
                setUncertainSave(true);
                setActionError(
                    'Hasil penyimpanan belum dapat dipastikan. Draft tetap tersedia. Periksa Proyek saya sebelum menyimpan kembali.',
                );

                return false;
            },
        };

        const request =
            mode === 'create'
                ? form.post(ProjectController.store().url, requestOptions)
                : form.patch(
                      ProjectController.update(project?.id ?? 0).url,
                      requestOptions,
                  );

        request.catch(() => undefined);
    }

    return {
        state: {
            data: form.data,
            hasErrors: form.hasErrors,
            errors,
            openingErrors,
            submitIntent,
            actionError,
            uncertainSave,
            accessDenied,
            savedDraft,
            roleCapacity,
            isProcessing,
            formProcessing: form.processing,
            openingProcessing: openingForm.processing,
        },
        actions: {
            setTitle,
            setDescription,
            setCapacity,
            setDeadline,
            setVisibility,
            updateRole,
            updateRoleSkill,
            removeRoleSkill,
            addRole,
            removeRole,
            setSubmitIntent,
            submit,
            openSavedProject,
            focusErrors,
            setAccessDenied,
            setActionError,
        },
        refs: {
            errorSummaryRef,
            actionErrorRef,
        },
        errorSummaryRef,
        actionErrorRef,
    };
}

export type UseProjectEditorReturn = ReturnType<typeof useProjectEditor>;
