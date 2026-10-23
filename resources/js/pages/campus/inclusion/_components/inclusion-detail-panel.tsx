import { FileText } from 'lucide-react';
import type { FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { CampusTechnicalDetails } from '@/pages/campus/_components/campus-operation-layout';
import { InclusionDecisionForm } from '@/pages/campus/inclusion/_components/inclusion-decision-form';
import { InclusionEvidenceSummary } from '@/pages/campus/inclusion/_components/inclusion-evidence-summary';
import { conclusions } from '@/pages/campus/inclusion/_types/inclusion-types';
import type { InclusionSignalItem } from '@/pages/campus/inclusion/_types/inclusion-types';

interface InclusionDetailPanelProps {
    selectedSignal: InclusionSignalItem | null;
    form: {
        data: {
            human_conclusion: string;
            support_action: string;
            reason: string;
        };
        setData: (
            key: 'human_conclusion' | 'support_action' | 'reason',
            value: string,
        ) => void;
        errors: Partial<
            Record<'human_conclusion' | 'support_action' | 'reason', string>
        >;
        processing: boolean;
    };
    busy: boolean;
    onSubmitReview: (event: FormEvent<HTMLFormElement>) => void;
}

export function InclusionDetailPanel({
    selectedSignal,
    form,
    busy,
    onSubmitReview,
}: InclusionDetailPanelProps) {
    return (
        <aside
            aria-labelledby="inclusion-detail-heading"
            className={cn(
                'min-w-0 rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5 xl:order-last',
                selectedSignal ? 'order-first' : 'order-last',
            )}
        >
            <h2
                id="inclusion-detail-heading"
                tabIndex={-1}
                className="flex items-center gap-2 text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring"
            >
                <FileText aria-hidden="true" className="size-5 text-primary" />
                Bukti dan keputusan
            </h2>
            {!selectedSignal ? (
                <div className="mt-4 rounded-2xl bg-accent/50 p-4 text-sm leading-6 text-muted-foreground">
                    Pilih berkas dari antrean. Baca kecukupan data, bukti, dan
                    riwayat sebelum mencatat kesimpulan.
                </div>
            ) : (
                <div
                    className="mt-4 min-w-0 space-y-5"
                    data-test="inclusion-detail"
                >
                    <div className="min-w-0 rounded-2xl bg-accent/50 p-4">
                        <p className="text-xs font-semibold text-primary">
                            Berkas IN-{selectedSignal.id}
                        </p>
                        <p className="mt-1 text-base font-bold wrap-anywhere">
                            {selectedSignal.subject_name ||
                                `Mahasiswa #${selectedSignal.subject_id}`}
                        </p>
                        <p className="mt-2 text-xs leading-5 wrap-anywhere text-muted-foreground">
                            Periode {selectedSignal.period}. Versi{' '}
                            {selectedSignal.version ?? 'belum tersedia'}.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {selectedSignal.data_sufficiency_met
                                ? 'Kecukupan data terpenuhi. Tetap periksa konteks faktual.'
                                : 'Data belum cukup. Jangan menarik kesimpulan analitis dari bukti terbatas.'}
                        </p>
                    </div>
                    <section aria-label="Ringkasan bukti">
                        <h3 className="mb-3 text-sm font-bold">
                            Bukti faktual
                        </h3>
                        <InclusionEvidenceSummary
                            evidence={selectedSignal.evidence_summary}
                        />
                    </section>
                    {selectedSignal.reviews.length > 0 && (
                        <CampusTechnicalDetails
                            title={`Riwayat tinjauan (${selectedSignal.reviews.length})`}
                        >
                            <ol className="space-y-4">
                                {selectedSignal.reviews.map((review) => (
                                    <li
                                        key={review.id}
                                        className="border-b border-border pb-3 last:border-0"
                                    >
                                        <p className="font-semibold text-foreground">
                                            {conclusions[
                                                review.human_conclusion
                                            ] ?? review.human_conclusion}
                                        </p>
                                        <p className="mt-1 text-xs">
                                            {review.reviewer_name ??
                                                'Peninjau kampus'}
                                        </p>
                                        <p className="mt-2 wrap-anywhere">
                                            {review.reason}
                                        </p>
                                        {review.support_action && (
                                            <p className="mt-1 wrap-anywhere">
                                                Tindakan:{' '}
                                                {review.support_action}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </CampusTechnicalDetails>
                    )}
                    <InclusionDecisionForm
                        form={form}
                        busy={busy}
                        onSubmit={onSubmitReview}
                    />
                </div>
            )}
        </aside>
    );
}
