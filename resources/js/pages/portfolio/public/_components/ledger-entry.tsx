import { VerificationMark } from '@/pages/portfolio/public/_components/verification-mark';
import type { PublicPortfolioEntry } from '@/types/portfolio';

function formatDate(value: string | null): string {
    if (value === null) {
        return 'Tanggal tidak tersedia';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Tanggal tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeZone: 'UTC',
    }).format(date);
}

export function LedgerEntry({
    entry,
    index,
}: {
    entry: PublicPortfolioEntry;
    index: number;
}) {
    return (
        <li
            className="grid min-w-0 content-start gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"
            data-test={'public-entry-' + entry.id}
        >
            <span className="font-label text-label text-muted-foreground">
                {String(index).padStart(2, '0')}
            </span>
            <div className="grid min-w-0 gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold [overflow-wrap:anywhere] text-primary">
                        Karya publik
                    </span>
                    <VerificationMark entry={entry} />
                </div>
                <h3 className="text-xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
                    {entry.title}
                </h3>
                <p className="text-sm leading-7 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                    {entry.summary}
                </p>
            </div>
            <div className="grid min-w-0 gap-2 border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground">Sumber karya</span>
                <span className="font-semibold">Kontribusi disetujui</span>
                <time
                    dateTime={entry.published_at ?? undefined}
                    className="text-muted-foreground"
                >
                    {formatDate(entry.published_at)}
                </time>
            </div>
        </li>
    );
}
