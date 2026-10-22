import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectVisibility } from '@/types/project';
import {
    errorMessage,
    selectClassName,
    visibilityOptions,
} from './editor-utils';
import type { FormErrorMap } from './editor-utils';

type Props = {
    capacity: number;
    deadline: string;
    visibility: ProjectVisibility;
    errors: FormErrorMap;
    onCapacityChange: (value: number) => void;
    onDeadlineChange: (value: string) => void;
    onVisibilityChange: (value: ProjectVisibility) => void;
};

export function ProjectEditorSettings({
    capacity,
    deadline,
    visibility,
    errors,
    onCapacityChange,
    onDeadlineChange,
    onVisibilityChange,
}: Props) {
    const capacityError = errorMessage(errors, 'capacity');
    const deadlineError = errorMessage(errors, 'deadline');
    const visibilityError = errorMessage(errors, 'visibility');

    return (
        <section className="grid min-w-0 gap-5 border-y border-border px-1 py-6">
            <div>
                <p className="text-xs font-semibold text-primary">
                    02. Pengaturan tim
                </p>
                <h2 className="mt-2 text-title font-semibold">
                    Tetapkan kapasitas, waktu, dan visibilitas.
                </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor="project-capacity">Kapasitas total</Label>
                    <Input
                        id="project-capacity"
                        aria-describedby={
                            capacityError ? 'project-capacity-error' : undefined
                        }
                        data-test="project-capacity"
                        type="number"
                        min={1}
                        max={20}
                        aria-invalid={capacityError !== undefined}
                        value={capacity}
                        onChange={(event) =>
                            onCapacityChange(Number(event.target.value))
                        }
                        required
                    />
                    <InputError
                        id="project-capacity-error"
                        message={capacityError}
                    />
                </div>

                <div className="grid min-w-0 gap-2">
                    <Label htmlFor="project-deadline">Batas waktu</Label>
                    <Input
                        id="project-deadline"
                        aria-describedby={
                            deadlineError ? 'project-deadline-error' : undefined
                        }
                        data-test="project-deadline"
                        type="datetime-local"
                        aria-invalid={deadlineError !== undefined}
                        value={deadline}
                        onChange={(event) =>
                            onDeadlineChange(event.target.value)
                        }
                        required
                    />
                    <InputError
                        id="project-deadline-error"
                        message={deadlineError}
                    />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="project-visibility">Visibilitas</Label>
                    <select
                        id="project-visibility"
                        aria-describedby={
                            visibilityError
                                ? 'project-visibility-error'
                                : undefined
                        }
                        data-test="project-visibility"
                        className={selectClassName}
                        aria-invalid={visibilityError !== undefined}
                        value={visibility}
                        onChange={(event) =>
                            onVisibilityChange(
                                event.target.value as ProjectVisibility,
                            )
                        }
                    >
                        {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs leading-5 text-muted-foreground">
                        Proyek pribadi hanya dapat dilihat oleh pemilik.
                    </p>
                    <InputError
                        id="project-visibility-error"
                        message={visibilityError}
                    />
                </div>
            </div>
        </section>
    );
}
