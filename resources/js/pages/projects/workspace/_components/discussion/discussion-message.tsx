import type { WorkspaceDiscussion } from '@/types/task';
import { AttachmentItem } from './attachment-item';
import { formatDateTime, initials } from './discussion-utils';

export function DiscussionMessage({
    message,
    projectId,
}: {
    message: WorkspaceDiscussion;
    projectId: number;
}) {
    return (
        <li data-test={`discussion-message-${message.id}`}>
            <article className="grid gap-3 border-b border-border pb-5">
                <header className="flex items-start gap-3">
                    <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-xs font-bold text-primary"
                    >
                        {initials(message.author.name)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <h3 className="text-sm font-semibold">
                                {message.author.name}
                            </h3>
                            <p className="font-label text-label text-muted-foreground">
                                {formatDateTime(message.created_at)}
                            </p>
                            {message.is_edited && (
                                <span className="text-xs text-muted-foreground">
                                    · diedit
                                </span>
                            )}
                        </div>
                        <p className="font-label text-label text-muted-foreground">
                            Catatan tim
                        </p>
                    </div>
                </header>
                <p className="pl-12 text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
                    {message.body}
                </p>
                {message.attachments.length > 0 && (
                    <ul className="grid gap-3 pl-12" aria-label="Bukti pesan">
                        {message.attachments.map((attachment) => (
                            <AttachmentItem
                                key={attachment.id}
                                attachment={attachment}
                                projectId={projectId}
                            />
                        ))}
                    </ul>
                )}
            </article>
        </li>
    );
}
