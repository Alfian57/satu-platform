import type { NotificationPreference } from '@/types/notification';

export function NotificationPreferenceRow({
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
