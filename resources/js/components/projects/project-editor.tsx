import { router, useHttp } from '@inertiajs/react';
import { Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import SkillTaxonomyController from '@/actions/App/Http/Controllers/SkillTaxonomyController';
import { AppPage } from '@/components/app-page';
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
    'h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

const textAreaClassName =
    'min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

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
            title: role.title,
            description: role.description ?? '',
            capacity: role.capacity,
            skills: role.skills.map((skill) => ({ ...skill })),
        }));
    }

    return [
        {
            title: '',
            description: '',
            capacity: 1,
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
}: {
    institution: ProjectInstitution;
    mode: EditorMode;
    project?: ProjectDetail;
    roleCapacity: number;
}) {
    return (
        <div className="grid gap-6">
            <section className="grid gap-3 border-b border-border pb-5">
                <p className="font-label text-label text-primary">
                    KONTEKS PROYEK
                </p>
                <h2 className="text-title font-semibold break-words">
                    {institution.name}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    {mode === 'create'
                        ? 'Project baru akan dibuat sebagai draft dan tetap berada dalam ruang kampus ini.'
                        : 'Perubahan ini hanya dapat dilakukan oleh pemilik project pada afiliasi kampus yang terverifikasi.'}
                </p>
            </section>

            <dl className="grid gap-4 text-sm">
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        STATUS AWAL
                    </dt>
                    <dd className="font-semibold">
                        {project?.status === undefined
                            ? 'Draft'
                            : project.status}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="font-label text-label text-muted-foreground">
                        KAPASITAS ROLE
                    </dt>
                    <dd className="font-semibold">
                        {roleCapacity} dari {project?.capacity ?? 'kapasitas'}{' '}
                        slot
                    </dd>
                </div>
            </dl>

            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                Setelah disimpan, project dapat dibuka ketika requirements dan
                deadline sudah siap. Status lifecycle akan tetap tercatat di
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
}: {
    roleIndex: number;
    skills: ProjectSkill[];
    onAdd: (skill: ProjectSkill) => void;
    onRemove: (taxonomyId: number) => void;
}) {
    const request = useHttp<Record<string, never>, TaxonomyResponse>({});
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Taxonomy[]>([]);
    const [open, setOpen] = useState(false);
    const [hasError, setHasError] = useState(false);
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
        (option) => !skills.some((skill) => skill.taxonomy_id === option.id),
    );

    return (
        <div className="grid gap-2">
            <Label
                htmlFor={`project-role-${roleIndex}-skill-search`}
                className="text-xs text-muted-foreground"
            >
                Skill minimum
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
                    className="pl-9"
                    placeholder="Cari skill terverifikasi"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                />
                {query !== '' && (
                    <button
                        type="button"
                        aria-label="Hapus pencarian skill"
                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        aria-label="Pilihan skill"
                        className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
                    >
                        {request.processing ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                                <Spinner aria-hidden="true" />
                                Mencari skill...
                            </div>
                        ) : hasError ? (
                            <p className="px-3 py-3 text-sm text-correction-subtle-foreground">
                                Skill belum dapat dimuat. Coba lagi.
                            </p>
                        ) : query.trim() === '' ? (
                            <p className="px-3 py-3 text-sm text-muted-foreground">
                                Ketik untuk mencari taxonomy skill.
                            </p>
                        ) : availableOptions.length === 0 ? (
                            <p
                                className="px-3 py-3 text-sm text-muted-foreground"
                                role="status"
                            >
                                Tidak ada skill yang cocok.
                            </p>
                        ) : (
                            availableOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="option"
                                    className="flex w-full cursor-pointer items-start gap-3 rounded-sm px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => {
                                        onAdd({
                                            taxonomy_id: option.id,
                                            name: option.name,
                                            proficiency: 'intermediate',
                                        });
                                        setQuery('');
                                        setOptions([]);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="min-w-0">
                                        <span className="block font-medium break-words">
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
                <ul className="grid gap-2" aria-label="Skill terpilih">
                    {skills.map((skill) => (
                        <li
                            key={skill.taxonomy_id}
                            className="grid gap-2 rounded-sm border border-border bg-muted/40 p-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-center"
                        >
                            <span className="min-w-0 text-sm font-medium break-words">
                                {skill.name ?? `Skill #${skill.taxonomy_id}`}
                            </span>
                            <select
                                aria-label={`Tingkat keahlian ${skill.name ?? skill.taxonomy_id}`}
                                className={cn(selectClassName, 'h-control-sm')}
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
                                aria-label={`Hapus skill ${skill.name ?? skill.taxonomy_id}`}
                                className="inline-flex size-control-sm cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground"
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
    const errorSummary = useRef<HTMLDivElement>(null);
    const errors = form.errors as FormErrorMap;
    const openingErrors = openingForm.errors as FormErrorMap;
    const roleCapacity = form.data.roles.reduce(
        (total, role) => total + Number(role.capacity || 0),
        0,
    );
    const isProcessing = form.processing || openingForm.processing;

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
            { title: '', description: '', capacity: 1, skills: [] },
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
                    setActionError(
                        response.status === 409
                            ? 'Project berubah di sesi lain. Muat ulang halaman, lalu simpan kembali.'
                            : 'Project belum dapat dibuka. Periksa status dan deadline project.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setActionError(
                        'Project sudah tersimpan sebagai draft. Koneksi terputus sebelum statusnya dibuka.',
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

        if (isProcessing) {
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
                setActionError(
                    response.status === 409
                        ? 'Project berubah di sesi lain. Muat ulang halaman, lalu simpan kembali.'
                        : 'Project belum dapat disimpan. Coba lagi setelah memeriksa koneksi.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.',
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

    return (
        <AppPage
            contextRail={
                <EditorContextRail
                    institution={institution}
                    mode={mode}
                    project={project}
                    roleCapacity={roleCapacity}
                />
            }
            contextRailLabel="Konteks editor project"
        >
            <div
                data-test="project-editor-root"
                className="mx-auto grid max-w-5xl min-w-0 gap-7"
            >
                <header className="grid gap-3 border-b border-border pb-6">
                    <p className="font-label text-label text-primary">
                        {mode === 'create' ? 'PROYEK BARU' : 'EDITOR PROYEK'} /{' '}
                        {institution.name}
                    </p>
                    <h1 className="max-w-[28ch] text-headline font-bold text-balance">
                        {mode === 'create'
                            ? 'Susun project yang siap dikerjakan bersama.'
                            : 'Perbarui detail project dengan konteks yang jelas.'}
                    </h1>
                    <p className="max-w-[70ch] text-body text-muted-foreground">
                        Isi kebutuhan peran, kapasitas, visibilitas, dan
                        deadline. Informasi ini menjadi dasar mahasiswa memahami
                        peluang kolaborasi sebelum mengambil tindakan.
                    </p>
                </header>

                {actionError && (
                    <div
                        role="alert"
                        data-test="project-editor-action-error"
                        className="border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                    >
                        {actionError}
                    </div>
                )}

                {form.hasErrors && (
                    <div
                        ref={errorSummary}
                        tabIndex={-1}
                        role="alert"
                        data-test="project-editor-errors"
                        className="border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <p className="font-semibold">
                            Ada bagian yang perlu diperiksa sebelum disimpan.
                        </p>
                        <p className="mt-1 leading-6">
                            Pesan kesalahan ditampilkan di dekat field terkait.
                        </p>
                    </div>
                )}

                {Object.keys(openingErrors).length > 0 && (
                    <div
                        role="alert"
                        className="border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                    >
                        Project tersimpan sebagai draft, tetapi belum dapat
                        dibuka. Periksa deadline dan status project.
                    </div>
                )}

                <form
                    data-test="project-editor-form"
                    aria-busy={isProcessing}
                    className="grid min-w-0 gap-8"
                    onSubmit={(event) => submit(event, submitIntent)}
                >
                    <section className="grid gap-5 border-y border-border py-6">
                        <div>
                            <p className="font-label text-label text-muted-foreground">
                                IDENTITAS PROYEK
                            </p>
                            <h2 className="mt-2 text-title font-semibold">
                                Apa yang akan dikerjakan bersama?
                            </h2>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="project-title">Judul project</Label>
                            <Input
                                id="project-title"
                                data-test="project-title"
                                aria-invalid={
                                    errorMessage(errors, 'title') !== undefined
                                }
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder="Contoh: Portal kontribusi mahasiswa"
                                maxLength={160}
                                required
                            />
                            <InputError
                                message={errorMessage(errors, 'title')}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="project-description">
                                Deskripsi
                            </Label>
                            <textarea
                                id="project-description"
                                data-test="project-description"
                                aria-invalid={
                                    errorMessage(errors, 'description') !==
                                    undefined
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
                                message={errorMessage(errors, 'description')}
                            />
                        </div>
                    </section>

                    <section className="grid gap-5 border-b border-border pb-6">
                        <div>
                            <p className="font-label text-label text-muted-foreground">
                                KONTRAK PROYEK
                            </p>
                            <h2 className="mt-2 text-title font-semibold">
                                Tetapkan batas kerja dan visibilitas.
                            </h2>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="project-capacity">
                                    Kapasitas total
                                </Label>
                                <Input
                                    id="project-capacity"
                                    data-test="project-capacity"
                                    type="number"
                                    min={1}
                                    max={20}
                                    aria-invalid={
                                        errorMessage(errors, 'capacity') !==
                                        undefined
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
                                    message={errorMessage(errors, 'capacity')}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="project-deadline">
                                    Batas waktu
                                </Label>
                                <Input
                                    id="project-deadline"
                                    data-test="project-deadline"
                                    type="datetime-local"
                                    aria-invalid={
                                        errorMessage(errors, 'deadline') !==
                                        undefined
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
                                    message={errorMessage(errors, 'deadline')}
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="project-visibility">
                                    Visibilitas
                                </Label>
                                <select
                                    id="project-visibility"
                                    data-test="project-visibility"
                                    className={selectClassName}
                                    aria-invalid={
                                        errorMessage(errors, 'visibility') !==
                                        undefined
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
                                    Project pribadi hanya dapat dilihat oleh
                                    pemilik.
                                </p>
                                <InputError
                                    message={errorMessage(errors, 'visibility')}
                                />
                            </div>
                        </div>
                    </section>

                    <section
                        aria-labelledby="project-roles-title"
                        className="grid gap-5 border-b border-border pb-6"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="font-label text-label text-muted-foreground">
                                    PERSYARATAN
                                </p>
                                <h2
                                    id="project-roles-title"
                                    className="mt-2 text-title font-semibold"
                                >
                                    Peran dan skill yang dibutuhkan.
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Total kapasitas role tidak boleh melebihi
                                    kapasitas project.
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
                                {roleCapacity} / {form.data.capacity} slot peran
                            </p>
                        </div>

                        <div className="grid gap-5">
                            {form.data.roles.map((role, index) => (
                                <fieldset
                                    key={index}
                                    data-test="project-role"
                                    className="grid min-w-0 gap-4 border border-border bg-card/30 p-4 md:p-5"
                                >
                                    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                        <legend className="font-label text-label text-primary">
                                            PERAN{' '}
                                            {String(index + 1).padStart(2, '0')}
                                        </legend>
                                        <button
                                            type="button"
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                            onClick={() => removeRole(index)}
                                            disabled={
                                                form.data.roles.length <= 1
                                            }
                                        >
                                            <Trash2
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Hapus role
                                        </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`project-role-${index}-title`}
                                            >
                                                Nama role
                                            </Label>
                                            <Input
                                                id={`project-role-${index}-title`}
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
                                                        title: event.target
                                                            .value,
                                                    })
                                                }
                                                placeholder="Contoh: Frontend engineer"
                                                maxLength={120}
                                                required
                                            />
                                            <InputError
                                                message={errorMessage(
                                                    errors,
                                                    `roles.${index}.title`,
                                                )}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`project-role-${index}-capacity`}
                                            >
                                                Slot role
                                            </Label>
                                            <Input
                                                id={`project-role-${index}-capacity`}
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
                                                        capacity: Number(
                                                            event.target.value,
                                                        ),
                                                    })
                                                }
                                                required
                                            />
                                            <InputError
                                                message={errorMessage(
                                                    errors,
                                                    `roles.${index}.capacity`,
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`project-role-${index}-description`}
                                        >
                                            Catatan role
                                        </Label>
                                        <textarea
                                            id={`project-role-${index}-description`}
                                            data-test={`project-role-${index}-description`}
                                            className={cn(
                                                textAreaClassName,
                                                'min-h-24',
                                            )}
                                            value={role.description}
                                            onChange={(event) =>
                                                updateRole(index, {
                                                    description:
                                                        event.target.value,
                                                })
                                            }
                                            placeholder="Jelaskan kontribusi atau output role ini."
                                            maxLength={5000}
                                        />
                                        <InputError
                                            message={errorMessage(
                                                errors,
                                                `roles.${index}.description`,
                                            )}
                                        />
                                    </div>

                                    <SkillPicker
                                        roleIndex={index}
                                        skills={role.skills}
                                        onAdd={(skill) =>
                                            updateRoleSkill(index, skill)
                                        }
                                        onRemove={(taxonomyId) =>
                                            removeRoleSkill(index, taxonomyId)
                                        }
                                    />
                                    <InputError
                                        message={errorMessage(
                                            errors,
                                            `roles.${index}.skills`,
                                        )}
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
                                Tambah role
                            </Button>
                        </div>
                    </section>

                    <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                            {mode === 'create'
                                ? 'Simpan sebagai draft untuk melanjutkan nanti, atau buka sekarang jika requirements sudah siap.'
                                : 'Perubahan disimpan ke project ini dan tetap mengikuti status lifecycle yang sedang berjalan.'}
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            {mode === 'create' && (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="cursor-pointer"
                                    disabled={isProcessing}
                                    data-test="save-project-draft"
                                    onClick={() => setSubmitIntent('draft')}
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
                                className="cursor-pointer"
                                disabled={isProcessing}
                                data-test={
                                    mode === 'create'
                                        ? 'save-open-project'
                                        : 'save-project-changes'
                                }
                                onClick={() =>
                                    setSubmitIntent(
                                        mode === 'create' ? 'open' : 'draft',
                                    )
                                }
                            >
                                {isProcessing && <Spinner aria-hidden="true" />}
                                {mode === 'create'
                                    ? 'Simpan dan buka proyek'
                                    : 'Simpan perubahan'}
                            </Button>
                        </div>
                    </footer>
                </form>
            </div>
        </AppPage>
    );
}
