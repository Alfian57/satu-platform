import { LeaderboardBadgeList } from '@/pages/leaderboards/_components/leaderboard-badge-list';
import { LeaderboardConsentCard } from '@/pages/leaderboards/_components/leaderboard-consent-card';
import { formatLeaderboardDate } from '@/pages/leaderboards/_components/leaderboard-formatters';
import { LeaderboardMethodGuide } from '@/pages/leaderboards/_components/leaderboard-method-guide';
import { LeaderboardNotice } from '@/pages/leaderboards/_components/leaderboard-notice';
import { LeaderboardPersonalXp } from '@/pages/leaderboards/_components/leaderboard-personal-xp';
import type { LeaderboardPageData } from '@/types/leaderboard';

export interface LeaderboardContextProps {
    data: LeaderboardPageData;
    pending: boolean;
    savingPreference: boolean;
    onPreference: () => void;
}

export function LeaderboardContext({
    data,
    pending,
    savingPreference,
    onPreference,
}: LeaderboardContextProps) {
    const individual = data.scope === 'individual';

    return (
        <aside
            aria-label="Panduan dan pengaturan peringkat"
            className="grid min-w-0 content-start gap-6"
        >
            {!data.isCampusOperator && data.personalXp != null && (
                <LeaderboardPersonalXp
                    personalXp={data.personalXp}
                    pendingXpCount={data.pendingXpCount}
                    semester={data.semester}
                />
            )}

            {!data.isCampusOperator && (
                <LeaderboardConsentCard
                    isOptedIn={data.preference.isOptedIn}
                    pending={pending}
                    savingPreference={savingPreference}
                    onPreference={onPreference}
                />
            )}

            <LeaderboardMethodGuide
                individual={individual}
                period={data.period}
            />

            <LeaderboardBadgeList badges={data.badges} />
        </aside>
    );
}

export { formatLeaderboardDate, LeaderboardNotice };
