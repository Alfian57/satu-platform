import { ClipboardCheck, FileSpreadsheet, Lock } from 'lucide-react';
import { formatDate } from '@/components/campus/affiliations/affiliation-types';
import type { ReviewQueue } from '@/components/campus/affiliations/affiliation-types';

export function AffiliationSummaryRail({
    reviewQueue,
}: {
    reviewQueue: ReviewQueue;
}) {
    return (
        <div className="space-y-4">
            <section
                aria-labelledby="queue-summary-title"
                className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
            >
                <h2
                    id="queue-summary-title"
                    className="flex items-center gap-2 text-base font-semibold"
                >
                    <ClipboardCheck
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />
                    Ringkasan antrean
                </h2>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                    {reviewQueue.summary.total}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                        berkas menunggu
                    </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Seluruh antrean kampus, bukan hanya hasil filter.
                </p>
                <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                    {[
                        {
                            label: 'Perlu pemeriksaan',
                            value: reviewQueue.summary.mismatch,
                        },
                        {
                            label: 'Roster berubah',
                            value: reviewQueue.summary.stale,
                        },
                        {
                            label: 'Cocok persis',
                            value: reviewQueue.summary.exact,
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="flex items-baseline justify-between gap-3"
                        >
                            <dt className="text-muted-foreground">
                                {item.label}
                            </dt>
                            <dd className="font-label font-semibold">
                                {item.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Roster berubah dapat termasuk dalam kategori hasil
                    pencocokan lainnya.
                </p>
            </section>
            <section
                aria-labelledby="roster-context-title"
                className="rounded-3xl border border-primary/10 bg-accent/45 p-4 sm:p-5"
            >
                <h2
                    id="roster-context-title"
                    className="flex items-center gap-2 text-base font-semibold"
                >
                    <FileSpreadsheet
                        aria-hidden="true"
                        className="size-4 text-primary"
                    />{' '}
                    Roster aktif
                </h2>
                {reviewQueue.activeRoster ? (
                    <dl className="mt-3 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Semester
                            </dt>
                            <dd className="mt-1 font-semibold break-words">
                                {reviewQueue.activeRoster.semester}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Diaktifkan
                            </dt>
                            <dd className="mt-1">
                                {formatDate(
                                    reviewQueue.activeRoster.activatedAt,
                                )}
                            </dd>
                        </div>
                    </dl>
                ) : (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Belum ada roster aktif. Permintaan tetap tercatat untuk
                        pemeriksaan manual.
                    </p>
                )}
            </section>
            <section aria-labelledby="lock-guidance-title" className="px-1">
                <h2
                    id="lock-guidance-title"
                    className="flex items-center gap-2 text-sm font-semibold"
                >
                    <Lock aria-hidden="true" className="size-4 text-primary" />{' '}
                    Satu berkas, satu peninjau
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Ambil kunci sebelum menyimpan keputusan. Kunci berlaku 30
                    menit untuk mencegah benturan antaroperator.
                </p>
            </section>
        </div>
    );
}
