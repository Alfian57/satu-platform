import { Link, router, useHttp } from '@inertiajs/react';
import { Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import SkillTaxonomyController from '@/actions/App/Http/Controllers/SkillTaxonomyController';
import { AppPage } from '@/components/app-page';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
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

type EditorMode = 'create' | 'edit';

type ProjectEditorProps = {
    mode: EditorMode;
    institution: ProjectInstitution;
    project?: ProjectDetail;
};

type Taxonomy = {
    id: number;
    name: string;
    category: string;
    description: string | null;
};

type TaxonomyResponse = {
    data: Taxonomy[];
};

type FormErrorMap = Record<string, string | string[] | undefined>;

const selectClassName =
    'h-11 min-w-0 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

const textAreaClassName =
    'min-h-32 min-w-0 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

const visibilityOptions: { value: ProjectVisibility; label: string }[] = [
    { value: 'institution', label: 'Kampus' },
    { value: 'public', label: 'Publik' },
    { value: 'private', label: 'Pribadi milikmu' },
];

const proficiencyOptions = [
    { value: 'beginner', label: 'Pemula' },
    { value: 'intermediate', label: 'Menengah' },
    { value: 'advanced', label: 'Mahir' },
    { value: 'expert', label: 'Ahli' },
];

function defaultDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28);

    return dateTimeLocalValue(deadline.toISOString());
}

function dateTimeLocalValue(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return localDate.toISOString().slice(0, 16);
}

function initialRoles(project?: ProjectDetail): ProjectFormRole[] {
    if (project?.roles.length) {
        return project.roles.map((role) => ({
            id: role.id,
            title: role.title,
            description: role.description ?? '',
            capacity: role.capacity,
            accepts_beginners: role.accepts_beginners ?? null,
            selection_criteria: role.selection_criteria ?? '',
            skills: role.skills.map((skill) => ({ ...skill })),
        }));
    }

    return [
        {
            title: '',
            description: '',
            capacity: 1,
            accepts_beginners: null,
            selection_criteria: '',
            skills: [],
        },
    ];
}

function initialFormData(
    mode: EditorMode,
    institution: ProjectInstitution,
    project?: ProjectDetail,
): ProjectFormData {
    return {
        ...(mode === 'create' ? { institution_id: institution.id } : {}),
        title: project?.title ?? '',
        description: project?.description ?? '',
        visibility: (project?.visibility as ProjectVisibility) ?? 'institution',
        capacity: project?.capacity ?? 5,
        deadline: project?.deadline
            ? dateTimeLocalValue(project.deadline)
            : defaultDeadline(),
        roles: initialRoles(project),
        ...(project?.updated_at
            ? { expected_updated_at: project.updated_at }
            : {}),
    };
}

function errorMessage(errors: FormErrorMap, field: string): string | undefined {
    const message = errors[field];

    if (Array.isArray(message)) {
        return message[0];
    }

    return message;
}

function EditorContextRail({
    institution,
    mode,
    project,
    roleCapacity,
    totalCapacity,
}: {
    institution: ProjectInstitution;
    mode: EditorMode;
    project?: ProjectDetail;
    roleCapacity: number;
    totalCapacity: number;
}) {
    return (
        <div className="grid min-w-0 gap-5 rounded-3xl border border-border bg-linear-to-br from-accent/70 to-background p-5 sm:p-6">
            <section className="grid gap-3 border-b border-border/60 pb-5">
                <p className="text-xs font-semibold text-primary">
                    Konteks proyek
                </p>
                <h2 className="text-title font-semibold wrap-anywhere">
                    {institution.name}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    {mode === 'create'
                        ? 'Proyek baru akan dibuat sebagai draft dan tetap berada dalam ruang kampus ini.'
                        : 'Perubahan ini hanya dapat dilakukan oleh pemilik proyek pada afiliasi kampus yang terverifikasi.'}
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        Status proyek
                    </dt>
                    <dd className="font-semibold">
                        {(
                            {
                                draft: 'Draft',
                                open: 'Terbuka',
                                forming: 'Pembentukan tim',
                                full: 'Penuh',
                                closed: 'Ditutup',
                                cancelled: 'Dibatalkan',
                                archived: 'Diarsipkan',
                            } as Record<string, string>
                        )[project?.status ?? 'draft'] ?? project?.status}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        Kapasitas peran
                    </dt>
                    <dd className="font-semibold">
                        {roleCapacity} dari {totalCapacity} slot
                    </dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Setelah disimpan, proyek dapat dibuka ketika kebutuhan tim dan
                batas waktu sudah siap. Perubahan status tetap tercatat di
                riwayat audit.
            </p>
        </div>
    );
}

