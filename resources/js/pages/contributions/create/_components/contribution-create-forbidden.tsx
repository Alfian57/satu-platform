import { Link } from '@inertiajs/react';
import { FolderOpen, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as projectsIndex } from '@/routes/projects';

export function ContributionCreateForbidden() {
    return (
        <section
            data-test="contribution-create-forbidden"
            className="grid min-w-0 gap-5 rounded-3xl border border-border bg-card px-5 py-12 text-center shadow-sm sm:px-8"
        >
            <ShieldAlert
                aria-hidden="true"
                className="mx-auto size-9 text-pending-subtle-foreground"
            />
            <div className="grid gap-2">
                <h2 className="text-title font-semibold">
                    Belum dapat menyusun kontribusi
                </h2>
                <p className="mx-auto max-w-[58ch] text-sm leading-6 text-muted-foreground">
                    Kontribusi hanya dapat dibuat dari proyek aktif yang berada
                    dalam afiliasi kampus dan bisa kamu akses.
                </p>
            </div>
            <Button
                asChild
                variant="outline"
                className="mx-auto cursor-pointer"
            >
                <Link href={projectsIndex()}>
                    <FolderOpen aria-hidden="true" />
                    Lihat proyek
                </Link>
            </Button>
        </section>
    );
}
