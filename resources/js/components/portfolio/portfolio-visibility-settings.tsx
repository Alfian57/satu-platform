import { useHttp } from '@inertiajs/react';
import { Check, Eye, Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
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

const visibilityOptions: Array<{
    value: PortfolioVisibility;
    label: string;
    description: string;
}> = [
    {
        value: 'private',
        label: 'Hanya saya',
        description: 'Karya tidak dibagikan ke audience portofolio.',
    },
    {
        value: 'institution',
        label: 'Kampus',
        description: 'Dapat dilihat anggota kampus yang berwenang.',
    },
    {
        value: 'recruiter',
        label: 'Recruiter',
        description: 'Dapat masuk ke proyeksi aman recruiter yang berhak.',
    },
    {
        value: 'public',
        label: 'Publik',
        description: 'Dapat dilihat melalui proyeksi portofolio publik.',
    },
];

type Props = {
    profile: PortfolioProfile;
    dataTestPrefix?: string;
};

type ErrorMap = Record<string, unknown>;

function firstError(errors: ErrorMap, keys: string[]): string | null {
    for (const key of keys) {
        const value = errors[key];

        if (Array.isArray(value) && typeof value[0] === 'string') {
            return value[0];
        }

        if (typeof value === 'string') {
            return value;
        }
    }

    return null;
}

export function PortfolioVisibilitySettings({
    profile: initialProfile,
    dataTestPrefix = 'portfolio-profile',
}: Props) {
    const [profile, setProfile] = useState(initialProfile);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const form = useHttp<
        PortfolioProfileVisibilityPayload,
        PortfolioProfileApiResponse
    >({
        portfolio_visibility: initialProfile.portfolio_visibility,
        recruiter_discoverable: initialProfile.recruiter_discoverable,
        expected_updated_at: initialProfile.updated_at,
    });
    const errors = form.errors as ErrorMap;
    const validationError = firstError(errors, [
        'portfolio_visibility',
        'recruiter_discoverable',
        'profile_visibility',
    ]);

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setActionMessage(null);
        setActionError(null);
        form.transform((data) => ({
            ...data,
            expected_updated_at: profile.updated_at,
        }));
        form.patch(updateProfileVisibility(profile.id).url, {
            onHttpException: (response: { status: number }) => {
                setActionError(
                    response.status === 409
                        ? 'Pengaturan visibility berubah di sesi lain. Muat halaman lalu coba lagi.'
                        : response.status === 403
                          ? 'Pengaturan visibility ini sudah tidak dapat diubah.'
                          : 'Pengaturan visibility belum tersimpan. Coba lagi.',
                );

                return false;
            },
            onNetworkError: () => {
                setActionError(
                    'Pengaturan visibility belum tersimpan. Periksa koneksi lalu coba lagi.',
                );

                return false;
            },
        })
            .then((response) => {
                setProfile((current) => ({
                    ...current,
                    portfolio_visibility: response.data.portfolio_visibility,
                    recruiter_discoverable:
                        response.data.recruiter_discoverable,
                    updated_at: response.data.updated_at,
                }));
                setActionMessage('Pengaturan portofolio sudah tersimpan.');
            })
            .catch(() => undefined);
    }

    return (
        <section
            aria-labelledby={`${dataTestPrefix}-title`}
            aria-busy={form.processing}
            className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5"
            data-test={`${dataTestPrefix}-settings`}
        >
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                    <ShieldCheck aria-hidden="true" className="size-4" />
                </span>
                <div className="grid gap-1">
                    <h2
                        id={`${dataTestPrefix}-title`}
                        className="text-title font-bold"
                    >
                        Kendali visibilitas
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Tentukan siapa yang dapat menemukan karya. Kehadiran di
                        pencarian recruiter adalah pilihan terpisah.
                    </p>
                </div>
            </div>

            <form className="grid gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor={`${dataTestPrefix}-visibility`}>
                        Audience portofolio
                    </Label>
                    <select
                        id={`${dataTestPrefix}-visibility`}
                        className="min-h-control-md w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-hidden transition-[color,background-color,border-color,box-shadow] duration-fast ease-ledger hover:border-blue-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        value={form.data.portfolio_visibility}
                        onChange={(event) =>
                            form.setData(
                                'portfolio_visibility',
                                event.target.value as PortfolioVisibility,
                            )
                        }
                        disabled={form.processing}
                        data-test={`${dataTestPrefix}-visibility`}
                    >
                        {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs leading-5 text-muted-foreground">
                        {
                            visibilityOptions.find(
                                (option) =>
                                    option.value ===
                                    form.data.portfolio_visibility,
                            )?.description
                        }
                    </p>
                </div>

                <div className="flex items-start gap-3">
                    <Checkbox
                        id={`${dataTestPrefix}-discoverable`}
                        className="mt-0.5 cursor-pointer"
                        checked={form.data.recruiter_discoverable}
                        onCheckedChange={(checked) =>
                            form.setData(
                                'recruiter_discoverable',
                                checked === true,
                            )
                        }
                        disabled={form.processing}
                        data-test={`${dataTestPrefix}-discoverable`}
                    />
                    <div className="grid gap-1">
                        <Label
                            htmlFor={`${dataTestPrefix}-discoverable`}
                            className="cursor-pointer"
                        >
                            Izinkan recruiter menemukan profilku
                        </Label>
                        <p className="text-xs leading-5 text-muted-foreground">
                            Recruiter hanya menerima proyeksi yang diizinkan,
                            bukan evidence private, diskusi, atau data audit.
                        </p>
                    </div>
                </div>

                {(validationError || actionError) && (
                    <p
                        role="alert"
                        className="border border-correction/40 bg-correction-subtle px-3 py-2 text-sm leading-6 text-correction-subtle-foreground"
                    >
                        {actionError ?? validationError}
                    </p>
                )}

                {actionMessage && (
                    <p
                        role="status"
                        className="flex items-center gap-2 text-sm text-verified"
                    >
                        <Check aria-hidden="true" className="size-4" />
                        {actionMessage}
                    </p>
                )}

                <Button
                    type="submit"
                    className="w-fit cursor-pointer disabled:cursor-not-allowed"
                    disabled={form.processing}
                    data-test={`${dataTestPrefix}-save`}
                >
                    {form.processing ? (
                        <Spinner aria-hidden="true" />
                    ) : (
                        <Save aria-hidden="true" />
                    )}
                    Simpan pengaturan
                </Button>
            </form>

            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <Eye aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                Jangkauan setiap karya tetap dapat diatur secara terpisah di
                bawah.
            </p>
        </section>
    );
}
