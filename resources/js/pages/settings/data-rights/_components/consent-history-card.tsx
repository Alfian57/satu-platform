import { Shield } from 'lucide-react';
import { SettingsCardHeading } from '@/pages/settings/_components/settings-panel';

export interface ConsentItem {
    purpose: string;
    policy_version: string;
    granted_at: string | null;
    withdrawn_at: string | null;
    occurred_at: string;
}

export interface ConsentHistoryCardProps {
    consents: ConsentItem[];
}

export function ConsentHistoryCard({ consents }: ConsentHistoryCardProps) {
    return (
        <section
            aria-labelledby="data-rights-heading"
            className="grid min-w-0 gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
            <SettingsCardHeading
                id="data-rights-heading"
                icon={Shield}
                title="Hak Data dan Privasi"
                description="Unduh arsip dan ajukan kendali data pribadi. Riwayat persetujuan dibedakan dari status pemenuhan permintaan."
            />
            <h3 className="text-base font-semibold">Riwayat persetujuan</h3>
            {consents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Belum ada riwayat persetujuan tercatat. Riwayat akan tampil
                    di sini setelah ada tindakan yang tercatat.
                </p>
            ) : (
                <ul className="divide-y divide-border">
                    {consents.map((consent, index) => (
                        <li
                            key={consent.purpose + consent.occurred_at + index}
                            className="flex min-w-0 flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-semibold wrap-anywhere">
                                    {consent.purpose}
                                </p>
                                <p className="mt-1 text-xs leading-5 wrap-anywhere text-muted-foreground">
                                    Versi kebijakan: {consent.policy_version}.{' '}
                                    {new Date(
                                        consent.occurred_at,
                                    ).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                            <span className="w-fit shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold">
                                {consent.granted_at
                                    ? 'Persetujuan dicatat'
                                    : 'Pencabutan dicatat'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
