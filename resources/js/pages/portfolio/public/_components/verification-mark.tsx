import { PortfolioVerificationBadge } from '@/pages/portfolio/_utils/portfolio-presentation';
import type { PublicPortfolioEntry } from '@/types/portfolio';

export function VerificationMark({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <div
            className="max-w-full min-w-0"
            data-test={'public-entry-verification-' + entry.id}
        >
            <PortfolioVerificationBadge entry={entry} />
        </div>
    );
}
