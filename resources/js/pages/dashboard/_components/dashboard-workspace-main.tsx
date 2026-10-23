import { Deferred } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { DashboardNextAction } from '@/pages/dashboard/_components/dashboard-next-action';
import { DashboardProjectLedger } from '@/pages/dashboard/_components/dashboard-project-ledger';
import { loadingProjects } from '@/pages/dashboard/_hooks/use-dashboard';
import type {
    DashboardAction,
    DashboardNextAction as DashboardNextActionType,
    DashboardProjectsRegion,
} from '@/types';

type ActionHref = NonNullable<
    ComponentProps<typeof DashboardNextAction>['getActionHref']
>;

export interface DashboardWorkspaceMainProps {
    nextAction: DashboardNextActionType;
    activeProjects?: DashboardProjectsRegion | null;
    useReferenceLayout: boolean;
    getActionHref: ActionHref;
    onAction: (action: DashboardAction) => void;
}

export function DashboardWorkspaceMain({
    nextAction,
    activeProjects,
    useReferenceLayout,
    getActionHref,
    onAction,
}: DashboardWorkspaceMainProps) {
    return (
        <div className="dashboard-workspace-main grid min-w-0 gap-6">
            <DashboardNextAction
                action={nextAction}
                referenceLayout={useReferenceLayout}
                getActionHref={getActionHref}
                onAction={onAction}
            />
            <Deferred
                data="activeProjects"
                fallback={
                    <DashboardProjectLedger
                        region={loadingProjects()}
                        referenceLayout={useReferenceLayout}
                        getActionHref={getActionHref}
                        onAction={onAction}
                    />
                }
            >
                <DashboardProjectLedger
                    referenceLayout={useReferenceLayout}
                    region={activeProjects ?? loadingProjects()}
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            </Deferred>
        </div>
    );
}
