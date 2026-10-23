import type { InertiaLinkProps } from '@inertiajs/react';
import { FolderOpen, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { DashboardProjectAction } from '@/pages/dashboard/_components/dashboard-project-action';
import type { DashboardAction, DashboardProjectsRegion } from '@/types';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export function DashboardProjectRegionState({
    region,
    getActionHref,
    onAction,
    referenceLayout,
}: {
    region: Extract<
        DashboardProjectsRegion,
        { state: 'empty' | 'error' | 'forbidden' }
    >;
    getActionHref: (action: DashboardAction) => ActionHref | null;
    onAction: (action: DashboardAction) => void;
    referenceLayout: boolean;
}) {
    const Icon = region.state === 'error' ? RefreshCw : FolderOpen;

    return (
        <div
            className={cn(
                'dashboard-project-state flex flex-col gap-4 rounded-3xl border border-dashed border-border bg-card/70 p-5 sm:p-6',
                referenceLayout &&
                    region.state !== 'error' &&
                    'dashboard-project-state--illustrated',
            )}
            data-test={`dashboard-projects-${region.state}`}
            role={region.state === 'error' ? 'alert' : undefined}
        >
            <div className="dashboard-project-state__copy flex min-w-0 items-start gap-4">
                {region.state === 'empty' && !referenceLayout ? (
                    <DashboardArchiveArt className="dashboard-project-state__illustration w-20 shrink-0 sm:w-24" />
                ) : (
                    <span className="shrink-0 rounded-2xl bg-accent p-3 text-primary">
                        <Icon
                            aria-hidden="true"
                            className={cn(
                                'size-6',
                                region.state === 'error'
                                    ? 'text-correction'
                                    : 'text-primary',
                            )}
                        />
                    </span>
                )}
                <div className="min-w-0">
                    <p className="text-base font-bold text-foreground">
                        {region.title}
                    </p>
                    <p className="mt-1 max-w-prose text-sm leading-6 wrap-anywhere text-muted-foreground">
                        {region.description}
                    </p>
                </div>
            </div>
            {region.action && (
                <div
                    className={
                        referenceLayout
                            ? 'dashboard-project-state__action'
                            : 'contents'
                    }
                >
                    <DashboardProjectAction
                        action={region.action}
                        getActionHref={getActionHref}
                        onAction={onAction}
                    />
                </div>
            )}
            {referenceLayout && region.state !== 'error' && (
                <img
                    src="/images/dashboard-project-folder.webp"
                    srcSet="/images/dashboard-project-folder-128.webp 128w, /images/dashboard-project-folder.webp 256w"
                    sizes="64px"
                    width={256}
                    height={256}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="dashboard-project-state__folder"
                />
            )}
        </div>
    );
}
