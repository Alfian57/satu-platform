import InputError from '@/components/common/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ProjectFormRole } from '@/types/project';
import { textAreaClassName } from './editor-utils';

type Props = {
    index: number;
    title: string;
    capacity: number;
    description: string;
    titleError?: string;
    capacityError?: string;
    descriptionError?: string;
    onUpdateRole: (index: number, patch: Partial<ProjectFormRole>) => void;
};

export function RoleBasicFields({
    index,
    title,
    capacity,
    description,
    titleError,
    capacityError,
    descriptionError,
    onUpdateRole,
}: Props) {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor={`project-role-${index}-title`} required>
                        Nama peran
                    </Label>
                    <Input
                        id={`project-role-${index}-title`}
                        aria-describedby={
                            titleError
                                ? `project-role-${index}-title-error`
                                : undefined
                        }
                        data-test={`project-role-${index}-title`}
                        aria-invalid={titleError !== undefined}
                        value={title}
                        onChange={(event) =>
                            onUpdateRole(index, {
                                title: event.target.value,
                            })
                        }
                        placeholder="Contoh: Frontend engineer"
                        maxLength={120}
                        required
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <InputError
                            id={`project-role-${index}-title-error`}
                            message={titleError}
                        />
                    </div>
                </div>

                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor={`project-role-${index}-capacity`} required>
                        Kapasitas peran
                    </Label>
                    <Input
                        id={`project-role-${index}-capacity`}
                        aria-describedby={
                            capacityError
                                ? `project-role-${index}-capacity-error`
                                : undefined
                        }
                        data-test={`project-role-${index}-capacity`}
                        type="number"
                        min={1}
                        max={20}
                        placeholder="Contoh: 1"
                        aria-invalid={capacityError !== undefined}
                        value={capacity}
                        onChange={(event) =>
                            onUpdateRole(index, {
                                capacity: Number(event.target.value),
                            })
                        }
                        required
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <InputError
                            id={`project-role-${index}-capacity-error`}
                            message={capacityError}
                        />
                    </div>
                </div>
            </div>

            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`project-role-${index}-description`} optional>
                    Catatan peran
                </Label>
                <textarea
                    id={`project-role-${index}-description`}
                    aria-describedby={
                        descriptionError
                            ? `project-role-${index}-description-error`
                            : undefined
                    }
                    data-test={`project-role-${index}-description`}
                    className={cn(textAreaClassName, 'min-h-24')}
                    aria-invalid={Boolean(descriptionError)}
                    value={description}
                    onChange={(event) =>
                        onUpdateRole(index, {
                            description: event.target.value,
                        })
                    }
                    placeholder="Jelaskan tugas dan hasil yang diharapkan dari peran ini."
                    maxLength={5000}
                />
                <div className="grid min-w-0 gap-0.5">
                    <InputError
                        id={`project-role-${index}-description-error`}
                        message={descriptionError}
                    />
                </div>
            </div>
        </>
    );
}
