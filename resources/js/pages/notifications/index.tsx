import { Head } from '@inertiajs/react';

interface Notification {
    id: string;
    type: string;
    read_at: string | null;
    created_at: string;
    message: string;
    action_url: string | null;
    purpose: string | null;
    delivery_status?: string;
}

interface Props {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    preferences: Record<string, Record<string, { enabled: boolean }>>;
    filter: string;
    unreadCount: number;
}

export default function NotificationIndex({
    notifications,
    unreadCount,
}: Props) {
    return (
        <>
            <Head title="Notifikasi" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-semibold">Notifikasi</h1>
                <p className="mb-4 text-sm text-muted-foreground">
                    {unreadCount} belum dibaca
                </p>
                {notifications.data.length === 0 ? (
                    <p className="text-muted-foreground">
                        Belum ada notifikasi.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {notifications.data.map((n) => (
                            <li
                                key={n.id}
                                className="rounded border p-4 text-sm"
                            >
                                <p>{n.message}</p>
                                <span className="text-xs text-muted-foreground">
                                    {n.read_at ? 'Dibaca' : 'Belum dibaca'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
