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
import type { KeyboardEvent } from 'react';
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
        themeColor: 'text-[#1764E8]',
        accentBg: 'bg-[#1764E8]',
        badgeColor: 'border-[#BFD7EC] bg-[#E7F2FF] text-[#1454C4]',
        cardBg: 'from-[#EAF5FF] via-white to-[#F7FBFF]',
        borderLight: 'border-[#C9DFF2]',
        glowColor: 'rgba(23,100,232,0.08)',
    },
    team: {
        themeColor: 'text-[#1764B3]',
        accentBg: 'bg-[#1764B3]',
        badgeColor: 'border-[#C9DFF2] bg-[#EFF7FF] text-[#345574]',
        cardBg: 'from-[#EFF7FF] via-white to-[#F7FBFF]',
        borderLight: 'border-[#D1E3F1]',
        glowColor: 'rgba(23,100,179,0.08)',
    },
    work: {
        themeColor: 'text-[#1764E8]',
        accentBg: 'bg-[#1764E8]',
        badgeColor: 'border-[#C9DFF2] bg-[#EFF7FF] text-[#345574]',
        cardBg: 'from-[#EFF7FF] via-white to-[#F7FBFF]',
        borderLight: 'border-[#D1E3F1]',
        glowColor: 'rgba(23,100,232,0.08)',
    },
    validation: {
        themeColor: 'text-[#1764B3]',
        accentBg: 'bg-[#1764B3]',
        badgeColor: 'border-[#C9DFF2] bg-[#EFF7FF] text-[#345574]',
        cardBg: 'from-[#F0F8FF] via-white to-[#F7FBFF]',
        borderLight: 'border-[#D1E3F1]',
        glowColor: 'rgba(23,100,179,0.08)',
    },
    portfolio: {
        themeColor: 'text-[#1764B3]',
        accentBg: 'bg-[#1764B3]',
        badgeColor: 'border-[#C9DFF2] bg-[#EFF7FF] text-[#345574]',
        cardBg: 'from-[#EFF7FF] via-white to-[#F7FBFF]',
        borderLight: 'border-[#D1E3F1]',
        glowColor: 'rgba(23,100,179,0.08)',
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

    const handleStageKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>,
        currentIndex: number,
    ) => {
        let nextIndex = currentIndex;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % LANDING_STAGES.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex =
                (currentIndex - 1 + LANDING_STAGES.length) %
                LANDING_STAGES.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = LANDING_STAGES.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setActiveStageKey(LANDING_STAGES[nextIndex].key);
        event.currentTarget
            .closest('[role="tablist"]')
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            .item(nextIndex)
            ?.focus();
    };

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
                'group relative overflow-hidden rounded-[1.5rem] border border-[#D9E8F5] bg-white p-3.5 shadow-[0_8px_28px_rgba(23,52,90,0.06)] sm:p-5',
                className,
            )}
            data-testid="landing-flow-ledger"
        >
            {/* Decorative gradient behind card */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-[#B7DFFF]/25 blur-3xl"
            />

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EEF6] pb-3 sm:pb-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 pl-1">
                        <span className="size-2 rounded-full bg-[#A6C5E2]" />
                        <span className="size-2 rounded-full bg-[#A6C5E2]" />
                        <span className="size-2 rounded-full bg-[#A6C5E2]" />
                    </div>
                    <span className="h-4 w-px bg-[#D9E8F5]" />
                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-[#345574]">
                        <Sparkles
                            aria-hidden="true"
                            className="size-3.5 text-[#1764E8]"
                        />
                        <span>Flow ledger / SATU</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9DFF2] bg-[#EFF7FF] px-2.5 py-1 font-label text-[0.62rem] font-semibold tracking-wider text-[#345574]">
                        <span
                            aria-hidden="true"
                            className="size-1.5 rounded-full bg-[#1764E8]"
                        />
                        Data synthetic
                    </span>
                </div>
            </div>

            {/* Stepper Tabs Nav */}
            <div className="mt-3.5">
                <div
                    role="tablist"
                    aria-label="Tahap perjalanan kontribusi"
                    aria-orientation="horizontal"
                    className="grid grid-cols-5 gap-1 rounded-xl bg-[#F3F8FD] p-1 ring-1 ring-[#E5EEF6]"
                >
                    {LANDING_STAGES.map((stage, i) => {
                        const isActive = stage.key === activeStageKey;
                        const itemTheme = stageThemes[stage.key];

                        return (
                            <button
                                key={stage.key}
                                type="button"
                                id={`landing-stage-tab-${stage.key}`}
                                role="tab"
                                aria-label={stage.label}
                                aria-selected={isActive}
                                aria-controls="landing-stage-panel"
                                tabIndex={isActive ? 0 : -1}
                                className={cn(
                                    'relative flex min-h-[4.25rem] min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-1.5 text-center transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1746B0] motion-reduce:transition-none sm:gap-1.5 sm:py-2',
                                    isActive
                                        ? 'bg-white text-[#17345A] shadow-[0_2px_8px_rgba(23,52,90,0.08)] ring-1 ring-[#D9E8F5]'
                                        : 'text-[#66809A] hover:bg-white/80 hover:text-[#345574]',
                                )}
                                data-testid={`landing-stage-${stage.key}`}
                                onKeyDown={(event) =>
                                    handleStageKeyDown(event, i)
                                }
                                onClick={() => setActiveStageKey(stage.key)}
                            >
                                <span
                                    className={cn(
                                        'flex size-7 items-center justify-center rounded-lg transition-colors duration-150 sm:size-8',
                                        isActive
                                            ? cn(
                                                  itemTheme.accentBg,
                                                  'text-white shadow-sm',
                                              )
                                            : 'bg-white text-[#7892AE] ring-1 ring-[#D9E8F5]',
                                    )}
                                >
                                    <StageGlyph
                                        stage={stage.key}
                                        className="size-4"
                                    />
                                </span>

                                <span className="max-w-full truncate text-[0.6rem] font-bold sm:text-xs">
                                    {stage.label}
                                </span>

                                <span className="sr-only sm:not-sr-only sm:font-label sm:text-[0.55rem] sm:font-semibold sm:tracking-wider sm:text-[#66809A]">
                                    0{i + 1}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Live Interactive Stage Visual Frame */}
            <div className="mt-3.5">
                <div
                    key={activeStage.key}
                    id="landing-stage-panel"
                    role="tabpanel"
                    aria-labelledby={`landing-stage-tab-${activeStage.key}`}
                    tabIndex={0}
                    className={cn(
                        'relative overflow-hidden rounded-xl border bg-linear-to-b p-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] motion-reduce:transition-none sm:p-5',
                        theme.borderLight,
                        theme.cardBg,
                    )}
                    data-testid="landing-stage-detail"
                >
                    {/* Header Info */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-[#D9E8F5] sm:size-12',
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
                                    <span className="flex items-center gap-1 font-label text-[0.62rem] font-semibold text-[#526B85]">
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
                                <h3 className="mt-1 text-base font-bold tracking-tight text-[#17345A] sm:text-lg">
                                    {activeStage.title}
                                </h3>
                            </div>
                        </div>

                        <span className="hidden rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#526B85] ring-1 ring-[#D9E8F5] sm:inline-block">
                            {activeStage.shortDescription}
                        </span>
                    </div>

                    <p className="mt-2.5 text-xs leading-5 text-[#526B85] sm:text-sm sm:leading-6">
                        {activeStage.description}
                    </p>

                    {/* Rich Mock Visual Ledger Entry per Stage */}
                    <div className="mt-3.5 rounded-xl border border-[#D9E8F5] bg-white p-3.5">
                        {activeStage.key === 'opportunity' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FolderGit2
                                            aria-hidden="true"
                                            className="size-4 text-[#1764E8]"
                                        />
                                        <span className="text-xs font-bold text-[#17345A]">
                                            Sistem Monitoring Energi Cerdas
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-[#E7F2FF] px-2.5 py-0.5 text-[0.62rem] font-bold text-[#1454C4] ring-1 ring-[#C9DFF2]">
                                        Contoh peluang
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] text-[#526B85]">
                                    <span className="font-semibold text-[#345574]">
                                        Kebutuhan Tim:
                                    </span>
                                    <span className="rounded-md bg-[#F1F6FB] px-2 py-0.5 font-medium">
                                        UI/UX Design
                                    </span>
                                    <span className="rounded-md bg-[#F1F6FB] px-2 py-0.5 font-medium">
                                        Backend API
                                    </span>
                                    <span className="rounded-md bg-[#F1F6FB] px-2 py-0.5 font-medium">
                                        IoT Engineer
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5EEF6] pt-2 text-[0.65rem] text-[#66809A]">
                                    <span>Contoh proyek kolaborasi</span>
                                    <span className="font-bold text-[#1764B3]">
                                        Kebutuhan peran terlihat
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
                                            className="size-4 text-[#1764E8]"
                                        />
                                        <span className="text-xs font-bold text-[#17345A]">
                                            Squad Inovasi Hijau
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-[#EFF7FF] px-2.5 py-0.5 text-[0.62rem] font-bold text-[#345574] ring-1 ring-[#D9E8F5]">
                                        3 Mahasiswa Tergabung
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-[0.68rem]">
                                    <div className="rounded-lg bg-[#F3F8FD] p-2 ring-1 ring-[#E5EEF6]">
                                        <p className="font-bold text-[#17345A]">
                                            Budi S.
                                        </p>
                                        <p className="text-[0.62rem] text-[#66809A]">
                                            Lead Frontend
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-[#F3F8FD] p-2 ring-1 ring-[#E5EEF6]">
                                        <p className="font-bold text-[#17345A]">
                                            Siti R.
                                        </p>
                                        <p className="text-[0.62rem] text-[#66809A]">
                                            Backend API
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-[#F3F8FD] p-2 ring-1 ring-[#E5EEF6]">
                                        <p className="font-bold text-[#17345A]">
                                            Dimas P.
                                        </p>
                                        <p className="text-[0.62rem] text-[#66809A]">
                                            IoT Hardware
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5EEF6] pt-2 text-[0.65rem] text-[#66809A]">
                                    <span>Ketersediaan tim: 12 jam/minggu</span>
                                    <span className="font-bold text-[#1764B3]">
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
                                            className="size-4 text-[#1764E8]"
                                        />
                                        <span className="text-xs font-bold text-[#17345A]">
                                            Task: Arsitektur API & UI Component
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-[#E7F2FF] px-2.5 py-0.5 text-[0.62rem] font-bold text-[#1454C4] ring-1 ring-[#C9DFF2]">
                                        Contoh evidence
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-[0.68rem] text-[#345574]">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-3.5 text-[#18734F]"
                                        />
                                        <span>
                                            Catatan integrasi endpoint realtime
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2
                                            aria-hidden="true"
                                            className="size-3.5 text-[#18734F]"
                                        />
                                        <span>
                                            Dokumentasi komponen antarmuka
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5EEF6] pt-2 text-[0.65rem] text-[#66809A]">
                                    <span>Pekerjaan tim</span>
                                    <span className="font-bold text-[#1764B3]">
                                        Kontribusi tercatat
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
                                            className="size-4 text-[#1764E8]"
                                        />
                                        <span className="text-xs font-bold text-[#17345A]">
                                            Tinjauan Dosen & Reviewer Kampus
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-[#E7F2FF] px-2.5 py-0.5 text-[0.62rem] font-bold text-[#1454C4] ring-1 ring-[#C9DFF2]">
                                        Contoh keputusan
                                    </span>
                                </div>
                                <div className="rounded-lg bg-[#F3F8FD] p-2.5 text-[0.68rem] text-[#345574] ring-1 ring-[#E5EEF6]">
                                    <p className="font-bold text-[#17345A]">
                                        Reviewer kampus meninjau kontribusi
                                    </p>
                                    <p className="mt-0.5 text-[0.62rem] text-[#526B85]">
                                        Status, alasan keputusan, dan riwayat
                                        validasi tersimpan bersama evidence.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5EEF6] pt-2 text-[0.65rem] text-[#66809A]">
                                    <span>Riwayat validasi</span>
                                    <span className="font-bold text-[#1764B3]">
                                        Dapat ditinjau
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
                                            className="size-4 text-[#1764E8]"
                                        />
                                        <span className="text-xs font-bold text-[#17345A]">
                                            Portofolio Terverifikasi Siap Kerja
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-[#E7F2FF] px-2.5 py-0.5 text-[0.62rem] font-bold text-[#1454C4] ring-1 ring-[#C9DFF2]">
                                        Contoh pengaturan
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-[#F3F8FD] p-2.5 text-[0.68rem] ring-1 ring-[#E5EEF6]">
                                    <div>
                                        <p className="font-bold text-[#17345A]">
                                            Contoh entry portofolio
                                        </p>
                                        <p className="text-[0.62rem] text-[#526B85]">
                                            Visibilitas dipilih mahasiswa
                                        </p>
                                    </div>
                                    <span className="rounded-md bg-[#1764E8] px-2.5 py-1 font-semibold text-white">
                                        Portofolio
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5EEF6] pt-2 text-[0.65rem] text-[#66809A]">
                                    <span>
                                        Privasi: Chat & Kontak Terlindungi
                                    </span>
                                    <span className="font-bold text-[#1764B3]">
                                        Izin tersimpan
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Provenance Bar */}
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#D9E8F5] pt-2.5 text-[0.68rem]">
                        <div>
                            <span className="font-label text-[0.6rem] font-bold tracking-wider text-[#66809A]">
                                SUMBER
                            </span>
                            <p className="mt-0.5 truncate font-semibold text-[#345574]">
                                {activeStage.source}
                            </p>
                        </div>
                        <div>
                            <span className="font-label text-[0.6rem] font-bold tracking-wider text-[#66809A]">
                                BERIKUTNYA
                            </span>
                            <p className="mt-0.5 truncate font-semibold text-[#345574]">
                                {activeStage.outcome}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl bg-[#F3F8FD] px-3.5 py-2.5 ring-1 ring-[#E5EEF6]">
                <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#526B85]">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#1764B3]">
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
                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-white text-[#526B85] ring-1 ring-[#D9E8F5] transition-colors duration-150 hover:bg-[#E7F2FF] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] motion-reduce:transition-none"
                    >
                        <ChevronLeft aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={goToNext}
                        aria-label="Tahap selanjutnya"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-white text-[#526B85] ring-1 ring-[#D9E8F5] transition-colors duration-150 hover:bg-[#E7F2FF] hover:text-[#1454C4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1746B0] motion-reduce:transition-none"
                    >
                        <ChevronRight aria-hidden="true" className="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
