import { Building2 } from 'lucide-react';
import { WorkspaceContextCard } from '@/components/workspace-context-card';

export function CampusWorkspaceContext({
    institutionName,
}: {
    institutionName: string;
}) {
    return (
        <WorkspaceContextCard
            label="Universitas"
            name={institutionName}
            icon={Building2}
            logoSrc="/images/university-uty.webp"
        />
    );
}
