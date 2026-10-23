import { Link } from '@inertiajs/react';
import { ArrowUpRight, CalendarDays, FileText, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ContributionStatusBadge,
    contributionStatusMeta,
} from '@/pages/contributions/_components/contribution-status';
import { formatDateUtc } from '@/pages/contributions/_utils/contribution-helpers';
import { show as contributionShow } from '@/routes/contributions';
import type { ContributionSummary } from '@/types/contribution';

export interface ContributionCardProps {
    contribution: ContributionSummary;
}

export function ContributionCard({ contribution }: ContributionCardProps) {
    const meta = contributionStatusMeta[contribution.status];
    const version = contribution.current_version;
    const action =
        contribution.status === 'draft'
            ? 'Lihat draft'
            : contribution.status === 'revision'
              ? 'Tanggapi revisi'
              : 'Lihat detail';

    return (
        <li className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md motion-safe:transition-[border-color,box-shadow] motion-safe:duration-standard sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary">
                    <FileText aria-hidden="true" className="size-5" />
                </span>
                <ContributionStatusBadge status={contribution.status} />
            </div>
            <div className="grid min-w-0 gap-2">
                <h3 className="text-xl leading-tight font-bold tracking-tight wrap-anywhere sm:text-2xl">
                    <Link
                        href={contributionShow(contribution.id)}
                        className="cursor-pointer rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        {version?.task?.title ?? 'Tugas belum ditautkan'}
                    </Link>
                </h3>
                <p className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <FolderOpen
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <span className="min-w-0 wrap-anywhere">
                        {contribution.project.title}
                    </span>
                </p>
            </div>
            <div
                className={cn(
                    'grid min-w-0 gap-2 rounded-2xl border p-4',
                    meta.className,
                )}
            >
                <p className="text-xs font-semibold">Langkah berikutnya</p>
                <p className="text-sm leading-6 font-semibold">
                    {meta.nextStep}
                </p>
                <p className="text-xs leading-5">{meta.description}</p>
            </div>
            <dl className="mt-auto grid min-w-0 grid-cols-2 gap-3 border-t border-border/70 pt-4">
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Versi aktif
                    </dt>
                    <dd className="text-sm font-semibold">
                        {version
                            ? 'Versi ' + version.version_number
                            : 'Belum ada versi'}
                    </dd>
                </div>
                <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                        Pembaruan terakhir
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium">
                        <CalendarDays
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        <time dateTime={contribution.updated_at}>
                            {formatDateUtc(contribution.updated_at)}
                        </time>
                    </dd>
                </div>
            </dl>
            <Button
                asChild
                variant="outline"
                className="min-h-11 w-full border-primary/25 bg-accent/30 text-primary hover:border-primary hover:bg-accent hover:text-primary motion-safe:duration-standard"
            >
                <Link
                    href={contributionShow(contribution.id)}
                    data-test={'contribution-row-' + contribution.id}
                    aria-label={
                        action +
                        ': ' +
                        (version?.task?.title ?? contribution.project.title)
                    }
                >
                    {action}
                    <ArrowUpRight aria-hidden="true" />
                </Link>
            </Button>
        </li>
    );
}
