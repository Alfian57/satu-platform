import { Form, Head, usePage } from '@inertiajs/react';
import { CircleUserRound, Save } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { AuthenticatedAuth } from '@/types';

type PageProps = {
    auth: AuthenticatedAuth;
};

export default function Profile() {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Pengaturan profil" />

            <div className="grid gap-6">
                <section
                    aria-labelledby="profile-settings-title"
                    className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                    data-test="profile-settings-card"
                >
                    <header className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                            <CircleUserRound
                                aria-hidden="true"
                                className="size-5"
                            />
                        </span>
                        <div className="grid gap-1">
                            <h2
                                id="profile-settings-title"
                                className="text-title font-bold tracking-[-0.02em] text-slate-950"
                            >
                                Identitas akun
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Perbarui nama yang tampil pada akun dan nama
                                pengguna untuk masuk ke SATU.
                            </p>
                        </div>
                    </header>
                    <Form
                        action={ProfileController.update.url()}
                        method="patch"
                        options={{
                            preserveScroll: true,
                        }}
                        className="grid gap-5 border-t border-slate-100 pt-6"
                    >
                        {({ processing, errors, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>

                                    <Input
                                        id="name"
                                        className="w-full bg-slate-50"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nama lengkap"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="username">
                                        Nama pengguna
                                    </Label>

                                    <Input
                                        id="username"
                                        type="text"
                                        className="w-full bg-slate-50"
                                        defaultValue={auth.user.username}
                                        name="username"
                                        required
                                        autoComplete="username"
                                        placeholder="Nama pengguna"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.username}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        disabled={processing}
                                        className="cursor-pointer disabled:cursor-not-allowed"
                                        data-test="update-profile-button"
                                    >
                                        {processing ? null : (
                                            <Save aria-hidden="true" />
                                        )}
                                        {processing
                                            ? 'Menyimpan perubahan'
                                            : 'Simpan perubahan'}
                                    </Button>
                                    {recentlySuccessful && (
                                        <p
                                            role="status"
                                            className="text-sm font-medium text-verified"
                                        >
                                            Perubahan identitas sudah tersimpan.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan profil',
            href: edit(),
        },
    ],
};
