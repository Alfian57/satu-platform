import { AlertCircle, LockKeyhole, X } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import type { UseWorkspaceReturn } from '@/pages/projects/workspace/_hooks/use-workspace';

type Props = {
    workspace: UseWorkspaceReturn;
    canManageTasks: boolean;
};

export function WorkspaceAlerts({ workspace, canManageTasks }: Props) {
    const { state, actions } = workspace;
    const {
        isRefreshing,
        realtimeNotice,
        actionMessage,
        actionError,
        commandBusy,
    } = state;

    useEffect(() => {
        if (actionMessage) {
            toast.success(actionMessage);
        }
    }, [actionMessage]);

    return (
        <div className="grid gap-3">
            <div
                role="status"
                aria-live="polite"
                data-test="workspace-refresh-status"
                className="min-h-5 text-sm text-muted-foreground"
            >
                {isRefreshing && (
                    <span className="inline-flex items-center gap-2">
                        <Spinner aria-hidden="true" />
                        Memuat data ruang kerja terbaru...
                    </span>
                )}
            </div>

            {realtimeNotice && (
                <p
                    role="status"
                    aria-live="polite"
                    data-test="workspace-realtime-update"
                    className="border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary"
                >
                    {realtimeNotice}
                </p>
            )}

            {actionError && (
                <div
                    role="alert"
                    data-test="workspace-action-error"
                    className="flex flex-wrap items-start justify-between gap-3 border border-correction/40 bg-correction-subtle px-4 py-3 text-sm text-correction-subtle-foreground"
                >
                    <span className="flex items-start gap-2">
                        <AlertCircle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        {actionError}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            className="min-h-11 cursor-pointer px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                            disabled={isRefreshing || commandBusy}
                            onClick={actions.recoverAction}
                            data-test="workspace-action-recovery"
                        >
                            Periksa status terbaru
                        </button>
                        <button
                            type="button"
                            className="min-h-11 min-w-11 cursor-pointer p-1 text-current hover:opacity-70"
                            aria-label="Tutup pesan error"
                            onClick={actions.clearActionFeedback}
                        >
                            <X aria-hidden="true" className="size-4" />
                        </button>
                    </span>
                </div>
            )}

            {!canManageTasks && (
                <div
                    data-test="workspace-read-only"
                    className="flex items-start gap-2 border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                >
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <p>
                        Mode baca. Izin perubahan tugas tidak tersedia untuk
                        akun ini.
                    </p>
                </div>
            )}
        </div>
    );
}
