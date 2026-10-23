import { LockKeyhole, PencilLine, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    ContributionStatusBadge,
    contributionStatusMeta,
} from '@/pages/contributions/_components/contribution-status';
import {
    formatDate,
    verificationLabel,
} from '@/pages/contributions/_utils/contribution-helpers';
import { ContributionRecoveryCard } from '@/pages/contributions/show/_components/contribution-recovery-card';
import type { UseContributionDetailReturn } from '@/pages/contributions/show/_hooks/use-contribution-detail';

export interface ContributionDetailActionsRailProps {
    state: UseContributionDetailReturn['state'];
    actions: UseContributionDetailReturn['actions'];
    editButtonRef: React.RefObject<HTMLButtonElement | null>;
    canEdit: boolean;
}

export function ContributionDetailActionsRail({
    state,
    actions,
    editButtonRef,
    canEdit,
}: ContributionDetailActionsRailProps) {
    const {
        contribution,
        permissions,
        isComposerOpen,
        isSubmitting,
        isRevising,
        isCheckingLatest,
        needsCheck,
        checkedContribution,
        currentVersion,
    } = state;
    const status = contribution.status;
    const meta = contributionStatusMeta[status];

    return (
        <div className="grid gap-6">
            <section className="grid min-w-0 gap-4 rounded-3xl border border-primary/20 bg-linear-to-br from-card to-accent/50 p-5 shadow-md sm:p-6">
                <p className="text-xs font-semibold text-primary">
                    Langkah berikutnya
                </p>
                <div data-test="contribution-status">
                    <ContributionStatusBadge status={status} />
                </div>
                <p className="text-lg leading-snug font-bold tracking-tight">
                    {meta.nextStep}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                    {meta.description}
                </p>
                {permissions.can_submit &&
                    status === 'draft' &&
                    !isComposerOpen && (
                        <Button
                            type="button"
                            className="min-h-11 w-full cursor-pointer rounded-xl whitespace-normal disabled:cursor-not-allowed"
                            onClick={actions.submitContribution}
                            disabled={
                                isSubmitting ||
                                isRevising ||
                                needsCheck ||
                                isCheckingLatest
                            }
                            data-test="contribution-submit"
                        >
                            {isSubmitting && <Spinner aria-hidden="true" />}
                            Kirim untuk validasi
                        </Button>
                    )}
                {permissions.can_update &&
                    (status === 'draft' || status === 'revision') &&
                    !isComposerOpen &&
                    canEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            ref={editButtonRef}
                            className="min-h-11 w-full cursor-pointer rounded-xl whitespace-normal disabled:cursor-not-allowed"
                            onClick={() => {
                                actions.clearActionError();
                                actions.setIsEditing(true);
                            }}
                            disabled={isSubmitting || isRevising}
                            data-test="contribution-edit"
                        >
                            <PencilLine aria-hidden="true" />
                            {status === 'revision'
                                ? 'Tanggapi revisi'
                                : 'Edit draft'}
                        </Button>
                    )}
                {isComposerOpen && (
                    <p className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                        Simpan perubahan atau tutup editor untuk kembali ke
                        detail. Pengiriman untuk validasi dilakukan setelah
                        draft tersimpan.
                    </p>
                )}
                {status === 'pending' && (
                    <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                        <LockKeyhole
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        <p>Mode baca. Perubahan menunggu keputusan reviewer.</p>
                    </div>
                )}
                <p
                    className="min-h-5 text-xs leading-5 font-medium text-primary"
                    role="status"
                    aria-live="polite"
                    data-test="contribution-submit-status"
                >
                    {isSubmitting ? 'Mengirim untuk validasi kampus...' : null}
                </p>
            </section>

            <ContributionRecoveryCard
                isCheckingLatest={isCheckingLatest}
                needsCheck={needsCheck}
                checkedContribution={checkedContribution}
                isSubmitting={isSubmitting}
                isRevising={isRevising}
                onCheckLatest={actions.checkLatest}
                onUseLatest={actions.useLatest}
            />

            <section className="grid min-w-0 gap-4 border-t border-border/70 px-1 pt-5">
                <p className="text-xs font-semibold text-primary">
                    Informasi catatan
                </p>
                <dl className="grid gap-3 text-sm">
                    <div className="grid gap-1">
                        <dt className="text-muted-foreground">
                            Level validasi
                        </dt>
                        <dd className="font-semibold">
                            {verificationLabel(status)}
                        </dd>
                    </div>
                    <div className="grid gap-1">
                        <dt className="text-muted-foreground">Versi aktif</dt>
                        <dd className="font-semibold">
                            {currentVersion === null
                                ? 'Belum ada versi'
                                : `Versi ${currentVersion.version_number}`}
                        </dd>
                    </div>
                    <div className="grid gap-1">
                        <dt className="text-muted-foreground">Diperbarui</dt>
                        <dd className="font-semibold">
                            {formatDate(contribution.updated_at)}
                        </dd>
                    </div>
                </dl>
                <p className="text-xs leading-5 text-muted-foreground">
                    Validasi mengacu pada kontribusi dan versi yang ditinjau,
                    bukan seluruh keahlian atau jaminan kualitas mutlak. Tidak
                    ada janji waktu pemeriksaan atau kredit akademik.
                </p>
            </section>

            <div className="flex items-start gap-3 border-t border-border/70 px-1 pt-5 text-sm leading-6 text-muted-foreground">
                <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-verified"
                />
                <p>
                    Bukti pekerjaan bersifat privat. Aksesnya mengikuti izin
                    pada proyek, bukan otomatis terbuka untuk publik.
                </p>
            </div>
        </div>
    );
}
