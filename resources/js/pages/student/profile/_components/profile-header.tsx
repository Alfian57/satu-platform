import { LockKeyhole, UserRoundCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import type { UseCapabilityProfileReturn } from '@/pages/student/profile/_hooks/useCapabilityProfile';

export interface ProfileHeaderProps {
    institution: { id: number; name: string; timezone: string } | null;
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
    helpers: UseCapabilityProfileReturn['helpers'];
}

export function ProfileHeader({
    institution,
    state,
    actions,
    helpers,
}: ProfileHeaderProps) {
    const {
        canEdit,
        blocked,
        issue,
        errors,
        mustReconcile,
        refreshFailed,
        busy,
    } = state;
    const { notice, errorRef } = helpers;

    return (
        <div className="space-y-6">
            <header className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-card to-accent/60 p-5 shadow-sm sm:p-6">
                <DashboardArchiveArt className="pointer-events-none absolute top-0 right-3 hidden w-28 opacity-40 sm:block" />
                <div className="relative min-w-0 space-y-3 sm:pr-28">
                    <div className="flex items-center gap-3">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                            <UserRoundCog aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary">
                                Bekal untuk berkolaborasi
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Profil kemampuan
                            </h1>
                        </div>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        Mulai dari yang ingin kamu pelajari dan kemampuan yang
                        kamu miliki. Tidak wajib mempunyai karya atau pengalaman
                        proyek.
                    </p>
                    {institution && (
                        <p className="text-sm font-medium wrap-anywhere">
                            {institution.name}
                        </p>
                    )}
                </div>
            </header>

            {issue && (
                <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    className="space-y-2 rounded-2xl border border-correction/40 bg-correction-subtle p-5 text-correction-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    data-test="capability-error"
                >
                    <p className="font-semibold">{issue}</p>
                    {Object.entries(errors).length > 0 && (
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                            {Object.entries(errors).map(([key, value]) => (
                                <li key={key}>{value}</li>
                            ))}
                        </ul>
                    )}
                    {(mustReconcile || blocked || refreshFailed) && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={actions.reloadProfile}
                        >
                            Muat data tersimpan
                        </Button>
                    )}
                </div>
            )}

            {!canEdit && (
                <section
                    className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6"
                    data-test="capability-forbidden"
                >
                    <LockKeyhole
                        aria-hidden="true"
                        className="size-8 text-primary"
                    />
                    <h2 className="text-xl font-bold">
                        {blocked
                            ? 'Akses profil perlu diperiksa'
                            : notice.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {blocked
                            ? 'Data profil sebelumnya tidak ditampilkan. Periksa status afiliasi terbaru untuk memastikan akses. Isian yang belum tersimpan tidak dikirim ulang otomatis.'
                            : notice.description}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={actions.openAffiliation}>
                            Periksa afiliasi
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={actions.reloadProfile}
                        >
                            Periksa akses kembali
                        </Button>
                    </div>
                </section>
            )}
        </div>
    );
}
