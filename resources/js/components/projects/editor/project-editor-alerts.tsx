import { Link } from '@inertiajs/react';
import type { RefObject } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import { show as projectShow } from '@/routes/projects';
import type { ProjectDetail } from '@/types/project';
import { errorMessage } from './editor-utils';
import type { FormErrorMap } from './editor-utils';

type Props = {
    actionError: string | null;
    hasErrors: boolean;
    errors: FormErrorMap;
    openingErrors: FormErrorMap;
    savedDraft: ProjectDetail | null;
    openingProcessing: boolean;
    institutionId: number;
    actionErrorRef: RefObject<HTMLDivElement | null>;
    errorSummaryRef: RefObject<HTMLDivElement | null>;
};

export function ProjectEditorAlerts({
    actionError,
    hasErrors,
    errors,
    openingErrors,
    savedDraft,
    openingProcessing,
    institutionId,
    actionErrorRef,
    errorSummaryRef,
}: Props) {
    return (
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
                                          institution_id: institutionId,
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

            {hasErrors && (
                <div
                    ref={errorSummaryRef}
                    tabIndex={-1}
                    role="alert"
                    data-test="project-editor-errors"
                    className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <p className="font-semibold">
                        Ada bagian yang perlu diperiksa sebelum disimpan.
                    </p>
                    <p className="mt-1 leading-6">
                        Pesan kesalahan ditampilkan di dekat kolom terkait.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        {Object.entries(errors).map(([field]) => (
                            <li key={field}>{errorMessage(errors, field)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {Object.keys(openingErrors).length > 0 && (
                <div
                    role="alert"
                    className="rounded-2xl border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                >
                    Proyek tersimpan sebagai draft, tetapi belum dapat dibuka.
                    Periksa batas waktu dan status proyek.
                </div>
            )}

            {savedDraft && !openingProcessing && (
                <section
                    role="status"
                    data-test="project-saved-draft"
                    className="space-y-2 rounded-2xl border border-border bg-accent/60 p-4 text-sm leading-6"
                >
                    <p>
                        Draft sudah tersimpan. Periksa proyek ini sebelum
                        mengulangi tindakan.
                    </p>
                    <Link
                        href={projectShow(savedDraft.id)}
                        className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        Buka detail draft dan periksa statusnya
                    </Link>
                </section>
            )}
        </div>
    );
}
