import { Building2 } from 'lucide-react';
import { WorkspaceContextCard } from '@/layouts/_components/workspace-context-card';

export function CampusWorkspaceContext({
    institutionName,
}: {
    institutionName: string;
}) {
    return (
        <WorkspaceContextCard
            label="Lingkup Institusi"
            showLabel={true}
            name={institutionName}
            icon={Building2}
            logoSrc="/images/university-uty.webp"
        >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[0.6875rem] leading-tight font-medium text-emerald-700 shadow-none dark:border-emerald-500/30 dark:text-emerald-300">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Institusi Aktif
            </span>
        </WorkspaceContextCard>
    );
}
