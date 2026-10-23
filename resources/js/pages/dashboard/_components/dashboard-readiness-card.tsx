import { Building2, Rocket, Sparkles } from 'lucide-react';
import type { DashboardInstitution, DashboardProfileReadiness } from '@/types';

interface DashboardReadinessCardProps {
    profileReadiness: DashboardProfileReadiness;
    institution: DashboardInstitution | null;
    referenceLayout?: boolean;
}

const readinessCopy: Record<DashboardProfileReadiness['state'], string> = {
    unavailable:
        'Ringkasan profil muncul setelah afiliasi kampus terverifikasi.',
    missing: 'Profil belum dibuat. Lengkapi keahlian dan waktu kolaborasimu.',
    incomplete:
        'Lengkapi profil agar alasan kecocokan proyek dapat ditampilkan.',
    ready: 'Profilmu memiliki keahlian dan ketersediaan untuk pencocokan.',
};

export function DashboardReadinessCard({
    profileReadiness,
    institution,
    referenceLayout = false,
}: DashboardReadinessCardProps) {
    const canShowCounts = profileReadiness.state !== 'unavailable';

    return (
        <section
            aria-labelledby="dashboard-readiness-heading"
            className="min-w-0 border-t border-border px-1 pt-5"
        >
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center text-primary">
                    {referenceLayout ? (
                        <Rocket aria-hidden="true" className="size-4" />
                    ) : (
                        <Sparkles aria-hidden="true" className="size-4" />
                    )}
                </span>
                <h2
                    id="dashboard-readiness-heading"
                    className="text-base font-bold text-foreground"
                >
                    Bekal kolaborasimu
                </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {readinessCopy[profileReadiness.state]}
            </p>

            <ul className="mt-4 grid gap-3 text-sm">
                <li className="flex min-w-0 items-start gap-2.5">
                    <Building2
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 wrap-anywhere">
                        {institution?.name ??
                            'Afiliasi kampus belum terverifikasi'}
                    </span>
                </li>
                {canShowCounts && (
                    <>
                        <li className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                            <span className="text-muted-foreground">
                                Keahlian di profil
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                                {profileReadiness.skillsCount}
                            </span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                                Waktu kolaborasi
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                                {profileReadiness.availabilityCount}
                            </span>
                        </li>
                    </>
                )}
            </ul>
        </section>
    );
}
