import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Info,
    LoaderCircle,
    Network,
    Shield,
    ShieldAlert,
    UserCheck,
    UserRound,
} from 'lucide-react';
import type React from 'react';
import { useState, useTransition } from 'react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { index as affiliationIndex } from '@/routes/campus/affiliations';
import { index as campusContributionsIndex } from '@/routes/campus/contributions';
import { show as campusRoster } from '@/routes/campus/roster';

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

function InclusionContextRail({
    institution,
}: {
    institution: { id: number; name: string };
}) {
    return (
        <div className="grid gap-6">
            {/* Card 1: Konteks Inklusi */}
            <section
                aria-labelledby="inclusion-scope-heading"
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Network className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                        KONTEKS INKLUSI
                    </p>
                </div>

                <h2
                    id="inclusion-scope-heading"
                    className="mt-3 text-base font-bold tracking-tight text-slate-950"
                >
                    Pemeriksaan Kesempatan
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Analisis Social Network Analysis (SNA) mengukur kesempatan
                    kolaborasi dan pencegahan isolasi akademik, bukan diagnosis
                    kesehatan mental.
                </p>
            </section>

            {/* Card 2: Keamanan & Privasi */}
            <section
                aria-labelledby="inclusion-privacy-heading"
                className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-amber-100/30 p-4.5"
            >
                <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 size-4.5 shrink-0 text-amber-700" />
                    <div>
                        <h2
                            id="inclusion-privacy-heading"
                            className="text-xs font-bold text-amber-900"
                        >
                            Akses Sangat Dibatasi
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                            Sinyal inklusi hanya dapat diakses oleh reviewer
                            kampus terotorisasi. Informasi ini tidak pernah
                            diekspos ke sesama mahasiswa maupun perekrut.
                        </p>
                    </div>
                </div>
            </section>

            {/* Card 3: Modul Terkait */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="font-label text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
                    MODUL OPERASIONAL
                </p>

                <div className="mt-3.5 grid gap-2">
                    <Link
                        href={affiliationIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <ClipboardCheck className="size-4 text-blue-600" />
                            <span>Review Afiliasi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>

                    <Link
                        href={campusContributionsIndex({
                            institution: institution.id,
                        })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <FileCheck2 className="size-4 text-indigo-600" />
                            <span>Validasi Kontribusi</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>

                    <Link
                        href={campusRoster({ institution: institution.id })}
                        prefetch
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
                    >
                        <div className="flex items-center gap-2.5">
                            <FileSpreadsheet className="size-4 text-emerald-600" />
                            <span>Roster Mahasiswa</span>
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>
                </div>
            </section>
        </div>
    );
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

    const handleSignalKeyDown = (e: React.KeyboardEvent, signalId: number) => {
        if (e.key !== 'Enter' && e.key !== ' ') {
            return;
        }

        e.preventDefault();
        handleSelectSignal(signalId);
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
        <>
            <Head
                title={`Peninjauan Inklusi Mahasiswa - ${institution.name} | SATU`}
            />

            <AppPage
                contextRail={<InclusionContextRail institution={institution} />}
                contextRailLabel="Konteks dan batas peninjauan inklusi"
            >
                <div className="space-y-6" data-test="campus-inclusion-root">
                    {/* Header Banner */}
                    <header className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-6 shadow-[0_18px_50px_-36px_rgba(30,64,175,0.35)] sm:px-8 sm:py-7">
                        <div
                            aria-hidden="true"
                            className="absolute -top-28 -right-24 size-80 rounded-full bg-violet-100/75 blur-3xl sm:-right-12"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute right-14 bottom-0 hidden h-24 w-24 rounded-tl-[2.5rem] border-t border-l border-violet-100 sm:block"
                        />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                    <Shield className="size-3 text-amber-600" />
                                    Permukaan Operasional Terbatas
                                </div>
                                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                                    Peninjauan Inklusi Mahasiswa
                                </h1>

                                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
                                    Register pengecualian terbatas untuk
                                    meninjau pola partisipasi dan kecukupan
                                    kesempatan mahasiswa di{' '}
                                    <span className="font-semibold text-slate-900">
                                        {institution.name}
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-800">
                                <Building2 className="size-4 text-blue-600" />
                                <span>{institution.name}</span>
                            </div>
                        </div>
                    </header>

                    {/* Feature State Notice / Inactive Banners */}
                    {!engineActive ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-950 shadow-xs">
                            <div className="flex items-start gap-3.5">
                                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
                                <div>
                                    <h2 className="text-sm font-bold text-amber-900">
                                        Engine Inklusi Non-Aktif / Mode Sintetis
                                    </h2>
                                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                        Fitur analisis pola inklusi saat ini
                                        dalam status non-aktif atau dibatasi
                                        untuk demonstrasi sintetis. Tidak ada
                                        data inklusi nyata yang diproses sampai
                                        persetujuan tata kelola (DPIA) selesai.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4.5 text-xs text-slate-600 shadow-xs">
                            <Info className="size-4 shrink-0 text-blue-600" />
                            <span>
                                Halaman ini terlindungi otorisasi perikatan
                                kampus dan <em>audit-on-access</em>. Semua
                                keputusan wajib mencantumkan alasan manusia (
                                <em>human conclusion & reason</em>) tanpa label
                                diagnostik.
                            </span>
                        </div>
                    )}

                    {/* Filter Card */}
                    <form
                        onSubmit={handleFilterSubmit}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                    >
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="flex flex-1 flex-wrap items-center gap-6">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="filter-period"
                                        className="text-xs font-bold text-slate-700"
                                    >
                                        Periode Akademik
                                    </Label>
                                    <Input
                                        id="filter-period"
                                        type="text"
                                        placeholder="Contoh: 2026-S1"
                                        value={period}
                                        onChange={(e) =>
                                            setPeriod(e.target.value)
                                        }
                                        className="h-10 w-44 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                    />
                                </div>

                                <div className="flex items-center gap-2.5 pt-5">
                                    <input
                                        type="checkbox"
                                        id="restrictedOnly"
                                        checked={restrictedOnly}
                                        onChange={(e) =>
                                            setRestrictedOnly(e.target.checked)
                                        }
                                        className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    <Label
                                        htmlFor="restrictedOnly"
                                        className="cursor-pointer text-xs font-semibold text-slate-700"
                                    >
                                        Tampilkan Hanya Sinyal Terbatas (Keadaan
                                        Terbatas)
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending || !engineActive}
                                data-test="inclusion-filter-button"
                                className="h-10 cursor-pointer rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Filter className="mr-1.5 size-3.5" />
                                Filter Antrean
                            </Button>
                        </div>
                    </form>

                    {/* Queue & Details Container (Grid 2 Columns) */}
                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Left: Queue List (7 Cols) */}
                        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Network className="size-4.5 text-blue-600" />
                                        <h2 className="text-base font-bold text-slate-900">
                                            Antrean Peninjauan Inklusi
                                        </h2>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Pilih item untuk melihat bukti faktual
                                        dan mencatat keputusan peninjauan
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                    Total: {signals.pagination.total}
                                </span>
                            </div>

                            <div
                                className="space-y-3"
                                aria-busy={isPending}
                                data-test="inclusion-queue"
                            >
                                {isPending ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={`skel-${i}`}
                                            className="space-y-2 rounded-xl border border-slate-100 p-4"
                                        >
                                            <Skeleton className="h-4 w-40 bg-slate-100" />
                                            <Skeleton className="h-3 w-60 bg-slate-100" />
                                            <Skeleton className="h-3 w-32 bg-slate-100" />
                                        </div>
                                    ))
                                ) : signals.items.length === 0 ? (
                                    <div className="grid justify-items-center gap-3 py-14 text-center">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                                            <CheckCircle2
                                                aria-hidden="true"
                                                className="size-7"
                                            />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900">
                                            Antrean Peninjauan Kosong
                                        </h3>
                                        <p className="mx-auto max-w-[45ch] text-xs leading-relaxed text-slate-500">
                                            Tidak ada sinyal inklusi yang
                                            membutuhkan perhatian pada filter
                                            ini.
                                        </p>
                                    </div>
                                ) : (
                                    signals.items.map((signal) => {
                                        const isSelected =
                                            selectedSignal?.id === signal.id;
                                        const reviewCount =
                                            signal.reviews.length;
                                        const latestReview =
                                            reviewCount > 0
                                                ? signal.reviews[
                                                      reviewCount - 1
                                                  ]
                                                : null;

                                        return (
                                            <article
                                                key={signal.id}
                                                onClick={() =>
                                                    handleSelectSignal(
                                                        signal.id,
                                                    )
                                                }
                                                onKeyDown={(e) =>
                                                    handleSignalKeyDown(
                                                        e,
                                                        signal.id,
                                                    )
                                                }
                                                role="button"
                                                tabIndex={0}
                                                aria-pressed={isSelected}
                                                data-test="inclusion-queue-item"
                                                className={cn(
                                                    'cursor-pointer rounded-2xl border p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none',
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                                                        : 'border-slate-200/80 bg-white hover:border-blue-300',
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-bold text-violet-600">
                                                            <UserRound className="size-4.5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-900">
                                                                    {signal.subject_name ||
                                                                        `Mahasiswa #${signal.subject_id}`}
                                                                </span>
                                                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[0.6875rem] font-semibold text-slate-600">
                                                                    {
                                                                        signal.period
                                                                    }
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {signal.data_sufficiency_met
                                                                    ? 'Kecukupan data terpenuhi'
                                                                    : 'Data belum cukup untuk analisis penuh'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 text-right">
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold ${
                                                                signal.restricted_feature_state
                                                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            }`}
                                                        >
                                                            {signal.restricted_feature_state
                                                                ? 'Perlu Tinjauan'
                                                                : 'Normal'}
                                                        </span>
                                                        {latestReview && (
                                                            <p className="text-[0.6875rem] font-medium text-slate-400 capitalize">
                                                                Status:{' '}
                                                                {
                                                                    latestReview.human_conclusion
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {signal.evidence_summary && (
                                                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 font-mono text-[0.6875rem] text-slate-600">
                                                        {typeof signal.evidence_summary ===
                                                        'object'
                                                            ? JSON.stringify(
                                                                  signal.evidence_summary,
                                                              ).slice(0, 120) +
                                                              '...'
                                                            : String(
                                                                  signal.evidence_summary,
                                                              )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: Selected Signal Details & Review Form (5 Cols) */}
                        <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-5">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                                    <FileText className="size-4.5 text-blue-600" />
                                    <span>Detail & Keputusan Manusia</span>
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Bukti faktual konteks kesempatan dan form
                                    peninjauan aman
                                </p>
                            </div>

                            {!selectedSignal ? (
                                <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                                    <HelpCircle className="size-8 text-slate-400" />
                                    <p className="max-w-[35ch] text-xs leading-relaxed text-slate-500">
                                        Pilih sinyal pada antrean di sebelah
                                        kiri untuk meninjau bukti dan memberikan
                                        tindakan pendukung.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className="space-y-6"
                                    data-test="inclusion-detail"
                                >
                                    {/* Signal Details */}
                                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs">
                                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                            <span className="text-slate-500">
                                                Subjek Mahasiswa:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {selectedSignal.subject_name} (#
                                                {selectedSignal.subject_id})
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                            <span className="text-slate-500">
                                                Periode / Versi:
                                            </span>
                                            <span className="font-mono font-semibold text-slate-700">
                                                {selectedSignal.period} (v
                                                {selectedSignal.version ||
                                                    '1.0'}
                                                )
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                            <span className="text-slate-500">
                                                Kecukupan Data:
                                            </span>
                                            <span
                                                className={`font-semibold ${
                                                    selectedSignal.data_sufficiency_met
                                                        ? 'text-emerald-700'
                                                        : 'text-amber-700'
                                                }`}
                                            >
                                                {selectedSignal.data_sufficiency_met
                                                    ? 'Terpenuhi (Cukup)'
                                                    : 'Kurang (Data Jarang)'}
                                            </span>
                                        </div>

                                        {selectedSignal.evidence_summary && (
                                            <div className="space-y-1 pt-1">
                                                <span className="font-bold text-slate-700">
                                                    Bukti Faktual Pola:
                                                </span>
                                                <pre
                                                    tabIndex={0}
                                                    className="max-h-40 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-[0.6875rem] text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                                                >
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
                                            <h3 className="text-xs font-bold text-slate-900">
                                                Riwayat Peninjauan Sebelumnya
                                            </h3>
                                            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                                {selectedSignal.reviews.map(
                                                    (rev) => (
                                                        <div
                                                            key={rev.id}
                                                            className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                                                        >
                                                            <div className="flex justify-between font-semibold">
                                                                <span className="text-blue-600 capitalize">
                                                                    {
                                                                        rev.human_conclusion
                                                                    }
                                                                </span>
                                                                <span className="font-mono text-[0.6875rem] text-slate-400">
                                                                    {
                                                                        rev.reviewer_name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-600">
                                                                {rev.reason}
                                                            </p>
                                                            {rev.support_action && (
                                                                <p className="text-[0.6875rem] font-semibold text-emerald-700">
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
                                        className="space-y-4 border-t border-slate-100 pt-4"
                                    >
                                        <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                                            Form Keputusan Peninjau
                                        </h3>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="human-conclusion"
                                                className="text-xs font-bold text-slate-700"
                                            >
                                                Keputusan Manusia (*Kesimpulan*)
                                            </Label>
                                            <select
                                                id="human-conclusion"
                                                value={data.human_conclusion}
                                                onChange={(e) =>
                                                    setData(
                                                        'human_conclusion',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                                            >
                                                <option value="acknowledged">
                                                    Telah Ditinjau (Diakui)
                                                </option>
                                                <option value="dismissed">
                                                    Abaikan / Sinyal Tidak
                                                    Relevan (Dikesampingkan)
                                                </option>
                                                <option value="outreach_recorded">
                                                    Catat Tindakan Pendukung
                                                    (Tindak Lanjut Tercatat)
                                                </option>
                                            </select>
                                            {errors.human_conclusion && (
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {errors.human_conclusion}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="support-action"
                                                className="text-xs font-bold text-slate-700"
                                            >
                                                Tindakan Pendukung / Dukungan
                                                Kesempatan (Opsional)
                                            </Label>
                                            <Input
                                                id="support-action"
                                                type="text"
                                                placeholder="Contoh: Menawarkan kesempatan proyek pendampingan"
                                                value={data.support_action}
                                                onChange={(e) =>
                                                    setData(
                                                        'support_action',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                            />
                                            {errors.support_action && (
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {errors.support_action}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="inclusion-reason"
                                                className="text-xs font-bold text-slate-700"
                                            >
                                                Alasan Keputusan (*Alasan* -
                                                Wajib)
                                            </Label>
                                            <textarea
                                                id="inclusion-reason"
                                                rows={3}
                                                placeholder="Jelaskan alasan faktual tinjauan tanpa bahasa diagnostik atau stigmatisasi..."
                                                value={data.reason}
                                                onChange={(e) =>
                                                    setData(
                                                        'reason',
                                                        e.target.value,
                                                    )
                                                }
                                                data-test="inclusion-reason"
                                                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
                                            />
                                            {errors.reason && (
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {errors.reason}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            data-test="inclusion-submit"
                                            className="h-10 w-full cursor-pointer rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                                            ) : (
                                                <UserCheck className="mr-1.5 size-3.5" />
                                            )}
                                            <span>
                                                Simpan Keputusan Peninjauan
                                            </span>
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppPage>
        </>
    );
}

CampusInclusion.layout = {
    breadcrumbs: [
        {
            title: 'Operasi Kampus',
            href: '#',
        },
        {
            title: 'Peninjauan Inklusi',
            href: '#',
        },
    ],
};
