import { MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    formatDate,
    reviewMeta,
} from '@/pages/contributions/_utils/contribution-helpers';
import type {
    ContributionDetail,
    ContributionReview,
} from '@/types/contribution';

export interface ContributionReviewFeedbackProps {
    reviews: ContributionReview[];
    versions: ContributionDetail['versions'];
}

export function ContributionReviewFeedback({
    reviews,
    versions,
}: ContributionReviewFeedbackProps) {
    if (reviews.length === 0) {
        return (
            <div
                data-test="contribution-review-empty"
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground"
            >
                <MessageSquareText
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                />
                <p>
                    Belum ada keputusan validasi. Catatan kampus akan muncul di
                    sini setelah pemeriksaan.
                </p>
            </div>
        );
    }

    return (
        <ol
            className="grid min-w-0 gap-3"
            data-test="contribution-review-timeline"
        >
            {reviews
                .slice()
                .reverse()
                .map((review) => {
                    const meta = reviewMeta(review.decision);
                    const versionNumber = versions.find(
                        (version) =>
                            version.id === review.contribution_version_id,
                    )?.version_number;

                    return (
                        <li
                            key={review.id}
                            className="grid min-w-0 gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:grid-cols-[10rem_minmax(0,1fr)]"
                        >
                            <div className="grid content-start gap-1">
                                <span
                                    className={cn(
                                        'inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                                        meta.className,
                                    )}
                                >
                                    {meta.label}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    {versionNumber === undefined
                                        ? 'Versi sumber tidak tersedia'
                                        : `Keputusan versi ${versionNumber}`}
                                </p>
                                <time
                                    dateTime={review.reviewed_at}
                                    className="text-xs text-muted-foreground"
                                >
                                    {formatDate(review.reviewed_at)}
                                </time>
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <p className="text-sm font-semibold [overflow-wrap:anywhere]">
                                    {review.reviewer.name}
                                </p>
                                {review.reason && (
                                    <p className="text-sm leading-6 [overflow-wrap:anywhere]">
                                        {review.reason}
                                    </p>
                                )}
                                {review.note && (
                                    <p className="rounded-xl bg-accent/40 p-4 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                                        {review.note}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
        </ol>
    );
}
