import {
    Award,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Code2,
    FolderGit2,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import { useState } from 'react';
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
};

export const LANDING_STAGES: readonly LandingStage[] = [
    {
        key: 'opportunity',
        index: '01',
        label: 'Peluang',
        title: 'Peluang kolaborasi',
        shortDescription: 'Pekerjaan yang bisa diikuti.',
        description:
            'Peluang proyek dibuka dengan kebutuhan yang dapat dipahami sebelum mahasiswa memutuskan untuk bergabung.',
        source: 'Proyek atau agenda kampus',
        outcome: 'Tim menemukan titik mulai',
    },
    {
        key: 'team',
        index: '02',
        label: 'Tim',
        title: 'Tim yang terbentuk',
        shortDescription: 'Skill dan ketersediaan bertemu.',
        description:
            'Mahasiswa membentuk tim berdasarkan kebutuhan proyek, skill yang relevan, dan ketersediaan yang dapat dijelaskan.',
        source: 'Profil dan kebutuhan proyek',
        outcome: 'Peran kerja menjadi jelas',
    },
    {
        key: 'work',
        index: '03',
        label: 'Pekerjaan',
        title: 'Pekerjaan yang tercatat',
        shortDescription: 'Kontribusi meninggalkan jejak.',
        description:
            'Task, ownership, dan evidence disusun dalam ruang kerja agar kontribusi tidak berhenti sebagai cerita lisan.',
        source: 'Task dan evidence proyek',
        outcome: 'Kontribusi punya provenance',
    },
    {
        key: 'validation',
        index: '04',
        label: 'Validasi',
        title: 'Kontribusi tervalidasi',
        shortDescription: 'Reviewer kampus memberi konteks.',
        description:
            'Reviewer kampus meninjau kontribusi, memberi keputusan yang dapat dipahami, dan menjaga riwayat validasi tetap terbaca.',
        source: 'Validasi reviewer kampus',
        outcome: 'Status dan alasan tersimpan',
    },
    {
        key: 'portfolio',
        index: '05',
        label: 'Portofolio',
        title: 'Bukti yang bisa diproyeksikan',
        shortDescription: 'Mahasiswa mengatur visibilitas.',
        description:
            'Kontribusi yang disetujui dapat menjadi portofolio. Mahasiswa tetap menentukan entry mana yang terlihat oleh perekrut.',
        source: 'Entry portofolio yang diizinkan',
        outcome: 'Bukti siap dibagikan',
    },
] as const;

const stageThemes: Record<
    LandingStageKey,
    {
        themeColor: string;
        accentBg: string;
        badgeColor: string;
        cardBg: string;
        borderLight: string;
        glowColor: string;
    }
