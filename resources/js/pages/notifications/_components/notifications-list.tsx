import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
    NotificationItem,
    NotificationPageProps,
} from '@/types/notification';
import { NotificationRow } from './notification-row';

export function NotificationsList({
    notifications,
    pendingAction,
    onMarkRead,
    onLoadNextPage,
}: {
    notifications: NotificationPageProps['notifications'];
    pendingAction: string | null;
    onMarkRead: (notification: NotificationItem) => void;
    onLoadNextPage: () => void;
}) {
    return (
        <div
            className="grid border-y border-border"
            data-test="notifications-list"
        >
            <ul>
                {notifications.data.map((notification) => (
                    <NotificationRow
                        key={notification.id}
                        notification={notification}
                        pendingAction={pendingAction}
                        onMarkRead={onMarkRead}
                    />
                ))}
            </ul>
            {notifications.last_page > notifications.current_page && (
                <Button
                    type="button"
                    variant="ghost"
                    className="mx-auto my-4 min-h-11 cursor-pointer"
                    onClick={onLoadNextPage}
                    data-test="notifications-load-more"
                >
                    Muat halaman berikutnya
                    <ChevronRight aria-hidden="true" />
                </Button>
            )}
        </div>
    );
}
