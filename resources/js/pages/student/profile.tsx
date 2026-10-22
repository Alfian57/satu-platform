import { Head } from '@inertiajs/react';
import type { LayoutCallback } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { ProfileAcademicSection } from '@/components/student/profile/profile-academic-section';
import { ProfileContributionsSection } from '@/components/student/profile/profile-contributions-section';
import { ProfileEditModal } from '@/components/student/profile/profile-edit-modal';
import { ProfileEvidenceModal } from '@/components/student/profile/profile-evidence-modal';
import { ProfileHeader } from '@/components/student/profile/profile-header';
import { ProfileProjectsSection } from '@/components/student/profile/profile-projects-section';
import { ProfileSkillsSection } from '@/components/student/profile/profile-skills-section';
import { useCapabilityProfile } from '@/hooks/useCapabilityProfile';
import type { CapabilityProfilePageProps } from '@/hooks/useCapabilityProfile';
import StudentLayout from '@/layouts/student-layout';
import { edit } from '@/routes/student-profiles';

export default function CapabilityProfilePage({
    academicOptions = {},
    institution,
    access,
    profile,
    taxonomies,
    approvedSources,
}: CapabilityProfilePageProps) {
    const { state, actions, helpers } = useCapabilityProfile({
        profile,
        institution,
        access,
        taxonomies,
    });

    return (
        <>
            <Head title="Profil kemampuan" />
            <AppPage
                className="min-w-0"
                contextRailLabel="Kesiapan dan sumber kemampuan"
                contextRail={
                    state.canEdit ? (
                        <ProfileContributionsSection
                            approvedSources={approvedSources}
                            savedProfile={state.savedProfile}
                            missing={state.missing}
                            refreshing={state.refreshing}
                        />
                    ) : undefined
                }
            >
                <div
                    className="min-w-0 space-y-6"
                    data-test="capability-profile-root"
                >
                    <ProfileHeader
                        institution={institution}
                        state={state}
                        actions={actions}
                        helpers={helpers}
                    />

                    {state.canEdit && (
                        <form
                            className="min-w-0 space-y-6"
                            onSubmit={actions.save}
                            data-test="capability-form"
                        >
                            <fieldset
                                className="min-w-0 space-y-6"
                                disabled={state.busy}
                                aria-busy={state.busy}
                            >
                                <ProfileAcademicSection
                                    academicOptions={academicOptions}
                                    state={state}
                                    actions={actions}
                                />
                                <ProfileSkillsSection
                                    taxonomies={taxonomies}
                                    state={state}
                                    actions={actions}
                                    lookup={helpers.lookup}
                                />
                                <ProfileProjectsSection
                                    institution={institution}
                                    state={state}
                                    actions={actions}
                                />
                            </fieldset>
                        </form>
                    )}
                </div>
            </AppPage>

            <ProfileEditModal
                open={state.confirmation !== null}
                description={state.confirmation}
                confirmationFocusRef={helpers.confirmationFocus}
                onConfirm={() => actions.settleConfirmation(true)}
                onCancel={() => actions.settleConfirmation(false)}
            />

            <ProfileEvidenceModal
                state={state}
                actions={actions}
                helpers={helpers}
            />
        </>
    );
}

const capabilityLayout: LayoutCallback = () => [
    StudentLayout,
    { breadcrumbs: [{ title: 'Profil kemampuan', href: edit() }] },
];
CapabilityProfilePage.layout = capabilityLayout;
