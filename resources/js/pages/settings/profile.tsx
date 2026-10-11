import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CircleUserRound,
    GraduationCap,
    LockKeyhole,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import ExportUserData from '@/components/export-user-data';
import InputError from '@/components/input-error';
import { SettingsFormFeedback } from '@/components/settings/settings-form-feedback';
import {
    SettingsCardHeading,
    SettingsGrid,
    SettingsHelpCard,
} from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit } from '@/routes/profile';

export default function Profile() {
    const { account } = usePage<{
        account: { name: string; username: string };
    }>().props;
    const form = useForm({
        name: account.name,
        username: account.username,
    });
    const { errors, processing, recentlySuccessful, isDirty } = form;
    const [actionError, setActionError] = useState<string | null>(null);

    return (
        <>
            <Head title="Pengaturan profil" />
            <SettingsGrid>
                <div className="grid min-w-0 gap-6">
                    <section
                        aria-labelledby="profile-settings-title"
                        className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                        data-test="profile-settings-card"
                    >
                        <SettingsCardHeading
                            id="profile-settings-title"
                            icon={CircleUserRound}
                            title="Identitas akun"
                            description="Gunakan nama yang mudah dikenali dan nama pengguna pribadi untuk masuk ke SATU."
                        />
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();

                                if (processing) {
                                    return;
                                }

                                form.submit(ProfileController.update(), {
                                    preserveScroll: true,
                                    onStart: () => setActionError(null),
                                    onSuccess: () => form.setDefaults(),
                                    onNetworkError: () => {
                                        setActionError(
                                            'Koneksi terputus. Periksa koneksi dan coba simpan lagi.',
                                        );

                                        return false;
                                    },
                                    onHttpException: (response) => {
                                        setActionError(
                                            [401, 403, 419].includes(
                                                response.status,
                                            )
                                                ? 'Sesi atau akses perubahan tidak tersedia. Muat ulang halaman sebelum mencoba lagi.'
                                                : 'Respons penyimpanan belum tersedia. Periksa status akun dengan memuat ulang sebelum mencoba lagi.',
                                        );

                                        return false;
                                    },
                                });
                            }}
                            className="grid min-w-0 gap-6 border-t border-border pt-6"
                        >
                            <SettingsFormFeedback
                                errors={errors}
                                actionError={actionError}
                                processing={processing}
                                prefix="profile-settings"
                                errorHint="Isianmu tetap tersedia. Tidak ada perubahan yang dinyatakan tersimpan sebelum konfirmasi server."
                                success={
                                    recentlySuccessful
                                        ? 'Identitas akun berhasil diperbarui.'
                                        : null
                                }
                            />
                            <div className="grid min-w-0 gap-3">
                                <Label htmlFor="name">Nama akun</Label>
                                <Input
                                    id="name"
                                    className="h-11 bg-background/60"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    name="name"
                                    disabled={processing}
                                    required
                                    maxLength={255}
                                    autoComplete="name"
                                    placeholder="Nama yang mudah dikenali"
                                    aria-invalid={Boolean(errors.name)}
                                    aria-describedby={
                                        errors.name
                                            ? 'name-help name-error'
                                            : 'name-help'
                                    }
                                />
                                <p
                                    id="name-help"
                                    className="text-xs leading-5 text-muted-foreground"
                                >
                                    Nama yang ditampilkan sebagai identitas
                                    akunmu.
                                </p>
                                <InputError
                                    id="name-error"
                                    message={errors.name}
                                    className="text-correction-subtle-foreground"
                                />
                            </div>
                            <div className="grid min-w-0 gap-3 rounded-2xl border border-primary/10 bg-accent/40 p-4 sm:p-5">
                                <Label
                                    htmlFor="username"
                                    className="flex items-center gap-2"
                                >
                                    <LockKeyhole
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-primary"
                                    />
                                    Nama pengguna pribadi
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    className="h-11 bg-card"
                                    value={form.data.username}
                                    onChange={(event) =>
                                        form.setData(
                                            'username',
                                            event.target.value,
                                        )
                                    }
                                    name="username"
                                    disabled={processing}
                                    required
                                    maxLength={255}
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    placeholder="Nama pengguna untuk masuk"
                                    aria-invalid={Boolean(errors.username)}
                                    aria-describedby={
                                        errors.username
                                            ? 'username-help username-error'
                                            : 'username-help'
                                    }
                                />
                                <p
                                    id="username-help"
                                    className="text-xs leading-6 text-muted-foreground"
                                >
                                    Hanya digunakan untuk masuk, bukan identitas
                                    publik. Gunakan huruf, angka, garis bawah,
                                    atau tanda hubung. Jika diubah, gunakan nama
                                    pengguna baru pada login berikutnya.
                                </p>
                                <InputError
                                    id="username-error"
                                    message={errors.username}
                                    className="text-correction-subtle-foreground"
                                />
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                                <p className="text-xs leading-6 text-muted-foreground">
                                    {processing
                                        ? 'Menyimpan perubahan identitas...'
                                        : isDirty
                                          ? 'Ada perubahan yang belum disimpan.'
                                          : 'Perubahan hanya diterapkan setelah kamu menyimpan.'}
                                </p>
                                <Button
                                    disabled={processing}
                                    className="min-h-11 w-full sm:w-auto"
                                    data-test="update-profile-button"
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <Save aria-hidden="true" />
                                    )}
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan perubahan'}
                                </Button>
                            </div>
                        </form>
                    </section>
                    <ExportUserData />
                    <DeleteUser />
                </div>
                <SettingsHelpCard
                    icon={ShieldCheck}
                    eyebrow="Pahami perbedaannya"
                    title="Akun dan ruang kolaborasi"
                >
                    <div className="grid gap-4 text-sm leading-6 text-muted-foreground">
                        <div className="rounded-2xl border border-primary/10 bg-accent/60 p-4">
                            <h3 className="font-semibold text-foreground">
                                Identitas untuk masuk
                            </h3>
                            <p className="mt-2">
                                Nama pengguna dan password adalah akses
                                pribadimu. Jangan bagikan kepada anggota tim.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <GraduationCap
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Afiliasi kampus terpisah
                                </h3>
                                <p className="mt-1">
                                    Mengubah nama akun tidak memverifikasi atau
                                    memindahkan afiliasi kampus.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CircleUserRound
                                aria-hidden="true"
                                className="mt-1 size-4 shrink-0 text-primary"
                            />
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Jangkauan karya tetap pilihanmu
                                </h3>
                                <p className="mt-1">
                                    Pengaturan ini tidak mengubah siapa yang
                                    boleh melihat karya atau profil
                                    profesionalmu.
                                </p>
                            </div>
                        </div>
                    </div>
                </SettingsHelpCard>
            </SettingsGrid>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: 'Pengaturan profil', href: edit() }],
};
