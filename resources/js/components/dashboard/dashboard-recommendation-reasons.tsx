import { AlertCircle, Check, Info } from 'lucide-react';

export function DashboardRecommendationReasons({
    reasons,
    reasonTypes,
    limitations,
}: {
    reasons: string[];
    reasonTypes?: string[];
    limitations?: string[];
}) {
    return (
        <>
            <p className="px-4 pt-4 text-xs font-semibold text-muted-foreground">
                Mengapa disarankan
            </p>
            <ul
                aria-label="Alasan kecocokan proyek"
                className="grid gap-3 px-4 pt-3 pb-4"
                data-test="dashboard-recommendation-reasons"
            >
                {reasons.map((reason, index) => (
                    <li
                        key={`${index}-${reason}`}
                        className="flex min-w-0 items-start gap-2.5 text-sm leading-6 text-foreground"
                        data-test="dashboard-recommendation-reason"
                    >
                        <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                            {reasonTypes?.[index] === 'positive' ? (
                                <Check
                                    aria-hidden="true"
                                    className="size-3 stroke-2"
                                />
                            ) : reasonTypes?.[index] === 'attention' ? (
                                <AlertCircle
                                    aria-hidden="true"
                                    className="size-3"
                                />
                            ) : (
                                <Info aria-hidden="true" className="size-3" />
                            )}
                        </span>
                        <span className="min-w-0 wrap-anywhere">{reason}</span>
                    </li>
                ))}
            </ul>

            {limitations && limitations.length > 0 && (
                <div
                    className="border-t border-border/60 px-4 py-3 text-xs leading-5 text-muted-foreground"
                    data-test="dashboard-recommendation-limitations"
                >
                    <p className="font-semibold text-foreground">
                        Batas pencocokan
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                        {limitations.map((limitation) => (
                            <li key={limitation}>{limitation}</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
