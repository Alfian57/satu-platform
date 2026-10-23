import { Head } from '@inertiajs/react';
import type { LayoutCallback } from '@inertiajs/react';
import { AppPage } from '@/layouts/_components/app-page';
import StudentLayout from '@/layouts/student-layout';
import { ProfileAcademicSection } from '@/pages/student/profile/_components/profile-academic-section';
import { ProfileContributionsSection } from '@/pages/student/profile/_components/profile-contributions-section';
import { ProfileEditModal } from '@/pages/student/profile/_components/profile-edit-modal';
import { ProfileEvidenceModal } from '@/pages/student/profile/_components/profile-evidence-modal';
import { ProfileHeader } from '@/pages/student/profile/_components/profile-header';
import { ProfileInterestsSection } from '@/pages/student/profile/_components/profile-interests-section';
import { ProfileProjectsSection } from '@/pages/student/profile/_components/profile-projects-section';
import { ProfileSkillsSection } from '@/pages/student/profile/_components/profile-skills-section';
import { useCapabilityProfile } from '@/pages/student/profile/_hooks/useCapabilityProfile';
import type { CapabilityProfilePageProps } from '@/pages/student/profile/_hooks/useCapabilityProfile';
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
            <AppPage className="min-w-0">
                <div
                    className="grid w-full min-w-0 gap-6"
                    data-test="capability-profile-root"
                >
                    <ProfileHeader
                        institution={institution}
                        state={state}
                        actions={actions}
                        helpers={helpers}
                    />

                    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="min-w-0 space-y-6">
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
                                        <ProfileInterestsSection
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

                        {state.canEdit && (
                            <aside
                                aria-label="Kesiapan dan sumber kemampuan"
                                className="min-w-0"
                            >
                                <ProfileContributionsSection
                                    approvedSources={approvedSources}
                                    savedProfile={state.savedProfile}
                                    missing={state.missing}
                                    refreshing={state.refreshing}
                                />
                            </aside>
                        )}
                    </div>
                </div>
            </AppPage>

            <ProfileEvidenceModal
                state={state}
                actions={actions}
                helpers={helpers}
            />

            <ProfileEditModal
                open={state.confirmation !== null}
                description={state.confirmation}
                confirmationFocusRef={helpers.confirmationFocus}
                onConfirm={() => actions.settleConfirmation(true)}
                onCancel={() => actions.settleConfirmation(false)}
            />
        </>
    );
}

const capabilityLayout: LayoutCallback = () => [
    StudentLayout,
    { breadcrumbs: [{ title: 'Profil kemampuan', href: edit() }] },
];
CapabilityProfilePage.layout = capabilityLayout;
