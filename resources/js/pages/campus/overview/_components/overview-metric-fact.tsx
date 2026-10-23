import { numberFormatter } from '@/pages/campus/overview/_types/overview-types';

export function OverviewMetricFact({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div>
            <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold">
                {numberFormatter.format(value)}
            </dd>
        </div>
    );
}
