import { CircleUserRound, LockKeyhole, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { SettingsFormFeedback } from '@/components/settings/settings-form-feedback';
import { SettingsCardHeading } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export interface ProfileAccountFormProps {
    data: { name: string; username: string };
    errors: Record<string, string | undefined>;
    processing: boolean;
    recentlySuccessful: boolean;
    isDirty: boolean;
    actionError: string | null;
    onNameChange: (val: string) => void;
    onUsernameChange: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function ProfileAccountForm({
    data,
    errors,
    processing,
    recentlySuccessful,
    isDirty,
    actionError,
    onNameChange,
    onUsernameChange,
    onSubmit,
}: ProfileAccountFormProps) {
    return (
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
                onSubmit={onSubmit}
                className="grid min-w-0 gap-6 border-t border-border pt-6"
                aria-busy={processing}
            >
                <SettingsFormFeedback
                    errors={errors as Record<string, string>}
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
                        value={data.name}
                        onChange={(event) => onNameChange(event.target.value)}
                        name="name"
                        disabled={processing}
                        required
                        maxLength={255}
                        autoComplete="name"
                        placeholder="Nama yang mudah dikenali"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                            errors.name ? 'name-help name-error' : 'name-help'
                        }
                    />
                    <p
                        id="name-help"
                        className="text-xs leading-5 text-muted-foreground"
                    >
                        Nama yang ditampilkan sebagai identitas akunmu.
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
                        value={data.username}
                        onChange={(event) =>
                            onUsernameChange(event.target.value)
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
                        Hanya digunakan untuk masuk, bukan identitas publik.
                        Gunakan huruf, angka, garis bawah, atau tanda hubung.
                        Jika diubah, gunakan nama pengguna baru pada login
                        berikutnya.
                    </p>
                    <InputError
                        id="username-error"
                        message={errors.username}
                        className="text-correction-subtle-foreground"
                    />
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-4">
                    <p className="text-xs leading-6 text-muted-foreground">
                        {processing
                            ? 'Menyimpan perubahan identitas...'
                            : isDirty
                              ? 'Ada perubahan yang belum disimpan.'
                              : 'Perubahan hanya diterapkan setelah kamu menyimpan.'}
                    </p>
                    <Button
                        disabled={processing}
                        className="min-h-11 w-full cursor-pointer disabled:cursor-not-allowed sm:w-auto"
                        data-test="update-profile-button"
                    >
                        {processing ? <Spinner /> : <Save aria-hidden="true" />}
                        {processing ? 'Menyimpan...' : 'Simpan perubahan'}
                    </Button>
                </div>
            </form>
        </section>
    );
}
