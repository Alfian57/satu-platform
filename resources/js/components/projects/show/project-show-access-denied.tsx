import { Head, Link } from '@inertiajs/react';
import { AppPage } from '@/components/app-page';
import { Button } from '@/components/ui/button';
import { index as projectsIndex } from '@/routes/projects';

export function ProjectShowAccessDenied() {
    return (
        <AppPage>
            <Head title="Akses proyek tidak tersedia" />
            <section
                className="space-y-4 rounded-3xl border border-border bg-card p-6"
                data-test="project-access-denied"
            >
                <h1 className="text-2xl font-bold">
                    Akses proyek tidak tersedia
                </h1>
                <p>
                    Informasi proyek sebelumnya disembunyikan. Periksa afiliasi
                    atau buka peluang lain.
                </p>
                <Button asChild variant="outline">
                    <Link href={projectsIndex()}>Kembali ke peluang</Link>
                </Button>
            </section>
        </AppPage>
    );
}
