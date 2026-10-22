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
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    requestAnimationFrame(() => {
                        if (confirmationFocusRef.current?.isConnected) {
                            confirmationFocusRef.current.focus();
                        } else {
                            document
                                .getElementById('capability-skill-choice')
                                ?.focus();
                        }
                    });
                }}
            >
                <DialogHeader>
                    <DialogTitle>Konfirmasi perubahan draft</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Batal
                    </Button>
                    <Button type="button" onClick={onConfirm}>
                        Lanjutkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
