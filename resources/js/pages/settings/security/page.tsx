import { Head } from '@inertiajs/react';
import { SettingsGrid } from '@/pages/settings/_components/settings-panel';
import { SecurityConfirmPasswordCard } from '@/pages/settings/security/_components/security-confirm-password-card';
import { SecurityHelpAside } from '@/pages/settings/security/_components/security-help-aside';
import { SecurityPasswordForm } from '@/pages/settings/security/_components/security-password-form';
import { useSecurityConfirmForm } from '@/pages/settings/security/_hooks/use-security-confirm-form';
import { useSecurityForm } from '@/pages/settings/security/_hooks/use-security-form';
import { edit } from '@/routes/security';

export default function Security({
    passwordRules,
    isConfirmed = true,
}: {
    passwordRules: string;
    isConfirmed?: boolean;
}) {
    const { form, actionError, minimumLength, processing, errors, actions } =
        useSecurityForm({ passwordRules });

    const confirmForm = useSecurityConfirmForm();

    return (
        <>
            <Head title="Pengaturan keamanan" />
            <SettingsGrid>
                {isConfirmed ? (
                    <SecurityPasswordForm
                        data={form.data}
                        errors={errors}
                        processing={processing}
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
                ) : (
                    <SecurityConfirmPasswordCard
                        data={confirmForm.data}
                        errors={confirmForm.errors}
                        processing={confirmForm.processing}
                        actionError={confirmForm.actionError}
                        onPasswordChange={confirmForm.setPassword}
                        onSubmit={confirmForm.onSubmit}
                    />
                )}
                <SecurityHelpAside />
            </SettingsGrid>
        </>
    );
}

Security.layout = {
    breadcrumbs: [{ title: 'Pengaturan keamanan', href: edit() }],
};
