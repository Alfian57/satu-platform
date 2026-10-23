import { PaginationControl } from '@/components/common/pagination-control';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PageData } from '@/pages/university/_components/university-settings-nav';
import { adminStatusLabels } from '@/pages/university/admins/_components/admin-accounts-list';
import type { Invitation } from '@/pages/university/admins/_hooks/use-university-admins';

export const adminDeliveryLabels: Record<string, string> = {
    queued: 'Menunggu antrean WhatsApp',
    pending: 'Menunggu antrean WhatsApp',
    sent: 'Terkirim ke provider, belum berarti diterima',
    delivered: 'Delivery dikonfirmasi provider',
    failed: 'Pengiriman gagal',
    cancelled: 'Pengiriman dibatalkan',
};

function formatAdminDate(value: string): string {
    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
        ? 'Waktu tidak tersedia'
        : new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(parsed);
}

export interface AdminInvitationsListProps {
    invitations: PageData<Invitation>;
    busy: boolean;
    needsCheck: boolean;
    readProcessing: boolean;
    onRevoke: (invitation: Invitation) => void;
    onPageChange: (page: number) => void;
}

export function AdminInvitationsList({
    invitations,
    busy,
    needsCheck,
    readProcessing,
    onRevoke,
    onPageChange,
}: AdminInvitationsListProps) {
    return (
        <section
            className="min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6"
            aria-busy={readProcessing}
            aria-labelledby="invitation-list-title"
        >
            <h2 id="invitation-list-title" className="text-xl font-bold">
                Riwayat undangan
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Status pengiriman terpisah dari penerimaan akses. Token dan
                nomor lengkap tidak ditampilkan.
            </p>
            <div className="my-4 divide-y divide-border">
                {invitations.data.length ? (
                    invitations.data.map((item) => (
                        <article
                            key={item.id}
                            className="flex flex-wrap justify-between gap-4 py-4"
                        >
                            <div className="min-w-0 flex-1 basis-48">
                                <h3 className="font-semibold wrap-anywhere">
                                    Undangan {item.id}. {item.phone_masked}
                                </h3>
                                <Badge
                                    className="mt-2"
                                    variant={
                                        item.status === 'accepted'
                                            ? 'verified'
                                            : 'pending'
                                    }
                                >
                                    {adminStatusLabels[item.status] ??
                                        'Status belum tersedia'}
                                </Badge>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {adminDeliveryLabels[
                                        item.delivery_status ?? ''
                                    ] ?? 'Status delivery belum tersedia'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Berlaku sampai{' '}
                                    {formatAdminDate(item.expires_at)}
                                </p>
                            </div>
                            {item.can_revoke && (
                                <Button
                                    variant="outline"
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                    disabled={busy || needsCheck}
                                    onClick={() => onRevoke(item)}
                                >
                                    Cabut undangan
                                </Button>
                            )}
                        </article>
                    ))
                ) : (
                    <p className="py-4 text-sm text-muted-foreground">
                        Belum ada undangan. Gunakan Undang admin untuk menambah
                        pengelola secara terkontrol.
                    </p>
                )}
            </div>
            <PaginationControl
                meta={invitations}
                disabled={busy}
                onPageChange={onPageChange}
                itemName="undangan"
            />
        </section>
    );
}
