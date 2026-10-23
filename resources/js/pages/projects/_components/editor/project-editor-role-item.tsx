import { Trash2 } from 'lucide-react';
import InputError from '@/components/common/input-error';
import type { ProjectFormRole, ProjectSkill } from '@/types/project';
import { errorMessage } from './editor-utils';
import type { FormErrorMap } from './editor-utils';
import { RoleBasicFields } from './role-basic-fields';
import { RoleBeginnerGuidance } from './role-beginner-guidance';
import { RoleCriteriaFields } from './role-criteria-fields';
import { SkillPicker } from './skill-picker';

type Props = {
    role: ProjectFormRole;
    index: number;
    errors: FormErrorMap;
    canRemove: boolean;
    isProcessing: boolean;
    onUpdateRole: (index: number, patch: Partial<ProjectFormRole>) => void;
    onRemoveRole: (index: number) => void;
    onUpdateRoleSkill: (index: number, skill: ProjectSkill) => void;
    onRemoveRoleSkill: (index: number, taxonomyId: number) => void;
};

export function ProjectEditorRoleItem({
    role,
    index,
    errors,
    canRemove,
    isProcessing,
    onUpdateRole,
    onRemoveRole,
    onUpdateRoleSkill,
    onRemoveRoleSkill,
}: Props) {
    const titleError = errorMessage(errors, `roles.${index}.title`);
    const capacityError = errorMessage(errors, `roles.${index}.capacity`);
    const descriptionError = errorMessage(errors, `roles.${index}.description`);
    const beginnerError = errorMessage(
        errors,
        `roles.${index}.accepts_beginners`,
    );
    const criteriaError = errorMessage(
        errors,
        `roles.${index}.selection_criteria`,
    );

    const skillsError = Object.keys(errors)
        .filter(
            (key) =>
                key === `roles.${index}.skills` ||
                key.startsWith(`roles.${index}.skills.`),
        )
        .map((key) => errorMessage(errors, key))
        .find(Boolean);

    return (
        <fieldset
            data-test="project-role"
            className="grid min-w-0 gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm focus-within:border-primary/30 motion-safe:transition-colors motion-safe:duration-standard sm:p-6"
        >
            <legend className="rounded-xl border border-border bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
                PERAN {String(index + 1).padStart(2, '0')}
            </legend>
            <div className="flex justify-end border-b border-border pb-3">
                <button
                    type="button"
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onRemoveRole(index)}
                    disabled={!canRemove}
                >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Hapus peran
                </button>
            </div>

            <RoleBasicFields
                index={index}
                title={role.title}
                capacity={role.capacity}
                description={role.description}
                titleError={titleError}
                capacityError={capacityError}
                descriptionError={descriptionError}
                onUpdateRole={onUpdateRole}
            />

            <RoleCriteriaFields
                index={index}
                acceptsBeginners={role.accepts_beginners}
                selectionCriteria={role.selection_criteria}
                beginnerError={beginnerError}
                criteriaError={criteriaError}
                isProcessing={isProcessing}
                onUpdateRole={onUpdateRole}
            />

            {role.accepts_beginners === true && (
                <RoleBeginnerGuidance
                    index={index}
                    description={role.description}
                    selectionCriteria={role.selection_criteria}
                    isProcessing={isProcessing}
                    onApplyExample={(description, selection_criteria) =>
                        onUpdateRole(index, {
                            description,
                            selection_criteria,
                        })
                    }
                />
            )}

            <SkillPicker
                roleIndex={index}
                validationError={skillsError}
                skills={role.skills}
                onAdd={(skill) => onUpdateRoleSkill(index, skill)}
                onRemove={(taxonomyId) => onRemoveRoleSkill(index, taxonomyId)}
            />
            <InputError
                id={`project-role-${index}-skills-error`}
                message={skillsError}
            />
        </fieldset>
    );
}
