import { History } from 'lucide-react';
import { formatDate } from '@/components/contributions/contribution-helpers';
import type { ContributionDetail } from '@/types/contribution';

export interface ContributionVersionHistoryProps {
    versions: ContributionDetail['versions'];
}

export function ContributionVersionHistory({
    versions,
}: ContributionVersionHistoryProps) {
    return (
        <section
            aria-labelledby="contribution-history-title"
            className="grid min-w-0 gap-5 border-t border-border/70 px-1 pt-6"
        >
            <div>
                <p className="text-xs font-semibold text-primary">
                    Riwayat catatan
                </p>
                <h2
                    id="contribution-history-title"
                    className="mt-1 text-title font-semibold"
                >
                    Versi tersimpan
                </h2>
            </div>
            {versions.length === 0 && (
                <p className="rounded-2xl bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                    Belum ada versi catatan yang tersimpan.
                </p>
            )}
            <ol
                className="grid min-w-0 gap-3"
                data-test="contribution-version-history"
            >
                {versions
                    .slice()
                    .reverse()
                    .map((version) => (
                        <li
                            key={version.id}
                            className="grid min-w-0 gap-3 border-b border-border/70 py-4 last:border-b-0 lg:grid-cols-[6rem_minmax(0,1fr)]"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <History
                                    aria-hidden="true"
                                    className="size-4 text-primary"
                                />
                                Versi {version.version_number}
                            </div>
                            <p className="min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">
                                {version.claim}
                            </p>
                            <time
                                dateTime={version.created_at}
                                className="text-xs text-muted-foreground lg:col-start-2"
                            >
                                {formatDate(version.created_at)}
                            </time>
                        </li>
                    ))}
            </ol>
        </section>
    );
}
