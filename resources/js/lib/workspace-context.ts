import { Building2, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WorkspaceRole } from '@/types';

type WorkspaceContext = {
    accountLabel: string;
    mobileTitle: string;
    icon: LucideIcon;
};

export function getWorkspaceContext(role: WorkspaceRole): WorkspaceContext {
    const workspaces: Record<WorkspaceRole, WorkspaceContext> = {
        campus_admin: {
            accountLabel: 'Admin Universitas',
            mobileTitle: 'Ruang pengelola',
            icon: Building2,
        },
        student: {
            accountLabel: 'Mahasiswa',
            mobileTitle: 'Ruang kerja mahasiswa',
            icon: GraduationCap,
        },
    };

    return workspaces[role] ?? workspaces.student;
}
