import { ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteUserDialog } from './delete-user-dialog';

export default function DeleteUser() {
    const [open, setOpen] = useState(false);

    return (
        <section
            aria-labelledby="delete-account-title"
            className="grid min-w-0 gap-5 rounded-2xl border border-correction/25 bg-card p-5 shadow-sm sm:p-6"
            data-test="delete-account-card"
        >
            <header className="flex min-w-0 items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-correction-subtle text-correction-subtle-foreground">
                    <ShieldAlert aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-correction-subtle-foreground">
                        Tindakan sensitif
                    </p>
                    <h2
                        id="delete-account-title"
                        className="mt-1 text-title font-semibold"
                    >
                        Hapus akun
                    </h2>
                    <p className="mt-2 max-w-[60ch] text-sm leading-6 text-muted-foreground">
                        Akun akan dihapus dan kamu akan keluar dari SATU.
                        Tindakan ini tidak dapat dibatalkan dari halaman ini.
                    </p>
                </div>
            </header>
            <div className="rounded-2xl border border-border bg-background/60 p-4 text-xs leading-6 text-muted-foreground">
                Bukan cara untuk mengubah nama atau jangkauan karya. Periksa
                kembali sebelum melanjutkan.
            </div>
            <Button
                variant="outline"
                className="min-h-11 w-full cursor-pointer border-correction/30 text-correction-subtle-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground sm:w-fit"
                data-test="delete-user-button"
                onClick={() => setOpen(true)}
            >
                <Trash2 aria-hidden="true" />
                Hapus akun
            </Button>
            <DeleteUserDialog open={open} onOpenChange={setOpen} />
        </section>
    );
}
