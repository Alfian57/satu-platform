import { Button } from '@/components/ui/button';
import type { DashboardAction } from '@/types/dashboard';

export function DashboardAccessDenied({
    onAction,
}: {
    onAction: (action: DashboardAction) => void;
}) {
    return (
        <section
            className="rounded-3xl border border-border bg-card p-6"
            data-test="dashboard-access-denied"
        >
            <h1 className="text-title font-semibold">Akses Beranda berubah</h1>
            <p className="mt-2 text-muted-foreground">
                Informasi sebelumnya tidak ditampilkan. Periksa afiliasi kampus
                sebelum melanjutkan.
            </p>
            <Button
                type="button"
                className="mt-4"
                onClick={() =>
                    onAction({
                        key: 'onboarding',
                        label: 'Periksa afiliasi',
                    })
                }
            >
                Periksa afiliasi
            </Button>
        </section>
    );
}
