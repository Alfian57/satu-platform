<?php

function onboardingUiProjectFile(string $path): string
{
    $contents = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read [{$path}].");
    }

    return $contents;
}

test('onboarding uses the SATU enrollment ledger and Wayfinder contract', function () {
    $page = onboardingUiProjectFile('resources/js/pages/onboarding.tsx');

    expect($page)
        ->toContain("import { store } from '@/routes/institution-memberships';")
        ->toContain("import { show as onboarding } from '@/routes/onboarding';")
        ->toContain('form.submit(store()')
        ->toContain('Catatan pendaftaran')
        ->toContain('data-test="onboarding-root"')
        ->toContain('data-membership-state=')
        ->toContain('contextRailLabel="Progres dan privasi onboarding"')
        ->toContain('role="progressbar"')
        ->toContain('data-test="onboarding-error-summary"')
        ->toContain('data-test="membership-outcome-announcement"')
        ->toContain('aria-live="polite"')
        ->toContain('summary?.focus()')
        ->toContain("useForm<{ institution_id: number | ''; nim: string }>(")
        ->toContain('name="nim"')
        ->toContain("issue === 'phone_required'")
        ->toContain('onNetworkError:')
        ->toContain('onHttpException:')
        ->toContain("focusRecovery('network')")
        ->toContain("focusRecovery('session_expired')")
        ->toContain("focusRecovery('forbidden')")
        ->toContain("focusRecovery('rate_limited')")
        ->toContain('submitting.current')
        ->toContain('data-test="onboarding-submission-recovery"')
        ->toContain('[overflow-wrap:anywhere]')
        ->toContain('Lanjutkan ke dashboard')
        ->toContain('disabled={')
        ->toContain('cursor-pointer')
        ->toContain('disabled:cursor-not-allowed')
        ->not->toContain("'onboarding-affiliation',")
        ->not->toContain('href="/')
        ->not->toContain("\u{2014}");

    expect(onboardingUiProjectFile('resources/js/components/ui/alert.tsx'))
        ->toContain('bg-correction-subtle')
        ->toContain('text-correction-subtle-foreground')
        ->not->toContain(
            'text-destructive-foreground [&>svg]:text-current',
        );

    expect(onboardingUiProjectFile('resources/js/components/ui/spinner.tsx'))
        ->toContain('aria-label="Memuat"')
        ->not->toContain('aria-label="Loading"');
});

test('onboarding explains visibility and captures explicit recruiter consent', function () {
    $page = onboardingUiProjectFile('resources/js/pages/onboarding.tsx');
    $profile = onboardingUiProjectFile('resources/js/components/onboarding-profile.tsx');

    expect($page)
        ->toContain('Data portofolio belum dibagikan')
        ->toContain('Pengaturan visibilitas dan persetujuan');

    expect($profile)
        ->toContain('Persetujuan dicatat sebagai riwayat perubahan')
        ->toContain('Izinkan recruiter menemukan profil ini')
        ->toContain('studentProfiles.store().url')
        ->toContain('studentProfiles.visibility.update(profile.id).url')
        ->toContain('role="combobox"')
        ->not->toContain('consent_type')
        ->not->toContain('lawful_basis')
        ->not->toContain("\u{2014}");
});

test('the sidebar exposes onboarding as a contextual action, not primary navigation', function () {
    $sidebar = onboardingUiProjectFile('resources/js/components/app-sidebar.tsx');

    expect($sidebar)
        ->toContain("import { show as onboarding } from '@/routes/onboarding';")
        ->toContain('href={onboarding()}')
        ->toContain('Hubungkan kampus')
        ->toContain("membership?.status === 'verified'")
        ->toContain('cursor-pointer')
        ->not->toContain("title: 'Onboarding'");
});