> = {
    opportunity: {
        themeColor: 'text-blue-600',
        accentBg: 'bg-blue-600',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        cardBg: 'from-blue-50/80 via-white to-slate-50/40',
        borderLight: 'border-blue-200/90',
        glowColor: 'rgba(37,99,235,0.12)',
    },
    team: {
        themeColor: 'text-indigo-600',
        accentBg: 'bg-indigo-600',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        cardBg: 'from-indigo-50/80 via-white to-slate-50/40',
        borderLight: 'border-indigo-200/90',
        glowColor: 'rgba(79,70,229,0.12)',
    },
    work: {
        themeColor: 'text-sky-600',
        accentBg: 'bg-sky-600',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        cardBg: 'from-sky-50/80 via-white to-slate-50/40',
        borderLight: 'border-sky-200/90',
        glowColor: 'rgba(2,132,199,0.12)',
    },
    validation: {
        themeColor: 'text-emerald-600',
        accentBg: 'bg-emerald-600',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBg: 'from-emerald-50/80 via-white to-slate-50/40',
        borderLight: 'border-emerald-200/90',
        glowColor: 'rgba(5,150,105,0.12)',
    },
    portfolio: {
        themeColor: 'text-amber-600',
        accentBg: 'bg-amber-600',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        cardBg: 'from-amber-50/80 via-white to-slate-50/40',
        borderLight: 'border-amber-200/90',
        glowColor: 'rgba(217,119,6,0.12)',
    },
};

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
    const theme = stageThemes[activeStage.key];

    const goToPrev = () => {
        const prevIndex =
            (activeIndex - 1 + LANDING_STAGES.length) % LANDING_STAGES.length;
        setActiveStageKey(LANDING_STAGES[prevIndex].key);
    };

    const goToNext = () => {
        const nextIndex = (activeIndex + 1) % LANDING_STAGES.length;
        setActiveStageKey(LANDING_STAGES[nextIndex].key);
    };

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 p-3.5 shadow-[0_24px_80px_-20px_rgba(37,99,235,0.18)] ring-1 ring-white/80 sm:p-5',
                className,
            )}
            data-testid="landing-flow-ledger"
        >
            {/* Decorative gradient behind card */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-blue-400/5 blur-3xl"
            />

            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100/80 pb-3 sm:pb-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 pl-1">
                        <span className="size-2.5 rounded-full bg-rose-400/70" />
                        <span className="size-2.5 rounded-full bg-amber-400/70" />
                        <span className="size-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <span className="h-4 w-px bg-slate-200/60" />
                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-slate-700">
                        <Sparkles
                            aria-hidden="true"
                            className="size-3.5 text-blue-500"
                        />
                        <span>Flow ledger / SATU</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100/80 bg-blue-50/60 px-2.5 py-0.5 font-label text-[0.62rem] font-semibold tracking-wider text-blue-600 backdrop-blur-sm">
                        <span
                            aria-hidden="true"
                            className="relative flex size-1.5"
                        >
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-60" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
                        </span>
                        Data synthetic
                    </span>
                </div>
            </div>

            {/* Stepper Tabs Nav */}
            <div className="mt-3.5">
                <nav
                    className="grid grid-cols-5 gap-1 rounded-2xl bg-slate-50/80 p-1.5 ring-1 ring-slate-100/80"
                    aria-label="Tahap lifecycle SATU"
                >
                    {LANDING_STAGES.map((stage, i) => {
                        const isActive = stage.key === activeStageKey;
                        const itemTheme = stageThemes[stage.key];

                        return (
                            <button
                                key={stage.key}
                                type="button"
                                aria-pressed={isActive}
                                className={cn(
                                    'landing-stage-row relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-all duration-300 motion-reduce:transition-none sm:py-2.5',
                                    isActive
                                        ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/80'
                                        : 'text-slate-400 hover:bg-white/60 hover:text-slate-700',
                                )}
                                data-testid={`landing-stage-${stage.key}`}
                                onClick={() => setActiveStageKey(stage.key)}
                            >
                                <span
                                    className={cn(
                                        'flex size-8 items-center justify-center rounded-xl transition-all duration-300 sm:size-9',
                                        isActive
                                            ? cn(
                                                  itemTheme.accentBg,
                                                  'text-white shadow-sm',
                                              )
                                            : 'bg-white text-slate-400 ring-1 ring-slate-200/60',
                                    )}
                                >
                                    <StageGlyph
                                        stage={stage.key}
                                        className="size-4 sm:size-4.5"
                                    />
                                </span>

                                <span className="max-w-full truncate text-[0.68rem] font-bold sm:text-xs">
                                    {stage.label}
                                </span>

                                <span className="font-label text-[0.55rem] font-semibold tracking-wider text-slate-300">
                                    0{i + 1}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Live Interactive Stage Visual Frame */}
            <div className="mt-3.5">
                <div
                    key={activeStage.key}
                    className={cn(
                        'landing-stage-detail-enter relative overflow-hidden rounded-2xl border p-4.5 transition-all duration-300 sm:p-5',
                        theme.borderLight,
                        'bg-linear-to-b',
                        theme.cardBg,
                    )}
                    data-testid="landing-stage-detail"
                >
                    {/* Header Info */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs ring-1 ring-slate-200/80 sm:size-12',
                                    theme.themeColor,
                                )}
                            >
                                <StageGlyph
                                    stage={activeStage.key}
                                    className="size-6"
                                />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'rounded-md border px-2 py-0.5 font-label text-[0.62rem] font-bold tracking-wider',
                                            theme.badgeColor,
                                        )}
                                    >
                                        TAHAP {activeStage.index}
                                    </span>
                                    <span className="flex items-center gap-1 font-label text-[0.62rem] font-semibold text-slate-500">
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                theme.accentBg,
                                            )}
                                        />
                                        tercatat
                                    </span>
                                </div>
                                <h3 className="mt-1 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                                    {activeStage.title}
                                </h3>
                            </div>
                        </div>

                        <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-2xs ring-1 ring-slate-200/60 sm:inline-block">
                            {activeStage.shortDescription}
                        </span>
                    </div>

                    <p className="mt-2.5 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                        {activeStage.description}
                    </p>

                    {/* Rich Mock Visual Ledger Entry per Stage */}
                    <div className="mt-3.5 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                        {activeStage.key === 'opportunity' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FolderGit2
                                            aria-hidden="true"
                                            className="size-4 text-blue-600"
                                        />
                                        <span className="text-xs font-bold text-slate-900">
                                            Sistem Monitoring Energi Cerdas
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                                        Peluang Terbuka
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] text-slate-600">
                                    <span className="font-semibold text-slate-700">
                                        Kebutuhan Tim:
                                    </span>
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                                        UI/UX Design
                                    </span>
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                                        Backend API
                                    </span>
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                                        IoT Engineer
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[0.65rem] text-slate-500">
                                    <span>
                                        Penyelenggara: Lab Riset Informatika
                                    </span>
                                    <span className="font-bold text-blue-600">
                                        Match Score: 94%
                                    </span>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'team' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Users
                                            aria-hidden="true"
                                            className="size-4 text-indigo-600"
                                        />
                                        <span className="text-xs font-bold text-slate-900">
                                            Squad Inovasi Hijau
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-indigo-700 ring-1 ring-indigo-200/60">
                                        3 Mahasiswa Tergabung
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-[0.68rem]">
                                    <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-100">
                                        <p className="font-bold text-slate-900">
                                            Budi S.
                                        </p>
                                        <p className="text-[0.62rem] text-slate-500">
                                            Lead Frontend
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-100">
                                        <p className="font-bold text-slate-900">
                                            Siti R.
                                        </p>
                                        <p className="text-[0.62rem] text-slate-500">
                                            Backend API
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-100">
                                        <p className="font-bold text-slate-900">
                                            Dimas P.
                                        </p>
                                        <p className="text-[0.62rem] text-slate-500">
                                            IoT Hardware
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[0.65rem] text-slate-500">
                                    <span>Ketersediaan tim: 12 jam/minggu</span>
                                    <span className="font-bold text-indigo-600">
                                        Peran Terdefinisi
                                    </span>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'work' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Code2
                                            aria-hidden="true"
                                            className="size-4 text-sky-600"
                                        />
                                        <span className="text-xs font-bold text-slate-900">
                                            Task: Arsitektur API & UI Component
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-sky-700 ring-1 ring-sky-200/60">
                                        Evidence Siap
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-[0.68rem] text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-3.5 text-emerald-500"
                                        />
                                        <span>
                                            PR #42: Integrasi Endpoint Realtime
                                            (Merged)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-3.5 text-emerald-500"
                                        />
                                        <span>
                                            Figma Design System UI (100%
                                            Selesai)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[0.65rem] text-slate-500">
                                    <span>Owner: Budi & Tim Alpha</span>
                                    <span className="font-bold text-sky-600">
                                        Tercatat di Ledger
                                    </span>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'validation' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-4 text-emerald-600"
                                        />
                                        <span className="text-xs font-bold text-slate-900">
                                            Tinjauan Dosen & Reviewer Kampus
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                                        Tervalidasi Resmi
                                    </span>
                                </div>
                                <div className="rounded-lg bg-emerald-50/60 p-2.5 text-[0.68rem] text-slate-700 ring-1 ring-emerald-200/50">
                                    <p className="font-bold text-emerald-950">
                                        Dr. Aris Subagyo, M.T. (Dosen
                                        Pembimbing)
                                    </p>
                                    <p className="mt-0.5 text-[0.62rem] text-slate-600">
                                        &quot;Kontribusi memenuhi standar
                                        rekayasa software dan diakui untuk 3 SKS
                                        ekuivalensi.&quot;
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[0.65rem] text-slate-500">
                                    <span>Status: Validasi Permanen</span>
                                    <span className="font-bold text-emerald-600">
                                        Hash: #A7F9-88E2
                                    </span>
                                </div>
                            </div>
                        )}

                        {activeStage.key === 'portfolio' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Award
                                            aria-hidden="true"
                                            className="size-4 text-amber-600"
                                        />
                                        <span className="text-xs font-bold text-slate-900">
                                            Portofolio Terverifikasi Siap Kerja
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-amber-700 ring-1 ring-amber-200/60">
                                        Visibilitas Aktif
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-[0.68rem] ring-1 ring-slate-100">
                                    <div>
                                        <p className="font-bold text-slate-900">
                                            Lead Frontend - Smart Campus
                                        </p>
                                        <p className="text-[0.62rem] text-slate-500">
                                            Terbuka untuk Perekrut Mitra
                                        </p>
                                    </div>
                                    <span className="rounded-md bg-blue-600 px-2.5 py-1 font-semibold text-white shadow-2xs">
                                        Siap Diproyeksikan
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[0.65rem] text-slate-500">
                                    <span>
                                        Privasi: Chat & Kontak Terlindungi
                                    </span>
                                    <span className="font-bold text-amber-600">
                                        Verified Badge
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Provenance Bar */}
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200/70 pt-2.5 text-[0.68rem]">
                        <div>
                            <span className="font-label text-[0.6rem] font-bold tracking-wider text-slate-400">
                                SUMBER
                            </span>
                            <p className="mt-0.5 truncate font-semibold text-slate-800">
                                {activeStage.source}
                            </p>
                        </div>
                        <div>
                            <span className="font-label text-[0.6rem] font-bold tracking-wider text-slate-400">
                                BERIKUTNYA
                            </span>
                            <p className="mt-0.5 truncate font-semibold text-slate-800">
                                {activeStage.outcome}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-slate-50/60 px-3.5 py-2.5 ring-1 ring-slate-100/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <LockKeyhole aria-hidden="true" className="size-3" />
                    </div>
                    <span className="text-[0.72rem]">
                        Visibilitas portofolio tetap dikendalikan mahasiswa.
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={goToPrev}
                        aria-label="Tahap sebelumnya"
                        className="flex size-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md"
                    >
                        <ChevronLeft aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={goToNext}
                        aria-label="Tahap selanjutnya"
                        className="flex size-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md"
                    >
                        <ChevronRight aria-hidden="true" className="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
