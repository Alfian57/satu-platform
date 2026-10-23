import { ContributionStatusChip } from '@/pages/campus/contributions/_components/contribution-status-chip';
import { formatDate } from '@/pages/campus/contributions/_types/contribution-types';
import type { ContributionReview } from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionReviewHistoryProps {
    reviews: ContributionReview[];
}

export function ContributionReviewHistory({
    reviews,
}: ContributionReviewHistoryProps) {
    if (reviews.length === 0) {
        return (
            <p className="rounded-xl border border-border bg-accent/35 p-4 text-center text-xs text-muted-foreground">
                Belum ada keputusan peninjau pada kontribusi ini.
            </p>
        );
    }

    return (
        <ol className="space-y-3">
            {reviews
                .slice()
                .reverse()
                .map((review) => (
                    <li
                        key={review.id}
                        className="space-y-2 rounded-xl border border-border bg-accent/35 p-3 text-sm leading-6"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <ContributionStatusChip
                                status={
                                    review.decision === 'approved'
                                        ? 'approved'
                                        : review.decision
                                }
                            />
                            <time
                                dateTime={review.reviewed_at}
                                className="font-mono text-xs text-muted-foreground"
                            >
                                {formatDate(review.reviewed_at)}
                            </time>
                        </div>
                        <p className="font-semibold wrap-anywhere text-foreground">
                            {review.reviewer.name}
                        </p>
                        {review.reason && (
                            <p className="leading-relaxed text-foreground">
                                {review.reason}
                            </p>
                        )}
                        {review.note && (
                            <p className="border-l-2 border-border pl-2.5 text-muted-foreground italic">
                                {review.note}
                            </p>
                        )}
                        <p className="font-mono text-xs text-muted-foreground">
                            {review.policy_version}
                        </p>
                    </li>
                ))}
        </ol>
    );
}
