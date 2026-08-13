import { Link } from '@inertiajs/react';
import { FileCheck2, FileUp, FolderOpen, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { workspace as projectWorkspace } from '@/routes/projects';
import type {
    ContributionComposerValues,
    ContributionProjectOption,
} from '@/types/contribution';

type ErrorMap = Record<string, unknown>;

type ContributionComposerProps = {
    mode: 'create' | 'revision';
    projects: ContributionProjectOption[];
    initialValues?: Partial<ContributionComposerValues>;
    processing: boolean;
    errors: ErrorMap;
    onSubmit: (values: ContributionComposerValues) => void;
    onCancel?: () => void;
};

const textAreaClassName =
    'min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

const selectClassName =
    'h-control-md w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

function firstError(errors: ErrorMap, field: string): string | undefined {
    const value = errors[field];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function defaultDeclaration(): string {
    return 'Saya menyatakan bahwa kontribusi ini merepresentasikan pekerjaan saya.';
}

export function ContributionComposer({
    mode,
    projects,
    initialValues,
    processing,
    errors,
    onSubmit,
    onCancel,
}: ContributionComposerProps) {
    const initialProject =
        projects.find((project) => project.id === initialValues?.project_id) ??
        projects[0] ??
        null;
    const initialProjectId = initialProject?.id ?? 0;
    const [projectId, setProjectId] = useState<number>(initialProjectId);
    const [taskId, setTaskId] = useState<number | ''>(
        initialValues?.task_id ?? initialProject?.tasks[0]?.id ?? '',
    );
    const [claim, setClaim] = useState(initialValues?.claim ?? '');
    const [summary, setSummary] = useState(initialValues?.summary ?? '');
    const [declaration, setDeclaration] = useState(
        initialValues?.declaration ?? defaultDeclaration(),
    );
    const [evidence, setEvidence] = useState<number[]>(
        initialValues?.evidence ?? [],
    );

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === projectId) ?? null,
        [projectId, projects],
    );

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
    const evidenceError = firstError(errors, 'evidence');

    return (
        <form
            onSubmit={submit}
            className="grid gap-6"
            data-test={`contribution-${mode}-form`}
        >
            {mode === 'revision' && (
                <div className="flex items-start gap-3 border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground">
                    <Info
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <p>
                        Revisi membuat versi baru. Riwayat versi dan keputusan
                        validasi sebelumnya tetap tersimpan.
                    </p>
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor={`contribution-${mode}-project`}>
                    Project sumber
                </Label>
                <select
                    id={`contribution-${mode}-project`}
                    className={selectClassName}
                    value={projectId}
                    disabled={mode === 'revision' || processing}
                    onChange={(event) => {
                        const nextProjectId = Number(event.target.value);
                        const nextProject = projects.find(
                            (project) => project.id === nextProjectId,
                        );

                        setProjectId(nextProjectId);
                        setTaskId(nextProject?.tasks[0]?.id ?? '');
                        setEvidence([]);
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
                        Project tidak dapat dipindahkan setelah contribution
                        dibuat.
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`contribution-${mode}-task`}>
                    Task yang ditautkan
                </Label>
                <select
                    id={`contribution-${mode}-task`}
                    className={selectClassName}
                    value={taskId}
                    disabled={processing || selectedProject === null}
                    onChange={(event) => setTaskId(Number(event.target.value))}
                    aria-invalid={Boolean(taskError)}
                    data-test="contribution-task"
                >
                    <option value="">Pilih task</option>
                    {selectedProject?.tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                            {task.title}
                        </option>
                    ))}
                </select>
                {taskError && (
                    <p className="text-sm text-correction-subtle-foreground">
                        {taskError}
                    </p>
                )}
                {selectedProject !== null &&
                    selectedProject.tasks.length === 0 && (
                        <p className="border border-pending/30 bg-pending-subtle px-3 py-2 text-sm leading-6 text-pending-subtle-foreground">
                            Project ini belum memiliki task. Buat task di
                            workspace sebelum menyimpan contribution.
                        </p>
                    )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`contribution-${mode}-claim`}>
                    Klaim kontribusi
                </Label>
                <Input
                    id={`contribution-${mode}-claim`}
                    value={claim}
                    maxLength={160}
                    placeholder="Contoh: Menyusun alur validasi kontribusi"
                    onChange={(event) => setClaim(event.target.value)}
                    disabled={processing}
                    aria-invalid={Boolean(claimError)}
                    data-test="contribution-claim"
                />
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                        Ringkas, spesifik, dan dapat ditelusuri ke task.
                    </span>
                    <span>{claim.length}/160</span>
                </div>
                {claimError && (
                    <p className="text-sm text-correction-subtle-foreground">
                        {claimError}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`contribution-${mode}-summary`}>
                    Ringkasan pekerjaan
                </Label>
                <textarea
                    id={`contribution-${mode}-summary`}
                    className={textAreaClassName}
                    value={summary}
                    maxLength={5000}
                    placeholder="Jelaskan pekerjaan, keputusan, dan hasil yang dapat diperiksa."
                    onChange={(event) => setSummary(event.target.value)}
                    disabled={processing}
                    aria-invalid={Boolean(summaryError)}
                    data-test="contribution-summary"
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                    <span>{summary.length}/5000</span>
                </div>
                {summaryError && (
                    <p className="text-sm text-correction-subtle-foreground">
                        {summaryError}
                    </p>
                )}
            </div>

            <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold">
                    Evidence private
                </legend>
                <p className="text-sm leading-6 text-muted-foreground">
                    Pilih file evidence yang sudah diunggah ke workspace. File
                    tetap berada dalam batas akses project.
                </p>
                {selectedProject === null ||
                selectedProject.evidence.length === 0 ? (
                    <div
                        className="grid gap-3 border-y border-border px-1 py-5 sm:px-3"
                        data-test="contribution-evidence-empty"
                    >
                        <div className="flex items-start gap-3">
                            <FileUp
                                aria-hidden="true"
                                className="mt-1 size-5 shrink-0 text-primary"
                            />
                            <div className="grid gap-1">
                                <p className="font-semibold">
                                    Belum ada file evidence
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Simpan draft tanpa file, atau unggah
                                    evidence dari workspace project terlebih
                                    dahulu.
                                </p>
                            </div>
                        </div>
                        {selectedProject !== null && (
                            <Link
                                href={projectWorkspace(selectedProject.id).url}
                                className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                                data-test="contribution-open-workspace"
                            >
                                <FolderOpen
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Buka workspace project
                            </Link>
                        )}
                    </div>
                ) : (
                    <div
                        className="grid max-h-72 gap-2 overflow-y-auto border-y border-border py-3"
                        data-test="contribution-evidence-list"
                    >
                        {selectedProject.evidence.map((item) => {
                            const checked = evidence.includes(item.id);

                            return (
                                <label
                                    key={item.id}
                                    className={cn(
                                        'flex min-w-0 cursor-pointer items-start gap-3 px-3 py-3 transition-colors duration-fast hover:bg-muted/60',
                                        checked && 'bg-primary/5',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1 size-4 cursor-pointer accent-primary"
                                        checked={checked}
                                        disabled={processing}
                                        onChange={() => toggleEvidence(item.id)}
                                        data-test={`contribution-evidence-${item.id}`}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold break-words">
                                            {item.original_name}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            {item.mime_type} ·{' '}
                                            {formatFileSize(item.size_bytes)}
                                        </span>
                                    </span>
                                    {checked && (
                                        <FileCheck2
                                            aria-label="Evidence dipilih"
                                            className="mt-0.5 size-4 shrink-0 text-verified"
                                        />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                )}
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>Evidence dipilih: {evidence.length}/20</span>
                    <span>Evidence wajib saat dikirim untuk validasi.</span>
                </div>
                {evidenceError && (
                    <p className="text-sm text-correction-subtle-foreground">
                        {evidenceError}
                    </p>
                )}
            </fieldset>

            <div className="grid gap-2">
                <Label htmlFor={`contribution-${mode}-declaration`}>
                    Pernyataan pemilik
                </Label>
                <textarea
                    id={`contribution-${mode}-declaration`}
                    className={textAreaClassName}
                    value={declaration}
                    maxLength={2000}
                    onChange={(event) => setDeclaration(event.target.value)}
                    disabled={processing}
                    aria-invalid={Boolean(declarationError)}
                    data-test="contribution-declaration"
                />
                {declarationError && (
                    <p className="text-sm text-correction-subtle-foreground">
                        {declarationError}
                    </p>
                )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                    {mode === 'create'
                        ? 'Draft dapat dilengkapi sebelum dikirim untuk validasi.'
                        : 'Pastikan catatan reviewer sudah ditanggapi sebelum membuat versi baru.'}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                    {onCancel && (
                        <button
                            type="button"
                            className="h-control-md cursor-pointer rounded-md border border-input px-4 text-sm font-semibold transition-colors duration-fast hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={onCancel}
                            disabled={processing}
                        >
                            Batal
                        </button>
                    )}
                    <button
                        type="submit"
                        className="inline-flex h-control-md cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-fast hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                            processing ||
                            selectedProject === null ||
                            taskId === ''
                        }
                        data-test={`contribution-${mode}-submit`}
                    >
                        {processing && (
                            <Spinner aria-label="Menyimpan contribution" />
                        )}
                        {mode === 'create'
                            ? 'Simpan draft'
                            : 'Simpan versi revisi'}
                    </button>
                </div>
            </div>
        </form>
    );
}
