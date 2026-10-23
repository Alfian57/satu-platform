import type {
    ProjectDetail,
    ProjectFormData,
    ProjectFormRole,
    ProjectInstitution,
    ProjectVisibility,
} from '@/types/project';

export type EditorMode = 'create' | 'edit';

export type ProjectEditorProps = {
    mode: EditorMode;
    institution: ProjectInstitution;
    project?: ProjectDetail;
};

export type Taxonomy = {
    id: number;
    name: string;
    category: string;
    description: string | null;
};

export type TaxonomyResponse = {
    data: Taxonomy[];
};

export type FormErrorMap = Record<string, string | string[] | undefined>;

export const selectClassName =
    'h-11 min-w-0 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

export const textAreaClassName =
    'min-h-32 min-w-0 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

export const visibilityOptions: { value: ProjectVisibility; label: string }[] =
    [
        { value: 'institution', label: 'Kampus' },
        { value: 'public', label: 'Publik' },
        { value: 'private', label: 'Pribadi milikmu' },
    ];

export const proficiencyOptions = [
    { value: 'beginner', label: 'Pemula' },
    { value: 'intermediate', label: 'Menengah' },
    { value: 'advanced', label: 'Mahir' },
    { value: 'expert', label: 'Ahli' },
];

export function dateTimeLocalValue(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return localDate.toISOString().slice(0, 16);
}

export function defaultDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28);

    return dateTimeLocalValue(deadline.toISOString());
}

export function initialRoles(project?: ProjectDetail): ProjectFormRole[] {
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

export function initialFormData(
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

export function errorMessage(
    errors: FormErrorMap,
    field: string,
): string | undefined {
    const message = errors[field];

    if (Array.isArray(message)) {
        return message[0];
    }

    return message;
}
