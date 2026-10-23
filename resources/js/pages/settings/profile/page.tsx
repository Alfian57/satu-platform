import { Head } from '@inertiajs/react';
import DeleteUser from '@/pages/settings/_components/delete-user';
import ExportUserData from '@/pages/settings/_components/export-user-data';
import { SettingsGrid } from '@/pages/settings/_components/settings-panel';
import { ProfileAccountForm } from '@/pages/settings/profile/_components/profile-account-form';
import { ProfileHelpAside } from '@/pages/settings/profile/_components/profile-help-aside';
import { useProfileForm } from '@/pages/settings/profile/_hooks/use-profile-form';
import { edit } from '@/routes/profile';

export default function Profile() {
    const {
        form,
        actionError,
        isStudent,
        processing,
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
