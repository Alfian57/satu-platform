import { Button } from '@/components/ui/button';
import type { TeamFormationState } from '@/types/project';
import { TeamSection } from './team-section';
import { formatDate } from './team-utils';
import type { Decision } from './team-utils';

type Props = {
    invitations: TeamFormationState['pending_invitations'];
    blocked: boolean;
    onOpenDecision: (target: Decision) => void;
};

export function TeamInvitationList({
    invitations,
    blocked,
    onOpenDecision,
}: Props) {
    if (invitations.length === 0) {
        return null;
    }

    return (
        <TeamSection title="Peluang bergabung ke tim" id="team-invitations">
            <ul
                className="grid min-w-0 gap-3"
                aria-label="Undangan tim yang menunggu keputusan"
            >
                {invitations.map((invitation) => (
                    <li
                        key={invitation.id}
                        className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4"
                        data-test={`team-invitation-${invitation.id}`}
                    >
                        <p className="font-semibold wrap-anywhere">
                            {invitation.person?.name ?? 'Pemilik proyek'}{' '}
                            mengundangmu
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                            {invitation.role?.title ?? 'Peran umum'}. Berlaku
                            sampai {formatDate(invitation.expires_at)}.
                        </p>
                        {invitation.is_expired ? (
                            <p role="status" className="text-sm">
                                Undangan sudah berakhir. Mintalah undangan baru
                                bila masih ingin bergabung.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    disabled={blocked}
                                    onClick={() =>
                                        onOpenDecision({
                                            kind: 'accept-invitation',
                                            id: invitation.id,
                                            person:
                                                invitation.person?.name ??
                                                'pemilik proyek',
                                        })
                                    }
                                    data-test={`accept-invitation-${invitation.id}`}
                                    className="min-h-11"
                                >
                                    Terima undangan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={blocked}
                                    onClick={() =>
                                        onOpenDecision({
                                            kind: 'reject-invitation',
                                            id: invitation.id,
                                            person:
                                                invitation.person?.name ??
                                                'pemilik proyek',
                                        })
                                    }
                                    data-test={`reject-invitation-${invitation.id}`}
                                    className="min-h-11"
                                >
                                    Tolak undangan
                                </Button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </TeamSection>
    );
}
