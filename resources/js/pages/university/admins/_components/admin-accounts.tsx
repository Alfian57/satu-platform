import { ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampusOperationHeader } from '@/pages/campus/_components/campus-operation-layout';
import { UniversitySettingsNav } from '@/pages/university/_components/university-settings-nav';
import { AdminAccountsList } from '@/pages/university/admins/_components/admin-accounts-list';
import { AdminActionDialog } from '@/pages/university/admins/_components/admin-action-dialog';
import { AdminInvitationsList } from '@/pages/university/admins/_components/admin-invitations-list';
import { useUniversityAdmins } from '@/pages/university/admins/_hooks/use-university-admins';
import type { UniversityAdminsProps } from '@/pages/university/admins/_hooks/use-university-admins';

const sheet =
    'min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6';

export function AdminAccounts({ initial }: { initial: UniversityAdminsProps }) {
    const {
        snapshot,
        decision,
        phone,
        reason,
        password,
        confirmed,
        needsCheck,
        denied,
        message,
        error,
        busy,
        stale,
        errors,
        activeCount,
        decisionTitle,
        notice,
        feedbackRef,
        titleRef,
        readProcessing,
        confirmationProcessing,
        commandErrors,
        confirmationErrors,
        actions,
    } = useUniversityAdmins(initial);

    return (
        <div className="grid min-w-0 gap-6" data-test="university-admins">
            <CampusOperationHeader
                theme="admins"
                title="Akun admin"
                description="Beberapa pengelola, satu ruang universitas. Setiap tindakan tetap mempunyai pelaku dan riwayatnya sendiri."
                institution={snapshot.institution.name}
                icon={ShieldCheck}
            />
            <UniversitySettingsNav
                institution={snapshot.institution.id}
                active="admins"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
                    Registrasi publik tidak memberi akses admin. Undang
                    pengelola melalui nomor WhatsApp yang benar.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="cursor-pointer disabled:cursor-not-allowed"
                        onClick={() => actions.refreshList()}
                        disabled={busy}
                    >
                        Periksa daftar terbaru
                    </Button>
                    <Button
                        className="cursor-pointer disabled:cursor-not-allowed"
                        onClick={() => actions.openDecision({ kind: 'invite' })}
                        disabled={busy || needsCheck || denied}
                    >
                        <UserPlus aria-hidden="true" className="size-4" />
                        Undang admin
                    </Button>
                </div>
            </div>
            {(message || error || needsCheck) && !decision && (
                <div
                    ref={feedbackRef}
                    tabIndex={-1}
                    className={sheet}
                    role={error ? 'alert' : 'status'}
                >
                    <p>
                        {error ||
                            message ||
                            'Periksa daftar terbaru sebelum melanjutkan.'}
                    </p>
                    {needsCheck && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Command ditahan sampai pembacaan GET berhasil.
                        </p>
                    )}
                </div>
            )}
            {denied ? (
                <div role="alert" className={sheet}>
                    Akses atau sesi admin tidak tersedia. Data sebelumnya
                    disembunyikan. Masuk ulang atau minta pengelola lain
                    memeriksa akses.
                </div>
            ) : (
                <>
                    <AdminAccountsList
                        admins={snapshot.data}
                        activeCount={activeCount}
                        busy={busy}
                        needsCheck={needsCheck}
                        readProcessing={readProcessing}
                        titleRef={titleRef}
                        onStatusChange={(admin) =>
                            actions.openDecision({ kind: 'status', admin })
                        }
                    />
                    <AdminInvitationsList
                        invitations={snapshot.invitations}
                        busy={busy}
                        needsCheck={needsCheck}
                        readProcessing={readProcessing}
                        onRevoke={(invitation) =>
                            actions.openDecision({ kind: 'revoke', invitation })
                        }
                        onPageChange={actions.refreshList}
                    />
                </>
            )}
            {busy && (
                <p role="status" className="text-sm text-muted-foreground">
                    {readProcessing
                        ? 'Memuat daftar terbaru.'
                        : confirmationProcessing
                          ? 'Memeriksa sandi, belum mengubah akses.'
                          : 'Mengirim tindakan. Tunggu konfirmasi server.'}
                </p>
            )}
            <AdminActionDialog
                open={Boolean(decision)}
                decision={decision}
                decisionTitle={decisionTitle}
                notice={notice}
                phone={phone}
                reason={reason}
                password={password}
                confirmed={confirmed}
                busy={busy}
                needsCheck={needsCheck}
                stale={stale}
                error={error}
                errors={errors}
                institutionName={snapshot.institution.name}
                commandErrors={commandErrors}
                confirmationErrors={confirmationErrors}
                feedbackRef={feedbackRef}
                titleRef={titleRef}
                onPhoneChange={actions.setPhone}
                onReasonChange={actions.setReason}
                onPasswordChange={actions.setPassword}
                onClose={actions.closeDecision}
                onSubmit={() => void actions.submitDecision()}
                onRefresh={() => actions.refreshList()}
            />
        </div>
    );
}
