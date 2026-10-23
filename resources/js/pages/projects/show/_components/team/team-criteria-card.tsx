import type { TeamJoinRequest } from '@/types/project';

type Props = {
    role?: TeamJoinRequest['role'];
};

export function TeamCriteriaCard({ role }: Props) {
    return (
        <div className="grid min-w-0 gap-1 rounded-xl border border-primary/15 bg-accent/60 p-3 text-sm leading-6 wrap-anywhere">
            <p className="font-semibold">{role?.title ?? 'Peran umum'}</p>
            <p className="text-muted-foreground">
                {role?.selection_criteria ??
                    'Kriteria belum dinyatakan. Gunakan kebutuhan proyek yang terbaca, bukan popularitas atau penilaian kepribadian.'}
            </p>
        </div>
    );
}
