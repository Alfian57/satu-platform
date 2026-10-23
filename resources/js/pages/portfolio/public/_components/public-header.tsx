import { Link } from '@inertiajs/react';
import AppLogo from '@/layouts/_components/app-logo';
import { home } from '@/routes';

export function PublicHeader() {
    return (
        <header className="border-b border-border bg-card/90">
            <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
                <Link
                    href={home()}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    data-test="public-portfolio-brand"
                >
                    <AppLogo
                        compact
                        className="text-primary"
                        logoClassName="size-10 rounded-none shadow-none"
                    />
                    <span className="hidden text-sm text-muted-foreground sm:inline">
                        Buku Besar Kolaborasi
                    </span>
                </Link>
                <p className="text-xs font-medium text-muted-foreground">
                    Portofolio publik
                </p>
            </div>
        </header>
    );
}
