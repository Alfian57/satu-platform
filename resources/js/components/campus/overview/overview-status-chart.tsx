import { numberFormatter } from '@/components/campus/overview/overview-types';
import type { ChartSegment } from '@/components/campus/overview/overview-types';
import { cn } from '@/lib/utils';

interface OverviewStatusChartProps {
    segments: ChartSegment[];
    variant: 'ring' | 'bar';
    label: string;
}

export function OverviewStatusChart({
    segments,
    variant,
    label,
}: OverviewStatusChartProps) {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    if (total <= 0) {
        return (
            <p className="rounded-xl bg-accent/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                Belum ada data untuk grafik ini.
            </p>
        );
    }

    return (
        <figure
            aria-label={label}
            className={cn(
                'min-w-0',
                variant === 'ring' && 'flex items-center gap-3',
            )}
        >
            {variant === 'ring' ? (
                <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    className="size-22 shrink-0 -rotate-90"
                >
                    {segments.map((segment, index) => {
                        const percent = (segment.value / total) * 100;
                        const start =
                            (segments
                                .slice(0, index)
                                .reduce(
                                    (sum, previous) => sum + previous.value,
                                    0,
                                ) /
                                total) *
                            100;

                        return (
                            <circle
                                key={segment.label}
                                cx="50"
                                cy="50"
                                r="38"
                                pathLength="100"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeDasharray={`${percent} ${100 - percent}`}
                                strokeDashoffset={-start}
                                className={segment.color}
                            />
                        );
                    })}
                </svg>
            ) : (
                <div
                    aria-hidden="true"
                    className="mb-3 flex h-3 overflow-hidden rounded-full bg-accent"
                >
                    {segments
                        .filter((segment) => segment.value > 0)
                        .map((segment) => (
                            <span
                                key={segment.label}
                                className={cn(
                                    'h-full border-r-2 border-white bg-current last:border-r-0',
                                    segment.color,
                                )}
                                style={{
                                    width: `${(segment.value / total) * 100}%`,
                                }}
                            />
                        ))}
                </div>
            )}
            <figcaption className="min-w-0 flex-1">
                <dl className="space-y-1.5 text-xs leading-5">
                    {segments.map((segment) => (
                        <div
                            key={segment.label}
                            className="flex items-baseline justify-between gap-3"
                        >
                            <dt className="flex min-w-0 items-baseline gap-2 text-muted-foreground">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'size-2 shrink-0 self-center rounded-full bg-current',
                                        segment.color,
                                    )}
                                />
                                {segment.label}
                            </dt>
                            <dd className="shrink-0 font-label font-semibold">
                                {numberFormatter.format(segment.value)}
                            </dd>
                        </div>
                    ))}
                </dl>
            </figcaption>
        </figure>
    );
}
