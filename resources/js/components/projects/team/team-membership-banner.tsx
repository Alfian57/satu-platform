import { Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import ProjectWorkspaceController from '@/actions/App/Http/Controllers/ProjectWorkspaceController';
import { Button } from '@/components/ui/button';
import type { TeamFormationState } from '@/types/project';
import { TeamSection } from './team-section';

type Props = {
    projectId: number;
    membership: NonNullable<TeamFormationState['current_membership']>;
    canWorkspace?: boolean;
};

export function TeamMembershipBanner({
    projectId,
    membership,
    canWorkspace = false,
}: Props) {
    return (
        <TeamSection title="Kamu sudah bergabung" id="team-membership">
            <p className="flex gap-2 text-sm leading-6">
                <CheckCircle2
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-verified"
                />
                <span>
                    Peranmu:{' '}
                    <strong>{membership.role?.title ?? 'Peran umum'}</strong>.
                    Keanggotaan aktif tercatat.
                </span>
            </p>
            {canWorkspace && (
                <Button
                    asChild
                    className="min-h-11 w-full whitespace-normal sm:w-fit"
                >
                    <Link href={ProjectWorkspaceController.show(projectId)}>
                        Buka ruang kerja
                    </Link>
                </Button>
            )}
        </TeamSection>
    );
}
