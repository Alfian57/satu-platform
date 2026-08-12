export type DashboardActionKey =
    'onboarding' | 'projects' | 'project' | 'refresh';

export type DashboardAction = {
    key: DashboardActionKey;
    label: string;
    projectId?: number;
};

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
    primaryAction: DashboardAction | null;
    secondaryAction: DashboardAction | null;
};

export type DashboardDeadlineTone = 'correction' | 'neutral';

export type DashboardActiveProject = {
    id: number;
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
          remainingActionLabel?: string | null;
      }
    | {
          state: 'loading';
          announcement: string;
      }
    | {
          state: 'empty' | 'error' | 'forbidden';
          title: string;
          description: string;
          action?: DashboardAction | null;
      };

export type DashboardReviewQueue = {
    state: 'unavailable';
    title: string;
    description: string;
};

export type DashboardRecommendation = {
    id: number;
    projectId: number | null;
    title: string;
    role: string;
    reasons: string[];
    scoreVersion: string | null;
    isStale: boolean;
    createdAt: string;
    expiresAt: string | null;
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
          state: 'empty' | 'error' | 'forbidden';
          title: string;
          description: string;
          action?: DashboardAction | null;
      };

export type DashboardNotice = {
    tone: 'error' | 'pending' | 'stale';
    title: string;
    description: string;
    action?: DashboardAction | null;
    timestamp?: string;
    timestampIso?: string;
};

export type DashboardProfileReadiness = {
    state: 'unavailable' | 'missing' | 'incomplete' | 'ready';
    profileId: number | null;
    skillsCount: number;
    availabilityCount: number;
};

export type DashboardInstitution = {
    id: number;
    name: string;
};

export type DashboardPageProps = {
    auth: {
        user: {
            id: number;
            name: string;
        } | null;
    };
    institution: DashboardInstitution | null;
    profileReadiness: DashboardProfileReadiness;
    nextAction: DashboardNextAction;
    reviewQueue: DashboardReviewQueue;
    dashboardNotice: DashboardNotice | null;
    refreshedAt: string;
    activeProjects?: DashboardProjectsRegion;
    recommendations?: DashboardRecommendationRegion;
};
