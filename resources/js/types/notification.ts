export type NotificationCategory =
    'all' | 'project' | 'contribution' | 'invitation' | 'security';

export type NotificationItem = {
    id: string;
    type: string;
    read_at: string | null;
    read_status: 'read' | 'unread';
    created_at: string;
    message: string;
    action_url: string | null;
    action_label?: string;
    purpose: string | null;
    category: NotificationCategory;
    category_label: string;
    delivery_status?: 'queued' | 'sent' | 'failed' | null;
};

export type NotificationPreference = {
    purpose: string;
    label: string;
    enabled: boolean;
    mandatory: boolean;
};

export type NotificationCategoryOption = {
    key: NotificationCategory;
    label: string;
};

export type NotificationPageProps = {
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: NotificationCategoryOption[];
    preferences: NotificationPreference[];
    filter: 'all' | 'unread' | 'read';
    category: NotificationCategory;
    unreadCount: number;
};
