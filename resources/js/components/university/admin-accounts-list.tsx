import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Admin } from '@/hooks/use-university-admins';

export const adminStatusLabels: Record<string, string> = {
    verified: 'Aktif',
    suspended: 'Ditangguhkan',
    pending: 'Menunggu',
    unverified: 'Belum terverifikasi',
    issued: 'Menunggu penerimaan',
    accepted: 'Diterima',
    revoked: 'Dicabut',
    expired: 'Kedaluwarsa',
};

export interface AdminAccountsListProps {
    admins: Admin[];
    activeCount: number;
    busy: boolean;
    needsCheck: boolean;
    readProcessing: boolean;
    titleRef: React.RefObject<HTMLHeadingElement | null>;
    onStatusChange: (admin: Admin) => void;
}

export function AdminAccountsList({
    admins,
    activeCount,
    busy,
    needsCheck,
    readProcessing,
    titleRef,
    onStatusChange,
}: AdminAccountsListProps) {
    return (
        <section
            className="min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6"
            aria-busy={readProcessing}
            aria-labelledby="admin-list-title"
        >
            <h2
                id="admin-list-title"
                ref={titleRef}
                tabIndex={-1}
                className="text-xl font-bold"
            >
                Pengelola universitas
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
                {activeCount} admin aktif. Akun terakhir tetap dilindungi.
            </p>
            <div className="mt-3 divide-y divide-border">
                {admins.length ? (
                    admins.map((admin) => (
                        <article
                            key={admin.id}
                            className="flex flex-wrap items-center justify-between gap-4 py-4"
                        >
                            <div className="min-w-0 flex-1 basis-48">
                                <h3 className="font-semibold wrap-anywhere">
                                    {admin.name}
                                </h3>
                                <Badge
                                    className="mt-2"
                                    variant={
                                        admin.status === 'verified'
                                            ? 'verified'
                                            : 'correction'
                                    }
                                >
                                    {adminStatusLabels[admin.status] ??
                                        'Status belum tersedia'}
                                </Badge>
                            </div>
                            {['verified', 'suspended'].includes(
                                admin.status,
                            ) && (
                                <Button
                                    variant="outline"
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                    disabled={
                                        busy ||
                                        needsCheck ||
                                        (admin.status === 'verified' &&
                                            activeCount <= 1)
                                    }
                                    onClick={() => onStatusChange(admin)}
                                >
                                    {admin.status === 'verified'
                                        ? activeCount <= 1
                                            ? 'Admin aktif terakhir'
                                            : 'Tangguhkan akses'
                                        : 'Pulihkan akses'}
                                </Button>
                            )}
                        </article>
                    ))
                ) : (
                    <p className="py-4 text-muted-foreground">
                        Belum ada akun admin yang dapat dibaca.
                    </p>
                )}
            </div>
        </section>
    );
}
