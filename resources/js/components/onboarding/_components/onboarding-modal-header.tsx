import { router } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { LogOut, X } from 'lucide-react';
import type { RefObject } from 'react';
import { OnboardingStepIndicator } from '@/components/onboarding/_components/onboarding-step-indicator';
import type { UseOnboardingFlowReturn } from '@/components/onboarding/_hooks/use-onboarding-flow';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes';

const steps = ['Afiliasi kampus', 'Bekal kemampuan', 'Cara berkolaborasi'];

export interface OnboardingModalHeaderProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
    titleRef: RefObject<HTMLHeadingElement | null>;
}

export function OnboardingModalHeader({
    state,
    actions,
    titleRef,
}: OnboardingModalHeaderProps) {
    const { isProfileStage, locked, phase, notice, step, canDismiss, busy } =
        state;
    const isPending = phase === 'pending' || phase === 'pending-check';

    return (
        <header className="onboarding-header shrink-0 px-5 pt-6 pb-5 sm:px-8">
            {canDismiss ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="float-right size-11"
                    aria-label="Tutup pelengkapan afiliasi"
                    disabled={busy}
                    onClick={actions.dismiss}
                >
                    <X aria-hidden="true" />
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    className="float-right min-h-11"
                    disabled={busy}
                    onClick={() => {
                        router.flushAll();
                        router.post(logout.url());
                    }}
                >
                    <LogOut aria-hidden="true" />
                    Keluar akun
                </Button>
            )}
            <p className="onboarding-kicker mb-2 text-xs font-bold tracking-[0.12em] text-primary uppercase">
                {isProfileStage
                    ? 'Ruang untuk bertumbuh'
                    : 'Verifikasi mahasiswa'}
            </p>
            <DialogPrimitive.Title
                ref={titleRef}
                tabIndex={-1}
                className="text-2xl font-bold tracking-tight text-slate-950 outline-none sm:text-3xl"
            >
                {locked
                    ? notice.title
                    : isPending
                      ? notice.title
                      : isProfileStage
                        ? steps[step]
                        : 'Pengajuan afiliasi kampus'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-slate-600">
                {locked
                    ? 'Akun dan riwayat tetap aman. Periksa status atau hubungi pengelola untuk melanjutkan.'
                    : isPending
                      ? 'Verifikasi status mahasiswa membantu menjaga ruang kolaborasi tetap tepercaya.'
                      : isProfileStage
                        ? 'Afiliasi sudah terverifikasi. Siapkan kemampuan dan waktu. Karya terdahulu tidak wajib.'
                        : 'Lengkapi data sesuai catatan universitas untuk membuka akses kolaborasi.'}
            </DialogPrimitive.Description>
            {!locked && !isProfileStage && phase === 'editing' && (
                <p className="onboarding-mandatory mt-3 text-xs leading-5 text-slate-600">
                    Isian bertanda bintang wajib diisi. Periksa datamu sebelum
                    dikirim.
                </p>
            )}
            {!locked && isProfileStage && (
                <OnboardingStepIndicator step={step} />
            )}
        </header>
    );
}
