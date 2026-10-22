import { FileWarning } from 'lucide-react';
import { formatDate } from '@/components/contributions/contribution-helpers';
import type { ContributionVersion } from '@/types/contribution';

export interface ContributionVersionDetailProps {
    currentVersion: ContributionVersion | null;
}

export function ContributionVersionDetail({
    currentVersion,
}: ContributionVersionDetailProps) {
    return (
        <section
            aria-labelledby="contribution-current-title"
            className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7"
        >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Versi aktif
                    </p>
                    <h2
                        id="contribution-current-title"
                        className="mt-2 text-2xl leading-snug font-bold tracking-tight"
                    >
                        {currentVersion === null
                            ? 'Belum ada detail versi'
                            : `Versi ${currentVersion.version_number}`}
                    </h2>
                </div>
                {currentVersion && (
                    <time
                        dateTime={currentVersion.created_at}
                        className="text-sm text-muted-foreground"
                    >
                        {formatDate(currentVersion.created_at)}
                    </time>
                )}
            </div>
            {currentVersion === null ? (
                <div className="flex items-start gap-3 border-t border-border px-1 py-5 text-sm leading-6 text-muted-foreground md:px-3">
                    <FileWarning
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0"
                    />
                    <p>Draft belum memiliki versi yang dapat ditampilkan.</p>
                </div>
            ) : (
                <div className="grid min-w-0 gap-6 border-t border-border pt-5">
                    <div className="grid gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Tugas
                        </p>
                        <p className="text-base font-semibold [overflow-wrap:anywhere]">
                            {currentVersion.task.title}
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Judul kontribusi
                        </p>
                        <p className="text-base leading-7 [overflow-wrap:anywhere]">
                            {currentVersion.claim}
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Ringkasan karya yang dapat dibagikan
                        </p>
                        <p className="text-base leading-7 [overflow-wrap:anywhere] whitespace-pre-wrap">
                            {currentVersion.summary}
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Pernyataan pemilik (privat)
                        </p>
                        <p className="rounded-2xl bg-muted/40 p-4 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                            {currentVersion.declaration}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
