import type { TeamFormationState } from '@/types/project';
import { TeamSection } from './team-section';

type Props = {
    members: TeamFormationState['active_members'];
};

export function TeamActiveMembers({ members }: Props) {
    return (
        <TeamSection title="Anggota yang sudah bergabung" id="team-members">
            {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Belum ada anggota aktif tercatat. Pengajuan belum mengisi
                    kapasitas tim.
                </p>
            ) : (
                <ul aria-label="Anggota aktif tim" className="grid gap-3">
                    {members.map((membership) => (
                        <li
                            key={membership.id}
                            className="flex min-w-0 flex-wrap justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm wrap-anywhere"
                        >
                            <strong>
                                {membership.user?.name ?? 'Anggota tim'}
                            </strong>
                            <span className="text-muted-foreground">
                                {membership.role?.title ?? 'Peran umum'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </TeamSection>
    );
}
