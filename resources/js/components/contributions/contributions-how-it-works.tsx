import { ClipboardList, FileText, ShieldCheck } from 'lucide-react';

const steps = [
    {
        icon: FileText,
        title: 'Susun catatan',
        text: 'Hubungkan tugas, cerita pekerjaan, dan bukti privat.',
    },
    {
        icon: ShieldCheck,
        title: 'Kirim untuk validasi',
        text: 'Kampus meninjau dan dapat meminta perbaikan.',
    },
    {
        icon: ClipboardList,
        title: 'Kelola portofolio',
        text: 'Kontribusi tervalidasi menjadi sumber karya. Visibilitas tetap pilihanmu.',
    },
];

export function ContributionsHowItWorks() {
    return (
        <section
            aria-label="Cara kerja kontribusi"
            className="grid min-w-0 gap-5 border-y border-border/70 py-5 sm:grid-cols-3 sm:gap-6"
        >
            {steps.map((step, index) => (
                <div
                    key={step.title}
                    className="flex min-w-0 items-start gap-3 px-1 sm:px-0"
                >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                        <step.icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold">
                            {index + 1}. {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {step.text}
                        </p>
                    </div>
                </div>
            ))}
        </section>
    );
}
