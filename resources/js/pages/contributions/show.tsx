import { Head } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { ContributionAccessDenied } from '@/components/contributions/contribution-access-denied';
import { ContributionActionAlerts } from '@/components/contributions/contribution-action-alerts';
import { ContributionDetailActionsRail } from '@/components/contributions/contribution-detail-actions-rail';
import { ContributionDetailBody } from '@/components/contributions/contribution-detail-body';
import { ContributionDetailHeader } from '@/components/contributions/contribution-detail-header';
import { ContributionRevisionEditor } from '@/components/contributions/contribution-revision-editor';
import { ContributionRevisionFeedback } from '@/components/contributions/contribution-revision-feedback';
import { useContributionDetail } from '@/hooks/use-contribution-detail';
import { index as contributionsIndex } from '@/routes/contributions';
import type {
    ContributionDetail,
    ContributionProjectOption,
} from '@/types/contribution';

export interface ContributionsShowProps {
    contribution: ContributionDetail;
    projects: ContributionProjectOption[];
    permissions: {
        can_update: boolean;
        can_submit: boolean;
    };
}

export default function ContributionsShow({
    contribution: initialContribution,
    projects,
    permissions: initialPermissions,
}: ContributionsShowProps) {
    const { state, actions, refs } = useContributionDetail({
        initialContribution,
        initialPermissions,
        projects,
    });

    const canEdit =
        Boolean(state.revisionProject) && Boolean(state.currentVersion);

    return (
        <>
            <Head title={`Kontribusi ${state.contribution.id}`} />
            <AppPage>
                {state.accessDenied ? (
                    <ContributionAccessDenied />
                ) : (
                    <div
                        className="grid w-full min-w-0 gap-6"
                        data-test="contribution-detail-root"
                    >
                        <ContributionDetailHeader
                            contributionId={state.contribution.id}
                            claim={state.currentVersion?.claim}
                            projectTitle={state.contribution.project.title}
                            ownerName={state.contribution.owner.name}
                        />
                        <div
                            className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                            data-test="contribution-detail-grid"
                        >
                            <aside
                                className="min-w-0 xl:order-2"
                                aria-label="Aksi dan konteks kontribusi"
                            >
                                <ContributionDetailActionsRail
                                    state={state}
                                    actions={actions}
                                    editButtonRef={refs.editButton}
                                    canEdit={canEdit}
                                />
                            </aside>

                            <div className="grid min-w-0 content-start gap-6 xl:order-1">
                                <ContributionActionAlerts
                                    state={state}
                                    submitErrorSummaryRef={
                                        refs.submitErrorSummary
                                    }
                                />

                                <ContributionRevisionFeedback
                                    latestReview={state.latestReview}
                                />

                                {state.isEditing &&
                                    state.permissions.can_update &&
                                    !canEdit && (
                                        <p
                                            role="status"
                                            className="rounded-2xl border border-pending/30 bg-pending-subtle p-5 text-sm leading-6 text-pending-subtle-foreground"
                                        >
                                            Sumber pekerjaan untuk revisi belum
                                            tersedia. Kamu tetap dapat membaca
                                            catatan ini, tetapi belum dapat
                                            menyimpan perubahan.
                                        </p>
                                    )}

                                {state.isComposerOpen &&
                                state.revisionProject &&
                                state.currentVersion ? (
                                    <ContributionRevisionEditor
                                        state={state}
                                        actions={actions}
                                        revisionHeadingRef={
                                            refs.revisionHeading
                                        }
                                    />
                                ) : (
                                    <ContributionDetailBody
                                        contribution={state.contribution}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </AppPage>
        </>
    );
}

ContributionsShow.layout = {
    breadcrumbs: [
        { title: 'Kontribusi', href: contributionsIndex() },
        { title: 'Detail kontribusi' },
    ],
};