function SkillPicker({
    roleIndex,
    skills,
    onAdd,
    onRemove,
    validationError,
}: {
    roleIndex: number;
    skills: ProjectSkill[];
    onAdd: (skill: ProjectSkill) => void;
    onRemove: (taxonomyId: number) => void;
    validationError?: string;
}) {
    const request = useHttp<Record<string, never>, TaxonomyResponse>({});
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Taxonomy[]>([]);
    const [open, setOpen] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
    const listboxId = `project-role-${roleIndex}-skills-listbox`;
    const search = request.get;
    const cancel = request.cancel;

    useEffect(() => {
        if (query.trim() === '') {
            return;
        }

        const timeout = window.setTimeout(() => {
            setHasError(false);
            search(
                SkillTaxonomyController.index({
                    query: { query: query.trim() },
                }).url,
                {
                    onSuccess: (response) => setOptions(response.data),
                    onHttpException: () => {
                        setHasError(true);

                        return false;
                    },
                    onNetworkError: () => {
                        setHasError(true);

                        return false;
                    },
                },
            ).catch(() => undefined);
        }, 180);

        return () => {
            window.clearTimeout(timeout);
            cancel();
        };
    }, [cancel, query, search]);

    const availableOptions = options.filter(
        (option) =>
            option.category !== 'interest' &&
            !skills.some((skill) => skill.taxonomy_id === option.id),
    );

    function selectSkill(option: Taxonomy) {
        onAdd({
            taxonomy_id: option.id,
            name: option.name,
            proficiency: 'intermediate',
        });
        setQuery('');
        setOptions([]);
        setOpen(false);
        setActiveOptionIndex(-1);
    }

    return (
        <div className="grid min-w-0 gap-2">
            <Label
                htmlFor={`project-role-${roleIndex}-skill-search`}
                className="text-xs text-muted-foreground"
            >
                Keahlian minimum
            </Label>
            <div className="relative">
                <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    id={`project-role-${roleIndex}-skill-search`}
                    data-test={`project-role-${roleIndex}-skill-search`}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-expanded={open}
                    aria-invalid={Boolean(validationError)}
                    aria-describedby={
                        validationError
                            ? `project-role-${roleIndex}-skills-error`
                            : undefined
                    }
                    aria-activedescendant={
                        open &&
                        !request.processing &&
                        availableOptions[activeOptionIndex]
                            ? `${listboxId}-${availableOptions[activeOptionIndex].id}`
                            : undefined
                    }
                    className="h-11 pr-11 pl-9"
                    placeholder="Cari keahlian dari daftar SATU"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOptions([]);
                        setActiveOptionIndex(-1);
                        setOpen(true);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setOpen(false);
                            setActiveOptionIndex(-1);
                        } else if (
                            event.key === 'ArrowDown' ||
                            event.key === 'ArrowUp'
                        ) {
                            event.preventDefault();
                            setOpen(true);

                            if (
                                !request.processing &&
                                availableOptions.length > 0
                            ) {
                                const direction =
                                    event.key === 'ArrowDown' ? 1 : -1;
                                const nextIndex =
                                    activeOptionIndex < 0
                                        ? direction === 1
                                            ? 0
                                            : availableOptions.length - 1
                                        : (activeOptionIndex +
                                              direction +
                                              availableOptions.length) %
                                          availableOptions.length;
                                setActiveOptionIndex(nextIndex);
                                document
                                    .getElementById(
                                        `${listboxId}-${availableOptions[nextIndex].id}`,
                                    )
                                    ?.scrollIntoView({ block: 'nearest' });
                            }
                        } else if (event.key === 'Enter' && open) {
                            event.preventDefault();

                            if (
                                !request.processing &&
                                availableOptions[activeOptionIndex]
                            ) {
                                selectSkill(
                                    availableOptions[activeOptionIndex],
                                );
                            }
                        }
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                />
                {query !== '' && (
                    <button
                        type="button"
                        aria-label="Hapus pencarian keahlian"
                        className="absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            setQuery('');
                            setOptions([]);
                        }}
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                )}
                {open && (
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-label="Pilihan keahlian"
                        className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md"
                    >
                        {request.processing ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                                <Spinner aria-hidden="true" />
                                Mencari keahlian...
                            </div>
                        ) : hasError ? (
                            <p className="px-3 py-3 text-sm text-correction-subtle-foreground">
                                Keahlian belum dapat dimuat. Coba lagi.
                            </p>
                        ) : query.trim() === '' ? (
                            <p className="px-3 py-3 text-sm text-muted-foreground">
                                Ketik untuk mencari keahlian yang tersedia.
                            </p>
                        ) : availableOptions.length === 0 ? (
                            <p
                                className="px-3 py-3 text-sm text-muted-foreground"
                                role="status"
                            >
                                Tidak ada keahlian yang cocok.
                            </p>
                        ) : (
                            availableOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="option"
                                    id={`${listboxId}-${option.id}`}
                                    aria-selected={
                                        availableOptions[activeOptionIndex]
                                            ?.id === option.id
                                    }
                                    tabIndex={-1}
                                    className={cn(
                                        'flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted',
                                        availableOptions[activeOptionIndex]
                                            ?.id === option.id &&
                                            'bg-accent text-accent-foreground',
                                    )}
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => selectSkill(option)}
                                >
                                    <span className="min-w-0">
                                        <span className="block font-medium wrap-anywhere">
                                            {option.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {option.category}
                                        </span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
            {skills.length > 0 && (
                <ul
                    className="grid min-w-0 gap-2"
                    aria-label="Keahlian terpilih"
                >
                    {skills.map((skill) => (
                        <li
                            key={skill.taxonomy_id}
                            className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-center"
                        >
                            <span className="min-w-0 text-sm font-medium wrap-anywhere">
                                {skill.name ?? `Keahlian #${skill.taxonomy_id}`}
                            </span>
                            <select
                                aria-label={`Tingkat keahlian ${skill.name ?? skill.taxonomy_id}`}
                                className={cn(selectClassName, 'h-11')}
                                value={skill.proficiency}
                                onChange={(event) =>
                                    onAdd({
                                        ...skill,
                                        proficiency: event.target.value,
                                    })
                                }
                            >
                                {proficiencyOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                aria-label={`Hapus keahlian ${skill.name ?? skill.taxonomy_id}`}
                                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground"
                                onClick={() => onRemove(skill.taxonomy_id)}
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function ProjectEditor({
    mode,
    institution,
    project,
}: ProjectEditorProps) {
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
    const errorSummary = useRef<HTMLDivElement>(null);
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
            errorSummary.current?.focus();
        } else if (actionError) {
            actionErrorRef.current?.focus();
        }
    }, [form.hasErrors, actionError]);

    function focusErrors() {
        window.requestAnimationFrame(() => errorSummary.current?.focus());
    }

    function updateRole(index: number, patch: Partial<ProjectFormRole>) {
        form.setData(
            'roles',
            form.data.roles.map((role, roleIndex) =>
                roleIndex === index ? { ...role, ...patch } : role,
            ),
        );
    }

    function updateRoleSkill(index: number, skill: ProjectSkill) {
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

    function removeRoleSkill(index: number, taxonomyId: number) {
        updateRole(index, {
            skills: (form.data.roles[index]?.skills ?? []).filter(
                (skill) => skill.taxonomy_id !== taxonomyId,
            ),
        });
    }

    function addRole() {
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

    function removeRole(index: number) {
        if (form.data.roles.length <= 1) {
            return;
        }

        form.setData(
            'roles',
            form.data.roles.filter((_, roleIndex) => roleIndex !== index),
        );
    }

    function navigateToDetail(nextProject: ProjectDetail) {
        router.visit(projectShow(nextProject.id), {
            replace: true,
        });
    }

    function openSavedProject(savedProject: ProjectDetail) {
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

    function submit(
        event: React.FormEvent<HTMLFormElement>,
        intent: 'draft' | 'open',
    ) {
        event.preventDefault();

        if (isProcessing || uncertainSave || savedDraft) {
            return;
        }

        setSubmitIntent(intent);
        setActionError(null);
        const onSuccess = (response: ProjectApiResponse) => {
            if (mode === 'create' && intent === 'open') {
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

    if (accessDenied) {
        return (
            <AppPage>
                <section
                    data-test="project-editor-access-denied"
                    className="space-y-4 rounded-3xl border border-border bg-card p-6"
                >
                    <h1 className="text-2xl font-bold">
                        Editor proyek tidak dapat diakses
                    </h1>
                    <p>
                        Data sebelumnya disembunyikan. Periksa afiliasi dan izin
                        pemilik sebelum membuka proyek kembali.
                    </p>
                    <Button asChild variant="outline">
                        <Link
                            href={ProjectController.index({
                                query: {
                                    view: 'mine',
                                    institution_id: institution.id,
                                },
                            })}
                        >
                            Kembali ke Proyek saya
                        </Link>
                    </Button>
                </section>
            </AppPage>
        );
    }

    return (
        <AppPage>
            <div
                data-test="project-editor-root"
                className="grid w-full min-w-0 gap-6"
            >
                <header className="relative isolate grid min-w-0 gap-3 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-sky-100 p-5 shadow-md sm:p-7 lg:pr-48">
                    <ArchiveArt className="absolute top-5 right-5 -z-10 hidden w-36 -rotate-6 opacity-55 lg:block" />
                    <p className="font-label text-label text-primary">
                        {mode === 'create' ? 'Proyek baru' : 'Ubah proyek'} /{' '}
                        {institution.name}
                    </p>
                    <h1 className="max-w-[28ch] text-2xl leading-snug font-bold tracking-tight wrap-anywhere sm:text-3xl">
                        {mode === 'create'
                            ? 'Mulai ide baru bersama timmu.'
                            : 'Rapikan kebutuhan proyekmu.'}
                    </h1>
                    <p className="max-w-[70ch] text-body text-muted-foreground">
                        Isi kebutuhan peran, kapasitas, visibilitas, dan batas
                        waktu. Informasi ini membantu mahasiswa memahami peluang
                        kolaborasi sebelum mengambil tindakan.
                    </p>
                </header>

                <div
                    data-test="project-editor-grid"
                    className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                >
                    <div className="grid min-w-0 gap-6">
                        {actionError && (
                            <div
                                ref={actionErrorRef}
                                tabIndex={-1}
                                role="alert"
                                data-test="project-editor-action-error"
                                className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                            >
                                <p>{actionError}</p>
                                <Link
                                    href={
                                        savedDraft
                                            ? projectShow(savedDraft.id)
                                            : ProjectController.index({
                                                  query: {
                                                      view: 'mine',
                                                      institution_id:
                                                          institution.id,
                                                  },
                                              })
                                    }
                                    className="mt-3 inline-flex min-h-11 cursor-pointer items-center font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                >
                                    {savedDraft
                                        ? 'Periksa proyek yang sudah tersimpan'
                                        : 'Periksa Proyek saya'}
                                </Link>
                            </div>
                        )}

                        {form.hasErrors && (
                            <div
                                ref={errorSummary}
                                tabIndex={-1}
                                role="alert"
                                data-test="project-editor-errors"
                                className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <p className="font-semibold">
                                    Ada bagian yang perlu diperiksa sebelum
                                    disimpan.
                                </p>
                                <p className="mt-1 leading-6">
                                    Pesan kesalahan ditampilkan di dekat kolom
                                    terkait.
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {Object.entries(errors).map(([field]) => (
                                        <li key={field}>
                                            {errorMessage(errors, field)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {Object.keys(openingErrors).length > 0 && (
                            <div
                                role="alert"
                                className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                            >
                                Proyek tersimpan sebagai draft, tetapi belum
                                dapat dibuka. Periksa batas waktu dan status
                                proyek.
                            </div>
                        )}

                        {savedDraft && !openingForm.processing && (
                            <section
                                role="status"
                                data-test="project-saved-draft"
                                className="space-y-2 rounded-2xl border border-border bg-accent/60 p-4 text-sm leading-6"
                            >
                                <p>
                                    Draft sudah tersimpan. Periksa proyek ini
                                    sebelum mengulangi tindakan.
                                </p>
                                <Link
                                    href={projectShow(savedDraft.id)}
                                    className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                >
                                    Buka detail draft dan periksa statusnya
                                </Link>
                            </section>
                        )}
                        <form
                            data-test="project-editor-form"

                            aria-busy={isProcessing}
                            className="grid min-w-0 gap-6"
                            onSubmit={(event) => submit(event, submitIntent)}
                        >
                            <section className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7">
                                <div>
                                    <p className="text-xs font-semibold text-primary">
                                        01. Informasi proyek
                                    </p>
                                    <h2 className="mt-2 text-2xl leading-tight font-bold tracking-tight">
                                        Apa yang akan dikerjakan bersama?
                                    </h2>
                                </div>

                                <div className="grid min-w-0 gap-2">
                                    <Label htmlFor="project-title">
                                        Judul proyek
                                    </Label>
                                    <Input
                                        id="project-title"
                                        aria-describedby={
                                            errorMessage(errors, 'title')
                                                ? 'project-title-error'
                                                : undefined
                                        }
                                        data-test="project-title"
                                        aria-invalid={
                                            errorMessage(errors, 'title') !==
                                            undefined
                                        }
                                        value={form.data.title}
                                        onChange={(event) =>
                                            form.setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Portal kontribusi mahasiswa"
                                        maxLength={160}
                                        required
                                    />
                                    <InputError
                                        id="project-title-error"
                                        message={errorMessage(errors, 'title')}
                                    />
                                </div>

                                <div className="grid min-w-0 gap-2">
                                    <Label htmlFor="project-description">
                                        Tujuan dan hasil proyek
                                    </Label>
                                    <textarea
                                        id="project-description"
                                        aria-describedby={
                                            errorMessage(errors, 'description')
                                                ? 'project-description-error'
                                                : undefined
                                        }
                                        data-test="project-description"
                                        aria-invalid={
                                            errorMessage(
                                                errors,
                                                'description',
                                            ) !== undefined
                                        }
                                        className={textAreaClassName}
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Jelaskan tujuan, ruang lingkup, dan hasil yang diharapkan."
                                        maxLength={5000}
                                    />
                                    <InputError
                                        id="project-description-error"
                                        message={errorMessage(
                                            errors,
                                            'description',
                                        )}
                                    />
                                </div>
                            </section>

                            <section className="grid min-w-0 gap-5 border-y border-border px-1 py-6">
                                <div>
                                    <p className="text-xs font-semibold text-primary">
                                        02. Pengaturan tim
                                    </p>
                                    <h2 className="mt-2 text-title font-semibold">
                                        Tetapkan kapasitas, waktu, dan
                                        visibilitas.
                                    </h2>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="grid min-w-0 gap-2">
                                        <Label htmlFor="project-capacity">
                                            Kapasitas total
                                        </Label>
                                        <Input
                                            id="project-capacity"
                                            aria-describedby={
                                                errorMessage(errors, 'capacity')
                                                    ? 'project-capacity-error'
                                                    : undefined
                                            }
                                            data-test="project-capacity"
                                            type="number"
                                            min={1}
                                            max={20}
                                            aria-invalid={
                                                errorMessage(
                                                    errors,
                                                    'capacity',
                                                ) !== undefined
                                            }
                                            value={form.data.capacity}
                                            onChange={(event) =>
                                                form.setData(
                                                    'capacity',
                                                    Number(event.target.value),
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            id="project-capacity-error"
                                            message={errorMessage(
                                                errors,
                                                'capacity',
                                            )}
                                        />
                                    </div>

                                    <div className="grid min-w-0 gap-2">
                                        <Label htmlFor="project-deadline">
                                            Batas waktu
                                        </Label>
                                        <Input
                                            id="project-deadline"
                                            aria-describedby={
                                                errorMessage(errors, 'deadline')
                                                    ? 'project-deadline-error'
                                                    : undefined
                                            }
                                            data-test="project-deadline"
                                            type="datetime-local"
                                            aria-invalid={
                                                errorMessage(
                                                    errors,
                                                    'deadline',
                                                ) !== undefined
                                            }
                                            value={form.data.deadline}
                                            onChange={(event) =>
                                                form.setData(
                                                    'deadline',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            id="project-deadline-error"
                                            message={errorMessage(
                                                errors,
                                                'deadline',
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="project-visibility">
                                            Visibilitas
                                        </Label>
                                        <select
                                            id="project-visibility"
                                            aria-describedby={
                                                errorMessage(
                                                    errors,
                                                    'visibility',
                                                )
                                                    ? 'project-visibility-error'
                                                    : undefined
                                            }
                                            data-test="project-visibility"
                                            className={selectClassName}
                                            aria-invalid={
                                                errorMessage(
                                                    errors,
                                                    'visibility',
                                                ) !== undefined
                                            }
                                            value={form.data.visibility}
                                            onChange={(event) =>
                                                form.setData(
                                                    'visibility',
                                                    event.target
                                                        .value as ProjectVisibility,
                                                )
                                            }
                                        >
                                            {visibilityOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                            Proyek pribadi hanya dapat dilihat
                                            oleh pemilik.
                                        </p>
                                        <InputError
                                            id="project-visibility-error"
                                            message={errorMessage(
                                                errors,
                                                'visibility',
                                            )}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section
                                aria-labelledby="project-roles-title"
                                className="grid min-w-0 gap-5 px-1 py-2"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-primary">
                                            03. Peran dan keahlian
                                        </p>
                                        <h2
                                            id="project-roles-title"
                                            className="mt-2 text-title font-semibold"
                                        >
                                            Siapa yang ingin kamu ajak
                                            berkolaborasi?
                                        </h2>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            Total kapasitas peran tidak boleh
                                            melebihi kapasitas proyek.
                                        </p>
                                    </div>
                                    <p
                                        role="status"
                                        aria-live="polite"
                                        className={cn(
                                            'text-sm font-semibold',
                                            roleCapacity > form.data.capacity
                                                ? 'text-correction-subtle-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {roleCapacity} / {form.data.capacity}{' '}
                                        slot peran
                                    </p>
                                </div>

                                <div className="grid gap-5">
                                    {form.data.roles.map((role, index) => (
                                        <fieldset
                                            key={index}
                                            data-test="project-role"
                                            className="grid min-w-0 gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm focus-within:border-primary/30 motion-safe:transition-colors motion-safe:duration-standard sm:p-6"
                                        >
                                            <legend className="rounded-xl border border-border bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
                                                PERAN{' '}
                                                {String(index + 1).padStart(
                                                    2,
                                                    '0',
                                                )}
                                            </legend>
                                            <div className="flex justify-end border-b border-border pb-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    onClick={() =>
                                                        removeRole(index)
                                                    }
                                                    disabled={
                                                        form.data.roles
                                                            .length <= 1
                                                    }
                                                >
                                                    <Trash2
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                    Hapus peran
                                                </button>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                                                <div className="grid min-w-0 gap-2">
                                                    <Label
                                                        htmlFor={`project-role-${index}-title`}
                                                    >
                                                        Nama peran
                                                    </Label>
                                                    <Input
                                                        id={`project-role-${index}-title`}
                                                        aria-describedby={
                                                            errorMessage(
                                                                errors,
                                                                `roles.${index}.title`,
                                                            )
                                                                ? `project-role-${index}-title-error`
                                                                : undefined
                                                        }
                                                        data-test={`project-role-${index}-title`}
                                                        aria-invalid={
                                                            errorMessage(
                                                                errors,
                                                                `roles.${index}.title`,
                                                            ) !== undefined
                                                        }
                                                        value={role.title}
                                                        onChange={(event) =>
                                                            updateRole(index, {
                                                                title: event
                                                                    .target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder="Contoh: Frontend engineer"
                                                        maxLength={120}
                                                        required
                                                    />
                                                    <InputError
                                                        id={`project-role-${index}-title-error`}
                                                        message={errorMessage(
                                                            errors,
                                                            `roles.${index}.title`,
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid min-w-0 gap-2">
                                                    <Label
                                                        htmlFor={`project-role-${index}-capacity`}
                                                    >
                                                        Kapasitas peran
                                                    </Label>
                                                    <Input
                                                        id={`project-role-${index}-capacity`}
                                                        aria-describedby={
                                                            errorMessage(
                                                                errors,
                                                                `roles.${index}.capacity`,
                                                            )
                                                                ? `project-role-${index}-capacity-error`
                                                                : undefined
                                                        }
                                                        data-test={`project-role-${index}-capacity`}
                                                        type="number"
                                                        min={1}
                                                        max={20}
                                                        aria-invalid={
                                                            errorMessage(
                                                                errors,
                                                                `roles.${index}.capacity`,
                                                            ) !== undefined
                                                        }
                                                        value={role.capacity}
                                                        onChange={(event) =>
                                                            updateRole(index, {
                                                                capacity:
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                            })
                                                        }
                                                        required
                                                    />
                                                    <InputError
                                                        id={`project-role-${index}-capacity-error`}
                                                        message={errorMessage(
                                                            errors,
                                                            `roles.${index}.capacity`,
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid min-w-0 gap-2">
                                                <Label
                                                    htmlFor={`project-role-${index}-description`}
                                                >
                                                    Catatan peran
                                                </Label>
                                                <textarea
                                                    id={`project-role-${index}-description`}
                                                    aria-describedby={
                                                        errorMessage(
                                                            errors,
                                                            `roles.${index}.description`,
                                                        )
                                                            ? `project-role-${index}-description-error`
                                                            : undefined
                                                    }
                                                    data-test={`project-role-${index}-description`}
                                                    className={cn(
                                                        textAreaClassName,
                                                        'min-h-24',
                                                    )}
                                                    aria-invalid={Boolean(
                                                        errorMessage(
                                                            errors,
                                                            `roles.${index}.description`,
                                                        ),
                                                    )}
                                                    value={role.description}
                                                    onChange={(event) =>
                                                        updateRole(index, {
                                                            description:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    placeholder="Jelaskan tugas dan hasil yang diharapkan dari peran ini."
                                                    maxLength={5000}
                                                />
                                                <InputError
                                                    id={`project-role-${index}-description-error`}
                                                    message={errorMessage(
                                                        errors,
                                                        `roles.${index}.description`,
                                                    )}
                                                />
                                            </div>

                                            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                                                <div className="min-w-0 space-y-2">
                                                    <Label
                                                        htmlFor={`project-role-${index}-beginner`}
                                                    >
                                                        Penerimaan pemula
                                                    </Label>
                                                    <select
                                                        id={`project-role-${index}-beginner`}
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={
                                                            role.accepts_beginners ===
                                                            null
                                                                ? 'unspecified'
                                                                : role.accepts_beginners
                                                                  ? 'yes'
                                                                  : 'no'
                                                        }
                                                        disabled={isProcessing}
                                                        onChange={(event) =>
                                                            updateRole(index, {
                                                                accepts_beginners:
                                                                    event.target
                                                                        .value ===
                                                                    'unspecified'
                                                                        ? null
                                                                        : event
                                                                              .target
                                                                              .value ===
                                                                          'yes',
                                                            })
                                                        }
                                                        aria-invalid={Boolean(
                                                            errorMessage(
                                                                errors,
                                                                `roles.${index}.accepts_beginners`,
                                                            ),
                                                        )}
                                                        aria-describedby={`project-role-${index}-beginner-help project-role-${index}-beginner-error`}
                                                    >
                                                        <option value="unspecified">
                                                            Belum dinyatakan
                                                        </option>
                                                        <option value="yes">
                                                            Menerima pemula
                                                        </option>
                                                        <option value="no">
                                                            Membutuhkan
                                                            pengalaman
                                                        </option>
                                                    </select>
                                                    <p
                                                        id={`project-role-${index}-beginner-help`}
                                                        className="text-xs leading-5 text-muted-foreground"
                                                    >
                                                        Nyatakan kebutuhan
                                                        peran. Jangan
                                                        mensyaratkan jumlah
                                                        relasi atau popularitas.
                                                        Pemula tetap mengikuti
                                                        kriteria yang kamu
                                                        jelaskan.
                                                    </p>
                                                    <InputError
                                                        id={`project-role-${index}-beginner-error`}
                                                        message={errorMessage(
                                                            errors,
                                                            `roles.${index}.accepts_beginners`,
                                                        )}
                                                    />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <Label
                                                        htmlFor={`project-role-${index}-criteria`}
                                                    >
                                                        Kriteria pemilihan
                                                        (opsional)
                                                    </Label>
                                                    <textarea
                                                        id={`project-role-${index}-criteria`}
                                                        className={
                                                            textAreaClassName
                                                        }
                                                        value={
                                                            role.selection_criteria
                                                        }
                                                        maxLength={2000}
                                                        disabled={isProcessing}
                                                        onChange={(event) =>
                                                            updateRole(index, {
                                                                selection_criteria:
                                                                    event.target
                                                                        .value,
                                                            })
                                                        }
                                                        placeholder="Kemampuan, minat dan waktu yang dibutuhkan, serta dukungan belajar untuk pemula."
                                                        aria-invalid={Boolean(
                                                            errorMessage(
                                                                errors,
                                                                `roles.${index}.selection_criteria`,
                                                            ),
                                                        )}
                                                        aria-describedby={`project-role-${index}-criteria-help project-role-${index}-criteria-error`}
                                                    />
                                                    <p
                                                        id={`project-role-${index}-criteria-help`}
                                                        className="text-xs leading-5 text-muted-foreground"
                                                    >
                                                        Maksimal 2000 karakter.
                                                        Jelaskan kebutuhan
                                                        kerja, bukan
                                                        kepribadian, IPK atau
                                                        jumlah teman. Ini bukan
                                                        skor atau keputusan
                                                        otomatis.
                                                    </p>
                                                    <InputError
                                                        id={`project-role-${index}-criteria-error`}
                                                        message={errorMessage(
                                                            errors,
                                                            `roles.${index}.selection_criteria`,
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <SkillPicker
                                                roleIndex={index}
                                                validationError={Object.keys(
                                                    errors,
                                                )
                                                    .filter(
                                                        (key) =>
                                                            key ===
                                                                `roles.${index}.skills` ||
                                                            key.startsWith(
                                                                `roles.${index}.skills.`,
                                                            ),
                                                    )
                                                    .map((key) =>
                                                        errorMessage(
                                                            errors,
                                                            key,
                                                        ),
                                                    )
                                                    .find(Boolean)}
                                                skills={role.skills}
                                                onAdd={(skill) =>
                                                    updateRoleSkill(
                                                        index,
                                                        skill,
                                                    )
                                                }
                                                onRemove={(taxonomyId) =>
                                                    removeRoleSkill(
                                                        index,
                                                        taxonomyId,
                                                    )
                                                }
                                            />
                                            <InputError
                                                id={`project-role-${index}-skills-error`}
                                                message={Object.keys(errors)
                                                    .filter(
                                                        (key) =>
                                                            key ===
                                                                `roles.${index}.skills` ||
                                                            key.startsWith(
                                                                `roles.${index}.skills.`,
                                                            ),
                                                    )
                                                    .map((key) =>
                                                        errorMessage(
                                                            errors,
                                                            key,
                                                        ),
                                                    )
                                                    .find(Boolean)}
                                            />
                                        </fieldset>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <InputError
                                        message={errorMessage(errors, 'roles')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer sm:ml-auto"
                                        onClick={addRole}
                                        disabled={form.data.roles.length >= 20}
                                        data-test="add-project-role"
                                    >
                                        Tambah peran
                                    </Button>
                                </div>
                            </section>

                            <footer className="flex min-w-0 flex-col gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-background p-5 shadow-md sm:p-6">
                                <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                                    {mode === 'create'
                                        ? 'Simpan sebagai draft untuk melanjutkan nanti, atau buka sekarang jika kebutuhan tim sudah siap.'
                                        : 'Perubahan disimpan ke proyek ini dan tetap mengikuti status proyek yang sedang berjalan.'}
                                </p>
                                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    {mode === 'create' && (
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            className="h-auto min-h-11 cursor-pointer py-3 whitespace-normal motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                                            disabled={
                                                isProcessing ||
                                                uncertainSave ||
                                                savedDraft !== null
                                            }
                                            data-test="save-project-draft"
                                            onClick={() =>
                                                setSubmitIntent('draft')
                                            }
                                        >
                                            {form.processing &&
                                                submitIntent === 'draft' && (
                                                    <Spinner aria-hidden="true" />
                                                )}
                                            Simpan sebagai draft
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        className="h-auto min-h-11 cursor-pointer py-3 whitespace-normal shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                                        disabled={
                                            isProcessing ||
                                            uncertainSave ||
                                            savedDraft !== null
                                        }
                                        data-test={
                                            mode === 'create'
                                                ? 'save-open-project'
                                                : 'save-project-changes'
                                        }
                                        onClick={() =>
                                            setSubmitIntent(
                                                mode === 'create'
                                                    ? 'open'
                                                    : 'draft',
                                            )
                                        }
                                    >
                                        {isProcessing &&
                                            (mode === 'edit' ||
                                                submitIntent === 'open') && (
                                                <Spinner aria-hidden="true" />
                                            )}
                                        {mode === 'create'
                                            ? 'Simpan dan buka proyek'
                                            : 'Simpan perubahan'}
                                    </Button>
                                </div>
                                <p
                                    className="min-h-5 text-xs leading-5 font-medium text-primary"
                                    role="status"
                                    aria-live="polite"
                                >
                                    {openingForm.processing
                                        ? 'Membuka draft yang sudah tersimpan...'
                                        : form.processing
                                          ? 'Menyimpan proyek...'
                                          : null}
                                </p>
                            </footer>
                        </form>
                    </div>
                    <aside
                        aria-label="Konteks editor proyek"
                        className="min-w-0"
                    >
                        <EditorContextRail
                            institution={institution}
                            mode={mode}
                            project={project}
                            roleCapacity={roleCapacity}
                            totalCapacity={form.data.capacity}
                        />
                    </aside>
                </div>
            </div>
        </AppPage>
    );
}
