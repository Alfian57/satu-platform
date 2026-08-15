import {
    Award,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Code2,
    FileText,
    FolderGit2,
    LockKeyhole,
    ShieldCheck,
    Users,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

export type LandingStageKey =
    'opportunity' | 'team' | 'work' | 'validation' | 'portfolio';

export type LandingStage = {
    key: LandingStageKey;
    index: string;
    label: string;
    title: string;
    shortDescription: string;
    description: string;
    source: string;
    outcome: string;
    docRef: string;
};

export const LANDING_STAGES: readonly LandingStage[] = [
    {
        key: 'opportunity',
        index: '01',
        label: 'Peluang',
        title: 'Peluang Kolaborasi Terbuka',
        shortDescription: 'Inisiasi proyek dengan kriteria yang transparan.',
        description:
            'Peluang proyek dibuka secara terstruktur dengan rincian kebutuhan skill, kuota tim, dan batas waktu sebelum mahasiswa memutuskan untuk mendaftar.',
        source: 'Lab Riset / Komunitas / Mitra Kampus',
        outcome: 'Tim memiliki titik awal dan target yang jelas',
        docRef: 'SATU/OPP-2026/041',
    },
    {
        key: 'team',
        index: '02',
        label: 'Tim',
        title: 'Pembentukan Tim Berimbang',
        shortDescription: 'Skill, peran, dan ketersediaan waktu bertemu.',
        description:
            'Mahasiswa membentuk tim berdasarkan kecocokan kompetensi, ketersediaan jam kerja per minggu, dan kejelasan pembagian tanggung jawab.',
        source: 'Profil Minat & Rekomendasi 4 Dimensi',
        outcome: 'Peran kerja terdistribusi tanpa monopoli tugas',
        docRef: 'SATU/TEAM-2026/019',
    },
    {
        key: 'work',
        index: '03',
        label: 'Pekerjaan',
        title: 'Pencatatan Aktivitas Nyata',
        shortDescription: 'Setiap kontribusi meninggalkan jejak berkas.',
        description:
            'Tugas, ownership, commit Git, tautan Figma, dan dokumen teknis disimpan dalam ledger kerja sehingga kontribusi tidak berhenti sebagai klaim verbal.',
        source: 'Workspace & Evidence Repository',
        outcome: 'Kontribusi memiliki bukti fisik dan provenance',
        docRef: 'SATU/EVD-2026/108',
    },
    {
        key: 'validation',
        index: '04',
        label: 'Validasi',
        title: 'Validasi Resmi Pembimbing',
        shortDescription: 'Dosen atau reviewer kampus meninjau bukti.',
        description:
            'Reviewer kampus memeriksa deliverables, memberikan keputusan berkonteks, serta menandai stempel pengakuan resmi untuk portofolio atau ekuivalensi SKS.',
        source: 'Reviewer Terverifikasi / Kaprodi',
        outcome: 'Stempel resmi permanen tercatat di ledger',
        docRef: 'SATU/VAL-2026/088',
    },
    {
        key: 'portfolio',
        index: '05',
        label: 'Portofolio',
        title: 'Proyeksi Portofolio Terkendali',
        shortDescription: 'Mahasiswa memegang kendali visibilitas.',
        description:
            'Kontribusi yang sudah tervalidasi diproyeksikan ke Talent Portal. Mahasiswa tetap memiliki hak penuh untuk memilih proyek mana yang dapat dilihat perekrut.',
        source: 'Proyeksi Portofolio Mahasiswa',
        outcome: 'Bukti siap dibagikan ke mitra & perekrut',
        docRef: 'SATU/PORT-2026/003',
    },
] as const;

export function StageGlyph({
    stage,
    className,
}: {
    stage: LandingStageKey;
    className?: string;
}) {
    const commonProps = {
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        strokeWidth: 1.8,
    };

    return (
        <svg
            aria-hidden="true"
            className={cn('size-5', className)}
            focusable="false"
            viewBox="0 0 32 32"
        >
            {stage === 'opportunity' && (
                <>
                    <path {...commonProps} d="M7 8.5h13l5 5v10H7z" />
                    <path {...commonProps} d="M20 8.5v5h5M11 18h10M11 21.5h6" />
                    <path {...commonProps} d="M11 5.5v4M9 7.5h4" />
                </>
            )}
            {stage === 'team' && (
                <>
                    <circle {...commonProps} cx="11" cy="11" r="3.5" />
                    <circle {...commonProps} cx="22" cy="12.5" r="3" />
                    <path
                        {...commonProps}
                        d="M5.5 24c.6-4 2.5-6 5.5-6s4.9 2 5.5 6M18 19c2.8-.2 4.8 1.4 5.5 5"
                    />
                </>
            )}
            {stage === 'work' && (
                <>
                    <path {...commonProps} d="M8 5.5h11l5 5v16H8z" />
                    <path
                        {...commonProps}
                        d="M19 5.5v5h5M12 16h8M12 20h8M12 24h5"
                    />
                </>
            )}
            {stage === 'validation' && (
                <>
                    <circle {...commonProps} cx="16" cy="16" r="10" />
                    <path {...commonProps} d="m11.5 16 3 3 6-6" />
                    <path {...commonProps} d="M16 3v3M16 26v3M3 16h3M26 16h3" />
                </>
            )}
            {stage === 'portfolio' && (
                <>
                    <path {...commonProps} d="M6.5 8.5h19v15h-19z" />
                    <path {...commonProps} d="M10 12h12M10 16h8M10 20h5" />
                    <path {...commonProps} d="M6.5 8.5 9 5.5h5l2 3h5l2.5 3" />
                </>
            )}
        </svg>
    );
}

export default function LandingFlowLedger({
    className,
}: {
    className?: string;
}) {
    const [activeStageKey, setActiveStageKey] =
        useState<LandingStageKey>('opportunity');
    const activeIndex = LANDING_STAGES.findIndex(
        (s) => s.key === activeStageKey,
    );
    const activeStage = LANDING_STAGES[activeIndex];

    const goToPrev = useCallback(() => {
        const prevIndex =
            (activeIndex - 1 + LANDING_STAGES.length) % LANDING_STAGES.length;
        setActiveStageKey(LANDING_STAGES[prevIndex].key);
    }, [activeIndex]);

    const goToNext = useCallback(() => {
        const nextIndex = (activeIndex + 1) % LANDING_STAGES.length;
        setActiveStageKey(LANDING_STAGES[nextIndex].key);
    }, [activeIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            goToNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            goToPrev();
        }
    };

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-md',
                className,
            )}
            data-testid="landing-flow-ledger"
        >
            {/* Ledger Docket Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-label text-xs font-bold tracking-wider text-primary">
                        <FileText aria-hidden="true" className="size-4" />
                        <span>REGISTER PROVENANCE // 5 TAHAP KOLABORASI</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-label text-[0.68rem] font-semibold text-slate-500">
                        REF: {activeStage.docRef}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-label text-[0.62rem] font-bold text-slate-700">
                        DATA SYNTHETIC
                    </span>
                </div>
            </div>

            {/* Stepper Index Tabs */}
            <div className="border-b border-slate-200 bg-slate-100/60 p-2 sm:p-3">
                <nav
                    className="grid grid-cols-5 gap-1 sm:gap-2"
                    aria-label="Tahap alur kolaborasi SATU"
                    onKeyDown={handleKeyDown}
                    role="tablist"
                >
                    {LANDING_STAGES.map((stage, i) => {
                        const isActive = stage.key === activeStageKey;

                        return (
                            <button
                                key={stage.key}
                                type="button"
                                role="tab"
                                id={`tab-${stage.key}`}
                                aria-selected={isActive}
                                aria-controls={`panel-${stage.key}`}
                                tabIndex={isActive ? 0 : -1}
                                className={cn(
                                    'group/tab relative flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-all duration-200 motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-2.5',
                                    isActive
                                        ? 'border border-primary/20 bg-white text-slate-900 shadow-xs'
                                        : 'border border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-800',
                                )}
                                data-testid={`landing-stage-${stage.key}`}
                                onClick={() => setActiveStageKey(stage.key)}
                            >
                                <span
                                    className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-lg font-label text-xs font-bold transition-colors sm:size-8',
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-200 text-slate-600 group-hover/tab:bg-slate-300',
                                    )}
                                >
                                    0{i + 1}
                                </span>

                                <div className="min-w-0 text-left">
                                    <span className="block truncate text-[0.72rem] font-bold sm:text-xs">
                                        {stage.label}
                                    </span>
                                    <span className="hidden font-label text-[0.58rem] tracking-wider text-slate-400 sm:block">
                                        TAHAP {stage.index}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Dynamic Stage Content Body */}
            <div
                id={`panel-${activeStage.key}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeStage.key}`}
                className="p-5 sm:p-7"
                data-testid="landing-stage-detail"
            >
                {/* Header Information */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
                    <div className="flex items-start gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-blue-50 text-primary">
                            <StageGlyph
                                stage={activeStage.key}
                                className="size-6"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-label text-[0.62rem] font-bold text-primary">
                                    TAHAP {activeStage.index}
                                </span>
                                <span className="font-label text-xs font-medium text-slate-500">
                                    {activeStage.shortDescription}
                                </span>
                            </div>
                            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                                {activeStage.title}
                            </h3>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                    {activeStage.description}
                </p>

                {/* Simulated Tangible Docket File Sheet */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                        <span className="font-label text-[0.65rem] font-bold tracking-wider text-slate-500">
                            LEMBAR BUKTI TAHAP {activeStage.index} // SIMULASI
                            BERKAS
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 font-label text-[0.62rem] font-semibold text-slate-600 shadow-2xs">
                            STATUS: AKTIF
                        </span>
                    </div>

                    {/* Content Preview based on active stage */}
                    <div className="mt-4">
                        {activeStage.key === 'opportunity' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FolderGit2
                                            aria-hidden="true"
                                            className="size-4 text-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-900">
                                            Pengembangan Sistem Monitoring
                                            Kampus Hijau
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                        Terbuka untuk Pendaftaran
                                    </span>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <span className="font-label text-[0.6rem] text-slate-400">
                                            KEBUTUHAN SKILL
                                        </span>
                                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                            UI/UX & React Frontend
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <span className="font-label text-[0.6rem] text-slate-400">
                                            ESTIMASI WAKTU
                                        </span>
                                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                            8 Minggu (6 jam/minggu)
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <span className="font-label text-[0.6rem] text-slate-400">
                                            KONTRIBUSI DIAKUI
                                        </span>
                                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                            Ekuivalensi Tugas Akhir / MBKM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'team' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Users
                                            aria-hidden="true"
                                            className="size-4 text-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-900">
                                            Squad Rekayasa Cerdas (3 Mahasiswa)
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                        Formasi Lengkap
                                    </span>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <p className="text-xs font-bold text-slate-900">
                                            Budi Pratama
                                        </p>
                                        <p className="text-[0.68rem] text-slate-500">
                                            Lead Frontend Engineer
                                        </p>
                                        <span className="mt-1.5 inline-block font-label text-[0.58rem] text-emerald-700">
                                            Tersedia 10 jam/minggu
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <p className="text-xs font-bold text-slate-900">
                                            Siti Rahmawati
                                        </p>
                                        <p className="text-[0.68rem] text-slate-500">
                                            Backend & Database
                                        </p>
                                        <span className="mt-1.5 inline-block font-label text-[0.58rem] text-emerald-700">
                                            Tersedia 8 jam/minggu
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <p className="text-xs font-bold text-slate-900">
                                            Dimas Prasetyo
                                        </p>
                                        <p className="text-[0.68rem] text-slate-500">
                                            UI/UX & Product Design
                                        </p>
                                        <span className="mt-1.5 inline-block font-label text-[0.58rem] text-emerald-700">
                                            Tersedia 10 jam/minggu
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'work' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Code2
                                            aria-hidden="true"
                                            className="size-4 text-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-900">
                                            Log Evidence & Aktivitas Kerja
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                        Evidence Terkumpul
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                aria-hidden="true"
                                                className="size-4 text-emerald-600"
                                            />
                                            <span className="font-semibold text-slate-800">
                                                Pull Request #34: Sistem
                                                Autentikasi & UI Dashboard
                                            </span>
                                        </div>
                                        <span className="font-label text-[0.65rem] text-slate-500">
                                            Commit: e8f921a
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                aria-hidden="true"
                                                className="size-4 text-emerald-600"
                                            />
                                            <span className="font-semibold text-slate-800">
                                                Dokumen Desain: Figma High
                                                Fidelity Prototype & Alur
                                                Pengguna
                                            </span>
                                        </div>
                                        <span className="font-label text-[0.65rem] text-slate-500">
                                            Versi: 2.1
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'validation' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-4 text-emerald-600"
                                        />
                                        <span className="text-sm font-bold text-slate-900">
                                            Tinjauan Dosen & Verifikasi Kampus
                                        </span>
                                    </div>
                                    <span className="landing-stamp">
                                        TERVERIFIKASI RESMI
                                    </span>
                                </div>
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-slate-700">
                                    <p className="font-bold text-slate-900">
                                        Dr. Aris Subagyo, S.T., M.Kom. (Dosen
                                        Pembimbing)
                                    </p>
                                    <p className="mt-1 text-slate-600">
                                        &quot;Seluruh evidence tugas dan
                                        arsitektur kode telah diperiksa.
                                        Kontribusi dinyatakan sah dan diakui
                                        sebagai bagian portofolio resmi
                                        mahasiswa.&quot;
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'portfolio' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Award
                                            aria-hidden="true"
                                            className="size-4 text-amber-600"
                                        />
                                        <span className="text-sm font-bold text-slate-900">
                                            Portofolio Siap Kerja Terproyeksi
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                        Visibilitas Aktif
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs">
                                    <div>
                                        <p className="font-bold text-slate-900">
                                            Frontend Engineer (Sistem Monitoring
                                            Kampus)
                                        </p>
                                        <p className="text-slate-500">
                                            Terbuka untuk Perekrut Mitra
                                            Universitas
                                        </p>
                                    </div>
                                    <span className="rounded-md bg-primary px-3 py-1 font-semibold text-white">
                                        Terverifikasi
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Source and Outcome Metadata */}
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-3 text-xs sm:grid-cols-2">
                        <div>
                            <span className="font-label text-[0.62rem] font-bold text-slate-400">
                                ASAL SUMBER BUKTI:
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-800">
                                {activeStage.source}
                            </p>
                        </div>
                        <div>
                            <span className="font-label text-[0.62rem] font-bold text-slate-400">
                                KELANJUTAN TAHAP:
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-800">
                                {activeStage.outcome}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation & Privacy Footnote */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <LockKeyhole
                            aria-hidden="true"
                            className="size-3.5 text-primary"
                        />
                        <span>
                            Privasi data: mahasiswa memegang kendali atas
                            visibilitas portofolio.
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goToPrev}
                            aria-label="Tahap sebelumnya"
                            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-4"
                            />
                        </button>
                        <span className="font-label text-xs font-semibold text-slate-600">
                            {activeStage.index} / 05
                        </span>
                        <button
                            type="button"
                            onClick={goToNext}
                            aria-label="Tahap selanjutnya"
                            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
