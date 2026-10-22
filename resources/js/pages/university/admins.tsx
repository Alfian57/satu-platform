import { Head, usePage } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { AdminAccounts } from '@/components/university/admin-accounts';
import type { UniversityAdminsProps } from '@/hooks/use-university-admins';

export default function UniversityAdmins(initial: UniversityAdminsProps) {
    const { auth } = usePage<{ auth: { user?: { id: number } } }>().props;

    return (
        <AppPage>
            <Head title="Akun Admin Universitas" />
            <AdminAccounts
                key={`${auth.user?.id}-${initial.institution.id}`}
                initial={initial}
            />
        </AppPage>
    );
}
