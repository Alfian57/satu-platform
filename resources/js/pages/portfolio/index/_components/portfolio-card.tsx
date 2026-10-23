import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CalendarDays,
    ChevronDown,
    Eye,
    SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    formatPortfolioDate,
    portfolioVisibilityLabel,
} from '@/pages/portfolio/_utils/portfolio-presentation';
import { PortfolioEntryVisibilityControl } from '@/pages/portfolio/show/_components/portfolio-entry-visibility-control';
import { PortfolioStatusBadge } from '@/pages/portfolio/show/_components/portfolio-status-badge';
import { PortfolioVerificationBadge } from '@/pages/portfolio/show/_components/portfolio-verification-badge';
import { show as portfolioShow } from '@/routes/portfolio';
import type { PortfolioEntry } from '@/types/portfolio';

export interface PortfolioCardProps {
    entry: PortfolioEntry;
    profileId: number;
    canManage: boolean;
    onUpdated: (entry: PortfolioEntry) => void;
    onAccessRevoked: () => void;
}

export function PortfolioCard({
    entry,
    profileId,
    canManage,
    onUpdated,
    onAccessRevoked,
}: PortfolioCardProps) {
    return (
        <li
            className="grid min-w-0 content-start gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md motion-safe:transition-[border-color,box-shadow] motion-safe:duration-standard sm:p-7"
            data-test={'portfolio-row-' + entry.id}
        >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                    <BookOpenCheck aria-hidden="true" className="size-5" />
                </span>
                <PortfolioStatusBadge status={entry.status} />
            </div>
            <div className="grid min-w-0 gap-3">
                <h3 className="max-w-[42ch] text-xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
                    <Link
                        href={portfolioShow(entry.id)}
                        className="cursor-pointer rounded-lg hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        data-test={'portfolio-row-link-' + entry.id}
                    >
                        {entry.title}
                    </Link>
                </h3>
                <p className="line-clamp-4 max-w-[72ch] text-sm leading-7 [overflow-wrap:anywhere] text-muted-foreground sm:text-base">
                    {entry.summary}
                </p>
                <PortfolioVerificationBadge entry={entry} />
            </div>
            <dl className="grid min-w-0 gap-4 border-t border-border pt-5 text-xs sm:grid-cols-3">
                <div className="grid gap-1.5">
                    <dt className="text-muted-foreground">
                        Jangkauan tersimpan
                    </dt>
                    <dd className="flex items-center gap-1.5 font-semibold">
                        <Eye
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-primary"
                        />
                        {portfolioVisibilityLabel(entry.visibility)}
                    </dd>
                </div>
                <div className="grid gap-1.5">
                    <dt className="text-muted-foreground">Versi sumber</dt>
                    <dd className="font-semibold">
                        {entry.source.version_number === null
                            ? 'Tidak tersedia'
                            : 'Versi ' + entry.source.version_number}
                    </dd>
                </div>
                <div className="grid gap-1.5">
                    <dt className="text-muted-foreground">Diperbarui</dt>
                    <dd className="flex items-center gap-1.5 font-semibold">
                        <CalendarDays
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-primary"
                        />
                        <time dateTime={entry.updated_at}>
                            {formatPortfolioDate(entry.updated_at)}
                        </time>
                    </dd>
                </div>
            </dl>
            {canManage && (
                <details
                    className="group grid min-w-0 gap-3"
                    data-test={'portfolio-entry-' + entry.id + '-settings'}
                >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary"
                            />
                            Atur jangkauan
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-[rotate] duration-fast group-open:rotate-180 motion-reduce:transition-none"
                        />
                    </summary>
                    <div className="mt-3 min-w-0">
                        <PortfolioEntryVisibilityControl
                            entry={entry}
                            profileId={profileId}
                            onUpdated={onUpdated}
                            onAccessRevoked={onAccessRevoked}
                        />
                    </div>
                </details>
            )}
            <Button asChild variant="outline" className="min-h-11 w-full">
                <Link
                    href={portfolioShow(entry.id)}
                    data-test={'portfolio-detail-link-' + entry.id}
                >
                    Lihat detail karya
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
        </li>
    );
}
