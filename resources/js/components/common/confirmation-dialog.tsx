import type { LucideIcon } from 'lucide-react';
import { HelpCircle, ShieldAlert } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
    icon?:
        | LucideIcon
        | ComponentType<{
              className?: string;
              'aria-hidden'?: boolean | 'true' | 'false';
          }>
        | null;
    warningNotice?: string | ReactNode;
    children?: ReactNode;
    className?: string;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Batal',
    destructive = false,
    onConfirm,
    loading = false,
    icon,
    warningNotice,
    children,
    className,
}: ConfirmationDialogProps) {
    const defaultConfirmLabel = destructive ? 'Ya, hapus' : 'Konfirmasi';
    const effectiveConfirmLabel = confirmLabel ?? defaultConfirmLabel;

    const IconComponent =
        icon === null
            ? null
            : (icon ?? (destructive ? ShieldAlert : HelpCircle));

    function handleOpenChange(next: boolean): void {
        if (loading) {
            return;
        }

        onOpenChange(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn('min-w-0 [overflow-wrap:anywhere]', className)}
                closeButtonDisabled={loading}
                onEscapeKeyDown={(event) => {
                    if (loading) {
                        event.preventDefault();
                    }
                }}
                onInteractOutside={(event) => {
                    if (loading) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    {IconComponent && (
                        <span
                            className={cn(
                                'mb-2 grid size-12 place-items-center rounded-2xl',
                                destructive
                                    ? 'bg-correction-subtle text-correction-subtle-foreground'
                                    : 'bg-accent text-primary',
                            )}
                        >
                            <IconComponent
                                aria-hidden="true"
                                className="size-6"
                            />
                        </span>
                    )}
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {warningNotice && (
                    <div
                        role="note"
                        className={cn(
                            'rounded-2xl border p-4 text-xs leading-5',
                            destructive
                                ? 'border-correction/25 bg-correction-subtle text-correction-subtle-foreground'
                                : 'border-border bg-muted/60 text-muted-foreground',
                        )}
                    >
                        {warningNotice}
                    </div>
                )}

                {children && (
                    <div className="grid min-w-0 gap-4">{children}</div>
                )}

                <DialogFooter className="gap-2 sm:gap-3">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant={destructive ? 'destructive' : 'default'}
                        className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
                        disabled={loading}
                        onClick={onConfirm}
                    >
                        {loading && <Spinner className="size-4" />}
                        <span>
                            {loading ? 'Memproses...' : effectiveConfirmLabel}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
