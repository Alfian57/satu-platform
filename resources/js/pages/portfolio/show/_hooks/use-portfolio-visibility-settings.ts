import { useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { portfolioVisibilityOptions } from '@/pages/portfolio/_utils/portfolio-presentation';
import { portfolioFieldError } from '@/pages/portfolio/index/_components/portfolio-form-feedback';
import type { PortfolioErrorMap } from '@/pages/portfolio/index/_components/portfolio-form-feedback';
import { usePortfolioPrivacyRecovery } from '@/pages/portfolio/show/_hooks/use-portfolio-privacy-recovery';
import { show as showProfile } from '@/routes/student-profiles';
import { update as updateProfileVisibility } from '@/routes/student-profiles/visibility';
import type {
    PortfolioProfile,
    PortfolioProfileApiResponse,
    PortfolioProfileVisibilityPayload,
} from '@/types/portfolio';

export interface UsePortfolioVisibilitySettingsProps {
    profile: PortfolioProfile;
    onUpdated: (profile: PortfolioProfile) => void;
    onAccessRevoked?: () => void;
}

export function usePortfolioVisibilitySettings({
    profile,
    onUpdated,
    onAccessRevoked,
}: UsePortfolioVisibilitySettingsProps) {
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const commandLock = useRef(false);
    const recovery = usePortfolioPrivacyRecovery<
        PortfolioProfileApiResponse['data']
    >({
        resourceId: profile.id,
        readUrl: showProfile(profile.id).url,
        onRead: (latest) => onUpdated({ ...profile, ...latest }),
        onAccessRevoked,
    });

    const form = useHttp<
        PortfolioProfileVisibilityPayload,
        PortfolioProfileApiResponse
    >({
        portfolio_visibility: profile.portfolio_visibility,
        recruiter_discoverable: false,
        expected_updated_at: profile.updated_at,
        expected_privacy_revision: profile.privacy_revision,
    });

    const errors = form.errors as PortfolioErrorMap;
    const visibilityError =
        portfolioFieldError(errors, 'portfolio_visibility') ??
        portfolioFieldError(errors, 'profile_visibility');
    const isStale =
        form.data.expected_privacy_revision !== profile.privacy_revision;
    const hasChanges =
        form.data.portfolio_visibility !== profile.portfolio_visibility;
    const selection = portfolioVisibilityOptions.find(
        (option) => option.value === form.data.portfolio_visibility,
    );

    function applyLatestSettings(): void {
        form.setData({
            portfolio_visibility: profile.portfolio_visibility,
            recruiter_discoverable: false,
            expected_updated_at: profile.updated_at,
            expected_privacy_revision: profile.privacy_revision,
        });
        form.clearErrors();
        setActionMessage(null);
    }

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (
            commandLock.current ||
            form.processing ||
            isStale ||
            recovery.blocked
        ) {
            return;
        }

        setActionMessage(null);
        commandLock.current = true;
        form.patch(updateProfileVisibility(profile.id).url, {
            onHttpException: recovery.onHttpException,
            onNetworkError: recovery.onNetworkError,
        })
            .then((response) => {
                form.setData({
                    portfolio_visibility: response.data.portfolio_visibility,
                    recruiter_discoverable: false,
                    expected_updated_at: response.data.updated_at,
                    expected_privacy_revision: response.data.privacy_revision,
                });
                onUpdated({ ...profile, ...response.data });
                setActionMessage('Pengaturan portofolio sudah tersimpan.');
            })
            .catch(() => undefined)
            .finally(() => {
                commandLock.current = false;
            });
    }

    return {
        form,
        errors,
        visibilityError,
        isStale,
        hasChanges,
        selection,
        actionMessage,
        recovery,
        applyLatestSettings,
        submit,
        setActionMessage,
    };
}
