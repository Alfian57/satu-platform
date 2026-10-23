import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProjectFormRole, ProjectSkill } from '@/types/project';
import { errorMessage } from './editor-utils';
import type { FormErrorMap } from './editor-utils';
import { ProjectEditorRoleItem } from './project-editor-role-item';

type Props = {
    roles: ProjectFormRole[];
    roleCapacity: number;
    projectCapacity: number;
    errors: FormErrorMap;
    isProcessing: boolean;
    onAddRole: () => void;
    onRemoveRole: (index: number) => void;
    onUpdateRole: (index: number, patch: Partial<ProjectFormRole>) => void;
    onUpdateRoleSkill: (index: number, skill: ProjectSkill) => void;
    onRemoveRoleSkill: (index: number, taxonomyId: number) => void;
};

export function ProjectEditorRoles({
    roles,
    roleCapacity,
    projectCapacity,
    errors,
    isProcessing,
    onAddRole,
    onRemoveRole,
    onUpdateRole,
    onUpdateRoleSkill,
    onRemoveRoleSkill,
}: Props) {
    return (
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
                        Siapa yang ingin kamu ajak berkolaborasi?
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Total kapasitas peran tidak boleh melebihi kapasitas
                        proyek.
                    </p>
                </div>
                <p
                    role="status"
                    aria-live="polite"
                    className={cn(
                        'text-sm font-semibold',
                        roleCapacity > projectCapacity
                            ? 'text-correction-subtle-foreground'
                            : 'text-muted-foreground',
                    )}
                >
                    {roleCapacity} / {projectCapacity} slot peran
                </p>
            </div>

            <div className="grid gap-5">
                {roles.map((role, index) => (
                    <ProjectEditorRoleItem
                        key={index}
                        role={role}
                        index={index}
                        errors={errors}
                        canRemove={roles.length > 1}
                        isProcessing={isProcessing}
                        onUpdateRole={onUpdateRole}
                        onRemoveRole={onRemoveRole}
                        onUpdateRoleSkill={onUpdateRoleSkill}
                        onRemoveRoleSkill={onRemoveRoleSkill}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <InputError message={errorMessage(errors, 'roles')} />
                <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer sm:ml-auto"
                    onClick={onAddRole}
                    disabled={roles.length >= 20}
                    data-test="add-project-role"
                >
                    Tambah peran
                </Button>
            </div>
        </section>
    );
}
