import { Form } from '@inertiajs/react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section
            aria-labelledby="delete-account-title"
            className="grid gap-5 rounded-2xl border border-correction/30 bg-correction-subtle p-5 sm:p-6"
        >
            <header className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-correction/30 bg-white/75 text-correction">
                    <ShieldAlert aria-hidden="true" className="size-5" />
                </span>
                <div className="grid gap-1">
                    <h2
                        id="delete-account-title"
                        className="text-title font-bold tracking-[-0.02em] text-correction-subtle-foreground"
                    >
                        Hapus akun
                    </h2>
                    <p className="text-sm leading-6 text-correction-subtle-foreground">
                        Tindakan ini menghapus akun dan data terkait secara
                        permanen. Lanjutkan hanya bila kamu benar-benar yakin.
                    </p>
                </div>
            </header>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className="w-fit cursor-pointer"
                        data-test="delete-user-button"
                    >
                        <Trash2 aria-hidden="true" />
                        Hapus akun
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Yakin ingin menghapus akunmu?</DialogTitle>
                    <DialogDescription>
                        Setelah akun dihapus, seluruh data di dalamnya juga akan
                        terhapus secara permanen. Masukkan password untuk
                        mengonfirmasi penghapusan akun.
                    </DialogDescription>

                    <Form
                        action={ProfileController.destroy.url()}
                        method="delete"
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="sr-only"
                                    >
                                        Password
                                    </Label>

                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Password"
                                        autoComplete="current-password"
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Batal
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                        asChild
                                    >
                                        <button
                                            type="submit"
                                            className="cursor-pointer disabled:cursor-not-allowed"
                                            data-test="confirm-delete-user-button"
                                        >
                                            Hapus akun
                                        </button>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
