import { RequiredMark } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { campusControlClass } from '@/pages/campus/_components/campus-operation-layout';
import type { Decision } from '@/pages/university/admins/_hooks/use-university-admins';

export interface AdminActionDialogProps {
    open: boolean;
    decision: Decision | null;
    decisionTitle: string;
    notice: string;
    phone: string;
    reason: string;
    password: string;
    confirmed: boolean;
    busy: boolean;
    needsCheck: boolean;
    stale: boolean;
    error: string;
    errors: string[];
    institutionName: string;
    commandErrors: Record<string, string>;
    confirmationErrors: Record<string, string>;
    feedbackRef: React.RefObject<HTMLDivElement | null>;
    titleRef: React.RefObject<HTMLHeadingElement | null>;
    onPhoneChange: (val: string) => void;
    onReasonChange: (val: string) => void;
    onPasswordChange: (val: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    onRefresh: () => void;
}

export function AdminActionDialog({
    open,
    decision,
    decisionTitle,
    notice,
    phone,
    reason,
    password,
    confirmed,
    busy,
    needsCheck,
    stale,
    error,
    errors,
    institutionName,
    commandErrors,
    confirmationErrors,
    feedbackRef,
    titleRef,
    onPhoneChange,
    onReasonChange,
    onPasswordChange,
    onClose,
    onSubmit,
    onRefresh,
}: AdminActionDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    onClose();
                }
            }}
        >
            <DialogContent
                closeButtonDisabled={busy}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    titleRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>{decisionTitle}</DialogTitle>
                    <DialogDescription>{notice}</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                    className="grid min-w-0 gap-4"
                >
                    <div className="rounded-2xl bg-accent p-4 text-sm leading-6">
                        {decision?.kind === 'status'
                            ? decision.admin.name
                            : decision?.kind === 'revoke'
                              ? `Undangan ${decision.invitation.id}. ${decision.invitation.phone_masked}`
                              : `Penerima diundang sebagai Admin Universitas untuk ${institutionName}.`}
                    </div>
                    {(error || errors.length > 0 || stale) && (
                        <div
                            ref={feedbackRef}
                            tabIndex={-1}
                            role="alert"
                            id="admin-command-errors"
                            className="rounded-xl border border-correction/30 p-3 text-sm"
                        >
                            <p>
                                {stale
                                    ? 'Data admin berubah. Tutup dialog dan pilih ulang tindakan setelah memeriksa daftar.'
                                    : error}
                            </p>
                            {errors.map((item, i) => (
                                <p key={i}>{item}</p>
                            ))}
                        </div>
                    )}
                    {decision?.kind === 'invite' ? (
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                            <span>
                                Nomor WhatsApp
                                <RequiredMark />
                            </span>
                            <input
                                className={campusControlClass}
                                type="tel"
                                autoComplete="tel"
                                placeholder="Contoh: 081234567890"
                                value={phone}
                                maxLength={20}
                                onChange={(event) =>
                                    onPhoneChange(event.target.value)
                                }
                                required
                                disabled={busy || needsCheck || confirmed}
                                aria-invalid={Boolean(commandErrors.phone)}
                                aria-describedby={
                                    commandErrors.phone
                                        ? 'admin-command-errors'
                                        : undefined
                                }
                            />
                        </label>
                    ) : (
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                            <span>
                                Alasan tindakan
                                <RequiredMark />
                            </span>
                            <textarea
                                className={campusControlClass}
                                aria-label="Alasan tindakan"
                                placeholder="Tuliskan alasan tindakan administrasi ini"
                                value={reason}
                                minLength={3}
                                maxLength={1000}
                                rows={3}
                                required
                                disabled={busy || needsCheck || confirmed}
                                onChange={(event) =>
                                    onReasonChange(event.target.value)
                                }
                                aria-invalid={Boolean(commandErrors.reason)}
                                aria-describedby={
                                    commandErrors.reason
                                        ? 'admin-command-errors'
                                        : undefined
                                }
                            />
                        </label>
                    )}
                    {!confirmed ? (
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                            <span>
                                Sandi saat ini
                                <RequiredMark />
                            </span>
                            <input
                                className={campusControlClass}
                                type="password"
                                aria-label="Sandi saat ini"
                                placeholder="Masukkan sandi saat ini untuk konfirmasi"
                                aria-describedby={
                                    confirmationErrors.password
                                        ? 'admin-password-help admin-command-errors'
                                        : 'admin-password-help'
                                }
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) =>
                                    onPasswordChange(event.target.value)
                                }
                                required
                                disabled={busy || needsCheck}
                                aria-invalid={Boolean(
                                    confirmationErrors.password,
                                )}
                            />
                            <div className="grid min-w-0 gap-0.5">
                                <span
                                    id="admin-password-help"
                                    className="text-xs leading-normal font-normal text-muted-foreground"
                                >
                                    Memeriksa sandi belum mengirim tindakan.
                                </span>
                            </div>
                        </label>
                    ) : (
                        <p
                            role="status"
                            className="rounded-xl bg-accent p-3 text-sm"
                        >
                            Sandi dikonfirmasi. Tindakan belum dikirim; periksa
                            kembali lalu konfirmasi.
                        </p>
                    )}
                    {needsCheck && (
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer disabled:cursor-not-allowed"
                            disabled={busy}
                            onClick={onRefresh}
                        >
                            Periksa daftar terbaru
                        </Button>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer disabled:cursor-not-allowed"
                            onClick={onClose}
                            disabled={busy}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="cursor-pointer disabled:cursor-not-allowed"
                            disabled={busy || needsCheck || stale}
                        >
                            {confirmed
                                ? 'Konfirmasi tindakan'
                                : 'Konfirmasi sandi'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
