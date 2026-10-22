import { Head } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { ContributionComposer } from '@/components/contributions/contribution-composer';
import { ContributionCreateForbidden } from '@/components/contributions/contribution-create-forbidden';
import { ContributionCreateGuideSidebar } from '@/components/contributions/contribution-create-guide-sidebar';
import { ContributionCreateHeader } from '@/components/contributions/contribution-create-header';
import { ContributionCreateRecoveryAlert } from '@/components/contributions/contribution-create-recovery-alert';
import { useContributionCreate } from '@/hooks/use-contribution-create';
import { index as contributionsIndex } from '@/routes/contributions';
import type { ContributionProjectOption } from '@/types/contribution';

export interface ContributionsCreateProps {
    projects: ContributionProjectOption[];
    can_create: boolean;
}

export default function ContributionsCreate({
    projects,
    can_create: canCreate,
}: ContributionsCreateProps) {
    const { state, actions } = useContributionCreate();
    const isForbidden =
        state.accessDenied || !canCreate || projects.length === 0;

    return (
        <>
            <Head title="Susun kontribusi" />
            <AppPage className="min-w-0">
                <div
                    data-test="contribution-create-root"
                    className="grid w-full min-w-0 gap-6"
                >
                    <ContributionCreateHeader />

                    {isForbidden ? (
                        <ContributionCreateForbidden />
                    ) : (
                        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                            <section
                                aria-labelledby="contribution-composer-title"
                                className="grid min-w-0 gap-5"
                            >
                                <div className="grid gap-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        Catatan pekerjaan
                                    </p>
                                    <h2
                                        id="contribution-composer-title"
                                        className="text-title font-semibold"
                                    >
                                        Susun draft selangkah demi selangkah.
                                    </h2>
                                </div>

                                <ContributionCreateRecoveryAlert
                                    actionError={state.actionError}
                                    needsCheck={state.needsCheck}
                                    onConfirmChecked={actions.resetRecovery}
                                />

                                <ContributionComposer
                                    mode="create"
                                    projects={projects}
                                    processing={state.processing}
                                    blocked={state.needsCheck}
                                    canLeave={actions.canLeave}
                                    errors={state.errors}
                                    onSubmit={actions.saveDraft}
                                />
                            </section>

                            <ContributionCreateGuideSidebar />
                        </div>
                    )}
                </div>
            </AppPage>
        </>
    );
}

ContributionsCreate.layout = {
    breadcrumbs: [
        { title: 'Kontribusi', href: contributionsIndex() },
        { title: 'Susun draft' },
    ],
};
