import { cn } from '@/lib/utils';
import type {
    NotificationCategory,
    NotificationCategoryOption,
    NotificationPageProps,
} from '@/types/notification';
import { notificationFilterLabel } from './notification-helpers';

export function NotificationsFilterNav({
    filter,
    category,
    categories,
    onNavigate,
}: {
    filter: NotificationPageProps['filter'];
    category: NotificationCategory;
    categories: NotificationCategoryOption[];
    onNavigate: (
        cat: NotificationCategory,
        flt?: NotificationPageProps['filter'],
    ) => void;
}) {
    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="font-label text-label text-muted-foreground">
                        {notificationFilterLabel(filter)}
                    </p>
                    <h2
                        id="notification-list-title"
                        className="mt-1 text-title font-semibold"
                    >
                        Jejak terbaru
                    </h2>
                </div>
                <label className="grid gap-1 text-sm">
                    <span className="text-xs text-muted-foreground">
                        Status
                    </span>
                    <select
                        value={filter}
                        onChange={(event) =>
                            onNavigate(
                                category,
                                event.target
                                    .value as NotificationPageProps['filter'],
                            )
                        }
                        className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        data-test="notifications-status-filter"
                    >
                        <option value="all">Semua status</option>
                        <option value="unread">Belum dibaca</option>
                        <option value="read">Sudah dibaca</option>
                    </select>
                </label>
            </div>

            <nav
                aria-label="Kategori notifikasi"
                className="-mx-1 flex min-w-0 gap-1 overflow-x-auto border-b border-border px-1"
                data-test="notifications-category-filter"
            >
                {categories.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        aria-pressed={category === item.key}
                        onClick={() => onNavigate(item.key)}
                        className={cn(
                            'min-h-11 shrink-0 cursor-pointer border-b-2 px-3 text-sm font-semibold transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
                            category === item.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                        )}
                        data-test={`notifications-category-${item.key}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
