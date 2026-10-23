import { Head } from '@inertiajs/react';
import InvitationCard from '@/pages/auth/invitation/_components/invitation-card';
import type { InvitationData } from '@/pages/auth/invitation/_components/invitation-card';

type Props = {
    invitation: InvitationData;
};

export default function Invitation({ invitation }: Props) {
    const isExpired = invitation.status === 'expired';

    return (
        <>
            <Head
                title={isExpired ? 'Undangan tidak tersedia' : 'Undangan SATU'}
            />

            <InvitationCard invitation={invitation} />
        </>
    );
}

Invitation.layout = {
    title: 'Undangan akses SATU',
    description: 'Periksa detail undangan sebelum melanjutkan.',
};
