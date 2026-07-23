import { Head, usePage } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { AppPage } from '@/components/app-page';
import { DashboardContextRail } from '@/components/dashboard-context-rail';
import { DashboardNextAction } from '@/components/dashboard-next-action';
import { DashboardProjectLedger } from '@/components/dashboard-project-ledger';
import { DashboardStateNotice } from '@/components/dashboard-state-notice';
import {
    dashboardReferenceScenarios,
    resolveDashboardReferenceState,
} from '@/lib/dashboard-reference-data';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const page = usePage();
    const { auth } = page.props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] ?? 'mahasiswa';
    const referenceState = resolveDashboardReferenceState(page.url);
    const scenario = dashboardReferenceScenarios[referenceState];

    function showDemoAction(actionLabel: string) {
        toast.info('Data demo sintetis', {
            description: `${actionLabel} belum terhubung ke fitur aplikasi pada fase ini.`,
        });
    }

    return (
        <>
            <Head title="Dashboard" />
            <AppPage
                contextRail={
                    <DashboardContextRail
                        reviewQueue={scenario.reviewQueue}
                        recommendationRegion={scenario.recommendationRegion}
                        onDemoAction={showDemoAction}
                    />
                }
                contextRailLabel="Konteks dashboard"
            >
                <div
                    data-dashboard-source={scenario.source}
                    data-dashboard-state={referenceState}
                    data-test="dashboard-root"
                >
                    <header className="mb-6 grid gap-4 xl:mb-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(14rem,0.75fr)] xl:items-end xl:gap-8">
                        <div>
                            <p className="text-body text-muted-foreground">
                                Selamat datang kembali, {firstName}.
                            </p>
                            <h1 className="mt-2 max-w-[24ch] text-headline font-bold text-balance xl:max-w-none">
                                Yang perlu kamu selesaikan
                            </h1>
                        </div>

                        <div className="flex max-w-2xl items-start gap-3 border-y border-border py-3 text-sm text-muted-foreground xl:max-w-none">
                            <Info
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <p>{scenario.syntheticLabel}</p>
                        </div>
                    </header>

                    <div className="grid gap-7 xl:gap-6">
                        {scenario.notice && (
                            <DashboardStateNotice
                                notice={scenario.notice}
                                onDemoAction={showDemoAction}
                            />
                        )}
                        <DashboardNextAction
                            action={scenario.nextAction}
                            onDemoAction={showDemoAction}
                        />
                        <DashboardProjectLedger
                            region={scenario.projectsRegion}
                            onDemoAction={showDemoAction}
                        />
                    </div>
                </div>
            </AppPage>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
