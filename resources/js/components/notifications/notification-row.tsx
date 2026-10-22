import { Link } from '@inertiajs/react';
import { Check, CircleAlert, ExternalLink } from 'lucide-react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types/notification';
import { deliveryLabel, formatDate } from './notification-helpers';

export function NotificationRow({
    notification,
    pendingAction,
    onMarkRead,
}: {
    notification: NotificationItem;
    pendingAction: string | null;
    onMarkRead: (notification: NotificationItem) => void;
}) {
    const isUnread = notification.read_status === 'unread';
    const delivery = deliveryLabel(notification.delivery_status);

    return (
        <li
            className={cn(
                'grid gap-4 border-b border-border px-1 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-3',
                isUnread && 'bg-pending-subtle/35',
            )}
            data-read-state={notification.read_status}
            data-test={`notification-row-${notification.id}`}
        >
            <div className="flex min-w-0 items-start gap-3">
                <span
                    aria-hidden="true"
                    className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        isUnread ? 'bg-pending' : 'bg-border',
                    )}
                />
                <div className="grid min-w-0 gap-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-label text-label text-primary">
                            {notification.category_label}
                        </p>
                        <span className="text-xs text-muted-foreground">
                            {isUnread ? 'Belum dibaca' : 'Sudah dibaca'}
                        </span>
                    </div>
                    <p className="text-base leading-7 break-words">
                        {notification.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <time dateTime={notification.created_at}>
                            {formatDate(notification.created_at)}
                        </time>
                        {delivery && <span>{delivery}</span>}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {notification.action_url ? (
                    <Link
                        href={
                            NotificationController.navigate(notification.id).url
                        }
                        className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-primary underline-offset-4 hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        data-test={`notification-action-${notification.id}`}
                    >
                        {notification.action_label ?? 'Buka detail'}
                        <ExternalLink aria-hidden="true" className="size-4" />
                    </Link>
                ) : (
                    <span className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-muted-foreground">
                        <CircleAlert aria-hidden="true" className="size-4" />
                        Tidak tersedia
                    </span>
                )}
                {isUnread && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11 cursor-pointer"
                        disabled={pendingAction === notification.id}
                        onClick={() => onMarkRead(notification)}
                        data-test={`notification-mark-read-${notification.id}`}
                    >
                        <Check aria-hidden="true" />
                        Tandai dibaca
                    </Button>
                )}
            </div>
        </li>
    );
}
