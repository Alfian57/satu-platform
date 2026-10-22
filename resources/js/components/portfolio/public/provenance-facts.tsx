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

export function ProvenanceFacts({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <dl className="grid min-w-0 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">Sumber karya</dt>
                <dd className="font-semibold">Kontribusi disetujui</dd>
            </div>
            <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">
                    Tingkat verifikasi
                </dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">
                    {entry.verification_label}
                </dd>
            </div>
            <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">Diterbitkan</dt>
                <dd>
                    <time dateTime={entry.published_at ?? undefined}>
                        {formatDate(entry.published_at)}
                    </time>
                </dd>
            </div>
        </dl>
    );
}
