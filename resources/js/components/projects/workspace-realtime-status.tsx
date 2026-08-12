import { RefreshCw, Users, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
    WorkspacePresenceMember,
    WorkspaceRealtimeStatus as RealtimeStatus,
} from '@/types';

type Props = {
    status: RealtimeStatus;
    presenceMembers: WorkspacePresenceMember[];
    onRetry: () => void;
};

const statusCopy: Record<RealtimeStatus, string> = {
    connected: 'Realtime tersambung',
    connecting: 'Menghubungkan realtime',
    reconnecting: 'Realtime menyambung kembali',
    disconnected: 'Realtime terputus',
    unavailable: 'Realtime tidak tersedia',
    offline: 'Koneksi offline, menunggu pemulihan',
};

export function WorkspaceRealtimeStatus({
    status,
    presenceMembers,
    onRetry,
}: Props) {
    const isConnected = status === 'connected';
    const canRetry =
        status === 'disconnected' ||
        status === 'unavailable' ||
        status === 'offline';
    const StatusIcon = isConnected ? Wifi : WifiOff;

    return (
        <div
            className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
            data-test="workspace-realtime-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <span className="inline-flex min-w-0 items-center gap-1.5">
                <StatusIcon aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{statusCopy[status]}</span>
            </span>
            {isConnected && (
                <span
                    className="inline-flex items-center gap-1"
                    data-test="workspace-presence"
                >
                    <Users aria-hidden="true" className="size-3.5" />
                    {presenceMembers.length} anggota aktif
                </span>
            )}
            {canRetry && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto min-h-0 cursor-pointer px-1 py-0.5 text-xs"
                    onClick={onRetry}
                    data-test="workspace-realtime-retry"
                >
                    <RefreshCw aria-hidden="true" className="size-3.5" />
                    Coba lagi
                </Button>
            )}
        </div>
    );
}
