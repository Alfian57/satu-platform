import { ContributionEvidenceSection } from '@/components/contributions/contribution-evidence-section';
import { ContributionProvenanceTrace } from '@/components/contributions/contribution-provenance-trace';
import { ContributionReviewFeedback } from '@/components/contributions/contribution-review-feedback';
import { ContributionVersionDetail } from '@/components/contributions/contribution-version-detail';
import { ContributionVersionHistory } from '@/components/contributions/contribution-version-history';
import type { ContributionDetail } from '@/types/contribution';

export interface ContributionDetailBodyProps {
    contribution: ContributionDetail;
}

export function ContributionDetailBody({
    contribution,
}: ContributionDetailBodyProps) {
    const currentVersion = contribution.current_version;

    return (
        <>
            <ContributionVersionDetail currentVersion={currentVersion} />

            {currentVersion && (
                <ContributionEvidenceSection
                    projectId={contribution.project.id}
                    evidence={currentVersion.evidence}
                />
            )}

            <section
                aria-labelledby="contribution-review-title"
                className="grid min-w-0 gap-5 border-t border-border/70 px-1 pt-6"
            >
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Jejak validasi
                    </p>
                    <h2
                        id="contribution-review-title"
                        className="mt-1 text-title font-semibold"
                    >
                        Umpan balik kampus
                    </h2>
                </div>
                <ContributionReviewFeedback
                    versions={contribution.versions}
                    reviews={contribution.reviews}
                />
            </section>

            <ContributionProvenanceTrace provenance={contribution.provenance} />

            <ContributionVersionHistory versions={contribution.versions} />
        </>
    );
}
