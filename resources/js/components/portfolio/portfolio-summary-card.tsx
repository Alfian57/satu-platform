import { FileText } from 'lucide-react';

export function PortfolioSummaryCard({ summary }: { summary: string | null }) {
    return (
        <section
            aria-labelledby="portfolio-summary-title"
            className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-7"
            data-test="portfolio-entry-summary"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <FileText aria-hidden="true" className="size-5" />
                </span>
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Cerita pekerjaan
                    </p>
                    <h2
                        id="portfolio-summary-title"
                        className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                    >
                        Ringkasan karya
                    </h2>
                </div>
            </div>
            <p className="max-w-[72ch] text-base leading-8 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {summary || 'Ringkasan karya belum tersedia.'}
            </p>
        </section>
    );
}
