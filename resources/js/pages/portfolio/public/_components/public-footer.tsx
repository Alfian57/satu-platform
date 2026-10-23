import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { home } from '@/routes';

export function PublicFooter() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-8">
                <p>SATU. Karya nyata, dibagikan dengan kendali pemilik.</p>
                <Link
                    href={home()}
                    className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-xl font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                    Pelajari SATU
                    <span aria-hidden="true">
                        {' '}
                        <ArrowRight className="inline size-3.5" />
                    </span>
                </Link>
            </div>
        </footer>
    );
}
