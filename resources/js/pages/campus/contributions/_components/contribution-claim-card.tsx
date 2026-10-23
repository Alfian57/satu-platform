import type { ContributionReviewQueueItem } from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionClaimCardProps {
    version: NonNullable<ContributionReviewQueueItem['current_version']>;
}

export function ContributionClaimCard({ version }: ContributionClaimCardProps) {
    return (
        <section
            aria-labelledby="contribution-claim-title"
            className="space-y-2 rounded-xl border border-border bg-accent/35 p-3 text-sm leading-6"
        >
            <h3
                id="contribution-claim-title"
                className="font-bold text-foreground"
            >
                Klaim & Ringkasan Kontribusi
            </h3>
            <p className="leading-relaxed font-semibold text-foreground">
                {version.claim}
            </p>
            <p className="leading-relaxed text-muted-foreground">
                {version.summary}
            </p>
            <p className="border-l-2 border-blue-400 pl-2 text-muted-foreground italic">
                {version.declaration}
            </p>
        </section>
    );
}
