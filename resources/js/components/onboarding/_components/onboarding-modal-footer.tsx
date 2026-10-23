import { ArrowLeft, ArrowRight, CheckCheck } from 'lucide-react';
import type { UseOnboardingFlowReturn } from '@/components/onboarding/_hooks/use-onboarding-flow';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface OnboardingModalFooterProps {
    state: UseOnboardingFlowReturn['state'];
    actions: UseOnboardingFlowReturn['actions'];
    creatingSkill: boolean;
}

export function OnboardingModalFooter({
    state,
    actions,
    creatingSkill,
}: OnboardingModalFooterProps) {
    const {
        step,
        isProfileStage,
        busy,
        phaseLabel,
        locked,
        canSubmitAffiliation,
    } = state;

    return (
        <>
            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white py-5">
                {step > 1 ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => actions.moveTo(step - 1)}
                        disabled={busy}
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Kembali
                    </Button>
                ) : (
                    <span className="text-xs text-slate-600">
                        {isProfileStage
                            ? 'Langkah 1 dari 2'
                            : 'Pengajuan afiliasi wajib'}
                    </span>
                )}
                <Button
                    type="submit"
                    disabled={
                        busy || creatingSkill || locked || !canSubmitAffiliation
                    }
                    className="min-h-12 cursor-pointer rounded-xl px-5"
                >
                    {busy ? (
                        <>
                            <Spinner />
                            {phaseLabel}
                        </>
                    ) : step < 2 ? (
                        <>
                            {step === 0 ? 'Ajukan afiliasi' : 'Lanjutkan'}
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </>
                    ) : (
                        <>
                            Simpan profil
                            <CheckCheck aria-hidden="true" className="size-4" />
                        </>
                    )}
                </Button>
            </footer>
            {busy && (
                <p role="status" className="sr-only">
                    {phaseLabel}
                </p>
            )}
        </>
    );
}
