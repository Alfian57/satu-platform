import type { FormEvent, RefObject } from 'react';
import { AffiliationDecisionActions } from '@/pages/campus/affiliations/_components/affiliation-decision-actions';
import { AffiliationDecisionEmptyState } from '@/pages/campus/affiliations/_components/affiliation-decision-empty-state';
import { AffiliationDecisionHeader } from '@/pages/campus/affiliations/_components/affiliation-decision-header';
import { AffiliationDecisionRadios } from '@/pages/campus/affiliations/_components/affiliation-decision-radios';
import {
    controlClassName,
    reasonsByDecision,
} from '@/pages/campus/affiliations/_types/affiliation-types';
import type {
    Decision,
    ReasonCode,
    ReviewItem,
} from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationDecisionPanelProps {
    selected: ReviewItem | null;
    decision: Decision;
    onChangeDecision: (decision: Decision) => void;
    reasonCode: ReasonCode;
    setReasonCode: (reasonCode: ReasonCode) => void;
    note: string;
    setNote: (note: string) => void;
    fieldErrors: Record<string, string>;
    isDisabled: boolean;
    isProcessing: boolean;
    decisionHeadingRef: RefObject<HTMLHeadingElement | null>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onAbandon: () => void;
}

export function AffiliationDecisionPanel({
    selected,
    decision,
    onChangeDecision,
    reasonCode,
    setReasonCode,
    note,
    setNote,
    fieldErrors,
    isDisabled,
    isProcessing,
    decisionHeadingRef,
    onSubmit,
    onAbandon,
}: AffiliationDecisionPanelProps) {
    if (selected === null) {
        return <AffiliationDecisionEmptyState />;
    }

    return (
        <form
            className="min-w-0 rounded-3xl border border-primary/30 bg-white p-4 shadow-md sm:p-5"
            onSubmit={onSubmit}
            aria-labelledby="decision-title"
            aria-busy={isProcessing}
        >
            <AffiliationDecisionHeader
                selected={selected}
                decisionHeadingRef={decisionHeadingRef}
            />
            <fieldset disabled={isDisabled} className="mt-4 min-w-0 space-y-4">
                <legend className="sr-only">
                    Keputusan dan alasan tinjauan
                </legend>
                <AffiliationDecisionRadios
                    decision={decision}
                    onChangeDecision={onChangeDecision}
                    isDisabled={isDisabled}
                />
                <div className="space-y-2">
                    <label
                        htmlFor="reason_code"
                        className="text-sm font-semibold"
                    >
                        Alasan keputusan
                    </label>
                    <select
                        id="reason_code"
                        name="reason_code"
                        value={reasonCode}
                        onChange={(event) =>
                            setReasonCode(event.target.value as ReasonCode)
                        }
                        className={controlClassName}
                        aria-invalid={Boolean(fieldErrors.reason_code)}
                        aria-describedby={
                            fieldErrors.reason_code
                                ? 'affiliation-reason-error'
                                : undefined
                        }
                    >
                        {reasonsByDecision[decision].map((reason) => (
                            <option key={reason.value} value={reason.value}>
                                {reason.label}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.reason_code && (
                        <p
                            id="affiliation-reason-error"
                            className="text-sm text-correction"
                        >
                            {fieldErrors.reason_code}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="review_note"
                        className="text-sm font-semibold"
                    >
                        Catatan tambahan{' '}
                        <span className="font-normal text-muted-foreground">
                            (opsional)
                        </span>
                    </label>
                    <textarea
                        id="review_note"
                        name="note"
                        value={note}
                        maxLength={1000}
                        rows={3}
                        onChange={(event) => setNote(event.target.value)}
                        className="w-full min-w-0 resize-y rounded-xl border border-input bg-white p-3 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tambahkan konteks keputusan."
                        aria-invalid={Boolean(fieldErrors.note)}
                        aria-describedby="affiliation-note-help affiliation-note-error"
                    />
                    <p
                        id="affiliation-note-help"
                        className="text-right font-label text-xs text-muted-foreground"
                    >
                        {note.length}/1.000 karakter
                    </p>
                    {fieldErrors.note && (
                        <p
                            id="affiliation-note-error"
                            className="text-sm text-correction"
                        >
                            {fieldErrors.note}
                        </p>
                    )}
                </div>
                {(fieldErrors.decision || fieldErrors.expected_version) && (
                    <p role="alert" className="text-sm text-correction">
                        {fieldErrors.decision || fieldErrors.expected_version}
                    </p>
                )}
                <p className="rounded-xl bg-accent/40 p-3 text-xs leading-5 text-muted-foreground">
                    {decision === 'approve'
                        ? 'Persetujuan memverifikasi afiliasi kampus, bukan kontribusi atau portofolio.'
                        : decision === 'request_revision'
                          ? 'Permohonan dikembalikan untuk diperbaiki sesuai alasan dan catatanmu.'
                          : 'Penolakan menyatakan permohonan afiliasi tidak disetujui. Pastikan alasannya sesuai.'}{' '}
                    Keputusan masuk ke riwayat peninjauan.
                </p>
                <AffiliationDecisionActions
                    decision={decision}
                    isProcessing={isProcessing}
                    onAbandon={onAbandon}
                />
            </fieldset>
        </form>
    );
}
