export const dashboardReferenceStates = [
    'revision',
    'first-run',
    'empty',
    'loading',
    'long-content',
    'partial-permission',
    'error',
    'stale',
] as const;

export type DashboardReferenceState = (typeof dashboardReferenceStates)[number];

export type DashboardStatusTone =
    'correction' | 'pending' | 'neutral' | 'verified';

export type DashboardFactIcon =
    'building' | 'calendar' | 'file' | 'profile' | 'user';

export type DashboardFactTone =
    'correction' | 'default' | 'muted' | 'pending' | 'verified';

export type DashboardDocketFact = {
    label: string;
    value: string;
    supportingValue?: string;
    icon?: DashboardFactIcon;
    tone?: DashboardFactTone;
    dateTime?: string;
};

export type DashboardNextAction = {
    reference: string;
    category: string;
    recordedAt: string;
    recordedAtIso: string;
    statusLabel: string;
    statusTone: DashboardStatusTone;
    title: string;
    facts: DashboardDocketFact[];
    primaryActionLabel?: string;
    secondaryActionLabel?: string;
};

export type DashboardDeadlineTone = 'correction' | 'neutral';

export type DashboardActiveProject = {
    index: string;
    name: string;
    nextTask: string;
    deadline: string;
    deadlineIso: string;
    deadlineTone: DashboardDeadlineTone;
};

export type DashboardProjectsRegion =
    | {
          state: 'ready';
          projects: DashboardActiveProject[];
          totalCount: number;
          remainingActionLabel?: string;
      }
    | {
          state: 'loading';
          announcement: string;
      }
    | {
          state: 'empty';
          title: string;
          description: string;
          actionLabel?: string;
      }
    | {
          state: 'error';
          title: string;
          description: string;
          actionLabel: string;
      };

export type DashboardReviewQueue = {
    count: number;
    itemLabel: string;
    statusLabel: string;
};

export type DashboardRecommendation = {
    title: string;
    role: string;
    reasons: string[];
    actionLabel: string;
};

export type DashboardRecommendationRegion =
    | {
          state: 'ready';
          recommendation: DashboardRecommendation;
      }
    | {
          state: 'loading';
          announcement: string;
      }
    | {
          state: 'empty';
          title: string;
          description: string;
          actionLabel?: string;
      }
    | {
          state: 'error';
          title: string;
          description: string;
          actionLabel: string;
      };

export type DashboardNotice = {
    tone: 'error' | 'pending' | 'stale';
    title: string;
    description: string;
    actionLabel?: string;
    timestamp?: string;
    timestampIso?: string;
};

export type DashboardReferenceScenario = {
    source: 'synthetic';
    state: DashboardReferenceState;
    syntheticLabel: string;
    notice?: DashboardNotice;
    nextAction: DashboardNextAction;
    projectsRegion: DashboardProjectsRegion;
    reviewQueue: DashboardReviewQueue;
    recommendationRegion: DashboardRecommendationRegion;
};
