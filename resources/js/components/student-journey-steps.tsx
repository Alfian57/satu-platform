import {
    BookOpenCheck,
    BriefcaseBusiness,
    FileCheck2,
    ShieldCheck,
} from 'lucide-react';

export const journeySteps = [
    {
        title: 'Proyek',
        icon: BriefcaseBusiness,
        summary: 'Temukan peluang dan bekerja bersama tim.',
        explanation:
            'Temukan proyek yang sesuai, ajukan bergabung, lalu kerjakan tugas bersama tim setelah diterima. Tugas membantu mengatur pekerjaan dalam proyek.',
    },
    {
        title: 'Kontribusi',
        icon: FileCheck2,
        summary: 'Ajukan hasil pekerjaan beserta bukti.',
        explanation:
            'Catat hasil pekerjaanmu dan ajukan bukti melalui Kontribusi. Menyelesaikan tugas belum otomatis membuat kontribusimu terverifikasi.',
    },
    {
        title: 'Validasi kampus',
        icon: ShieldCheck,
        summary: 'Kampus meninjau kontribusi yang diajukan.',
        explanation:
            'Admin Universitas dapat menyetujui, meminta revisi, atau menolak versi yang kamu ajukan. Jika diminta revisi, perbaiki pengajuan sesuai alasan. Draft privat tidak ikut dibuka.',
    },
    {
        title: 'Portofolio',
        icon: BookOpenCheck,
        summary: 'Tampilkan kontribusi sesuai pilihan visibilitasmu.',
        explanation:
            'Kontribusi yang disetujui dapat menjadi entri portofolio terverifikasi. Kamu tetap memilih visibilitasnya; persetujuan kampus tidak otomatis memublikasikan portofolio.',
    },
];

export function StudentJourneySteps({
    referenceLayout = false,
}: {
    referenceLayout?: boolean;
}) {
    return (
        <ol className="student-journey-summary__steps mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
            {journeySteps.map((step, index) => {
                const Icon = step.icon;

                return (
                    <li
                        key={step.title}
                        className="min-w-0 border-t border-border/80 pt-4"
                    >
                        <div className="flex items-center gap-2.5">
                            <span
                                className="student-journey-summary__icon flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-xs"
                                aria-hidden={referenceLayout || undefined}
                            >
                                {referenceLayout ? (
                                    index + 1
                                ) : (
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                )}
                            </span>
                            <h3 className="text-sm font-semibold text-foreground">
                                {!referenceLayout && (
                                    <span className="text-muted-foreground">
                                        {index + 1}.{' '}
                                    </span>
                                )}
                                {step.title}
                            </h3>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {step.summary}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}
