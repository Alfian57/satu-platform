import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCheck,
    ChevronRight,
    CircleAlert,
    ExternalLink,
    Inbox,
    LockKeyhole,
    MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { update as updatePreference } from '@/routes/notification-preferences';
import { index as notificationsIndex } from '@/routes/notifications';
import type {
    NotificationCategory,
    NotificationItem,
    NotificationPageProps,
    NotificationPreference,
} from '@/types/notification';

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function deliveryLabel(
    status: NotificationItem['delivery_status'],
): string | null {
    if (status === null || status === undefined) {
        return null;
    }

    return {
        queued: 'WhatsApp menunggu antrean',
        sent: 'WhatsApp terkirim',
        failed: 'WhatsApp gagal dikirim',
    }[status];
}

function notificationFilterLabel(
    filter: NotificationPageProps['filter'],
): string {
    return {
        all: 'Semua status',
        unread: 'Belum dibaca',
        read: 'Sudah dibaca',
    }[filter];
}

function categoryQuery(category: NotificationCategory): string | undefined {
    return category === 'all' ? undefined : category;
}

function NotificationRow({
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

function PreferenceRow({
    preference,
    pendingPreference,
    onToggle,
}: {
    preference: NotificationPreference;
    pendingPreference: string | null;
    onToggle: (preference: NotificationPreference) => void;
}) {
    const isPending = pendingPreference === preference.purpose;

    return (
        <label className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0">
            <span className="grid gap-1">
                <span className="text-sm font-semibold">
                    {preference.label}
                </span>
                <span className="text-xs leading-5 text-muted-foreground">
                    {preference.mandatory
                        ? 'Tetap aktif untuk menjaga keamanan akun.'
                        : 'Gunakan WhatsApp sesuai preferensi kamu.'}
                </span>
            </span>
            <input
                type="checkbox"
                checked={preference.enabled}
                disabled={preference.mandatory || isPending}
                onChange={() => onToggle(preference)}
                className="mt-1 size-5 cursor-pointer accent-primary disabled:cursor-not-allowed"
                aria-label={`${preference.label}: WhatsApp`}
                data-test={`notification-preference-${preference.purpose}`}
            />
        </label>
    );
}

export default function NotificationIndex({
    notifications,
    categories,
    preferences,
    filter,
    category,
    unreadCount,
}: NotificationPageProps) {
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [pendingPreference, setPendingPreference] = useState<string | null>(
        null,
    );
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function navigateTo(
        categoryValue: NotificationCategory,
        filterValue = filter,
    ): void {
        setError(null);
        router.get(
            notificationsIndex(),
            {
                category: categoryQuery(categoryValue),
                filter: filterValue === 'all' ? undefined : filterValue,
            },
            { preserveScroll: true, replace: true },
        );
    }

    function markRead(notification: NotificationItem): void {
        setPendingAction(notification.id);
        setError(null);
        setFeedback(null);
        router.post(
            NotificationController.markRead(notification.id).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setFeedback('Notifikasi sudah ditandai dibaca.'),
                onError: () =>
                    setError(
                        'Notifikasi belum berubah. Periksa koneksi lalu coba lagi.',
                    ),
                onFinish: () => setPendingAction(null),
            },
        );
    }

    function markAllRead(): void {
        setPendingAction('all');
        setError(null);
        setFeedback(null);
        router.post(
            NotificationController.markAllRead().url,
            { category: categoryQuery(category) },
            {
                preserveScroll: true,
                onSuccess: () =>
                    setFeedback(
                        'Notifikasi yang tampil sudah ditandai dibaca.',
                    ),
                onError: () =>
                    setError(
                        'Notifikasi belum berubah. Periksa koneksi lalu coba lagi.',
                    ),
                onFinish: () => setPendingAction(null),
            },
        );
    }

    function togglePreference(preference: NotificationPreference): void {
        setPendingPreference(preference.purpose);
        setError(null);
        setFeedback(null);
        router.post(
            updatePreference().url,
            {
                purpose: preference.purpose,
                channel: 'whatsapp',
                enabled: !preference.enabled,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    setFeedback('Preferensi WhatsApp sudah tersimpan.'),
                onError: () =>
                    setError(
                        'Preferensi belum tersimpan. Coba lagi dalam beberapa saat.',
                    ),
                onFinish: () => setPendingPreference(null),
            },
        );
    }

    function loadNextPage(): void {
        router.get(
            notificationsIndex(),
            {
                category: categoryQuery(category),
                filter: filter === 'all' ? undefined : filter,
                page: notifications.current_page + 1,
            },
            { preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Notifikasi" />
            <AppPage
                contextRail={
                    <div className="grid gap-8">
                        <section
                            aria-labelledby="notification-summary-title"
                            className="grid gap-4"
                        >
                            <div className="flex items-center gap-2">
                                <Bell
                                    aria-hidden="true"
                                    className="size-4 text-primary"
                                />
                                <h2
                                    id="notification-summary-title"
                                    className="font-semibold"
                                >
                                    Ringkasan inbox
                                </h2>
                            </div>
                            <dl className="grid gap-3 border-y border-border py-4 text-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Belum dibaca
                                    </dt>
                                    <dd className="font-label text-label font-semibold">
                                        {unreadCount}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-muted-foreground">
                                        Ditampilkan
                                    </dt>
                                    <dd className="font-label text-label font-semibold">
                                        {notifications.data.length}
                                    </dd>
                                </div>
                            </dl>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Pusat notifikasi adalah riwayat kanonik.
                                WhatsApp hanya menjadi channel tambahan sesuai
                                tujuan.
                            </p>
                        </section>

                        <section
                            aria-labelledby="notification-preference-title"
                            className="grid gap-3 border-t border-border pt-6"
                        >
                            <div className="flex items-center gap-2">
                                <MessageCircle
                                    aria-hidden="true"
                                    className="size-4 text-primary"
                                />
                                <h2
                                    id="notification-preference-title"
                                    className="font-semibold"
                                >
                                    WhatsApp
                                </h2>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Pilih purpose yang boleh dikirim melalui
                                WhatsApp. Token provider dan payload mentah
                                tidak ditampilkan di sini.
                            </p>
                            <div className="grid border-y border-border">
                                {preferences.map((preference) => (
                                    <PreferenceRow
                                        key={preference.purpose}
                                        preference={preference}
                                        pendingPreference={pendingPreference}
                                        onToggle={togglePreference}
                                    />
                                ))}
                            </div>
                        </section>

                        <div className="flex items-start gap-2 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <p>
                                Detail private dan inclusion tidak pernah masuk
                                ke notifikasi publik.
                            </p>
                        </div>
                    </div>
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
                                    unreadCount === 0 || pendingAction === 'all'
                                }
                                onClick={markAllRead}
                                data-test="notifications-mark-all"
                            >
                                <CheckCheck aria-hidden="true" />
                                Tandai yang tampil dibaca
                            </Button>
                        </div>
                        <p className="max-w-[70ch] text-body text-muted-foreground">
                            Perubahan penting dari project, contribution, dan
                            keamanan tersusun sebagai history yang bisa
                            ditelusuri.
                        </p>
                    </header>

                    <div aria-live="polite" className="sr-only">
                        {feedback ??
                            (notifications.data.length > 0
                                ? `${notifications.data.length} notifikasi ditampilkan`
                                : 'Belum ada notifikasi')}
                    </div>
                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                            data-test="notifications-error"
                        >
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0"
                            />
                            <p>{error}</p>
                        </div>
                    )}

                    <section
                        aria-labelledby="notification-list-title"
                        className="grid gap-4"
                    >
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
                                            navigateTo(
                                                category,
                                                event.target
                                                    .value as NotificationPageProps['filter'],
                                            )
                                        }
                                        className="h-control-md cursor-pointer rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        data-test="notifications-status-filter"
                                    >
                                        <option value="all">
                                            Semua status
                                        </option>
                                        <option value="unread">
                                            Belum dibaca
                                        </option>
                                        <option value="read">
                                            Sudah dibaca
                                        </option>
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
                                        onClick={() => navigateTo(item.key)}
                                        className={cn(
                                            'min-h-11 shrink-0 cursor-pointer border-b-2 px-3 text-sm font-semibold transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring motion-reduce:transition-none',
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

                        {notifications.data.length === 0 ? (
                            <div
                                className="grid justify-items-center gap-3 border-y border-border px-6 py-16 text-center"
                                data-test="notifications-empty"
                            >
                                <Inbox
                                    aria-hidden="true"
                                    className="size-8 text-muted-foreground"
                                />
                                <h3 className="text-title font-semibold">
                                    Belum ada notifikasi
                                </h3>
                                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                                    Perubahan penting akan muncul di sini
                                    setelah ada aktivitas yang memerlukan
                                    perhatian kamu.
                                </p>
                            </div>
                        ) : (
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
                                            onMarkRead={markRead}
                                        />
                                    ))}
                                </ul>
                                {notifications.last_page >
                                    notifications.current_page && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="mx-auto my-4 min-h-11 cursor-pointer"
                                        onClick={loadNextPage}
                                        data-test="notifications-load-more"
                                    >
                                        Muat halaman berikutnya
                                        <ChevronRight aria-hidden="true" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </AppPage>
        </>
    );
}
