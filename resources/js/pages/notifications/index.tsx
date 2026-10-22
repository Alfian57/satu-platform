import { Head } from '@inertiajs/react';
import { CheckCheck, CircleAlert, Inbox } from 'lucide-react';
import { AppPage } from '@/components/app-page';
import { NotificationsContextRail } from '@/components/notifications/notifications-context-rail';
import { NotificationsEmptyState } from '@/components/notifications/notifications-empty-state';
import { NotificationsFilterNav } from '@/components/notifications/notifications-filter-nav';
import { NotificationsList } from '@/components/notifications/notifications-list';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';
import type { NotificationPageProps } from '@/types/notification';

export default function NotificationIndex({
    notifications,
    categories,
    preferences,
    filter,
    category,
    unreadCount,
}: NotificationPageProps) {
    const { state, actions } = useNotifications({
        filter,
        category,
        currentPage: notifications.current_page,
    });

    return (
        <>
            <Head title="Notifikasi" />
            <AppPage
                contextRail={
                    <NotificationsContextRail
                        unreadCount={unreadCount}
                        displayedCount={notifications.data.length}
                        preferences={preferences}
                        pendingPreference={state.pendingPreference}
                        onTogglePreference={actions.togglePreference}
                    />
                }
                contextRailLabel="Ringkasan dan preferensi notifikasi"
            >
                <div className="mx-auto grid max-w-5xl min-w-0 gap-7">
                    <header className="grid gap-4 border-b border-border pb-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 grid size-10 place-items-center border border-primary/30 bg-primary/10 text-primary">
                                    <Inbox
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </div>
                                <div>
                                    <p className="font-label text-label text-primary">
                                        LEDGER PENGIRIMAN
                                    </p>
                                    <h1 className="mt-1 text-headline font-bold">
                                        Notifikasi
                                    </h1>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 cursor-pointer"
                                disabled={
                                    unreadCount === 0 ||
                                    state.pendingAction === 'all'
                                }
                                onClick={actions.markAllRead}
                                data-test="notifications-mark-all"
                            >
                                <CheckCheck aria-hidden="true" />
                                Tandai yang tampil dibaca
                            </Button>
                        </div>
                        <p className="max-w-prose text-body text-muted-foreground">
                            Perubahan penting dari project, contribution, dan
                            keamanan tersusun sebagai history yang bisa
                            ditelusuri.
                        </p>
                    </header>

                    <div aria-live="polite" className="sr-only">
                        {state.feedback ??
                            (notifications.data.length > 0
                                ? `${notifications.data.length} notifikasi ditampilkan`
                                : 'Belum ada notifikasi')}
                    </div>

                    {state.error && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                            data-test="notifications-error"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{state.error}</p>
                        </div>
                    )}

                    <section
                        aria-labelledby="notification-list-title"
                        className="grid gap-4"
                    >
                        <NotificationsFilterNav
                            filter={filter}
                            category={category}
                            categories={categories}
                            onNavigate={actions.navigateTo}
                        />

                        {notifications.data.length === 0 ? (
                            <NotificationsEmptyState />
                        ) : (
                            <NotificationsList
                                notifications={notifications}
                                pendingAction={state.pendingAction}
                                onMarkRead={actions.markRead}
                                onLoadNextPage={actions.loadNextPage}
                            />
                        )}
                    </section>
                </div>
            </AppPage>
        </>
    );
}
