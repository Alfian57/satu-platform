import { useForm } from '@inertiajs/react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
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
import { SettingsFormFeedback } from '@/pages/settings/_components/settings-form-feedback';

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
                <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-correction-subtle text-correction-subtle-foreground">
                        <ShieldAlert aria-hidden="true" className="size-5" />
                    </span>
                    <DialogTitle className="text-base leading-tight font-semibold sm:text-lg">
                        Yakin ingin menghapus akun?
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Konfirmasi penghapusan akun
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] px-4 py-3 text-xs leading-relaxed text-foreground/80 sm:text-sm dark:bg-destructive/10 dark:text-foreground/90">
                    Lanjutkan hanya jika kamu benar-benar ingin menghapus akun,
                    bukan sekadar keluar atau mengubah pengaturannya.
                </div>
                <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
                    <SettingsFormFeedback
                        errors={errors}
                        actionError={actionError}
                        processing={processing}
                        prefix="delete-account"
                        errorHint="Periksa password dan hasil server sebelum melanjutkan. Membuka dialog saja tidak menghapus akun."
                    />
                    <div className="grid min-w-0 gap-1.5">
                        <Label htmlFor="delete-account-password" required>
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
                        <div className="grid min-w-0 gap-0.5">
                            <p
                                id="delete-password-help"
                                className="text-xs leading-normal text-muted-foreground"
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
                    <DialogFooter className="gap-2 sm:gap-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-10 cursor-pointer px-4"
                                disabled={processing}
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="min-h-10 cursor-pointer px-4 disabled:cursor-not-allowed"
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
