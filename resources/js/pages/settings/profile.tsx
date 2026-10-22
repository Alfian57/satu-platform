import { Head } from '@inertiajs/react';
import DeleteUser from '@/components/delete-user';
import ExportUserData from '@/components/export-user-data';
import { ProfileAccountForm } from '@/components/settings/profile-account-form';
import { ProfileHelpAside } from '@/components/settings/profile-help-aside';
import { SettingsGrid } from '@/components/settings/settings-panel';
import { useProfileForm } from '@/hooks/use-profile-form';
import { edit } from '@/routes/profile';

export default function Profile() {
    const {
        form,
        actionError,
        isStudent,
        processing,
        recentlySuccessful,
        isDirty,
        errors,
        actions,
    } = useProfileForm();

    return (
        <>
            <Head title="Pengaturan profil" />
            <SettingsGrid>
                <div className="grid min-w-0 gap-6">
                    <ProfileAccountForm
                        data={form.data}
                        errors={errors}
                        processing={processing}
                        recentlySuccessful={recentlySuccessful}
                        isDirty={isDirty}
                        actionError={actionError}
                        onNameChange={actions.setName}
                        onUsernameChange={actions.setUsername}
                        onSubmit={actions.submitProfileUpdate}
                    />
                    <ExportUserData />
                    <DeleteUser />
                </div>
                <ProfileHelpAside isStudent={isStudent} />
            </SettingsGrid>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: 'Pengaturan profil', href: edit() }],
};
