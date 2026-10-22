import { History } from 'lucide-react';
import { ProvenanceFacts } from '@/components/portfolio/public/provenance-facts';
import { VerificationMark } from '@/components/portfolio/public/verification-mark';
import type {
    PortfolioVerificationLevel,
    PublicPortfolioEntry,
} from '@/types/portfolio';

const verificationDescriptions: Record<PortfolioVerificationLevel, string> = {
    self_reported: 'Catatan pekerjaan yang dinyatakan oleh pemilik portofolio.',
    team_confirmed: 'Kontribusi yang dikonfirmasi oleh rekan satu tim.',
    institution_verified: 'Kontribusi yang disetujui melalui validasi kampus.',
};

export function FeaturedEntry({ entry }: { entry: PublicPortfolioEntry }) {
    return (
        <article
            className="grid min-w-0 gap-6 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-8"
            data-test="public-featured-entry"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold [overflow-wrap:anywhere] text-primary">
                    Karya terbaru
                </p>
                <VerificationMark entry={entry} />
            </div>
            <div className="grid min-w-0 gap-3">
                <h3 className="max-w-[42ch] text-2xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
                    {entry.title}
                </h3>
                <p className="max-w-[72ch] text-base leading-8 [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {entry.summary}
                </p>
            </div>
            <p className="flex items-start gap-2 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                <History
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-primary"
                />
                {verificationDescriptions[entry.verification_level]}
            </p>
            <ProvenanceFacts entry={entry} />
        </article>
    );
}
