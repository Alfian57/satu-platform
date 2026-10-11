import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    Info,
    LoaderCircle,
    Network,
    Shield,
    ShieldAlert,
    UserCheck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import {
    CampusOperationHeader,
    CampusTechnicalDetails,
    CampusWorkflowGuide,
    campusControlClass,
} from '@/components/campus-operation-layout';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index as inclusionIndex } from '@/routes/campus/inclusion';
import { store as storeInclusionReview } from '@/routes/campus/inclusion/reviews';

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

const conclusions: Record<string, string> = {
    acknowledged: 'Telah ditinjau',
    dismissed: 'Sinyal tidak relevan',
    outreach_recorded: 'Tindakan pendukung tercatat',
};

function EvidenceSummary({
    evidence,
}: {
    evidence: Record<string, unknown> | null | undefined;
}) {
    const labels: Record<string, string> = {
        event_count: 'Peristiwa kolaborasi',
        threshold_used: 'Ambang kecukupan data',
        received_count: 'Peristiwa yang diterima',
    };

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
    const [isPending, setPending] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessUnavailable, setAccessUnavailable] = useState(false);
    const form = useForm({
        human_conclusion: 'acknowledged',
        support_action: '',
        reason: '',
    });
    const busy = isPending || form.processing;
    const available = engineActive && !accessUnavailable;

    function visit(signalId?: number, page = 1) {
        if (busy || !engineActive) {
            return;
        }

        setPending(true);
        setFeedback(null);
        setSuccess(null);
        router.get(
            inclusionIndex({ institution: institution.id }).url,
            {
                period: period || undefined,
                restricted_only: restrictedOnly ? '1' : '0',
                signal_id: signalId,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAccessUnavailable(false);

                    if (
                        signalId !== undefined &&
                        signalId !== selectedSignal?.id
                    ) {
                        form.reset();
                        form.clearErrors();
                        window.setTimeout(
                            () =>
                                document
                                    .getElementById('inclusion-detail-heading')
                                    ?.focus(),
                            0,
                        );
                    }
                },
                onError: () =>
                    setFeedback(
                        'Antrean belum diperbarui. Periksa filter lalu coba lagi.',
                    ),
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                    }

                    setFeedback(
                        'Antrean tidak dapat dimuat. Periksa akses dan muat ulang.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setFeedback(
                        'Antrean belum diperbarui. Periksa koneksi lalu coba lagi.',
                    );

                    return false;
                },
                onFinish: () => setPending(false),
            },
        );
    }

    function submitReview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedSignal || busy || !available) {
            return;
        }

        setFeedback(null);
        setSuccess(null);
        form.post(
            storeInclusionReview({
                institution: institution.id,
                signal: selectedSignal.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset('reason', 'support_action');
                    setSuccess(
                        'Keputusan peninjauan tersimpan. Riwayat telah diperbarui.',
                    );
                },
                onError: () =>
                    setFeedback(
                        'Keputusan belum tersimpan. Periksa isian yang ditandai.',
                    ),
                onHttpException: (response) => {
                    if (response.status === 403 || response.status === 404) {
                        setAccessUnavailable(true);
                    }

                    setFeedback(
                        'Keputusan belum dapat dikonfirmasi. Periksa akses dan muat ulang sebelum mencoba kembali.',
                    );

                    return false;
                },
                onNetworkError: () => {
                    setFeedback(
                        'Hasil penyimpanan belum dapat dikonfirmasi. Periksa koneksi dan muat ulang sebelum mencoba kembali.',
                    );

                    return false;
                },
            },
        );
    }

    return (
        <>
            <Head title={`Peninjauan Inklusi - ${institution.name} | SATU`} />
            <AppPage>
                <div className="space-y-6" data-test="campus-inclusion-root">
                    <CampusOperationHeader
                        title="Peninjauan inklusi"
                        description="Tinjau kesempatan kolaborasi dengan konteks yang memadai. Catat kesimpulan manusia, bukan diagnosis atau penilaian pribadi."
                        institution={institution.name}
                        icon={Network}
                        eyebrow="Peninjauan terbatas"
                    />
                    <div className="flex items-start gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-4 text-sm leading-6 text-pending-subtle-foreground">
                        <Shield
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <p>
                            Hanya peninjau kampus berotorisasi. Sinyal dan
                            catatan ini tidak ditampilkan kepada mahasiswa,
                            rekan tim, atau perekrut.
                        </p>
                    </div>
                    {feedback && (
                        <div
                            role="alert"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm text-correction-subtle-foreground"
                        >
                            <p>{feedback}</p>
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => visit()}
                            >
                                Muat ulang
                            </Button>
                        </div>
                    )}
                    {success && (
                        <p
                            role="status"
                            className="flex items-start gap-2 rounded-2xl border border-verified/30 bg-verified-subtle p-4 text-sm text-verified-subtle-foreground"
                        >
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {success}
                        </p>
                    )}
                    {!available ? (
                        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                            <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                                <ShieldAlert
                                    aria-hidden="true"
                                    className="size-8 text-pending-subtle-foreground"
                                />
                                <h2 className="mt-4 text-xl font-bold">
                                    {accessUnavailable
                                        ? 'Akses peninjauan tidak tersedia'
                                        : 'Fitur peninjauan belum aktif'}
                                </h2>
                                <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                                    {accessUnavailable
                                        ? 'Data sebelumnya disembunyikan. Periksa otorisasi institusi sebelum memuat ulang.'
                                        : 'Antrean dan keputusan tidak tersedia saat fitur nonaktif. Penggunaan data nyata memerlukan persetujuan tata kelola dan otorisasi. Demonstrasi sintetis tidak menggantikan persetujuan tersebut.'}
                                </p>
                            </section>
                            <CampusWorkflowGuide
                                title="Batas peninjauan"
                                steps={[
                                    {
                                        title: 'Baca konteks',
                                        description:
                                            'Kecukupan data dan versi sumber harus jelas sebelum menyimpulkan.',
                                    },
                                    {
                                        title: 'Catat alasan faktual',
                                        description:
                                            'Hindari bahasa diagnostik atau stigmatisasi.',
                                    },
                                    {
                                        title: 'Dukungan oleh manusia',
                                        description:
                                            'Mencatat tindakan tidak mengirim kontak atau melakukan eskalasi otomatis.',
                                    },
                                ]}
                            />
                        </div>
                    ) : (
                        <>
                            <form
                                aria-label="Filter peninjauan inklusi"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    visit();
                                }}
                                className="grid min-w-0 items-end gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:p-5"
                            >
                                <label
                                    className="grid min-w-0 gap-2 text-sm font-semibold"
                                    htmlFor="filter-period"
                                >
                                    Periode akademik
                                    <input
                                        id="filter-period"
                                        placeholder="Contoh: 2026-S1"
                                        value={period}
                                        onChange={(event) =>
                                            setPeriod(event.target.value)
                                        }
                                        disabled={busy}
                                        className={campusControlClass}
                                    />
                                </label>
                                <label
                                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm leading-5"
                                    htmlFor="restrictedOnly"
                                >
                                    <input
                                        id="restrictedOnly"
                                        type="checkbox"
                                        checked={restrictedOnly}
                                        onChange={(event) =>
                                            setRestrictedOnly(
                                                event.target.checked,
                                            )
                                        }
                                        disabled={busy}
                                        className="size-5 cursor-pointer accent-primary disabled:cursor-not-allowed"
                                    />
                                    Hanya yang perlu tinjauan
                                </label>
                                <Button
                                    type="submit"
                                    disabled={busy}
                                    data-test="inclusion-filter-button"
                                >
                                    <Filter
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Terapkan
                                </Button>
                            </form>
                            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
                                <section
                                    aria-labelledby="inclusion-queue-heading"
                                    className="min-w-0 space-y-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2
                                                id="inclusion-queue-heading"
                                                className="text-lg font-bold"
                                            >
                                                Antrean peninjauan
                                            </h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Pilih berkas untuk membaca
                                                konteks dan mencatat tinjauan.
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs font-semibold">
                                            {signals.pagination.total} sesuai
                                            filter
                                        </span>
                                    </div>
                                    <div
                                        className="space-y-3"
                                        aria-busy={isPending}
                                        data-test="inclusion-queue"
                                    >
                                        {isPending && (
                                            <p
                                                role="status"
                                                className="flex items-center gap-2 rounded-xl bg-accent p-3 text-sm text-primary"
                                            >
                                                <LoaderCircle
                                                    aria-hidden="true"
                                                    className="size-4 animate-spin motion-reduce:animate-none"
                                                />
                                                Memuat antrean. Data sebelumnya
                                                tetap terlihat.
                                            </p>
                                        )}
                                        {signals.items.length === 0 ? (
                                            <div className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm">
                                                <DashboardArchiveArt className="mx-auto size-20" />
                                                <h3 className="mt-2 text-lg font-bold">
                                                    Tidak ada hasil pada filter
                                                    ini
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                    Ubah periode atau pilihan
                                                    tinjauan untuk melihat
                                                    berkas lain. Antrean kosong
                                                    bukan kesimpulan tentang
                                                    keadaan mahasiswa.
                                                </p>
                                            </div>
                                        ) : (
                                            signals.items.map((signal) => (
                                                <button
                                                    key={signal.id}
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        visit(signal.id)
                                                    }
                                                    aria-pressed={
                                                        selectedSignal?.id ===
                                                        signal.id
                                                    }
                                                    data-test="inclusion-queue-item"
                                                    className={cn(
                                                        'block w-full min-w-0 cursor-pointer rounded-3xl border bg-white p-4 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:p-5',
                                                        selectedSignal?.id ===
                                                            signal.id
                                                            ? 'border-primary bg-accent/35 ring-1 ring-primary/15'
                                                            : 'border-border',
                                                    )}
                                                >
                                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-primary">
                                                                Berkas IN-
                                                                {signal.id}
                                                            </p>
                                                            <h3 className="mt-1 text-lg font-bold wrap-anywhere">
                                                                {signal.subject_name ||
                                                                    `Mahasiswa #${signal.subject_id}`}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                                signal.restricted_feature_state
                                                                    ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                                                                    : 'border-border bg-accent text-muted-foreground',
                                                            )}
                                                        >
                                                            <Info
                                                                aria-hidden="true"
                                                                className="size-3.5"
                                                            />
                                                            {signal.restricted_feature_state
                                                                ? 'Perlu tinjauan'
                                                                : 'Tidak ditandai'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                                        Periode {signal.period}.{' '}
                                                        {signal.data_sufficiency_met
                                                            ? 'Kecukupan data terpenuhi.'
                                                            : 'Data belum cukup. Perlu konteks tambahan.'}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                                                        <span className="text-muted-foreground">
                                                            {
                                                                signal.reviews
                                                                    .length
                                                            }{' '}
                                                            tinjauan tercatat
                                                        </span>
                                                        <span className="font-semibold text-primary">
                                                            {selectedSignal?.id ===
                                                            signal.id
                                                                ? 'Berkas dipilih'
                                                                : 'Buka berkas'}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {signals.pagination.last_page > 1 && (
                                        <nav
                                            aria-label="Paginasi peninjauan inklusi"
                                            className="flex flex-wrap items-center justify-between gap-3"
                                        >
                                            <p className="text-xs text-muted-foreground">
                                                Halaman{' '}
                                                {
                                                    signals.pagination
                                                        .current_page
                                                }{' '}
                                                dari{' '}
                                                {signals.pagination.last_page}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        busy ||
                                                        signals.pagination
                                                            .current_page === 1
                                                    }
                                                    onClick={() =>
                                                        visit(
                                                            undefined,
                                                            signals.pagination
                                                                .current_page -
                                                                1,
                                                        )
                                                    }
                                                >
                                                    <ChevronLeft
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                    Sebelumnya
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        busy ||
                                                        signals.pagination
                                                            .current_page ===
                                                            signals.pagination
                                                                .last_page
                                                    }
                                                    onClick={() =>
                                                        visit(
                                                            undefined,
                                                            signals.pagination
                                                                .current_page +
                                                                1,
                                                        )
                                                    }
                                                >
                                                    Berikutnya
                                                    <ChevronRight
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </Button>
                                            </div>
                                        </nav>
                                    )}
                                </section>
                                <aside
                                    aria-labelledby="inclusion-detail-heading"
                                    className={cn(
                                        'min-w-0 rounded-3xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5 xl:order-last',
                                        selectedSignal
                                            ? 'order-first'
                                            : 'order-last',
                                    )}
                                >
                                    <h2
                                        id="inclusion-detail-heading"
                                        tabIndex={-1}
                                        className="flex items-center gap-2 text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <FileText
                                            aria-hidden="true"
                                            className="size-5 text-primary"
                                        />
                                        Bukti dan keputusan
                                    </h2>
                                    {!selectedSignal ? (
                                        <div className="mt-4 rounded-2xl bg-accent/50 p-4 text-sm leading-6 text-muted-foreground">
                                            Pilih berkas dari antrean. Baca
                                            kecukupan data, bukti, dan riwayat
                                            sebelum mencatat kesimpulan.
                                        </div>
                                    ) : (
                                        <div
                                            className="mt-4 min-w-0 space-y-5"
                                            data-test="inclusion-detail"
                                        >
                                            <div className="min-w-0 rounded-2xl bg-accent/50 p-4">
                                                <p className="text-xs font-semibold text-primary">
                                                    Berkas IN-
                                                    {selectedSignal.id}
                                                </p>
                                                <p className="mt-1 text-base font-bold wrap-anywhere">
                                                    {selectedSignal.subject_name ||
                                                        `Mahasiswa #${selectedSignal.subject_id}`}
                                                </p>
                                                <p className="mt-2 text-xs leading-5 wrap-anywhere text-muted-foreground">
                                                    Periode{' '}
                                                    {selectedSignal.period}.
                                                    Versi{' '}
                                                    {selectedSignal.version ??
                                                        'belum tersedia'}
                                                    .
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
                                                <EvidenceSummary
                                                    evidence={
                                                        selectedSignal.evidence_summary
                                                    }
                                                />
                                            </section>
                                            {selectedSignal.reviews.length >
                                                0 && (
                                                <CampusTechnicalDetails
                                                    title={`Riwayat tinjauan (${selectedSignal.reviews.length})`}
                                                >
                                                    <ol className="space-y-4">
                                                        {selectedSignal.reviews.map(
                                                            (review) => (
                                                                <li
                                                                    key={
                                                                        review.id
                                                                    }
                                                                    className="border-b border-border pb-3 last:border-0"
                                                                >
                                                                    <p className="font-semibold text-foreground">
                                                                        {conclusions[
                                                                            review
                                                                                .human_conclusion
                                                                        ] ??
                                                                            review.human_conclusion}
                                                                    </p>
                                                                    <p className="mt-1 text-xs">
                                                                        {review.reviewer_name ??
                                                                            'Peninjau kampus'}
                                                                    </p>
                                                                    <p className="mt-2 wrap-anywhere">
                                                                        {
                                                                            review.reason
                                                                        }
                                                                    </p>
                                                                    {review.support_action && (
                                                                        <p className="mt-1 wrap-anywhere">
                                                                            Tindakan:{' '}
                                                                            {
                                                                                review.support_action
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ol>
                                                </CampusTechnicalDetails>
                                            )}
                                            <form
                                                aria-label="Keputusan peninjauan inklusi"
                                                onSubmit={submitReview}
                                                className="space-y-4 border-t border-border pt-4"
                                            >
                                                <h3 className="text-base font-bold">
                                                    Catat tinjauan
                                                </h3>
                                                <div className="grid gap-2">
                                                    <label
                                                        htmlFor="human-conclusion"
                                                        className="text-sm font-semibold"
                                                    >
                                                        Kesimpulan peninjau
                                                    </label>
                                                    <select
                                                        id="human-conclusion"
                                                        value={
                                                            form.data
                                                                .human_conclusion
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'human_conclusion',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        disabled={busy}
                                                        aria-invalid={Boolean(
                                                            form.errors
                                                                .human_conclusion,
                                                        )}
                                                        aria-describedby={
                                                            form.errors
                                                                .human_conclusion
                                                                ? 'conclusion-error'
                                                                : undefined
                                                        }
                                                        className={cn(
                                                            campusControlClass,
                                                            'cursor-pointer',
                                                        )}
                                                    >
                                                        {Object.entries(
                                                            conclusions,
                                                        ).map(
                                                            ([
                                                                value,
                                                                label,
                                                            ]) => (
                                                                <option
                                                                    key={value}
                                                                    value={
                                                                        value
                                                                    }
                                                                >
                                                                    {label}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    {form.errors
                                                        .human_conclusion && (
                                                        <p
                                                            id="conclusion-error"
                                                            role="alert"
                                                            className="text-sm text-correction-subtle-foreground"
                                                        >
                                                            {
                                                                form.errors
                                                                    .human_conclusion
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <label
                                                        htmlFor="support-action"
                                                        className="text-sm font-semibold"
                                                    >
                                                        Tindakan pendukung
                                                        (opsional)
                                                    </label>
                                                    <input
                                                        id="support-action"
                                                        value={
                                                            form.data
                                                                .support_action
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'support_action',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        maxLength={255}
                                                        disabled={busy}
                                                        placeholder="Contoh: Menawarkan kesempatan proyek"
                                                        aria-invalid={Boolean(
                                                            form.errors
                                                                .support_action,
                                                        )}
                                                        aria-describedby="support-help support-error"
                                                        className={
                                                            campusControlClass
                                                        }
                                                    />
                                                    <p
                                                        id="support-help"
                                                        className="text-xs leading-5 text-muted-foreground"
                                                    >
                                                        Catatan ini tidak
                                                        mengirim pesan atau
                                                        kontak otomatis.
                                                    </p>
                                                    {form.errors
                                                        .support_action && (
                                                        <p
                                                            id="support-error"
                                                            role="alert"
                                                            className="text-sm text-correction-subtle-foreground"
                                                        >
                                                            {
                                                                form.errors
                                                                    .support_action
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <label
                                                        htmlFor="inclusion-reason"
                                                        className="text-sm font-semibold"
                                                    >
                                                        Alasan keputusan (wajib)
                                                    </label>
                                                    <textarea
                                                        id="inclusion-reason"
                                                        rows={3}
                                                        minLength={3}
                                                        maxLength={1000}
                                                        required
                                                        value={form.data.reason}
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'reason',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        disabled={busy}
                                                        placeholder="Tuliskan alasan faktual tanpa label diagnostik."
                                                        data-test="inclusion-reason"
                                                        aria-invalid={Boolean(
                                                            form.errors.reason,
                                                        )}
                                                        aria-describedby="inclusion-reason-help inclusion-reason-error"
                                                        className={cn(
                                                            campusControlClass,
                                                            'resize-y',
                                                        )}
                                                    />
                                                    <p
                                                        id="inclusion-reason-help"
                                                        className="text-xs leading-5 text-muted-foreground"
                                                    >
                                                        Maksimum 1.000 karakter.
                                                        Riwayat peninjauan tidak
                                                        ditimpa.
                                                    </p>
                                                    {form.errors.reason && (
                                                        <p
                                                            id="inclusion-reason-error"
                                                            role="alert"
                                                            className="text-sm text-correction-subtle-foreground"
                                                        >
                                                            {form.errors.reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={busy}
                                                    data-test="inclusion-submit"
                                                    className="min-h-11 w-full whitespace-normal"
                                                >
                                                    {form.processing ? (
                                                        <LoaderCircle
                                                            aria-hidden="true"
                                                            className="size-4 animate-spin motion-reduce:animate-none"
                                                        />
                                                    ) : (
                                                        <UserCheck
                                                            aria-hidden="true"
                                                            className="size-4"
                                                        />
                                                    )}
                                                    {form.processing
                                                        ? 'Menyimpan keputusan...'
                                                        : 'Simpan keputusan'}
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </aside>
                            </div>
                        </>
                    )}
                </div>
            </AppPage>
        </>
    );
}

CampusInclusion.layout = {
    breadcrumbs: [
        { title: 'Operasi Kampus', href: '#' },
        { title: 'Peninjauan Inklusi', href: '#' },
    ],
};
