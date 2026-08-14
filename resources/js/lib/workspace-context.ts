import {
    BriefcaseBusiness,
    Building2,
    GraduationCap,
    ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WorkspaceRole } from '@/types';

type WorkspaceContext = {
    accountLabel: string;
    mobileTitle: string;
    icon: LucideIcon;
};

export function getWorkspaceContext(role: WorkspaceRole): WorkspaceContext {
    const workspaces: Record<WorkspaceRole, WorkspaceContext> = {
        platform_admin: {
            accountLabel: 'Admin platform',
            mobileTitle: 'Ruang admin platform',
            icon: ShieldCheck,
        },
        campus_admin: {
            accountLabel: 'Admin kampus',
            mobileTitle: 'Operasi kampus',
            icon: Building2,
        },
        recruiter: {
            accountLabel: 'Perekrut',
            mobileTitle: 'Ruang perekrut',
            icon: BriefcaseBusiness,
        },
        student: {
            accountLabel: 'Mahasiswa',
            mobileTitle: 'Ruang kerja mahasiswa',
            icon: GraduationCap,
        },
    };

    return workspaces[role];
}
