import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const purposeLabels: Record<string, string> = {
    'registration.terms': 'Ketentuan Layanan Registrasi',
    registration_terms: 'Ketentuan Layanan Registrasi',
    'opportunity.support': 'Dukungan Peluang Kolaborasi',
};

function formatConsentPurpose(purpose: string): string {
    if (purposeLabels[purpose]) {
        return purposeLabels[purpose];
    }

    return purpose
        .split(/[._-]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function ConsentHistoryCard({ consents }: ConsentHistoryCardProps) {
    return (
        <section
            aria-labelledby="data-rights-heading"
            className="grid min-w-0 gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
        >
            <header className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-satu-orange-border bg-satu-orange-soft text-satu-orange-ink sm:size-10">
                    <Shield aria-hidden="true" className="size-4 sm:size-5" />
                </span>
                <h2
                    id="data-rights-heading"
                    className="text-sm leading-snug font-semibold text-foreground sm:text-base"
                >
                    Hak Data dan Privasi
                </h2>
            </header>
            <div className="border-t border-border/70 pt-3.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Riwayat persetujuan
                </h3>
                {consents.length === 0 ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Belum ada riwayat persetujuan tercatat. Riwayat akan
                        tampil di sini setelah ada tindakan yang tercatat.
                    </p>
                ) : (
                    <ul className="mt-1 divide-y divide-border/60">
                        {consents.map((consent, index) => (
                            <li
                                key={
                                    consent.purpose +
                                    consent.occurred_at +
                                    index
                                }
                                className="flex min-w-0 flex-col justify-between gap-2 py-2.5 sm:flex-row sm:items-center sm:py-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold [overflow-wrap:anywhere] text-foreground">
                                        {formatConsentPurpose(consent.purpose)}
                                    </p>
                                    <p className="mt-0.5 text-xs [overflow-wrap:anywhere] text-muted-foreground">
                                        Versi kebijakan:{' '}
                                        {consent.policy_version}.{' '}
                                        {new Date(
                                            consent.occurred_at,
                                        ).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'w-fit shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                        consent.granted_at
                                            ? 'border-verified/25 bg-verified-subtle text-verified-subtle-foreground'
                                            : 'border-destructive/20 bg-destructive/10 text-destructive dark:text-destructive-foreground',
                                    )}
                                >
                                    {consent.granted_at
                                        ? 'Persetujuan dicatat'
                                        : 'Pencabutan dicatat'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
