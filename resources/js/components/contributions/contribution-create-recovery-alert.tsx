import { Button } from '@/components/ui/button';
import { index as contributionsIndex } from '@/routes/contributions';

export interface ContributionCreateRecoveryAlertProps {
    actionError: string | null;
    needsCheck: boolean;
    onConfirmChecked: () => void;
}

export function ContributionCreateRecoveryAlert({
    actionError,
    needsCheck,
    onConfirmChecked,
}: ContributionCreateRecoveryAlertProps) {
    if (!actionError && !needsCheck) {
        return null;
    }

    return (
        <div className="grid min-w-0 gap-3">
            {actionError && (
                <div
                    role="alert"
                    data-test="contribution-create-error"
                    className="rounded-2xl border border-correction/30 bg-correction-subtle px-4 py-3 text-sm leading-6 text-correction-subtle-foreground"
                >
                    {actionError}
                </div>
            )}
            {needsCheck && (
                <div
                    className="grid gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6"
                    data-test="contribution-create-recovery"
                >
                    <a
                        href={contributionsIndex().url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-11 cursor-pointer font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                        Periksa daftar kontribusi di tab baru
                    </a>
                    <p>
                        Jika draft sudah tercatat, lanjutkan dari detailnya.
                        Hanya ulangi bila kamu telah memeriksa dan memastikan
                        belum ada draft baru.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 whitespace-normal"
                        onClick={() => {
                            if (
                                window.confirm(
                                    'Sudah memeriksa daftar dan memastikan draft ini belum tercatat?',
                                )
                            ) {
                                onConfirmChecked();
                            }
                        }}
                    >
                        Saya sudah memeriksa, belum ada draft baru
                    </Button>
                </div>
            )}
        </div>
    );
}
