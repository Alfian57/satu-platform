import { selectClassName } from '@/components/contributions/contribution-helpers';
import { Label } from '@/components/ui/label';
import type { ContributionProjectOption } from '@/types/contribution';

export interface ComposerSourceSectionProps {
    mode: 'create' | 'revision';
    projects: ContributionProjectOption[];
    selectedProject: ContributionProjectOption | null;
    projectId: number;
    taskId: number | '';
    processing: boolean;
    blocked: boolean;
    taskError?: string;
    onProjectChange: (projectId: number) => void;
    onTaskChange: (taskId: number | '') => void;
}

export function ComposerSourceSection({
    mode,
    projects,
    selectedProject,
    projectId,
    taskId,
    processing,
    blocked,
    taskError,
    onProjectChange,
    onTaskChange,
}: ComposerSourceSectionProps) {
    return (
        <section
            aria-labelledby={`contribution-${mode}-source-title`}
            className="grid min-w-0 gap-5 border-t border-border/70 px-1 py-5"
        >
            <div>
                <p className="text-xs font-semibold text-primary">
                    01. Sumber pekerjaan
                </p>
                <h2
                    id={`contribution-${mode}-source-title`}
                    className="mt-2 text-xl leading-snug font-bold tracking-tight"
                >
                    Pekerjaan mana yang ingin kamu catat?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Pilih proyek dan tugas yang menjadi dasar kontribusimu.
                </p>
            </div>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor={`contribution-${mode}-project`}>
                        Proyek sumber
                    </Label>
                    <select
                        id={`contribution-${mode}-project`}
                        className={selectClassName}
                        value={projectId}
                        disabled={mode === 'revision' || processing || blocked}
                        onChange={(event) => {
                            const nextProjectId = Number(event.target.value);
                            onProjectChange(nextProjectId);
                        }}
                        data-test="contribution-project"
                    >
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.title}
                            </option>
                        ))}
                    </select>
                    {mode === 'revision' && (
                        <p className="text-sm text-muted-foreground">
                            Proyek tidak dapat dipindahkan setelah kontribusi
                            dibuat.
                        </p>
                    )}
                </div>

                <div className="grid min-w-0 gap-2">
                    <Label htmlFor={`contribution-${mode}-task`}>
                        Tugas yang ditautkan
                    </Label>
                    <select
                        id={`contribution-${mode}-task`}
                        className={selectClassName}
                        value={taskId}
                        disabled={
                            processing || blocked || selectedProject === null
                        }
                        onChange={(event) => {
                            const val = event.target.value;
                            onTaskChange(val === '' ? '' : Number(val));
                        }}
                        aria-invalid={Boolean(taskError)}
                        aria-describedby={
                            taskError
                                ? `contribution-${mode}-task-error`
                                : undefined
                        }
                        data-test="contribution-task"
                    >
                        <option value="">Pilih tugas</option>
                        {selectedProject?.tasks.map((task) => (
                            <option key={task.id} value={task.id}>
                                {task.title}
                            </option>
                        ))}
                    </select>
                    {taskError && (
                        <p
                            id={`contribution-${mode}-task-error`}
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {taskError}
                        </p>
                    )}
                    {selectedProject !== null &&
                        selectedProject.tasks.length === 0 && (
                            <p className="border border-pending/30 bg-pending-subtle px-3 py-2 text-sm leading-6 text-pending-subtle-foreground">
                                Proyek ini belum memiliki tugas. Buat tugas di
                                ruang kerja sebelum menyimpan kontribusi.
                            </p>
                        )}
                </div>
            </div>
        </section>
    );
}
