import * as DialogPrimitive from '@radix-ui/react-dialog';
import OnboardingAffiliationIntro from '@/components/onboarding/_components/onboarding-affiliation-intro';
import { OnboardingModalAside } from '@/components/onboarding/_components/onboarding-modal-aside';
import { OnboardingModalBody } from '@/components/onboarding/_components/onboarding-modal-body';
import { OnboardingModalHeader } from '@/components/onboarding/_components/onboarding-modal-header';
import { useOnboardingFlow } from '@/components/onboarding/_hooks/use-onboarding-flow';
import { cn } from '@/lib/utils';

export function OnboardingModal({
    onVisibilityChange,
    openRequest = 0,
}: {
    onVisibilityChange?: (isOpen: boolean) => void;
    openRequest?: number;
}) {
    const { state, actions, refs, forms } = useOnboardingFlow({
        onVisibilityChange,
        openRequest,
    });

    if (!state.isOpen) {
        return null;
    }

    return (
        <DialogPrimitive.Root open>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        requestAnimationFrame(() =>
                            refs.titleRef.current?.focus(),
                        );
                    }}
                    onCloseAutoFocus={(e) => {
                        if (refs.returnFocus.current?.isConnected) {
                            e.preventDefault();
                            requestAnimationFrame(() =>
                                refs.returnFocus.current?.focus(),
                            );
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        if (!state.canDismiss) {
                            e.preventDefault();
                        } else {
                            actions.dismiss();
                        }
                    }}
                    onPointerDownOutside={(e) => e.preventDefault()}
                    className={cn(
                        'fixed top-1/2 left-1/2 z-50 flex h-[94svh] max-h-[94svh] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-4xl border border-white bg-white shadow-2xl focus:outline-none lg:flex-row',
                        !state.isProfileStage && 'satu-affiliation-dialog',
                    )}
                >
                    {state.isProfileStage ? (
                        <OnboardingModalAside
                            isProfileStage={state.isProfileStage}
                            phase={state.phase}
                        />
                    ) : (
                        <OnboardingAffiliationIntro
                            state={
                                state.locked || state.affiliationUncertain
                                    ? 'locked'
                                    : state.phase === 'pending' ||
                                        state.phase === 'pending-check'
                                      ? 'pending'
                                      : 'editing'
                            }
                        />
                    )}

                    <div className="onboarding-main flex min-h-0 min-w-0 flex-1 flex-col">
                        <OnboardingModalHeader
                            state={state}
                            actions={actions}
                            titleRef={refs.titleRef}
                        />

                        <OnboardingModalBody
                            state={state}
                            actions={actions}
                            errorRef={refs.errorRef}
                            forms={forms}
                        />
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
