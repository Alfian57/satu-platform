import type { RefObject } from 'react';
import { LeaderboardExplanationDialog } from '@/components/leaderboards/leaderboard-explanation-dialog';
import { LeaderboardPreferenceDialog } from '@/components/leaderboards/leaderboard-preference-dialog';
import type { UseLeaderboardsReturn } from '@/hooks/use-leaderboards';
import type { LeaderboardPageData } from '@/types/leaderboard';

export interface LeaderboardDialogsProps {
    state: UseLeaderboardsReturn['state'];
    actions: UseLeaderboardsReturn['actions'];
    institutionName?: string;
    selectedCategoryLabel: string;
    semester: LeaderboardPageData['semester'];
    period: LeaderboardPageData['period'];
    preferenceErrorRef: RefObject<HTMLParagraphElement | null>;
    preferenceReturnFocus: RefObject<HTMLElement | null>;
    explanationReturnFocus: RefObject<HTMLElement | null>;
}

export function LeaderboardDialogs({
    state,
    actions,
    institutionName,
    selectedCategoryLabel,
    semester,
    period,
    preferenceErrorRef,
    preferenceReturnFocus,
    explanationReturnFocus,
}: LeaderboardDialogsProps) {
    return (
        <>
            <LeaderboardPreferenceDialog
                open={state.preferenceIntent !== null}
                preferenceIntent={state.preferenceIntent}
                preferenceError={state.preferenceError}
                pendingPreference={state.pendingPreference}
                needsPreferenceCheck={state.needsPreferenceCheck}
                institutionName={institutionName}
                preferenceErrorRef={preferenceErrorRef}
                returnFocusRef={preferenceReturnFocus}
                onOpenChange={(open) => {
                    if (!open) {
                        actions.closePreference();
                    }
                }}
                onSubmit={actions.submitPreference}
            />

            <LeaderboardExplanationDialog
                open={state.explanationRow !== null}
                explanationRow={state.explanationRow}
                selectedCategoryLabel={selectedCategoryLabel}
                semester={semester}
                period={period}
                returnFocusRef={explanationReturnFocus}
                onOpenChange={(open) => {
                    if (!open) {
                        actions.closeExplanation();
                    }
                }}
            />
        </>
    );
}
