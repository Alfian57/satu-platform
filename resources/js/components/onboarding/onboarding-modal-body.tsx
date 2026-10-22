import type { RefObject } from 'react';
import { OnboardingAffiliationStep } from '@/components/onboarding/onboarding-affiliation-step';
import { OnboardingAvailabilityStep } from '@/components/onboarding/onboarding-availability-step';
import { OnboardingLockedState } from '@/components/onboarding/onboarding-locked-state';
import { OnboardingModalFooter } from '@/components/onboarding/onboarding-modal-footer';
import { OnboardingPendingState } from '@/components/onboarding/onboarding-pending-state';
import { OnboardingProfileStep } from '@/components/onboarding/onboarding-profile-step';
import { OnboardingSkillsStep } from '@/components/onboarding/onboarding-skills-step';
import type { useOnboardingFlow } from '@/hooks/use-onboarding-flow';

type OnboardingFlowReturn = ReturnType<typeof useOnboardingFlow>;

interface OnboardingModalBodyProps {
    state: OnboardingFlowReturn['state'];
    actions: OnboardingFlowReturn['actions'];
    errorRef: RefObject<HTMLDivElement | null>;
    forms: OnboardingFlowReturn['forms'];
}

export function OnboardingModalBody({
    state,
    actions,
    errorRef,
    forms,
}: OnboardingModalBodyProps) {
    return (
        <div className="onboarding-body min-h-0 overflow-y-auto px-5 pb-6 sm:px-8">
            {state.error && (
                <div
                    ref={errorRef}
                    id="onboarding-error"
                    tabIndex={-1}
                    role="alert"
                    className="mb-5 rounded-2xl border border-correction/30 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground"
                >
                    {state.error}
                </div>
            )}

            {state.locked || state.affiliationUncertain ? (
                <OnboardingLockedState state={state} actions={actions} />
            ) : state.phase === 'pending' || state.phase === 'pending-check' ? (
                <OnboardingPendingState state={state} actions={actions} />
            ) : (
                <form
                    onSubmit={actions.save}
                    onChange={actions.markDraftTouched}
                >
                    <fieldset
                        disabled={state.busy}
                        className="space-y-5 disabled:opacity-70"
                    >
                        {state.step === 0 && (
                            <OnboardingAffiliationStep
                                state={state}
                                actions={actions}
                                fieldErrors={
                                    forms.profileForm.errors as Record<
                                        string,
                                        string
                                    >
                                }
                            />
                        )}
                        {state.step === 1 && (
                            <div className="space-y-5">
                                <OnboardingProfileStep
                                    bio={state.bio}
                                    onBioChange={actions.setBio}
                                    busy={state.busy}
                                />
                                <OnboardingSkillsStep
                                    state={state}
                                    actions={actions}
                                    creatingSkill={forms.skillForm.processing}
                                />
                            </div>
                        )}
                        {state.step === 2 && (
                            <OnboardingAvailabilityStep
                                state={state}
                                actions={actions}
                            />
                        )}
                    </fieldset>
                    <OnboardingModalFooter
                        state={state}
                        actions={actions}
                        creatingSkill={forms.skillForm.processing}
                    />
                </form>
            )}
        </div>
    );
}
