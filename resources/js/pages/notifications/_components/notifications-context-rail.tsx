import { Bell, LockKeyhole, MessageCircle } from 'lucide-react';
import type { NotificationPreference } from '@/types/notification';
import { NotificationPreferenceRow } from './notification-preference-row';

export function NotificationsContextRail({
    unreadCount,
    displayedCount,
    preferences,
    pendingPreference,
    onTogglePreference,
}: {
    unreadCount: number;
    displayedCount: number;
    preferences: NotificationPreference[];
    pendingPreference: string | null;
    onTogglePreference: (preference: NotificationPreference) => void;
}) {
    return (
        <div className="grid gap-8">
            <section
                aria-labelledby="notification-summary-title"
                className="grid gap-4"
            >
                <div className="flex items-center gap-2">
                    <Bell aria-hidden="true" className="size-4 text-primary" />
                    <h2
                        id="notification-summary-title"
                        className="font-semibold"
                    >
                        Ringkasan inbox
                    </h2>
                </div>
                <dl className="grid gap-3 border-y border-border py-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Belum dibaca</dt>
                        <dd className="font-label text-label font-semibold">
                            {unreadCount}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Ditampilkan</dt>
                        <dd className="font-label text-label font-semibold">
                            {displayedCount}
                        </dd>
                    </div>
                </dl>
                <p className="text-sm leading-6 text-muted-foreground">
                    Pusat notifikasi adalah riwayat kanonik. WhatsApp hanya
                    menjadi channel tambahan sesuai tujuan.
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
                    Pilih purpose yang boleh dikirim melalui WhatsApp. Token
                    provider dan payload mentah tidak ditampilkan di sini.
                </p>
                <div className="grid border-y border-border">
                    {preferences.map((preference) => (
                        <NotificationPreferenceRow
                            key={preference.purpose}
                            preference={preference}
                            pendingPreference={pendingPreference}
                            onToggle={onTogglePreference}
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
                    Detail private dan inclusion tidak pernah masuk ke
                    notifikasi publik.
                </p>
            </div>
        </div>
    );
}
