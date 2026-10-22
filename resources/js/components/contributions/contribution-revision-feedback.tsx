import { MessageSquareText } from 'lucide-react';
import type { ContributionReview } from '@/types/contribution';

export interface ContributionRevisionFeedbackProps {
    latestReview: ContributionReview | null;
}

export function ContributionRevisionFeedback({
    latestReview,
}: ContributionRevisionFeedbackProps) {
    if (latestReview?.decision !== 'revision') {
        return null;
    }

    return (
        <section
            data-test="contribution-revision-feedback"
            className="grid min-w-0 gap-3 rounded-3xl border border-correction/30 bg-correction-subtle p-5 shadow-md sm:p-6"
        >
            <div className="flex items-center gap-2 text-base font-bold text-correction-subtle-foreground">
                <MessageSquareText aria-hidden="true" className="size-4" />
                Catatan kampus untuk versi aktif
            </div>
            <p className="text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-correction-subtle-foreground">
                {latestReview.reason ||
                    latestReview.note ||
                    'Kampus meminta penjelasan atau bukti tambahan.'}
            </p>
            {latestReview.reason && latestReview.note && (
                <p className="rounded-2xl bg-card/50 p-4 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap text-correction-subtle-foreground">
                    {latestReview.note}
                </p>
            )}
        </section>
    );
}
