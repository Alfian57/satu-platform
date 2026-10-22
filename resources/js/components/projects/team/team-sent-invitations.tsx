import { Button } from '@/components/ui/button';
import type { TeamFormationState } from '@/types/project';
import { TeamSection } from './team-section';
import { formatDate } from './team-utils';
import type { Decision } from './team-utils';

type Props = {
    invitations: TeamFormationState['sent_invitations'];
    blocked: boolean;
    onOpenDecision: (target: Decision) => void;
};

export function TeamSentInvitations({
    invitations,
    blocked,
    onOpenDecision,
}: Props) {
    return (
        <TeamSection
            title="Undangan yang masih aktif"
            id="team-sent-invitations"
        >
            {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Belum ada undangan aktif yang perlu dikelola.
                </p>
            ) : (
                <ul
                    className="grid gap-3"
                    aria-label="Undangan tim yang dikirim pemilik"
                >
                    {invitations.map((invitation) => (
                        <li
                            key={invitation.id}
                            className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4"
                            data-test={`team-sent-invitation-${invitation.id}`}
                        >
                            <p className="font-semibold wrap-anywhere">
                                {invitation.person?.name ?? 'Mahasiswa'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {invitation.role?.title ?? 'Peran umum'}.
                                Berlaku sampai{' '}
                                {formatDate(invitation.expires_at)}.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={blocked}
                                className="min-h-11 w-full sm:w-fit"
                                data-test={`revoke-invitation-${invitation.id}`}
                                onClick={() =>
                                    onOpenDecision({
                                        kind: 'revoke-invitation',
                                        id: invitation.id,
                                        person:
                                            invitation.person?.name ??
                                            'mahasiswa',
                                    })
                                }
                            >
                                Batalkan undangan
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </TeamSection>
    );
}
