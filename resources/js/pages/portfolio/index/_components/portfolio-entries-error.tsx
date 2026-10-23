import { CircleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PortfolioEntriesError({
    onRetry,
    retrying,
}: {
    onRetry: () => void;
    retrying: boolean;
}) {
    return (
        <section
            role="alert"
            data-test="portfolio-error"
            className="grid min-w-0 gap-4 rounded-2xl border border-correction/30 bg-correction-subtle p-5 text-correction-subtle-foreground sm:p-6"
        >
            <div className="flex items-start gap-3">
                <CircleAlert
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0"
                />
                <div className="grid min-w-0 gap-2">
                    <h2 className="text-title font-semibold">
                        Koleksi belum dapat dimuat.
                    </h2>
                    <p className="text-sm leading-6">
                        Karya yang tersimpan tetap aman. Periksa koneksi dan
                        coba muat ulang.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 w-fit bg-card"
                disabled={retrying}
                onClick={onRetry}
                data-test="portfolio-error-retry"
            >
                <RefreshCw
                    aria-hidden="true"
                    className={
                        retrying
                            ? 'animate-spin motion-reduce:animate-none'
                            : ''
                    }
                />
                Coba lagi
            </Button>
        </section>
    );
}
