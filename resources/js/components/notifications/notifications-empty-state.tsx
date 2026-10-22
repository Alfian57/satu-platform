import { Inbox } from 'lucide-react';

export function NotificationsEmptyState() {
    return (
        <div
            className="grid justify-items-center gap-3 border-y border-border px-6 py-16 text-center"
            data-test="notifications-empty"
        >
            <Inbox
                aria-hidden="true"
                className="size-8 text-muted-foreground"
            />
            <h3 className="text-title font-semibold">Belum ada notifikasi</h3>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Perubahan penting akan muncul di sini setelah ada aktivitas yang
                memerlukan perhatian kamu.
            </p>
        </div>
    );
}
