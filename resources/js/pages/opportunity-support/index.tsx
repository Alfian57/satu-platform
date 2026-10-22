import { Head, usePage } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import type { OpportunitySupportProps } from '@/components/opportunity-support/opportunity-support-constants';
import { sheetClass } from '@/components/opportunity-support/opportunity-support-constants';
import { OpportunitySupportDetail } from '@/components/opportunity-support/opportunity-support-detail';
import { OpportunitySupportErrors } from '@/components/opportunity-support/opportunity-support-errors';
import { OpportunitySupportForm } from '@/components/opportunity-support/opportunity-support-form';
import { OpportunitySupportHeader } from '@/components/opportunity-support/opportunity-support-header';
import { OpportunitySupportJourneyMetrics } from '@/components/opportunity-support/opportunity-support-journey-metrics';
import { OpportunitySupportNotice } from '@/components/opportunity-support/opportunity-support-notice';
import { OpportunitySupportRequestList } from '@/components/opportunity-support/opportunity-support-request-list';
import { OpportunitySupportStatusBanners } from '@/components/opportunity-support/opportunity-support-status-banners';
import { useOpportunitySupport } from '@/hooks/use-opportunity-support';

export default function OpportunitySupport(initial: OpportunitySupportProps) {
    const administration =
        usePage().props.auth.user?.workspace.role === 'campus_admin';
    const { state, actions, refs } = useOpportunitySupport(initial);

    return (
        <>
            <Head
                title={
                    state.data.reviewer
                        ? 'Tindak lanjut kesempatan'
                        : 'Bantuan kesempatan'
                }
            />
            <AppPage className="max-w-none [&_*]:motion-reduce:animate-none [&_*]:motion-reduce:transition-none">
                <div className="space-y-5">
                    <OpportunitySupportHeader
                        administration={administration}
                        institutionId={state.data.institution.id}
                        institutionName={state.data.institution.name}
                        reviewer={state.data.reviewer}
                        isProcessing={state.form.processing}
                        isChecking={state.read.processing}
                        onCheckLatest={() => actions.checkLatest()}
                    />

                    <OpportunitySupportErrors
                        errorRef={refs.errorRef}
                        error={state.error}
                        errors={state.errors}
                    />

                    <OpportunitySupportStatusBanners
                        administration={administration}
                        reviewer={state.data.reviewer}
                        isProcessing={state.form.processing}
                        isChecking={state.read.processing}
                        message={state.message}
                        enabled={state.data.enabled}
                        installed={state.data.requests.installed}
                    />

                    {state.denied ? (
                        <section className={sheetClass}>
                            <h2 className="font-bold">Akses tidak tersedia</h2>
                            <p className="mt-2">
                                Data sebelumnya disembunyikan. Periksa data
                                terbaru setelah akses dipulihkan.
                            </p>
                        </section>
                    ) : (
                        <>
                            <OpportunitySupportNotice
                                notice={state.data.notice}
                            />

                            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
                                <div className="min-w-0 space-y-5">
                                    <OpportunitySupportForm
                                        canCreate={state.data.can_create}
                                        blocked={state.blocked}
                                        need={state.need}
                                        explanation={state.explanation}
                                        consent={state.consent}
                                        errors={state.form.errors}
                                        onNeedChange={actions.setNeed}
                                        onExplanationChange={
                                            actions.setExplanation
                                        }
                                        onConsentChange={actions.setConsent}
                                        onSubmit={() => actions.send('create')}
                                    />

                                    <OpportunitySupportRequestList
                                        reviewer={state.data.reviewer}
                                        requests={state.data.requests.data}
                                        page={state.data.requests.page}
                                        lastPage={state.data.requests.last_page}
                                        total={state.data.requests.total}
                                        selectedId={state.selected?.id}
                                        blocked={state.blocked}
                                        isProcessing={state.form.processing}
                                        isReading={state.read.processing}
                                        onChoose={actions.choose}
                                        onPageChange={(p) =>
                                            actions.checkLatest(p)
                                        }
                                    />
                                </div>

                                <OpportunitySupportDetail
                                    selected={state.selected}
                                    detailRef={refs.detailRef}
                                    stale={state.stale}
                                    blocked={state.blocked}
                                    isProcessing={state.form.processing}
                                    isReading={state.read.processing}
                                    role={state.role}
                                    reason={state.reason}
                                    errors={state.form.errors}
                                    opportunities={state.data.opportunities}
                                    latestOffer={state.latestOffer}
                                    onRoleChange={actions.setRole}
                                    onReasonChange={actions.setReason}
                                    onUseLatestData={actions.useLatestData}
                                    onOffer={() => actions.send('offer')}
                                    onNote={() => actions.send('note')}
                                    onAccept={() => actions.send('accept')}
                                    onDecline={() => actions.send('decline')}
                                    onWithdraw={() => actions.send('withdraw')}
                                />
                            </div>

                            <OpportunitySupportJourneyMetrics
                                journey={state.data.journey}
                            />
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}
