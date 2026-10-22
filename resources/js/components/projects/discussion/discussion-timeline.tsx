import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspaceDiscussion } from '@/types/task';
import { DiscussionMessage } from './discussion-message';
import { DiscussionSkeleton } from './discussion-skeleton';

type Props = {
    projectId: number;
    messages: WorkspaceDiscussion[];
    totalCount: number;
    isOlderLoading: boolean;
    discussionLoadError: string | null;
    onRetryOlder: () => void;
};

export function DiscussionTimeline({
    projectId,
    messages,
    totalCount,
    isOlderLoading,
    discussionLoadError,
    onRetryOlder,
}: Props) {
    return (
        <div
            className="grid gap-4"
            aria-busy={isOlderLoading}
            data-test="discussion-timeline"
        >
            <div className="flex items-center justify-between gap-3">
                <p className="font-label text-label text-muted-foreground">
                    {totalCount} catatan tersimpan
                </p>
                {isOlderLoading && (
                    <span
                        className="text-xs text-muted-foreground"
                        role="status"
                        aria-live="polite"
                        data-test="discussion-loading-status"
                    >
                        Memuat catatan sebelumnya...
                    </span>
                )}
            </div>

            {discussionLoadError && (
                <div
                    className="flex flex-wrap items-center justify-between gap-3 border border-correction/30 bg-correction-subtle px-3 py-3 text-sm text-correction-subtle-foreground"
                    role="alert"
                >
                    <span className="flex items-start gap-2">
                        <AlertCircle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        {discussionLoadError}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={onRetryOlder}
                        disabled={isOlderLoading}
                    >
                        Coba lagi
                    </Button>
                </div>
            )}

            {isOlderLoading && <DiscussionSkeleton />}

            {messages.length === 0 && !isOlderLoading ? (
                <div
                    className="grid gap-3 border-y border-border px-4 py-10 text-center sm:px-8"
                    data-test="discussion-empty"
                >
                    <p className="font-label text-label text-muted-foreground">
                        BELUM ADA CATATAN
                    </p>
                    <h3 className="text-lg font-semibold">
                        Belum ada diskusi tim
                    </h3>
                    <p className="mx-auto max-w-[54ch] text-sm leading-6 text-muted-foreground">
                        Gunakan catatan untuk keputusan, hambatan kerja, dan
                        serah terima yang perlu dibaca tim.
                    </p>
                </div>
            ) : (
                <ol className="grid gap-5" aria-label="Riwayat diskusi proyek">
                    {messages.map((message) => (
                        <DiscussionMessage
                            key={message.id}
                            message={message}
                            projectId={projectId}
                        />
                    ))}
                </ol>
            )}
        </div>
    );
}
