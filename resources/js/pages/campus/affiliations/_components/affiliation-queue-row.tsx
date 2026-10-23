import {
    ClipboardCheck,
    LockKeyhole,
    RotateCcw,
    UnlockKeyhole,
    UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { AffiliationMatchBadge } from '@/pages/campus/affiliations/_components/affiliation-match-badge';
import { formatDate } from '@/pages/campus/affiliations/_types/affiliation-types';
import type { ReviewItem } from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationQueueRowProps {
    item: ReviewItem;
    isSelected: boolean;
    isDisabled: boolean;
    isProcessing: boolean;
    onBeginReview: (item: ReviewItem) => void;
}

export function AffiliationQueueRow({
    item,
    isSelected,
    isDisabled,
    isProcessing,
    onBeginReview,
}: AffiliationQueueRowProps) {
    const lockedByOther = item.lock !== null && !item.lock.ownedByCurrentUser;

    return (
        <article
            aria-label={`Berkas AF-${item.id}`}
            className={cn(
                'min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5',
                isSelected &&
                    'border-primary/40 bg-accent/25 ring-1 ring-primary/20',
            )}
            data-test="affiliation-queue-row"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-accent text-primary">
                        <UserRound aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-label text-xs text-muted-foreground">
                            PERMOHONAN AFILIASI
                        </p>
                        <h3 className="mt-1 text-base font-semibold">
                            Berkas AF-{item.id}
                        </h3>
                    </div>
                </div>
                <AffiliationMatchBadge result={item.matchResult} />
            </div>
            <dl className="mt-4 grid min-w-0 gap-3 border-y border-border py-3 sm:grid-cols-2">
                <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">NIM</dt>
                    <dd className="mt-1 font-label text-sm font-medium break-words">
                        {item.nim}
                    </dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                        Nomor WhatsApp
                    </dt>
                    <dd className="mt-1 font-label text-sm font-medium break-words">
                        {item.phone ?? 'Belum tersedia'}
                    </dd>
                </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-48">
                    <p className="text-xs leading-5 text-muted-foreground">
                        Diajukan {formatDate(item.submittedAt)}
                    </p>
                    <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
                        {item.rosterSemester
                            ? `Roster ${item.rosterSemester}`
                            : 'Tanpa roster aktif'}{' '}
                        . Versi {item.version}
                    </p>
                    {item.isStale && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 font-semibold text-correction-subtle-foreground">
                            <RotateCcw
                                aria-hidden="true"
                                className="mt-0.5 size-3.5 shrink-0"
                            />
                            Roster berubah. Permohonan perlu diajukan ulang.
                        </p>
                    )}
                    {item.lock && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 font-semibold text-pending-subtle-foreground">
                            <LockKeyhole
                                aria-hidden="true"
                                className="mt-0.5 size-3.5 shrink-0"
                            />
                            {item.lock.ownedByCurrentUser
                                ? 'Kunci tinjauanmu aktif.'
                                : 'Sedang ditinjau operator lain.'}
                        </p>
                    )}
                </div>
                <Button
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className="h-11 shrink-0"
                    disabled={isDisabled || item.isStale || lockedByOther}
                    onClick={() => onBeginReview(item)}
                >
                    {isProcessing ? (
                        <Spinner aria-hidden="true" />
                    ) : item.lock?.ownedByCurrentUser ? (
                        <UnlockKeyhole aria-hidden="true" className="size-4" />
                    ) : (
                        <ClipboardCheck aria-hidden="true" className="size-4" />
                    )}
                    {item.isStale
                        ? 'Perlu diajukan ulang'
                        : lockedByOther
                          ? 'Sedang ditinjau'
                          : item.lock?.ownedByCurrentUser
                            ? 'Lanjutkan tinjauan'
                            : 'Tinjau berkas'}
                </Button>
            </div>
        </article>
    );
}
