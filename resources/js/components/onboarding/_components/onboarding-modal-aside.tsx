import { GraduationCap, LockKeyhole } from 'lucide-react';
import Mascot from '@/components/mascot';
import type { Phase } from '@/components/onboarding/_hooks/use-onboarding-flow';

export interface OnboardingModalAsideProps {
    isProfileStage: boolean;
    phase: Phase;
}

export function OnboardingModalAside({
    isProfileStage,
    phase,
}: OnboardingModalAsideProps) {
    const isPending = phase === 'pending' || phase === 'pending-check';

    return (
        <>
            <div
                aria-hidden="true"
                className="relative h-20 shrink-0 bg-gradient-to-r from-secondary via-sky-100 to-sky-200 lg:hidden"
            >
                <Mascot
                    pose={isPending ? 'peek' : 'guide'}
                    className="absolute top-0 right-5 w-24"
                />
            </div>
            <aside className="relative hidden w-72 shrink-0 flex-col justify-between bg-secondary p-7 lg:flex">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-primary">
                        <GraduationCap aria-hidden="true" className="size-4" />
                        Kenalan dulu, yuk.
                    </span>
                    <h2 className="mt-6 text-3xl leading-tight font-bold tracking-tight text-slate-950">
                        Cerita hebat dimulai dari{' '}
                        <span className="text-primary">dirimu.</span>
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        {isProfileStage
                            ? 'Bantu SATU mengenali keahlian dan waktu luangmu untuk kolaborasi yang lebih cocok.'
                            : 'Verifikasi status mahasiswamu sebelum mulai berkolaborasi di SATU.'}
                    </p>
                </div>
                <div className="relative mt-24 h-48 rounded-3xl bg-gradient-to-br from-sky-200 to-blue-200">
                    <Mascot
                        pose={isPending ? 'peek' : 'guide'}
                        interactive
                        className="absolute -top-16 left-1/2 w-64 -translate-x-1/2"
                    />
                </div>
                <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-600">
                    <LockKeyhole
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    {isProfileStage
                        ? 'Portofoliomu privat sampai kamu memilih untuk membagikannya.'
                        : isPending
                          ? 'Pengajuan afiliasi sudah tercatat. Periksa status untuk melihat keputusan Admin Universitas.'
                          : 'Data pengajuan diverifikasi sebelum akses kolaborasi dibuka. Mengisi form belum berarti afiliasi disetujui.'}
                </p>
            </aside>
        </>
    );
}
