import { CircleUserRound, Save } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { SettingsFormFeedback } from '@/pages/settings/_components/settings-form-feedback';
import { SettingsCardHeading } from '@/pages/settings/_components/settings-panel';

export interface ProfileAccountFormProps {
    data: { name: string; username: string };
    errors: Record<string, string | undefined>;
    processing: boolean;
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
    isDirty,
    actionError,
    onNameChange,
    onUsernameChange,
    onSubmit,
}: ProfileAccountFormProps) {
    return (
        <section
            aria-labelledby="profile-settings-title"
            className="grid min-w-0 gap-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
            data-test="profile-settings-card"
        >
            <SettingsCardHeading
                id="profile-settings-title"
                icon={CircleUserRound}
                title="Identitas akun"
            />
            <form
                onSubmit={onSubmit}
                className="grid min-w-0 gap-4 border-t border-border pt-5"
                aria-busy={processing}
            >
                <SettingsFormFeedback
                    errors={errors as Record<string, string>}
                    actionError={actionError}
                    processing={processing}
                    prefix="profile-settings"
                    errorHint="Isianmu tetap tersedia. Tidak ada perubahan yang dinyatakan tersimpan sebelum konfirmasi server."
                />
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="name" required>
                        Nama akun
                    </Label>
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
                        placeholder="Masukkan nama lengkap"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                            errors.name ? 'name-help name-error' : 'name-help'
                        }
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="name-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Nama yang ditampilkan sebagai identitas akunmu.
                        </p>
                        <InputError
                            id="name-error"
                            message={errors.name}
                            className="text-correction-subtle-foreground"
                        />
                    </div>
                </div>
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="username" required>
                        Nama pengguna pribadi
                    </Label>
                    <Input
                        id="username"
                        type="text"
                        className="h-11 bg-background/60"
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
                        placeholder="Masukkan nama pengguna"
                        aria-invalid={Boolean(errors.username)}
                        aria-describedby={
                            errors.username
                                ? 'username-help username-error'
                                : 'username-help'
                        }
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p
                            id="username-help"
                            className="text-xs leading-normal text-muted-foreground"
                        >
                            Hanya digunakan untuk masuk, bukan identitas publik.
                            Gunakan huruf, angka, garis bawah, atau tanda
                            hubung. Jika diubah, gunakan nama pengguna baru pada
                            login berikutnya.
                        </p>
                        <InputError
                            id="username-error"
                            message={errors.username}
                            className="text-correction-subtle-foreground"
                        />
                    </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-2">
                    {isDirty ? (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Ada perubahan yang belum disimpan.
                        </p>
                    ) : (
                        <span />
                    )}
                    <Button
                        disabled={processing}
                        className="min-h-10 w-full cursor-pointer justify-center disabled:cursor-not-allowed sm:w-48"
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
