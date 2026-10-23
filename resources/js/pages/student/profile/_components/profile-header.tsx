import { LockKeyhole, UserRoundCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentMenuHero from '@/layouts/_components/student-menu-hero';
import type { UseCapabilityProfileReturn } from '@/pages/student/profile/_hooks/useCapabilityProfile';

export interface ProfileHeaderProps {
    institution?: { id: number; name: string; timezone: string } | null;
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
    helpers: UseCapabilityProfileReturn['helpers'];
}

export function ProfileHeader({ state, actions, helpers }: ProfileHeaderProps) {
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
            <StudentMenuHero
                icon={UserRoundCog}
                eyebrow="Bekal untuk berkolaborasi"
                title="Profil kemampuan."
                description="Mulai dari yang ingin kamu pelajari dan kemampuan yang kamu miliki. Tidak wajib mempunyai karya atau pengalaman proyek."
                pose="account-care"
                theme="settings"
                testId="capability-header"
            />

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
