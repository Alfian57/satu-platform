import type {
    NotificationCategory,
    NotificationItem,
    NotificationPageProps,
} from '@/types/notification';

export function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function deliveryLabel(
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

export function notificationFilterLabel(
    filter: NotificationPageProps['filter'],
): string {
    return {
        all: 'Semua status',
        unread: 'Belum dibaca',
        read: 'Sudah dibaca',
    }[filter];
}

export function categoryQuery(
    category: NotificationCategory,
): string | undefined {
    return category === 'all' ? undefined : category;
}
