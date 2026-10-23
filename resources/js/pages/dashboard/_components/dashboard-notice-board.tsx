import type { ComponentProps } from 'react';
import { DashboardAffiliationNotice } from '@/pages/dashboard/_components/dashboard-affiliation-notice';
import { DashboardStateNotice } from '@/pages/dashboard/_components/dashboard-state-notice';
import type { DashboardAction, DashboardNotice, ShellContext } from '@/types';

type ActionHref = NonNullable<
    ComponentProps<typeof DashboardStateNotice>['getActionHref']
>;

export interface DashboardNoticeBoardProps {
    isAwaitingReview: boolean;
    isStudent: boolean;
    dashboardNotice: DashboardNotice | null;
    shell: ShellContext;
    getActionHref: ActionHref;
    onAction: (action: DashboardAction) => void;
}

export function DashboardNoticeBoard({
    isAwaitingReview,
    isStudent,
    dashboardNotice,
    shell,
    getActionHref,
    onAction,
}: DashboardNoticeBoardProps) {
    return (
        <div
            className={
                isAwaitingReview ? 'dashboard-affiliation-board' : 'contents'
            }
        >
            {dashboardNotice && (
                <DashboardStateNotice
                    notice={dashboardNotice}
                    affiliationReview={
                        isAwaitingReview &&
                        dashboardNotice.action?.key === 'onboarding'
                    }
                    getActionHref={getActionHref}
                    onAction={onAction}
                />
            )}
            {isStudent && <DashboardAffiliationNotice shell={shell} />}
        </div>
    );
}
