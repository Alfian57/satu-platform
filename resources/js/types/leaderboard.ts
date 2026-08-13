import type { Auth } from './auth';

export type LeaderboardScope = 'program' | 'team' | 'individual';

export type LeaderboardScopeOption = {
    value: LeaderboardScope;
    label: string;
    description: string;
};

export type LeaderboardSemester = {
    value: string;
    label: string;
};

export type LeaderboardInstitution = {
    id: number;
    name: string;
};

export type LeaderboardPeriod = {
    computedAt: string | null;
    isStale: boolean;
    ruleVersion: string;
};

export type LeaderboardPreference = {
    isOptedIn: boolean;
    version: number;
};

export type LeaderboardBadge = {
    id: number;
    name: string;
    description: string;
    category: string;
    level: number;
    sourceLabel: string;
    sourceVersion: number | null;
    ruleVersion: number;
    awardedAt: string;
};

export type LeaderboardPageData = {
    state: 'ready' | 'forbidden';
    institution: LeaderboardInstitution | null;
    semester: string;
    semesters: LeaderboardSemester[];
    scope: LeaderboardScope;
    scopes: LeaderboardScopeOption[];
    period: LeaderboardPeriod | null;
    preference: LeaderboardPreference;
    badges: LeaderboardBadge[];
    isCampusOperator: boolean;
};

export type LeaderboardRow = {
    scopeType: LeaderboardScope;
    scopeKey: string;
    scopeLabel: string | null;
    rank: number | null;
    sharedRankGroup: number | null;
    score: string;
    verifiedXpTotal: number;
    activeMemberDenominator: number;
    cohortSize: number;
    suppressed: boolean;
    suppressionReason: string | null;
};

export type LeaderboardPagination = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
};

export type LeaderboardRowsRegion = {
    state: 'ready' | 'empty' | 'forbidden';
    rows: LeaderboardRow[];
    pagination: LeaderboardPagination;
    emptyReason?: 'no_verified_xp' | 'opt_in_required';
};

export type LeaderboardPageProps = {
    auth: Auth;
    leaderboard: LeaderboardPageData;
    leaderboardRows?: LeaderboardRowsRegion;
};
