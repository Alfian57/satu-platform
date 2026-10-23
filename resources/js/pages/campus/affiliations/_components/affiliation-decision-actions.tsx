import { FileWarning, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { decisionCopy } from '@/pages/campus/affiliations/_types/affiliation-types';
import type { Decision } from '@/pages/campus/affiliations/_types/affiliation-types';

interface AffiliationDecisionActionsProps {
    decision: Decision;
    isProcessing: boolean;
    onAbandon: () => void;
}

export function AffiliationDecisionActions({
    decision,
    isProcessing,
    onAbandon,
}: AffiliationDecisionActionsProps) {
    return (
        <div className="grid gap-2 border-t border-border pt-4">
            <Button
                type="submit"
                data-test="affiliation-decision-submit"
                variant={decision === 'reject' ? 'destructive' : 'default'}
                className="h-auto min-h-11 whitespace-normal"
            >
                {isProcessing ? (
                    <Spinner aria-hidden="true" />
                ) : decision === 'approve' ? (
                    <ShieldCheck aria-hidden="true" className="size-4" />
                ) : decision === 'request_revision' ? (
                    <FileWarning aria-hidden="true" className="size-4" />
                ) : (
                    <XCircle aria-hidden="true" className="size-4" />
                )}
                {isProcessing ? 'Memproses berkas...' : decisionCopy[decision]}
            </Button>
            <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 whitespace-normal"
                onClick={onAbandon}
            >
                Lepas kunci dan tutup
            </Button>
        </div>
    );
}
