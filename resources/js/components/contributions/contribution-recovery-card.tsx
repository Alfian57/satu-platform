import { contributionStatusMeta } from '@/components/contributions/contribution-status';
import { Button } from '@/components/ui/button';
import type { ContributionDetail } from '@/types/contribution';

export interface ContributionRecoveryCardProps {
    isCheckingLatest: boolean;
    needsCheck: boolean;
    checkedContribution: ContributionDetail | null;
    isSubmitting: boolean;
    isRevising: boolean;
    onCheckLatest: () => void;
    onUseLatest: () => void;
}

export function ContributionRecoveryCard({
    isCheckingLatest,
    needsCheck,
    checkedContribution,
    isSubmitting,
    isRevising,
    onCheckLatest,
    onUseLatest,
}: ContributionRecoveryCardProps) {
    return (
        <section
            className="grid min-w-0 gap-3 rounded-2xl border border-border bg-card p-4"
            data-test="contribution-recovery"
        >
            <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 whitespace-normal"
                onClick={onCheckLatest}
                disabled={isSubmitting || isRevising || isCheckingLatest}
            >
                {isCheckingLatest
                    ? 'Memeriksa sumber...'
                    : 'Periksa data terbaru'}
            </Button>
            {needsCheck && (
                <p role="status" className="text-sm leading-6">
                    Pengiriman ditahan sampai sumber terbaru diperiksa. Draft
                    lokal tidak ditimpa.
                </p>
            )}
            {checkedContribution && (
                <div className="grid gap-3 text-sm leading-6">
                    <p>
                        Versi terbaru:{' '}
                        {checkedContribution.current_version?.version_number ??
                            'tidak tersedia'}
                        . Status:{' '}
                        {
                            contributionStatusMeta[checkedContribution.status]
                                .label
                        }
                        .
                    </p>
                    <p className="wrap-anywhere">
                        {checkedContribution.current_version?.claim}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 whitespace-normal"
                        onClick={onUseLatest}
                        data-test="contribution-use-latest"
                    >
                        Gunakan data terbaru
                    </Button>
                </div>
            )}
        </section>
    );
}
