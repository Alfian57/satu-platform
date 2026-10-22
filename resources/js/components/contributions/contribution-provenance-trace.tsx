import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import {
    formatDate,
    portfolioOutcomeLabel,
    provenanceDecisionLabel,
} from '@/components/contributions/contribution-helpers';
import { show as portfolioShow } from '@/routes/portfolio';
import type { ContributionDetail } from '@/types/contribution';

export interface ContributionProvenanceTraceProps {
    provenance: ContributionDetail['provenance'];
}

export function ContributionProvenanceTrace({
    provenance,
}: ContributionProvenanceTraceProps) {
    return (
        <section
            aria-labelledby="contribution-provenance-title"
            className="grid min-w-0 gap-5 border-t border-border/70 px-1 pt-6"
            data-test="contribution-provenance-chain"
        >
            <div>
                <p className="text-xs font-semibold text-primary">
                    Jejak pekerjaan
                </p>
                <h2
                    id="contribution-provenance-title"
                    className="mt-1 text-title font-semibold"
                >
                    Dari pekerjaan ke portofolio
                </h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-6 text-muted-foreground">
                    Lihat hubungan antara tugas, versi catatan, keputusan
                    kampus, dan portofolio. Bukti privat tetap terlindungi.
                </p>
            </div>

            {provenance.timeline.length === 0 ? (
                <p className="text-sm leading-6 [overflow-wrap:anywhere] text-muted-foreground">
                    Belum ada jejak pekerjaan yang dapat ditampilkan.
                </p>
            ) : (
                <ol className="grid min-w-0 border-l-2 border-primary/20 pl-5">
                    {provenance.timeline.map((event) => (
                        <li
                            key={event.id}
                            className="relative grid min-w-0 gap-2 border-b border-border/70 py-5 first:pt-1 last:border-b-0"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute top-6 -left-6 size-2 rounded-full bg-primary ring-4 ring-background"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                    {event.label}
                                </p>
                                <time
                                    dateTime={event.occurred_at}
                                    className="text-xs text-muted-foreground"
                                >
                                    {formatDate(event.occurred_at)}
                                </time>
                            </div>
                            {event.task && (
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Tugas: {event.task.title}
                                    {event.version_number !== null
                                        ? `, versi ${event.version_number}`
                                        : ''}
                                </p>
                            )}
                            {event.decision && (
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {provenanceDecisionLabel(event.decision)}{' '}
                                    oleh{' '}
                                    {event.reviewer?.name ?? 'reviewer kampus'}
                                </p>
                            )}
                            {event.portfolio && (
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className="font-semibold [overflow-wrap:anywhere]">
                                        {event.portfolio.title}
                                    </span>
                                    <span className="max-w-full rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                        {portfolioOutcomeLabel(
                                            event.portfolio.status,
                                        )}
                                    </span>
                                    <Link
                                        href={portfolioShow(event.portfolio.id)}
                                        className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        data-test="contribution-portfolio-link"
                                    >
                                        Buka portofolio
                                        <ExternalLink
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Link>
                                </div>
                            )}
                        </li>
                    ))}
                </ol>
            )}

            {provenance.portfolio === null && (
                <p className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                    Catatan portofolio dibuat setelah kontribusi divalidasi oleh
                    kampus. Kamu tetap mengatur visibilitasnya secara terpisah.
                </p>
            )}
        </section>
    );
}
