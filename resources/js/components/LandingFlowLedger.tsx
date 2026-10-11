import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    FolderOpen,
    LockKeyhole,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import LandingPreview from '@/components/landing-preview';
import type { LandingPreviewKind } from '@/components/landing-preview';
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
    preview: LandingPreviewKind;
    icon: typeof FileText;
};

export const LANDING_STAGES: readonly LandingStage[] = [
    {
        key: 'opportunity',
        index: '01',
        label: 'Peluang',
        title: 'Temukan pekerjaan yang ingin kamu ikuti.',
        shortDescription: 'Pahami proyek dan kebutuhan perannya.',
        description:
            'Tunjukkan kemampuan dan minat, lalu baca peran yang menerima pemula. Kamu dapat menelusuri peluang tanpa karya terdahulu. Rekomendasi membantu, bukan menjamin diterima.',
        source: 'Informasi dan kebutuhan proyek',
        outcome: 'Mengajukan diri untuk peran yang sesuai',
        preview: 'project',
        icon: FolderOpen,
    },
    {
        key: 'team',
        index: '02',
        label: 'Tim',
        title: 'Berkarya dengan peran yang jelas.',
        shortDescription: 'Kenali tim dan pembagian pekerjaan.',
        description:
            'Ajukan minat, kemampuan atau kebutuhan belajar, serta ketersediaan. Pemilik memutuskan dengan alasan dan memeriksa kapasitas terbaru. Keanggotaan aktif, bukan pengajuan menunggu, membuka ruang kerja.',
        source: 'Keanggotaan dan kebutuhan proyek',
        outcome: 'Mulai bekerja bersama tim',
        preview: 'team',
        icon: UsersRound,
    },
    {
        key: 'work',
        index: '03',
        label: 'Pekerjaan',
        title: 'Jangan biarkan kontribusi kehilangan cerita.',
        shortDescription: 'Catat pekerjaan dan bukti kontribusi.',
        description:
            'Susun catatan dari pekerjaan di ruang tim. Jelaskan apa yang kamu kerjakan dan sertakan bukti yang relevan untuk ditinjau kampus.',
        source: 'Pekerjaan, catatan, dan bukti kontribusi',
        outcome: 'Mengirim kontribusi untuk ditinjau',
        preview: 'contribution',
        icon: FileText,
    },
    {
        key: 'validation',
        index: '04',
        label: 'Validasi',
        title: 'Tinjauan yang bisa kamu pahami.',
        shortDescription: 'Kampus meninjau kontribusi dan memberi keputusan.',
        description:
            'Reviewer kampus dapat menyetujui, meminta revisi, atau menolak kontribusi dengan alasan. Jika perlu revisi, perbarui catatan dan kirim versi berikutnya.',
        source: 'Keputusan reviewer kampus',
        outcome: 'Menindaklanjuti hasil tinjauan',
        preview: 'validation',
        icon: ShieldCheck,
    },
    {
        key: 'portfolio',
        index: '05',
        label: 'Portofolio',
        title: 'Tunjukkan karya. Tetap pegang kendalinya.',
        shortDescription: 'Pilih karya dan atur jangkauannya.',
        description:
            'Kontribusi yang disetujui menghasilkan karya privat dengan sumber versi yang jelas. Kamu memilih jangkauan ringkasan karya; berkas bukti privat tidak otomatis dipublikasikan. Perekrut adalah pengembangan lanjutan.',
        source: 'Kontribusi yang disetujui',
        outcome: 'Mengelola portofolio dan izin berbagi',
        preview: 'portfolio',
        icon: LockKeyhole,
    },
];

export default function LandingFlowLedger({
    className,
}: {
    className?: string;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const stage = LANDING_STAGES[activeIndex];
    const Icon = stage.icon;

    function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let next: number;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            next = (index + 1) % LANDING_STAGES.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            next = (index - 1 + LANDING_STAGES.length) % LANDING_STAGES.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = LANDING_STAGES.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setActiveIndex(next);
        event.currentTarget
            .closest('[role="tablist"]')
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            .item(next)
            ?.focus();
    }

    return (
        <div
            className={cn('min-w-0', className)}
            data-testid="landing-flow-ledger"
        >
            <div
                role="tablist"
                aria-label="Tahap perjalanan kolaborasi"
                className="grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
                {LANDING_STAGES.map((item, index) => (
                    <button
                        key={item.key}
                        type="button"
                        id={`landing-stage-tab-${item.key}`}
                        role="tab"
                        aria-selected={index === activeIndex}
                        aria-controls="landing-stage-panel"
                        tabIndex={index === activeIndex ? 0 : -1}
                        onClick={() => setActiveIndex(index)}
                        onKeyDown={(event) => moveTab(event, index)}
                        data-testid={`landing-stage-${item.key}`}
                        className={cn(
                            'inline-flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-220',
                            index === activeIndex
                                ? 'border-[#1764E8] bg-[#1764E8] text-white shadow-sm'
                                : 'border-[#D9E8F5] bg-white text-[#526B85] hover:bg-[#E7F2FF]',
                        )}
                    >
                        <span className="font-label text-xs">{item.index}</span>
                        <span>{item.label}</span>
                        {index === activeIndex && (
                            <Check
                                aria-hidden="true"
                                className="ml-auto size-4 shrink-0"
                            />
                        )}
                    </button>
                ))}
            </div>
            <section
                id="landing-stage-panel"
                role="tabpanel"
                aria-labelledby={`landing-stage-tab-${stage.key}`}
                tabIndex={0}
                className="mt-5 rounded-[2rem] border border-[#D9E8F5] bg-[#F3F9FF] p-5 sm:p-8 lg:p-10"
                data-testid="landing-stage-detail"
            >
                <div
                    key={stage.key}
                    className="landing-panel-enter grid gap-8 lg:min-h-[29rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14"
                >
                    <div className="min-w-0">
                        <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-[#D9E8F5] bg-white text-[#1764E8] shadow-sm">
                            <Icon aria-hidden="true" className="size-6" />
                        </span>
                        <p className="mt-6 text-sm font-semibold text-[#1454C4]">
                            Tahap {stage.index} / {stage.label}
                        </p>
                        <h3 className="mt-3 max-w-[18ch] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.12] font-bold tracking-[-0.03em]">
                            {stage.title}
                        </h3>
                        <p className="mt-5 max-w-lg text-base leading-7 text-[#526B85]">
                            {stage.description}
                        </p>
                        <dl className="mt-7 space-y-4 border-t border-[#D9E8F5] pt-5">
                            <div>
                                <dt className="text-xs text-[#526B85]">
                                    Sumber informasi
                                </dt>
                                <dd className="mt-1 text-sm font-semibold">
                                    {stage.source}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[#526B85]">
                                    Langkah berikutnya
                                </dt>
                                <dd className="mt-1 text-sm font-semibold">
                                    {stage.outcome}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <LandingPreview kind={stage.preview} />
                </div>
            </section>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-md text-sm leading-6 text-[#526B85]">
                    Ini penjelasan alur, bukan progres akun. Validasi dan
                    publikasi tidak terjadi otomatis.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex((index) => index - 1)}
                        className="landing-control"
                        aria-label="Tahap sebelumnya"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Sebelumnya
                    </button>
                    <button
                        type="button"
                        disabled={activeIndex === LANDING_STAGES.length - 1}
                        onClick={() => setActiveIndex((index) => index + 1)}
                        className="landing-control"
                        aria-label="Tahap selanjutnya"
                    >
                        Selanjutnya
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
