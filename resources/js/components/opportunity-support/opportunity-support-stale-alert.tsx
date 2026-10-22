import { Button } from '@/components/ui/button';

export function OpportunitySupportStaleAlert({
    stale,
    disabled,
    onUseLatestData,
}: {
    stale: boolean;
    disabled: boolean;
    onUseLatestData: () => void;
}) {
    if (!stale) {
        return null;
    }

    return (
        <div className="mt-4 rounded-xl border border-pending/40 bg-pending/10 p-3 text-sm">
            <p>Berkas berubah. Catatan Anda tidak diganti otomatis.</p>
            <Button
                className="mt-3"
                variant="outline"
                disabled={disabled}
                onClick={onUseLatestData}
            >
                Gunakan data terbaru
            </Button>
        </div>
    );
}
