import { Button } from '@/components/ui/button';
import type { TeamFormationState } from '@/types/project';
import { TeamSection } from './team-section';
import type { Decision } from './team-utils';

type Props = {
    pendingRequest: NonNullable<TeamFormationState['pending_join_request']>;
    canWithdraw?: boolean;
    blocked: boolean;
    onOpenDecision: (target: Decision) => void;
};

export function TeamPendingRequestCard({
    pendingRequest,
    canWithdraw,
    blocked,
    onOpenDecision,
}: Props) {
    return (
        <TeamSection
            title="Pengajuanmu sedang ditinjau"
            id="team-request-pending"
        >
            <p className="text-sm leading-6">
                Pemilik menerima pengajuan untuk{' '}
                <strong>{pendingRequest.role?.title ?? 'peran umum'}</strong>.
                Belum menjadi anggota melalui pengajuan ini. Periksa keputusan
                di sini atau pusat notifikasi.
            </p>
            <p className="text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                {pendingRequest.message}
            </p>
            {canWithdraw && (
                <Button
                    type="button"
                    variant="outline"
                    disabled={blocked}
                    className="min-h-11 w-full sm:w-fit"
                    onClick={() =>
                        onOpenDecision({
                            kind: 'withdraw-request',
                            id: pendingRequest.id,
                            person: 'dirimu',
                            revision: pendingRequest.revision,
                        })
                    }
                >
                    Tarik pengajuan
                </Button>
            )}
        </TeamSection>
    );
}
