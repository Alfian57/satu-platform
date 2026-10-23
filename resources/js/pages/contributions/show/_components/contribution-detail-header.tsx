import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { DashboardArchiveArt as ArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import { index as contributionsIndex } from '@/routes/contributions';

export interface ContributionDetailHeaderProps {
    contributionId: number;
    claim?: string | null;
    projectTitle: string;
    ownerName: string;
}

export function ContributionDetailHeader({
    contributionId,
    claim,
    projectTitle,
    ownerName,
}: ContributionDetailHeaderProps) {
    return (
        <header
            className="relative isolate grid min-w-0 gap-4 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-accent/30 p-5 shadow-md sm:p-7 lg:pr-48"
            data-test="contribution-detail-header"
        >
            <ArchiveArt className="absolute top-5 right-7 -z-10 hidden w-36 opacity-55 lg:block" />
            <Link
                href={contributionsIndex()}
                className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                data-test="back-to-contributions"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Kembali ke kontribusi
            </Link>
            <div className="grid gap-3">
                <p className="font-label text-label text-primary">
                    CATATAN KONTRIBUSI / {contributionId}
                </p>
                <h1 className="max-w-[36ch] text-2xl leading-tight font-bold text-balance [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
                    {claim ?? projectTitle}
                </h1>
                <p className="max-w-[72ch] text-sm leading-7 [overflow-wrap:anywhere] text-muted-foreground sm:text-base">
                    Proyek {projectTitle}. Dicatat oleh {ownerName}.
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                    Detail pekerjaan, bukti, dan keputusan validasi tersimpan
                    dalam satu catatan.
                </p>
            </div>
        </header>
    );
}
