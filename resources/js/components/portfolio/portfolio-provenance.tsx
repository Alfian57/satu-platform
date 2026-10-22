import { History, ShieldCheck } from 'lucide-react';
import {
    formatPortfolioDate,
    portfolioVisibilityLabel,
} from '@/components/portfolio/portfolio-presentation';
import { PortfolioVerificationBadge } from '@/components/portfolio/portfolio-verification-badge';
import type { PortfolioEntry } from '@/types/portfolio';

function sourceStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
        draft: 'Draft',
        pending: 'Menunggu validasi',
        revision: 'Perlu diperbaiki',
        approved: 'Tervalidasi',
        rejected: 'Ditolak',
        archived: 'Diarsipkan',
    };

    return status === null
        ? 'Tidak tersedia'
        : (labels[status] ?? 'Tidak tersedia');
}

export function PortfolioProvenance({ entry }: { entry: PortfolioEntry }) {
    const facts = [
        {
            label: 'Kontribusi sumber',
            value: 'Kontribusi #' + entry.source.contribution_id,
        },
        {
            label: 'Versi sumber',
            value:
                entry.source.version_number === null
                    ? 'Tidak tersedia'
                    : 'Versi ' + entry.source.version_number,
        },
        {
            label: 'Status sumber',
            value: sourceStatusLabel(entry.source.status),
        },
        {
            label: 'Jangkauan karya',
            value: portfolioVisibilityLabel(entry.visibility),
        },
        {
            label: 'Diterbitkan',
            value: formatPortfolioDate(entry.published_at),
        },
        {
            label: 'Pembaruan terakhir',
            value: formatPortfolioDate(entry.updated_at),
        },
    ];

    return (
        <section
            aria-labelledby="portfolio-provenance-title"
            className="grid min-w-0 gap-5 border-t border-border px-1 pt-6"
            data-test="portfolio-provenance"
        >
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <History aria-hidden="true" className="size-5" />
                </span>
                <div className="grid gap-1">
                    <h2
                        id="portfolio-provenance-title"
                        className="text-title font-semibold"
                    >
                        Jejak di balik karya.
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Karya tetap terhubung ke versi kontribusi yang menjadi
                        sumbernya.
                    </p>
                </div>
            </div>
            <PortfolioVerificationBadge entry={entry} />
            <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                    <div
                        key={fact.label}
                        className="grid min-w-0 gap-2 border-t border-border/70 pt-4"
                    >
                        <dt className="text-xs text-muted-foreground">
                            {fact.label}
                        </dt>
                        <dd className="text-sm font-semibold [overflow-wrap:anywhere]">
                            {fact.value}
                        </dd>
                    </div>
                ))}
            </dl>
            {entry.withdrawn_at && (
                <p className="rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                    Karya ditarik pada{' '}
                    <time dateTime={entry.withdrawn_at}>
                        {formatPortfolioDate(entry.withdrawn_at)}
                    </time>
                    . Periksa pengaturan jangkauan sebelum membagikannya
                    kembali.
                </p>
            )}
            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                />
                Verifikasi dan jangkauan adalah dua hal berbeda. Bukti privat
                dan catatan kampus tidak ikut dibagikan.
            </p>
        </section>
    );
}
