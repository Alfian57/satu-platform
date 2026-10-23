import { Head, Link } from '@inertiajs/react';
import { LayoutPanelTop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { OverviewContextRail } from '@/pages/campus/overview/_components/overview-context-rail';
import { OverviewFeedbackAlert } from '@/pages/campus/overview/_components/overview-feedback-alert';
import { OverviewFilterForm } from '@/pages/campus/overview/_components/overview-filter-form';
import { OverviewForbiddenSection } from '@/pages/campus/overview/_components/overview-forbidden-section';
import { OverviewMembersList } from '@/pages/campus/overview/_components/overview-members-list';
import { OverviewMetricsGrid } from '@/pages/campus/overview/_components/overview-metrics-grid';
import { OverviewQuickActions } from '@/pages/campus/overview/_components/overview-quick-actions';
import { useCampusOverview } from '@/pages/campus/overview/_hooks/use-campus-overview';
import type { CampusOverviewProps } from '@/pages/campus/overview/_types/overview-types';
import { index as opportunitySupport } from '@/routes/opportunity-support';

export default function CampusOverview({
    institution,
    metrics,
    programDistribution,
    members,
    filters,
}: CampusOverviewProps) {
    const {
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        program,
        setProgram,
        isPending,
        isForbidden,
        feedback,
        hasError,
        fieldErrors,
        errorRef,
        appliedQuery,
        hasAppliedFilters,
        hasDraftChanges,
        visitOverview,
        handleFilterSubmit,
        resetFilters,
        retryLastRequest,
    } = useCampusOverview({ institution, members, filters });

    return (
        <>
            <Head title={`Ringkasan kampus | ${institution.name}`} />
            <AppPage className="max-w-none min-w-0">
                <div
                    className="space-y-4 sm:space-y-5"
                    data-test="campus-overview-root"
                >
                    <CampusOperationHeader
                        theme="overview"
                        icon={LayoutPanelTop}
                        title="Ringkasan kampus"
                        description="Pantau keanggotaan dan proyek kampus, lalu lanjutkan ke antrean afiliasi atau validasi kontribusi yang perlu ditinjau."
                        institution={institution.name}
                        testId="campus-overview-header"
                    />
                    <Button variant="outline" asChild className="min-h-11">
                        <Link href={opportunitySupport(institution.id)}>
                            Tindak lanjut kesempatan
                        </Link>
                    </Button>
                    <OverviewFilterForm
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        program={program}
                        setProgram={setProgram}
                        fieldErrors={fieldErrors}
                        isPending={isPending}
                        hasDraftChanges={hasDraftChanges}
                        hasAppliedFilters={hasAppliedFilters}
                        onSubmit={handleFilterSubmit}
                        onReset={resetFilters}
                        onReload={() => visitOverview(appliedQuery)}
                    />
                    <OverviewFeedbackAlert
                        errorRef={errorRef}
                        hasError={hasError}
                        feedback={feedback}
                        isPending={isPending}
                        onRetry={retryLastRequest}
                    />
                    {isForbidden ? (
                        <OverviewForbiddenSection />
                    ) : (
                        <>
                            <OverviewMetricsGrid
                                metrics={metrics}
                                isPending={isPending}
                            />
                            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                                <div className="min-w-0 space-y-4">
                                    <OverviewQuickActions
                                        institutionId={institution.id}
                                        pendingMemberships={
                                            metrics.memberships.pending
                                        }
                                    />
                                    <OverviewMembersList
                                        members={members}
                                        isPending={isPending}
                                        onPageChange={(page) =>
                                            visitOverview({
                                                ...appliedQuery,
                                                page,
                                            })
                                        }
                                    />
                                </div>
                                <OverviewContextRail
                                    institution={institution}
                                    programDistribution={programDistribution}
                                    isPending={isPending}
                                    isForbidden={isForbidden}
                                />
                            </div>
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}

CampusOverview.layout = {
    breadcrumbs: [
        { title: 'Operasi kampus', href: '#' },
        { title: 'Ringkasan', href: '#' },
    ],
};
