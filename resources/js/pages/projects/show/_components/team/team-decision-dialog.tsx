import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { TeamCriteriaCard } from './team-criteria-card';
import { TeamFeedbackAlert } from './team-feedback-alert';
import { firstError, focusTeam, textAreaClass } from './team-utils';
import type { Decision } from './team-utils';

type Props = {
    decision: Decision | null;
    busy: boolean;
    blocked: boolean;
    reason: string;
    decisionErrors: Record<string, unknown>;
    decisionProcessing: boolean;
    mustCheck: boolean;
    syncing: boolean;
    error: string | null;
    triggerRef: RefObject<HTMLElement | null>;
    feedbackRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onChangeReason: (value: string) => void;
    onSubmitDecision: () => void;
    onReload: () => void;
};

export function TeamDecisionDialog({
    decision,
    busy,
    blocked,
    reason,
    decisionErrors,
    decisionProcessing,
    mustCheck,
    syncing,
    error,
    triggerRef,
    feedbackRef,
    onClose,
    onChangeReason,
    onSubmitDecision,
    onReload,
}: Props) {
    if (!decision) {
        return null;
    }

    const isJoinDecision =
        decision.kind === 'accept-request' ||
        decision.kind === 'reject-request';
    const accepting =
        decision.kind === 'accept-request' ||
        decision.kind === 'accept-invitation';
    const withdrawing = decision.kind === 'withdraw-request';
    const validation = firstError(decisionErrors);

    return (
        <Dialog
            open={decision !== null}
            onOpenChange={(open) => {
                if (!open && !busy) {
                    onClose();
                }
            }}
        >
            <DialogContent
                closeButtonDisabled={busy}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();

                    if (
                        triggerRef.current?.isConnected &&
                        !triggerRef.current.matches(':disabled')
                    ) {
                        triggerRef.current.focus();
                    } else {
                        focusTeam();
                    }
                }}
            >
                <DialogTitle className="pr-10 wrap-anywhere">
                    {withdrawing
                        ? 'Tarik pengajuanmu?'
                        : accepting
                          ? `Terima ${isJoinDecision ? 'pengajuan' : 'undangan'} ${decision.person}?`
                          : decision.kind === 'revoke-invitation'
                            ? `Batalkan undangan untuk ${decision.person}?`
                            : `Tolak ${isJoinDecision ? 'pengajuan' : 'undangan'} ${decision.person}?`}
                </DialogTitle>
                <DialogDescription>
                    {withdrawing
                        ? 'Pemilik tidak lagi dapat menerima pengajuan ini. Riwayat tetap tersimpan; kamu dapat mengajukan kembali jika proyek masih menerima anggota.'
                        : isJoinDecision
                          ? 'Tuliskan alasan terkait kebutuhan peran. Alasan dibagikan kepada pemohon, bukan catatan internal. Hindari kontak, popularitas, dan penilaian kepribadian.'
                          : accepting
                            ? 'Penerimaan diperiksa ulang terhadap kapasitas, tenggat, dan izin terbaru. Keanggotaan baru hanya terbentuk jika berhasil.'
                            : 'Tindakan ini tidak menghapus profil atau riwayat. Catatan terkait kolaborasi bersifat opsional.'}
                </DialogDescription>
                {isJoinDecision && <TeamCriteriaCard role={decision.role} />}
                <TeamFeedbackAlert
                    error={error}
                    validation={validation}
                    mustCheck={mustCheck}
                    syncing={syncing}
                    feedbackRef={feedbackRef}
                    onReload={onReload}
                />
                {(isJoinDecision || (!withdrawing && !accepting)) && (
                    <div className="grid gap-2">
                        <Label htmlFor="owner-decision-reason">
                            {isJoinDecision
                                ? 'Alasan keputusan (dibagikan kepada pemohon)'
                                : 'Catatan opsional'}
                        </Label>
                        <textarea
                            id="owner-decision-reason"
                            aria-required={isJoinDecision}
                            value={reason}
                            disabled={busy || mustCheck}
                            onChange={(event) =>
                                onChangeReason(event.target.value)
                            }
                            rows={3}
                            maxLength={1000}
                            className={textAreaClass}
                            aria-invalid={Boolean(decisionErrors.reason)}
                            aria-describedby="decision-reason-hint"
                        />
                        <p
                            id="decision-reason-hint"
                            className="text-xs leading-5 text-muted-foreground"
                        >
                            {firstError({
                                reason: decisionErrors.reason,
                            }) ??
                                (isJoinDecision
                                    ? 'Wajib diisi. Jelaskan kebutuhan yang sesuai atau belum terpenuhi, maksimal 1000 karakter.'
                                    : 'Maksimal 1000 karakter.')}
                        </p>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            className="min-h-11"
                        >
                            Kembali
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant={accepting ? 'default' : 'destructive'}
                        disabled={blocked}
                        onClick={onSubmitDecision}
                        data-test={
                            isJoinDecision ||
                            decision.kind === 'revoke-invitation'
                                ? 'confirm-owner-team-decision'
                                : withdrawing
                                  ? 'confirm-withdraw-request'
                                  : 'confirm-reject-invitation'
                        }
                        className="min-h-11 whitespace-normal"
                    >
                        {decisionProcessing && <Spinner aria-hidden="true" />}
                        {withdrawing
                            ? 'Ya, tarik pengajuan'
                            : accepting
                              ? isJoinDecision
                                  ? 'Terima dan bentuk keanggotaan'
                                  : 'Terima undangan'
                              : decision.kind === 'revoke-invitation'
                                ? 'Batalkan undangan'
                                : isJoinDecision
                                  ? 'Simpan penolakan'
                                  : 'Tolak undangan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
