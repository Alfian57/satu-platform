import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface ProfileEditModalProps {
    open: boolean;
    description: string | null;
    confirmationFocusRef: RefObject<HTMLElement | null>;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ProfileEditModal({
    open,
    description,
    confirmationFocusRef,
    onConfirm,
    onCancel,
}: ProfileEditModalProps) {
    const isDelete = description?.startsWith('Hapus');

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onCancel();
                }
            }}
        >
            <DialogContent
                className="z-[60]"
                onCloseAutoFocus={(event) => {
                    if (confirmationFocusRef.current?.isConnected) {
                        event.preventDefault();
                        requestAnimationFrame(() => {
                            confirmationFocusRef.current?.focus();
                        });
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isDelete
                            ? 'Konfirmasi hapus draft'
                            : 'Konfirmasi perubahan draft'}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant={isDelete ? 'destructive' : 'default'}
                        onClick={onConfirm}
                    >
                        {isDelete ? 'Hapus' : 'Lanjutkan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
