import { Head } from '@inertiajs/react';
import { SettingsGrid } from '@/pages/settings/_components/settings-panel';
import { SecurityHelpAside } from '@/pages/settings/security/_components/security-help-aside';
import { SecurityPasswordForm } from '@/pages/settings/security/_components/security-password-form';
import { useSecurityForm } from '@/pages/settings/security/_hooks/use-security-form';
import { edit } from '@/routes/security';

export default function Security({ passwordRules }: { passwordRules: string }) {
    const {
        form,
        actionError,
        minimumLength,
        processing,
        recentlySuccessful,
        errors,
        actions,
    } = useSecurityForm({ passwordRules });

    return (
        <>
            <Head title="Pengaturan keamanan" />
            <SettingsGrid>
                <SecurityPasswordForm
                    data={form.data}
                    errors={errors}
                    processing={processing}
                    recentlySuccessful={recentlySuccessful}
                    actionError={actionError}
                    minimumLength={minimumLength}
                    passwordRules={passwordRules}
                    onCurrentPasswordChange={actions.setCurrentPassword}
                    onPasswordChange={actions.setPassword}
                    onPasswordConfirmationChange={
                        actions.setPasswordConfirmation
                    }
                    onSubmit={actions.submitPasswordUpdate}
                />
                <SecurityHelpAside />
            </SettingsGrid>
        </>
    );
}

Security.layout = {
    breadcrumbs: [{ title: 'Pengaturan keamanan', href: edit() }],
};
