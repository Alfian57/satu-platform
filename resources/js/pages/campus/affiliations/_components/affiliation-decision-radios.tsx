import { cn } from '@/lib/utils';
import { decisionCopy } from '@/pages/campus/affiliations/_types/affiliation-types';
import type { Decision } from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationDecisionRadiosProps {
    decision: Decision;
    onChangeDecision: (decision: Decision) => void;
    isDisabled: boolean;
}

export function AffiliationDecisionRadios({
    decision,
    onChangeDecision,
    isDisabled,
}: AffiliationDecisionRadiosProps) {
    return (
        <fieldset className="min-w-0 space-y-2">
            <legend className="mb-2 text-sm font-semibold">
                Keputusan tinjauan
            </legend>
            {(Object.keys(decisionCopy) as Decision[]).map((value) => (
                <label
                    key={value}
                    className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl border border-border p-3 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring motion-reduce:transition-none',
                        isDisabled
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer hover:bg-accent/40',
                        decision === value &&
                            (value === 'approve'
                                ? 'border-verified/30 bg-verified-subtle text-verified-subtle-foreground'
                                : value === 'request_revision'
                                  ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                                  : 'border-correction/30 bg-correction-subtle text-correction-subtle-foreground'),
                    )}
                >
                    <input
                        type="radio"
                        name="decision"
                        value={value}
                        checked={decision === value}
                        onChange={() => onChangeDecision(value)}
                        className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                    />
                    {decisionCopy[value]}
                </label>
            ))}
        </fieldset>
    );
}
