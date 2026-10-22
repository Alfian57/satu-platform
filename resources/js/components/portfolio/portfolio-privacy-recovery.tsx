import { Button } from '@/components/ui/button';
export { usePortfolioPrivacyRecovery } from '@/hooks/use-portfolio-privacy-recovery';

export function PortfolioPrivacyRecoveryNotice({
    recovery,
    prefix,
}: {
    recovery: {
        needsCheck: boolean;
        checking: boolean;
        checkLatest: () => void;
    };
    prefix: string;
}) {
    if (!recovery.needsCheck) {
        return null;
    }

    return (
        <div
            className="grid gap-3 rounded-xl border border-satu-orange-border bg-satu-orange-soft p-3 text-sm leading-6 text-satu-orange-ink"
            data-test={prefix + '-recovery'}
        >
            <p>
                Pilihan lokal tetap ada. Periksa status tersimpan tanpa mengirim
                perubahan lagi.
            </p>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 whitespace-normal"
                disabled={recovery.checking}
                onClick={recovery.checkLatest}
                data-test={prefix + '-check-latest'}
            >
                {recovery.checking
                    ? 'Memeriksa pengaturan...'
                    : 'Periksa pengaturan terbaru'}
            </Button>
        </div>
    );
}
