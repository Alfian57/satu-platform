import { Head } from '@inertiajs/react';
import { SecurityHelpAside } from '@/components/settings/security-help-aside';
import { SecurityPasswordForm } from '@/components/settings/security-password-form';
import { SettingsGrid } from '@/components/settings/settings-panel';
import { useSecurityForm } from '@/hooks/use-security-form';
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
