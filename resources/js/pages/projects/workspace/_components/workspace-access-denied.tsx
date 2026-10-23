import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { AppPage } from '@/layouts/_components/app-page';
import { index as projectsIndex } from '@/routes/projects';

export function WorkspaceAccessDenied() {
    return (
        <AppPage>
            <Head title="Ruang kerja" />
            <section
                className="rounded-3xl border border-border bg-card p-6"
                data-test="workspace-access-denied"
            >
                <h1 className="text-title font-semibold">
                    Akses ruang kerja tidak tersedia
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Data privat sebelumnya disembunyikan. Periksa keanggotaan
                    dan konteks kampus melalui Proyek.
                </p>
                <Button asChild className="mt-4">
                    <Link href={projectsIndex({ query: { view: 'mine' } })}>
                        Kembali ke proyek saya
                    </Link>
                </Button>
            </section>
        </AppPage>
    );
}
