import { Link, router } from '@inertiajs/react';
import { FileCheck2, FileUp, FolderOpen, Info } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
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
    blocked?: boolean;
    canLeave?: () => boolean;
    errors: ErrorMap;
    onSubmit: (values: ContributionComposerValues) => void;
    onCancel?: () => void;
    onDirtyChange?: (dirty: boolean) => void;
};

const textAreaClassName =
    'min-h-28 min-w-0 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

const selectClassName =
    'h-11 min-w-0 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-ring focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50';

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
    blocked = false,
    canLeave,
    errors,
    onSubmit,
    onCancel,
    onDirtyChange,
}: ContributionComposerProps) {
    const initialProject =
        projects.find((project) => project.id === initialValues?.project_id) ??
        projects[0] ??
        null;
    const initialProjectId = initialProject?.id ?? 0;
    const [projectId, setProjectId] = useState<number>(initialProjectId);
    const [taskId, setTaskId] = useState<number | ''>(
        initialValues?.task_id ?? '',
    );
    const [claim, setClaim] = useState(initialValues?.claim ?? '');
    const [summary, setSummary] = useState(initialValues?.summary ?? '');
    const [declaration, setDeclaration] = useState(
        initialValues?.declaration ?? defaultDeclaration(),
    );
    const [evidence, setEvidence] = useState<number[]>(
        initialValues?.evidence ?? [],
    );

    const [initialDraft] = useState(
        JSON.stringify({
            project_id: initialProjectId,
            task_id: initialValues?.task_id ?? '',
            claim: initialValues?.claim ?? '',
            summary: initialValues?.summary ?? '',
            declaration: initialValues?.declaration ?? defaultDeclaration(),
            evidence: initialValues?.evidence ?? [],
        }),
    );
    const dirty =
        JSON.stringify({
            project_id: projectId,
            task_id: taskId,
            claim,
            summary,
            declaration,
            evidence,
        }) !== initialDraft;
    useEffect(() => {
        onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);
    useEffect(() => {
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (dirty && !canLeave?.()) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', beforeUnload);
        const remove = router.on('before', (event) => {
            if (canLeave?.()) {
                return;
            }

            if (
                event.detail.visit.async ||
                event.detail.visit.url.pathname === window.location.pathname
            ) {
                return;
            }

            if (processing) {
                return false;
            }

            if (
                dirty &&
                !window.confirm(
                    'Ada perubahan belum disimpan. Tinggalkan halaman dan buang perubahan?',
                )
            ) {
                return false;
            }
        });

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            remove();
        };
    }, [dirty, processing, canLeave]);

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
    const evidenceError = Object.keys(errors)
        .filter((key) => key === 'evidence' || key.startsWith('evidence.'))
        .map((key) => firstError(errors, key))
        .find(Boolean);
    const errorSummary = useRef<HTMLDivElement>(null);
    const hasErrors = Object.keys(errors).length > 0;

    useEffect(() => {
        if (hasErrors && !processing) {
            errorSummary.current?.focus();
        }
    }, [errors, hasErrors, processing]);

    return (
        <form
            onSubmit={submit}
            className="grid min-w-0 gap-6"
            aria-busy={processing}
            data-test={`contribution-${mode}-form`}
        >
            {hasErrors && (
                <div
                    ref={errorSummary}
                    tabIndex={-1}
                    role="alert"
                    data-test="contribution-composer-errors"
                    className="grid min-w-0 gap-2 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <p className="font-semibold">
                        Ada bagian yang perlu diperiksa sebelum disimpan.
                    </p>
                    <ul className="list-inside list-disc space-y-1 wrap-anywhere">
                        {Object.keys(errors).map((key) => (
                            <li key={key}>{firstError(errors, key)}</li>
                        ))}
                    </ul>
                    <p>
                        Isianmu tetap ada. Periksa pesan di dekat kolom terkait.
                    </p>
                </div>
            )}
            {mode === 'revision' && (
                <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground">
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
                            disabled={
                                mode === 'revision' || processing || blocked
                            }
                            onChange={(event) => {
                                const nextProjectId = Number(
                                    event.target.value,
                                );
                                setProjectId(nextProjectId);
                                setTaskId('');
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
                                Proyek tidak dapat dipindahkan setelah
                                kontribusi dibuat.
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
                                processing ||
                                blocked ||
                                selectedProject === null
                            }
                            onChange={(event) =>
                                setTaskId(Number(event.target.value))
                            }
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
                                    Proyek ini belum memiliki tugas. Buat tugas
                                    di ruang kerja sebelum menyimpan kontribusi.
                                </p>
                            )}
                    </div>
                </div>
            </section>
            <section
                aria-labelledby={`contribution-${mode}-notes-title`}
                className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7"
            >
                <div>
                    <p className="text-xs font-semibold text-primary">
                        02. Catatan kontribusi
                    </p>
                    <h2
                        id={`contribution-${mode}-notes-title`}
                        className="mt-2 text-xl leading-snug font-bold tracking-tight sm:text-2xl"
                    >
                        Ceritakan peran dan hasil pekerjaanmu.
                    </h2>
                </div>
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor={`contribution-${mode}-claim`}>
                        Judul kontribusi
                    </Label>
                    <Input
                        id={`contribution-${mode}-claim`}
                        className="h-11"
                        value={claim}
                        maxLength={160}
                        placeholder="Contoh: Menyusun alur validasi kontribusi"
                        onChange={(event) => setClaim(event.target.value)}
                        disabled={processing || blocked}
                        aria-invalid={Boolean(claimError)}
                        aria-describedby={
                            claimError
                                ? `contribution-${mode}-claim-error`
                                : undefined
                        }
                        data-test="contribution-claim"
                    />
                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                            Ringkas, spesifik, dan terkait dengan tugas yang
                            kamu kerjakan.
                        </span>
                        <span>{claim.length}/160</span>
                    </div>
                    {claimError && (
                        <p
                            id={`contribution-${mode}-claim-error`}
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {claimError}
                        </p>
                    )}
                </div>

                <div className="grid min-w-0 gap-2">
                    <Label htmlFor={`contribution-${mode}-summary`}>
                        Ringkasan karya yang dapat dibagikan
                    </Label>
                    <textarea
                        id={`contribution-${mode}-summary`}
                        className={textAreaClassName}
                        value={summary}
                        maxLength={5000}
                        placeholder="Jelaskan bagian yang kamu kerjakan, peranmu, hasil, dan kaitannya dengan bukti. Hindari informasi rahasia."
                        onChange={(event) => setSummary(event.target.value)}
                        disabled={processing || blocked}
                        aria-invalid={Boolean(summaryError)}
                        aria-describedby={
                            summaryError
                                ? `contribution-${mode}-summary-error`
                                : undefined
                        }
                        data-test="contribution-summary"
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                        Ringkasan menjadi isi portofolio setelah disetujui.
                        Karya tetap privat sampai kamu memilih jangkauan. Jangan
                        sertakan kontak atau informasi rahasia.
                    </p>
                    <div className="flex justify-end text-xs text-muted-foreground">
                        <span>{summary.length}/5000</span>
                    </div>
                    {summaryError && (
                        <p
                            id={`contribution-${mode}-summary-error`}
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {summaryError}
                        </p>
                    )}
                </div>
            </section>
            <fieldset
                aria-describedby={
                    evidenceError
                        ? `contribution-${mode}-evidence-hint contribution-${mode}-evidence-error`
                        : `contribution-${mode}-evidence-hint`
                }
                aria-invalid={Boolean(evidenceError)}
                className="grid min-w-0 gap-5 border-y border-border/70 px-1 py-6"
            >
                <legend className="px-2 text-xs font-semibold text-primary">
                    03. Bukti dan pernyataan
                </legend>
                <h2 className="text-xl leading-snug font-bold tracking-tight">
                    Lengkapi dengan bukti pekerjaanmu.
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    Pilih berkas dari ruang kerja proyek. Jelaskan hubungan
                    bukti dengan bagian pekerjaanmu. Berkas bersama bukan bukti
                    bahwa semua pekerjaan tim milikmu. Bukti tidak
                    dipublikasikan ke portofolio.
                </p>
                <details
                    className="rounded-2xl border border-border bg-accent/30 p-4"
                    data-test="contribution-evidence-guidance"
                >
                    <summary className="min-h-11 cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring">
                        Apa yang perlu dijelaskan dalam bukti?
                    </summary>
                    <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
                        <li>
                            Bagian yang kamu kerjakan dan hasil yang dapat
                            diperiksa, misalnya dokumen, desain, atau catatan
                            pengujian.
                        </li>
                        <li>
                            Kaitkan berkas dengan klaim individual. Nyatakan
                            batas peranmu bila memakai hasil bersama.
                        </li>
                        <li>
                            Pastikan kamu berhak mengirim berkas dan tidak
                            memasukkan data pribadi atau rahasia yang tidak
                            diperlukan.
                        </li>
                    </ul>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Ini panduan teknis, bukan standar bukti final kampus.
                        Kampus dapat meminta perbaikan. Validasi menilai
                        kontribusi versi tertentu, bukan seluruh keahlian atau
                        jaminan kualitas mutlak. Tidak ada janji waktu
                        pemeriksaan.
                    </p>
                </details>
                {selectedProject === null ||
                selectedProject.evidence.length === 0 ? (
                    <div
                        className="grid min-w-0 gap-3 rounded-2xl border border-dashed border-border bg-background/65 p-4 sm:p-5"
                        data-test="contribution-evidence-empty"
                    >
                        <div className="flex items-start gap-3">
                            <FileUp
                                aria-hidden="true"
                                className="mt-1 size-5 shrink-0 text-primary"
                            />
                            <div className="grid gap-1">
                                <p className="font-semibold">
                                    Belum ada bukti pekerjaan
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Kamu boleh menyimpan draft tanpa bukti.
                                    Unggah berkas di ruang kerja proyek sebelum
                                    mengirim untuk validasi.
                                </p>
                            </div>
                        </div>
                        {selectedProject !== null && (
                            <Link
                                href={projectWorkspace(selectedProject.id).url}
                                className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                data-test="contribution-open-workspace"
                            >
                                <FolderOpen
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Buka ruang kerja proyek
                            </Link>
                        )}
                    </div>
                ) : (
                    <div
                        className="grid max-h-80 min-w-0 auto-rows-max content-start gap-3 overflow-y-auto rounded-2xl p-1"
                        data-test="contribution-evidence-list"
                    >
                        {selectedProject.evidence.map((item) => {
                            const checked = evidence.includes(item.id);

                            return (
                                <label
                                    key={item.id}
                                    className={cn(
                                        'flex min-h-16 min-w-0 items-start gap-3 rounded-2xl border p-4 motion-safe:transition-colors motion-safe:duration-standard',
                                        processing ||
                                            blocked ||
                                            (!checked && evidence.length >= 20)
                                            ? 'cursor-not-allowed opacity-60'
                                            : 'cursor-pointer hover:border-primary/30 hover:bg-accent/40',
                                        checked
                                            ? 'border-primary/40 bg-accent'
                                            : 'border-border bg-card shadow-sm',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1 size-4 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                                        checked={checked}
                                        disabled={
                                            processing ||
                                            blocked ||
                                            (!checked && evidence.length >= 20)
                                        }
                                        onChange={() => toggleEvidence(item.id)}
                                        data-test={`contribution-evidence-${item.id}`}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold wrap-anywhere">
                                            {item.original_name}
                                        </span>
                                        <span className="mt-1 block text-xs wrap-anywhere text-muted-foreground">
                                            {item.mime_type} ·{' '}
                                            {formatFileSize(item.size_bytes)}
                                        </span>
                                    </span>
                                    {checked && (
                                        <FileCheck2
                                            aria-label="Bukti dipilih"
                                            className="mt-0.5 size-4 shrink-0 text-verified"
                                        />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                )}
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span role="status" aria-live="polite">
                        Bukti dipilih: {evidence.length}/20
                    </span>
                    <span id={`contribution-${mode}-evidence-hint`}>
                        {evidence.length >= 20
                            ? 'Batas 20 berkas tercapai. Lepas pilihan untuk menggantinya.'
                            : 'Bukti wajib saat dikirim untuk validasi.'}
                    </span>
                </div>
                {evidenceError && (
                    <p
                        id={`contribution-${mode}-evidence-error`}
                        className="text-sm text-correction-subtle-foreground"
                    >
                        {evidenceError}
                    </p>
                )}

                <div className="grid min-w-0 gap-2 border-t border-border/70 pt-5">
                    <Label htmlFor={`contribution-${mode}-declaration`}>
                        Pernyataan pemilik (privat)
                    </Label>
                    <textarea
                        id={`contribution-${mode}-declaration`}
                        className={textAreaClassName}
                        value={declaration}
                        maxLength={2000}
                        onChange={(event) => setDeclaration(event.target.value)}
                        disabled={processing || blocked}
                        aria-invalid={Boolean(declarationError)}
                        aria-describedby={
                            declarationError
                                ? `contribution-${mode}-declaration-error`
                                : undefined
                        }
                        data-test="contribution-declaration"
                    />
                    {declarationError && (
                        <p
                            id={`contribution-${mode}-declaration-error`}
                            className="text-sm text-correction-subtle-foreground"
                        >
                            {declarationError}
                        </p>
                    )}
                </div>
            </fieldset>
            <footer className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/40 p-5 shadow-md sm:p-6">
                <p className="text-sm leading-6 text-muted-foreground">
                    {mode === 'create'
                        ? 'Draft dapat dilengkapi sebelum dikirim untuk validasi.'
                        : 'Pastikan catatan reviewer sudah ditanggapi sebelum membuat versi baru.'}
                </p>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-auto min-h-11 py-3 whitespace-normal"
                            onClick={onCancel}
                            disabled={processing || blocked}
                        >
                            Batal
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="h-auto min-h-11 py-3 whitespace-normal shadow-sm motion-safe:duration-standard"
                        disabled={
                            processing ||
                            blocked ||
                            selectedProject === null ||
                            taskId === ''
                        }
                        data-test={`contribution-${mode}-submit`}
                    >
                        {processing && <Spinner aria-hidden="true" />}
                        {mode === 'create'
                            ? 'Simpan draft'
                            : 'Simpan versi revisi'}
                    </Button>
                </div>
                <p
                    className="min-h-5 text-xs leading-5 font-medium text-primary"
                    role="status"
                    aria-live="polite"
                    data-test="contribution-save-status"
                >
                    {processing
                        ? mode === 'create'
                            ? 'Menyimpan draft kontribusi...'
                            : 'Menyimpan versi baru...'
                        : null}
                </p>
            </footer>
        </form>
    );
}
