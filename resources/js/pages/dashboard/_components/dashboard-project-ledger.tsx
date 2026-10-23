import type { InertiaLinkProps } from '@inertiajs/react';
import { FolderOpen } from 'lucide-react';
import { DashboardProjectAction } from '@/pages/dashboard/_components/dashboard-project-action';
import { DashboardProjectLoading } from '@/pages/dashboard/_components/dashboard-project-loading';
import { DashboardProjectRegionState } from '@/pages/dashboard/_components/dashboard-project-region-state';
import { DashboardProjectRow } from '@/pages/dashboard/_components/dashboard-project-row';
import type { DashboardAction, DashboardProjectsRegion } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

type Props = {
    region: DashboardProjectsRegion;
    referenceLayout?: boolean;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
};

export function DashboardProjectLedger({
    region,
    referenceLayout = false,
    getActionHref,
    onAction,
}: Props) {
    const totalCount =
        region.state === 'ready'
            ? region.totalCount
            : region.state === 'empty'
              ? 0
              : undefined;

    return (
        <section
            aria-labelledby="active-projects-heading"
            className="min-w-0"
            data-test="dashboard-ledger"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
                <div className="min-w-0">
                    <h2
                        id="active-projects-heading"
                        className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                    >
                        {referenceLayout && (
                            <FolderOpen
                                aria-hidden="true"
                                className="size-5 shrink-0 text-primary"
                            />
                        )}
                        Proyek aktif
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Lanjutkan pekerjaan bersama timmu.
                    </p>
                </div>

                {totalCount !== undefined && (
                    <span
                        aria-label={`${totalCount} proyek`}
                        className="inline-flex items-center rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                        data-test="dashboard-project-count"
                    >
                        {totalCount} proyek
                    </span>
                )}
            </div>

            {region.state === 'loading' && (
                <DashboardProjectLoading announcement={region.announcement} />
            )}

            {(region.state === 'empty' ||
                region.state === 'error' ||
                region.state === 'forbidden') && (
                <DashboardProjectRegionState
                    region={region}
                    referenceLayout={referenceLayout}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}

            {region.state === 'ready' && (
                <div className="dashboard-project-list rounded-3xl border border-border bg-card p-2 shadow-sm sm:p-3">
                    <ol className="grid divide-y divide-border/60">
                        {region.projects.map((project) => (
                            <DashboardProjectRow
                                key={project.id}
                                project={project}
                            />
                        ))}
                    </ol>

                    {region.remainingActionLabel && (
                        <div className="border-t border-border/60 px-3 pt-4 pb-2">
                            <DashboardProjectAction
                                action={{
                                    key: 'projects',
                                    view: 'mine',
                                    label: region.remainingActionLabel,
                                }}
                                getActionHref={getActionHref}
                                onAction={onAction}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
