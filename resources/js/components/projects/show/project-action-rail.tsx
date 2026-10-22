import { Link } from '@inertiajs/react';
import { Archive, ClipboardList, Edit3, LockKeyhole } from 'lucide-react';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import { actionAvailability } from '@/components/projects/show/show-utils';
import type { TransitionAction } from '@/components/projects/show/show-utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { edit as projectEdit } from '@/routes/projects';
import type { ProjectDetail, ProjectStatus } from '@/types/project';

export function ProjectActionRail({
    project,
    canEdit,
    canTransition,
    canWorkspace,
    canRequestJoin,
    processing,
    onOpen,
    onDestructiveAction,
}: {
    project: ProjectDetail;
    canEdit: boolean;
    canTransition: boolean;
    canWorkspace: boolean;
    canRequestJoin: boolean;
    processing: boolean;
    onOpen: () => void;
    onDestructiveAction: (action: TransitionAction) => void;
}) {
    const status = project.status as ProjectStatus;

    return (
        <section
            aria-labelledby="project-actions-title"
            data-test="project-actions"
            className="grid min-w-0 gap-3 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-background p-5 shadow-md sm:grid-cols-2 sm:p-6"
        >
            <h2
                id="project-actions-title"
                className="text-sm font-semibold text-primary sm:col-span-2"
            >
                Langkah berikutnya
            </h2>
            {canRequestJoin && (
                <Button
                    asChild
                    className="min-h-11 w-full shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5 sm:col-span-2"
                >
                    <a href="#team-join-request-form">Ajukan bergabung</a>
                </Button>
            )}
            {canEdit && (status === 'draft' || status === 'open') && (
                <Button
                    asChild
                    variant="outline"
                    className="h-auto min-h-11 w-full cursor-pointer py-3 whitespace-normal"
                    data-test="edit-project"
                >
                    <Link href={projectEdit(project.id)}>
                        <Edit3 aria-hidden="true" />
                        Ubah detail proyek
                    </Link>
                </Button>
            )}
            {canWorkspace && (
                <Button
                    asChild
                    className="w-full cursor-pointer shadow-sm hover:shadow-md motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-standard motion-safe:active:translate-y-0.5"
                    data-test="open-workspace"
                >
                    <Link href={ProjectWorkspaceController.show(project.id)}>
                        <ClipboardList aria-hidden="true" />
                        Buka ruang kerja
                    </Link>
                </Button>
            )}
            {canTransition && status === 'draft' && (
                <Button
                    type="button"
                    className="w-full cursor-pointer"
                    disabled={processing}
                    onClick={onOpen}
                    data-test="open-project"
                >
                    {processing && <Spinner aria-hidden="true" />}
                    Buka proyek
                </Button>
            )}
            {canTransition &&
                (status === 'open' ||
                    status === 'forming' ||
                    status === 'full') && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer border-correction/30 text-correction hover:border-correction hover:bg-correction-subtle hover:text-correction-subtle-foreground"
                        disabled={processing}
                        onClick={() => onDestructiveAction('cancel')}
                        data-test="cancel-project"
                    >
                        Batalkan proyek
                    </Button>
                )}
            {canTransition &&
                (status === 'closed' || status === 'cancelled') && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        disabled={processing}
                        onClick={() => onDestructiveAction('archive')}
                        data-test="archive-project"
                    >
                        <Archive aria-hidden="true" />
                        Arsipkan proyek
                    </Button>
                )}
            {!canEdit && !canTransition && (
                <div
                    data-test="project-read-only"
                    className="flex min-w-0 items-start gap-2 rounded-xl border border-border bg-background/60 px-3 py-3 text-sm text-muted-foreground sm:col-span-2"
                >
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <p>
                        Detail dikelola pemilik proyek. Tindakan bergabung
                        mengikuti status tim dan izin akunmu.
                    </p>
                </div>
            )}
            {canTransition && (
                <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
                    {actionAvailability(project)}
                </p>
            )}
        </section>
    );
}
