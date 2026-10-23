import { History } from 'lucide-react';
import type { FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContributionClaimCard } from '@/pages/campus/contributions/_components/contribution-claim-card';
import { ContributionDecisionForm } from '@/pages/campus/contributions/_components/contribution-decision-form';
import { ContributionDetailEmpty } from '@/pages/campus/contributions/_components/contribution-detail-empty';
import { ContributionEvidenceList } from '@/pages/campus/contributions/_components/contribution-evidence-list';
import { ContributionProvenanceContext } from '@/pages/campus/contributions/_components/contribution-provenance-context';
import { ContributionRecoveryBanner } from '@/pages/campus/contributions/_components/contribution-recovery-banner';
import { ContributionReviewHistory } from '@/pages/campus/contributions/_components/contribution-review-history';
import { ContributionStatusChip } from '@/pages/campus/contributions/_components/contribution-status-chip';
import type {
    ContributionReviewQueueItem,
    ReviewDecision,
} from '@/pages/campus/contributions/_types/contribution-types';

interface ContributionDetailPanelProps {
    selected: ContributionReviewQueueItem | null;
    stale: boolean;
    commandBlocked: boolean;
    needsCheck: boolean;
    isLoading: boolean;
    isProcessing: boolean;
    statusError: string | undefined;
    decisionError: string | undefined;
    reasonError: string | undefined;
    noteError: string | undefined;
    blocked: boolean;
    selectedDecision: ReviewDecision;
    onDecisionChange: (decision: ReviewDecision) => void;
    reason: string | null;
    onReasonChange: (reason: string) => void;
    note: string | null;
    onNoteChange: (note: string) => void;
    onRefreshQueue: () => void;
    onUseLatest: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}

export function ContributionDetailPanel({
    selected,
    stale,
    commandBlocked,
    needsCheck,
    isLoading,
    isProcessing,
    statusError,
    decisionError,
    reasonError,
    noteError,
    blocked,
    selectedDecision,
    onDecisionChange,
    reason,
    onReasonChange,
    note,
    onNoteChange,
    onRefreshQueue,
    onUseLatest,
    onSubmit,
    onClose,
}: ContributionDetailPanelProps) {
    if (selected === null) {
        return <ContributionDetailEmpty />;
    }

    const version = selected.current_version;

    return (
        <aside
            aria-labelledby="campus-review-decision-title"
            className="order-first min-w-0 xl:order-last"
        >
            <div
                className="grid min-w-0 gap-5 rounded-3xl border border-primary/15 bg-white p-4 shadow-md sm:p-5 xl:sticky xl:top-6"
                data-test="campus-contribution-docket"
            >
                {(stale || commandBlocked || needsCheck) && (
                    <ContributionRecoveryBanner
                        isLoading={isLoading}
                        isProcessing={isProcessing}
                        needsCheck={needsCheck}
                        onRefreshQueue={onRefreshQueue}
                        onUseLatest={onUseLatest}
                    />
                )}

                {/* Docket Header */}
                <header className="border-b border-border pb-4">
                    <span className="font-mono text-xs font-bold text-primary">
                        {selected.reference}
                    </span>
                    <h2
                        id="campus-review-decision-title"
                        tabIndex={-1}
                        className="mt-1 text-lg font-bold wrap-anywhere text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        {version?.claim ?? selected.project.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ContributionStatusChip status={selected.status} />
                        <span className="text-xs text-muted-foreground">
                            Oleh {selected.contributor.name}
                        </span>
                    </div>
                </header>

                {statusError && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription className="text-xs">
                            {statusError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Provenance Facts */}
                <ContributionProvenanceContext
                    version={version}
                    updatedAt={selected.updated_at}
                />

                {/* Version Claim & Summary */}
                {version && (
                    <>
                        <ContributionClaimCard version={version} />
                        <ContributionEvidenceList
                            evidence={version.evidence}
                            projectId={selected.project.id}
                        />
                    </>
                )}

                {/* Riwayat Keputusan */}
                <section
                    aria-labelledby="contribution-history-title"
                    className="space-y-2"
                >
                    <div className="flex items-center gap-2">
                        <History
                            aria-hidden="true"
                            className="size-4 text-primary"
                        />
                        <h3
                            id="contribution-history-title"
                            className="text-sm font-semibold text-foreground"
                        >
                            Riwayat Keputusan
                        </h3>
                    </div>
                    <ContributionReviewHistory reviews={selected.reviews} />
                </section>

                {/* Decision Form */}
                <ContributionDecisionForm
                    selected={selected}
                    selectedDecision={selectedDecision}
                    onDecisionChange={onDecisionChange}
                    reason={reason}
                    onReasonChange={onReasonChange}
                    note={note}
                    onNoteChange={onNoteChange}
                    decisionError={decisionError}
                    reasonError={reasonError}
                    noteError={noteError}
                    blocked={blocked}
                    isProcessing={isProcessing}
                    onSubmit={onSubmit}
                    onClose={onClose}
                />
            </div>
        </aside>
    );
}
