import { Clock3, FolderKanban, Users } from 'lucide-react';
import { OverviewMetricCard } from '@/pages/campus/overview/_components/overview-metric-card';
import { OverviewMetricFact } from '@/pages/campus/overview/_components/overview-metric-fact';
import { OverviewStatusChart } from '@/pages/campus/overview/_components/overview-status-chart';
import { numberFormatter } from '@/pages/campus/overview/_types/overview-types';
import type { OverviewMetrics } from '@/pages/campus/overview/_types/overview-types';

interface OverviewMetricsGridProps {
    metrics: OverviewMetrics;
    isPending: boolean;
}

export function OverviewMetricsGrid({
    metrics,
    isPending,
}: OverviewMetricsGridProps) {
    return (
        <section
            aria-labelledby="campus-metrics-heading"
            aria-busy={isPending}
            className="@container space-y-4"
        >
            <h2 id="campus-metrics-heading" className="sr-only">
                Fakta dalam cakupan ringkasan
            </h2>
            <div className="grid min-w-0 gap-4 @min-[30rem]:grid-cols-2 @min-[46rem]:grid-cols-3">
                <OverviewMetricCard
                    title="Keanggotaan tercatat"
                    value={numberFormatter.format(metrics.memberships.total)}
                    icon={<Users aria-hidden="true" className="size-5" />}
                    description="Mahasiswa dan operator, tidak termasuk afiliasi ditangguhkan."
                >
                    <OverviewStatusChart
                        label="Komposisi keanggotaan tercatat"
                        variant="ring"
                        segments={[
                            {
                                label: 'Terverifikasi',
                                value: metrics.memberships.verified,
                                color: 'text-verified',
                            },
                            {
                                label: 'Menunggu',
                                value: metrics.memberships.pending,
                                color: 'text-pending',
                            },
                            {
                                label: 'Belum terverifikasi',
                                value: metrics.memberships.unverified,
                                color: 'text-muted-foreground',
                            },
                        ]}
                    />
                </OverviewMetricCard>
                <OverviewMetricCard
                    title="Proyek kampus"
                    value={numberFormatter.format(metrics.projects.total)}
                    icon={
                        <FolderKanban aria-hidden="true" className="size-5" />
                    }
                    description="Periode terpilih, tidak difilter program studi."
                >
                    <OverviewStatusChart
                        label="Komposisi status proyek kampus"
                        variant="bar"
                        segments={[
                            {
                                label: 'Aktif',
                                value: metrics.projects.active,
                                color: 'text-primary',
                            },
                            {
                                label: 'Ditutup/diarsipkan',
                                value: metrics.projects.completed,
                                color: 'text-verified',
                            },
                            {
                                label: 'Draft',
                                value: metrics.projects.draft,
                                color: 'text-muted-foreground',
                            },
                            ...(metrics.projects.total >
                            metrics.projects.active +
                                metrics.projects.completed +
                                metrics.projects.draft
                                ? [
                                      {
                                          label: 'Status lainnya',
                                          value:
                                              metrics.projects.total -
                                              metrics.projects.active -
                                              metrics.projects.completed -
                                              metrics.projects.draft,
                                          color: 'text-pending',
                                      },
                                  ]
                                : []),
                        ]}
                    />
                </OverviewMetricCard>
                <OverviewMetricCard
                    title="Waktu tinjauan afiliasi"
                    value={
                        metrics.review_turnaround.total_reviewed > 0 ? (
                            <>
                                {numberFormatter.format(
                                    metrics.review_turnaround.average_hours,
                                )}
                                <span className="ml-2 text-base font-medium text-muted-foreground">
                                    jam
                                </span>
                            </>
                        ) : (
                            <span className="text-xl">Belum tersedia</span>
                        )
                    }
                    icon={<Clock3 aria-hidden="true" className="size-5" />}
                    description={
                        metrics.review_turnaround.total_reviewed > 0
                            ? `Rata-rata dari ${numberFormatter.format(metrics.review_turnaround.total_reviewed)} keputusan afiliasi, bukan target SLA.`
                            : 'Belum ada keputusan afiliasi pada periode ini.'
                    }
                >
                    <dl className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <OverviewMetricFact
                            label="Disetujui"
                            value={metrics.review_turnaround.approved_count}
                        />
                        <OverviewMetricFact
                            label="Perlu revisi"
                            value={metrics.review_turnaround.revision_count}
                        />
                        <OverviewMetricFact
                            label="Ditolak"
                            value={metrics.review_turnaround.rejected_count}
                        />
                    </dl>
                </OverviewMetricCard>
            </div>
            <p className="px-1 text-xs leading-5 text-muted-foreground">
                Proyek aktif mencakup status terbuka, pembentukan tim, dan tim
                penuh. Ditutup atau diarsipkan tidak otomatis berarti karya
                selesai.
            </p>
        </section>
    );
}
