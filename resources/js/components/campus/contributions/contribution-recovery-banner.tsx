import { Button } from '@/components/ui/button';

interface ContributionRecoveryBannerProps {
    isLoading: boolean;
    isProcessing: boolean;
    needsCheck: boolean;
    onRefreshQueue: () => void;
    onUseLatest: () => void;
}

export function ContributionRecoveryBanner({
    isLoading,
    isProcessing,
    needsCheck,
    onRefreshQueue,
    onUseLatest,
}: ContributionRecoveryBannerProps) {
    return (
        <div
            role="alert"
            className="grid gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6"
            data-test="campus-contribution-recovery"
        >
            <p>
                Keputusan ditahan. Catatan tetap ada. Periksa antrean lalu
                gunakan berkas terbaru secara eksplisit.
            </p>
            <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 whitespace-normal"
                onClick={onRefreshQueue}
                disabled={isLoading || isProcessing}
            >
                Periksa antrean terbaru
            </Button>
            {!needsCheck && (
                <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 whitespace-normal"
                    onClick={onUseLatest}
                    data-test="campus-contribution-use-latest"
                >
                    Gunakan berkas terbaru
                </Button>
            )}
        </div>
    );
}
