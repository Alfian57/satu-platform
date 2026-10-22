import { useForm } from '@inertiajs/react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SettingsFormFeedback } from '@/components/settings/settings-form-feedback';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export interface DeleteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({
    open,
    onOpenChange,
}: DeleteUserDialogProps) {
    const form = useForm({ password: '' });
    const { processing, errors } = form;
    const [actionError, setActionError] = useState<string | null>(null);

    function handleOpenChange(next: boolean): void {
        if (processing) {
            return;
        }

        if (!next) {
            form.resetAndClearErrors();
            setActionError(null);
        }

        onOpenChange(next);
    }

    function handleSubmit(event: React.FormEvent): void {
        event.preventDefault();

        if (processing) {
            return;
        }

        form.submit(ProfileController.destroy(), {
            preserveScroll: true,
            onStart: () => setActionError(null),
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
            onNetworkError: () => {
                setActionError(
                    'Koneksi terputus. Hasil penghapusan belum dapat dikonfirmasi. Periksa koneksi dan status akun sebelum mencoba lagi.',
                );

                return false;
            },
            onHttpException: (response) => {
                setActionError(
                    [401, 403, 419].includes(response.status)
                        ? 'Sesi atau akses penghapusan tidak tersedia. Muat ulang halaman sebelum mencoba lagi.'
                        : 'Respons penghapusan belum tersedia. Periksa status akun sebelum mencoba lagi.',
                );

                return false;
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="min-w-0 [overflow-wrap:anywhere]"
                closeButtonDisabled={processing}
                onEscapeKeyDown={(event) => {
                    if (processing) {
                        event.preventDefault();
                    }
                }}
                onInteractOutside={(event) => {
                    if (processing) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-correction-subtle text-correction-subtle-foreground">
                        <ShieldAlert aria-hidden="true" className="size-6" />
                    </span>
                    <DialogTitle>Yakin ingin menghapus akun?</DialogTitle>
                    <DialogDescription>
                        Akun akan dihapus dan sesi ini akan diakhiri. Masukkan
                        password saat ini untuk mengonfirmasi tindakan.
                    </DialogDescription>
                </DialogHeader>
                <p className="rounded-2xl border border-correction/25 bg-correction-subtle p-4 text-sm leading-6 text-correction-subtle-foreground">
                    Lanjutkan hanya jika kamu benar-benar ingin menghapus akun,
                    bukan sekadar keluar atau mengubah pengaturannya.
                </p>
                <form onSubmit={handleSubmit} className="grid min-w-0 gap-5">
                    <SettingsFormFeedback
                        errors={errors}
                        actionError={actionError}
                        processing={processing}
                        prefix="delete-account"
                        errorHint="Periksa password dan hasil server sebelum melanjutkan. Membuka dialog saja tidak menghapus akun."
                    />
                    <div className="grid min-w-0 gap-3">
                        <Label htmlFor="delete-account-password">
                            Password saat ini
                        </Label>
                        <PasswordInput
                            id="delete-account-password"
                            name="password"
                            disabled={processing}
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            className="h-11 bg-background/60 pr-12 [&+button]:w-11 [&+button]:justify-center"
                            required
                            placeholder="Konfirmasi dengan password saat ini"
                            autoComplete="current-password"
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={
                                errors.password
                                    ? 'delete-password-help delete-password-error'
                                    : 'delete-password-help'
                            }
                        />
                        <p
                            id="delete-password-help"
                            className="text-xs leading-5 text-muted-foreground"
                        >
                            Password digunakan untuk memastikan tindakan
                            dilakukan oleh pemilik akun.
                        </p>
                        <InputError
                            id="delete-password-error"
                            message={errors.password}
                            className="text-correction-subtle-foreground"
                        />
                    </div>
                    {processing && (
                        <p
                            role="status"
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <Spinner />
                            Mengirim permintaan penghapusan. Tunggu hasilnya
                            sebelum menutup dialog.
                        </p>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 cursor-pointer"
                                disabled={processing}
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
                            disabled={processing}
                            data-test="confirm-delete-user-button"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <Trash2 aria-hidden="true" />
                            )}
                            {processing ? 'Menghapus...' : 'Ya, hapus akun'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
