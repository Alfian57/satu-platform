import { ContributionEvidenceSection } from '@/pages/contributions/show/_components/contribution-evidence-section';
import { ContributionProvenanceTrace } from '@/pages/contributions/show/_components/contribution-provenance-trace';
import { ContributionReviewFeedback } from '@/pages/contributions/show/_components/contribution-review-feedback';
import { ContributionVersionDetail } from '@/pages/contributions/show/_components/contribution-version-detail';
import { ContributionVersionHistory } from '@/pages/contributions/show/_components/contribution-version-history';
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
