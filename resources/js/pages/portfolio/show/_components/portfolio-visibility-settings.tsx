import { Eye, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    portfolioVisibilityLabel,
    portfolioVisibilityOptions,
} from '@/pages/portfolio/_utils/portfolio-presentation';
import { PortfolioFormFeedback } from '@/pages/portfolio/index/_components/portfolio-form-feedback';
import { PortfolioPrivacyRecoveryNotice } from '@/pages/portfolio/show/_components/portfolio-privacy-recovery';
import { PortfolioStaleNotice } from '@/pages/portfolio/show/_components/portfolio-stale-notice';
import { usePortfolioVisibilitySettings } from '@/pages/portfolio/show/_hooks/use-portfolio-visibility-settings';
import type { PortfolioProfile, PortfolioVisibility } from '@/types/portfolio';

type Props = {
    profile: PortfolioProfile;
    onUpdated: (profile: PortfolioProfile) => void;
    dataTestPrefix?: string;
    onAccessRevoked?: () => void;
};

export function PortfolioVisibilitySettings({
    profile,
    onUpdated,
    dataTestPrefix = 'portfolio-profile',
    onAccessRevoked,
}: Props) {
    const {
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
    } = usePortfolioVisibilitySettings({
        profile,
        onUpdated,
        onAccessRevoked,
    });

    return (
        <section
            aria-labelledby={dataTestPrefix + '-title'}
            aria-busy={form.processing}
            className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/60 p-5 shadow-md sm:p-6"
            data-test={dataTestPrefix + '-settings'}
        >
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <div className="grid min-w-0 gap-1">
                    <p className="text-xs font-semibold text-primary">
                        Pengaturan profil
                    </p>
                    <h2
                        id={dataTestPrefix + '-title'}
                        tabIndex={-1}
                        className="scroll-mt-24 rounded-lg text-title font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        Kendali visibilitas
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Pilih Hanya saya atau Publik. Profil Hanya saya menutup
                        seluruh karya dari pembaca lain.
                    </p>
                </div>
            </div>
            <dl
                className="grid min-w-0 gap-3 border-y border-primary/10 py-4 text-xs"
                data-test={dataTestPrefix + '-saved'}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                        Jangkauan tersimpan
                    </dt>
                    <dd className="font-semibold text-foreground">
                        {portfolioVisibilityLabel(profile.portfolio_visibility)}
                    </dd>
                </div>
            </dl>
            <form className="grid min-w-0 gap-5" onSubmit={submit}>
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor={dataTestPrefix + '-visibility'}>
                        Jangkauan profil
                    </Label>
                    <select
                        id={dataTestPrefix + '-visibility'}
                        className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background pr-10 pl-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        value={form.data.portfolio_visibility}
                        onChange={(event) => {
                            form.setData(
                                'portfolio_visibility',
                                event.target.value as PortfolioVisibility,
                            );
                            form.clearErrors('portfolio_visibility');
                            setActionMessage(null);
                        }}
                        disabled={form.processing || recovery.blocked}
                        aria-invalid={Boolean(visibilityError)}
                        aria-describedby={
                            dataTestPrefix +
                            '-hint' +
                            (visibilityError
                                ? ' ' + dataTestPrefix + '-error'
                                : '')
                        }
                        data-test={dataTestPrefix + '-visibility'}
                    >
                        {portfolioVisibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <p
                        id={dataTestPrefix + '-hint'}
                        className="rounded-xl border border-satu-orange-border bg-satu-orange-soft p-3 text-xs leading-5 text-satu-orange-ink"
                    >
                        {form.data.portfolio_visibility === 'public'
                            ? 'Halaman publik hanya menampilkan karya yang juga dipilih Publik.'
                            : selection?.description}
                    </p>
                </div>
                {hasChanges && !isStale && (
                    <p
                        role="status"
                        className="text-xs font-semibold text-primary"
                        data-test={dataTestPrefix + '-unsaved'}
                    >
                        Pilihan baru belum disimpan.
                    </p>
                )}
                <PortfolioPrivacyRecoveryNotice
                    recovery={recovery}
                    prefix={dataTestPrefix}
                />
                {isStale && !recovery.blocked && (
                    <PortfolioStaleNotice
                        message="Pengaturan profil berubah. Ambil pengaturan terbaru sebelum menyimpan kembali."
                        onApplyLatest={applyLatestSettings}
                        processing={form.processing}
                        dataTest={dataTestPrefix + '-stale'}
                    />
                )}
                <PortfolioFormFeedback
                    errors={errors}
                    actionError={recovery.error}
                    uncertain={recovery.needsCheck}
                    actionMessage={actionMessage}
                    processing={form.processing}
                    processingMessage="Menyimpan pengaturan profil..."
                    prefix={dataTestPrefix}
                />
                <Button
                    type="submit"
                    className="h-auto min-h-11 w-full py-3 whitespace-normal"
                    disabled={form.processing || isStale || recovery.blocked}
                    data-test={dataTestPrefix + '-save'}
                >
                    {form.processing ? (
                        <Spinner
                            aria-hidden="true"
                            className="motion-reduce:animate-none"
                        />
                    ) : (
                        <Save aria-hidden="true" />
                    )}
                    Simpan pengaturan
                </Button>
            </form>
            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <Eye aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                Jangkauan karya tetap diatur per karya. Untuk halaman publik,
                profil dan karya sama-sama harus dipilih Publik.
            </p>
        </section>
    );
}
