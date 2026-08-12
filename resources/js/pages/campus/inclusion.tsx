import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    FileText,
    Filter,
    HelpCircle,
    Info,
    Shield,
    ShieldAlert,
    UserCheck,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';

interface InclusionReviewItem {
    id: number;
    inclusion_signal_id: number;
    reviewer_id: number;
    reviewer_name?: string;
    human_conclusion: string;
    support_action?: string | null;
    reason: string;
    created_at?: string;
}

interface InclusionSignalItem {
    id: number;
    institution_id: number;
    subject_id: number;
    subject_name?: string;
    version_id: number;
    version?: string;
    period: string;
    restricted_feature_state: boolean;
    data_sufficiency_met: boolean;
    evidence_summary?: Record<string, unknown> | null;
    created_at?: string;
    reviews: InclusionReviewItem[];
}

interface PaginatedSignals {
    items: InclusionSignalItem[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface CampusInclusionProps {
    institution: {
        id: number;
        name: string;
    };
    engineActive: boolean;
    signals: PaginatedSignals;
    filters: {
        period: string | null;
        restricted_only: boolean;
    };
    selectedSignal: InclusionSignalItem | null;
}

export default function CampusInclusion({
    institution,
    engineActive,
    signals,
    filters,
    selectedSignal,
}: CampusInclusionProps) {
    const [period, setPeriod] = useState(filters.period || '');
    const [restrictedOnly, setRestrictedOnly] = useState(
        filters.restricted_only,
    );
    const [isPending, startTransition] = useTransition();

    const { data, setData, post, processing, errors, reset } = useForm({
        human_conclusion: 'acknowledged',
        support_action: '',
        reason: '',
    });

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            router.get(
                `/campus/${institution.id}/inclusion`,
                {
                    period: period || undefined,
                    restricted_only: restrictedOnly ? '1' : '0',
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        });
    };

    const handleSelectSignal = (signalId: number) => {
        startTransition(() => {
            router.get(
                `/campus/${institution.id}/inclusion`,
                {
                    period: period || undefined,
                    restricted_only: restrictedOnly ? '1' : '0',
                    signal_id: signalId,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        });
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSignal) {
            return;
        }

        post(
            `/campus/${institution.id}/inclusion/${selectedSignal.id}/reviews`,
            {
                onSuccess: () => {
                    reset('reason', 'support_action');
                },
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout>
            <Head
                title={`Peninjauan Inklusi Mahasiswa - ${institution.name}`}
            />

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="border-b border-border pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-500">
                                <Shield className="size-4" />
                                <span>Restricted Operational Surface</span>
                            </div>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                Peninjauan Inklusi Mahasiswa
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Register pengecualian terbatas untuk meninjau
                                pola partisipasi dan kecukupan kesempatan di{' '}
                                <span className="font-semibold">
                                    {institution.name}
                                </span>
                                .
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feature State Banners */}
                {!engineActive ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-900 dark:text-amber-200">
                        <div className="flex items-start gap-4">
                            <ShieldAlert className="mt-0.5 size-6 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <h2 className="text-base font-semibold">
                                    Engine Inklusi Non-Aktif / Mode Sintetis
                                </h2>
                                <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-300/90">
                                    Fitur analisis pola inklusi saat ini dalam
                                    status non-aktif atau dibatasi untuk
                                    demonstrasi sintetis. Tidak ada data inklusi
                                    nyata yang diproses sampai persetujuan tata
                                    kelola (DPIA) selesai.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-xs">
                        <Info className="size-4 shrink-0 text-primary" />
                        <span>
                            Halaman ini terlindungi otorisasi perikatan kampus
                            dan audit-on-access. Semua keputusan wajib
                            mencantumkan alasan manusia (*human conclusion &
                            reason*) tanpa label diagnostik.
                        </span>
                    </div>
                )}

                {/* Filter Controls */}
                <form
                    onSubmit={handleFilterSubmit}
                    className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-xs"
                >
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                        <div className="space-y-1">
                            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                Periode Akademik
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: 2026-S1"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                            <input
                                type="checkbox"
                                id="restrictedOnly"
                                checked={restrictedOnly}
                                onChange={(e) =>
                                    setRestrictedOnly(e.target.checked)
                                }
                                className="size-4 rounded border-input text-primary focus:ring-primary"
                            />
                            <label
                                htmlFor="restrictedOnly"
                                className="cursor-pointer text-xs font-medium text-foreground"
                            >
                                Tampilkan Hanya Sinyal Terbatas (Restricted
                                State)
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending || !engineActive}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                    >
                        <Filter className="size-4" />
                        <span>Filter Antrean</span>
                    </button>
                </form>

                {/* Queue & Details Container */}
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left: Restricted Queue List */}
                    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-7">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-foreground">
                                    Antrean Peninjauan Inklusi
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pilih item untuk melihat bukti faktual dan
                                    mencatat keputusan peninjauan
                                </p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                Total: {signals.pagination.total}
                            </span>
                        </div>

                        <div className="space-y-3" aria-busy={isPending}>
                            {isPending && (
                                <div className="sr-only" role="status">
                                    Memuat antrean inklusi...
                                </div>
                            )}

                            {isPending ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={`skel-${i}`}
                                        className="space-y-2 rounded-lg border border-border p-4"
                                    >
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-60" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                ))
                            ) : signals.items.length === 0 ? (
                                <div className="space-y-2 py-12 text-center text-xs text-muted-foreground">
                                    <CheckCircle2 className="mx-auto size-8 text-emerald-500/70" />
                                    <p className="font-medium text-foreground">
                                        Antrean Peninjauan Kosong
                                    </p>
                                    <p>
                                        Tidak ada sinyal inklusi yang
                                        membutuhkan perhatian pada filter ini.
                                    </p>
                                </div>
                            ) : (
                                signals.items.map((signal) => {
                                    const isSelected =
                                        selectedSignal?.id === signal.id;
                                    const reviewCount = signal.reviews.length;
                                    const latestReview =
                                        reviewCount > 0
                                            ? signal.reviews[reviewCount - 1]
                                            : null;

                                    return (
                                        <div
                                            key={signal.id}
                                            onClick={() =>
                                                handleSelectSignal(signal.id)
                                            }
                                            className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/40 ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-card'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {signal.subject_name ||
                                                                `Mahasiswa #${signal.subject_id}`}
                                                        </span>
                                                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                                            {signal.period}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {signal.data_sufficiency_met
                                                            ? 'Kecukupan data terpenuhi'
                                                            : 'Data belum cukup untuk analisis penuh'}
                                                    </p>
                                                </div>

                                                <div className="space-y-1 text-right">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                            signal.restricted_feature_state
                                                                ? 'bg-amber-500/10 text-amber-600'
                                                                : 'bg-emerald-500/10 text-emerald-600'
                                                        }`}
                                                    >
                                                        {signal.restricted_feature_state
                                                            ? 'Perlu Tinjauan'
                                                            : 'Normal'}
                                                    </span>
                                                    {latestReview && (
                                                        <p className="text-[10px] font-medium text-muted-foreground capitalize">
                                                            Status:{' '}
                                                            {
                                                                latestReview.human_conclusion
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {signal.evidence_summary && (
                                                <div className="mt-3 rounded bg-muted/50 p-2 font-mono text-xs text-muted-foreground">
                                                    {typeof signal.evidence_summary ===
                                                    'object'
                                                        ? JSON.stringify(
                                                              signal.evidence_summary,
                                                          ).slice(0, 100) +
                                                          '...'
                                                        : String(
                                                              signal.evidence_summary,
                                                          )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right: Selected Signal Details & Review Form */}
                    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-5">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                                <FileText className="size-5 text-primary" />
                                <span>Detail & Keputusan Manusia</span>
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Bukti faktual konteks kesempatan dan form
                                peninjauan aman
                            </p>
                        </div>

                        {!selectedSignal ? (
                            <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                                <HelpCircle className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                                Pilih sinyal pada antrean di sebelah kiri untuk
                                meninjau bukti dan memberikan tindakan
                                pendukung.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Signal Details */}
                                <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-xs">
                                    <div className="flex justify-between border-b border-border/60 pb-2">
                                        <span className="text-muted-foreground">
                                            Subjek Mahasiswa:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {selectedSignal.subject_name} (#
                                            {selectedSignal.subject_id})
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/60 pb-2">
                                        <span className="text-muted-foreground">
                                            Periode / Versi:
                                        </span>
                                        <span className="font-mono text-foreground">
                                            {selectedSignal.period} (v
                                            {selectedSignal.version || '1.0'})
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/60 pb-2">
                                        <span className="text-muted-foreground">
                                            Kecukupan Data:
                                        </span>
                                        <span
                                            className={
                                                selectedSignal.data_sufficiency_met
                                                    ? 'font-medium text-emerald-600'
                                                    : 'font-medium text-amber-600'
                                            }
                                        >
                                            {selectedSignal.data_sufficiency_met
                                                ? 'Terpenuhi (Sufficient)'
                                                : 'Kurang (Sparse Data)'}
                                        </span>
                                    </div>

                                    {selectedSignal.evidence_summary && (
                                        <div className="space-y-1">
                                            <span className="font-medium text-muted-foreground">
                                                Bukti Faktual Pola:
                                            </span>
                                            <pre className="overflow-x-auto rounded border border-border bg-background p-2 font-mono text-[11px] text-foreground">
                                                {JSON.stringify(
                                                    selectedSignal.evidence_summary,
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                {/* Previous Reviews History */}
                                {selectedSignal.reviews.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-foreground">
                                            Riwayat Peninjauan Sebelumnya
                                        </h3>
                                        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                            {selectedSignal.reviews.map(
                                                (rev) => (
                                                    <div
                                                        key={rev.id}
                                                        className="space-y-1 rounded border border-border bg-background p-3 text-xs"
                                                    >
                                                        <div className="flex justify-between font-medium">
                                                            <span className="text-primary capitalize">
                                                                {
                                                                    rev.human_conclusion
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {
                                                                    rev.reviewer_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <p className="text-muted-foreground">
                                                            {rev.reason}
                                                        </p>
                                                        {rev.support_action && (
                                                            <p className="text-[11px] font-medium text-emerald-600">
                                                                Tindakan:{' '}
                                                                {
                                                                    rev.support_action
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Review Decision Form */}
                                <form
                                    onSubmit={handleReviewSubmit}
                                    className="space-y-4 border-t border-border pt-4"
                                >
                                    <h3 className="text-sm font-bold text-foreground">
                                        Form Keputusan Peninjau
                                    </h3>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Keputusan Manusia (*Conclusion*)
                                        </label>
                                        <select
                                            value={data.human_conclusion}
                                            onChange={(e) =>
                                                setData(
                                                    'human_conclusion',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="acknowledged">
                                                Telah Ditinjau (Acknowledged)
                                            </option>
                                            <option value="dismissed">
                                                Abaikan / Sinyal Tidak Relevan
                                                (Dismissed)
                                            </option>
                                            <option value="outreach_recorded">
                                                Catat Tindakan Pendukung
                                                (Outreach Recorded)
                                            </option>
                                        </select>
                                        {errors.human_conclusion && (
                                            <p className="text-[11px] text-destructive">
                                                {errors.human_conclusion}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Tindakan Pendukung / Dukungan
                                            Kesempatan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Menawarkan kesempatan proyek pendampingan"
                                            value={data.support_action}
                                            onChange={(e) =>
                                                setData(
                                                    'support_action',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                        {errors.support_action && (
                                            <p className="text-[11px] text-destructive">
                                                {errors.support_action}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Alasan Keputusan (*Reason* - Wajib)
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Jelaskan alasan faktual tinjauan tanpa bahasa diagnostik atau stigmatisasi..."
                                            value={data.reason}
                                            onChange={(e) =>
                                                setData(
                                                    'reason',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-md border border-input bg-background p-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                        {errors.reason && (
                                            <p className="text-[11px] text-destructive">
                                                {errors.reason}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                                    >
                                        <UserCheck className="size-4" />
                                        <span>Simpan Keputusan Peninjauan</span>
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
