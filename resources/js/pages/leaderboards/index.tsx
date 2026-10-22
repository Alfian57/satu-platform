import { Head, usePage } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { LeaderboardContext } from '@/components/leaderboards/leaderboard-context';
import { LeaderboardDialogs } from '@/components/leaderboards/leaderboard-dialogs';
import { LeaderboardFilterBar } from '@/components/leaderboards/leaderboard-filter-bar';
import { LeaderboardForbiddenState } from '@/components/leaderboards/leaderboard-forbidden-state';
import { LeaderboardHero } from '@/components/leaderboards/leaderboard-hero';
import { LeaderboardResultsSection } from '@/components/leaderboards/leaderboard-results-section';
import { LeaderboardStatusBanners } from '@/components/leaderboards/leaderboard-status-banners';
import { useLeaderboards } from '@/hooks/use-leaderboards';
import { index as leaderboardsIndex } from '@/routes/leaderboards';
import type { LeaderboardPageProps } from '@/types/leaderboard';

export default function LeaderboardIndex() {
    const { auth, leaderboard, leaderboardRows } =
        usePage<LeaderboardPageProps>().props;
    const isAdmin = auth.user?.workspace.role === 'campus_admin';
    const { state, actions, refs } = useLeaderboards({
        leaderboard,
        leaderboardRows,
    });

    const selectedCategory = leaderboard.scopes.find(
        (scope) => scope.value === leaderboard.scope,
    );
    const individual = leaderboard.scope === 'individual';

    if (state.forbidden) {
        return (
            <>
                <Head title="Peringkat" />
                <AppPage>
                    <LeaderboardForbiddenState
                        isAdmin={isAdmin}
                        loadError={state.loadError}
                        busy={state.busy}
                        onRetry={() => actions.requestRows()}
                    />
                </AppPage>
            </>
        );
    }

    return (
        <>
            <Head title="Peringkat" />
            <AppPage>
                <div
                    className="leaderboard-discovery grid w-full min-w-0 gap-6"
                    data-leaderboard-source="application"
                    data-test="leaderboard-root"
                >
                    <LeaderboardHero
                        isAdmin={isAdmin}
                        institutionName={leaderboard.institution?.name}
                        busy={state.busy}
                        individual={individual}
                        onRefresh={() => actions.requestRows()}
                        onOpenPreference={actions.openPreference}
                    />

                    <LeaderboardStatusBanners
                        feedback={state.preferenceFeedback}
                        needsCheck={state.needsPreferenceCheck}
                        loadError={state.loadError}
                        busy={state.busy}
                        onRetry={() => actions.requestRows()}
                    />

                    <LeaderboardFilterBar
                        semesters={leaderboard.semesters}
                        selectedSemester={leaderboard.semester}
                        scopes={leaderboard.scopes}
                        selectedScope={leaderboard.scope}
                        busy={state.busy}
                        onSelectSemester={(semester) =>
                            actions.requestRows({
                                semester,
                                scope: leaderboard.scope,
                                page: 1,
                            })
                        }
                        onSelectScope={(scope) =>
                            actions.requestRows({
                                semester: leaderboard.semester,
                                scope,
                                page: 1,
                            })
                        }
                    />

                    <div
                        className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
                        data-test="leaderboard-grid"
                    >
                        <LeaderboardResultsSection
                            categoryLabel={selectedCategory?.label ?? ''}
                            isNavigating={state.isNavigating}
                            rows={leaderboardRows}
                            busy={state.busy}
                            onExplain={actions.openExplanation}
                            onPageChange={(page) =>
                                actions.requestRows({
                                    semester: leaderboard.semester,
                                    scope: leaderboard.scope,
                                    page,
                                })
                            }
                            onOpenPreference={actions.openPreference}
                            onRetry={() => actions.requestRows()}
                        />

                        <LeaderboardContext
                            data={leaderboard}
                            pending={state.busy || state.needsPreferenceCheck}
                            savingPreference={state.pendingPreference}
                            onPreference={actions.openPreference}
                        />
                    </div>
                </div>
            </AppPage>

            <LeaderboardDialogs
                state={state}
                actions={actions}
                institutionName={leaderboard.institution?.name}
                selectedCategoryLabel={
                    selectedCategory?.label ?? 'Kategori peringkat'
                }
                semester={leaderboard.semester}
                period={leaderboard.period}
                preferenceErrorRef={refs.preferenceErrorRef}
                preferenceReturnFocus={refs.preferenceReturnFocus}
                explanationReturnFocus={refs.explanationReturnFocus}
            />
        </>
    );
}

LeaderboardIndex.layout = {
    breadcrumbs: [{ title: 'Peringkat', href: leaderboardsIndex() }],
};
