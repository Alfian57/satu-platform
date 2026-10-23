import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { index as projectsIndex } from '@/routes/projects';

export function ProjectShowNav({ isRefreshing }: { isRefreshing: boolean }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
                asChild
                variant="ghost"
                className="cursor-pointer px-0 hover:bg-transparent hover:underline"
            >
                <Link href={projectsIndex()}>Kembali ke daftar proyek</Link>
            </Button>
            {isRefreshing && (
                <p
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Spinner aria-hidden="true" />
                    Memuat data proyek terbaru...
                </p>
            )}
        </div>
    );
}
