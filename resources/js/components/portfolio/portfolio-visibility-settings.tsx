import { useHttp } from '@inertiajs/react';
import { Eye, Save, ShieldCheck, UserRoundSearch } from 'lucide-react';
import { useState } from 'react';
import {
    PortfolioFormFeedback,
    portfolioFieldError,
} from '@/components/portfolio/portfolio-form-feedback';
import type { PortfolioErrorMap } from '@/components/portfolio/portfolio-form-feedback';
import {
    portfolioVisibilityLabel,
    portfolioVisibilityOptions,
} from '@/components/portfolio/portfolio-presentation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update as updateProfileVisibility } from '@/routes/student-profiles/visibility';
import type {
    PortfolioProfile,
    PortfolioProfileApiResponse,
    PortfolioProfileVisibilityPayload,
    PortfolioVisibility,
} from '@/types/portfolio';

type Props = {
    profile: PortfolioProfile;
    onUpdated: (profile: PortfolioProfile) => void;
    dataTestPrefix?: string;
};

export function PortfolioVisibilitySettings({
    profile,
    onUpdated,
    dataTestPrefix = 'portfolio-profile',
}: Props) {
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const form = useHttp<
        PortfolioProfileVisibilityPayload,
        PortfolioProfileApiResponse
    >({
        portfolio_visibility: profile.portfolio_visibility,
        recruiter_discoverable: profile.recruiter_discoverable,
        expected_updated_at: profile.updated_at,
    });
    const errors = form.errors as PortfolioErrorMap;
    const visibilityError =
        portfolioFieldError(errors, 'portfolio_visibility') ??
        portfolioFieldError(errors, 'profile_visibility');
    const discoverableError = portfolioFieldError(
        errors,
        'recruiter_discoverable',
    );
    const isStale = form.data.expected_updated_at !== profile.updated_at;
    const hasChanges =
        form.data.portfolio_visibility !== profile.portfolio_visibility ||
        form.data.recruiter_discoverable !== profile.recruiter_discoverable;
    const selection = portfolioVisibilityOptions.find(
        (option) => option.value === form.data.portfolio_visibility,
    );

    function applyLatestSettings(): void {
        form.setData({
            portfolio_visibility: profile.portfolio_visibility,
            recruiter_discoverable: profile.recruiter_discoverable,
            expected_updated_at: profile.updated_at,
        });
        form.clearErrors();
        setActionError(null);
        setActionMessage(null);
    }

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (form.processing || isStale) {
            return;
        }

        setActionMessage(null);
        setActionError(null);
        form.patch(updateProfileVisibility(profile.id).url, {
            onHttpException: (response: { status: number }) => {
                setActionError(
                    response.status === 409
                        ? 'Pengaturan profil berubah di sesi lain. Muat ulang halaman untuk mengambil pengaturan terbaru.'
                        : response.status === 403
                          ? 'Pengaturan profil ini sudah tidak dapat diubah. Periksa akses atau muat ulang halaman.'
                          : 'Pengaturan profil belum tersimpan. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Pengaturan profil belum tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
        })
            .then((response) => {
                form.setData({
                    portfolio_visibility: response.data.portfolio_visibility,
                    recruiter_discoverable:
                        response.data.recruiter_discoverable,
                    expected_updated_at: response.data.updated_at,
                });
                onUpdated({ ...profile, ...response.data });
                setActionMessage('Pengaturan portofolio sudah tersimpan.');
            })
            .catch(() => undefined);
    }

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
                        Kamu menentukan jangkauan profil. Izin ditemukan
                        perekrut adalah pilihan terpisah.
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                        Izin ditemukan perekrut
                    </dt>
                    <dd className="font-semibold text-foreground">
                        {profile.recruiter_discoverable
                            ? 'Diizinkan'
                            : 'Tidak diizinkan'}
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
                        className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        value={form.data.portfolio_visibility}
                        onChange={(event) => {
                            form.setData(
                                'portfolio_visibility',
                                event.target.value as PortfolioVisibility,
                            );
                            form.clearErrors('portfolio_visibility');
                            setActionMessage(null);
                        }}
                        disabled={form.processing}
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
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        {form.data.portfolio_visibility === 'public'
                            ? 'Halaman publik hanya menampilkan karya yang juga dipilih Publik.'
                            : form.data.portfolio_visibility === 'recruiter'
                              ? 'Pencarian perekrut juga membutuhkan izin ditemukan profil dan jangkauan karya yang sesuai.'
                              : selection?.description}
                    </p>
                </div>
                <div className="grid min-w-0 gap-3 rounded-2xl border border-primary/10 bg-card p-4">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <UserRoundSearch
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                        />
                        Pencarian perekrut
                    </div>
                    <div className="flex min-w-0 items-start gap-3">
                        <Checkbox
                            id={dataTestPrefix + '-discoverable'}
                            className="mt-1 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                            checked={form.data.recruiter_discoverable}
                            onCheckedChange={(checked) => {
                                form.setData(
                                    'recruiter_discoverable',
                                    checked === true,
                                );
                                form.clearErrors('recruiter_discoverable');
                                setActionMessage(null);
                            }}
                            disabled={form.processing}
                            aria-invalid={Boolean(discoverableError)}
                            aria-describedby={
                                dataTestPrefix +
                                '-discoverable-hint' +
                                (discoverableError
                                    ? ' ' + dataTestPrefix + '-error'
                                    : '')
                            }
                            data-test={dataTestPrefix + '-discoverable'}
                        />
                        <Label
                            htmlFor={dataTestPrefix + '-discoverable'}
                            className={
                                form.processing
                                    ? 'min-h-11 cursor-not-allowed text-sm leading-6 opacity-50'
                                    : 'min-h-11 cursor-pointer text-sm leading-6'
                            }
                        >
                            Izinkan perekrut menemukan profilku
                        </Label>
                    </div>
                    <p
                        id={dataTestPrefix + '-discoverable-hint'}
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Perekrut yang berhak hanya menerima data yang diizinkan.
                        Bukti privat, diskusi, dan catatan kampus tidak ikut
                        dibagikan.
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
                {isStale && (
                    <div
                        role="status"
                        className="grid gap-3 rounded-xl border border-pending/30 bg-pending-subtle p-3 text-sm leading-6 text-pending-subtle-foreground"
                        data-test={dataTestPrefix + '-stale'}
                    >
                        <p>
                            Pengaturan profil berubah. Ambil pengaturan terbaru
                            sebelum menyimpan kembali.
                        </p>
                        <Button
                            variant="outline"
                            type="button"
                            className="h-auto min-h-11 whitespace-normal"
                            onClick={applyLatestSettings}
                            disabled={form.processing}
                        >
                            Gunakan pengaturan terbaru
                        </Button>
                    </div>
                )}
                <PortfolioFormFeedback
                    errors={errors}
                    actionError={actionError}
                    actionMessage={actionMessage}
                    processing={form.processing}
                    processingMessage="Menyimpan pengaturan profil..."
                    prefix={dataTestPrefix}
                />
                <Button
                    type="submit"
                    className="h-auto min-h-11 w-full py-3 whitespace-normal"
                    disabled={form.processing || isStale}
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
