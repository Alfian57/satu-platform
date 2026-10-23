import { ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteUserDialog } from './delete-user-dialog';

export default function DeleteUser() {
    const [open, setOpen] = useState(false);

    return (
        <section
            aria-labelledby="delete-account-title"
            className="flex min-w-0 flex-col gap-4 rounded-2xl border border-correction/25 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
            data-test="delete-account-card"
        >
            <header className="flex min-w-0 items-start gap-3 sm:items-center">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-correction-subtle text-correction-subtle-foreground">
                    <ShieldAlert aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <h2
                        id="delete-account-title"
                        className="text-sm font-semibold text-foreground sm:text-base"
                    >
                        Hapus akun
                    </h2>
                    <p className="mt-0.5 text-xs leading-normal text-muted-foreground">
                        Hapus akun secara permanen beserta seluruh data dan
                        akses masuk.
                    </p>
                </div>
            </header>

            <Button
                variant="outline"
                className="min-h-10 w-full shrink-0 cursor-pointer justify-center border-correction/30 text-correction-subtle-foreground hover:bg-correction-subtle hover:text-correction-subtle-foreground sm:w-48"
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
