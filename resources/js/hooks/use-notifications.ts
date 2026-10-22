import { router } from '@inertiajs/react';
import { useState } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import { categoryQuery } from '@/components/notifications/notification-helpers';
import { update as updatePreference } from '@/routes/notification-preferences';
import { index as notificationsIndex } from '@/routes/notifications';
import type {
    NotificationCategory,
    NotificationItem,
    NotificationPageProps,
    NotificationPreference,
} from '@/types/notification';

export function useNotifications({
    filter,
    category,
    currentPage,
}: {
    filter: NotificationPageProps['filter'];
    category: NotificationCategory;
    currentPage: number;
}) {
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
                page: currentPage + 1,
            },
            { preserveScroll: true, replace: true },
        );
    }

    return {
        state: {
            pendingAction,
            pendingPreference,
            feedback,
            error,
        },
        actions: {
            navigateTo,
            markRead,
            markAllRead,
            togglePreference,
            loadNextPage,
            setError,
            setFeedback,
        },
    };
}
