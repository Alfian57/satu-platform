import { History } from 'lucide-react';
import { formatDate } from '@/components/campus/contributions/contribution-types';
import type { ContributionReviewQueueItem } from '@/components/campus/contributions/contribution-types';

interface ContributionProvenanceContextProps {
    version: ContributionReviewQueueItem['current_version'];
    updatedAt: string;
}

export function ContributionProvenanceContext({
    version,
    updatedAt,
}: ContributionProvenanceContextProps) {
    return (
        <section
            aria-labelledby="contribution-provenance-title"
            className="space-y-2"
        >
            <div className="flex items-center gap-2">
                <History aria-hidden="true" className="size-4 text-primary" />
                <h3
                    id="contribution-provenance-title"
                    className="text-sm font-semibold text-foreground"
                >
                    Konteks versi
                </h3>
            </div>
            <dl className="space-y-1.5 rounded-xl border border-border bg-accent/35 p-3 text-xs">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <dt className="text-muted-foreground">Tugas</dt>
                    <dd className="font-semibold wrap-anywhere text-foreground">
                        {version?.task?.title ?? 'Belum ada tugas'}
                    </dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Versi Aktif</dt>
                    <dd className="font-semibold wrap-anywhere text-foreground">
                        {version === null || version === undefined
                            ? 'Belum tersedia'
                            : `Versi ${version.version_number}`}
                    </dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Diperbarui</dt>
                    <dd className="text-foreground">{formatDate(updatedAt)}</dd>
                </div>
            </dl>
        </section>
    );
}
