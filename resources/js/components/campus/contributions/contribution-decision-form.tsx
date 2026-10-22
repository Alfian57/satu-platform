import { FileWarning, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { decisionMeta } from '@/components/campus/contributions/contribution-types';
import type {
    ContributionReviewQueueItem,
    ReviewDecision,
} from '@/components/campus/contributions/contribution-types';
import { campusControlClass } from '@/components/campus-operation-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface ContributionDecisionFormProps {
    selected: ContributionReviewQueueItem;
    selectedDecision: ReviewDecision;
    onDecisionChange: (decision: ReviewDecision) => void;
    reason: string | null;
    onReasonChange: (reason: string) => void;
    note: string | null;
    onNoteChange: (note: string) => void;
    decisionError: string | undefined;
    reasonError: string | undefined;
    noteError: string | undefined;
    blocked: boolean;
    isProcessing: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}

export function ContributionDecisionForm({
    selected,
    selectedDecision,
    onDecisionChange,
    reason,
    onReasonChange,
    note,
    onNoteChange,
    decisionError,
    reasonError,
    noteError,
    blocked,
    isProcessing,
    onSubmit,
    onClose,
}: ContributionDecisionFormProps) {
    if (selected.status !== 'pending' || !selected.current_version) {
        return (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-accent/35 p-3.5 text-xs text-muted-foreground">
                <LockKeyhole className="size-4 shrink-0 text-muted-foreground" />
                <span>
                    Mode baca. Kontribusi ini sudah memiliki keputusan dan tidak
                    menerima perubahan baru.
                </span>
            </div>
        );
    }

    return (
        <form
            className="grid gap-4 border-t border-border pt-4"
            onSubmit={onSubmit}
            data-test="campus-contribution-review-form"
        >
            <fieldset disabled={blocked} className="grid gap-2">
                <legend className="text-xs font-bold tracking-wide text-foreground">
                    Keputusan peninjau
                </legend>
                {(Object.keys(decisionMeta) as ReviewDecision[]).map(
                    (decision) => (
                        <label
                            key={decision}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 motion-reduce:transition-none',
                                decisionMeta[decision].className,
                                selectedDecision === decision &&
                                    'ring-2 ring-primary/20',
                            )}
                        >
                            <input
                                type="radio"
                                name="decision"
                                value={decision}
                                checked={selectedDecision === decision}
                                onChange={() => onDecisionChange(decision)}
                                className="mt-0.5 size-4 cursor-pointer accent-primary"
                            />
                            <div>
                                <span className="font-bold text-foreground">
                                    {decisionMeta[decision].label}
                                </span>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {decisionMeta[decision].description}
                                </p>
                            </div>
                        </label>
                    ),
                )}
            </fieldset>

            {decisionError && (
                <p
                    role="alert"
                    className="text-xs font-semibold text-correction-subtle-foreground"
                >
                    {decisionError}
                </p>
            )}

            {/* Alasan */}
            <div className="grid gap-1.5">
                <label
                    htmlFor="campus-contribution-review-reason"
                    className="text-sm font-semibold text-foreground"
                >
                    Alasan Keputusan
                    {selectedDecision !== 'approved' && (
                        <span className="text-correction-subtle-foreground">
                            {' '}
                            *
                        </span>
                    )}
                </label>
                <textarea
                    id="campus-contribution-review-reason"
                    disabled={blocked}
                    value={reason ?? ''}
                    maxLength={1000}
                    rows={3}
                    required={selectedDecision !== 'approved'}
                    aria-invalid={Boolean(reasonError)}
                    onChange={(event) => onReasonChange(event.target.value)}
                    className={cn(campusControlClass, 'resize-y')}
                    placeholder="Tulis alasan faktual yang membantu mahasiswa..."
                />
                <p className="text-right font-mono text-xs text-muted-foreground">
                    {(reason ?? '').length} / 1.000
                </p>
                {reasonError && (
                    <p
                        id="campus-review-reason-error"
                        role="alert"
                        className="text-xs font-semibold text-correction-subtle-foreground"
                    >
                        {reasonError}
                    </p>
                )}
            </div>

            {/* Catatan internal */}
            <div className="grid gap-1.5">
                <label
                    htmlFor="campus-contribution-review-note"
                    className="text-sm font-semibold text-foreground"
                >
                    Catatan untuk pemilik (opsional)
                </label>
                <textarea
                    id="campus-contribution-review-note"
                    disabled={blocked}
                    value={note ?? ''}
                    maxLength={1000}
                    rows={2}
                    aria-invalid={Boolean(noteError)}
                    onChange={(event) => onNoteChange(event.target.value)}
                    className={cn(campusControlClass, 'resize-y')}
                    placeholder="Catatan ini dapat dibaca mahasiswa pemilik..."
                />
                {noteError && (
                    <p
                        id="campus-review-note-error"
                        role="alert"
                        className="text-xs font-semibold text-correction-subtle-foreground"
                    >
                        {noteError}
                    </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid gap-2 border-t border-border pt-3">
                <Button
                    type="submit"
                    variant={
                        selectedDecision === 'rejected'
                            ? 'destructive'
                            : 'default'
                    }
                    className={`min-h-11 cursor-pointer rounded-xl text-sm font-semibold text-white shadow-sm ${
                        selectedDecision === 'approved'
                            ? 'bg-emerald-700 hover:bg-emerald-800'
                            : selectedDecision === 'revision'
                              ? 'bg-amber-700 hover:bg-amber-800'
                              : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                    disabled={blocked}
                    data-test="campus-contribution-decision-submit"
                >
                    {isProcessing ? (
                        <Spinner className="mr-1.5 size-3.5" />
                    ) : selectedDecision === 'approved' ? (
                        <ShieldCheck className="mr-1.5 size-3.5" />
                    ) : selectedDecision === 'revision' ? (
                        <FileWarning className="mr-1.5 size-3.5" />
                    ) : (
                        <XCircle className="mr-1.5 size-3.5" />
                    )}
                    {isProcessing
                        ? 'Menyimpan keputusan...'
                        : decisionMeta[selectedDecision].label}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 cursor-pointer rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent"
                    disabled={blocked}
                    onClick={onClose}
                >
                    Tutup berkas
                </Button>
            </div>
        </form>
    );
}
