import { CampusTechnicalDetails } from '@/components/campus-operation-layout';

const labels: Record<string, string> = {
    event_count: 'Peristiwa kolaborasi',
    threshold_used: 'Ambang kecukupan data',
    received_count: 'Peristiwa yang diterima',
};

export function InclusionEvidenceSummary({
    evidence,
}: {
    evidence: Record<string, unknown> | null | undefined;
}) {
    if (!evidence || Object.keys(evidence).length === 0) {
        return (
            <p className="text-sm leading-6 text-muted-foreground">
                Ringkasan bukti belum tersedia. Jangan menyimpulkan keadaan
                mahasiswa tanpa konteks yang memadai.
            </p>
        );
    }

    return (
        <div className="min-w-0 space-y-3">
            <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(labels)
                    .filter(([key]) => typeof evidence[key] === 'number')
                    .map(([key, label]) => (
                        <div
                            key={key}
                            className="min-w-0 border-b border-border pb-3"
                        >
                            <dt className="text-xs leading-5 text-muted-foreground">
                                {label}
                            </dt>
                            <dd className="mt-1 text-lg font-semibold tabular-nums">
                                {String(evidence[key])}
                            </dd>
                        </div>
                    ))}
            </dl>
            {typeof evidence.factor === 'string' && (
                <p className="text-sm leading-6 wrap-anywhere text-muted-foreground">
                    {evidence.factor}
                </p>
            )}
            <CampusTechnicalDetails title="Rincian bukti sumber">
                <pre
                    tabIndex={0}
                    aria-label="Rincian teknis bukti inklusi"
                    className="max-h-52 max-w-full overflow-auto rounded-xl bg-white p-3 font-label text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    {JSON.stringify(evidence, null, 2)}
                </pre>
            </CampusTechnicalDetails>
        </div>
    );
}
