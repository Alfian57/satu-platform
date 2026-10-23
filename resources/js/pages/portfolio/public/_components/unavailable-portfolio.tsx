import { Link } from '@inertiajs/react';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { home } from '@/routes';

export function UnavailablePortfolio() {
    return (
        <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-4xl min-w-0 items-center px-4 py-8 md:px-6 lg:px-8">
            <section
                role="status"
                aria-labelledby="public-portfolio-unavailable-title"
                className="grid w-full min-w-0 gap-6 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-10"
                data-test="public-portfolio-unavailable"
            >
                <p className="font-label text-label text-correction">
                    PORTOFOLIO PUBLIK / TIDAK TERSEDIA
                </p>
                <div className="flex items-start gap-4">
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-1 size-6 shrink-0 text-correction"
                    />
                    <div className="grid min-w-0 gap-3">
                        <h1
                            id="public-portfolio-unavailable-title"
                            className="max-w-[30ch] text-2xl leading-snug font-bold [overflow-wrap:anywhere] sm:text-3xl"
                        >
                            Portofolio ini tidak tersedia untuk dibaca.
                        </h1>
                        <p className="max-w-[62ch] text-body leading-7 text-muted-foreground">
                            Pemilik dapat menarik visibilitas kapan saja. Data
                            privat dan entri yang belum dipilih publik tidak
                            ditampilkan pada tautan ini.
                        </p>
                    </div>
                </div>
                <Link
                    href={home()}
                    className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
                >
                    Kembali ke SATU
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </section>
        </main>
    );
}
