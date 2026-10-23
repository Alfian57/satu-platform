import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { IntegrationStatusBadge } from '@/pages/campus/integrations/_components/integration-status-badge';
import { formatSyncDate } from '@/pages/campus/integrations/_types/integration-types';
import type { SyncItem } from '@/pages/campus/integrations/_types/integration-types';

interface IntegrationSyncTimelineModalProps {
    activeSync: SyncItem | null;
    onClose: () => void;
}

export function IntegrationSyncTimelineModal({
    activeSync,
    onClose,
}: IntegrationSyncTimelineModalProps) {
    return (
        <Dialog
            open={activeSync !== null}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Riwayat sinkronisasi</DialogTitle>
                    <DialogDescription className="wrap-anywhere">
                        {activeSync
                            ? `${activeSync.source}. Versi pemetaan ${activeSync.mapping_version}.`
                            : ''}
                    </DialogDescription>
                </DialogHeader>
                {activeSync &&
                    (activeSync.timeline.length === 0 ? (
                        <p className="text-sm leading-6 text-muted-foreground">
                            Riwayat proses belum tersedia untuk berkas ini.
                        </p>
                    ) : (
                        <ol className="max-h-80 space-y-4 overflow-y-auto">
                            {[...activeSync.timeline]
                                .reverse()
                                .map((entry, entryIndex) => (
                                    <li
                                        key={`${entry.created_at}-${entryIndex}`}
                                        className="min-w-0 border-b border-border pb-4 last:border-0"
                                    >
                                        <IntegrationStatusBadge
                                            status={entry.status}
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {formatSyncDate(entry.created_at)}
                                        </p>
                                        {entry.reason && (
                                            <p className="mt-2 text-sm leading-6 wrap-anywhere text-muted-foreground">
                                                {entry.reason}
                                            </p>
                                        )}
                                    </li>
                                ))}
                        </ol>
                    ))}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Tutup riwayat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
