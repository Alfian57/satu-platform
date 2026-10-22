import { Link } from '@inertiajs/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import { PortfolioStatusBadge } from '@/components/portfolio/portfolio-status-badge';
import { PortfolioVerificationBadge } from '@/components/portfolio/portfolio-verification-badge';
import { Button } from '@/components/ui/button';
import { index as portfolioIndex } from '@/routes/portfolio';
import type { PortfolioEntry } from '@/types/portfolio';

export interface PortfolioShowHeaderProps {
    entry: PortfolioEntry;
    isForbidden: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function PortfolioShowHeader({
    entry,
    isForbidden,
    isRefreshing,
    onRefresh,
}: PortfolioShowHeaderProps) {
    return (
        <header
            className="relative grid min-w-0 gap-4 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent via-sky-100 to-blue-100 p-5 shadow-md sm:p-7"
            data-test="portfolio-detail-header"
        >
            <ArchiveArt className="absolute right-8 bottom-5 hidden w-36 -rotate-6 opacity-65 lg:block" />
            <div className="relative flex min-w-0 flex-wrap items-center justify-between gap-3">
                <Link
                    href={portfolioIndex()}
                    className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    data-test="back-to-portfolio"
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Kembali ke portofolio
                </Link>
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 bg-card"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    data-test="portfolio-detail-refresh"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className={
                            isRefreshing
                                ? 'animate-spin motion-reduce:animate-none'
                                : ''
                        }
                    />
                    Muat ulang
                </Button>
            </div>
            <div className="relative grid min-w-0 gap-3 lg:pr-48">
                <p className="font-label text-label text-primary">
                    {isForbidden
                        ? 'Portofolio'
                        : 'Portofolio / Karya-' + entry.id}
                </p>
                <h1 className="max-w-[36ch] text-2xl leading-tight font-bold [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
                    {isForbidden ? 'Akses karya tidak tersedia.' : entry.title}
                </h1>
                {!isForbidden && (
                    <>
                        <p className="max-w-[72ch] text-sm leading-7 text-muted-foreground sm:text-base">
                            Hasil pekerjaanmu, dengan jejak sumber dan
                            pengaturan berbagi yang tetap terkendali.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <PortfolioStatusBadge status={entry.status} />
                            <PortfolioVerificationBadge entry={entry} />
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
