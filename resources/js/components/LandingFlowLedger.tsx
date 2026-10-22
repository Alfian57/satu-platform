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
import LandingFlowStagePanel from '@/components/landing/landing-flow-stage-panel';
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
            'Kontribusi yang disetujui menghasilkan karya privat dengan sumber versi yang jelas. Kamu memilih jangkauan ringkasan karya; berkas bukti privat tidak otomatis dipublikasikan.',
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
                            'inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-220',
                            index === activeIndex
                                ? 'border-satu-blue bg-satu-blue text-white shadow-sm'
                                : 'border-satu-border-soft bg-white text-satu-muted hover:bg-satu-blue-soft',
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
            <LandingFlowStagePanel stage={stage} />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-md text-sm leading-6 text-satu-muted">
                    Ini penjelasan alur, bukan progres akun. Validasi dan
                    publikasi tidak terjadi otomatis.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex((index) => index - 1)}
                        className="landing-control cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Tahap sebelumnya"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Sebelumnya
                    </button>
                    <button
                        type="button"
                        disabled={activeIndex === LANDING_STAGES.length - 1}
                        onClick={() => setActiveIndex((index) => index + 1)}
                        className="landing-control cursor-pointer disabled:cursor-not-allowed"
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
