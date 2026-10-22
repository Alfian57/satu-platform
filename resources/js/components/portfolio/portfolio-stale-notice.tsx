import { Button } from '@/components/ui/button';

export interface PortfolioStaleNoticeProps {
    message: string;
    onApplyLatest: () => void;
    processing: boolean;
    dataTest?: string;
}

export function PortfolioStaleNotice({
    message,
    onApplyLatest,
    processing,
    dataTest,
}: PortfolioStaleNoticeProps) {
    return (
        <div
            role="status"
            className="grid gap-3 rounded-xl border border-pending/30 bg-pending-subtle p-3 text-sm leading-6 text-pending-subtle-foreground"
            data-test={dataTest}
        >
            <p>{message}</p>
            <Button
                variant="outline"
                type="button"
                className="h-auto min-h-11 whitespace-normal"
                onClick={onApplyLatest}
                disabled={processing}
            >
                Gunakan pengaturan terbaru
            </Button>
        </div>
    );
}
