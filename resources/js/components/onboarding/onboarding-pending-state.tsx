import { Clock3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { UseOnboardingFlowReturn } from '@/hooks/use-onboarding-flow';

export interface OnboardingPendingStateProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
}

export function OnboardingPendingState({
    state,
    actions,
}: OnboardingPendingStateProps) {
    const isChecking = state.phase === 'pending-check';

    return (
        <div className="space-y-5 py-3">
            <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-3 rounded-2xl border border-pending/30 bg-pending-subtle p-5 text-pending-subtle-foreground"
            >
                <Clock3 aria-hidden="true" className="mt-1 size-5 shrink-0" />
                <p className="text-sm leading-6">{state.notice.description}</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
                Fakultas, program studi, dan angkatan masuk tersimpan sebagai
                draft pribadi dan akan terisi otomatis setelah afiliasi
                disetujui. Isian profil lainnya masih sementara dan dapat hilang
                jika halaman dimuat ulang atau ditutup.
            </p>
            <Button
                type="button"
                className="w-full cursor-pointer"
                onClick={actions.checkPendingStatus}
                disabled={isChecking}
            >
                {isChecking ? (
                    <Spinner />
                ) : (
                    <RefreshCw aria-hidden="true" className="size-4" />
                )}
                {isChecking
                    ? 'Memeriksa status afiliasi...'
                    : 'Periksa status afiliasi'}
            </Button>
            <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => actions.setPhase('editing')}
                disabled={isChecking}
            >
                Periksa kembali isian
            </Button>
        </div>
    );
}
