import { LockKeyhole, RefreshCw } from 'lucide-react';
import type { UseOnboardingFlowReturn } from '@/components/onboarding/_hooks/use-onboarding-flow';
import { Button } from '@/components/ui/button';

export interface OnboardingLockedStateProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
}

export function OnboardingLockedState({
    state,
    actions,
}: OnboardingLockedStateProps) {
    const { contextChanged, affiliationUncertain, notice, busy } = state;

    return (
        <section
            className="space-y-4 py-3"
            aria-label="Pemulihan aktivasi"
            data-test="onboarding-locked"
        >
            <div className="space-y-2 rounded-2xl border border-correction/30 bg-correction-subtle p-5 text-correction-subtle-foreground">
                <LockKeyhole aria-hidden="true" className="size-5" />
                <h3 className="font-semibold">
                    {contextChanged
                        ? 'Pengaturan layanan berubah'
                        : affiliationUncertain
                          ? 'Hasil pengiriman perlu diperiksa'
                          : notice.title}
                </h3>
                <p className="text-sm leading-6">
                    {contextChanged
                        ? 'Isianmu belum dikirim agar data tetap aman. Hubungi pengelola SATU sebelum melanjutkan. Data yang sudah tersimpan tidak diubah.'
                        : affiliationUncertain
                          ? 'Respons belum dapat dipastikan. Isianmu tetap tersedia dalam sesi ini. Periksa status server sebelum mengirim lagi.'
                          : notice.description}
                </p>
            </div>
            <Button
                type="button"
                className="w-full"
                onClick={actions.checkPendingStatus}
                disabled={busy}
            >
                <RefreshCw aria-hidden="true" />
                {busy ? 'Memeriksa status...' : 'Periksa status afiliasi'}
            </Button>
        </section>
    );
}
