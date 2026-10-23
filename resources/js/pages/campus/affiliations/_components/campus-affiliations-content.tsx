import { Deferred, Head } from '@inertiajs/react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { AffiliationFilterBar } from '@/pages/campus/affiliations/_components/affiliation-filter-bar';
import { AffiliationOutcomeBanner } from '@/pages/campus/affiliations/_components/affiliation-outcome-banner';
import { AffiliationQueueSkeleton } from '@/pages/campus/affiliations/_components/affiliation-queue-skeleton';
import { AffiliationReviewRegion } from '@/pages/campus/affiliations/_components/affiliation-review-region';
import { useCampusAffiliations } from '@/pages/campus/affiliations/_hooks/use-campus-affiliations';
import type { CampusAffiliationsProps } from '@/pages/campus/affiliations/_types/affiliation-types';

export function CampusAffiliationsContent({
    institution,
    filters,
    reviewQueue,
    reviewOutcome,
    reviewIssue,
}: CampusAffiliationsProps) {
    const {
        isQueueLoading,
        setQueueLoading,
        requestError,
        isForbidden,
        errorRef,
        reportError,
        confirmAccess,
        visitQueue,
        changeFilter,
    } = useCampusAffiliations({ institution, filters });

    return (
        <>
            <Head title={`Afiliasi kampus | ${institution.name}`} />
            <AppPage className="max-w-none min-w-0">
                <div
                    className="space-y-4 sm:space-y-5"
                    data-test="affiliation-review-root"
                >
                    <CampusOperationHeader
                        theme="affiliations"
                        icon={ClipboardCheck}
                        title="Afiliasi kampus"
                        description="Periksa permohonan, cocokkan dengan roster, dan catat keputusan beserta alasannya."
                        institution={institution.name}
                        eyebrow="Peninjauan kampus"
                        testId="affiliation-review-header"
                    />
                    <AffiliationOutcomeBanner
                        reviewOutcome={reviewOutcome}
                        reviewIssue={reviewIssue}
                        requestError={requestError}
                        isForbidden={isForbidden}
                    />
                    {requestError && (
                        <div
                            ref={errorRef}
                            tabIndex={-1}
                            role="alert"
                            className="rounded-2xl border border-correction/20 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                            <p>{requestError}</p>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-3 h-11 bg-white"
                                disabled={isQueueLoading}
                                onClick={() => visitQueue(filters)}
                            >
                                Muat ulang antrean
                            </Button>
                        </div>
                    )}
                    <AffiliationFilterBar
                        filters={filters}
                        disabled={isQueueLoading || reviewQueue === undefined}
                        onChangeFilter={changeFilter}
                    />
                    <Deferred
                        data="reviewQueue"
                        fallback={<AffiliationQueueSkeleton />}
                    >
                        <AffiliationReviewRegion
                            institution={institution}
                            filters={filters}
                            reviewQueue={reviewQueue!}
                            isQueueLoading={isQueueLoading}
                            onQueueLoadingChange={setQueueLoading}
                            onRequestError={reportError}
                            onRequestSuccess={confirmAccess}
                            isForbidden={isForbidden}
                        />
                    </Deferred>
                </div>
            </AppPage>
        </>
    );
}
